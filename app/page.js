"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useOrder } from "../context/OrderContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { t, animalName } from "../lib/i18n";
import api, { BASE_URL } from "../lib/api";
import { useRef } from "react";
import {
  Truck,
  CheckCircle,
  Video,
  LogIn,
  LogOut,
  UserPlus,
  MoreVertical,
  Loader2,
  ChevronRight,
  Globe,
  Settings,
  Phone,
  Mail,
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
  // ends in 00 — check hundreds
  return "dən"; // yüz → always front vowel
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
  // AZ — always "-dən" because suffix follows "AZN" not the number
  return (
    <>
      {price} AZN
      <span className="text-[11px] xs:text-xs font-semibold text-text-secondary ml-1">
        -dən
      </span>
    </>
  );
}

function LanguageSelect({ lang, setLang, dark }) {
  return (
    <div className="relative flex-shrink-0">
      <Globe
        size={13}
        className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: dark ? "rgba(255,255,255,0.7)" : BRAND }}
      />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="appearance-none pl-6 pr-5 py-1 text-[11px] font-bold rounded-lg border-none outline-none cursor-pointer transition-all"
        style={{
          background: dark ? "rgba(255,255,255,0.15)" : "var(--primary-surface)",
          color: dark ? "#fff" : BRAND,
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} style={{ color: "#000", background: "#fff" }}>
            {l.label}
          </option>
        ))}
      </select>
      <ChevronRight
        size={10}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
        style={{ color: dark ? "rgba(255,255,255,0.7)" : BRAND }}
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, isGuest, logout, isLoading } = useAuth();
  const { clearOrder } = useOrder();
  const { lang, setLang, multiLanguageEnabled } = useLanguage();
  const [animals, setAnimals] = useState([]);
  const [deliveryWindows, setDeliveryWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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

  const handleLogout = async () => {
    setMenuOpen(false);
    if (confirm(t(lang, 'confirmLogout'))) await logout();
  };

  if (isLoading) return <LoadingSplash />;

  const FEATURES = [
    { Icon: Truck,        labelKey: "homeFeatureDelivery", subKey: "homeFeatureDeliverySub" },
    { Icon: CheckCircle,  labelKey: "homeFeatureHalal",    subKey: "homeFeatureHalalSub" },
    { Icon: Video,        labelKey: "homeFeatureVideo",    subKey: "homeFeatureVideoSub" },
  ];

  return (
    <div className="flex flex-col flex-1 bg-bg min-h-screen w-full">
      {/* ══════════════════════════════════════════════
          MOBILE HEADER  (< md: 0–767px)
          ══════════════════════════════════════════════ */}
      <div
        className="
          md:hidden
          w-full bg-primary
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
              <Image src="/logo.png" alt="QurbanEt" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div
                style={{ color: "white", letterSpacing: "-0.3px", lineHeight: 1.15 }}
                className="text-lg xs:text-xl sm:text-[22px] font-black italic truncate"
              >
                Qurban<span style={{ color: "#86efac" }}>Et</span>
              </div>
              <div className="text-[8px] xs:text-[9px] sm:text-[10px] text-white/60 font-semibold tracking-widest truncate">
                {t(lang, 'homeSubtitle')}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language select (mobile) */}
            {multiLanguageEnabled && <LanguageSelect lang={lang} setLang={setLang} dark />}

            {!isGuest ? (
              /* ── Logged-in: avatar + name → dropdown modal ── */
              <div ref={menuRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="flex items-center gap-1.5 rounded-2xl px-2 py-1 active:bg-white/10 transition-colors"
                  aria-label="Hesab"
                >
                  <Settings size={16} color="white" strokeWidth={2} className="flex-shrink-0" />
                  <div
                    className="w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.18)" }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-xs font-bold text-white/90 max-w-[72px] truncate">
                    {user?.name?.split(" ")[0]}
                  </span>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} />
                    <div
                      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-2xl overflow-hidden w-[calc(100vw-40px)] max-w-[280px]"
                      style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.22)", border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0" style={{ background: "#1b5e20" }}>
                          {user?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">
                            {[user?.name, user?.lastName].filter(Boolean).join(" ")}
                          </div>
                          {(user?.phone || user?.email) && (
                            <div className="text-xs text-slate-400 truncate">{user.phone || user.email}</div>
                          )}
                        </div>
                      </div>
                      {/* Settings */}
                      <button
                        onClick={() => { setMenuOpen(false); router.push("/settings"); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left border-none bg-transparent active:bg-slate-50"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#e8f5e9" }}>
                          <Settings size={15} style={{ color: "#1b5e20" }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Parametrlər</span>
                      </button>
                      {/* Contact — mobile modal only */}
                      <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />
                      <div className="px-4 pt-2.5 pb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bizimlə Əlaqə</p>
                      </div>
                      <div className="mx-3 mb-2 border border-slate-100 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#e8f5e9" }}>
                            <Phone size={13} style={{ color: "#1b5e20" }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">+994 10 399 0222</span>
                        </div>
                        <div style={{ height: 1, background: "#f1f5f9" }} />
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#e8f5e9" }}>
                            <Mail size={13} style={{ color: "#1b5e20" }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">info@qurbanet.az</span>
                        </div>
                      </div>
                      <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />
                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left border-none bg-transparent active:bg-red-50"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fee2e2" }}>
                          <LogOut size={15} style={{ color: "#ef4444" }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>{t(lang, 'logout')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── Guest: login/register menu ── */
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
                  aria-label="Menyu"
                >
                  <MoreVertical size={22} color="white" strokeWidth={2} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-11 bg-surface rounded-xl shadow-card-lg border border-border z-50 min-w-[160px] py-1 overflow-hidden">
                      <button
                        onClick={() => { setMenuOpen(false); router.push("/auth/login"); }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-primary flex items-center gap-2 active:bg-primary-surface"
                      >
                        <LogIn size={15} color={BRAND} strokeWidth={2} />
                        {t(lang, 'login')}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); router.push("/auth/register"); }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-primary flex items-center gap-2 active:bg-primary-surface border-t border-border"
                      >
                        <UserPlus size={15} color={BRAND} strokeWidth={2} />
                        {t(lang, 'register')}
                      </button>
                    </div>
                  </>
                )}
              </div>
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
          <EmptyState lang={lang} />
        ) : (
          <div className="flex flex-col gap-2.5 xs:gap-3 sm:gap-4">
            {animals.map((a) => (
              <MobileAnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} lang={lang} />
            ))}
          </div>
        )}

        {/* Feature strips - mobile bottom */}
        {!loading && animals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {FEATURES.map(({ Icon, labelKey, subKey }) => (
              <div
                key={labelKey}
                className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-3 py-2.5 shadow-card"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Icon size={18} color={BRAND} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-text-primary">
                    {t(lang, labelKey)}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {t(lang, subKey)}
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
        className="hidden md:flex items-center justify-between"
        style={{
          background: "var(--primary)",
          height: "var(--topbar-h)",
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 99,
          paddingLeft: "calc(var(--sidebar-w) + 28px)",
          paddingRight: 20,
        }}
      >
        <h1 className="text-base font-extrabold tracking-tight text-white">
          {t(lang, 'animalSelection')}
        </h1>

        {/* Right: contact info + lang + user info */}
        <div className="flex items-center gap-4">
          {/* Contact info */}
          <div className="hidden md:flex flex-col lg:flex-row items-start lg:items-center gap-0.5 lg:gap-3 mr-1">
            <div className="flex items-center gap-1">
              <Phone size={11} style={{ color: "#86efac", flexShrink: 0 }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                +994 10 399 0222
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Mail size={11} style={{ color: "#86efac", flexShrink: 0 }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                info@qurbanet.az
              </span>
            </div>
          </div>
          {multiLanguageEnabled && <LanguageSelect lang={lang} setLang={setLang} dark />}

          {isGuest ? (
            <button
              onClick={() => router.push('/auth/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <LogIn size={14} strokeWidth={2.5} />
              Daxil ol
            </button>
          ) : (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 min-w-0 cursor-pointer rounded-xl px-1.5 py-1 transition-colors hover:bg-white/10"
              >
                <Settings size={18} color="white" strokeWidth={2} className="flex-shrink-0" />
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-semibold text-white/80">
                  {[user?.name, user?.lastName].filter(Boolean).join(' ')}
                </span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50"
                  style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.07)', minWidth: 210 }}
                >
                  {/* User info */}
                  <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0" style={{ background: '#1b5e20' }}>
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {[user?.name, user?.lastName].filter(Boolean).join(' ')}
                      </div>
                      {(user?.phone || user?.email) && (
                        <div className="text-xs text-slate-400 truncate">{user.phone || user.email}</div>
                      )}
                    </div>
                  </div>
                  {/* Settings */}
                  <button
                    onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-none bg-transparent transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e8f5e9' }}>
                      <Settings size={15} style={{ color: '#1b5e20' }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Parametrlər</span>
                  </button>
                  <div style={{ height: 1, background: '#f1f5f9', margin: '0 12px' }} />
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-none bg-transparent transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fee2e2' }}>
                      <LogOut size={15} style={{ color: '#ef4444' }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>{t(lang, 'logout')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP / TABLET LAYOUT  (md+: 768px+)
          ══════════════════════════════════════════════ */}
      <div
        className="hidden md:flex flex-col w-full gap-4 lg:gap-5 xl:gap-6 pb-5 md:pb-6 lg:pb-8"
        style={{ paddingTop: "calc(var(--topbar-h) + 12px)", paddingLeft: 28, paddingRight: 28 }}
      >
        {/* Grid */}
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

        {/* Feature strips */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-1 lg:mt-2">
          {FEATURES.map(({ Icon, labelKey, subKey }) => (
            <div
              key={labelKey}
              className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
                <Icon size={20} color={BRAND} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-text-primary">
                  {t(lang, labelKey)}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {t(lang, subKey)}
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


function CowHoofIcon({ size = 56, color = '#166534' }) {
  // Hər dırnaq: 2 barmaq (oval), bir az açılı
  // Sol ayaq: yuxarı-sol; Sağ ayaq: aşağı-sağ; hər ikisi 45° sola
  const hoof = (cx, cy, angle) => (
    <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
      <ellipse cx="-7" cy="0" rx="5.5" ry="12" />
      <ellipse cx="7"  cy="0" rx="5.5" ry="12" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill={color} xmlns="http://www.w3.org/2000/svg">
      {hoof(32, 28, -45)}
      {hoof(62, 68, -45)}
    </svg>
  );
}

function EmptyState({ lang }) {
  return (
    <div className="flex flex-col items-center py-16 md:py-20 lg:py-24 gap-3 text-center px-6 md:px-8 w-full col-span-full">
      <CowHoofIcon size={56} color={BRAND} />
      <div className="font-bold text-text-primary text-sm md:text-base">
        {t(lang, 'outOfStock')}
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
      {/* Image */}
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
          <CowHoofIcon size={48} color={BRAND} />
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
          <CowHoofIcon size={56} color={BRAND} />
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
