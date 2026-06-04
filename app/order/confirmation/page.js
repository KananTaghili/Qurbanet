'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Video, Truck, Store, Home, Heart, HeartHandshake, Check } from 'lucide-react';
import { useOrder } from '../../../context/OrderContext';
import { useLanguage } from '../../../context/LanguageContext';
import { t } from '../../../lib/i18n';

const AZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

function fmtSlaughterDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const DIST_META = {
  catdirilsin:         { Icon: Truck,         color: '#1B5E20', bg: '#F0F7F2', label: 'Qurbanınız sizə çatdırılacaq' },
  ozum:                { Icon: Store,         color: '#374151', bg: '#F9FAFB', label: 'Qurbanınızı özünüz götürəcəksiniz' },
  ozun_gotur:          { Icon: Store,         color: '#374151', bg: '#F9FAFB', label: 'Qurbanınızı özünüz götürəcəksiniz' },
  usaqlar_evi:         { Icon: Home,          color: '#1B5E20', bg: '#E8F5E9', label: 'Qurbanınız uşaqlar evinə paylanacaq' },
  qocalar_evi:         { Icon: Heart,         color: '#6A1B9A', bg: '#F3E5F5', label: 'Qurbanınız qocalar evinə paylanacaq' },
  ehtiyac_sahibleri:   { Icon: HeartHandshake,color: '#1565C0', bg: '#E3F2FD', label: 'Qurbanınız ehtiyac sahiblərinə paylanacaq' },
};

export default function ConfirmationPage() {
  const router = useRouter();
  const { order, clearOrder } = useOrder();
  const { lang } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem('qurbanet_order');
    const savedOrder = saved ? JSON.parse(saved) : null;
    if (!savedOrder?.createdOrderId) { router.replace('/'); return; }
    sessionStorage.removeItem('qurbanet_flow');
    sessionStorage.removeItem('qurbanet_qty_state');
    localStorage.removeItem('selected_animal');
    localStorage.removeItem('delivery_windows');
  }, []);

  if (!order?.createdOrderId) return null;

  const { createdOrder } = order;
  const orderNumber = createdOrder?.orderNumber || createdOrder?._id?.slice(-6).toUpperCase() || '------';

  const handleGoOrders = () => { clearOrder(); router.push('/my-orders'); };
  const handleGoHome   = () => { clearOrder(); router.push('/'); };

  // Slaughter date
  const slaughterDateStr = fmtSlaughterDate(createdOrder?.slaughterDate);
  const slaughterTitle = slaughterDateStr ? `${slaughterDateStr} tarixdə kəsiləcək` : t(lang, 'slaughter48h');

  // Distribution
  const distType = createdOrder?.distribution?.type;
  const distMeta = DIST_META[distType];
  const DistIcon = distMeta?.Icon || Truck;
  const distBg    = distMeta?.bg    || '#F0F7F2';
  const distColor = distMeta?.color || '#1B5E20';
  const distLabel = distMeta?.label || 'Seçdiyiniz üsula görə paylanacaq';

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <div className="flex-1 page-scroll">
        <div className="max-w-[520px] mx-auto p-4 flex flex-col gap-4">

          {/* Success circle */}
          <div className="flex justify-center pt-4">
            <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-[0_8px_32px_rgba(27,94,32,0.35)] animate-scale-in">
              <Check size={52} color="white" strokeWidth={3} />
            </div>
          </div>

          <div className="text-center animate-fade-up">
            <div className="text-2xl font-extrabold text-text-primary mb-1">{t(lang, 'paymentSuccess')}</div>
            <div className="text-sm text-text-secondary">{t(lang, 'orderAccepted')}</div>
          </div>

          {/* Order number */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5 text-center animate-fade-up">
            <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">{t(lang, 'orderNumber')}</div>
            <div className="text-4xl font-extrabold text-primary tracking-widest">#{orderNumber}</div>
          </div>

          {/* Info cards */}
          <div className="flex flex-col gap-2.5 animate-fade-up">
            {/* Slaughter date card */}
            <div className="bg-surface rounded-2xl border border-border shadow-card px-4 py-3.5 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F0F7F2' }}>
                <Clock size={18} color="#1B5E20" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-text-primary mb-0.5">{slaughterTitle}</div>
                <div className="text-xs text-text-secondary">{t(lang, 'slaughter48hDesc')}</div>
              </div>
            </div>

            {/* Video card */}
            <div className="bg-surface rounded-2xl border border-border shadow-card px-4 py-3.5 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EEF4FF' }}>
                <Video size={18} color="#1565C0" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-text-primary mb-0.5">{t(lang, 'slaughterVideo')}</div>
                <div className="text-xs text-text-secondary">{t(lang, 'slaughterVideoDesc')}</div>
              </div>
            </div>

            {/* Distribution card — dynamic */}
            <div className="bg-surface rounded-2xl border border-border shadow-card px-4 py-3.5 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: distBg }}>
                <DistIcon size={18} color={distColor} strokeWidth={2} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-text-primary mb-0.5">Qurbanlığın çatdırılması</div>
                <div className="text-xs text-text-secondary">{distLabel}</div>
              </div>
            </div>
          </div>

          {/* Dua */}
          <div className="bg-primary-surface rounded-2xl border border-primary/15 px-4 py-4 text-center animate-fade-up">
            <p className="text-[13px] font-semibold text-primary leading-relaxed">
              {t(lang, 'dua')}
            </p>
          </div>

          {/* Desktop actions */}
          <div className="desktop-only flex flex-col gap-2.5 animate-fade-up">
            <button className="btn-primary" onClick={handleGoOrders}>{t(lang, 'trackOrder')}</button>
            <button
              onClick={handleGoHome}
              className="w-full py-3.5 text-primary font-bold text-sm border-2 border-primary rounded-2xl bg-transparent cursor-pointer"
            >{t(lang, 'goHome')}</button>
          </div>
        </div>
      </div>

      <div className="mobile-action-bar mobile-only">
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={handleGoOrders}
            className="w-full bg-primary text-white font-bold text-sm rounded-2xl flex items-center justify-center py-3.5 cursor-pointer active:scale-[.98] transition-all"
            style={{ boxShadow: "0 2px 8px rgba(27,94,32,.25)" }}
          >
            {t(lang, 'trackOrder')}
          </button>
          <button
            onClick={handleGoHome}
            className="w-full text-primary font-bold text-sm border-2 border-primary/30 rounded-2xl bg-primary-surface flex items-center justify-center py-3.5 cursor-pointer active:scale-[.98] transition-all"
          >
            {t(lang, 'goHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
