'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

const BACK_ROUTES = {
  "/order/quantity":     "/qurban",
  "/order/distribution": "/order/quantity",
  "/order/contact":      "/order/distribution",
  "/order/summary":      "/order/distribution",
  "/order/payment":      "/order/summary",
};

export default function StepHeader({ currentStep }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const backTo = BACK_ROUTES[pathname] || "/qurban";
  const STEPS = [t(lang, 'step1'), t(lang, 'step2'), t(lang, 'step3')];

  return (
    <div className="mobile-step-header" style={{
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {/* Back button row */}
      <div style={{ padding: '8px 16px 0' }}>
        <button
          onClick={() => router.push(backTo)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
          style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={13} strokeWidth={2.2} />
          Geri qayıt
        </button>
      </div>

      {/* Steps — centered, constrained width */}
      <div style={{ padding: '10px 16px 12px' }}>
        <div className="flex items-center" style={{ maxWidth: 380, margin: '0 auto' }}>
          {STEPS.map((label, i) => {
            const idx = i + 1;
            const done = idx < currentStep;
            const active = idx === currentStep;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    background: done ? 'var(--primary)' : active ? 'var(--primary)' : 'var(--surface-alt)',
                    color: (done || active) ? '#fff' : 'var(--text-muted)',
                    boxShadow: active ? '0 0 0 3px rgba(27,94,32,0.15)' : 'none',
                    transition: 'all 0.2s',
                    border: (done || active) ? 'none' : '1.5px solid var(--border)'
                  }}>
                    {done ? '✓' : idx}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: '1.2',
                    color: active ? 'var(--primary)' : done ? 'var(--primary-light)' : 'var(--text-muted)'
                  }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 8px', marginBottom: 16,
                    background: done ? 'var(--primary)' : 'var(--border)',
                    borderRadius: 1, transition: 'background 0.2s'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
