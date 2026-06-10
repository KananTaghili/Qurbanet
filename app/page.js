"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Play,
  Shield,
  Video,
  Truck,
  Heart,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";

const GREEN        = "#1B5E20";
const GREEN_BTN    = "#2E7D32";
const PURPLE       = "#6B21A8";
const PURPLE_BTN   = "#7C3AED";
const RED          = "#B91C1C";
const RED_BTN      = "#DC2626";

const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    description:
      "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdəkindən çıxmadan etibarlı xidmət.",
    color: GREEN,
    btnColor: GREEN_BTN,
    btnText: "Sifariş Et",
    href: "/qurban",
    image: "/qoyun.jpg",
    imageFit: "object-cover",
    disabled: false,
  },
  {
    id: "xeyriyye",
    title: "Kollektiv Qurban-Xeyriyyə Platforması",
    description:
      "Birlikdə qurban kəsdirik, ehtiyacı olanlara pay göndəririk. Şəffaf və etibarlı xeyriyyə platformasına qoşulun.",
    color: PURPLE,
    btnColor: PURPLE_BTN,
    btnText: "Qoşul",
    href: "#",
    image: "/qutu.png",
    imageFit: "object-contain",
    disabled: true,
    bgGradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
  },
  {
    id: "et",
    title: "Ət Satışı",
    description:
      "Teze və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.",
    color: RED,
    btnColor: RED_BTN,
    btnText: "Məhsullara Bax",
    href: "#",
    image: "/dana.jpg",
    imageFit: "object-cover",
    disabled: true,
  },
];

