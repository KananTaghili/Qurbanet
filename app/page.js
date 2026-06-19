"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ArrowRight, Play, ShieldCheck, Video, Truck, Heart, Phone, Mail, User, Menu, ShoppingCart } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { PiKnife } from "react-icons/pi";
import { TbMeat, TbHeartHandshake } from "react-icons/tb";

/* ─── SVG Icons ──────────────────────────────────────────────── */
const IconKnife = ({ cls = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={cls}>
    <path d="M10 50 L44 16 Q52 8 54 10 Q56 12 48 20 L14 54 Z" fill="currentColor" opacity="0.9" />
    <path d="M12 48 L46 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <rect x="8" y="48" width="10" height="4" rx="1.5" fill="currentColor" opacity="0.7" transform="rotate(-45 13 50)" />
    <path d="M6 54 Q4 58 7 60 Q10 62 13 59 L18 54 L10 46 Z" fill="currentColor" opacity="0.6" />
    <circle cx="9" cy="55" r="1.2" fill="white" opacity="0.5" />
    <circle cx="12" cy="58" r="1.2" fill="white" opacity="0.5" />
  </svg>
);

const IconHandshake = ({ cls = "" }) => (
  <svg viewBox="0 0 64 64" fill="currentColor" className={cls}>
    <rect x="4" y="24" width="8" height="16" rx="2" opacity="0.7" />
    <rect x="52" y="24" width="8" height="16" rx="2" opacity="0.7" />
    <path d="M12 32 L22 26 L30 28 L34 26 L52 32" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M22 26 L26 36 L36 36 L40 28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="32" cy="30" r="6" opacity="0.3" />
    <path d="M28 31 L31 34 L36 28" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMeat = ({ cls = "" }) => (
  <svg viewBox="0 0 64 64" fill="currentColor" className={cls}>
    <ellipse cx="32" cy="38" rx="22" ry="14" opacity="0.85" />
    <ellipse cx="32" cy="35" rx="18" ry="11" />
    <ellipse cx="32" cy="34" rx="12" ry="7" opacity="0.6" />
    <path d="M24 18 Q32 10 40 18" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="32" cy="18" r="4" opacity="0.8" />
    <ellipse cx="28" cy="36" rx="5" ry="3" fill="white" opacity="0.2" />
  </svg>
);

/* ─── Services data ──────────────────────────────────────────── */
const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    desc: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdəkindən çıxmadan etibarlı xidmət.",
    href: "/qurban",
    disabled: false,
    icon: <IconKnife cls="w-10 h-10 text-green-700" />,
    ServiceIcon: PiKnife,
    serviceIconColor: "#1B5E20",
    badgeIcon: <IconKnife cls="w-5 h-5" />,
    badgeColor: "text-green-600",
    iconRing: "border-green-200 bg-green-50",
    titleColor: "text-green-700",
    thumbGradient: "bg-gradient-to-br from-green-200 via-green-300 to-emerald-500",
    btnCls: "bg-green-700 hover:bg-green-800",
    btnLabel: "Sifariş Et",
    videoUrl: "https://www.youtube.com/embed/cF5NRPK49zU?autoplay=1",
    videoType: "youtube",
  },
  {
    id: "xeyriyye",
    title: "Kollektiv Qurban-Xeyriyyə Platforması",
    desc: "Birlikdə qurban kəsdirik, ehtiyacı olanlara pay göndəririk. Şəffaf və etibarlı xeyriyyə platformasına qoşulun.",
    href: "/charity",
    disabled: false,
    icon: <IconHandshake cls="w-10 h-10 text-purple-700" />,
    ServiceIcon: TbHeartHandshake,
    serviceIconColor: "#6B21A8",
    badgeIcon: <IconHandshake cls="w-5 h-5" />,
    badgeColor: "text-purple-600",
    iconRing: "border-purple-200 bg-purple-50",
    titleColor: "text-purple-700",
    thumbGradient: "bg-gradient-to-br from-purple-200 via-purple-300 to-violet-500",
    btnCls: "bg-purple-700 hover:bg-purple-800",
    btnLabel: "Qoşul",
    videoUrl: "https://www.shutterstock.com/shutterstock/videos/3442647947/preview/stock-footage-close-up-of-a-man-s-hand-holding-a-cardboard-box-suggesting-a-delivery-service-in-a-nondescript.webm",
    videoType: "mp4",
  },
  {
    id: "et",
    title: "Ət Sifarişi",
    desc: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdırırıq.",
    href: "#",
    disabled: true,
    icon: <IconMeat cls="w-10 h-10 text-red-700" />,
    ServiceIcon: TbMeat,
    serviceIconColor: "#B91C1C",
    badgeIcon: <IconMeat cls="w-5 h-5" />,
    badgeColor: "text-red-700",
    iconRing: "border-red-200 bg-red-50",
    titleColor: "text-red-700",
    thumbGradient: "bg-gradient-to-br from-red-300 via-red-400 to-rose-600",
    btnCls: "bg-red-700 hover:bg-red-800",
    btnLabel: "Məhsullara Bax",
    videoUrl: "https://www.youtube.com/embed/7JRzuVPT5zU?autoplay=1",
    videoType: "youtube",
  },
];

