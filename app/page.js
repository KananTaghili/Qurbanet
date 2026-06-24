"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowRight, Play, Truck, User, Menu, Video, LogOut, Settings, X,
  HeartHandshake, Beef,
} from "lucide-react";
import { PiKnifeBold } from "react-icons/pi";
import { useAuth } from "../context/AuthContext";

/* ── Slogan ────────────────────────────────────────────── */
function Slogan({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2 text-sm text-white/70" : "justify-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-white drop-shadow md:text-base md:tracking-[0.32em]"}`}>
      <span>ETİBARLI</span>
      <span className={`${compact ? "h-1.5 w-1.5" : "h-2 w-2"} shrink-0 rounded-full bg-white`} aria-hidden="true" />
      <span>HALAL</span>
      <span className={`${compact ? "h-1.5 w-1.5" : "h-2 w-2"} shrink-0 rounded-full bg-white`} aria-hidden="true" />
      <span>SÜRƏTLİ</span>
    </div>
  );
}

/* ── Payment logos ─────────────────────────────────────── */
function PaymentLogos() {
  return (
    <div className="flex items-center gap-2.5">
      {[
        ["/pay_visa.jpg", "VISA"],
        ["/pay_mastercard.jpg", "MasterCard"],
        ["/pay_maestro.jpg", "Maestro"],
      ].map(([src, alt]) => (
        <div key={alt} className="grid h-9 w-14 place-items-center overflow-hidden rounded-md bg-white p-1 shadow-sm ring-1 ring-white/20">
          <Image src={src} alt={alt} width={56} height={36} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
        </div>
      ))}
    </div>
  );
}

