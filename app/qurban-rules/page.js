'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, CheckCircle2, User, Beef, Sword,
  Flower2, XCircle, ChevronDown, ChevronUp, HandHeart,
} from 'lucide-react';
import BackHeader from '../../components/BackHeader';
import BottomNav from '../../components/BottomNav';
import { useLanguage } from '../../context/LanguageContext';
import { t, QURBAN_SECTIONS_TEXT } from '../../lib/i18n';

const SECTION_META = [
  { Icon: BookOpen,    accent: '#1B5E20', light: '#E8F5E9' },
  { Icon: CheckCircle2, accent: '#2E7D32', light: '#F1F8E9' },
  { Icon: User,        accent: '#1565C0', light: '#E3F2FD' },
  { Icon: Beef,        accent: '#E65100', light: '#FBE9E7' },
  { Icon: Sword,       accent: '#6A1B9A', light: '#F3E5F5' },
  { Icon: Flower2,     accent: '#00897B', light: '#E0F2F1' },
  { Icon: XCircle,     accent: '#B71C1C', light: '#FFEBEE' },
];

function Accordion({ section, open, onToggle }) {
  const { Icon, title, accent, light, items } = section;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-surface-alt/40 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: light }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <span className="flex-1 text-sm font-bold text-text-primary">{title}</span>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-alt">
          {open
            ? <ChevronUp  className="w-3.5 h-3.5 text-text-secondary" />
            : <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border/60">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0 mt-0.5"
                style={{ background: accent }}
              >
                {i + 1}
              </span>
              <p className="text-xs text-text-secondary leading-relaxed flex-1">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QurbanRulesPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);

  const textSections = QURBAN_SECTIONS_TEXT[lang] || QURBAN_SECTIONS_TEXT.az;
  const sections = textSections.map((s, i) => ({
    ...s,
    ...(SECTION_META[i] || SECTION_META[0]),
  }));

  const handleToggle = (i) => setOpenIndex(prev => prev === i ? null : i);

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title={t(lang, 'qurbanRulesTitle')} onBack={() => router.push('/')} />

      <div className="flex-1 page-scroll">

        {/* Hero */}
        <div
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
          <div className="relative flex items-center gap-4 px-5 py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight">{t(lang, 'qurbanRulesTitle')}</h1>
              <p className="text-sm text-white/70 mt-1 leading-snug max-w-sm">
                {t(lang, 'qurbanRulesDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Accordion — desktop: two independent flex columns, mobile: single column */}
        <div className="hidden md:flex gap-3">
          <div className="flex flex-col gap-3 flex-1">
            {sections.filter((_, i) => i % 2 === 0).map((section, idx) => {
              const realIdx = idx * 2;
              return (
                <Accordion
                  key={realIdx}
                  section={section}
                  open={openIndex === realIdx}
                  onToggle={() => handleToggle(realIdx)}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {sections.filter((_, i) => i % 2 !== 0).map((section, idx) => {
              const realIdx = idx * 2 + 1;
              return (
                <Accordion
                  key={realIdx}
                  section={section}
                  open={openIndex === realIdx}
                  onToggle={() => handleToggle(realIdx)}
                />
              );
            })}
          </div>
        </div>
        <div className="md:hidden flex flex-col gap-3">
          {sections.map((section, i) => (
            <Accordion
              key={i}
              section={section}
              open={openIndex === i}
              onToggle={() => handleToggle(i)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-surface flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HandHeart className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-primary font-semibold leading-snug">
            {t(lang, 'qurbanFooterText')}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
