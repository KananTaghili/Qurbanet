"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import BackHeader from "../../components/BackHeader";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../context/LanguageContext";
import { t, HOW_IT_WORKS_TEXT } from "../../lib/i18n";

const STEP_IMAGES = ['/qoyun_big.png', '/bicaq.png', '/qutu.png', '/masin.png'];
const STEP_COLORS = [
  { color: '#166534', accent: '#16a34a' },
  { color: '#7c2d12', accent: '#ea580c' },
  { color: '#14532d', accent: '#15803d' },
  { color: '#1e3a5f', accent: '#2563eb' },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [active, setActive] = useState(0);

  const steps = (HOW_IT_WORKS_TEXT[lang] || HOW_IT_WORKS_TEXT.az).map((s, i) => ({
    ...s,
    image: STEP_IMAGES[i],
    ...STEP_COLORS[i],
  }));

  const step = steps[active];

  return (
    <div
      className="flex flex-col flex-1 min-h-screen"
      style={{ background: "#f6f8f6" }}
    >
      <BackHeader title={t(lang, 'howItWorksHero')} onBack={() => router.push("/")} />

      <div className="flex-1 page-scroll pb-6">
        {/* ══════════ MOBILE ══════════ */}
        <div className="md:hidden flex flex-col">
          {/* Big image hero */}
          <div
            className="relative w-full flex items-center justify-center"
            style={{
              height: 260,
              background: "#ffffff",
              borderBottom: `3px solid ${step.color}`,
              transition: "border-color 0.3s",
            }}
          >
            <div className="relative w-full h-full px-6 pt-4 pb-4">
              <Image
                src={step.image}
                alt={step.imgAlt}
                fill
                className="object-contain"
                style={{ padding: "16px 24px" }}
                priority
              />
            </div>
          </div>

          {/* Step tabs */}
          <div className="flex gap-0 px-4 mt-4">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all rounded-xl mx-0.5"
                style={{
                  background: active === i ? s.color : "#fff",
                  border: `1.5px solid ${active === i ? s.color : "#e5e7eb"}`,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      active === i ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                    color: active === i ? "#fff" : "#9ca3af",
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className="text-[9px] font-bold leading-tight text-center px-0.5"
                  style={{ color: active === i ? "#fff" : "#9ca3af" }}
                >
                  {s.title.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Content card */}
          <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="mb-2">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: step.color }}
                >
                  {step.label} / {steps.length} — {step.title}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {step.desc}
              </p>
              <div className="flex flex-col gap-3">
                {step.points.map((pt) => (
                  <div key={pt} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      style={{ color: step.accent, flexShrink: 0, marginTop: 1 }}
                      strokeWidth={2}
                    />
                    <span className="text-sm font-semibold text-gray-700 leading-snug">
                      {pt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex gap-3 px-4 mt-4">
            <button
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-400 disabled:opacity-30 bg-white"
            >
              <ChevronLeft size={16} />
              {t(lang, 'previous')}
            </button>
            <button
              onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
              disabled={active === steps.length - 1}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: step.color }}
            >
              {t(lang, 'next')}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ══════════ DESKTOP ══════════ */}
        <div className="hidden md:block px-4 lg:px-6 pt-6">
          {/* Hero banner */}
          <div
            className="rounded-2xl lg:rounded-3xl overflow-hidden mb-6 flex items-center"
            style={{
              background: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
              minHeight: 100,
            }}
          >
            <div className="flex-1 px-5 lg:px-8 py-5 lg:py-6">
              <h1 className="text-xl lg:text-2xl font-extrabold text-white m-0 mb-1">
                {t(lang, 'howItWorksHero')}
              </h1>
              <p className="text-xs lg:text-sm text-white/70 m-0 leading-relaxed max-w-md">
                {t(lang, 'howItWorksHeroDesc')}
              </p>
            </div>
          </div>

          {/* 4 cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm flex flex-col"
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    height: 240,
                    background: "#f9fafb",
                    borderBottom: `3px solid ${s.color}`,
                  }}
                >
                  <Image
                    src={s.image}
                    alt={s.imgAlt}
                    fill
                    className="object-contain"
                    style={{ padding: "20px 32px" }}
                  />
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <span
                    className="self-start px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: s.color }}
                  >
                    {s.label}
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900 m-0 mb-1.5">
                      {s.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed m-0">
                      {s.desc}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100">
                    {s.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={16}
                          style={{ color: s.accent, flexShrink: 0, marginTop: 2 }}
                          strokeWidth={2.5}
                        />
                        <span className="text-sm font-semibold text-gray-700 leading-snug">
                          {pt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
