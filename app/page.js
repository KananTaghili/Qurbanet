"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Video,
  Truck,
  Heart,
  Phone,
  Mail,
  User,
  Menu,
  X,
  Play,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { PiKnife } from "react-icons/pi";
import { TbMeat, TbHeartHandshake } from "react-icons/tb";

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  green:       "#1B5E20",
  greenLight:  "#2E7D32",
  greenSurface:"#E8F5E9",
  purple:      "#6B21A8",
  purpleLight: "#7C3AED",
  red:         "#B91C1C",
  redLight:    "#DC2626",
  text:        "#111827",
  muted:       "#6B7280",
  border:      "#EAECF0",
};

/* ─── Services data ──────────────────────────────────────────── */
const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    desc: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdəkindən çıxmadan etibarlı xidmət.",
    href: "/qurban",
    color: C.green,
    btn: C.greenLight,
    btnShadow: "0 6px 18px -4px rgba(27,94,32,0.5)",
    btnLabel: "Sifariş Et",
    Icon: PiKnife,
    iconRingColor: "#A7F3D0",
    iconBgColor: C.greenSurface,
    thumbGradient: "linear-gradient(135deg,#bbf7d0 0%,#4ade80 45%,#15803d 100%)",
    disabled: false,
    videoUrl: "https://www.youtube.com/embed/cF5NRPK49zU?autoplay=1",
    videoType: "youtube",
  },
  {
    id: "xeyriyye",
    title: "Kollektiv Qurban-Xeyriyyə Platforması",
    desc: "Birlikdə qurban kəsdirik, ehtiyacı olanlara pay göndəririk. Şəffaf və etibarlı xeyriyyə platformasına qoşulun.",
    href: "/charity",
    color: C.purple,
    btn: C.purpleLight,
    btnShadow: "0 6px 18px -4px rgba(109,33,168,0.5)",
    btnLabel: "Qoşul",
    Icon: TbHeartHandshake,
    iconRingColor: "#DDD6FE",
    iconBgColor: "#F5F3FF",
    thumbGradient: "linear-gradient(135deg,#ede9fe 0%,#a78bfa 45%,#6d28d9 100%)",
    disabled: true,
    videoUrl: "https://www.shutterstock.com/shutterstock/videos/3442647947/preview/stock-footage-close-up-of-a-man-s-hand-holding-a-cardboard-box-suggesting-a-delivery-service-in-a-nondescript.webm",
    videoType: "mp4",
  },
  {
    id: "et",
    title: "Ət Sifarişi",
    desc: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdırırıq.",
    href: "#",
    color: C.red,
    btn: C.redLight,
    btnShadow: "0 6px 18px -4px rgba(185,28,28,0.5)",
    btnLabel: "Məhsullara Bax",
    Icon: TbMeat,
    iconRingColor: "#FECACA",
    iconBgColor: "#FEF2F2",
    thumbGradient: "linear-gradient(135deg,#fecdd3 0%,#f87171 45%,#b91c1c 100%)",
    disabled: true,
    videoUrl: "https://www.youtube.com/embed/7JRzuVPT5zU?autoplay=1",
    videoType: "youtube",
  },
];

const WHY = [
  { Icon: ShieldCheck, label: "Halal Kəsim",     desc: "Dini qaydalara uyğun peşəkar kəsim" },
  { Icon: Video,       label: "Video Hesabat",    desc: "Kəsim prosesini addım-addım izləyin" },
  { Icon: Truck,       label: "Çatdırılma",       desc: "Sürətli və etibarlı çatdırılma" },
  { Icon: Heart,       label: "Şəffaf Xeyriyyə",  desc: "Hər qəpiyin hesabatı, şəffaf pay bölgüsü" },
];

