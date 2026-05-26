'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '../../../context/OrderContext';
import { useLanguage } from '../../../context/LanguageContext';
import { t } from '../../../lib/i18n';

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

  const infoCards = [
    { icon: '⏱️', titleKey: 'slaughter48h',    descKey: 'slaughter48hDesc' },
    { icon: '📹', titleKey: 'slaughterVideo',   descKey: 'slaughterVideoDesc' },
    { icon: '🤲', titleKey: 'meatDistConfirm',  descKey: 'meatDistConfirmDesc' },
  ];

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <div className="flex-1 page-scroll">
        <div className="max-w-[520px] mx-auto p-4 flex flex-col gap-4">

          {/* Success circle */}
          <div className="flex justify-center pt-4">
            <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-[0_8px_32px_rgba(27,94,32,0.35)] animate-scale-in">
              <span className="text-5xl text-white">✓</span>
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
            {infoCards.map((info) => (
              <div key={info.icon} className="bg-surface rounded-2xl border border-border shadow-card px-4 py-3.5 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{info.icon}</span>
                <div>
                  <div className="text-[13px] font-bold text-text-primary mb-0.5">{t(lang, info.titleKey)}</div>
                  <div className="text-xs text-text-secondary">{t(lang, info.descKey)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Dua */}
          <div className="bg-primary-surface rounded-2xl border border-primary/15 px-4 py-4 text-center animate-fade-up">
            <div className="text-2xl mb-2">🤲</div>
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
        <div className="flex gap-3 items-stretch">
          <button
            onClick={handleGoOrders}
            className="flex-1 bg-primary text-white font-bold text-sm rounded-2xl flex items-center justify-center text-center py-3.5 cursor-pointer active:scale-[.98] transition-all"
            style={{ boxShadow: "0 2px 8px rgba(27,94,32,.25)" }}
          >
            {t(lang, 'trackOrder')}
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 text-primary font-bold text-sm border-2 border-primary/30 rounded-2xl bg-primary-surface flex items-center justify-center text-center py-3.5 cursor-pointer active:scale-[.98] transition-all"
          >
            {t(lang, 'goHomeShort')}
          </button>
        </div>
      </div>
    </div>
  );
}
