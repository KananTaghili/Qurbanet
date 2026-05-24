'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, CheckCircle2, User, Beef, Scissors,
  Flower2, XCircle, ChevronDown, ChevronUp, HandHeart,
} from 'lucide-react';
import BackHeader from '../../components/BackHeader';
import BottomNav from '../../components/BottomNav';

const SECTIONS = [
  {
    Icon: BookOpen,
    title: 'Məqsədinə görə qurban növləri',
    accent: '#1B5E20',
    light: '#E8F5E9',
    items: [
      'Vacib qurban — Qurban bayramı münasibətilə kəsilən qurban',
      'Nəzr qurbanı — Allah yolunda nəzir edilmiş qurban',
      'Əqiqə qurbanı — Uşağın doğulması münasibətilə kəsilən qurban',
      'Kəffarə qurbanı — Günahları yumaq üçün kəsilən qurban',
      'Şükr qurbanı — Nemətə şükür olaraq kəsilən qurban',
      'Xeyir-dua qurbanı — Müxtəlif xeyirxah mərasimlər üçün kəsilən qurban',
    ],
  },
  {
    Icon: CheckCircle2,
    title: 'Qurbanlığın Şərtləri',
    accent: '#2E7D32',
    light: '#F1F8E9',
    items: [
      'Heyvan sağlam olmalı, görünür qüsurdan azad olmalıdır',
      'Heyvan müəyyən yaşa çatmış olmalıdır (qoyun 1, inək 2, dəvə 5 yaş)',
      'Heyvanın bədəninin əksər hissəsi salamat olmalıdır',
      'Kəsim Qurban bayramının müəyyən vaxtında edilməlidir',
      'Qurban sahibi müsəlman olmalıdır',
    ],
  },
  {
    Icon: User,
    title: 'Kimlər qurban kəsməlidir?',
    accent: '#1565C0',
    light: '#E3F2FD',
    items: [
      'Ağlı başında olan, azad, müsəlman hər bir yetkin şəxs',
      'Nisab miqdarı var-dövlətə malik olan şəxslər',
      'Müsafir olmayan (daimi yaşayış yerindəki) şəxslər',
    ],
  },
  {
    Icon: Beef,
    title: 'Qurbanlıq ət necə bölünür?',
    accent: '#E65100',
    light: '#FBE9E7',
    items: [
      '1/3 hissəsi özü üçün saxlanılmalıdır',
      '1/3 hissəsi qohum-əqrabaya paylanmalıdır',
      '1/3 hissəsi kasıb-yoxsullara paylanmalıdır',
    ],
  },
  {
    Icon: Scissors,
    title: 'Heyvan kəsməyin şərtləri',
    accent: '#6A1B9A',
    light: '#F3E5F5',
    items: [
      'Kəsən şəxs müsəlman olmalıdır',
      'Bıçaq kəskin olmalıdır',
      'Bismillah deyilməlidir',
      'Kəsim dörd damarı kəsməklə olmalıdır',
      'Heyvan qibləyə tərəf döndərilməlidir',
      'Heyvan əziyyət çəkməməlidir',
      'Kəsim günü müəyyən edilmiş vaxtda edilməlidir',
    ],
  },
  {
    Icon: Flower2,
    title: 'Heyvan kəsməyin ədəbləri',
    accent: '#00897B',
    light: '#E0F2F1',
    items: [
      'Heyvanı yemləndirmək',
      'Bıçağı heyvanın gözündən gizlətmək',
      'Heyvanı naziklik ilə uzatmaq',
      'Salavat gətirmək',
      'Dua oxumaq',
      'Heyvanı sürüdən ayrı aparmaq',
      'Əməliyyatdan sonra şükür etmək',
    ],
  },
  {
    Icon: XCircle,
    title: 'Çəkinilməli əməllər',
    accent: '#B71C1C',
    light: '#FFEBEE',
    items: [
      'Qurban kəsmədən dırnaq və saçları kəsməmək',
      'Heyvanı digər heyvanların yanında kəsməmək',
      'Kəsimə düzgün hazırlaşmamaq',
      'Qurban əti satmaq',
    ],
  },
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
  const [openIndex, setOpenIndex] = useState(0);

  const handleToggle = (i) => setOpenIndex(prev => prev === i ? null : i);

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title="Qurbanın Əhkamları" onBack={() => router.push('/')} />

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
              <h1 className="text-lg font-extrabold text-white leading-tight">Qurbanın Əhkamları</h1>
              <p className="text-sm text-white/70 mt-1 leading-snug max-w-sm">
                İslam dininə görə qurban kəsmənin qaydaları, şərtləri və ədəbləri.
              </p>
            </div>
          </div>
        </div>

        {/* Accordion — desktop: two independent flex columns, mobile: single column */}
        <div className="hidden md:flex gap-3">
          <div className="flex flex-col gap-3 flex-1">
            {SECTIONS.filter((_, i) => i % 2 === 0).map((section, idx) => {
              const realIdx = idx * 2;
              return (
                <Accordion
                  key={section.title}
                  section={section}
                  open={openIndex === realIdx}
                  onToggle={() => handleToggle(realIdx)}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {SECTIONS.filter((_, i) => i % 2 !== 0).map((section, idx) => {
              const realIdx = idx * 2 + 1;
              return (
                <Accordion
                  key={section.title}
                  section={section}
                  open={openIndex === realIdx}
                  onToggle={() => handleToggle(realIdx)}
                />
              );
            })}
          </div>
        </div>
        <div className="md:hidden flex flex-col gap-3">
          {SECTIONS.map((section, i) => (
            <Accordion
              key={section.title}
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
            "Qurbanlarınız Allah qatında qəbul olsun. Allah sizdən razı olsun."
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
