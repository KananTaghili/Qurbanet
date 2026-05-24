"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake, Home, Heart, Users,
  Truck, Camera, Utensils, ChevronRight, Check, Loader2,
} from "lucide-react";
import BackHeader from "../../components/BackHeader";
import BottomNav from "../../components/BottomNav";
import api from "../../lib/api";

const ICON_CONFIG = {
  usaqlar_evi: {
    Icon: Home,
    accent: "#1B5E20",
    light: "#E8F5E9",
    label: "Uşaqlar evi",
  },
  qocalar_evi: {
    Icon: Heart,
    accent: "#6A1B9A",
    light: "#F3E5F5",
    label: "Qocalar evi",
  },
  ehtiyac_sahibleri: {
    Icon: Users,
    accent: "#1565C0",
    light: "#E3F2FD",
    label: "Ehtiyac sahibləri",
  },
};

const FALLBACK_TARGETS = [
  { key: "usaqlar_evi",       nameAz: "Uşaqlar evi",        description: "Uşaq evlərindəki körpələrə ət paylanır.", isActive: true },
  { key: "qocalar_evi",       nameAz: "Qocalar evi",         description: "Yaşlı evlərindəki sakinlərə ət paylanır.", isActive: true },
  { key: "ehtiyac_sahibleri", nameAz: "Ehtiyac sahibləri",   description: "Birbaşa ehtiyaclı ailələrə ət paylanır.", isActive: true },
];

const INFO_ITEMS = [
  { Icon: Utensils, text: "Kəsilmiş ət seçdiyiniz istiqamətə paylanır" },
  { Icon: Truck,    text: "Çatdırılma xərci qiymətə daxildir" },
  { Icon: Camera,   text: "Paylanma prosesi foto ilə təsdiqlənir" },
];

export default function NeedSupportPage() {
  const router = useRouter();
  const [options, setOptions]   = useState(FALLBACK_TARGETS);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    api.get('/app-config/settings')
      .then(res => {
        if (res.data?.data?.charityPageEnabled === false) {
          router.replace('/');
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true));

    api.get("/app-config/charity-options")
      .then(res => {
        const opts = res.data.data?.charityOptions || [];
        if (opts.length > 0) setOptions(opts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!ready) return null;

  const handleContinue = () => {
    const item = options.find(o => o.key === selected);
    if (!item?.isActive) return;
    const cfg = ICON_CONFIG[item.key] || { accent: "#1B5E20" };
    sessionStorage.setItem("charity_target", JSON.stringify({ ...item, accentColor: cfg.accent }));
    router.push(`/need-support/${item.key}`);
  };

  const selectedItem = options.find(o => o.key === selected);

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title="Xeyriyyə" onBack={() => router.push("/")} />

      <div className="flex-1 page-scroll">
        <div className="p-4 md:p-0 flex flex-col md:grid md:grid-cols-[1fr_320px] md:gap-6 md:items-start gap-4">

          {/* ── LEFT ───────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Hero banner */}
            <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)" }} />
              <div className="relative px-5 py-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <HeartHandshake className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">Xeyriyyə yönünü seçin</h2>
                  <p className="text-sm text-white/70 mt-1 leading-snug">
                    Qurban ətinin kimin üçün paylanacağını seçin.
                  </p>
                </div>
              </div>
            </div>

            {/* Options */}
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {options.map(item => {
                  const cfg = ICON_CONFIG[item.key] || { Icon: HeartHandshake, accent: "#1B5E20", light: "#E8F5E9" };
                  const { Icon: CardIcon, accent, light } = cfg;
                  const isDisabled = item.isActive === false;
                  const isActive   = selected === item.key && !isDisabled;

                  return (
                    <button
                      key={item.key}
                      onClick={() => !isDisabled && setSelected(item.key)}
                      disabled={isDisabled}
                      className="w-full text-left rounded-2xl border-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: isActive ? accent : "var(--border)",
                        background:  isActive ? light : "var(--surface)",
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: isActive ? accent : light }}
                        >
                          <CardIcon className="w-5 h-5" style={{ color: isActive ? "#fff" : accent }} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold" style={{ color: isActive ? accent : "var(--text-primary)" }}>
                              {item.nameAz}
                            </span>
                            {isDisabled && (
                              <span className="text-[10px] font-semibold text-text-muted bg-surface-alt border border-border px-2 py-0.5 rounded-full">
                                Müvəqqəti yoxdur
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary leading-snug">{item.description}</p>
                        </div>

                        {/* Radio */}
                        {!isDisabled && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors"
                            style={{ borderColor: isActive ? accent : "var(--border)", background: isActive ? accent : "transparent" }}
                          >
                            {isActive && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT ──────────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:mt-0">
            {/* Info card */}
            <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-alt/40">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Xeyriyyə haqqında</span>
              </div>
              <div className="divide-y divide-border">
                {INFO_ITEMS.map(({ Icon: InfoIcon, text }) => (
                  <div key={text} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                      <InfoIcon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed flex-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleContinue}
                disabled={!selected}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-extrabold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-primary/90"
              >
                {selectedItem ? `${selectedItem.nameAz} — Davam et` : "Seçim edin"}
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="mobile-action-bar md:hidden">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-extrabold disabled:opacity-40"
        >
          {selectedItem ? `${selectedItem.nameAz} — Davam et` : "Seçim edin"}
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
