"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { User, Menu, X, LogOut, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const nav = [
  { label: "Haqqımızda", to: "/about" },
  { label: "Xidmətlər",  to: "/services" },
  { label: "Necə işləyir?", to: "/process" },
  { label: "Əlaqə",      to: "/contact" },
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
        <span className="hidden md:inline" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
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

  const handleLogout = async () => { await logout(); router.push("/"); };

  return (
    <main className="bg-background p-1.5 font-sans text-foreground md:p-4 overflow-hidden" style={{ height: "100dvh" }}>
      <style>{`
        .hp-scroll::-webkit-scrollbar { width: 16px; }
        .hp-scroll::-webkit-scrollbar-track { background: #111; border-radius: 999px; margin: 8px 0 0 0; }
        .hp-scroll::-webkit-scrollbar-thumb { background: #f20b32; border-radius: 999px; border: 5px solid #111; background-clip: padding-box; }
        .hp-scroll::-webkit-scrollbar-thumb:hover { background: #d00828; border: 5px solid #111; background-clip: padding-box; }
        .hp-scroll { overflow-y: auto; scrollbar-color: #f20b32 #111; }
      `}</style>
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#130807] shadow-2xl flex flex-col h-[calc(100dvh-12px)] md:h-[calc(100dvh-32px)]">

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
        <header className="flex items-center justify-between bg-white px-4 text-neutral-950 md:px-10 flex-shrink-0" style={{ height: 56, zIndex: 50 }}>
          <div className="flex items-center gap-2">
            <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
              onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/">
              <Image src="/meatbox logo right black.png" alt="MeatBox" width={130} height={30}
                style={{ objectFit: "contain", objectPosition: "left", height: 30, width: "auto" }} priority />
            </Link>
          </div>

          <nav className="hidden items-center gap-10 text-sm font-medium md:flex">
            {nav.map(item => (
              <Link key={item.to} href={item.to}
                className={`transition-colors hover:text-[#f20b32] ${pathname === item.to ? "text-[#f20b32] font-bold" : ""}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell
              accentColor="#f20b32"
              ringColor="#ffffff"
              iconColor="#374151"
              hoverClass="hover:bg-black/5"
            />
            {!isGuest ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <Link href={`/auth/login?from=${encodeURIComponent(pathname)}`} className="flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-[#f20b32] transition-colors">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Daxil ol</span>
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable content + footer */}
        <div className="hp-scroll flex-1 overflow-y-auto flex flex-col" style={{ marginBottom: 15 }}>

          <div className="flex-1">{children}</div>

          {/* Footer */}
          <footer className="grid grid-cols-2 gap-4 border-t border-white/10 bg-[#140807] px-8 py-4 text-white md:grid-cols-4 md:px-12 md:gap-6 md:py-5 items-start">
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
                <span>010 3990222</span>
                <span>info@meatbox.az</span>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="mb-3 font-bold">Ödəniş üsulları</h4>
              <PaymentLogos />
            </div>
          </footer>

          <div className="bg-black px-6 py-3 text-center text-xs text-white/55">
            © 2024 MeatBox.az. Bütün hüquqlar qorunur.
          </div>

        </div>
      </section>
    </main>
  );
}
