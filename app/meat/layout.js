"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Menu,
  X,
  Beef,
  ShoppingCart,
  ClipboardList,
  HelpCircle,
  LogOut,
  Settings,
  User,
  Feather,
} from "lucide-react";
import NotificationBell from "../../components/NotificationBell";
import { Capacitor } from "@capacitor/core";

const ORANGE = "#f97316";

const SIDEBAR_NAV = [
  { icon: Beef, label: "Məhsullar", lines: ["Məhsullar"], href: "/meat" },
  {
    icon: ShoppingCart,
    label: "Səbətim",
    lines: ["Səbətim"],
    href: "/meat/cart",
  },
  {
    icon: ClipboardList,
    label: "Sifarişlərim",
    lines: ["Sifarişlərim"],
    href: "/meat/orders",
  },
  {
    icon: HelpCircle,
    label: "Necə işləyir",
    lines: ["Necə", "İşləyir?"],
    href: "/meat/how-it-works",
  },
];

function fullName(u) {
  return [u?.name, u?.lastName].filter(Boolean).join(" ");
}
function initials(u) {
  return (fullName(u) || "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function MeatLayout({ children }) {
  const { user, isGuest, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => { if (Capacitor?.isNativePlatform?.()) setIsNative(true); }, []);

  const cleanPath = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const isDetailPage = cleanPath.startsWith("/meat/orders/detail");
  const showBackOnly = isNative && isDetailPage;

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const isActive = (href) => {
    if (href === "/meat")
      return pathname === "/meat" || pathname === "/meat/";
    return pathname.startsWith(href);
  };

  const nav = SIDEBAR_NAV;

  return (
    <main
      className="bg-background p-0 font-sans text-foreground md:p-4 overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <div className="mx-auto max-w-7xl overflow-hidden md:rounded-[1.75rem] md:border md:border-white/15 shadow-2xl flex h-[100dvh] md:h-[calc(100dvh-32px)]">
        {/* ── Desktop Sidebar ── */}
        <aside
          className="hidden lg:flex w-56 shrink-0 flex-col overflow-hidden relative"
          style={{ backgroundColor: ORANGE }}
        >
          {/* Back button — absolute at top, overlays logo */}
          <Link
            href="/"
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-1.5 text-[11px] font-bold hover:opacity-90 active:scale-[.98] transition-all"
            style={{
              color: "#fff",
              background: "#e02020",
              borderRadius: "0 0 10px 10px",
              letterSpacing: "0.02em",
              height: 30,
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            MeatBox Xidmətlərinə Keç
          </Link>
          <div className="flex justify-center pb-4" style={{ paddingTop: 46 }}>
            <Link href="/meat" className="relative block" style={{ width: 160 }}>
              <div className="absolute -top-3 -right-3 z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-[#f97316]/30 bg-white shadow-lg">
                <Beef className="h-7 w-7 text-[#f97316]" />
              </div>
              <Image
                src="/mb_logo_bottom_slogan.png"
                alt="MeatBox"
                width={160}
                height={88}
                style={{ width: 160, height: "auto", objectFit: "contain" }}
                priority
              />
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {nav.map(({ icon: Icon, label, href }) => {
              const guestBlock = isGuest && (href === "/meat/cart" || href === "/meat/orders");
              return guestBlock ? (
                <button
                  key={href}
                  onClick={() => router.push(`/auth/login?from=${encodeURIComponent(pathname)}`)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all text-white/85 hover:bg-white/5 hover:text-white"
                >
                  <Icon size={15} className="text-white/75" />
                  {label}
                </button>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                    isActive(href)
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/85 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={15} className={isActive(href) ? "text-white" : "text-white/75"} />
                  {label}
                </Link>
              );
            })}
          </nav>
          {/* Tagline box */}
          <div className="shrink-0 mx-3 mb-3 mt-2">
            <div className="flex items-start gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Feather className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold leading-relaxed text-white/80 italic flex-1">
                Təzə və keyfiyyətli ət məhsulları, sürətli çatdırılma ilə qapınızda.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TopBar */}
          <div
            className={`flex items-center justify-between gap-2 px-3 md:px-6 border-b border-orange-900/20 shrink-0 ${showBackOnly ? "topbar-detail" : ""}`}
            style={{
              backgroundColor: ORANGE,
              height: 50,
              minHeight: 50,
              maxHeight: 50,
            }}
          >
            {/* APK detal: yalnız geri ox */}
            <button
              onClick={() => router.push("/meat/orders")}
              className="tb-back w-8 h-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="tb-full flex items-center gap-2 min-w-0">
              <button
                className="nav-hamburger lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={18} className="text-white" />
              </button>
              <Link
                href="/"
                className="nav-home-btn items-center gap-1.5 shrink-0 rounded-full h-8 pl-2 pr-3 text-white text-[12px] font-semibold active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)" }}
              >
                <ArrowLeft size={15} strokeWidth={2.5} /> Xidmətlər
              </Link>
              <span className="text-[13px] md:text-[15px] font-semibold text-white line-clamp-1">
                Ət Satışı
              </span>
            </div>
            <div className="tb-full flex items-center gap-3 shrink-0">
              <NotificationBell accentColor="#f97316" ringColor="#f97316" />
              {isGuest ? (
                <Link
                  href={`/auth/login?from=${encodeURIComponent(pathname)}`}
                  className="flex items-center gap-2 text-[13px] font-semibold text-white hover:text-white/70 transition-colors"
                >
                  <User size={16} /> Daxil ol
                </Link>
              ) : (
                <div ref={userMenuRef} className="block relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 cursor-pointer bg-transparent border-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
                      {initials(user)}
                    </div>
                    <span className="hidden sm:inline text-[12px] font-semibold text-white/90 max-w-[120px] truncate">
                      {fullName(user)}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
                        padding: "6px",
                        minWidth: 180,
                        zIndex: 9999,
                      }}
                    >
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push("/settings");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <Settings size={15} /> Parametrlər
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          router.push("/");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#f20b32",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fff1f3")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <LogOut size={15} /> Çıxış et
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile drawer — backdrop */}
          <div
            className={`lg:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile drawer — panel */}
          <div
            className={`lg:hidden fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ backgroundColor: ORANGE }}
          >
            {/* MeatBox back button — flush top */}
            <Link href="/" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 shrink-0 text-[11px] font-bold hover:opacity-90 active:scale-[.98] transition-all"
              style={{ color:"#fff", background:"#e02020", borderRadius:"0 0 10px 10px", letterSpacing:"0.02em", height: 36 }}>
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              MeatBox Xidmətlərinə Keç
            </Link>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <Link href="/meat" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src="/mb_logo_bottom_slogan.png"
                  alt="MeatBox"
                  width={130}
                  height={70}
                  style={{ height: "auto", objectFit: "contain" }}
                />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {nav.map(({ icon: Icon, label, href }) => {
                const guestBlock = isGuest && (href === "/meat/cart" || href === "/meat/orders");
                return guestBlock ? (
                  <button
                    key={href}
                    onClick={() => { setMobileMenuOpen(false); router.push(`/auth/login?from=${encodeURIComponent(pathname)}`); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <Icon size={16} className="text-white/75" />
                    {label}
                  </button>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                      isActive(href)
                        ? "bg-white/15 text-white font-semibold"
                        : "text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={16} className={isActive(href) ? "text-white" : "text-white/75"} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            {/* Tagline box */}
            <div className="mx-3 mb-3 mt-2">
              <div className="flex items-start gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Feather className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold leading-relaxed text-white/80 italic flex-1">
                  Təzə və keyfiyyətli ət məhsulları, sürətli çatdırılma ilə qapınızda.
                </p>
              </div>
            </div>
            {!isGuest && (
              <div className="px-4 pb-6 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3 px-1 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                    {initials(user)}
                  </div>
                  <span className="text-[13px] font-semibold text-white/90 truncate flex-1">
                    {fullName(user)}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/settings");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 shrink-0"
                  >
                    <Settings size={16} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <LogOut size={14} /> Çıxış
                </button>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <style>{`
            .meat-scroll::-webkit-scrollbar { width: 16px; }
            .meat-scroll::-webkit-scrollbar-track { background: #f97316; border-radius: 999px; margin: 8px 0 0 0; }
            .meat-scroll::-webkit-scrollbar-thumb { background: #fdba74; border-radius: 999px; border: 5px solid #f97316; background-clip: padding-box; }
            .meat-scroll::-webkit-scrollbar-thumb:hover { background: #fed7aa; border: 5px solid #f97316; background-clip: padding-box; }
            .meat-scroll { overflow-y: auto; scrollbar-color: #fdba74 #f97316; }
          `}</style>
          <div
            className="meat-scroll flex-1 overflow-y-auto"
          >
            {children}
          </div>

          {/* Mobile bottom nav */}
          <nav
            className="lg:hidden shrink-0 bg-white z-40"
            style={{ borderTop: "1px solid #f0f0f0" }}
          >
            <style>{`
              .mln-bar { display:flex; width:100%; padding:6px 4px 8px; }
              .mln-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:4px 2px 2px; text-decoration:none; min-width:0; }
              .mln-icon { width:42px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease; }
              .mln-tab.mln-on .mln-icon { background:#ffedd5; }
              .mln-lbl { font-size:10px; font-weight:500; color:#a1a1aa; text-align:center; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; transition:color 0.2s ease; }
              .mln-tab.mln-on .mln-lbl { color:#f97316; font-weight:700; }
            `}</style>
            <div className="mln-bar">
              {nav.map(({ icon: Icon, label, mobileLabel, href }) => {
                const act = isActive(href);
                const guestBlock = isGuest && (href === "/meat/cart" || href === "/meat/orders");
                const displayLabel = mobileLabel || label;
                return guestBlock ? (
                  <button
                    key={href}
                    onClick={() => router.push(`/auth/login?from=${encodeURIComponent(pathname)}`)}
                    className="mln-tab"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <div className="mln-icon">
                      <Icon size={19} strokeWidth={1.7} color="#a1a1aa" />
                    </div>
                    <span className="mln-lbl">{displayLabel}</span>
                  </button>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    className={`mln-tab${act ? " mln-on" : ""}`}
                  >
                    <div className="mln-icon">
                      <Icon size={19} strokeWidth={act ? 2.4 : 1.7} color={act ? "#f97316" : "#a1a1aa"} />
                    </div>
                    <span className="mln-lbl">{displayLabel}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </main>
  );
}
