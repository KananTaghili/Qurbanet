"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { useOrder } from "../../context/OrderContext";
import { useLanguage } from "../../context/LanguageContext";
import { t, animalName } from "../../lib/i18n";
import api, { BASE_URL } from "../../lib/api";
import {
  Truck,
  CheckCircle,
  Video,
  Loader2,
  ChevronRight,
  Beef,
} from "lucide-react";

const BRAND = "#1c5e20";

// Azerbaijani vowel-harmony suffix for prices: "280-dən" vs "290-dan"
function azPriceSuffix(num) {
  const n = Math.abs(Math.round(num));
  const last2 = n % 100;
  const units = last2 % 10;
  const tens = Math.floor(last2 / 10);
  if (units !== 0) return [1, 2, 3, 4, 5, 7, 8].includes(units) ? "dən" : "dan";
  if (tens !== 0) return [2, 5, 7, 8].includes(tens) ? "dən" : "dan";
  return "dən";
}

function PriceTag({ price, lang }) {
  if (price == null) return null;
  if (lang === "ru") {
    return (
      <>
        <span className="text-[11px] xs:text-xs font-semibold text-text-secondary mr-1">от</span>
        {price} AZN
      </>
    );
  }
  if (lang === "en") {
    return (
      <>
        <span className="text-[11px] xs:text-xs font-semibold text-text-secondary mr-1">from</span>
        {price} AZN
      </>
    );
  }
  return (
    <>
      {price} AZN
      <span className="text-[11px] xs:text-xs font-semibold text-text-secondary ml-1">
        -dən
      </span>
    </>
  );
}

