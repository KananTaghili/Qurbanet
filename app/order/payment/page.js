'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Banknote, Lock } from 'lucide-react';
import BackHeader from '../../../components/BackHeader';
import { useMobileMenu } from '../../../context/MobileMenuContext';
import StepHeader from '../../../components/StepHeader';
import { useOrder } from '../../../context/OrderContext';
import { useLanguage } from '../../../context/LanguageContext';
import { t } from '../../../lib/i18n';
import api from '../../../lib/api';

function Spinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {label}
    </span>
  );
}

const CardShell = ({ children, className = '' }) => (
  <div className={`bg-surface rounded-2xl border border-border overflow-hidden shadow-card ${className}`}>
    {children}
  </div>
);

const CardHead = ({ label }) => (
  <div className="px-4 py-2 border-b border-border text-[10px] font-bold text-text-secondary tracking-wide uppercase bg-surface-alt/40">
    {label}
  </div>
);

function PayMethodOption({ selected, onClick, Icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left w-full cursor-pointer transition-all ${
        selected ? 'border-primary bg-primary-surface' : 'border-border bg-bg hover:border-primary/30'
      }`}
    >
      <Icon size={18} className={selected ? 'text-primary' : 'text-text-secondary'} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-text-primary">{label}</div>
        {sub && <div className="text-[11px] text-text-secondary mt-0.5">{sub}</div>}
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary' : 'border-border'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
    </button>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { openMenu } = useMobileMenu();
  const { order, updateOrder, isLoaded } = useOrder();
  const { lang } = useLanguage();

  const [method,      setMethod]      = useState('epoint');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('qurbanet_order');
      const savedOrder = saved ? JSON.parse(saved) : null;
      const flowActive = sessionStorage.getItem('qurbanet_flow');
      if (!savedOrder?.createdOrderId || !flowActive) { router.replace('/'); return; }
    } catch { router.replace('/'); return; }

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'fail') {
      setError(params.get('message') || t(lang, 'paymentFailed'));
      window.history.replaceState(null, '', '/order/payment');
    }

    api.get('/app-config/settings')
      .then((res) => {
        if (res.data?.data?.cashPaymentEnabled === false) { setCashEnabled(false); setMethod('epoint'); }
      })
      .catch(() => {});
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

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      if (method === 'epoint') {
        const res = await api.post(`/orders/${createdOrderId}/epoint/start`);
        if (res.data.success) {
          updateOrder({ paymentMethod: 'epoint' });
          window.location.href = res.data.data.redirect_url;
          return;
        }
        setError(res.data.message || t(lang, 'paymentFailed'));
      } else {
        const res = await api.post(`/orders/${createdOrderId}/pay`, { paymentMethod: 'cash_on_delivery' });
        if (res.data.success) {
          updateOrder({ paymentMethod: 'cash_on_delivery' });
          router.push('/order/cash-payment');
          return;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t(lang, 'paymentFailed'));
    }
    setLoading(false);
  };

  const PayButton = (
    <button
      className={`btn-primary w-full py-3.5 rounded-xl font-bold text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handlePay}
      disabled={loading}
    >
      {loading
        ? <Spinner label={t(lang, 'processing')} />
        : method === 'epoint'
          ? `${amount} AZN · ${t(lang, 'payWithCard')}`
          : t(lang, 'confirmSelection')}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-bg overflow-hidden">
      <BackHeader title={t(lang, 'payment')} onMenu={openMenu} />
      <StepHeader currentStep={3} />

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden page-scroll">
        <div className="p-3 lg:p-4 lg:h-full lg:grid lg:grid-cols-[1fr_320px] lg:gap-4 lg:items-stretch max-w-5xl mx-auto w-full">

          {/* ── LEFT: Məbləğ + Qiymət tərkibi ── */}
          <div className="flex flex-col gap-3 lg:min-h-0">

            {/* Amount card */}
            <div className="bg-primary rounded-2xl px-6 py-5 text-white text-center flex-shrink-0">
              <div className="text-[11px] font-semibold opacity-75 mb-1.5 uppercase tracking-wider">
                {t(lang, 'amountToPay')}
              </div>
              <div className="text-4xl font-extrabold tracking-tight">{amount} AZN</div>
            </div>

            {/* Price breakdown */}
            {breakdownRows.length > 0 && (
              <CardShell className="lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
                <CardHead label={t(lang, 'priceBreakdown')} />
                <div className="lg:flex-1 lg:flex lg:flex-col lg:justify-around divide-y divide-border/60">
                  {breakdownRows.map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3.5 gap-3">
                      <span className="text-xs text-text-secondary flex-1">{row.label}</span>
                      {row.free
                        ? <span className="text-xs font-bold text-emerald-600 shrink-0">{t(lang, 'free')}</span>
                        : <span className="text-xs font-bold text-text-primary shrink-0">{row.value?.toFixed(2)} AZN</span>
                      }
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center px-4 py-3.5 bg-primary-surface/20 border-t border-primary/10">
                  <span className="text-xs font-black text-text-primary uppercase tracking-wider">{t(lang, 'totalRow')}</span>
                  <span className="text-xl font-extrabold text-primary">{amount} AZN</span>
                </div>
              </CardShell>
            )}
          </div>

          {/* ── RIGHT: Ödəniş üsulu + Düymə ── */}
          <div className="mt-3 lg:mt-0 flex flex-col gap-3 lg:min-h-0">

            {/* Payment methods */}
            <CardShell>
              <CardHead label={t(lang, 'paymentMethodCard')} />
              <div className="p-3 flex flex-col gap-2">
                <PayMethodOption
                  selected={method === 'epoint'}
                  onClick={() => setMethod('epoint')}
                  Icon={CreditCard}
                  label={t(lang, 'payWithCard')}
                  sub={t(lang, 'payWithCardSub')}
                />
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
            </CardShell>

            {/* Info box */}
            {method === 'epoint' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Lock size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700">{t(lang, 'epointInfo')}</p>
              </div>
            )}
            {method === 'cash' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Banknote size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">{t(lang, 'cashInfo')}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-3 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            {/* Desktop pay button — pinned to bottom */}
            <div className="hidden lg:block lg:mt-auto">
              {PayButton}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom button */}
      <div className="mobile-action-bar lg:hidden">
        {PayButton}
      </div>
    </div>
  );
}
