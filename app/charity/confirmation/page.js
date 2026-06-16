'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CHARITY_ICONS = { usaqlar_evi: '🏠', qocalar_evi: '🏡', ehtiyac_sahibleri: '🤝' };

const C = ({ children, style }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style }}>{children}</div>
);

export default function CharityConfirmationPage() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('charity_confirmation');
    if (!stored) { router.replace('/need-support'); return; }
    setData(JSON.parse(stored));
    sessionStorage.removeItem('charity_confirmation');
    sessionStorage.removeItem('charity_payment');
  }, []);

  if (!data) return null;

  const { target, targetLabel, accentColor = '#1B5E20', totalAmount, summaryRows, orderNumber } = data;
  const icon = CHARITY_ICONS[target] || '🤲';

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 page-scroll">
        {/* Hero banner */}
        <div style={{ background: accentColor, padding: '24px 20px 32px', textAlign: 'center', color: '#fff', borderRadius: '0 0 24px 24px' }} className="md:rounded-2xl md:mb-5">
          <div className="scale-in" style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 12px' }}>
            {icon}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Ödəniş uğurlu oldu!</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>{targetLabel} üçün qurban qəbul edildi</div>
        </div>

        <div className="p-4 md:p-0 flex flex-col gap-4 md:grid md:grid-cols-[1fr_360px] md:items-start" style={{ marginTop: 12 }}>

          {/* Left */}
          <div className="flex flex-col gap-4">
            {/* Order number */}
            <C className="fade-in" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sifariş nömrəsi</div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.1em', color: accentColor }}>#{orderNumber}</div>
            </C>

            {/* Info cards */}
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '📹', title: 'Kəsim videosu', desc: 'Tezliklə Sifarişlərim bölməsindən izləyə biləcəksiniz.' },
                { icon: '🤲', title: `${targetLabel} üçün`, desc: 'Sizin töhfəniz həqiqi ehtiyac sahiblərinə çatdırılacaq.' },
              ].map((info) => (
                <C key={info.icon} style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{info.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{info.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{info.desc}</div>
                  </div>
                </C>
              ))}
            </div>

            {/* Dua */}
            <div className="fade-in" style={{ background: accentColor + '12', borderRadius: 16, border: `1px solid ${accentColor}28`, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🤲</div>
              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: '1.7', color: accentColor }}>
                "Sədəqəniz Allah qatında qəbul olsun. Allah sizdən razı olsun."
              </p>
            </div>
          </div>

          {/* Right — summary + desktop actions */}
          <div className="flex flex-col gap-4">
            {summaryRows?.length > 0 && (
              <C className="fade-in">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: accentColor, background: accentColor + '12' }}>Sifariş xülasəsi</div>
                {summaryRows.map((row, i) => (
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
            )}

            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-primary" style={{ background: accentColor }} onClick={() => router.push('/my-orders')}>
                Sifarişimi izlə
              </button>
              <button onClick={() => router.push('/')} style={{
                width: '100%', padding: '14px', fontWeight: 700, fontSize: 14,
                border: `2px solid ${accentColor}`, borderRadius: 16,
                background: 'transparent', cursor: 'pointer', color: accentColor,
              }}>
                Ana səhifəyə qayıt
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-action-bar mobile-only">
        <button className="btn-primary" style={{ background: accentColor }} onClick={() => router.push('/my-orders')}>
          Sifarişimi izlə
        </button>
        <button onClick={() => router.push('/')} style={{
          width: '100%', padding: '14px', fontWeight: 700, fontSize: 14,
          border: `2px solid ${accentColor}`, borderRadius: 16,
          background: 'transparent', cursor: 'pointer', color: accentColor, marginTop: 10,
        }}>
          Ana səhifəyə qayıt
        </button>
      </div>
    </div>
  );
}
