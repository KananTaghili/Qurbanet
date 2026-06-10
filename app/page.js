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
  ShieldCheck,
  Video,
  Truck,
  Heart,
  Phone,
  Mail,
  MessageCircle,
  Beef,
  Users,
  Scissors,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

const GREEN       = "#1B5E20";
const GREEN_MID   = "#2E7D32";
const GREEN_LIGHT = "#4CAF50";
const PURPLE      = "#6B21A8";
const PURPLE_MID  = "#7C3AED";
const RED         = "#B91C1C";
const RED_MID     = "#DC2626";

const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    description:
      "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdəkindən çıxmadan etibarlı xidmət.",
    color: GREEN,
    btnColor: GREEN_MID,
    btnShadow: "0 4px 14px rgba(27,94,32,0.35)",
    btnText: "Sifariş Et",
    href: "/qurban",
    image: "/qoyun.jpg",
    imageFit: "object-cover",
    ServiceIcon: Scissors,
    iconBg: GREEN,
    disabled: false,
  },
  {
    id: "xeyriyye",
    title: "Kollektiv Qurban-Xeyriyyə Platforması",
    description:
      "Birlikdə qurban kəsdirik, ehtiyacı olanlara pay göndəririk. Şəffaf və etibarlı xeyriyyə platformasına qoşulun.",
    color: PURPLE,
    btnColor: PURPLE_MID,
    btnShadow: "0 4px 14px rgba(109,40,217,0.35)",
    btnText: "Qoşul",
    href: "#",
    image: "/qutu.png",
    imageFit: "object-contain",
    imageBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    ServiceIcon: Users,
    iconBg: PURPLE,
    disabled: true,
  },
  {
    id: "et",
    title: "Ət Satışı",
    description:
      "Teze və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.",
    color: RED,
    btnColor: RED_MID,
    btnShadow: "0 4px 14px rgba(185,28,28,0.35)",
    btnText: "Məhsullara Bax",
    href: "#",
    image: "/dana.jpg",
    imageFit: "object-cover",
    ServiceIcon: Beef,
    iconBg: RED,
    disabled: true,
  },
];