/* ─── Video Modal ────────────────────────────────────────────── */
function VideoModal({ video, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: "16/9" }}>
          {video.type === "youtube" ? (
            <iframe
              src={video.url}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="h-full w-full"
              style={{ border: "none" }}
            />
          ) : (
            <video src={video.url} autoPlay controls className="h-full w-full" style={{ background: "#000" }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE LAYOUT
═══════════════════════════════════════════════════════════════ */

/* Mobile Header */
function MobileHeader() {
  const [open, setOpen] = useState(false);
  const navLinks = ["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"];
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <button className="p-1 text-gray-700" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Centered logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 overflow-hidden rounded-lg border border-gray-200">
              <Image src="/logo_test.png" alt="MeatBox" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <div className="font-extrabold text-[15px] text-gray-900 tracking-tight">
                MEAT<span style={{ color: C.green }}>BOX</span>.AZ
              </div>
              <div className="text-[9px] text-gray-500 font-medium">
                Qurbanlıq · Xeyriyyə · Təzə Ət
              </div>
            </div>
          </Link>

          <Link href="/auth/login" className="p-1 text-gray-700">
            <User size={20} />
          </Link>
        </div>

        {open && (
          <div className="border-t border-gray-100 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a key={l} href="#" onClick={() => setOpen(false)}
                className="text-sm font-semibold text-gray-700 py-2.5 px-1 border-b border-gray-50 last:border-0">
                {l}
              </a>
            ))}
            <div className="flex gap-2 pt-3">
              <Link href="/auth/login" onClick={() => setOpen(false)}
                className="flex-1 text-center py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800">
                Daxil ol
              </Link>
              <Link href="/auth/register" onClick={() => setOpen(false)}
                className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: C.green }}>
                Qeydiyyat
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* Mobile Service Cards — horizontal photo-style */
function MobileServicesSection({ onPlay }) {
  return (
    <section className="px-3 pt-4 pb-6 flex flex-col gap-4">
      {SERVICES.map((s) => {
        const ytId = s.videoType === "youtube" ? s.videoUrl.split("/embed/")[1]?.split("?")[0] : null;

        const inner = (
          <div
            className="relative rounded-2xl overflow-hidden shadow-md"
            style={{ height: 150, background: s.thumbGradient }}
          >
            {/* White left overlay for text readability */}
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 38%, rgba(255,255,255,0.45) 58%, rgba(255,255,255,0) 76%)",
              }}
            />

            {/* Left text area */}
            <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-between p-3.5 w-[57%]">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <s.Icon size={16} color={s.color} />
                  <h3 className="text-[12.5px] font-bold leading-tight" style={{ color: s.color }}>
                    {s.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-[10px] leading-relaxed line-clamp-3">
                  {s.desc}
                </p>
              </div>

              <div
                className="flex items-center gap-1 self-start px-3 py-1.5 rounded-xl text-[11px] font-bold text-white"
                style={{
                  background: s.disabled ? "#9CA3AF" : s.btn,
                  boxShadow: s.disabled ? "none" : s.btnShadow,
                  opacity: s.disabled ? 0.6 : 1,
                }}
              >
                {s.btnLabel}
                <ArrowRight size={11} strokeWidth={2.5} />
              </div>
            </div>

            {/* Play button */}
            <button
              className="absolute z-20 right-[30%] top-1/2 -translate-y-1/2 -translate-x-1/2"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay({ url: s.videoUrl, type: s.videoType }); }}
            >
              <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center shadow-xl border border-white/20">
                <Play size={15} fill="white" color="white" style={{ marginLeft: 2 }} />
              </div>
            </button>

            {/* Badge icon — top right */}
            <div className="absolute z-20 top-2.5 right-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: s.iconBgColor,
                  border: `1.5px solid ${s.iconRingColor}`,
                  boxShadow: `0 2px 10px ${s.color}25`,
                }}
              >
                <s.Icon size={19} color={s.color} />
              </div>
            </div>

            {/* "Tezliklə" badge */}
            {s.disabled && (
              <div className="absolute z-30 bottom-2 left-3.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                Tezliklə
              </div>
            )}
          </div>
        );

        if (s.disabled) return <div key={s.id}>{inner}</div>;
        return (
          <Link key={s.id} href={s.href} style={{ textDecoration: "none" }}>
            {inner}
          </Link>
        );
      })}
    </section>
  );
}

/* Mobile Bottom Nav */
function MobileBottomNav() {
  const [active, setActive] = useState(0);
  const items = [
    { Icon: PiKnife,          label: "Qurbanlıq" },
    { Icon: TbHeartHandshake, label: "Xeyriyyə" },
    { Icon: TbMeat,           label: "Təzə Ət" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.07)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingTop: 8 }}>
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={() => setActive(i)}
          className="flex flex-col items-center gap-0.5 flex-1 pb-2 pt-1 transition-colors"
          style={{ color: active === i ? C.green : "#9CA3AF" }}
        >
          <item.Icon size={22} />
          <span className="text-[9.5px] font-semibold leading-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP LAYOUT
═══════════════════════════════════════════════════════════════ */

