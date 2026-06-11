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
  FaHandHoldingHeart,
} from "react-icons/fa";
import { PiKnife } from "react-icons/pi";
import { TbMeat } from "react-icons/tb";

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
    ServiceIcon: PiKnife,
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
    ServiceIcon: FaHandHoldingHeart,
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
    ServiceIcon: TbMeat,
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
      <section className="relative min-h-[430px] w-full overflow-hidden">
        {/* Background Image */}
        <Image
          src="/home_image.jpg"
          alt="MeatBox hero"
          fill
          className="object-cover object-[center_78%]"
          priority
        />
        {/* Green overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg,rgba(27,94,32,0.58) 0%,rgba(26,112,40,0.52) 55%,rgba(20,83,45,0.58) 100%)" }}
        />
        {/* Alt ağ gradient — tam ağ keçid, xətt görünməsin */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 140, background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 50%, #ffffff 100%)" }}
        />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-7 px-5 pb-16 pt-10 text-center sm:pb-20 sm:pt-14">
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
      <section className="relative z-10 mx-auto max-w-5xl -mt-[154px] px-5 pb-6 md:pb-8">
        {/* Desktop Grid (3 columns) */}
        <div className="hidden gap-6 md:grid md:grid-cols-3">
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
      <section className="py-4">
        <div className="mx-auto max-w-4xl px-5">
          {/* Floating title ON the border */}
          <div style={{ position: "relative", marginTop: 12 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexWrap: "wrap",
                paddingTop: 20,
              }}
            >
            {/* Title sitting on the top border */}
            <div style={{
              position: "absolute",
              top: -11,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#fff",
              padding: "0 14px",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#111827",
              whiteSpace: "nowrap",
            }}>
              Niyə MeatBox?
            </div>
            {WHY.map(({ Icon, label, desc }, i) => (
              <div
                key={label}
                style={{
                  flex: "1 1 200px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "20px 22px",
                  borderRight: i < WHY.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                {/* Icon — thin outline circle, no fill */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: `1.5px solid ${COLORS.primary}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={19} strokeWidth={1.5} color={COLORS.primary} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.35 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
            </div>
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

  const cardContent = (
    <div
      className="group flex h-full flex-col bg-white transition-all duration-200"
      style={{
        borderRadius: 20,
        border: "1px solid #EAECF0",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        cursor: disabled ? "default" : "pointer",
        overflow: "visible",   /* icon-un taşması üçün */
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.13)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
    >
      {/* ① Icon + başlıq — overflow:visible, icon şəklin üstünə düşür */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, paddingBottom: 0, paddingLeft: 16, paddingRight: 16, position: "relative", zIndex: 2 }}>

        {/* Dairəvi icon */}
        <div style={{
          width: 72, height: 72,
          borderRadius: "50%",
          background: "#fff",
          border: `2px solid ${color}30`,
          boxShadow: `0 4px 16px ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: -20,   /* şəklin üstünə 20px batır */
          flexShrink: 0,
          zIndex: 3,
          position: "relative",
        }}>
          <ServiceIcon size={32} color={color} />
        </div>
      </div>

      {/* ② Şəkil — overflow hidden, icon batır içəri */}
      <div style={{
        position: "relative",
        marginLeft: 12, marginRight: 12,
        height: 155,
        borderRadius: 14,
        overflow: "hidden",
        background: imgBg,
        flexShrink: 0,
        zIndex: 1,
      }}>
        <img
          src={img}
          alt={title}
          className="group-hover:scale-105 transition-transform duration-300"
          style={{ width: "100%", height: "100%", objectFit: imgFit, objectPosition: "center", opacity: disabled ? 0.7 : 1 }}
        />

        {/* Qaranlıq overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />

        {/* Alt ağ gradient fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.92) 100%)" }} />

        {/* Play düyməsi */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={17} fill="white" color="white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* 0:15 badge */}
        <div style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 7px", borderRadius: 5, background: "rgba(0,0,0,0.65)", fontSize: 10, fontWeight: 700, color: "#fff" }}>
          0:15
        </div>

        {/* Tezliklə */}
        {disabled && (
          <div style={{ position: "absolute", top: 28, left: 8, padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,0.65)", fontSize: 10, fontWeight: 700, color: "#fff" }}>
            Tezliklə
          </div>
        )}
      </div>

      {/* ③ Başlıq */}
      <div style={{ padding: "12px 16px 4px", textAlign: "center" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1.35, letterSpacing: "-0.2px", margin: 0 }}>
          {title}
        </h3>
      </div>

      {/* ④ Mətn + düymə */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 18px" }}>
        <p style={{ flex: 1, fontSize: 12, color: "#6B7280", lineHeight: 1.65, marginBottom: 14 }}>{desc}</p>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "11px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.03em", color: "#fff",
          background: btn,
          boxShadow: disabled ? "none" : btnShadow,
          opacity: disabled ? 0.45 : 1,
        }}>
          {btnLabel.toUpperCase()}
          <ArrowRight size={14} strokeWidth={2.5} />
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
