"use client";
import { useState } from "react";
import {
  BookOpen, CheckCircle2, Users, Beef, PocketKnife,
  Flower2, ShieldAlert, ChevronDown, HandHeart,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { t, QURBAN_SECTIONS_TEXT } from "../../lib/i18n";

const SECTION_META = [
  { Icon: BookOpen,     accent: "#1B5E20", bg: "#E8F5E9" },
  { Icon: CheckCircle2, accent: "#1565C0", bg: "#E3F2FD" },
  { Icon: Users,        accent: "#6A1B9A", bg: "#F3E5F5" },
  { Icon: Beef,         accent: "#E65100", bg: "#FBE9E7" },
  { Icon: PocketKnife,  accent: "#00695C", bg: "#E0F2F1" },
  { Icon: Flower2,      accent: "#2E7D32", bg: "#F1F8E9" },
  { Icon: ShieldAlert,  accent: "#B71C1C", bg: "#FFEBEE" },
];

function Section({ section, open, onToggle }) {
  const { Icon, title, accent, bg, items } = section;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        <span className="flex-1 text-[13px] font-bold text-gray-800 leading-snug">{title}</span>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200"
          style={{ background: open ? accent : "#F3F4F6", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDown size={13} color={open ? "#fff" : "#6B7280"} strokeWidth={2.5} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-gray-50 last:border-b-0">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 mt-0.5"
                style={{ background: accent }}
              >
                {i + 1}
              </span>
              <p className="text-[12px] text-gray-600 leading-relaxed flex-1">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QurbanRulesPage() {
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);

  const rawSections = QURBAN_SECTIONS_TEXT[lang] || QURBAN_SECTIONS_TEXT.az;
  const sections = rawSections.map((s, i) => ({ ...s, ...(SECTION_META[i] || SECTION_META[0]) }));

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="flex flex-col min-h-full px-4 md:px-6 py-4 md:py-5 gap-4">

      {/* Hero */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 70%, #388E3C 100%)" }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
          <BookOpen size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-[16px] font-extrabold text-white leading-tight">{t(lang, "qurbanRulesTitle")}</h1>
          <p className="text-[12px] text-white/70 mt-0.5 leading-snug max-w-md">{t(lang, "qurbanRulesDesc")}</p>
        </div>
      </div>

      {/* Sections — 2 col desktop, 1 col mobile */}
      <div className="hidden md:grid grid-cols-2 gap-3 items-start">
        <div className="flex flex-col gap-3">
          {sections.filter((_, i) => i % 2 === 0).map((s, idx) => {
            const ri = idx * 2;
            return <Section key={ri} section={s} open={openIndex === ri} onToggle={() => toggle(ri)} />;
          })}
        </div>
        <div className="flex flex-col gap-3">
          {sections.filter((_, i) => i % 2 !== 0).map((s, idx) => {
            const ri = idx * 2 + 1;
            return <Section key={ri} section={s} open={openIndex === ri} onToggle={() => toggle(ri)} />;
          })}
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {sections.map((s, i) => (
          <Section key={i} section={s} open={openIndex === i} onToggle={() => toggle(i)} />
        ))}
      </div>

      {/* Footer quote */}
      <div className="rounded-2xl border border-green-100 bg-green-50 flex items-start gap-3 px-4 py-3.5 mt-auto">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
          <HandHeart size={16} className="text-green-700" />
        </div>
        <p className="text-[12px] text-green-800 font-semibold leading-relaxed italic">{t(lang, "qurbanFooterText")}</p>
      </div>

    </div>
  );
}
