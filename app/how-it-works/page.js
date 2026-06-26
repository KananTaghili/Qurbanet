"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Beef, Scissors, Package, Truck,
  CheckCircle2, Video, ShieldCheck, Clock3,
  ArrowRight, ChevronRight,
} from "lucide-react";
import { PiKnifeBold } from "react-icons/pi";
import { useLanguage } from "../../context/LanguageContext";
import { t, HOW_IT_WORKS_TEXT } from "../../lib/i18n";

// ── per-step visual config ────────────────────────────────────────────────────
const STEP_CFG = [
  {
    Icon: Beef,
    color:  "#166534",
    light:  "#dcfce7",
    mid:    "#16a34a",
    gFrom:  "#14532d",
    gTo:    "#166534",
  },
  {
    Icon: PiKnifeBold,
    color:  "#9a3412",
    light:  "#fee2e2",
    mid:    "#ea580c",
    gFrom:  "#7c2d12",
    gTo:    "#9a3412",
  },
  {
    Icon: Package,
    color:  "#065f46",
    light:  "#d1fae5",
    mid:    "#059669",
    gFrom:  "#064e3b",
    gTo:    "#065f46",
  },
  {
    Icon: Truck,
    color:  "#1e3a8a",
    light:  "#dbeafe",
    mid:    "#2563eb",
    gFrom:  "#1e3a8a",
    gTo:    "#1d4ed8",
  },
];

const HERO_STATS = [
  { Icon: ShieldCheck, label: "100% Halal Kəsim" },
  { Icon: Video,       label: "Video Hesabat"     },
  { Icon: Clock3,      label: "24–48s Çatdırılma" },
];

// ── intersection-observer fade-up hook ───────────────────────────────────────
function useFadeUp() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("hiw-visible"); obs.disconnect(); } },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Single step card ──────────────────────────────────────────────────────────
function StepCard({ step, cfg, idx, reverse }) {
  const ref = useFadeUp();
  const { Icon } = cfg;
  const num = String(idx + 1).padStart(2, "0");

  return (
    <div
      ref={ref}
      className="hiw-card flex flex-col md:flex-row overflow-hidden rounded-3xl shadow-md"
      style={{
        animationDelay: `${idx * 0.1}s`,
        border: `1.5px solid ${cfg.light}`,
        background: "#fff",
      }}
    >
      {/* ── Visual panel ── */}
      <div
        className={`relative flex items-center justify-center shrink-0 ${reverse ? "md:order-2" : ""}`}
        style={{
          width: "100%",
          minHeight: 220,
          background: `linear-gradient(135deg, ${cfg.gFrom} 0%, ${cfg.gTo} 100%)`,
          flex: "0 0 42%",
        }}
      >
        {/* Large decorative number */}
        <span
          className="absolute font-black select-none"
          style={{
            fontSize: "clamp(80px, 14vw, 140px)",
            color: "rgba(255,255,255,0.08)",
            lineHeight: 1,
            bottom: -10,
            right: 10,
            letterSpacing: "-4px",
          }}
        >
          {num}
        </span>

        {/* Step badge */}
        <span
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-bold text-white/90"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
        >
          {step.label}
        </span>

        {/* Icon circle */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full shadow-2xl"
          style={{
            width: 88, height: 88,
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Icon size={40} color="#fff" strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Content panel ── */}
      <div className={`flex flex-col justify-center px-6 py-7 flex-1 ${reverse ? "md:order-1" : ""}`}>
        {/* Step title */}
        <h2
          className="text-xl font-extrabold mb-2 leading-tight"
          style={{ color: cfg.color }}
        >
          {step.title}
        </h2>

        {/* Accent line */}
        <div
          className="mb-3 rounded-full"
          style={{ width: 36, height: 3, background: cfg.mid }}
        />

        {/* Description */}
        <p className="text-sm leading-relaxed text-slate-500 mb-4">
          {step.desc}
        </p>

        {/* Points */}
        {step.points?.length > 0 && (
          <ul className="flex flex-col gap-2">
            {step.points.map((pt, pi) => (
              <li key={pi} className="flex items-start gap-2.5">
                <CheckCircle2
                  size={15}
                  className="shrink-0 mt-0.5"
                  style={{ color: cfg.mid }}
                  strokeWidth={2.5}
                />
                <span className="text-sm font-semibold text-slate-700 leading-snug">{pt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const { lang } = useLanguage();
  const steps = HOW_IT_WORKS_TEXT[lang] || HOW_IT_WORKS_TEXT.az;
  const heroRef = useFadeUp();

  return (
    <>
      <style>{`
        /* Entry animation */
        .hiw-card, .hiw-hero {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.55s cubic-bezier(.25,.8,.25,1),
                      transform 0.55s cubic-bezier(.25,.8,.25,1);
        }
        .hiw-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        /* Connector arrow */
        .hiw-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          opacity: 0.35;
        }
        .hiw-arrow-line {
          height: 2px;
          flex: 1;
          background: repeating-linear-gradient(90deg, #1c5e20 0, #1c5e20 6px, transparent 6px, transparent 12px);
        }
      `}</style>

      <div className="flex flex-col gap-5 px-4 py-5 md:px-6 md:py-6">

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <div
          ref={heroRef}
          className="hiw-hero relative overflow-hidden rounded-3xl px-6 py-8 md:px-10 md:py-10"
          style={{ background: "linear-gradient(135deg, #14532d 0%, #1c5e20 55%, #166534 100%)" }}
        >
          {/* Background decorative circles */}
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
          <div style={{ position:"absolute", bottom:-30, left:-20, width:150, height:150, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />

          <div className="relative z-10">
            <p className="text-[11px] font-bold tracking-[0.25em] text-white/50 uppercase mb-2">
              QurbanEt
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
              {t(lang, "howItWorksHero")}
            </h1>
            <p className="text-sm md:text-base text-white/65 leading-relaxed max-w-lg mb-6">
              {t(lang, "howItWorksHeroDesc")}
            </p>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-2">
              {HERO_STATS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <Icon size={13} color="#86efac" strokeWidth={2} />
                  <span className="text-[12px] font-semibold text-white/85">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── STEPS ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-3">
              <StepCard
                step={step}
                cfg={STEP_CFG[i]}
                idx={i}
                reverse={i % 2 === 1}
              />

              {/* Connector between steps */}
              {i < steps.length - 1 && (
                <div className="hiw-arrow px-6">
                  <div className="hiw-arrow-line" />
                  <ChevronRight size={16} color="#1c5e20" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <div className="flex justify-center pb-2">
          <Link
            href="/qurban"
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #14532d, #1c5e20)" }}
          >
            Sifarişə başla
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>

      </div>
    </>
  );
}