/* Desktop Header */
function DesktopHeader() {
  const [hasShadow, setHasShadow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setHasShadow(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${hasShadow ? "bg-white/95 shadow-lg backdrop-blur-md" : "bg-white/90 border-b border-gray-100"}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Image src="/logo_test.png" alt="MeatBox" width={36} height={36} className="h-full w-full object-cover" priority />
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-black tracking-tight text-gray-900">
              MEAT<span style={{ color: C.green }}>BOX</span>.AZ
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map((item) => (
            <a key={item} href="#" className="text-sm font-semibold text-gray-600 hover:text-[#1B5E20] transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden md:flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: C.green }}
          >
            <User size={14} strokeWidth={2.5} />
            Daxil ol
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-gray-100 md:hidden">
            {menuOpen ? <X size={22} className="text-gray-800" /> : <Menu size={22} className="text-gray-800" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 pb-4 pt-2 md:hidden">
          {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map((item) => (
            <a key={item} href="#" onClick={() => setMenuOpen(false)}
              className="block border-b border-gray-50 py-3 text-sm font-semibold text-gray-700">
              {item}
            </a>
          ))}
          <div className="mt-3 flex gap-2">
            <Link href="/auth/login" className="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-800">
              Daxil ol
            </Link>
            <Link href="/auth/register" className="flex-1 rounded-xl py-3 text-center text-sm font-bold text-white" style={{ background: C.green }}>
              Qeydiyyat
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* Hero Section */
function Hero() {
  return (
    <section className="relative min-h-[400px] w-full overflow-hidden flex items-center">
      <Image
        src="/home_image_test.jpg"
        alt="MeatBox hero"
        fill
        className="object-cover object-[center_78%]"
        priority
      />
      {/* Green tint overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg,rgba(27,94,32,0.38) 0%,rgba(26,112,40,0.30) 55%,rgba(20,83,45,0.38) 100%)" }}
      />
      {/* Bottom white fade */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 160, background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.55) 55%, #ffffff 100%)" }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-7 px-5 pb-20 pt-12 text-center w-full">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/30 shadow-xl sm:h-24 sm:w-24 shrink-0">
            <Image src="/logo_test.png" alt="MeatBox" width={96} height={96} className="h-full w-full object-cover" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-black italic tracking-tighter text-white sm:text-5xl">
              MEAT<span className="text-green-300">BOX</span>.AZ
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-white/85">
              Qurbanlıq · Xeyriyyə · Təzə Ət
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { Icon: ShieldCheck, label: "Halal kəsim" },
            { Icon: Video,       label: "Video hesabat" },
            { Icon: Truck,       label: "Çatdırılma" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={16} className="text-white" strokeWidth={2} />
              <span className="text-sm font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Desktop Service Cards */
function DesktopServicesSection({ onPlay }) {
  return (
    <section className="relative z-10 mx-auto max-w-5xl -mt-[140px] px-5 pb-8">
      <div className="grid grid-cols-3 gap-6">
        {SERVICES.map((s) => {
          const ytId = s.videoType === "youtube" ? s.videoUrl.split("/embed/")[1]?.split("?")[0] : null;

          const card = (
            <div style={{ position: "relative", paddingTop: 44, height: "100%" }}>
              {/* Pop-out icon */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 66,
                  height: 66,
                  borderRadius: "50%",
                  background: s.iconBgColor,
                  border: `2px solid ${s.iconRingColor}`,
                  boxShadow: `0 4px 20px ${s.color}30, 0 0 0 4px ${s.color}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <s.Icon size={32} color={s.color} />
              </div>

              <div
                className="group flex h-full flex-col bg-white transition-all duration-200"
                style={{
                  borderRadius: 20,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                  overflow: "hidden",
                  paddingTop: 46,
                  cursor: s.disabled ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!s.disabled) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)";
                }}
              >
                {/* Video / Gradient thumbnail */}
                <div
                  style={{
                    position: "relative",
                    margin: "0 12px",
                    height: 148,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#000",
                    flexShrink: 0,
                  }}
                >
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0`}
                      allow="autoplay"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "calc(148px * 16 / 9)",
                        height: "148px",
                        transform: "translate(-50%, -50%)",
                        border: "none",
                        pointerEvents: "none",
                      }}
                      title={s.title}
                    />
                  ) : (
                    <video
                      src={s.videoUrl}
                      autoPlay muted loop playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", opacity: s.disabled ? 0.75 : 1 }}
                    />
                  )}

                  {/* Clickable overlay */}
                  <div
                    style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay({ url: s.videoUrl, type: s.videoType }); }}
                  />

                  {/* Dark overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 1, pointerEvents: "none" }} />

                  {/* Bottom white fade */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "42%",
                    background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.92) 100%)",
                    zIndex: 1, pointerEvents: "none",
                  }} />

                  {/* Play button */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, pointerEvents: "none" }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: "rgba(0,0,0,0.52)",
                      backdropFilter: "blur(4px)",
                      border: "1.5px solid rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Play size={16} fill="white" color="white" style={{ marginLeft: 2 }} />
                    </div>
                  </div>

                  {/* Tezliklə */}
                  {s.disabled && (
                    <div style={{
                      position: "absolute", top: 8, left: 8, zIndex: 4, pointerEvents: "none",
                      padding: "3px 10px", borderRadius: 999,
                      background: "rgba(0,0,0,0.65)", fontSize: 10, fontWeight: 700, color: "#fff",
                    }}>
                      Tezliklə
                    </div>
                  )}
                </div>

                {/* Title */}
                <div style={{ padding: "11px 16px 4px", textAlign: "center" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: s.color, lineHeight: 1.35, letterSpacing: "-0.2px", margin: 0 }}>
                    {s.title}
                  </h3>
                </div>

                {/* Desc + Button */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 18px" }}>
                  <p style={{ flex: 1, fontSize: 12, color: C.muted, lineHeight: 1.65, marginBottom: 14 }}>
                    {s.desc}
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "11px 0", borderRadius: 12,
                    fontSize: 13, fontWeight: 700, letterSpacing: "0.03em",
                    color: "#fff", background: s.btn,
                    boxShadow: s.disabled ? "none" : s.btnShadow,
                    opacity: s.disabled ? 0.45 : 1,
                  }}>
                    {s.btnLabel}
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          );

          if (s.disabled) return <div key={s.id} className="h-full">{card}</div>;
          return (
            <Link key={s.id} href={s.href} className="block h-full" style={{ textDecoration: "none" }}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* Why MeatBox Section */
function WhySection() {
  return (
    <section className="py-6">
      <div className="mx-auto max-w-4xl px-5">
        <div style={{ position: "relative", marginTop: 12 }}>
          <div style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            display: "flex",
            flexWrap: "wrap",
            paddingTop: 20,
          }}>
            {/* Floating title on border */}
            <div style={{
              position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
              background: "#fff", padding: "0 14px",
              fontSize: 14, fontWeight: 800, letterSpacing: "0.05em",
              textTransform: "uppercase", color: C.text, whiteSpace: "nowrap",
            }}>
              Niyə MeatBox?
            </div>
            {WHY.map(({ Icon, label, desc }, i) => (
              <div key={label} style={{
                flex: "1 1 180px",
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "20px 22px",
                borderRight: i < WHY.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <Icon size={26} strokeWidth={1.5} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Footer */
function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image src="/logo_test.png" alt="MeatBox" width={38} height={38} className="rounded-lg" />
              <span className="text-lg font-black">
                MEAT<span className="text-green-300">BOX</span>.AZ
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-400">Qurbanlıq · Xeyriyyə · Təzə Ət</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Keçidlər</h4>
            <ul className="mt-3 space-y-2">
              {["Haqqımızda", "Xidmətlər", "Necə işləyir?"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Əlaqə</h4>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Phone size={13} className="text-green-400" />010 399 02 22
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Mail size={13} className="text-green-400" />info@meatbox.az
              </li>
            </ul>
            <div className="mt-4 flex gap-2.5">
              {[FaFacebook, FaInstagram, FaWhatsapp].map((Icon, i) => (
                <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                  <Icon size={14} className="text-gray-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Ödəniş üsulları</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <div style={{ background: "#1a1f71", borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 56, height: 34 }}>
                <span style={{ color: "#fff", fontFamily: "serif", fontWeight: 900, fontStyle: "italic", fontSize: 16, letterSpacing: "-0.5px" }}>VISA</span>
              </div>
              <div style={{ background: "#252525", borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 0, height: 34 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eb001b" }} />
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f79e1b", marginLeft: -10 }} />
              </div>
              <div style={{ background: "#252525", borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 0, height: 34 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#0099df" }} />
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#cc0000", marginLeft: -8, opacity: 0.85 }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          © 2024 MeatBox.az. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeVideo, setActiveVideo] = useState(null);

  return (
    <>
      {/* Video Modal */}
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}

      {/* ── MOBILE (< 768px) ── */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col" style={{ paddingBottom: 62 }}>
        <MobileHeader />
        <main className="flex-1">
          <MobileServicesSection onPlay={setActiveVideo} />
        </main>
        <MobileBottomNav />
      </div>

      {/* ── DESKTOP (≥ 768px) ── */}
      <div className="hidden md:block min-h-screen bg-white">
        <DesktopHeader />
        <main>
          <Hero />
          <DesktopServicesSection onPlay={setActiveVideo} />
          <WhySection />
        </main>
        <Footer />
      </div>
    </>
  );
}
