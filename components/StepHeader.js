'use client';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

export default function StepHeader({ currentStep }) {
  const { lang } = useLanguage();
  const STEPS = [t(lang, 'step1'), t(lang, 'step2'), t(lang, 'step3')];
  return (
    <div className="mobile-step-header" style={{
      borderBottom: '1px solid var(--border)',
      padding: '12px 16px',
      flexShrink: 0,
    }}>
      <div className="flex items-center">
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
  );
}
