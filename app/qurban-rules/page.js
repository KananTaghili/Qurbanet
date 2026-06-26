"use client";
import { useState, useRef, useEffect } from "react";
import {
  BookOpen, CheckCircle2, Users, Beef,
  Star, ShieldAlert, HandHeart,
  ChevronDown,
} from "lucide-react";
import { PiKnifeBold } from "react-icons/pi";
import { useLanguage } from "../../context/LanguageContext";
import { t, QURBAN_SECTIONS_TEXT } from "../../lib/i18n";

// ── Section visual config ─────────────────────────────────────────────────────
const SECTION_META = [
  { Icon: BookOpen,     accent: "#166534", light: "#dcfce7", gFrom: "#14532d", gTo: "#166534" },
  { Icon: CheckCircle2, accent: "#1e40af", light: "#dbeafe", gFrom: "#1e3a8a", gTo: "#1d4ed8" },
  { Icon: Users,        accent: "#6b21a8", light: "#f3e8ff", gFrom: "#581c87", gTo: "#7e22ce" },
  { Icon: Beef,         accent: "#9a3412", light: "#fee2e2", gFrom: "#7c2d12", gTo: "#9a3412" },
  { Icon: PiKnifeBold,  accent: "#065f46", light: "#d1fae5", gFrom: "#064e3b", gTo: "#065f46" },
  { Icon: Star,         accent: "#92400e", light: "#fef3c7", gFrom: "#78350f", gTo: "#92400e" },
  { Icon: ShieldAlert,  accent: "#991b1b", light: "#fee2e2", gFrom: "#7f1d1d", gTo: "#b91c1c" },
];

