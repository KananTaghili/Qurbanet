"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { t, animalName } from "../lib/i18n";
import api, { BASE_URL } from "../lib/api";
import {
  Truck,
  CheckCircle,
  Video,
  PawPrint,
  LogIn,
  LogOut,
  UserPlus,
  MoreVertical,
  Loader2,
  ChevronRight,
} from "lucide-react";

const BRAND = "#1c5e20";

export default function HomePage() {
  const router = useRouter();
  const { isGuest, logout, isLoading } = useAuth();
  const { lang, setLang } = useLanguage();
  const [animals, setAnimals] = useState([]);
  const [deliveryWindows, setDeliveryWindows] = useState([]);
  const [singleAnimalMode, setSingleAnimalMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchAnimals();
    let socket;
    try {
      const { io } = require("socket.io-client");
      socket = io(BASE_URL.replace(/\/api$/, ""), {
        transports: ["websocket"],
      });
      socket.on("category_updated", fetchAnimals);
    } catch {
      /* ignore */
    }
    return () => {
      try {
        socket?.disconnect();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const fetchAnimals = async () => {
    try {
      const res = await api.get("/orders/animals");
      const data = res.data.data;
      setAnimals(data.animals || []);
      if (data.deliveryWindows?.length)
        setDeliveryWindows(data.deliveryWindows);
      setSingleAnimalMode(data.singleAnimalMode === true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (animal) => {
    localStorage.setItem("selected_animal", JSON.stringify(animal));
    localStorage.setItem("delivery_windows", JSON.stringify(deliveryWindows));
    localStorage.setItem("single_animal_mode", String(singleAnimalMode));
    sessionStorage.setItem("qurbanet_flow", "1");
    sessionStorage.removeItem("qurbanet_qty_state"); // fresh state for new animal
    router.push("/order/quantity");
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    if (confirm("Hesabdan çıxmaq istədiyinizə əminsiniz?")) await logout();
  };

  if (isLoading) return <LoadingSplash />;

  const FEATURES = [
    { Icon: Truck, label: "Evə çatdırılma", sub: "24-48 saat ərzində" },
    { Icon: CheckCircle, label: "Halal kəsim", sub: "Şəriətə uyğun kəsim" },
    { Icon: Video, label: "Video izləmə", sub: "Kəsim anı çəkilişi" },
  ];

  return (
    <div className="flex flex-col flex-1 bg-bg min-h-screen w-full">
      {/* ══════════════════════════════════════════════
          MOBILE HEADER  (< md: 0–767px)
          ══════════════════════════════════════════════ */}
      <div
        className="
          md:hidden
          w-full
          bg-primary
          px-3 xs:px-4 sm:px-5
          pt-[max(env(safe-area-inset-top),12px)]
          pb-3 sm:pb-4
          sticky top-0 z-30
          shadow-[0_2px_8px_rgba(0,0,0,0.08)]
        "
      >
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-white/20">
              <Image
                src="/logo.png"
                alt="QurbanEt"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div
                style={{ color: "white", letterSpacing: "-0.3px", lineHeight: 1.15 }}
                className="text-lg xs:text-xl sm:text-[22px] font-black italic truncate"
              >
                Qurban<span style={{ color: "#86efac" }}>Et</span>
              </div>
              <div className="text-[8px] xs:text-[9px] sm:text-[10px] text-white/60 font-semibold tracking-widest truncate">
                ETİBARLI · HALAL · SÜRƏTLİ
              </div>
            </div>
          </div>

          {/* Language switcher (mobile) */}
          <div className="flex gap-1 flex-shrink-0">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="text-[10px] xs:text-[11px] font-bold px-1.5 py-0.5 rounded-lg border-none transition-all cursor-pointer"
                style={{
                  background: lang === l.code ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)',
                  color: lang === l.code ? '#fff' : 'rgba(255,255,255,0.55)',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Menu button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
              aria-label="Menyu"
            >
              <MoreVertical
                size={22}
                color="white"
                strokeWidth={2}
                className="sm:w-6 sm:h-6"
              />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 sm:top-12 bg-surface rounded-xl shadow-card-lg border border-border z-50 min-w-[160px] py-1 overflow-hidden">
                  {isGuest ? (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/auth/login");
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-primary flex items-center gap-2 active:bg-primary-surface"
                      >
                        <LogIn size={15} color={BRAND} strokeWidth={2} />
                        Daxil ol
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/auth/register");
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-primary flex items-center gap-2 active:bg-primary-surface border-t border-border"
                      >
                        <UserPlus size={15} color={BRAND} strokeWidth={2} />
                        Qeydiyyat
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 flex items-center gap-2 active:bg-red-50"
                    >
                      <LogOut size={15} color="#dc2626" strokeWidth={2} />
                      Çıxış
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE LIST  (< md: 0–767px)
          ══════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col flex-1 w-full px-3 xs:px-4 sm:px-5 pt-3 sm:pt-4 pb-[calc(96px+env(safe-area-inset-bottom))]">
        {loading ? (
          <Spinner />
        ) : animals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5 xs:gap-3 sm:gap-4">
            {animals.map((a) => (
              <MobileAnimalCard
                key={a._id || a.type}
                animal={a}
                onSelect={handleSelect}
                lang={lang}
              />
            ))}
          </div>
        )}

        {/* Feature strips - mobile bottom */}
        {!loading && animals.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 xs:gap-2.5 mt-4 sm:mt-5">
            {FEATURES.map(({ Icon, label, sub }) => (
              <div
                key={label}
                className="flex xs:flex-col items-center xs:items-start gap-2.5 xs:gap-2 bg-surface rounded-2xl border border-border px-3 py-2.5 xs:p-3 shadow-card"
              >
                <div className="w-9 h-9 xs:w-8 xs:h-8 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Icon size={18} color={BRAND} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] xs:text-xs font-bold text-text-primary truncate">
                    {label}
                  </div>
                  <div className="text-[11px] xs:text-[10px] text-text-muted mt-0.5 truncate">
                    {sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP TOPBAR  (md+: 768px+)
          ══════════════════════════════════════════════ */}
      <div
        className="hidden md:flex items-center"
        style={{
          background: "var(--primary)",
          height: "var(--topbar-h)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99,
          paddingLeft: "calc(var(--sidebar-w) + 28px)",
          paddingRight: 28,
        }}
      >
        <h1 className="text-base font-extrabold tracking-tight text-white">
          Qurban Seçimi
        </h1>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP / TABLET LAYOUT  (md+: 768px+)
          ══════════════════════════════════════════════ */}
      <div
        className="
          hidden md:flex flex-col
          w-full
          gap-4 lg:gap-5 xl:gap-6
          pb-5 md:pb-6 lg:pb-8
        "
        style={{
          paddingTop: "calc(var(--topbar-h) + 12px)",
          paddingLeft: 28,
          paddingRight: 28,
        }}
      >
        {/* Grid */}
        {loading ? (
          <Spinner />
        ) : animals.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-3 md:gap-4 lg:gap-5
            "
          >
            {animals.map((a) => (
              <DesktopAnimalCard
                key={a._id || a.type}
                animal={a}
                onSelect={handleSelect}
                lang={lang}
              />
            ))}
          </div>
        )}

        {/* Feature strips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mt-1 lg:mt-2">
          {FEATURES.map(({ Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3 lg:py-3.5 shadow-card"
            >
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                <Icon
                  size={20}
                  color={BRAND}
                  strokeWidth={1.8}
                  className="lg:w-[22px] lg:h-[22px]"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm lg:text-[15px] font-bold text-text-primary truncate">
                  {label}
                </div>
                <div className="text-xs lg:text-[13px] text-text-muted mt-0.5 truncate">
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center py-16 md:py-20 lg:py-24 w-full">
      <Loader2
        size={40}
        color={BRAND}
        strokeWidth={2}
        className="animate-spin md:w-12 md:h-12"
      />
    </div>
  );
}

function LoadingSplash() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-bg px-4">
      <div className="flex flex-col items-center gap-3 md:gap-4">
        <Loader2
          size={44}
          color={BRAND}
          strokeWidth={2}
          className="animate-spin md:w-12 md:h-12"
        />
        <div className="text-sm md:text-[15px] font-semibold text-text-secondary">
          Yüklənir...
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 md:py-20 lg:py-24 gap-3 text-center px-6 md:px-8 w-full col-span-full">
      <PawPrint
        size={56}
        color={BRAND}
        strokeWidth={1.4}
        className="md:w-16 md:h-16"
      />
      <div className="font-bold text-text-primary text-sm md:text-base">
        Hal-hazırda heyvan mövcud deyil
      </div>
      <div className="text-xs md:text-sm text-text-secondary">
        Tezliklə yenidən yoxlayın
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Mobile card: horizontal, fluid heights
   ─────────────────────────────────────────────── */
function MobileAnimalCard({ animal, onSelect, lang }) {
  const isQoyun = animal.type === "qoyun";
  const inactive = !animal.isActive;

  return (
    <button
      onClick={() => { if (!inactive) onSelect(animal); }}
      disabled={inactive}
      className={`
        flex items-stretch overflow-hidden w-full text-left
        bg-white rounded-2xl xs:rounded-3xl
        border border-black/[0.08]
        shadow-card-md
        transition-all active:scale-[0.98]
        min-h-[100px] xs:min-h-[110px] sm:min-h-[120px]
        ${inactive ? "opacity-50 grayscale cursor-not-allowed" : ""}
      `}
    >
      {/* Image */}
      <div
        className={`
          flex-shrink-0 bg-white overflow-hidden
          flex items-center justify-center
          ${
            isQoyun
              ? "w-[130px] xs:w-[150px] sm:w-[170px]"
              : "w-[120px] xs:w-[135px] sm:w-[155px] px-2 xs:px-2.5"
          }
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
          <PawPrint size={48} color={BRAND} strokeWidth={1.4} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between px-3 xs:px-4 py-2.5 xs:py-3">
        <div className="min-w-0">
          <div className="text-base xs:text-[17px] sm:text-lg font-bold text-text-primary leading-tight truncate">
            {animalName(animal, lang)}
          </div>
          {animal.pricePerShare != null && (
            <div className="text-lg xs:text-xl sm:text-[22px] font-extrabold text-primary mt-1 leading-tight">
              {animal.pricePerShare} AZN
              <span className="text-[11px] xs:text-xs font-semibold text-text-secondary ml-1">
                -dən
              </span>
            </div>
          )}
          <div className="text-[10px] xs:text-[11px] font-semibold text-green-600 mt-0.5 truncate">
            Başlayan qiymətlərlə
          </div>
        </div>
        <div className="flex justify-end mt-1">
          {inactive ? (
            <span className="bg-gray-400 text-white text-[11px] xs:text-xs font-bold px-3 xs:px-3.5 py-1 xs:py-1.5 rounded-full whitespace-nowrap">
              Deaktiv
            </span>
          ) : (
            <span className="bg-primary text-white text-[11px] xs:text-xs font-bold px-3 xs:px-3.5 py-1 xs:py-1.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              Seç <ChevronRight size={12} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ───────────────────────────────────────────────
   Desktop card: vertical, fluid sizing
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
      {/* Image */}
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
          <PawPrint
            size={56}
            color={BRAND}
            strokeWidth={1.4}
            className="lg:w-16 lg:h-16"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-3.5 lg:p-4">
        <div className="text-[15px] md:text-base lg:text-[17px] font-extrabold text-text-primary mb-1 lg:mb-1.5 tracking-tight truncate">
          {animalName(animal, lang)}
        </div>
        {animal.pricePerShare != null && (
          <div className="flex items-baseline gap-1 mb-2 lg:mb-2.5">
            <span className="text-xl md:text-[22px] lg:text-2xl xl:text-[26px] font-extrabold text-primary">
              {animal.pricePerShare} AZN
            </span>
            <span className="text-[11px] lg:text-xs text-text-secondary font-medium">
              -dən
            </span>
          </div>
        )}
        {inactive ? (
          <div className="w-full bg-gray-400 text-white rounded-xl py-2 lg:py-2.5 text-[13px] lg:text-sm font-bold text-center">
            Deaktiv
          </div>
        ) : (
          <div className="w-full bg-primary text-white rounded-xl py-2 lg:py-2.5 text-[13px] lg:text-sm font-bold text-center shadow-[0_2px_8px_rgba(27,94,32,0.25)] flex items-center justify-center gap-1 lg:gap-1.5">
            Sifariş ver <ChevronRight size={14} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </button>
  );
}
