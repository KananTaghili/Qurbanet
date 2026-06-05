'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Banknote, Lock, Smartphone } from 'lucide-react';
import BackHeader from '../../../components/BackHeader';
import StepHeader from '../../../components/StepHeader';
import { useOrder } from '../../../context/OrderContext';
import { useLanguage } from '../../../context/LanguageContext';
import { t } from '../../../lib/i18n';
import api from '../../../lib/api';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT  = 10 * 60 * 1000;

function Spinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {label}
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

function EPointFrame({ url, onClose, lang }) {
  const [frameLoading, setFrameLoading] = useState(true);
  const iframeRef = useRef(null);
  const loadCountRef = useRef(0);

  const handleLoad = () => {
    loadCountRef.current += 1;
    if (loadCountRef.current === 1) {
      setFrameLoading(false);
    }
    // Subsequent loads are legit payment redirects (3DS etc.) — do not interfere
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/60">
      <div className="flex items-center justify-between px-4 py-3.5" style={{ background: '#1B5E20' }}>
        <div className="flex items-center gap-2.5">
          <CreditCard size={18} className="text-white/80" />
          <div>
            <div className="text-sm font-bold text-white">{t(lang, 'cardPaymentTitle')}</div>
            <div className="text-xs text-white/65">{t(lang, 'securePayment')}</div>
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
            <p className="text-sm text-text-secondary font-medium">{t(lang, 'ePointLoading')}</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
          className="w-full h-full border-0"
          onLoad={handleLoad}
          title={t(lang, 'cardPaymentTitle')}
          allow="payment"
        />
      </div>
      <div className="px-4 py-2 bg-white border-t border-border text-center">
        <p className="text-xs text-text-secondary flex items-center justify-center gap-1.5">
          <Lock size={11} /> {t(lang, 'sslProtected')}
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { order, updateOrder, isLoaded } = useOrder();
  const { lang } = useLanguage();

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
    if (cutExtra > 0) rows.push({ label: t(lang, 'cutExtra'), value: cutExtra });
    const partsExtra = Number(((createdOrder.qurbanParts?.headFee || 0) + (createdOrder.qurbanParts?.feetFee || 0)).toFixed(2));
    if (partsExtra > 0) rows.push({ label: t(lang, 'headFeetExtra'), value: partsExtra });
    const delFee = Number(createdOrder.deliveryFee || 0);
    rows.push(delFee > 0 ? { label: t(lang, 'deliveryRow'), value: delFee } : { label: t(lang, 'deliveryRow'), free: true });
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
        setError(t(lang, 'pollFailed'));
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
          setError(d.userMessage || t(lang, 'paymentDeclined'));
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
      setError(err.response?.data?.message || t(lang, 'paymentFailed'));
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
    return <EPointFrame url={frameUrl} onClose={handleFrameClose} lang={lang} />;
  }

  const PayButton = (
    <button
      className={`btn-primary w-full py-4 rounded-xl font-bold text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handlePay}
      disabled={loading}
    >
      {loading
        ? <Spinner label={t(lang, 'processing')} />
        : method === 'epoint'
          ? `${amount} AZN · ${t(lang, 'payWithCard')}`
          : method === 'googlepay'
            ? `${amount} AZN · ${t(lang, 'payWithGPay')}`
            : t(lang, 'confirmSelection')}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title={t(lang, 'payment')} />
      <StepHeader currentStep={3} />

      <div className="flex-1 overflow-y-auto pb-28 lg:pb-6 pt-[124px] lg:pt-0">
        <div className="p-4 lg:p-6 max-w-5xl mx-auto w-full lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">

          {/* ── LEFT: Məbləğ + Qiymət tərkibi ──────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Amount card */}
            <div className="bg-primary rounded-2xl px-6 py-8 text-white text-center">
              <div className="text-sm font-semibold opacity-80 mb-2">{t(lang, 'amountToPay')}</div>
              <div className="text-5xl font-extrabold tracking-tight">{amount} AZN</div>
            </div>

            {/* Price breakdown */}
            {breakdownRows.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
                <div className="px-4 py-3 border-b border-border text-xs font-bold text-text-secondary tracking-wide uppercase bg-surface-alt/40">
                  {t(lang, 'priceBreakdown')}
                </div>
                <div className="divide-y divide-border/60">
                  {breakdownRows.map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-text-secondary flex-1 mr-3">{row.label}</span>
                      {row.free
                        ? <span className="text-sm font-bold text-emerald-600">{t(lang, 'free')}</span>
                        : <span className="text-sm font-bold text-text-primary">{row.value?.toFixed(2)} AZN</span>
                      }
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3.5 bg-primary-surface/20">
                    <span className="text-sm font-bold text-text-primary">{t(lang, 'totalRow')}</span>
                    <span className="text-lg font-extrabold text-primary">{amount} AZN</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Ödəniş üsulu + Düymə ────────────────────────────── */}
          <div className="mt-4 lg:mt-0 flex flex-col gap-4">
            {/* Payment methods */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
              <div className="px-4 py-3 border-b border-border text-xs font-bold text-text-secondary tracking-wide uppercase bg-surface-alt/40">
                {t(lang, 'paymentMethodCard')}
              </div>
              <div className="p-3 flex flex-col gap-2">
                <PayMethodOption
                  selected={method === 'epoint'}
                  onClick={() => setMethod('epoint')}
                  Icon={CreditCard}
                  label={t(lang, 'payWithCard')}
                  sub={t(lang, 'payWithCardSub')}
                />
                {/* Google Pay — temporarily disabled */}
                {cashEnabled && (
                  <PayMethodOption
                    selected={method === 'cash'}
                    onClick={() => setMethod('cash')}
                    Icon={Banknote}
                    label={t(lang, 'payOnSite')}
                    sub={t(lang, 'payOnSiteSub')}
                  />
                )}
              </div>
            </div>

            {/* Info box */}
            {(method === 'epoint' || method === 'googlepay') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <Lock size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  {method === 'googlepay' ? t(lang, 'gpayInfo') : t(lang, 'epointInfo')}
                </p>
              </div>
            )}
            {method === 'cash' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <Banknote size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  {t(lang, 'cashInfo')}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Desktop pay button (inside right column) */}
            <div className="hidden lg:block">
              {PayButton}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom button */}
      <div className="fixed-action-bar lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-bg border-t border-border safe-area-bottom">
        {PayButton}
      </div>
    </div>
  );
}
