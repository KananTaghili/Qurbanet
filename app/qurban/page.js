"use client";
import { useEffect, useState, useRef } from "react";
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
  const [glowCard, setGlowCard] = useState(-1);
  const [hoveredCard, setHoveredCard] = useState(-1);
  const pausedRef = useRef(false);
  const seqIdsRef = useRef([]);
  const runSeqRef = useRef(null);
  const resumeTimerRef = useRef(null);

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

  useEffect(() => {
    if (loading || animals.length === 0) return;
    const count = animals.length;
    const clearSeq = () => { seqIdsRef.current.forEach(clearTimeout); seqIdsRef.current = []; };
    const schedule = (fn, delay) => { const id = setTimeout(fn, delay); seqIdsRef.current.push(id); };
    const runSequence = () => {
      if (pausedRef.current) return;
      for (let i = 0; i < count; i++) {
        const idx = i;
        schedule(() => setGlowCard(idx), i * 300);
      }
      schedule(() => { setGlowCard(-1); schedule(runSequence, 9100); }, count * 300);
    };
    runSeqRef.current = runSequence;
    schedule(runSequence, 2000);
    return clearSeq;
  }, [loading, animals.length]);

  const handleCardEnter = (idx) => {
    setHoveredCard(idx);
    pausedRef.current = true;
    seqIdsRef.current.forEach(clearTimeout);
    seqIdsRef.current = [];
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setGlowCard(-1);
  };

  const handleCardLeave = () => {
    setHoveredCard(-1);
    pausedRef.current = false;
    resumeTimerRef.current = setTimeout(() => { if (runSeqRef.current) runSeqRef.current(); }, 10000);
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
      <div className="md:hidden flex flex-col flex-1 w-full px-3 xs:px-4 sm:px-5 pt-3 sm:pt-4 pb-4">
        <HeroBanner router={router} isMobile />
        <div className="flex flex-col flex-1 gap-2.5 xs:gap-3 sm:gap-4 mt-3">
          {loading ? (
            <Spinner />
          ) : animals.length === 0 ? (
            <EmptyState lang={lang} />
          ) : (
            animals.map((a, idx) => (
              <MobileAnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} lang={lang}
                highlighted={glowCard === idx || hoveredCard === idx}
                onMouseEnter={() => handleCardEnter(idx)}
                onMouseLeave={handleCardLeave}
              />
            ))
          )}
        </div>
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 shrink-0">
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
        className="hidden md:flex flex-col w-full gap-2.5 lg:gap-3 pb-3 md:pb-4"
        style={{ paddingTop: 14, paddingLeft: 28, paddingRight: 28 }}
      >
        <HeroBanner router={router} />
        <div>
          <h3 className="text-base font-extrabold text-text-primary mb-0.5">Qurbanlığınızı Seçin</h3>
          <p className="text-xs text-text-muted mb-2">Qurbanlıq heyvan növünü seçərək sifarişinizi tamamlayın</p>
          {loading ? (
            <Spinner />
          ) : animals.length === 0 ? (
            <EmptyState lang={lang} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
              {animals.map((a, idx) => (
                <DesktopAnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} lang={lang}
                  highlighted={glowCard === idx || hoveredCard === idx}
                  onMouseEnter={() => handleCardEnter(idx)}
                  onMouseLeave={handleCardLeave}
                />
              ))}
            </div>
          )}
        </div>
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {FEATURES.map(({ Icon, labelKey, subKey }) => (
              <div key={labelKey} className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-3.5 py-2.5 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Icon size={18} color={BRAND} strokeWidth={1.8} />
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
   Hero Banner
   в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */
function HeroBanner({ router, isMobile }) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl shadow-sm ${isMobile ? "px-4 py-3.5" : "px-5 py-3.5 lg:px-6 lg:py-4"}`}
      style={!isMobile ? {
        backgroundImage: "linear-gradient(to right, #e9f1eb 0%, #e9f1eb 28%, rgba(233,241,235,0.94) 40%, rgba(233,241,235,0.72) 52%, rgba(233,241,235,0.35) 65%, rgba(233,241,235,0.06) 80%, transparent 92%), url('/qurbanliq_sf_pc_image.png')",
        backgroundPosition: "left center, right bottom",
        backgroundSize: "100% 100%, auto 160%",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundColor: "#e9f1eb",
      } : { backgroundColor: "#e9f1eb" }}
    >
      {/* Mobile image */}
      <img
        src="/qurban_sifarisi_mobil_foto.png"
        alt="Qurbanlıq heyvanlar"
        className="absolute inset-y-0 right-0 h-full w-[55%] object-cover object-right block lg:hidden"
      />
      {/* Mobile gradient */}
      <div className="absolute inset-0 block lg:hidden" style={{ background: "linear-gradient(to right, #e9f1eb 20%, rgba(233,241,235,0.88) 38%, rgba(233,241,235,0.55) 55%, rgba(233,241,235,0.1) 72%, transparent 85%)" }} />
      <div className={`relative z-10 ${isMobile ? "max-w-[60%]" : "max-w-lg"}`}>
        <h2 className={`font-extrabold leading-tight text-[#082d15] mb-1.5 ${isMobile ? "text-lg" : "text-xl lg:text-2xl"}`}>
          Süfrəniz bərəkətli,
          <br />
          <span style={{ color: BRAND }}>Qurbanınız qəbul olsun!</span>
        </h2>
        <p className="mb-2.5 text-xs leading-[1.55] text-[#52675a]">
          Qurbanlıq heyvanınızı seçin, halal kəsim və çatdırılma prosesini rahatlıqla bizə həvalə edin.
        </p>
        <button
          onClick={() => router.push("/qurban-rules")}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 whitespace-nowrap"
          style={{ backgroundColor: BRAND }}
        >
          Qurbanın Əhkamlarını Öyrən <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
   Helpers
   в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
   Mobile card
   в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */
function MobileAnimalCard({ animal, onSelect, lang, highlighted = false, onMouseEnter, onMouseLeave }) {
  const isQoyun = animal.type === "qoyun";
  const inactive = !animal.isActive;
  const [pressed, setPressed] = useState(false);
  const active = highlighted || pressed;

  return (
    <button
      onClick={() => { if (!inactive) onSelect(animal); }}
      disabled={inactive}
      onMouseEnter={(e) => { if (!inactive) setPressed(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setPressed(false); onMouseLeave?.(e); }}
      onTouchStart={() => !inactive && setPressed(true)}
      onTouchEnd={() => setTimeout(() => setPressed(false), 180)}
      onTouchCancel={() => setPressed(false)}
      className={`
        flex items-stretch overflow-hidden w-full text-left
        bg-white rounded-2xl xs:rounded-3xl
        border
        min-h-[120px] xs:min-h-[130px] sm:min-h-[140px]
        ${inactive ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"}
      `}
      style={{
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s, border-color 0.35s",
        transform: !inactive && active ? "scale(1.022) translateY(-3px)" : "scale(1) translateY(0)",
        boxShadow: !inactive && active ? "0 14px 40px rgba(28,94,32,0.13)" : "0 2px 8px rgba(0,0,0,0.07)",
        borderColor: !inactive && active ? "rgba(28,94,32,0.25)" : "rgba(0,0,0,0.08)",
      }}
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
   Desktop card
   в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */
function DesktopAnimalCard({ animal, onSelect, lang, highlighted = false, onMouseEnter, onMouseLeave }) {
  const isQoyun = animal.type === "qoyun";
  const inactive = !animal.isActive;
  const [hovered, setHovered] = useState(false);
  const active = highlighted || hovered;

  return (
    <button
      onClick={() => { if (!inactive) onSelect(animal); }}
      disabled={inactive}
      onMouseEnter={(e) => { if (!inactive) setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      className={`flex flex-col overflow-hidden text-left bg-white rounded-2xl lg:rounded-3xl w-full ${inactive ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        border: !inactive && active ? "1.5px solid rgba(28,94,32,0.22)" : "1.5px solid rgba(0,0,0,0.08)",
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s, border-color 0.35s",
        transform: !inactive && active ? "scale(1.028) translateY(-5px)" : "scale(1) translateY(0)",
        boxShadow: !inactive && active ? "0 20px 55px rgba(28,94,32,0.14)" : "0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <div
        className={`
          bg-white overflow-hidden
          h-[100px] md:h-[110px] lg:h-[120px] xl:h-[135px]
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

      <div className="p-2.5 md:p-3 lg:p-3.5">
        <div className="text-[14px] md:text-[15px] lg:text-base font-extrabold text-text-primary mb-0.5 tracking-tight truncate">
          {animalName(animal, lang)}
        </div>
        {animal.pricePerShare != null && (
          <div className="flex items-baseline gap-1 mb-1.5 lg:mb-2">
            <span className="text-lg md:text-xl lg:text-[22px] xl:text-2xl font-extrabold text-primary">
              <PriceTag price={animal.pricePerShare} lang={lang} />
            </span>
          </div>
        )}
        <div
          className={`w-full rounded-xl py-1.5 lg:py-2 text-[13px] font-bold text-center flex items-center justify-center gap-1 ${
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