const WHY_FEATURES = [
  {
    Icon: ShieldCheck,
    label: "Halal Kəsim",
    desc: "Dini qaydalara uyğun peşəkar kəsim",
    iconColor: GREEN,
    iconBg: "#E8F5E9",
  },
  {
    Icon: Video,
    label: "Video Hesabat",
    desc: "Kəsim prosesini addım-addım izləyin",
    iconColor: GREEN,
    iconBg: "#E8F5E9",
  },
  {
    Icon: Truck,
    label: "Çatdırılma",
    desc: "Sürətli və etibarlı çatdırılma",
    iconColor: GREEN,
    iconBg: "#E8F5E9",
  },
  {
    Icon: Heart,
    label: "Şəffaf Xeyriyyə",
    desc: "Hər quruşun hesabatı, şəffaf paylaşım",
    iconColor: GREEN,
    iconBg: "#E8F5E9",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════════════════════
          NAVBAR
          ══════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid #EBEBEB", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 20px" }}>
          <div className="flex items-center justify-between" style={{ height: 64 }}>

            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid #F0F0F0" }}>
                <Image src="/logo.png" alt="MeatBox" width={38} height={38} style={{ width: "100%", height: "100%", objectFit: "cover" }} priority />
              </div>
              <div style={{ lineHeight: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "-0.5px" }}>
                  MEAT<span style={{ color: GREEN }}>BOX</span>.AZ
                </div>
                <div style={{ fontSize: 8, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>
                  Taze Ət · Qurbanlıq · Xeyriyyə
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 28 }}>
              {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map((item) => (
                <a key={item} href="#" style={{ fontSize: 14, fontWeight: 600, color: "#4B5563", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.target.style.color = "#111"}
                  onMouseLeave={e => e.target.style.color = "#4B5563"}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/qurban"
                className="hidden md:flex"
                style={{
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  background: GREEN,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Daxil ol
              </Link>

              <button
                style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                aria-label="Səbət"
              >
                <ShoppingCart size={19} color="#555" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer" }}
                className="md:hidden"
                aria-label="Menyu"
              >
                {mobileMenuOpen ? <X size={22} color="#333" /> : <Menu size={22} color="#333" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{ borderTop: "1px solid #F3F3F3", background: "#fff", padding: "8px 20px 16px" }} className="md:hidden">
            {["Haqqımızda", "Xidmətlər", "Necə işləyir?", "Əlaqə"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ display: "block", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#374151", borderBottom: "1px solid #F9F9F9", textDecoration: "none" }}
              >
                {item}
              </a>
            ))}
            <Link
              href="/qurban"
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: "block", marginTop: 10, padding: "12px", borderRadius: 10, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", background: GREEN, textDecoration: "none" }}
            >
              Daxil ol
            </Link>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════
          HERO
          ══════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 320 }}>
        {/* BG image */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/qoyun.jpg"
            alt="hero"
            fill
            style={{ objectFit: "cover", objectPosition: "center", opacity: 0.22 }}
            priority
          />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${GREEN} 0%, #1a6e25 55%, #14532d 100%)`, opacity: 0.94 }} />
        </div>

        <div
          style={{ position: "relative", zIndex: 10, maxWidth: 1152, margin: "0 auto", padding: "52px 20px 56px", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}
        >
          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.28)", boxShadow: "0 4px 20px rgba(0,0,0,0.22)" }}>
                <Image src="/logo.png" alt="logo" width={60} height={60} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: "-0.8px", lineHeight: 1 }}>
                  MEAT<span style={{ color: "#86EFAC" }}>BOX</span>.AZ
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>
                  Taze Ət · Qurbanlıq · Xeyriyyə Platforması
                </div>
              </div>
            </div>

            {/* Feature badges — lucide icons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { Icon: ShieldCheck, label: "Halal kəsim" },
                { Icon: Video,       label: "Video hesabat" },
                { Icon: Truck,       label: "Çatdırılma" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.14)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Icon size={14} color="#86EFAC" strokeWidth={2.2} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sheep — desktop */}
          <div className="hidden md:block" style={{ flexShrink: 0 }}>
            <Image
              src="/qoyun_big.png"
              alt="Qurban"
              width={280}
              height={240}
              style={{ objectFit: "contain", filter: "drop-shadow(0 8px 28px rgba(0,0,0,0.38))" }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SERVICE CARDS
          ══════════════════════════════ */}
      <section style={{ maxWidth: 1152, margin: "0 auto", padding: "52px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
          className="grid-cols-1 sm:grid-cols-1 md:grid-cols-3"
        >
          {SERVICES.map((svc) => (
            <ServiceCard key={svc.id} service={svc} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          WHY MEATBOX
          ══════════════════════════════ */}
      <section style={{ background: "#F8FAF8", borderTop: "1px solid #EBEBEB", borderBottom: "1px solid #EBEBEB", padding: "48px 20px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 32, letterSpacing: "-0.4px" }}>
            Niyə MeatBox?
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="grid-cols-2 md:grid-cols-4">
            {WHY_FEATURES.map(({ Icon, label, desc, iconColor, iconBg }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  background: "#fff",
                  borderRadius: 16,
                  padding: "24px 16px",
                  border: "1px solid #EBEBEB",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 14, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0 }}>
                  <Icon size={24} strokeWidth={1.8} color={iconColor} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
          ══════════════════════════════ */}
      <footer style={{ background: "#111827", color: "#fff", padding: "44px 20px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, marginBottom: 36 }} className="grid-cols-2 md:grid-cols-4">

            {/* Brand */}
            <div style={{ gridColumn: "span 1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Image src="/logo.png" alt="MeatBox" width={32} height={32} style={{ borderRadius: 8 }} />
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
                  MEAT<span style={{ color: "#86EFAC" }}>BOX</span>.AZ
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                Taze Ət · Qurbanlıq · Xeyriyyə Platforması
              </p>
            </div>

            {/* Links */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Links</div>
              {["Haqqımızda", "Xidmətlər", "Necə işləyir?"].map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{ display: "block", fontSize: 13, color: "#D1D5DB", marginBottom: 9, textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "#D1D5DB"}
                >
                  {l}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Əlaqə</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <Phone size={13} color="#86EFAC" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#D1D5DB" }}>+994 50 123 44 55</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Mail size={13} color="#86EFAC" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#D1D5DB" }}>info@meatbox.az</span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { Icon: FaFacebook,   href: "#" },
                  { Icon: FaInstagram,  href: "#" },
                  { Icon: FaWhatsapp,   href: "#" },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  >
                    <Icon size={15} color="#D1D5DB" strokeWidth={1.8} />
                  </a>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Ödəniş üsulları</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["VISA", "MC", "tam."].map((p) => (
                  <div
                    key={p}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#E5E7EB",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#6B7280" }}>
            © 2024 MeatBox.az. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────
   Service Card
   ───────────────────────────────────── */
function ServiceCard({ service }) {
  const { title, description, color, btnColor, btnShadow, btnText, href, image, imageFit, imageBg, ServiceIcon, iconBg, disabled } = service;

  const inner = (
    <div
      className="service-card-inner"
      style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E8E8E8",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        height: "100%",
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,0.13)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)";
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          height: 192,
          background: imageBg || "#f3f3f3",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {image && (
          <img
            src={image}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageFit || "cover",
              objectPosition: "center",
              opacity: disabled ? 0.72 : 1,
            }}
          />
        )}

        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)" }} />

        {/* Play button */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
            }}
          >
            <Play size={18} fill="white" color="white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Service icon badge — top right */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
            border: "2px solid rgba(255,255,255,0.85)",
          }}
        >
          <ServiceIcon size={17} color="#fff" strokeWidth={2} />
        </div>

        {/* Duration badge */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            padding: "2px 7px",
            borderRadius: 5,
            background: "rgba(0,0,0,0.62)",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          0:15
        </div>

        {/* Coming soon */}
        {disabled && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Tezliklə
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "18px 18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color,
            lineHeight: 1.35,
            marginBottom: 8,
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "#6B7280",
            lineHeight: 1.65,
            flex: 1,
            marginBottom: 18,
          }}
        >
          {description}
        </p>

        {/* CTA button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "11px 0",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            background: btnColor,
            boxShadow: disabled ? "none" : btnShadow,
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? "default" : "pointer",
            letterSpacing: "0.01em",
          }}
        >
          {btnText}
          <ArrowRight size={15} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  if (disabled) {
    return <div style={{ height: "100%" }}>{inner}</div>;
  }

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      {inner}
    </Link>
  );
}
