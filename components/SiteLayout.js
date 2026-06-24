"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { User, Menu, X, LogOut, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const nav = [
  { label: "Haqqımızda", to: "/haqqimizda" },
  { label: "Xidmətlər",  to: "/xidmetler" },
  { label: "Necə işləyir?", to: "/nece-isleyir" },
  { label: "Əlaqə",      to: "/elaqe" },
];

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  const initials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f20b32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "1.5px" }}>
          {initials}
        </div>
        <span className="hidden md:inline" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {[user?.name, user?.lastName].filter(Boolean).join(" ")}
        </span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", padding: "6px", minWidth: 180, zIndex: 100 }}>
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

function Slogan({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2 text-sm text-white/70" : "justify-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-white drop-shadow md:text-base md:tracking-[0.32em]"}`}>
      <span>ETİBARLI</span>
      <span className={`${compact ? "h-1.5 w-1.5" : "h-2 w-2"} shrink-0 rounded-full bg-white`} />
      <span>HALAL</span>
      <span className={`${compact ? "h-1.5 w-1.5" : "h-2 w-2"} shrink-0 rounded-full bg-white`} />
      <span>SÜRƏTLİ</span>
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
    <main className="min-h-screen bg-background p-3 font-sans text-foreground md:p-7">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#130807] shadow-2xl">

        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-2.5 text-neutral-950 md:px-10">
          <Link href="/">
            <Image src="/meatbox logo right black.png" alt="MeatBox" width={208} height={48} style={{ objectFit: "contain", objectPosition: "left", height: 48, width: "auto" }} priority />
          </Link>

          <nav className="hidden items-center gap-10 text-sm font-medium md:flex">
            {nav.map(item => (
              <Link key={item.to} href={item.to}
                className={`transition hover:text-[#f20b32] ${pathname === item.to ? "text-[#f20b32] font-bold" : ""}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {!isGuest ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <Link href="/auth/login" className="flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-[#f20b32] transition-colors">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Daxil ol</span>
              </Link>
            )}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="flex flex-col gap-1 bg-white px-6 pb-4 text-sm font-medium md:hidden">
            {nav.map(item => (
              <Link key={item.to} href={item.to} onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-left transition-colors hover:text-[#f20b32] ${pathname === item.to ? "text-[#f20b32] font-bold" : "text-neutral-700"}`}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Page content */}
        {children}

        {/* Footer */}
        <footer className="grid gap-4 border-t border-white/10 bg-[#140807] px-8 py-4 text-white md:grid-cols-4 md:px-12 md:gap-6 md:py-5 items-center">
          <div>
            <Image src="/mb_logo_footer.png" alt="MeatBox footer" width={200} height={56} style={{ objectFit: "contain", objectPosition: "left", height: 56, width: "auto" }} />
          </div>
          <div>
            <h4 className="font-bold">Linklər</h4>
            <div className="mt-3 flex flex-col gap-1 text-sm text-white/70">
              {nav.slice(0, 3).map(item => (
                <Link key={item.to} href={item.to} className="hover:text-white transition-colors">{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold">Əlaqə</h4>
            <div className="mt-3 text-sm text-white/70 flex flex-col gap-1">
              <span>+994 50 123 44 55</span>
              <span>info@meatbox.az</span>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-bold">Ödəniş üsulları</h4>
            <PaymentLogos />
          </div>
        </footer>

        <div className="bg-black px-6 py-3 text-center text-xs text-white/55">
          © 2024 MeatBox.az. Bütün hüquqlar qorunur.
        </div>

      </section>
    </main>
  );
}
