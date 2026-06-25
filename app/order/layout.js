"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft, Menu, X, Beef, ClipboardList, Bell, HelpCircle, BookOpen, LogOut, Settings,
} from "lucide-react";
import { PiKnifeBold } from "react-icons/pi";
import { MobileMenuProvider, useMobileMenu } from "../../context/MobileMenuContext";

const GREEN = "#1c5e20";

const SIDEBAR_NAV = [
  { icon: Beef,          label: "Əsas",           href: "/qurban" },
  { icon: ClipboardList, label: "Sifarişlərim",  href: "/my-orders" },
  { icon: HelpCircle,    label: "Necə işləyir",  href: "/how-it-works" },
  { icon: BookOpen,      label: "Qaydalar",       href: "/qurban-rules" },
];

const PAGE_TITLES = {
  "/order/quantity":     "Miqdar seçin",
  "/order/distribution": "Çatdırılma seçin",
  "/order/contact":      "Əlaqə məlumatları",
  "/order/summary":      "Sifariş xülasəsi",
  "/order/payment":      "Ödəniş",
};

const BACK_ROUTES = {
  "/order/quantity":     "/qurban",
  "/order/distribution": "/order/quantity",
  "/order/contact":      "/order/distribution",
  "/order/summary":      "/order/distribution",
  "/order/payment":      "/order/summary",
};

function fullName(u) { return [u?.name, u?.lastName].filter(Boolean).join(" "); }
function initials(u) { return (fullName(u) || "?").split(" ").slice(0, 2).map(p => p[0]?.toUpperCase()).join(""); }

function InnerLayout({ children }) {
  const { user, isGuest, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { open: mobileMenuOpen, openMenu, closeMenu } = useMobileMenu();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const pageTitle = PAGE_TITLES[pathname] || "Sifariş";
  const backTo = BACK_ROUTES[pathname] || "/qurban";

  return (
    <main className="bg-background p-1.5 font-sans text-foreground md:p-4 overflow-hidden" style={{ height: "100dvh" }}>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl flex h-[calc(100dvh-12px)] md:h-[calc(100dvh-32px)]">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col overflow-hidden" style={{ backgroundColor: GREEN }}>
          <div className="px-4 pb-1" style={{ paddingTop: 14 }}>
            <Link href={backTo}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 text-white shadow hover:bg-white/20 transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="flex justify-center pb-4" style={{ marginTop: -1 }}>
            <div className="relative" style={{ width: 160 }}>
              <div className="absolute -top-3 -right-3 z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-[#1c5e20]/30 bg-white shadow-lg">
                <PiKnifeBold className="h-7 w-7 text-[#1c5e20]" />
              </div>
              <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={160} height={88}
                style={{ width: 160, height: "auto", objectFit: "contain" }} priority />
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => {
              const active = href === "/qurban"; // order flow = heyvan seçimi aktiv
              return (
                <Link key={href} href={href}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                    active ? "bg-white/15 text-white font-semibold" : "text-green-100/70 hover:bg-white/5 hover:text-white"
                  }`}>
                  <Icon size={15} className={active ? "text-white" : "text-green-200/60"} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* TopBar */}
          <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 shrink-0"
            style={{ backgroundColor: GREEN }}>
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile: menu + back + logo */}
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
                onClick={openMenu}>
                <Menu size={18} className="text-white" />
              </button>
              <button onClick={() => router.push(backTo)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0">
                <ArrowLeft size={18} className="text-white" />
              </button>
              <div className="flex items-center gap-2 lg:hidden shrink-0">
                <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={80} height={44}
                  style={{ height: 28, width: "auto", objectFit: "contain" }} />
              </div>
              <span className="text-[13px] md:text-[15px] font-semibold text-white line-clamp-1">
                {pageTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell size={16} className="text-white" />
              </button>
              {isGuest ? (
                <Link href="/auth/login"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#1c5e20] text-[12px] font-semibold hover:bg-green-50 transition-all shadow-sm">
                  Daxil ol
                </Link>
              ) : (
                <div ref={userMenuRef} className="hidden sm:block relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
                      {initials(user)}
                    </div>
                    <span className="text-[12px] font-semibold text-white/90 max-w-[120px] truncate">{fullName(user)}</span>
                  </button>
                  {userMenuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", boxShadow: "0 8px 30px rgba(0,0,0,0.18)", padding: "6px", minWidth: 180, zIndex: 9999 }}>
                      <button onClick={() => { setUserMenuOpen(false); router.push("/settings"); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <Settings size={15} /> Parametrlər
                      </button>
                      <button onClick={() => { setUserMenuOpen(false); logout(); router.push("/"); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f20b32" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fff1f3"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <LogOut size={15} /> Çıxış et
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile drawer backdrop */}
          <div className={`lg:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={closeMenu} />

          {/* Mobile drawer panel */}
          <div className={`lg:hidden fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ backgroundColor: GREEN }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={130} height={70}
                style={{ height: "auto", objectFit: "contain" }} />
              <button onClick={closeMenu}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-green-100/70 hover:bg-white/10 hover:text-white">
                  <Icon size={16} className="text-green-200/60" />
                  {label}
                </Link>
              ))}
            </nav>
            {!isGuest && (
              <div className="px-4 pb-6 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3 px-1 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                    {initials(user)}
                  </div>
                  <span className="text-[13px] font-semibold text-white/90 truncate">{fullName(user)}</span>
                </div>
                <button onClick={() => { closeMenu(); logout(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <LogOut size={14} /> Çıxış
                </button>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <style>{`
            .order-scroll::-webkit-scrollbar { width: 16px; }
            .order-scroll::-webkit-scrollbar-track { background: #1c5e20; border-radius: 999px; margin: 8px 0 0 0; }
            .order-scroll::-webkit-scrollbar-thumb { background: #6abf69; border-radius: 999px; border: 5px solid #1c5e20; background-clip: padding-box; }
            .order-scroll::-webkit-scrollbar-thumb:hover { background: #81c784; border: 5px solid #1c5e20; background-clip: padding-box; }
            .order-scroll { overflow-y: auto; scrollbar-color: #6abf69 #1c5e20; }
          `}</style>
          <div className="order-scroll flex-1 overflow-y-auto min-h-0" style={{ marginBottom: 15 }}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderLayout({ children }) {
  return (
    <MobileMenuProvider>
      <InnerLayout>{children}</InnerLayout>
    </MobileMenuProvider>
  );
}