// ── Fade-up on scroll ─────────────────────────────────────────────────────────
function useFadeUp(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("qr-visible"); obs.disconnect(); } },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Single accordion section ──────────────────────────────────────────────────
function Section({ section, idx, open, onToggle, id }) {
  const { Icon, accent, light, gFrom, gTo, title, items } = section;
  const ref = useFadeUp(idx * 60);
  const num = String(idx + 1).padStart(2, "0");

  return (
    <div
      id={id}
      ref={ref}
      className="qr-card overflow-hidden rounded-2xl border transition-all duration-200"
      style={{
        borderColor: open ? accent + "50" : "#e5e7eb",
        boxShadow: open ? `0 4px 24px ${accent}1a` : "0 1px 4px rgba(0,0,0,0.06)",
        background: "#fff",
      }}
    >
      {/* ── Trigger — doubles as coloured header when open ── */}
      <button
        onClick={onToggle}
        className="w-full relative overflow-hidden flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-300"
        style={{
          background: open
            ? `linear-gradient(135deg, ${gFrom} 0%, ${gTo} 100%)`
            : "transparent",
        }}
      >
        {/* Decorative big number — only when open */}
        {open && (
          <span
            className="absolute right-10 font-black select-none leading-none"
            style={{ fontSize: 68, color: "rgba(255,255,255,0.08)", bottom: -10, letterSpacing: -2 }}
          >
            {num}
          </span>
        )}

        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: open ? "rgba(255,255,255,0.18)" : light }}
        >
          <Icon size={16} color={open ? "#fff" : accent} />
        </div>

        {/* Number + title — title wraps, never truncates */}
        <div className="flex-1 min-w-0 flex items-start gap-2">
          <span
            className="text-[10px] font-black tabular-nums shrink-0 mt-0.5"
            style={{ color: open ? "rgba(255,255,255,0.55)" : accent + "80" }}
          >
            {num}
          </span>
          <span
            className="text-[13px] font-bold leading-snug"
            style={{ color: open ? "#fff" : "#1e293b" }}
          >
            {title}
          </span>
        </div>

        {/* Chevron */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            background: open ? "rgba(255,255,255,0.2)" : "#f1f5f9",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDown size={13} color={open ? "#fff" : "#94a3b8"} strokeWidth={2.5} />
        </div>
      </button>

      {/* ── Items list — no repeated header ── */}
      {open && (
        <ul className="flex flex-col" style={{ borderTop: `1px solid ${accent}20` }}>
          {items.map((item, pi) => (
            <li
              key={pi}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
              style={{ borderBottom: pi < items.length - 1 ? `1px solid ${accent}0d` : "none" }}
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                style={{ background: accent }}
              >
                {pi + 1}
              </span>
              <p className="text-[12.5px] text-slate-600 leading-relaxed flex-1">{item}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QurbanRulesPage() {
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);
  const heroRef = useFadeUp();

  const rawSections = QURBAN_SECTIONS_TEXT[lang] || QURBAN_SECTIONS_TEXT.az;
  const sections = rawSections.map((s, i) => ({ ...s, ...(SECTION_META[i] || SECTION_META[0]) }));

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  const scrollToSection = (i) => {
    const el = document.getElementById(`qr-section-${i}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    toggle(i);
  };

  return (
    <>
      <style>{`
        .qr-card, .qr-hero {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.45s cubic-bezier(.25,.8,.25,1),
                      transform 0.45s cubic-bezier(.25,.8,.25,1);
        }
        .qr-visible { opacity: 1 !important; transform: translateY(0) !important; }
        .qr-index::-webkit-scrollbar { display: none; }
        .qr-index { scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col gap-4 px-4 py-5 md:px-6 md:py-6">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div
          ref={heroRef}
          className="qr-hero relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)" }}
        >
          {/* Geometric decoration */}
          <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", border:"40px solid rgba(255,255,255,0.04)" }} />
          <div style={{ position:"absolute", bottom:-30, right:80, width:120, height:120, borderRadius:"50%", border:"24px solid rgba(255,255,255,0.04)" }} />
          <div style={{ position:"absolute", top:20, right:30, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

          <div className="relative z-10 flex items-start gap-4 px-5 py-5 md:px-7 md:py-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <BookOpen size={22} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.22em] text-white/45 uppercase mb-1">
                İslam Hüququ
              </p>
              <h1 className="text-[18px] md:text-xl font-black text-white leading-tight mb-1">
                {t(lang, "qurbanRulesTitle")}
              </h1>
              <p className="text-[12px] text-white/65 leading-relaxed max-w-sm">
                {t(lang, "qurbanRulesDesc")}
              </p>
            </div>
            <div
              className="shrink-0 hidden sm:flex flex-col items-center justify-center rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <span className="text-[22px] font-black text-white leading-none">{sections.length}</span>
              <span className="text-[10px] text-white/60 font-semibold">bölmə</span>
            </div>
          </div>

          {/* ── Chapter index strip ── */}
          <div
            className="qr-index flex gap-2 px-5 pb-4 overflow-x-auto"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            {sections.map(({ Icon, accent, light }, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(i)}
                className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all"
                style={{
                  background: openIndex === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span
                  className="text-[10px] font-black"
                  style={{ color: openIndex === i ? accent : "rgba(255,255,255,0.7)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon
                  size={11}
                  color={openIndex === i ? accent : "rgba(255,255,255,0.6)"}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── SECTIONS — 2 col desktop ──────────────────────────────────────── */}
        <div className="hidden md:grid grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-3">
            {sections.filter((_, i) => i % 2 === 0).map((s, ci) => {
              const ri = ci * 2;
              return (
                <Section
                  key={ri}
                  id={`qr-section-${ri}`}
                  section={s}
                  idx={ri}
                  open={openIndex === ri}
                  onToggle={() => toggle(ri)}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-3">
            {sections.filter((_, i) => i % 2 !== 0).map((s, ci) => {
              const ri = ci * 2 + 1;
              return (
                <Section
                  key={ri}
                  id={`qr-section-${ri}`}
                  section={s}
                  idx={ri}
                  open={openIndex === ri}
                  onToggle={() => toggle(ri)}
                />
              );
            })}
          </div>
        </div>

        {/* ── SECTIONS — mobile ────────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col gap-3">
          {sections.map((s, i) => (
            <Section
              key={i}
              id={`qr-section-mob-${i}`}
              section={s}
              idx={i}
              open={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* ── FOOTER QUOTE ─────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#16a34a20" }}
          >
            <HandHeart size={18} style={{ color: "#16a34a" }} />
          </div>
          <p className="text-[12.5px] text-green-800 font-semibold leading-relaxed italic flex-1">
            {t(lang, "qurbanFooterText")}
          </p>
          {/* Decorative quote marks */}
          <span
            className="absolute right-4 bottom-0 font-serif font-black select-none leading-none"
            style={{ fontSize: 80, color: "rgba(22,163,74,0.06)" }}
          >
            "
          </span>
        </div>

      </div>
    </>
  );
}