/* ── Video Modal ───────────────────────────────────────── */
function VideoModal({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-3xl">
        <button onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
          <X size={18} />
        </button>
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: "16/9" }}>
          {video.type === "youtube" ? (
            <iframe src={video.url} allow="autoplay; fullscreen" allowFullScreen className="h-full w-full" style={{ border: "none" }} />
          ) : (
            <video src={video.url} autoPlay controls className="h-full w-full" style={{ background: "#000" }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Service card ──────────────────────────────────────── */
const cards = [
  { title: "Qurbanlıq Sifarişi",  text: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Etibarlı və şəffaf xidmət.", color: "emerald", Icon: PiKnifeBold,    button: "SİFARİŞ ET",    href: "/qurban",  videoUrl: "https://www.youtube.com/embed/cF5NRPK49zU?autoplay=1", videoType: "youtube" },
  { title: "Kollektiv Qurban",     text: "Birlikdə qurban kəsdirək, ehtiyacı olanlara pay göndərək. Şəffaf və etibarlı xeyriyyə platforması.",       color: "violet",  Icon: HeartHandshake, button: "QOŞUL",          href: "/charity", videoUrl: "https://www.shutterstock.com/shutterstock/videos/3442647947/preview/stock-footage-close-up-of-a-man-s-hand-holding-a-cardboard-box-suggesting-a-delivery-service-in-a-nondescript.webm", videoType: "mp4" },
  { title: "Ət Satışı",            text: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.",             color: "orange",  Icon: Beef,           button: "MƏHSULLARA BAX", href: null,       videoUrl: "https://www.youtube.com/embed/7JRzuVPT5zU?autoplay=1", videoType: "youtube" },
];

const colorMap = {
  emerald: { text: "text-[#0b6c24]", border: "border-[#0b6c24]/25", bg: "bg-[#0b6c24]" },
  violet:  { text: "text-[#6820a3]", border: "border-[#6820a3]/25", bg: "bg-[#6820a3]" },
  orange:  { text: "text-[#c85a13]", border: "border-[#c85a13]/25", bg: "bg-[#c85a13]" },
};

function ServiceCard({ item, idx = 0, onPlay }) {
  const { text, border, bg } = colorMap[item.color];
  const Icon = item.Icon;
  return (
    <div className="hp-card relative mt-9" style={{ animationDelay: `${0.52 + idx * 0.13}s` }}>
      <div className="card-hover-root relative transition-transform duration-300 ease-out">
      {/* Icon — half outside top, right side */}
      <div className="absolute -top-8 right-5 z-10">
        <div className={`grid h-16 w-16 place-items-center rounded-full border-2 bg-white shadow-md ${text} ${border}`}>
          <Icon className="h-9 w-9" />
        </div>
      </div>

      <article
        className="rounded-2xl border border-border bg-white pt-3 pb-3 px-4 shadow-[0_18px_50px_rgba(35,18,8,0.10)] transition-shadow duration-300 hover:shadow-[0_26px_70px_rgba(35,18,8,0.16)]"
      >
      <h3 className={`text-left text-xl font-extrabold leading-6 pr-20 ${text}`}>{item.title}</h3>
      <div className="relative mt-2 overflow-hidden rounded-xl bg-black" style={{ height: 128 }}>
        {item.videoType === "youtube" ? (
          <iframe
            src={item.videoUrl.replace("autoplay=1", "autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0") + `&playlist=${item.videoUrl.split("/embed/")[1]?.split("?")[0]}`}
            allow="autoplay; fullscreen"
            allowFullScreen
            style={{ border: "none", pointerEvents: "none", position: "absolute", top: "50%", left: "50%", width: "178%", height: "178%", transform: "translate(-50%, -50%)" }}
          />
        ) : (
          <video
            src={item.videoUrl}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <p className="px-1 py-2 text-[12px] leading-[1.5] text-neutral-700">{item.text}</p>
      {item.href ? (
        <Link href={item.href} className={`flex w-full items-center justify-center gap-3 rounded-lg py-2.5 text-sm font-extrabold text-white ${bg} transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg active:scale-95`}>
          {item.button}<ArrowRight className="h-5 w-5" />
        </Link>
      ) : (
        <button disabled className="flex w-full items-center justify-center gap-3 rounded-lg py-2.5 text-sm font-extrabold text-white bg-neutral-300 cursor-not-allowed opacity-60">
          {item.button}<ArrowRight className="h-5 w-5" />
        </button>
      )}
      </article>
      </div>
    </div>
  );
}

/* ── User menu (logged in) ─────────────────────────────── */
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f20b32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff", letterSpacing: "1.5px", flexShrink: 0, lineHeight: 1 }}>
          {initials}
        </div>
        <span className="hidden md:inline" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{[user?.name, user?.lastName].filter(Boolean).join(" ")}</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", padding: "6px", minWidth: 180, zIndex: 100 }}>
          <button onClick={() => { setOpen(false); router.push("/settings"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Settings size={15} /> Parametrlər
          </button>
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f20b32" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff1f3"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <LogOut size={15} /> Çıxış et
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function HomePage() {
  const { user, isGuest, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const nav = [
    { label: "Haqqımızda", to: "/haqqimizda" },
    { label: "Xidmətlər",  to: "/xidmetler" },
    { label: "Necə işləyir?", to: "/nece-isleyir" },
    { label: "Əlaqə",      to: "/elaqe" },
  ];

  const handleLogout = async () => { await logout(); router.push("/"); };

  const whyItems = [
    [PiKnifeBold, "Halal Kəsim",       "Dini qaydalara uyğun peşəkar kəsim"],
    [Video,     "Video Hesabat",      "Kəsim prosesini addım-addım izləyin"],
    [Truck,     "Çatdırılma",         "Sürətli və etibarlı çatdırılma"],
    [HeartHandshake, "Şəffaf Xeyriyyə", "Hesabatlı və şəffaf paylaşım"],
  ];

  return (
    <main className="min-h-screen bg-background p-3 font-sans text-foreground md:p-7">
      <style>{`
        @keyframes hpFadeDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hpFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hpFadeIn {
          from { opacity: 0; transform: scale(0.97) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes hpSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes hpSlideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .hp-logo    { opacity:0; animation: hpSlideRight 0.42s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.05s; }
        .hp-nav     { opacity:0; animation: hpFadeDown   0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .hp-user    { opacity:0; animation: hpSlideLeft  0.42s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.08s; }
        .hp-hero    { opacity:0; animation: hpFadeIn     0.55s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.22s; }
        .hp-card    { opacity:0; animation: hpFadeUp     0.48s cubic-bezier(0.22,1,0.36,1) both; }
        .hp-why     { opacity:0; animation: hpFadeUp     0.45s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.92s; }
        .hp-footer  { opacity:0; animation: hpFadeUp     0.42s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 1.05s; }
        .hp-copy    { opacity:0; animation: hpFadeUp     0.38s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 1.15s; }

        /* card + icon lift together */
        .card-hover-root:hover { transform: translateY(-10px); }
      `}</style>

      <section className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#130807] shadow-2xl">

        {/* ── Header ── */}
        <header className="flex items-center justify-between bg-white px-6 py-2 text-neutral-950 md:px-10">
          <div className="hp-logo">
            <Image src="/meatbox logo right black.png" alt="MeatBox" width={130} height={30} style={{ objectFit: "contain", objectPosition: "left", height: 30, width: "auto" }} priority />
          </div>

          <nav className="hidden items-center gap-10 text-sm font-medium md:flex">
            {nav.map((item, i) => (
              <Link
                key={item.to}
                href={item.to}
                className={`hp-nav transition-colors hover:text-[#f20b32] ${pathname === item.to ? "text-[#f20b32] font-bold" : ""}`}
                style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              >{item.label}</Link>
            ))}
          </nav>

          <div className="hp-user flex items-center gap-4">
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
              <Link key={item.to} href={item.to} onClick={() => setMobileMenuOpen(false)} className={`py-2 text-left transition-colors hover:text-[#f20b32] ${pathname === item.to ? "text-[#f20b32] font-bold" : "text-neutral-700"}`}>{item.label}</Link>
            ))}
          </div>
        )}

        {/* ── Hero ── */}
        <div className="hp-hero relative overflow-hidden bg-[#190908] px-6 pb-11 pt-4 md:px-12 md:pb-14 md:pt-5">
          <Image src="/mb_hero_bg.jpg" alt="Hero fon" fill style={{ objectFit: "cover", objectPosition: "center 70%" }} priority />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mx-auto w-fit rounded-[2rem] bg-black/45 px-6 py-4 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm" style={{ marginTop: "-5px" }}>
              <Image
                src="/mb_logo_bottom.png"
                alt="MEATBOX loqosu"
                width={220} height={176}
                className="mx-auto h-20 w-28 object-contain drop-shadow-2xl md:h-28 md:w-36"
              />
              <div className="mt-2 flex items-center justify-center gap-3 text-white uppercase" style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontStyle: "italic", fontSize: "13px", letterSpacing: "0.22em" }}>
                <span>ETİBARLI</span>
                <span style={{ opacity: 0.6, fontSize: "16px", lineHeight: 1, fontStyle: "normal" }}>•</span>
                <span>HALAL</span>
                <span style={{ opacity: 0.6, fontSize: "16px", lineHeight: 1, fontStyle: "normal" }}>•</span>
                <span>SÜRƏTLİ</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Services ── */}
        <section className="bg-[#fbf7f2] px-6 pb-8 pt-0 md:px-12">
          {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
          <div className="grid gap-4 lg:grid-cols-3" style={{ marginTop: "-60px", position: "relative", zIndex: 10 }}>
            {cards.map((item, idx) => <ServiceCard key={item.title} item={item} idx={idx} onPlay={setActiveVideo} />)}
          </div>

          {/* Why MeatBox */}
          <div className="hp-why mt-5 rounded-2xl border border-[#ead9cf] bg-white/80 p-5">
            <h2 className="text-center text-2xl font-black">Niyə MeatBox?</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-4">
              {whyItems.map(([Icon, title, text]) => (
                <div className="flex items-center gap-3" key={title}>
                  <Icon className="h-10 w-10 text-[#0b6c24] shrink-0" />
                  <div>
                    <h4 className="font-bold">{title}</h4>
                    <p className="text-sm text-neutral-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="hp-footer grid gap-4 border-t border-white/10 bg-[#140807] px-8 py-4 text-white md:grid-cols-4 md:px-12 md:gap-6 md:py-5 items-center">
          <div>
            <Image src="/mb_logo_footer.png" alt="MeatBox footer loqo" width={160} height={40} style={{ objectFit: "contain", objectPosition: "left", height: 40, width: "auto" }} />
          </div>
          <div>
            <h4 className="font-bold">Linklər</h4>
            <div className="mt-3 flex flex-col gap-1 text-sm text-white/70">
              <span className="cursor-pointer hover:text-white transition-colors">Haqqımızda</span>
              <span className="cursor-pointer hover:text-white transition-colors">Xidmətlər</span>
              <span className="cursor-pointer hover:text-white transition-colors">Necə işləyir?</span>
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

        {/* Copyright */}
        <div className="hp-copy bg-black px-6 py-3 text-center text-xs text-white/55">
          © 2024 MeatBox.az. Bütün hüquqlar qorunur.
        </div>

      </section>
    </main>
  );
}
