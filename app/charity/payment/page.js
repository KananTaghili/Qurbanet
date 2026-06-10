'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackHeader from '../../../components/BackHeader';
import api from '../../../lib/api';

const C = ({ children, style }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style }}>{children}</div>
);
const CHead = ({ label, accent }) => (
  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: accent || 'var(--text-secondary)', background: accent ? accent + '12' : 'transparent' }}>{label}</div>
);

function Spinner() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      İşlənir...
    </span>
  );
}

export default function CharityPaymentPage() {
  const router = useRouter();
  const [payData, setPayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('charity_payment');
    if (!stored) { router.replace('/need-support'); return; }

    // Epoint-dən uğursuz ödənişlə geri qayıdanda backend bura yönləndirir:
    // /charity/payment?payment=fail&message=...
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'fail') {
      setError(params.get('message') || 'Ödəniş uğursuz oldu. Yenidən cəhd edin.');
      window.history.replaceState(null, '', '/charity/payment');
    }

    api.get('/app-config/settings')
      .then(res => {
        if (res.data?.data?.charityPageEnabled === false) {
          router.replace('/');
        } else {
          setPayData(JSON.parse(stored));
        }
      })
      .catch(() => setPayData(JSON.parse(stored)));
  }, []);

  if (!payData) return null;

  const { target, targetLabel, accentColor = '#1B5E20', totalAmount, items, summaryRows } = payData;

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Xeyriyyə sifarişini yarat (pending)
      const createRes = await api.post('/charity-orders', {
        label: targetLabel,
        charityType: target,
        summaryRows,
        totalAmount,
        paymentMethod: 'epoint',
        ...(items && {
          animals: items.map((i) => ({
            animalId: i.animal._id,
            quantity: i.qty,
            weightLabel: i.weight?.label,
            pricePerUnit: i.price,
          })),
        }),
      });

      const createdOrder = createRes.data?.data;
      const orderId = createdOrder?._id;
      if (!orderId) throw new Error('Sifariş yaradıla bilmədi.');

      // 2. Confirmation səhifəsinin məlumatını redirect-dən ƏVVƏL yaz —
      // uğurlu ödənişdə backend birbaşa /charity/confirmation-a yönləndirir.
      sessionStorage.setItem('charity_confirmation', JSON.stringify({
        target, targetLabel, accentColor, totalAmount, summaryRows,
        orderNumber: createdOrder.orderNumber || orderId.slice(-6).toUpperCase(),
        orderId,
      }));

      // 3. Epoint ödəniş səhifəsinə tam yönləndirmə
      const startRes = await api.post(`/charity-orders/${orderId}/epoint/start`);
      if (!startRes.data.success) throw new Error(startRes.data.message);

      window.location.href = startRes.data.data.redirect_url;
      return; // spinner yönləndirmə bitənə qədər qalsın
    } catch (err) {
      sessionStorage.removeItem('charity_confirmation');
      setError(err.response?.data?.message || err.message || 'Ödəniş uğursuz oldu.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <BackHeader title="Xeyriyyə ödənişi" />

      <div className="flex-1 page-scroll">
        <div className="p-4 md:p-0 md:grid md:grid-cols-[1fr_380px] md:gap-6 md:items-start">

          {/* Left — payment info */}
          <div className="flex flex-col gap-4">
            <C>
              <CHead label="Ödəniş üsulu" />
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${accentColor}`, background: accentColor + '10', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 24 }}>💳</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Bank Kartı ilə ödə</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Visa / Mastercard · Təhlükəsiz</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: accentColor }} />
                  </div>
                </div>
              </div>
            </C>

            <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '12px 14px', border: '1px solid #BFDBFE', fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
              🔒 Təhlükəsiz EPoint ödəniş səhifəsinə yönləndiriləcəksiniz. Ödənişi tamamladıqdan sonra avtomatik geri qayıdacaqsınız.
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', fontSize: 13, fontWeight: 600, padding: '12px 14px', borderRadius: 12 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Right — amount + summary */}
          <div className="mt-4 md:mt-0 flex flex-col gap-4">
            <div style={{ borderRadius: 20, padding: '24px', textAlign: 'center', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', background: accentColor }}>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>{targetLabel} üçün</div>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{totalAmount} AZN</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>💳 EPoint · Visa / Mastercard</div>
            </div>

            <C>
              <CHead label="Sifariş xülasəsi" accent={accentColor} />
              {(summaryRows || []).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>Cəmi</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: accentColor }}>{totalAmount} AZN</span>
              </div>
            </C>

            <button
              className="btn-primary desktop-only"
              onClick={handlePay}
              disabled={loading}
              style={{ background: accentColor }}
            >
              {loading ? <Spinner /> : `${totalAmount} AZN · Bank Kartı ilə ödə`}
            </button>
          </div>
        </div>
      </div>

      <div className="mobile-action-bar mobile-only">
        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', fontSize: 13, fontWeight: 600, padding: '12px 14px', borderRadius: 12, marginBottom: 10 }}>
            ⚠️ {error}
          </div>
        )}
        <button
          className="btn-primary"
          onClick={handlePay}
          disabled={loading}
          style={{ background: accentColor }}
        >
          {loading ? <Spinner /> : `${totalAmount} AZN · Bank Kartı ilə ödə`}
        </button>
      </div>
    </div>
  );
}
