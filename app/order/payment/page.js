'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Banknote, Lock, Smartphone } from 'lucide-react';
import BackHeader from '../../../components/BackHeader';
import StepHeader from '../../../components/StepHeader';
import { useOrder } from '../../../context/OrderContext';
import api from '../../../lib/api';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT  = 10 * 60 * 1000;

function Spinner() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      İşlənir...
    </span>
  );
}

function PayMethodOption({ selected, onClick, Icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left w-full cursor-pointer transition-all ${
        selected ? 'border-primary bg-primary-surface' : 'border-border bg-bg hover:border-primary/30'
      }`}
    >
      <Icon size={22} className={selected ? 'text-primary' : 'text-text-secondary'} />
      <div className="flex-1">
        <div className="text-sm font-bold text-text-primary">{label}</div>
        {sub && <div className="text-xs text-text-secondary mt-0.5">{sub}</div>}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary' : 'border-border'}`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
    </button>
  );
}

function GooglePayIcon() {
  return (
    <svg viewBox="0 0 48 24" width="52" height="26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text y="18" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="700" fill="#4285F4">G</text>
      <text x="10" y="18" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="400" fill="#EA4335">o</text>
      <text x="18" y="18" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="400" fill="#FBBC05">o</text>
      <text x="26" y="18" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="400" fill="#4285F4">g</text>
      <text x="34" y="18" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="400" fill="#34A853">l</text>
      <text x="38" y="18" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="400" fill="#EA4335">e</text>
    </svg>
  );
}