export default function QurbanPage() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { clearOrder } = useOrder();
  const { lang } = useLanguage();
  const [animals, setAnimals] = useState([]);
  const [deliveryWindows, setDeliveryWindows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearOrder();
    try {
      sessionStorage.removeItem("qurbanet_flow");
      sessionStorage.removeItem("qurbanet_qty_state");
      sessionStorage.removeItem("qurbanet_dist_state");
      localStorage.removeItem("selected_animal");
      localStorage.removeItem("delivery_windows");
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAnimals();

    // Re-fetch when user returns to this tab (covers admin-added animals if socket missed)
    const onVisible = () => { if (!document.hidden) fetchAnimals(); };
    document.addEventListener("visibilitychange", onVisible);

    let socket;
    try {
      const { io } = require("socket.io-client");
      socket = io(BASE_URL.replace(/\/api$/, ""), {
        transports: ["websocket", "polling"], // polling as fallback for reverse-proxy environments
      });
      socket.on("category_updated", fetchAnimals);
    } catch {
      /* ignore */
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      try { socket?.disconnect(); } catch { /* ignore */ }
    };
  }, []);

  const fetchAnimals = async () => {
    try {
      const res = await api.get("/orders/animals");
      const data = res.data.data;
      setAnimals(data.animals || []);
      if (data.deliveryWindows?.length) setDeliveryWindows(data.deliveryWindows);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (animal) => {
    localStorage.setItem("selected_animal", JSON.stringify(animal));
    localStorage.setItem("delivery_windows", JSON.stringify(deliveryWindows));
    sessionStorage.setItem("qurbanet_flow", "1");
    sessionStorage.removeItem("qurbanet_qty_state");
    sessionStorage.removeItem("qurbanet_dist_state");
    router.push("/order/quantity");
  };

  if (isLoading) return <LoadingSplash />;

  const FEATURES = [
    { Icon: Truck,        labelKey: "homeFeatureDelivery", subKey: "homeFeatureDeliverySub" },
    { Icon: CheckCircle,  labelKey: "homeFeatureHalal",    subKey: "homeFeatureHalalSub" },
    { Icon: Video,        labelKey: "homeFeatureVideo",    subKey: "homeFeatureVideoSub" },
  ];

  return (
    <div className="flex flex-col flex-1 bg-bg min-h-full w-full">
      {/* Mobile list */}
      <div className="md:hidden flex flex-col w-full px-3 xs:px-4 sm:px-5 pt-3 sm:pt-4 pb-4 gap-2.5 xs:gap-3 sm:gap-4">
        {loading ? (
          <Spinner />
        ) : animals.length === 0 ? (
          <EmptyState lang={lang} />
        ) : (
          animals.map((a) => (
            <MobileAnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} lang={lang} />
          ))
        )}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {FEATURES.map(({ Icon, labelKey, subKey }) => (
              <div key={labelKey} className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-3 py-2.5 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Icon size={18} color={BRAND} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-text-primary">{t(lang, labelKey)}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{t(lang, subKey)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop grid */}
      <div
        className="hidden md:flex flex-col w-full gap-4 lg:gap-5 xl:gap-6 pb-5 md:pb-6 lg:pb-8"
        style={{ paddingTop: 20, paddingLeft: 28, paddingRight: 28 }}
      >
        {loading ? (
          <Spinner />
        ) : animals.length === 0 ? (
          <EmptyState lang={lang} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
            {animals.map((a) => (
              <DesktopAnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} lang={lang} />
            ))}
          </div>
        )}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-1 lg:mt-2">
            {FEATURES.map(({ Icon, labelKey, subKey }) => (
              <div key={labelKey} className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Icon size={20} color={BRAND} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text-primary">{t(lang, labelKey)}</div>
                  <div className="text-xs text-text-muted mt-0.5">{t(lang, subKey)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center py-16 md:py-20 lg:py-24 w-full">
      <Loader2 size={40} color={BRAND} strokeWidth={2} className="animate-spin md:w-12 md:h-12" />
    </div>
  );
}

function LoadingSplash() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-bg px-4">
      <div className="flex flex-col items-center gap-3 md:gap-4">
        <Loader2 size={44} color={BRAND} strokeWidth={2} className="animate-spin md:w-12 md:h-12" />
        <div className="text-sm md:text-[15px] font-semibold text-text-secondary">Yüklənir...</div>
      </div>
    </div>
  );
}

function EmptyState({ lang }) {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full col-span-full" style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: 280, height: 280, pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ width: '100%', height: '100%', opacity: 0.55, filter: 'grayscale(100%)' }}>
          <Image src="/qoyun_big.png" alt="heyvan yoxdur" width={280} height={280} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <p style={{ position: 'absolute', bottom: 24, left: 0, right: 0, margin: 0 }} className="text-sm font-bold text-text-secondary">Heyvan təyin edilməyib</p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Mobile card
   ─────────────────────────────────────────────── */
function MobileAnimalCard({ animal, onSelect, lang }) {
  const isQoyun = animal.type === "qoyun";
  const inactive = !animal.isActive;
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => { if (!inactive) onSelect(animal); }}
      disabled={inactive}
      onMouseEnter={() => !inactive && setPressed(true)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !inactive && setPressed(true)}
      onTouchEnd={() => setTimeout(() => setPressed(false), 180)}
      onTouchCancel={() => setPressed(false)}
      className={`
        flex items-stretch overflow-hidden w-full text-left
        bg-white rounded-2xl xs:rounded-3xl
        border
        transition-all duration-150
        min-h-[120px] xs:min-h-[130px] sm:min-h-[140px]
        ${inactive
          ? "opacity-50 grayscale cursor-not-allowed border-black/[0.08] shadow-card-md"
          : pressed
            ? "border-primary/30 shadow-lg scale-[1.01]"
            : "border-black/[0.08] shadow-card-md"}
      `}
    >
      <div
        className={`
          flex-shrink-0 bg-white overflow-hidden
          flex items-center justify-center
          ${isQoyun
            ? "w-[155px] xs:w-[175px] sm:w-[195px]"
            : "w-[140px] xs:w-[160px] sm:w-[180px] px-2 xs:px-2.5"}
        `}
      >
        {animal.imageUrl ? (
          <img
            src={animal.imageUrl}
            alt={animalName(animal, lang)}
            className="w-full h-full object-contain"
            style={{ transform: isQoyun ? "scale(1.18)" : "scale(1)" }}
          />
        ) : (
          <Beef size={48} color={BRAND} strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between px-3 xs:px-4 py-2.5 xs:py-3">
        <div className="min-w-0">
          <div className="text-base xs:text-[17px] sm:text-lg font-bold text-text-primary leading-tight truncate">
            {animalName(animal, lang)}
          </div>
          {animal.pricePerShare != null && (
            <div className="text-lg xs:text-xl sm:text-[22px] font-extrabold text-primary mt-1 leading-tight">
              <PriceTag price={animal.pricePerShare} lang={lang} />
            </div>
          )}
          <div className="text-[10px] xs:text-[11px] font-semibold text-green-600 mt-0.5 truncate">
            {t(lang, 'priceFrom')}
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <span
            className={`text-[11px] xs:text-xs font-bold px-3 xs:px-3.5 py-1 xs:py-1.5 rounded-full flex items-center gap-1 whitespace-nowrap ${
              inactive
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary text-white"
            }`}
          >
            {t(lang, 'orderNow')} {!inactive && <ChevronRight size={12} strokeWidth={2.5} />}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ───────────────────────────────────────────────
   Desktop card
   ─────────────────────────────────────────────── */
function DesktopAnimalCard({ animal, onSelect, lang }) {
  const isQoyun = animal.type === "qoyun";
  const inactive = !animal.isActive;

  return (
    <button
      onClick={() => { if (!inactive) onSelect(animal); }}
      disabled={inactive}
      className={`
        flex flex-col overflow-hidden text-left
        bg-white rounded-2xl lg:rounded-3xl
        border border-black/[0.08]
        shadow-card-md
        transition-all duration-200
        w-full
        ${inactive ? "opacity-50 grayscale cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-card-lg cursor-pointer"}
      `}
    >
      <div
        className={`
          bg-white overflow-hidden
          h-[140px] md:h-[150px] lg:h-[170px] xl:h-[185px]
          flex items-center justify-center
          ${isQoyun ? "" : "px-2 lg:px-2.5"}
        `}
      >
        {animal.imageUrl ? (
          <img
            src={animal.imageUrl}
            alt={animalName(animal, lang)}
            className="w-full h-full object-contain"
            style={{ transform: isQoyun ? "scale(1.10)" : "scale(1)" }}
          />
        ) : (
          <Beef size={56} color={BRAND} strokeWidth={1.5} />
        )}
      </div>

      <div className="p-3 md:p-3.5 lg:p-4">
        <div className="text-[15px] md:text-base lg:text-[17px] font-extrabold text-text-primary mb-1 lg:mb-1.5 tracking-tight truncate">
          {animalName(animal, lang)}
        </div>
        {animal.pricePerShare != null && (
          <div className="flex items-baseline gap-1 mb-2 lg:mb-2.5">
            <span className="text-xl md:text-[22px] lg:text-2xl xl:text-[26px] font-extrabold text-primary">
              <PriceTag price={animal.pricePerShare} lang={lang} />
            </span>
          </div>
        )}
        <div
          className={`w-full rounded-xl py-2 lg:py-2.5 text-[13px] lg:text-sm font-bold text-center flex items-center justify-center gap-1 lg:gap-1.5 ${
            inactive
              ? "bg-gray-300 text-gray-500"
              : "bg-primary text-white shadow-[0_2px_8px_rgba(27,94,32,0.25)]"
          }`}
        >
          {t(lang, 'orderNow')} {!inactive && <ChevronRight size={14} strokeWidth={2.5} />}
        </div>
      </div>
    </button>
  );
}