const WHY = [
  { Icon: ShieldCheck, label: "Halal Kəsim",    desc: "Dini qaydalara uyğun peşəkar kəsim" },
  { Icon: Video,       label: "Video Hesabat",   desc: "Kəsim prosesini addım-addım izləyin" },
  { Icon: Truck,       label: "Çatdırılma",      desc: "Sürətli və etibarlı çatdırılma" },
  { Icon: Heart,       label: "Şəffaf Xeyriyyə", desc: "Hər qəpiyin hesabatı, şəffaf pay bölgüsü" },
];

/* ─── Video Modal ────────────────────────────────────────────── */
function VideoModal({ video, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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

/* ═══════════════════════════════════════════════════════════════
   MOBILE LAYOUT
═══════════════════════════════════════════════════════════════ */
function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = ["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"];
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="px-3">
        <div className="flex items-center h-14 gap-2">
          {/* Hamburger — LEFT */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-gray-700 shrink-0">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo — CENTER */}
          <Link href="/" className="flex flex-1 items-center justify-center gap-2">
            <Image src="/logo_test.png" alt="MeatBox Logo" width={36} height={36} className="object-contain" />
            <div className="leading-none">
              <div className="font-extrabold text-[18px] text-gray-900 tracking-tight leading-none">
                MEAT<span className="text-red-700">BOX</span>.AZ
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                Qurbanlıq · Xeyriyyə · Təzə Ət
              </div>
            </div>
          </Link>

          {/* User — RIGHT */}
          <Link href="/auth/login" className="p-1.5 text-gray-700 shrink-0">
            <User size={22} />
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white flex flex-col py-1">
          {navLinks.map((link) => (
            <a key={link} href="#" onClick={() => setMenuOpen(false)}
              className="px-5 py-3 text-[14px] font-medium text-gray-700 hover:text-green-700 hover:bg-gray-50 active:bg-gray-100">
              {link}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* Star-burst badge (exactly like MeatBox) */
function ServiceBadge({ icon, badgeColor }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg viewBox="0 0 56 56" className={`absolute inset-0 w-full h-full ${badgeColor}`}>
        <path d="M28 2 L32 20 L48 14 L38 28 L54 32 L38 36 L48 50 L32 44 L28 54 L24 44 L8 50 L18 36 L2 32 L18 28 L8 14 L24 20 Z" />
      </svg>
      <div className="relative z-10 w-8 h-8 flex items-center justify-center text-white">
        {icon}
      </div>
    </div>
  );
}

function MobileServicesSection({ onPlay }) {
  return (
    <section className="px-3 pt-3 pb-4 flex flex-col gap-3">
      {SERVICES.map((s) => {
        const ytId = s.videoType === "youtube" ? s.videoUrl.split("/embed/")[1]?.split("?")[0] : null;
        const inner = (
          <div key={s.id} className="relative rounded-2xl shadow-md overflow-hidden bg-black" style={{ height: 220 }}>
            {/* Real video background */}
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0`}
                allow="autoplay"
                style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: "calc(190px * 16 / 9)", height: "190px",
                  transform: "translate(-50%, -50%)",
                  border: "none", pointerEvents: "none",
                }}
                title={s.title}
              />
            ) : (
              <video
                src={s.videoUrl}
                autoPlay muted loop playsInline
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
              />
            )}

            {/* White overlay — left side readable */}
            <div className="absolute inset-0 z-10" style={{
              background: "linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 42%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 55%)",
            }} />

            {/* Text — left side */}
            <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-between p-3 w-[52%]">
              <div>
                <h3 className={`text-[14px] font-bold ${s.titleColor} leading-tight mb-1`}>
                  {s.title}
                </h3>
                <p className="text-gray-600 text-[11px] leading-snug">
                  {s.desc}
                </p>
              </div>
              <button className={`${s.btnCls} text-white font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 text-[12px] self-start whitespace-nowrap opacity-${s.disabled ? "50" : "100"}`}>
                {s.btnLabel}
                <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </div>

            {/* Play button — center-right */}
            <button
              className="absolute z-20 right-[28%] top-1/2 -translate-y-1/2 -translate-x-1/2"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay({ url: s.videoUrl, type: s.videoType }); }}
            >
              <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center shadow-xl border border-white/20">
                <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              </div>
            </button>

            {/* Circular icon badge — top right */}
            <div className="absolute z-20 top-2 right-2">
              <div
                className={`w-[56px] h-[56px] rounded-full border-2 ${s.iconRing} flex items-center justify-center shadow-md`}
                style={{ boxShadow: `0 4px 14px ${s.serviceIconColor}35` }}
              >
                <s.ServiceIcon size={28} color={s.serviceIconColor} />
              </div>
            </div>

            {/* Tezliklə */}
            {s.disabled && (
              <span className="absolute z-30 top-2 left-3 bg-black/65 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                Tezliklə
              </span>
            )}

            {/* Timer */}
            <span className="absolute z-20 bottom-2 right-2 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded font-mono tracking-wide">
              0:15
            </span>
          </div>
        );

        if (s.disabled) return <div key={s.id}>{inner}</div>;
        return <Link key={s.id} href={s.href} style={{ textDecoration: "none" }}>{inner}</Link>;
      })}
    </section>
  );
}

function MobileBottomNav() {
  const [active, setActive] = useState(0);
  const items = [
    { Icon: ShieldCheck, label: "Halal Kəsim" },
    { Icon: Video,       label: "Video Hesabat" },
    { Icon: Truck,       label: "Çatdırılma" },
    { Icon: Heart,       label: "Şəffaf Xeyriyyə" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-stretch shadow-[0_-2px_12px_rgba(0,0,0,0.07)]">
      {items.map(({ Icon, label }, i) => {
        const isActive = active === i;
        return (
          <button key={label} onClick={() => setActive(i)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 relative transition-colors">
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-green-700 rounded-full" />
            )}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8}
              className={isActive ? "text-green-700" : "text-gray-400"} />
            <span className={`text-[10px] leading-none font-${isActive ? "700" : "500"} ${isActive ? "text-green-700" : "text-gray-400"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP LAYOUT
═══════════════════════════════════════════════════════════════ */
function DesktopHeader() {
  const [open, setOpen] = useState(false);
  const navLinks = ["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"];
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <span className="font-extrabold text-xl text-gray-900 leading-none tracking-tight">
              MEAT<span className="text-red-700">BOX</span>.AZ
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <a key={link} href="#" className="hover:text-green-700 transition-colors">{link}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="flex items-center gap-1.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl transition-colors">
              <User size={14} strokeWidth={2.5} />
              Daxil ol
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <a key={link} href="#" className="text-gray-700 hover:text-green-700 py-1 px-1">{link}</a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative h-[300px] md:h-[340px] flex items-center overflow-hidden">
      <Image src="/home_image_test.jpg" alt="MeatBox hero" fill className="object-cover object-center" priority />

      {/* Center white overlay */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 55% 80% at 50% 52%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 42%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0) 75%)",
      }} />
      {/* Bottom white fade */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 75%, rgba(255,255,255,0.85) 90%, #ffffff 100%)",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full flex flex-col items-center text-center">
        {/* Logo + Title + Tagline */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image src="/logo_test.png" alt="MeatBox Logo" width={115} height={115} className="object-contain drop-shadow-lg shrink-0" />
          <div className="flex flex-col items-start">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-none">
              MEAT<span className="text-red-700">BOX</span>.AZ
            </h1>
            <p className="text-gray-900 text-xl md:text-[23px] font-semibold mt-2 tracking-wide">
              Qurbanlıq &nbsp;·&nbsp; Xeyriyyə Platforması &nbsp;·&nbsp; Təzə Ət
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

/* Desktop video thumbnail card */
function VideoThumbnail({ gradient }) {
  return (
    <div className={`relative rounded-xl overflow-hidden h-[150px] ${gradient} flex items-center justify-center cursor-pointer group`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </div>
      </div>
      <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded font-mono tracking-wide">
        0:15
      </span>
    </div>
  );
}

function DesktopServicesSection({ onPlay }) {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-4 pb-4 relative z-10 -mt-[60px]">
      <div className="grid grid-cols-3 gap-6">
        {SERVICES.map((s) => {
          const ytId = s.videoType === "youtube" ? s.videoUrl.split("/embed/")[1]?.split("?")[0] : null;
          return (
            <div key={s.id} className="relative pt-9 h-full">
              {/* Floating icon — half above card */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <div
                  className={`w-[72px] h-[72px] rounded-full border-2 bg-white ${s.iconRing} flex items-center justify-center shadow-md`}
                  style={{ boxShadow: `0 4px 16px ${s.serviceIconColor}30` }}
                >
                  <s.ServiceIcon size={38} color={s.serviceIconColor} />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col overflow-hidden h-full">
              <div className="px-5 pt-10 pb-2 flex flex-col items-center text-center gap-1.5">
                <h3 className={`text-base font-bold ${s.titleColor} leading-tight text-center`}>
                  {s.title}
                </h3>
              </div>

              {/* Real video preview */}
              <div className="px-3">
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  style={{ height: 150, background: "#000" }}
                  onClick={() => onPlay({ url: s.videoUrl, type: s.videoType })}
                >
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0`}
                      allow="autoplay"
                      style={{
                        position: "absolute", top: "50%", left: "50%",
                        width: "calc(150px * 16 / 9)", height: "150px",
                        transform: "translate(-50%, -50%)",
                        border: "none", pointerEvents: "none",
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
                  {/* dark overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", pointerEvents: "none" }} />
                  {/* bottom white fade */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "42%", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))", pointerEvents: "none" }} />
                  {/* play button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl border border-white/20">
                      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5"><polygon points="6,4 20,12 6,20" /></svg>
                    </div>
                  </div>
                  {/* Tezliklə */}
                  {s.disabled && (
                    <div className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                      Tezliklə
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded font-mono tracking-wide pointer-events-none">0:15</span>
                </div>
              </div>

              <div className="px-5 pt-3 pb-5 flex flex-col gap-3 flex-1">
                <p className="text-gray-600 text-sm leading-relaxed flex-1">{s.desc}</p>
                {s.disabled ? (
                  <button disabled className={`${s.btnCls} text-white font-bold py-2.5 px-5 rounded-lg text-sm w-full flex items-center justify-center gap-2 opacity-45 cursor-default`}>
                    {s.btnLabel}<ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                ) : (
                  <Link href={s.href}>
                    <button className={`${s.btnCls} text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full`}>
                      {s.btnLabel}<ArrowRight size={14} strokeWidth={2.5} />
                    </button>
                  </Link>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="bg-white py-3">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative mt-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 pt-10 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {WHY.map((f) => (
                <div key={f.label} className="flex items-start gap-4">
                  <div className="text-green-600 shrink-0 mt-0.5">
                    <f.Icon size={48} strokeWidth={1} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{f.label}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <h2 className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-5 text-lg font-semibold text-gray-800 whitespace-nowrap">
            Niyə MeatBox?
          </h2>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-700">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-4">
        <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-0 pb-8 border-b border-gray-200">
          <div className="flex flex-col gap-3 md:pr-8 md:flex-1">
            <div className="flex items-center gap-2">
              <div>
                <div className="font-extrabold text-base leading-tight tracking-tight text-gray-900">
                  MEAT<span className="text-red-700">BOX</span>.AZ
                </div>
                <div className="text-gray-500 text-xs mt-0.5 leading-snug">
                  Qurbanlıq · Xeyriyyə ·<br />Təzə Ət
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-px bg-gray-200 mx-8 self-stretch" />

          <div className="md:flex-1">
            <p className="text-gray-900 font-semibold mb-4 text-sm">Keçidlər</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {["Haqqımızda", "Xidmətlər", "Necə işləyir?"].map((l) => (
                <li key={l}><a href="#" className="hover:text-green-700 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div className="md:flex-1 md:px-8">
            <p className="text-gray-900 font-semibold mb-4 text-sm">Əlaqə</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Phone size={14} className="shrink-0" />010 399 02 22
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="shrink-0" />info@meatbox.az
              </li>
              <li className="flex gap-2.5 mt-3">
                {[
                  { Icon: FaFacebook, label: "Facebook" },
                  { Icon: FaInstagram, label: "Instagram" },
                  { Icon: FaWhatsapp, label: "WhatsApp" },
                ].map(({ Icon, label }) => (
                  <a key={label} href="#" title={label}
                    className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors">
                    <Icon size={14} />
                  </a>
                ))}
              </li>
            </ul>
          </div>

          <div className="hidden md:block w-px bg-gray-200 mx-8 self-stretch" />

          <div className="md:flex-1">
            <p className="text-gray-900 font-semibold mb-4 text-sm">Ödəniş üsulları</p>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-[#1A1F71] text-white text-[10px] font-bold px-3 py-1 rounded-md italic tracking-wider flex items-center justify-center w-[50px] h-[32px]">VISA</span>
              <span className="relative flex items-center justify-center rounded-md w-[50px] h-[32px] bg-gray-900">
                <span className="w-5 h-5 rounded-full bg-[#EB001B] inline-block" />
                <span className="w-5 h-5 rounded-full bg-[#F79E1B] inline-block -ml-2.5 opacity-90" />
              </span>
              <span className="relative flex items-center justify-center rounded-md w-[50px] h-[32px] bg-gray-900">
                <span className="w-5 h-5 rounded-full bg-[#E31837] inline-block" />
                <span className="w-5 h-5 rounded-full bg-[#0094D9] inline-block -ml-2.5 opacity-90" />
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs pt-4">
          © 2024 MeatBox.az. Bütün hüquqlar qorunur.
        </p>
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
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}

      {/* ── MOBILE (< 768px) ── */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col pb-[60px]">
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
