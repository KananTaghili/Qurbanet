'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, MapPin, ExternalLink, CheckCircle, Info } from 'lucide-react';
import { useOrder } from '../../../context/OrderContext';
import api from '../../../lib/api';

export default function CashPaymentPage() {
  const router = useRouter();
  const { order, clearOrder } = useOrder();
  const [cashLocation, setCashLocation] = useState('20 Yanvar metro, Bakı');

  useEffect(() => {
    const saved = sessionStorage.getItem('qurbanet_order');
    const savedOrder = saved ? JSON.parse(saved) : null;
    if (!savedOrder?.createdOrderId) { router.replace('/'); return; }
    api.get('/app-config/settings').then((res) => {
      const loc = res.data.data?.settings?.cashPaymentLocation;
      if (loc) setCashLocation(loc);
    }).catch(() => {});
  }, []);

  if (!order?.createdOrderId) return null;

  const { createdOrder, grandTotal = 0, totalPrice = 0 } = order;
  const amount = grandTotal || totalPrice;
  const cashCode = createdOrder?.cashPickupCode || createdOrder?.orderNumber || createdOrder?._id?.slice(-6).toUpperCase() || 'N/A';

  const handleGoOrders = () => { clearOrder(); router.push('/my-orders'); };
  const handleGoHome   = () => { clearOrder(); router.push('/'); };
  const openMaps       = () => window.open(`https://maps.google.com/?q=${encodeURIComponent(cashLocation)}`, '_blank');

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <div className="flex-1 overflow-y-auto pb-28 md:pb-10">
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full md:grid md:grid-cols-[1fr_320px] md:gap-8 md:items-start">

          {/* ── LEFT: Icon + Code + Location ──────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Success header */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-full bg-primary-surface border-2 border-primary/20 flex items-center justify-center">
                <Banknote size={38} className="text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-extrabold text-text-primary">Sifarişiniz qəbul edildi!</h1>
                <p className="text-sm text-text-secondary mt-1">Aşağıdakı kodu ödəniş yerinə aparın</p>
              </div>
            </div>

            {/* Cash code card */}
            <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-alt/40">
                <p className="text-xs font-extrabold text-text-secondary uppercase tracking-widest text-center">Nağd ödəniş kodu</p>
              </div>
              <div className="px-6 py-6 text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-[0.15em] font-mono">{cashCode}</p>
                <p className="text-xs text-text-secondary mt-3">Bu kodu mağazada göstərin</p>
              </div>
            </div>

            {/* Location card */}
            <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-alt/40 flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <p className="text-xs font-extrabold text-text-secondary uppercase tracking-wide">Ödəniş yeri</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm font-semibold text-text-primary">{cashLocation}</p>
                <button
                  onClick={openMaps}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-primary rounded-xl text-primary font-bold text-sm hover:bg-primary-surface transition-colors cursor-pointer"
                >
                  <ExternalLink size={14} />
                  Xəritədə aç
                </button>
              </div>
            </div>

            {/* Info note */}
            <div className="bg-primary-surface border border-primary/15 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary font-medium leading-relaxed">
                Ödəniş təsdiqləndikdən sonra sifarişinizin statusu yenilənəcək.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Amount + Actions ────────────────────────────────── */}
          <div className="mt-4 md:mt-0 flex flex-col gap-4">

            {/* Amount card */}
            <div className="bg-primary rounded-2xl px-6 py-6 text-center shadow-card">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle size={16} className="text-white/80" />
                <p className="text-xs font-bold text-white/80 uppercase tracking-wide">Ödəniləcək məbləğ</p>
              </div>
              <p className="text-4xl font-extrabold text-white">{amount} AZN</p>
            </div>

            {/* Actions — desktop only */}
            <div className="hidden md:flex flex-col gap-3">
              <button className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm" onClick={handleGoOrders}>
                Sifarişlərimi gör
              </button>
              <button
                onClick={handleGoHome}
                className="w-full py-3.5 border-2 border-primary text-primary font-bold text-sm rounded-xl bg-transparent hover:bg-primary-surface transition-colors cursor-pointer"
              >
                Ana Səhifə
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-bg border-t border-border safe-area-bottom flex flex-col gap-2.5">
        <button className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm" onClick={handleGoOrders}>
          Sifarişlərimi gör
        </button>
        <button
          onClick={handleGoHome}
          className="w-full py-3.5 border-2 border-primary text-primary font-bold text-sm rounded-xl bg-transparent cursor-pointer"
        >
          Ana Səhifə
        </button>
      </div>
    </div>
  );
}
