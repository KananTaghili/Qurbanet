"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Beef, HeartHandshake } from "lucide-react";
import SiteLayout from "../../components/SiteLayout";

const QURBAN_STEPS = [
  { title: "Heyvanı seçin",       text: "Qurbanlıq heyvanını onlayn seçin və sifariş edin." },
  { title: "Təsdiq və kəsim",     text: "Komandamız sifarişi qəbul edib, halal kəsim həyata keçirir." },
  { title: "Video hesabat",       text: "Kəsim prosesini video ilə real vaxtda izləyin." },
  { title: "Çatdırılma",          text: "Ətiniz soyuq zəncirlə qapınıza çatdırılır." },
];

const CHARITY_STEPS = [
  { title: "Açılış seçin",        text: "Yeni açılış edin və ya davam edən açılışa qoşulun." },
  { title: "İanə edin",           text: "Pay məbləğini daxil edib təhlükəsiz ödəniş edin." },
  { title: "Kəsim və video",      text: "Məbləğ toplananda qurban kəsilir, kəsim videosu yüklənir." },
  { title: "Paylanma",            text: "Kəsilmiş qurban ehtiyac sahiblərinə çatdırılır." },
];

export default function HowItWorksPage() {
  const [tab, setTab] = useState("qurban");
  const isQ = tab === "qurban";
  const steps = isQ ? QURBAN_STEPS : CHARITY_STEPS;
  const accent = isQ ? "#1c5e20" : "#5b22c7";
  const cardBg = isQ ? "#f3faf4" : "#f6f2fe";
  const cardBorder = isQ ? "#d6ead8" : "#e5dcfa";

  return (
    <SiteLayout>
      <section className="relative bg-[#fbf7f2] px-4 py-4 text-[#1d0c08] sm:px-6 md:px-8 md:py-5">
        {/* Back — mobile */}
        <Link href="/" className="page-back lg:hidden fixed top-0 left-0 z-50 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
          style={{ background: "#f20b32", width: 56, height: 56, borderRadius: "0 0 100% 0", paddingBottom: 12, paddingRight: 12 }}>
          <ArrowLeft className="h-5 w-5 text-white" strokeWidth={2.5} />
        </Link>

        <div className="mb-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e10d0d] md:text-xs md:tracking-[0.28em]">Necə işləyirik?</p>
          <h1 className="mt-1.5 text-xl font-black leading-snug sm:text-2xl">
            Sadə və şəffaf proses — bir neçə addımda.
          </h1>
        </div>

        {/* Tabs — Qurbanlıq / Kollektiv */}
        <div className="mt-3 flex w-full max-w-md rounded-2xl border border-[#ead9cf] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("qurban")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
            style={isQ ? { background: "#1c5e20", color: "#fff", boxShadow: "0 6px 16px rgba(28,94,32,0.25)" } : { background: "transparent", color: "#6b7280" }}
          >
            <Beef size={16} strokeWidth={2.2} /> Qurbanlıq
          </button>
          <button
            type="button"
            onClick={() => setTab("charity")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
            style={!isQ ? { background: "#5b22c7", color: "#fff", boxShadow: "0 6px 16px rgba(91,34,199,0.25)" } : { background: "transparent", color: "#6b7280" }}
          >
            <HeartHandshake size={16} strokeWidth={2.2} /> Kollektiv
          </button>
        </div>

        {/* Steps — simple cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-xl border p-3" style={{ background: cardBg, borderColor: cardBorder }}>
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white" style={{ background: accent }}>
                {i + 1}
              </span>
              <h3 className="mt-2 text-sm font-black" style={{ color: accent }}>{step.title}</h3>
              <p className="mt-1 text-xs leading-5 text-neutral-600">{step.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4 flex">
          <Link
            href={isQ ? "/qurban" : "/charity"}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: accent }}
          >
            {isQ ? "Qurbanlıq sifarişinə başla" : "Kollektivə qoşul"}
            <ArrowLeft className="h-4 w-4 rotate-180" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
