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

const GREEN = "#1c5e20";

const SIDEBAR_NAV = [
  { icon: Beef,          label: "Heyvan Seçimi", lines: ["Heyvan", "Seçimi"],  href: "/qurban" },
  { icon: ClipboardList, label: "Sifarişlərim",  lines: ["Sifarişlərim"],      href: "/my-orders" },
  { icon: HelpCircle,    label: "Necə işləyir",  lines: ["Necə", "İşləyir?"], href: "/how-it-works" },
  { icon: BookOpen,      label: "Qaydalar",       lines: ["Qaydalar"],          href: "/qurban-rules" },
];

function fullName(u) { return [u?.name, u?.lastName].filter(Boolean).join(" "); }
function initials(u) {
  return (fullName(u) || "?").split(" ").slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
}

export default function QurbanLayout({ children }) {
  const { user, isGuest, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const isActive = (href) => {
    if (href === "/qurban") return pathname === "/qurban" || pathname === "/qurban/";
    return pathname.startsWith(href);
  };

  return (
    <main className="bg-background p-1.5 font-sans text-foreground md:p-4 overflow-hidden" style={{ height: "100dvh" }}>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl flex h-[calc(100dvh-12px)] md:h-[calc(100dvh-32px)]">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col overflow-hidden" style={{ backgroundColor: GREEN }}>
          <div className="px-4 pb-1" style={{ paddingTop: 14 }}>
            <Link href="/"
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
            {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                  isActive(href) ? "bg-white/15 text-white font-semibold" : "text-green-100/70 hover:bg-white/5 hover:text-white"
                }`}>
                <Icon size={15} className={isActive(href) ? "text-white" : "text-green-200/60"} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* TopBar */}
          <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 border-b border-green-900/20 shrink-0"
            style={{ backgroundColor: GREEN }}>
            <div className="flex items-center gap-2 min-w-0">
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
                onClick={() => setMobileMenuOpen(true)}>
                <Menu size={18} className="text-white" />
              </button>
              <Link href="/" className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0">
                <ArrowLeft size={18} className="text-white" />
              </Link>
              <div className="flex items-center gap-2 lg:hidden shrink-0">
                <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={80} height={44}
                  style={{ height: 28, width: "auto", objectFit: "contain" }} />
              </div>
              <span className="text-[13px] md:text-[15px] font-semibold text-white line-clamp-1">
                Heyvan Seçimi
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell size={16} className="text-white" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-[#1c5e20]" />
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
                      <button
                        onClick={() => { setUserMenuOpen(false); router.push("/settings"); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <Settings size={15} /> Parametrlər
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); router.push("/"); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f20b32" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fff1f3"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
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
          <div className={`lg:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setMobileMenuOpen(false)} />

          {/* Mobile drawer — panel */}
          <div className={`lg:hidden fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ backgroundColor: GREEN }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={130} height={70}
                style={{ height: "auto", objectFit: "contain" }} />
              <button onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                    isActive(href) ? "bg-white/15 text-white font-semibold" : "text-green-100/70 hover:bg-white/10 hover:text-white"
                  }`}>
                  <Icon size={16} className={isActive(href) ? "text-white" : "text-green-200/60"} />
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
                <button onClick={() => { setMobileMenuOpen(false); router.push("/settings"); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all mb-2"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Settings size={14} /> Parametrlər
                </button>
                <button onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <LogOut size={14} /> Çıxış
                </button>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <style>{`
            .qurban-scroll::-webkit-scrollbar { width: 16px; }
            .qurban-scroll::-webkit-scrollbar-track { background: #1c5e20; border-radius: 999px; margin: 8px 0 0 0; }
            .qurban-scroll::-webkit-scrollbar-thumb { background: #6abf69; border-radius: 999px; border: 5px solid #1c5e20; background-clip: padding-box; }
            .qurban-scroll::-webkit-scrollbar-thumb:hover { background: #81c784; border: 5px solid #1c5e20; background-clip: padding-box; }
            .qurban-scroll { overflow-y: auto; scrollbar-color: #6abf69 #1c5e20; }
          `}</style>
          <div className="qurban-scroll flex-1 overflow-y-auto" style={{ marginBottom: 15 }}>
            {children}
          </div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden shrink-0 bg-white z-40" style={{ borderTop: '1px solid #f0f0f0' }}>
            <style>{`
              .qln-bar { display:flex; width:100%; padding:6px 4px 8px; }
              .qln-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:4px 2px 2px; text-decoration:none; min-width:0; }
              .qln-icon { width:42px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease; }
              .qln-tab.qln-on .qln-icon { background:#e8f5e9; }
              .qln-lbl { font-size:10px; font-weight:500; color:#a1a1aa; text-align:center; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; transition:color 0.2s ease; }
              .qln-tab.qln-on .qln-lbl { color:#1c5e20; font-weight:700; }
            `}</style>
            <div className="qln-bar">
              {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => {
                const act = isActive(href);
                return (
                  <Link key={href} href={href} className={`qln-tab${act ? ' qln-on' : ''}`}>
                    <div className="qln-icon">
                      <Icon size={19} strokeWidth={act ? 2.4 : 1.7} color={act ? '#1c5e20' : '#a1a1aa'} />
                    </div>
                    <span className="qln-lbl">{label}</span>
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
