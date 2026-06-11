"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Play,
  ShieldCheck,
  Video,
  Truck,
  Heart,
  Phone,
  Mail,
  User,
} from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaHandshake,
} from "react-icons/fa";
import { GiGoat, GiMeat } from "react-icons/gi";

/* 
  ============================================================
  DESIGN SYSTEM – Colors
  ============================================================
*/
const COLORS = {
  primary: "#1B5E20",
  primaryLight: "#2E7D32",
  primarySurface: "#E8F5E9",
  accent: "#F59E0B",
  purple: "#6B21A8",
  purpleLight: "#7C3AED",
  red: "#B91C1C",
  redLight: "#DC2626",
textDark: "#111827",
  textMuted: "#6B7280",
  border: "#EAECF0",
};

/*
  ============================================================
  SERVICES DATA – Exactly matching the photo (4 cards)
  ============================================================
*/
const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    desc: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdəkindən çıxmadan etibarlı xidmət.",
    href: "/qurban",
    img: "/qoyun.jpg",
    imgFit: "cover",
    imgBg: "#f3f3f3",
    color: COLORS.primary,
    btn: COLORS.primaryLight,
    btnShadow: "0 6px 18px -4px rgba(27,94,32,0.5)",
    btnLabel: "Sifariş Et",
    ServiceIcon: GiGoat,
    disabled: false,
  },
  {
    id: "xeyriyye",
    title: "Kollektiv Qurban-Xeyriyyə Platforması",
    desc: "Birlikdə qurban kəsdirik, ehtiyacı olanlara pay göndəririk. Şəffaf və etibarlı xeyriyyə platformasına qoşulun.",
    href: "#",
    img: "/qutu.png",
    imgFit: "contain",
    imgBg: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
    color: COLORS.purple,
    btn: COLORS.purpleLight,
    btnShadow: "0 6px 18px -4px rgba(109,40,217,0.5)",
    btnLabel: "Qoşul",
    ServiceIcon: FaHandshake,
    disabled: true,
  },
  {
    id: "et",
    title: "Ət Satışı",
    desc: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdırırıq.",
    href: "#",
    img: "/dana.jpg",
    imgFit: "cover",
    imgBg: "#f3f3f3",
    color: COLORS.red,
    btn: COLORS.redLight,
    btnShadow: "0 6px 18px -4px rgba(185,28,28,0.5)",
    btnLabel: "Məhsullara Bax",
    ServiceIcon: GiMeat,
    disabled: true,
  },
];

/*
  ============================================================
  WHY MEATBOX? – Feature list
  ============================================================
*/
const WHY = [
  {
    Icon: ShieldCheck,
    label: "Halal Kəsim",
    desc: "Dini qaydalara uyğun peşəkar kəsim",
  },
  {
    Icon: Video,
    label: "Video Hesabat",
    desc: "Kəsim prosesini addım-addım izləyin",
  },
  {
    Icon: Truck,
    label: "Çatdırılma",
    desc: "Sürətli və etibarlı çatdırılma",
  },
  {
    Icon: Heart,
    label: "Şəffaf Xeyriyyə",
    desc: "Hər qəpiyin hesabatı, şəffaf pay bölgüsü",
  },
];