const WHY_FEATURES = [
  { Icon: Shield, label: "Halal Kəsim",      desc: "Dini qaydalara uyğun peşəkar kəsim",      color: GREEN },
  { Icon: Video,  label: "Video Hesabat",     desc: "Kəsim prosesini addım-addım izləyin",       color: GREEN },
  { Icon: Truck,  label: "Çatdırılma",        desc: "Sürətli və etibarlı çatdırılma",            color: GREEN },
  { Icon: Heart,  label: "Şəffaf Xeyriyyə",  desc: "Hər quruşun hesabatı, şəffaf paylaşım",    color: GREEN },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══════════════════════════════
          NAVBAR
          ═══════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid #f0f0f0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                <Image src="/logo.png" alt="MeatBox" width={36} height={36} className="w-full h-full object-cover" priority />
              </div>
              <div className="leading-none">
                <div className="text-[19px] font-black tracking-tight" style={{ color: "#111" }}>
                  MEAT<span style={{ color: GREEN }}>BOX</span>.AZ
                </div>
                <div className="text-[8px] font-semibold tracking-[0.12em] text-gray-400 uppercase">
                  Taze Ət · Qurbanlıq · Xeyriyyə
                </div>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors no-underline"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Link
                href="/qurban"
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white no-underline transition-opacity hover:opacity-90"
                style={{ background: GREEN }}
              >
                Daxil ol
              </Link>
              <button
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
                aria-label="Səbət"
              >
                <ShoppingCart size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
                aria-label="Menyu"
              >
                {mobileMenuOpen
                  ? <X size={22} className="text-gray-700" />
                  : <Menu size={22} className="text-gray-700" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map((item) => (
              <a
                key={item}
                href="#"
                className="py-2.5 text-sm font-semibold text-gray-700 border-b border-gray-50 no-underline"
              >
                {item}
              </a>
            ))}
            <Link
              href="/qurban"
              className="mt-2 w-full text-center py-3 rounded-xl text-sm font-bold text-white no-underline"
              style={{ background: GREEN }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Daxil ol
            </Link>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════
          HERO
          ═══════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 300 }}>
        {/* Background sheep image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/qoyun_big.png"
            alt="MeatBox qurban"
            fill
            className="object-cover object-center"
            style={{ opacity: 0.18 }}
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${GREEN} 0%, #1a6b24 55%, #14532d 100%)`,
              opacity: 0.93,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-12">

          {/* Text block */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {/* Brand heading */}
            <div className="flex items-center gap-3 mb-5 justify-center md:justify-start">
              <div
                className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ border: "2px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
              >
                <Image src="/logo.png" alt="logo" width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div>
                <div
                  className="text-3xl md:text-4xl font-black italic tracking-tight text-white leading-none"
                >
                  MEAT<span style={{ color: "#86efac" }}>BOX</span>.AZ
                </div>
                <div className="text-[10px] font-semibold tracking-[0.14em] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  TAZE ƏT · QURBANLIK · XEYRİYYƏ PLATFORMASI
                </div>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {[
                { icon: "✅", text: "Halal kəsim" },
                { icon: "📹", text: "Video hesabat" },
                { icon: "🚚", text: "Çatdırılma" },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                >
                  <span className="text-sm leading-none">{icon}</span>
                  <span className="text-xs font-semibold text-white">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sheep image — desktop right */}
          <div className="hidden md:block flex-shrink-0">
            <Image
              src="/qoyun_big.png"
              alt="Qurban"
              width={300}
              height={260}
              className="object-contain"
              style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))" }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          SERVICE CARDS
          ═══════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {SERVICES.map((svc) => (
            <ServiceCard key={svc.id} service={svc} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          WHY MEATBOX
          ═══════════════════════════════ */}
      <section
        className="py-10 md:py-14"
        style={{ background: "#f9fafb", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-xl md:text-2xl font-extrabold text-gray-900 mb-8 tracking-tight">
            Niyə MeatBox?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WHY_FEATURES.map(({ Icon, label, desc, color }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center bg-white rounded-2xl p-5"
                style={{ border: "1px solid #ebebeb", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 flex-shrink-0"
                  style={{ background: "#e8f5e9" }}
                >
                  <Icon size={22} strokeWidth={1.8} style={{ color }} />
                </div>
                <div className="text-[13px] font-bold text-gray-900 mb-1">{label}</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          FOOTER
          ═══════════════════════════════ */}
      <footer className="bg-gray-900 text-white pt-10 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/logo.png" alt="MeatBox" width={32} height={32} className="rounded-xl" />
                <span className="text-[17px] font-black">
                  MEAT<span style={{ color: "#86efac" }}>BOX</span>.AZ
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Taze Ət · Qurbanlıq · Xeyriyyə Platforması
              </p>
            </div>

            {/* Links */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Links</div>
              {["Haqqımızda", "Xidmətlər", "Necə işləyir?"].map((l) => (
                <a key={l} href="#" className="block text-sm text-gray-300 hover:text-white mb-2 transition-colors no-underline">
                  {l}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Əlaqə</div>
              <div className="flex items-center gap-2 mb-2">
                <Phone size={13} style={{ color: "#86efac", flexShrink: 0 }} />
                <span className="text-sm text-gray-300">+994 50 123 44 55</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={13} style={{ color: "#86efac", flexShrink: 0 }} />
                <span className="text-sm text-gray-300">info@meatbox.az</span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "f", href: "#" },
                  { label: "in", href: "#" },
                  { label: "wp", href: "#" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-300 transition-colors no-underline"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Ödəniş üsulları</div>
              <div className="flex flex-wrap gap-2">
                {["VISA", "MC", "tam."].map((p) => (
                  <div
                    key={p}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-200"
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="border-t pt-5 text-center text-xs text-gray-500"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            © 2024 MeatBox.az. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Service Card
   ───────────────────────────────────────────── */
function ServiceCard({ service }) {
  const { title, description, color, btnColor, btnText, href, image, imageFit, disabled, bgGradient } = service;

  const card = (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{
        border: "1px solid #e8e8e8",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          height: 188,
          background: bgGradient || "#f5f5f5",
        }}
      >
        {image && (
          <img
            src={image}
            alt={title}
            className={`w-full h-full ${imageFit || "object-cover"}`}
            style={{ opacity: disabled ? 0.7 : 1 }}
          />
        )}

        {/* Play button overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.15)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            <Play size={18} fill="white" color="white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Duration badge */}
        <div
          className="absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          0:15
        </div>

        {/* Coming soon badge */}
        {disabled && (
          <div
            className="absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          >
            Tezliklə
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="font-extrabold text-[15px] leading-snug mb-2"
          style={{ color }}
        >
          {title}
        </h3>
        <p className="text-[12px] text-gray-500 leading-relaxed flex-1 mb-4">
          {description}
        </p>

        {/* CTA Button */}
        <div
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{
            background: btnColor,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "default" : "pointer",
            boxShadow: disabled ? "none" : `0 2px 10px ${btnColor}55`,
          }}
        >
          {btnText}
          <ArrowRight size={15} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  if (disabled) {
    return card;
  }

  return (
    <Link href={href} className="no-underline block">
      {card}
    </Link>
  );
}
