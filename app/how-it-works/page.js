"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import BackHeader from "../../components/BackHeader";
import BottomNav from "../../components/BottomNav";

const STEPS = [
  {
    title: "Qurbanlıq Seçimi",
    image: "/qoyun_big.png",
    imgAlt: "Qoyun",
    color: "#166534",
    accent: "#16a34a",
    label: "Addım 1",
    desc: "Ölkəmizin müxtəlif bölgələrindən toplanan sağlam, canlı heyvanlar arasından istədiyiniz növü — qoyun, qoç, keçi, dana, dəvə — seçirsiniz. Çəki kateqoriyası və qiymət aralıqlarına görə ən uyğun variantı müəyyənləşdirirsiniz.",
    points: [
      "Müxtəlif çəki kateqoriyaları",
      "Tam heyvan və ya şərikli seçim",
      "Şəffaf qiymət hesablaması",
    ],
  },
  {
    title: "Halal Kəsim",
    image: "/bicaq.png",
    imgAlt: "Bıçaq",
    color: "#7c2d12",
    accent: "#ea580c",
    label: "Addım 2",
    desc: "Heyvanlar İslam dininə uyğun olaraq xüsusi kəsim müəssisələrində kəsilir. Kəsim zamanı sizin adınız çəkilərək qısa video çəkilir və tətbiqinizdəki sifariş səhifənizə göndərilir.",
    points: [
      "Şəriətə uyğun halal kəsim",
      "Kəsim anının video çəkilişi",
      "Peşəkar kəsimçi heyəti",
    ],
  },
  {
    title: "Hazırlanma",
    image: "/qutu.png",
    imgAlt: "Qutu",
    color: "#14532d",
    accent: "#15803d",
    label: "Addım 3",
    desc: "Kəsimdən sonra ət müəyyən müddət temperaturda dinləndirilir, sonra isə sizin seçdiyiniz üsula görə — kabablıq, qazan yeməkləri, tam cəmdək — doğranır və gigiyenik qablaşdırmaya yerləşdirilir.",
    points: [
      "Müxtəlif doğrama üsulları",
      "Gigiyenik qablaşdırma",
      "Soyuq zəncirə riayət",
    ],
  },
  {
    title: "Çatdırılma",
    image: "/masin.png",
    imgAlt: "Çatdırılma maşını",
    color: "#1e3a5f",
    accent: "#2563eb",
    label: "Addım 4",
    desc: "Qablaşdırılmış ət temperaturu idarə olunan soyuduculu avtomobillər vasitəsilə seçdiyiniz vaxt aralığında evinizə çatdırılır. Xeyriyyə payları isə birbaşa ehtiyaclı ailələrə paylanır.",
    points: [
      "Temperaturlu soyuduculu çatdırılma",
      "3 vaxt aralığından seçim",
      "Seçdiyiniz tarixdə çatdırılma",
    ],
  },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  const step = STEPS[active];

  return (
    <div
      className="flex flex-col flex-1 min-h-screen"
      style={{ background: "#f6f8f6" }}
    >
      <BackHeader title="Necə İşləyirik?" onBack={() => router.push("/")} />

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
            {/* Big image */}
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
            {STEPS.map((s, i) => (
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
              {/* Badge */}
              <div className="mb-2">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: step.color }}
                >
                  {step.label} / {STEPS.length} — {step.title}
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
                      style={{
                        color: step.accent,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
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
              Əvvəlki
            </button>
            <button
              onClick={() =>
                setActive((a) => Math.min(STEPS.length - 1, a + 1))
              }
              disabled={active === STEPS.length - 1}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: step.color }}
            >
              Növbəti
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ══════════ DESKTOP ══════════ */}
        <div className="hidden md:block px-6 pt-6">
          {/* Hero banner */}
          <div
            className="rounded-3xl overflow-hidden mb-8 flex items-center"
            style={{
              background: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
              minHeight: 120,
            }}
          >
            <div className="flex-1 px-8 py-6">
              <h1 className="text-2xl font-extrabold text-white m-0 mb-1">
                Necə İşləyirik?
              </h1>
              <p className="text-sm text-white/70 m-0 leading-relaxed max-w-md">
                QurbanEt-də sifariş prosesi — seçimdən çatdırılmaya qədər
                şəffaf, etibarlı və sürətli.
              </p>
            </div>
          </div>

          {/* 4 cards grid */}
          <div className="grid grid-cols-2 gap-5">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm flex flex-col"
              >
                {/* Image zone — pure white, colored bottom border */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    height: 220,
                    background: "#ffffff",
                    borderBottom: `3px solid ${s.color}`,
                  }}
                >
                  {/* Big image */}
                  <div className="relative w-full h-full px-8 py-4">
                    <Image
                      src={s.image}
                      alt={s.imgAlt}
                      fill
                      className="object-contain"
                      style={{ padding: "24px 32px" }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Badge above title */}
                  <div className="mb-2">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-gray-900 m-0 mb-2">
                    {s.title}
                  </h2>
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-4 flex-1">
                    {s.desc}
                  </p>
                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                    {s.points.map((pt) => (
                      <div key={pt} className="flex items-center gap-2.5">
                        <CheckCircle2
                          size={15}
                          style={{ color: s.accent, flexShrink: 0 }}
                          strokeWidth={2.5}
                        />
                        <span className="text-[13px] font-semibold text-gray-700">
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