/*
  ============================================================
  MAIN LANDING PAGE COMPONENT
  ============================================================
*/
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);

  // Sticky navbar shadow effect
  useEffect(() => {
    const handleScroll = () => setHasShadow(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {/* 
        ======================================================
        STICKY NAVBAR (Glassmorphism, fully responsive)
        ======================================================
      */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          hasShadow
            ? "bg-white/95 shadow-lg backdrop-blur-md"
            : "bg-white/90 border-b border-gray-100"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          {/* Logo + Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Image
                src="/logo.png"
                alt="MeatBox logo"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-black tracking-tight text-gray-900">
                MEAT<span style={{ color: COLORS.primary }}>BOX</span>.AZ
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Taze Ət · Qurbanlıq · Xeyriyyə
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-7 md:flex">
            {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "")}`}
                  className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#1B5E20]"
                >
                  {item}
                </a>
              ),
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/qurban"
              className="hidden items-center gap-1.5 rounded-xl bg-[#1B5E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#2E7D32] md:flex"
            >
              <User size={14} strokeWidth={2.5} />
              Daxil ol
            </Link>
            <button className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-100">
              <ShoppingCart size={19} className="text-gray-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 md:hidden"
            >
              {mobileMenuOpen ? (
                <X size={22} className="text-gray-800" />
              ) : (
                <Menu size={22} className="text-gray-800" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-5 pb-4 pt-2 md:hidden">
            {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block border-b border-gray-50 py-3 text-sm font-semibold text-gray-700"
                >
                  {item}
                </a>
              ),
            )}
            <Link
              href="/qurban"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 block rounded-xl bg-[#1B5E20] py-3 text-center text-sm font-bold text-white"
            >
              Daxil ol
            </Link>
          </div>
        )}
      </header>

      {/* 
        ======================================================
        HERO SECTION (with overlay, branding, badges)
        ======================================================
      */}
      <section className="relative min-h-[340px] w-full overflow-hidden">
        {/* Background Image */}
        <Image
          src="/home_image.jpg"
          alt="MeatBox hero"
          fill
          className="object-cover object-[center_78%]"
          priority
        />
        {/* Green overlay — şəffaf saxla ki foto görünsün */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg,rgba(27,94,32,0.58) 0%,rgba(26,112,40,0.52) 55%,rgba(20,83,45,0.58) 100%)" }}
        />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-7 px-5 py-12 text-center sm:py-16">
          {/* Logo + Title */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/30 shadow-xl sm:h-24 sm:w-24">
              <Image
                src="/logo.png"
                alt="MeatBox logo"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-black italic tracking-tighter text-white sm:text-5xl">
                MEAT<span className="text-green-300">BOX</span>.AZ
              </h1>
              <p className="mt-1.5 text-sm font-medium text-white/80">
                Taze Ət · Qurbanlıq · Xeyriyyə Platforması
              </p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { Icon: ShieldCheck, label: "Halal kəsim" },
              { Icon: Video, label: "Video hesabat" },
              { Icon: Truck, label: "Çatdırılma" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 backdrop-blur-sm"
              >
                <Icon size={15} className="text-green-300" strokeWidth={2} />
                <span className="text-xs font-semibold text-white">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ======================================================
        SERVICE CARDS SECTION (4 cards, fully responsive)
        ======================================================
      */}
      <section className="mx-auto max-w-7xl px-5 py-14 md:py-20">
        {/* Desktop Grid (4 columns) */}
        <div className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <DesktopCard key={service.id} service={service} />
          ))}
        </div>

        {/* Mobile Stack (horizontal cards) */}
        <div className="flex flex-col gap-5 md:hidden">
          {SERVICES.map((service) => (
            <MobileCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* 
        ======================================================
        WHY MEATBOX? (4 feature cards)
        ======================================================
      */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-14">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-gray-900">
            Niyə MeatBox?
          </h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {WHY.map(({ Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all hover:shadow-md"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                  <Icon size={24} strokeWidth={1.8} color={COLORS.primary} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ======================================================
        FOOTER (modern dark design with social, payments)
        ======================================================
      */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="MeatBox"
                  width={38}
                  height={38}
                  className="rounded-lg"
                />
                <span className="text-lg font-black">
                  MEAT<span className="text-green-300">BOX</span>.AZ
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Taze Ət · Qurbanlıq · Xeyriyyə Platforması
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Links
              </h4>
              <ul className="mt-3 space-y-2">
                {["Haqqımızda", "Xidmətlər", "Necə işləyir?"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-gray-300 transition hover:text-white"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Əlaqə
              </h4>
              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone size={13} className="text-green-400" />
                  +994 50 123 44 55
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail size={13} className="text-green-400" />
                  info@meatbox.az
                </li>
              </ul>
              <div className="mt-4 flex gap-2.5">
                {[FaFacebook, FaInstagram, FaWhatsapp].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:bg-white/10"
                  >
                    <Icon size={14} className="text-gray-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Ödəniş üsulları
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {["VISA", "Mastercard", "tam."].map((method) => (
                  <span
                    key={method}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-200"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © 2024 MeatBox.az. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </div>
  );
}

/*
  ============================================================
  SERVICE CARD — həm desktop həm mobil eyni dizayn:
  dairəvi icon (üst-mərkəz) → başlıq → şəkil → mətn → düymə
  ============================================================
*/
function ServiceCard({ service }) {
  const { title, desc, href, img, imgFit, imgBg, color, btn, btnShadow, btnLabel, ServiceIcon, disabled } = service;

  // icon circle bg — rəngin açıq tonu
  const iconBg = color + "18"; // ~10% opacity

  const cardContent = (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200"
      style={{
        border: "1px solid #EAECF0",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.13)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
    >
      {/* ① Dairəvi icon — üst mərkəz */}
      <div className="flex flex-col items-center pt-6 pb-3 px-4">
        <div
          className="flex items-center justify-center rounded-full mb-3"
          style={{ width: 68, height: 68, background: iconBg, border: `2px solid ${color}22` }}
        >
          <ServiceIcon size={32} color={color} />
        </div>

        {/* ② Başlıq */}
        <h3 className="text-center font-extrabold text-[15px] leading-snug tracking-tight" style={{ color }}>
          {title}
        </h3>
      </div>

      {/* ③ Şəkil + play + badge-lər */}
      <div className="relative mx-3 overflow-hidden rounded-xl" style={{ height: 178, background: imgBg, flexShrink: 0 }}>
        <img
          src={img}
          alt={title}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          style={{ objectFit: imgFit, objectPosition: "center", opacity: disabled ? 0.7 : 1 }}
        />
        {/* overlay */}
        <div className="absolute inset-0 bg-black/15 rounded-xl" />

        {/* Play düyməsi */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/30">
            <Play size={17} fill="white" color="white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* 0:15 badge */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
          0:15
        </div>

        {/* Tezliklə badge */}
        {disabled && (
          <div className="absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            Tezliklə
          </div>
        )}
      </div>

      {/* ④ Mətn + düymə */}
      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="flex-1 text-[12px] leading-relaxed text-gray-500 mb-4">{desc}</p>

        {/* CTA düyməsi — tam genişlik */}
        <div
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wide text-white"
          style={{
            background: btn,
            boxShadow: disabled ? "none" : btnShadow,
            opacity: disabled ? 0.45 : 1,
          }}
        >
          {btnLabel.toUpperCase()}
          <ArrowRight size={15} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  if (disabled) return <div className="h-full">{cardContent}</div>;
  return <Link href={href} className="block h-full" style={{ textDecoration: "none" }}>{cardContent}</Link>;
}

/* Desktop və mobil eyni ServiceCard istifadə edir */
function DesktopCard({ service }) { return <ServiceCard service={service} />; }
function MobileCard({ service })  { return <ServiceCard service={service} />; }