function EPointFrame({ url, onClose }) {
  const [frameLoading, setFrameLoading] = useState(true);
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/60">
      <div className="flex items-center justify-between px-4 py-3.5" style={{ background: '#1B5E20' }}>
        <div className="flex items-center gap-2.5">
          <CreditCard size={18} className="text-white/80" />
          <div>
            <div className="text-sm font-bold text-white">Bank Kartı Ödənişi</div>
            <div className="text-xs text-white/65">Təhlükəsiz ödəniş · epoint.az</div>
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl font-bold text-sm transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
          ✕
        </button>
      </div>
      <div className="flex-1 relative bg-white">
        {frameLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-secondary font-medium">EPoint yüklənir...</p>
          </div>
        )}
        <iframe src={url} className="w-full h-full border-0" onLoad={() => setFrameLoading(false)} title="Bank Kartı Ödənişi" allow="payment" />
      </div>
      <div className="px-4 py-2 bg-white border-t border-border text-center">
        <p className="text-xs text-text-secondary flex items-center justify-center gap-1.5">
          <Lock size={11} /> SSL şifrələməsi ilə qorunur · epoint.az
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { order, updateOrder, isLoaded } = useOrder();

  const [method,      setMethod]      = useState('epoint');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [frameUrl,    setFrameUrl]    = useState('');
  const [error,       setError]       = useState('');

  const pollRef      = useRef(null);
  const startTimeRef = useRef(null);
  const paidRef      = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('qurbanet_order');
      const savedOrder = saved ? JSON.parse(saved) : null;
      const flowActive = sessionStorage.getItem('qurbanet_flow');
      if (!savedOrder?.createdOrderId || !flowActive) {
        router.replace('/');
        return;
      }
    } catch { router.replace('/'); return; }
    api.get('/app-config/settings')
      .then((res) => {
        if (res.data?.data?.cashPaymentEnabled === false) {
          setCashEnabled(false);
          setMethod('epoint');
        }
      })
      .catch(() => {});
    return () => clearInterval(pollRef.current);
  }, []);

  if (!isLoaded || !order?.createdOrderId) return null;

  const { createdOrderId, createdOrder, grandTotal = 0, totalPrice = 0 } = order;
  const amount = Number(createdOrder?.totalPrice || grandTotal || totalPrice);

  const breakdownRows = (() => {
    if (!createdOrder) return [];
    const rows = [];
    const basePrice = Number(createdOrder.pricePerUnit || 0);
    const qty = createdOrder.orderMode === 'serikli'
      ? Number(createdOrder.sharedPortion || 1)
      : Number(createdOrder.quantity || 1);
    rows.push({ label: `${createdOrder.animalNameAz} (${qty} ədəd × ${basePrice} AZN)`, value: Number((basePrice * qty).toFixed(2)) });
    const cutExtra = Number(createdOrder.cutStyle?.extraFee || 0);
    if (cutExtra > 0) rows.push({ label: 'Doğranma', value: cutExtra });
    const partsExtra = Number(((createdOrder.qurbanParts?.headFee || 0) + (createdOrder.qurbanParts?.feetFee || 0)).toFixed(2));
    if (partsExtra > 0) rows.push({ label: 'Baş/Ayaq emalı', value: partsExtra });
    const delFee = Number(createdOrder.deliveryFee || 0);
    rows.push(delFee > 0 ? { label: 'Çatdırılma', value: delFee } : { label: 'Çatdırılma', free: true });
    return rows;
  })();

  const startPolling = (orderId) => {
    paidRef.current = false;
    startTimeRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (paidRef.current) { clearInterval(pollRef.current); return; }
      if (Date.now() - startTimeRef.current > POLL_TIMEOUT) {
        clearInterval(pollRef.current);
        setFrameUrl('');
        setError('Ödəniş statusu təsdiqlənmədi. Sifarişlərim bölməsini yoxlayın.');
        return;
      }
      try {
        const res = await api.post(`/orders/${orderId}/epoint/verify`);
        const d = res.data?.data;
        if (d?.order?.payment?.status === 'paid' && !paidRef.current) {
          paidRef.current = true;
          clearInterval(pollRef.current);
          setFrameUrl('');
          updateOrder({ paymentMethod: method });
          router.push('/order/confirmation');
        } else if (d?.epointStatus === 'error' || d?.epointStatus === 'returned') {
          paidRef.current = true;
          clearInterval(pollRef.current);
          setFrameUrl('');
          setError(d.userMessage || 'Ödəniş rədd edildi. Yenidən cəhd edin.');
        }
      } catch (_) {}
    }, POLL_INTERVAL);
  };

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      if (method === 'epoint') {
        const res = await api.post(`/orders/${createdOrderId}/epoint/start`);
        if (res.data.success) {
          setFrameUrl(res.data.data.redirect_url);
          startPolling(createdOrderId);
        }
      } else if (method === 'googlepay') {
        const res = await api.post(`/orders/${createdOrderId}/epoint/widget`);
        if (res.data.success) {
          setFrameUrl(res.data.data.widget_url);
          startPolling(createdOrderId);
        }
      } else {
        const res = await api.post(`/orders/${createdOrderId}/pay`, { paymentMethod: 'cash_on_delivery' });
        if (res.data.success) {
          updateOrder({ paymentMethod: 'cash_on_delivery' });
          router.push('/order/cash-payment');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ödəniş uğursuz oldu. Yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleFrameClose = async () => {
    clearInterval(pollRef.current);
    setFrameUrl('');
    if (paidRef.current) return;
    try {
      const res = await api.post(`/orders/${createdOrderId}/epoint/verify`);
      const o = res.data?.data?.order;
      if (o?.payment?.status === 'paid') {
        paidRef.current = true;
        updateOrder({ paymentMethod: method });
        router.push('/order/confirmation');
      }
    } catch (_) {}
  };

  if (frameUrl) {
    return <EPointFrame url={frameUrl} onClose={handleFrameClose} />;
  }

  const PayButton = (
    <button
      className={`btn-primary w-full py-4 rounded-xl font-bold text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handlePay}
      disabled={loading}
    >
      {loading ? <Spinner /> : method === 'epoint' ? `${amount} AZN · Bank Kartı ilə ödə` : method === 'googlepay' ? `${amount} AZN · Google Pay` : 'Seçimi təsdiqlə'}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title="Ödəniş" />
      <StepHeader currentStep={3} />

      <div className="flex-1 overflow-y-auto pb-28 md:pb-6 pt-[124px] md:pt-0">
        <div className="p-4 md:p-6 max-w-5xl mx-auto w-full md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start">

          {/* ── LEFT: Məbləğ + Qiymət tərkibi ──────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Amount card */}
            <div className="bg-primary rounded-2xl px-6 py-8 text-white text-center">
              <div className="text-sm font-semibold opacity-80 mb-2">Ödənilməli məbləğ</div>
              <div className="text-5xl font-extrabold tracking-tight">{amount} AZN</div>
            </div>

            {/* Price breakdown */}
            {breakdownRows.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
                <div className="px-4 py-3 border-b border-border text-xs font-bold text-text-secondary tracking-wide uppercase bg-surface-alt/40">
                  Qiymət tərkibi
                </div>
                <div className="divide-y divide-border/60">
                  {breakdownRows.map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-text-secondary flex-1 mr-3">{row.label}</span>
                      {row.free
                        ? <span className="text-sm font-bold text-emerald-600">Pulsuz</span>
                        : <span className="text-sm font-bold text-text-primary">{row.value?.toFixed(2)} AZN</span>
                      }
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3.5 bg-primary-surface/20">
                    <span className="text-sm font-bold text-text-primary">Cəmi</span>
                    <span className="text-lg font-extrabold text-primary">{amount} AZN</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Ödəniş üsulu + Düymə ────────────────────────────── */}
          <div className="mt-4 md:mt-0 flex flex-col gap-4">
            {/* Payment methods */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
              <div className="px-4 py-3 border-b border-border text-xs font-bold text-text-secondary tracking-wide uppercase bg-surface-alt/40">
                Ödəniş üsulu
              </div>
              <div className="p-3 flex flex-col gap-2">
                <PayMethodOption
                  selected={method === 'epoint'}
                  onClick={() => setMethod('epoint')}
                  Icon={CreditCard}
                  label="Bank Kartı ilə ödə"
                  sub="Visa / Mastercard · EPoint · Təhlükəsiz"
                />
                {/* Google Pay — temporarily disabled */}
                {cashEnabled && (
                  <PayMethodOption
                    selected={method === 'cash'}
                    onClick={() => setMethod('cash')}
                    Icon={Banknote}
                    label="Yerində ödəniş"
                    sub="Kəsim ödənişdən sonra olacaq"
                  />
                )}
              </div>
            </div>

            {/* Info box */}
            {(method === 'epoint' || method === 'googlepay') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <Lock size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  {method === 'googlepay'
                    ? 'Google Pay pəncərəsi açılacaq. EPoint vasitəsilə sürətli ödəniş tamamlanacaq.'
                    : 'Ödəniş tətbiqin içərisindəki təhlükəsiz ödəniş səhifəsində tamamlanacaq.'}
                </p>
              </div>
            )}
            {method === 'cash' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <Banknote size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Sifarişiniz qəbul ediləcək, ödəniş kəsim günündə yerində həyata keçiriləcək.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Desktop pay button (inside right column) */}
            <div className="hidden md:block">
              {PayButton}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-bg border-t border-border safe-area-bottom">
        {PayButton}
      </div>
    </div>
  );
}
