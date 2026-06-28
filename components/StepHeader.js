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
      {/* Steps + back button row — flex, parallel */}
      <div style={{ padding: '8px 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push(backTo)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all hover:opacity-85 active:scale-95 shrink-0"
          style={{ background: '#1c5e20', color: '#fff', border: 'none', marginBottom: 5 }}
        >
          <ArrowLeft size={12} strokeWidth={2.5} />
          Geri Qayıt
        </button>
        {/* Steps — flex-1, centered within remaining space */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
        <div className="flex items-center" style={{ width: '100%', maxWidth: 600 }}>
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
                    flex: 1, height: 2, margin: '0 100px', marginBottom: 16,
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
    </div>
  );
}
