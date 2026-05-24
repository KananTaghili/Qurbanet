'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BackHeader from '../../../components/BackHeader';
import api from '../../../lib/api';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 10 * 60 * 1000;

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

function EPointFrame({ url, accentColor, onSuccess, onFail, onClose }) {
  const [frameLoading, setFrameLoading] = useState(true);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type !== 'EPOINT_RESULT') return;
      if (e.data.status === 'success') onSuccess();
      else onFail();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSuccess, onFail]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#1B5E20' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💳</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Bank Kartı Ödənişi</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Təhlükəsiz ödəniş · epoint.az</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {frameLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${accentColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>EPoint yüklənir...</p>
          </div>
        )}
        <iframe
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={() => setFrameLoading(false)}
          title="Bank Kartı Ödənişi"
          allow="payment"
        />
      </div>

      <div style={{ padding: '10px 16px', background: '#fff', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🔒 SSL şifrələməsi ilə qorunur · epoint.az</p>
      </div>
    </div>
  );
}

export default function CharityPaymentPage() {
  const router = useRouter();
  const [payData, setPayData] = useState(null);
  const [method, setMethod] = useState('epoint');
  const [loading, setLoading] = useState(false);
  const [frameUrl, setFrameUrl] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const startTimeRef = useRef(null);
  const orderIdRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('charity_payment');
    if (!stored) { router.replace('/need-support'); return; }

    api.get('/app-config/settings')
      .then(res => {
        if (res.data?.data?.charityPageEnabled === false) {
          router.replace('/');
        } else {
          setPayData(JSON.parse(stored));
        }
      })
      .catch(() => setPayData(JSON.parse(stored)));

    return () => clearInterval(pollRef.current);
  }, []);

  if (!payData) return null;

  const { target, targetLabel, accentColor = '#1B5E20', totalAmount, items, summaryRows } = payData;

  const startPolling = (orderId) => {
    startTimeRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startTimeRef.current > POLL_TIMEOUT) {
        clearInterval(pollRef.current);
        setFrameUrl('');
        setError('Ödəniş statusu təsdiqlənmədi. Sifarişlərim bölməsini yoxlayın.');
        return;
      }
      try {
        const res = await api.post(`/charity-orders/${orderId}/epoint/verify`);
        const d = res.data?.data;
        const o = d?.order;
        if (o?.paymentStatus === 'paid') {
          clearInterval(pollRef.current);
          setFrameUrl('');
          sessionStorage.setItem('charity_confirmation', JSON.stringify({
            target, targetLabel, accentColor, totalAmount, summaryRows,
            orderNumber: o.orderNumber || o._id?.slice(-6).toUpperCase(),
            orderId: o._id,
          }));
          sessionStorage.removeItem('charity_payment');
          router.push('/charity/confirmation');
        } else if (d?.epointStatus === 'error' || d?.epointStatus === 'returned') {
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
      // 1. Create charity order (pending)
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
      orderIdRef.current = orderId;

      // 2. Start payment (EPoint card or Google Pay widget)
      const endpoint = method === 'googlepay' ? 'widget' : 'start';
      const startRes = await api.post(`/charity-orders/${orderId}/epoint/${endpoint}`);
      if (!startRes.data.success) throw new Error(startRes.data.message);

      const frameTarget = method === 'googlepay'
        ? startRes.data.data.widget_url
        : startRes.data.data.redirect_url;
      setFrameUrl(frameTarget);
      startPolling(orderId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ödəniş uğursuz oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFrameSuccess = () => {
    clearInterval(pollRef.current);
    setFrameUrl('');
    const orderId = orderIdRef.current;
    sessionStorage.setItem('charity_confirmation', JSON.stringify({
      target, targetLabel, accentColor, totalAmount, summaryRows,
      orderId,
    }));
    sessionStorage.removeItem('charity_payment');
    router.push('/charity/confirmation');
  };

  const handleFrameFail = async () => {
    clearInterval(pollRef.current);
    setFrameUrl('');
    const orderId = orderIdRef.current;
    if (!orderId) { setError('Ödəniş uğursuz oldu. Yenidən cəhd edin.'); return; }
    try {
      const res = await api.post(`/charity-orders/${orderId}/epoint/verify`);
      const msg = res.data?.data?.userMessage;
      setError(msg || 'Ödəniş uğursuz oldu. Yenidən cəhd edin.');
    } catch (_) {
      setError('Ödəniş uğursuz oldu. Yenidən cəhd edin.');
    }
  };

  const handleFrameClose = () => {
    clearInterval(pollRef.current);
    setFrameUrl('');
  };

  if (frameUrl) {
    return (
      <EPointFrame
        url={frameUrl}
        accentColor={accentColor}
        onSuccess={handleFrameSuccess}
        onFail={handleFrameFail}
        onClose={handleFrameClose}
      />
    );
  }

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
                <button
                  onClick={() => setMethod('epoint')}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${method === 'epoint' ? accentColor : 'var(--border)'}`, background: method === 'epoint' ? accentColor + '10' : 'var(--bg)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 24 }}>💳</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Bank Kartı ilə ödə</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Visa / Mastercard · Təhlükəsiz</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${method === 'epoint' ? accentColor : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {method === 'epoint' && <div style={{ width: 10, height: 10, borderRadius: 5, background: accentColor }} />}
                  </div>
                </button>
                {/* Google Pay — temporarily disabled */}
              </div>
            </C>

            <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '12px 14px', border: '1px solid #BFDBFE', fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
              🔒 {method === 'googlepay'
                ? 'Google Pay pəncərəsi açılacaq. EPoint vasitəsilə sürətli ödəniş tamamlanacaq.'
                : 'Ödəniş bu səhifənin içərisindəki bank kartı ödəniş pəncərəsində tamamlanacaq. Tamamladıqdan sonra avtomatik yönləndiriləcəksiniz.'}
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
              {loading ? <Spinner /> : method === 'googlepay' ? `${totalAmount} AZN · Google Pay` : `${totalAmount} AZN · Bank Kartı ilə ödə`}
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
          {loading ? <Spinner /> : method === 'googlepay' ? `${totalAmount} AZN · Google Pay` : `${totalAmount} AZN · Bank Kartı ilə ödə`}
        </button>
      </div>
    </div>
  );
}
