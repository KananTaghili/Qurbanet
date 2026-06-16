'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BackHeader from '../../../components/BackHeader';
import StatusBadge from '../../../components/StatusBadge';
import api from '../../../lib/api';
import { useSocket } from '../../../hooks/useSocket';

const AZ_MONTHS = ['Yan','Fev','Mar','Apr','May','İyun','İyul','Avq','Sen','Okt','Noy','Dek'];
function fmtDate(ds) { if (!ds) return '-'; const d = new Date(ds); return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

const CHARITY_ICONS = { usaqlar_evi: '🏠', qocalar_evi: '🏡', ehtiyac_sahibleri: '🤝' };
const CHARITY_LABELS = { usaqlar_evi: 'Uşaqlar evi', qocalar_evi: 'Qocalar evi', ehtiyac_sahibleri: 'Ehtiyac sahibləri' };
const CHARITY_COLORS = { usaqlar_evi: '#1B5E20', qocalar_evi: '#8E24AA', ehtiyac_sahibleri: '#1565C0' };

const C = ({ children, style }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style }}>{children}</div>
);

export default function CharityOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchOrder(); }, [id]);

  useSocket({
    "charity_order:updated": (data) => { if (data?.orderId === id) fetchOrder(); },
  });

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/charity-orders/${id}`);
      setOrder(res.data.data?.order);
    } catch { router.replace('/my-orders'); } finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
  if (!order) return null;

  const accentColor = CHARITY_COLORS[order.charityTarget] || '#1B5E20';
  const icon = CHARITY_ICONS[order.charityTarget] || '🤲';
  const label = CHARITY_LABELS[order.charityTarget] || 'Xeyriyyə';

  const detailRows = [
    { label: 'Sifariş №', value: `#${order.orderNumber || id.slice(-6).toUpperCase()}` },
    { label: 'Xeyriyyə istiqaməti', value: label },
    { label: 'Ödəniş üsulu', value: order.paymentMethod === 'card' ? 'Bank kartı' : 'Nağd' },
    { label: 'Ödəniş statusu', value: 'Ödənildi' },
    { label: 'Tarix', value: fmtDate(order.createdAt) },
  ];

  return (
    <div className="flex flex-col flex-1">
      <BackHeader title={`Sifariş #${order.orderNumber || id.slice(-6).toUpperCase()}`} />

      <div className="flex-1 page-scroll">
        {/* Hero */}
        <div style={{ background: accentColor, padding: '20px 20px 32px', textAlign: 'center', color: '#fff', borderRadius: '0 0 24px 24px', marginBottom: 0 }} className="md:rounded-2xl md:mb-5">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 10px' }}>{icon}</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{order.totalAmount} AZN</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>{fmtDate(order.createdAt)}</div>
        </div>

        <div className="p-4 md:p-0 flex flex-col gap-4 md:grid md:grid-cols-[1fr_340px] md:items-start" style={{ marginTop: 12 }}>

          {/* Left — status + animals + video */}
          <div className="flex flex-col gap-4">
            {/* Status */}
            <C style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Status</div>
                <StatusBadge status={order.status || 'placed'} />
              </div>
            </C>

            {/* Animals */}
            {order.animals?.length > 0 && (
              <C>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: accentColor, background: accentColor + '12' }}>
                  Seçilmiş heyvanlar
                </div>
                {order.animals.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.animal?.nameAz || 'Heyvan'}{a.weightLabel ? ` (${a.weightLabel})` : ''} x{a.quantity}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{a.pricePerUnit * a.quantity} AZN</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px' }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Cəmi</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: accentColor }}>{order.totalAmount} AZN</span>
                </div>
              </C>
            )}

            {/* Video */}
            {order.videoUrl ? (
              <C style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>📹 Kəsim videosu</div>
                <a href={order.videoUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', width: '100%', background: 'var(--primary-surface)',
                  borderRadius: 14, padding: '12px', textAlign: 'center',
                  color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}>
                  Videoyu izlə →
                </a>
              </C>
            ) : (
              <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '14px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📹 Video tezliklə əlavə olunacaq</div>
              </div>
            )}
          </div>

          {/* Right — order details */}
          <C>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: accentColor, background: accentColor + '12' }}>
              Sifariş məlumatları
            </div>
            {detailRows.map((row, i) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 16px', borderBottom: i < detailRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '55%' }}>{row.value}</span>
              </div>
            ))}
          </C>
        </div>
      </div>
    </div>
  );
}
