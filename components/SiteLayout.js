"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { User, Menu, X, LogOut, Settings, Home, Info, LayoutGrid, HelpCircle, Phone } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const nav = [
  { label: "Haqqımızda", to: "/about" },
  { label: "Xidmətlər",  to: "/services" },
  { label: "Necə işləyir?", to: "/process" },
  { label: "Əlaqə",      to: "/contact" },
];

const mobileNav = [
  { label: "Əsas",       to: "/",         Icon: Home },
  { label: "Haqqımızda", to: "/about",    Icon: Info },
  { label: "Xidmətlər",  to: "/services", Icon: LayoutGrid },
  { label: "Necə?",      to: "/process",  Icon: HelpCircle },
  { label: "Əlaqə",      to: "/contact",  Icon: Phone },
];

/* ── UserMenu — exact copy from home page ── */
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  const initials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || user?.name?.[0]?.toUpperCase() || "?";

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f20b32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "1.5px", flexShrink: 0, lineHeight: 1 }}>
          {initials}
        </div>
        <span className="hidden lg:inline" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {[user?.name, user?.lastName].filter(Boolean).join(" ")}
        </span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", boxShadow: "0 8px 30px rgba(0,0,0,0.18)", padding: "6px", minWidth: 180, zIndex: 9999 }}>
          <button onClick={() => { setOpen(false); router.push("/settings"); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          ><Settings size={15} /> Parametrlər</button>
          <button onClick={() => { setOpen(false); onLogout(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f20b32" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff1f3"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          ><LogOut size={15} /> Çıxış et</button>
        </div>
      )}
    </div>
  );
}

function PaymentLogos() {
  return (
    <div className="flex items-center gap-2.5">
      {[["/pay_visa.jpg","VISA"],["/pay_mastercard.jpg","MasterCard"],["/pay_maestro.jpg","Maestro"]].map(([src, alt]) => (
        <div key={alt} className="grid h-9 w-14 place-items-center overflow-hidden rounded-md bg-white p-1 shadow-sm ring-1 ring-white/20">
          <Image src={src} alt={alt} width={56} height={36} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
        </div>
      ))}
    </div>
  );
}

export default function SiteLayout({ children }) {
  const { user, isGuest, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNative] = useState(() => { try { return !!Capacitor?.isNativePlatform?.(); } catch { return false; } });

  const handleLogout = async () => { await logout(); router.push("/"); };

  const profileInitials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || user?.name?.[0]?.toUpperCase() || "?";
  const profileBtn = isGuest ? (
    <Link href={`/auth/login?from=${encodeURIComponent(pathname)}`} className="flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-[#f20b32] transition-colors">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef0f2]">
        <User className="h-5 w-5" />
      </span>
      <span className="hidden lg:inline">Daxil ol</span>
    </Link>
  ) : isNative ? (
    // APK: profil → birbaşa Parametrlər (dropdown yox)
    <Link href="/settings" aria-label="Parametrlər" className="flex items-center">
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f20b32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "1.5px" }}>
        {profileInitials}
      </div>
    </Link>
  ) : (
    <UserMenu user={user} onLogout={handleLogout} />
  );

  return (
    <main className="bg-background p-0 font-sans text-foreground md:p-4 overflow-hidden" style={{ height: "100dvh" }}>
      <style>{`
        .hp-scroll::-webkit-scrollbar { width: 16px; }
        .hp-scroll::-webkit-scrollbar-track { background: #111; border-radius: 999px; margin: 8px 0 0 0; }
        .hp-scroll::-webkit-scrollbar-thumb { background: #f20b32; border-radius: 999px; border: 5px solid #111; background-clip: padding-box; }
        .hp-scroll::-webkit-scrollbar-thumb:hover { background: #d00828; border: 5px solid #111; background-clip: padding-box; }
        .hp-scroll { overflow-y: auto; scrollbar-color: #f20b32 #111; }

        /* APK (cap-native): footer + copyright gizlənir, alt boşluq silinir */
        html.cap-native .hp-footer,
        html.cap-native .hp-copy { display: none !important; }
        html.cap-native .hp-scroll { margin-bottom: 0 !important; background: #fbf7f2; }
        /* Mobil bottom nav: defolt gizli (web), yalnız APK-da görünür */
        .hp-bottom-nav { display: none; }
        html.cap-native .hp-bottom-nav { display: block; }
        /* APK: hamburger + drawer + səhifə geri düyməsi gizlənir, logo mərkəzə */
        html.cap-native .hp-hamburger,
        html.cap-native .page-back { display: none !important; }
        html.cap-native .hp-header { position: relative; }
        html.cap-native .hp-logo-box { position: absolute; left: 50%; transform: translateX(-50%); }
      `}</style>
      <section className="mx-auto max-w-7xl overflow-hidden md:rounded-[1.75rem] md:border md:border-white/15 bg-[#130807] shadow-2xl flex flex-col h-[100dvh] md:h-[calc(100dvh-32px)]">

        {/* Mobile drawer — backdrop */}
        <div
          className={`md:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Mobile drawer — panel */}
        <div
          className={`md:hidden fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "#1a0a08" }}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Image src="/mb_logo_right_white.png" alt="MeatBox" width={120} height={30}
                style={{ height: 26, width: "auto", objectFit: "contain" }} />
            </Link>
            <button onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
            {nav.map(item => (
              <Link key={item.to} href={item.to} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === item.to ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 pb-6 border-t border-white/10 pt-4">
            {isGuest ? (
              <Link href={`/auth/login?from=${encodeURIComponent(pathname)}`} onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
                style={{ background: "#f20b32" }}>
                <User size={15} /> Daxil ol
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-3 px-1 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                    {[user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"}
                  </div>
                  <span className="text-[13px] font-semibold text-white/90 truncate flex-1">
                    {[user?.name, user?.lastName].filter(Boolean).join(" ")}
                  </span>
                  <button onClick={() => { setMobileMenuOpen(false); router.push("/settings"); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 shrink-0">
                    <Settings size={16} />
                  </button>
                </div>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <LogOut size={14} /> Çıxış
                </button>
              </>
            )}
          </div>
        </div>

        {/* Header — identical to home page */}
        <header className="hp-header flex items-center justify-between bg-white px-4 text-neutral-950 md:px-10 flex-shrink-0" style={{ height: 56, zIndex: 50 }}>
          {/* Native-də sol tərəfdəki profil (yalnız APK) */}
          <span className="hp-profile-native">{profileBtn}</span>
          <div className="hp-logo-box flex items-center gap-2">
            <button className="hp-hamburger md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
              onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="ml-[6px] lg:ml-0">
              <Image src="/meatbox logo right black.png" alt="MeatBox" width={130} height={30}
                style={{ objectFit: "contain", objectPosition: "left", height: 30, width: "auto" }} priority />
            </Link>
          </div>

          <nav className="hidden items-center gap-5 lg:gap-9 text-sm font-medium md:flex">
            {nav.map(item => (
              <Link key={item.to} href={item.to}
                className={`transition-colors hover:text-[#f20b32] ${pathname === item.to ? "text-[#f20b32] font-bold" : ""}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hp-user flex items-center gap-3">
            <NotificationBell
              accentColor="#f20b32"
              ringColor="#ffffff"
              iconColor="#374151"
              hoverClass="hover:bg-black/5"
            />
            {/* Web-də sağdakı profil (APK-da gizli) */}
            <span className="hp-profile-web">{profileBtn}</span>
          </div>
        </header>

        {/* Scrollable content + footer */}
        <div className="hp-scroll flex-1 overflow-y-auto flex flex-col" style={{ marginBottom: 15 }}>

          <div className="flex-1">{children}</div>

          {/* Footer */}
          <footer className="hp-footer grid grid-cols-2 gap-4 border-t border-white/10 bg-[#140807] px-8 py-4 text-white md:grid-cols-4 md:px-12 md:gap-6 md:py-5 items-start">
            <div className="col-span-2 md:col-span-1">
              <Image src="/mb_logo_footer.png" alt="MeatBox footer" width={160} height={40}
                style={{ objectFit: "contain", objectPosition: "left", height: 40, width: "auto" }} />
            </div>
            <div>
              <h4 className="font-bold">Linklər</h4>
              <div className="mt-3 flex flex-col gap-1 text-sm text-white/70">
                {nav.map(item => (
                  <Link key={item.to} href={item.to} className="hover:text-white transition-colors">{item.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold">Əlaqə</h4>
              <div className="mt-3 text-sm text-white/70 flex flex-col gap-1">
                <a href="https://wa.me/994103990222" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors w-fit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  +994 10 399 02 22
                </a>
                <span>info@meatbox.az</span>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="mb-3 font-bold">Ödəniş üsulları</h4>
              <PaymentLogos />
            </div>
          </footer>

          <div className="hp-copy bg-black px-6 py-3 text-center text-xs text-white/55">
            © 2024 MeatBox.az. Bütün hüquqlar qorunur.
          </div>

        </div>

        {/* ── Mobil bottom nav (yalnız APK / native) ── */}
        <nav className="hp-bottom-nav flex-shrink-0 bg-white border-t border-black/10" style={{ zIndex: 50 }}>
          <div className="flex px-1 pt-1.5 pb-2">
            {mobileNav.map(({ to, label, Icon }) => {
              const cur = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
              const active = cur === to;
              return (
                <Link
                  key={to}
                  href={to}
                  className="flex-1 flex flex-col items-center gap-1 px-1 py-1 no-underline"
                  style={{ minWidth: 0 }}
                >
                  <div
                    className="flex items-center justify-center rounded-[10px] transition-colors"
                    style={{ width: 44, height: 30, background: active ? "#ffe8ec" : "transparent" }}
                  >
                    <Icon size={19} strokeWidth={active ? 2.4 : 1.7} color={active ? "#f20b32" : "#9ca3af"} />
                  </div>
                  <span
                    className="truncate"
                    style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? "#f20b32" : "#9ca3af", maxWidth: "100%", lineHeight: 1.2 }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </section>
    </main>
  );
}
