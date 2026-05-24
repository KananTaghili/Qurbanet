'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '../../../context/OrderContext';

export default function ConfirmationPage() {
  const router = useRouter();
  const { order, clearOrder } = useOrder();

  useEffect(() => {
    const saved = sessionStorage.getItem('qurbanet_order');
    const savedOrder = saved ? JSON.parse(saved) : null;
    if (!savedOrder?.createdOrderId) router.replace('/');
  }, []);

  if (!order?.createdOrderId) return null;

  const { createdOrder } = order;
  const orderNumber = createdOrder?.orderNumber || createdOrder?._id?.slice(-6).toUpperCase() || '------';

  const handleGoOrders = () => { clearOrder(); router.push('/my-orders'); };
  const handleGoHome   = () => { clearOrder(); router.push('/'); };

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
            <div className="text-2xl font-extrabold text-text-primary mb-1">Ödəniş uğurlu oldu!</div>
            <div className="text-sm text-text-secondary">Qurbanınız qəbul edildi</div>
          </div>

          {/* Order number */}
          <div className="bg-surface rounded-2xl border border-border shadow-card p-5 text-center animate-fade-up">
            <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Sifariş nömrəsi</div>
            <div className="text-4xl font-extrabold text-primary tracking-widest">#{orderNumber}</div>
          </div>

          {/* Info cards */}
          <div className="flex flex-col gap-2.5 animate-fade-up">
            {[
              { icon: '⏱️', title: '48 saat sonra kəsiləcək',  desc: 'Kəsim günü haqqında bildiriş göndəriləcək.' },
              { icon: '📹', title: 'Kəsim videosu',             desc: 'Sifarişlərim bölməsindən izləyə bilərsiniz.' },
              { icon: '🤲', title: 'Ət paylanması',             desc: 'Seçdiyiniz üsula görə ət paylanacaq.' },
            ].map((info) => (
              <div key={info.icon} className="bg-surface rounded-2xl border border-border shadow-card px-4 py-3.5 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{info.icon}</span>
                <div>
                  <div className="text-[13px] font-bold text-text-primary mb-0.5">{info.title}</div>
                  <div className="text-xs text-text-secondary">{info.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Dua */}
          <div className="bg-primary-surface rounded-2xl border border-primary/15 px-4 py-4 text-center animate-fade-up">
            <div className="text-2xl mb-2">🤲</div>
            <p className="text-[13px] font-semibold text-primary leading-relaxed">
              "Qurbanlarınız Allah qatında qəbul olsun. Allah sizdən razı olsun."
            </p>
          </div>

          {/* Desktop actions */}
          <div className="desktop-only flex flex-col gap-2.5 animate-fade-up">
            <button className="btn-primary" onClick={handleGoOrders}>Sifarişimi izlə</button>
            <button
              onClick={handleGoHome}
              className="w-full py-3.5 text-primary font-bold text-sm border-2 border-primary rounded-2xl bg-transparent cursor-pointer"
            >Ana səhifəyə qayıt</button>
          </div>
        </div>
      </div>

      <div className="mobile-action-bar mobile-only">
        <button className="btn-primary" onClick={handleGoOrders}>Sifarişimi izlə</button>
        <button
          onClick={handleGoHome}
          className="w-full py-3.5 text-primary font-bold text-sm border-2 border-primary rounded-2xl bg-transparent cursor-pointer mt-2.5"
        >Ana səhifəyə qayıt</button>
      </div>
    </div>
  );
}
