"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, Menu, X, ArrowRight, Play,
  ShieldCheck, Video, Truck, Heart, Phone, Mail, User,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp, FaHandshake } from "react-icons/fa";
import { GiGoat, GiMeat } from "react-icons/gi";

/* ── rənglər ── */
const G  = "#1B5E20";
const GM = "#2E7D32";
const P  = "#6B21A8";
const PM = "#7C3AED";
const R  = "#B91C1C";
const RM = "#DC2626";

const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    desc: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdəkindən çıxmadan etibarlı xidmət.",
    href: "/qurban",
    img: "/qoyun.jpg",
    imgFit: "cover",
    imgBg: "#f3f3f3",
    color: G,
    btn: GM,
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
    color: P,
    btn: PM,
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
    color: R,
    btn: RM,
    btnShadow: "0 6px 18px -4px rgba(185,28,28,0.5)",
    btnLabel: "Məhsullara Bax",
    ServiceIcon: GiMeat,
    disabled: true,
  },
];

const WHY = [
  { Icon: ShieldCheck, label: "Halal Kəsim",    desc: "Dini qaydalara uyğun peşəkar kəsim" },
  { Icon: Video,       label: "Video Hesabat",   desc: "Kəsim prosesini addım-addım izləyin" },
  { Icon: Truck,       label: "Çatdırılma",      desc: "Sürətli və etibarlı çatdırılma" },
  { Icon: Heart,       label: "Şəffaf Xeyriyyə", desc: "Hər qəpiyin hesabatı, şəffaf pay bölgüsü" },
];

export default function LandingPage() {
  const [open, setOpen]       = useState(false);
  const [shadow, setShadow]   = useState(false);

  useEffect(() => {
    const fn = () => setShadow(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter',sans-serif", color: "#111" }}>
      <style>{`html{scroll-behavior:smooth}*{box-sizing:border-box}`}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: shadow ? "none" : "1px solid #F0F0F0",
        boxShadow: shadow ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow .25s",
      }}>
        <nav style={{ maxWidth: 1152, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", display: "block", border: "1px solid #EEE", flexShrink: 0 }}>
              <Image src="/logo.png" alt="MeatBox" width={38} height={38} style={{ width: "100%", height: "100%", objectFit: "cover" }} priority />
            </span>
            <span style={{ lineHeight: 1.1 }}>
              <span style={{ display: "block", fontSize: 19, fontWeight: 900, letterSpacing: "-0.5px", color: "#111" }}>
                MEAT<span style={{ color: G }}>BOX</span>.AZ
              </span>
              <span style={{ display: "block", fontSize: 8, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>
                Taze Ət · Qurbanlıq · Xeyriyyə
              </span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ gap: 28 }}>
            {["Haqqımızda","Xidmətlər","Necə işləyir?","Əlaqə"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g,"")}`}
                style={{ fontSize: 14, fontWeight: 600, color: "#555", textDecoration: "none" }}
                onMouseEnter={e=>e.target.style.color=G}
                onMouseLeave={e=>e.target.style.color="#555"}
              >{l}</a>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/qurban" className="hidden md:flex"
              style={{ alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", background: G, textDecoration: "none" }}
            >
              <User size={14} strokeWidth={2.5} />
              Daxil ol
            </Link>
            <button style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#F5F5F5"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <ShoppingCart size={19} color="#555" />
            </button>
            <button className="md:hidden"
              onClick={() => setOpen(v => !v)}
              style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {open ? <X size={22} color="#333" /> : <Menu size={22} color="#333" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden" style={{ borderTop: "1px solid #F0F0F0", background: "#fff", padding: "8px 20px 16px" }}>
            {["Haqqımızda","Xidmətlər","Necə işləyir?","Əlaqə"].map(l => (
              <a key={l} href="#" onClick={() => setOpen(false)}
                style={{ display: "block", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#374151", borderBottom: "1px solid #F9F9F9", textDecoration: "none" }}
              >{l}</a>
            ))}
            <Link href="/qurban" onClick={() => setOpen(false)}
              style={{ display: "block", marginTop: 10, padding: 12, borderRadius: 10, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", background: G, textDecoration: "none" }}
            >Daxil ol</Link>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 320 }}>
        {/* farm background */}
        <Image src="/qoyun.jpg" alt="hero" fill style={{ objectFit: "cover", objectPosition: "center 30%", opacity: 0.25 }} priority />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${G} 0%,#1a7028 55%,#14532d 100%)`, opacity: 0.94 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1152, margin: "0 auto", padding: "52px 20px 56px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28, textAlign: "center" }}>

          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}>
              <Image src="/logo.png" alt="MeatBox logo" width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1, fontStyle: "italic" }}>
                MEAT<span style={{ color: "#86EFAC" }}>BOX</span>.AZ
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", marginTop: 5 }}>
                Taze Ət &nbsp;·&nbsp; Qurbanlıq &nbsp;·&nbsp; Xeyriyyə Platforması
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              { Icon: ShieldCheck, label: "Halal kəsim" },
              { Icon: Video,       label: "Video hesabat" },
              { Icon: Truck,       label: "Çatdırılma" },
            ].map(({ Icon, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "7px 14px", borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(6px)",
              }}>
                <Icon size={15} color="#86EFAC" strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SERVICE CARDS ══════════ */}
      <section style={{ maxWidth: 1152, margin: "0 auto", padding: "52px 20px" }}>
        {/* Desktop: 3 columns */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {SERVICES.map(svc => <DesktopCard key={svc.id} s={svc} />)}
        </div>

        {/* Mobile: vertical stack */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SERVICES.map(svc => <MobileCard key={svc.id} s={svc} />)}
        </div>
      </section>

      {/* ══════════ NIYİ MEATBOX ══════════ */}
      <section style={{ background: "#F8FAF8", borderTop: "1px solid #EBEBEB", borderBottom: "1px solid #EBEBEB", padding: "48px 20px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.3px" }}>
            Niyə MeatBox?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="grid-cols-2 md:grid-cols-4">
            {WHY.map(({ Icon, label, desc }) => (
              <div key={label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                background: "#fff", borderRadius: 16, padding: "24px 16px",
                border: "1px solid #EBEBEB", boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon size={24} strokeWidth={1.8} color={G} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: "#111827", color: "#fff", padding: "44px 20px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32, marginBottom: 36 }} className="grid-cols-2 md:grid-cols-4">

            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Image src="/logo.png" alt="MeatBox" width={32} height={32} style={{ borderRadius: 8 }} />
                <span style={{ fontSize: 17, fontWeight: 900 }}>MEAT<span style={{ color: "#86EFAC" }}>BOX</span>.AZ</span>
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Taze Ət · Qurbanlıq · Xeyriyyə Platforması</p>
            </div>

            {/* Links */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Links</div>
              {["Haqqımızda","Xidmətlər","Necə işləyir?"].map(l => (
                <a key={l} href="#" style={{ display: "block", fontSize: 13, color: "#D1D5DB", marginBottom: 8, textDecoration: "none" }}
                  onMouseEnter={e=>e.target.style.color="#fff"}
                  onMouseLeave={e=>e.target.style.color="#D1D5DB"}
                >{l}</a>
              ))}
            </div>

            {/* Əlaqə */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Əlaqə</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Phone size={13} color="#86EFAC" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#D1D5DB" }}>+994 50 123 44 55</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Mail size={13} color="#86EFAC" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#D1D5DB" }}>info@meatbox.az</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[FaFacebook, FaInstagram, FaWhatsapp].map((Icon, i) => (
                  <a key={i} href="#" style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.16)"}
                    onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"}
                  >
                    <Icon size={15} color="#D1D5DB" />
                  </a>
                ))}
              </div>
            </div>

            {/* Ödəniş */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Ödəniş üsulları</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["VISA","Mastercard","tam."].map(p => (
                  <div key={p} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#E5E7EB", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>{p}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#6B7280" }}>
            © 2024 MeatBox.az. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Desktop kart: başlıq → şəkil → mətn → düymə ─── */
function DesktopCard({ s }) {
  const { title, desc, href, img, imgFit, imgBg, color, btn, btnShadow, btnLabel, ServiceIcon, disabled } = s;

  const inner = (
    <div
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden",
        border: "1px solid #E8E8E8", boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        display: "flex", flexDirection: "column", height: "100%",
        transition: "transform .22s,box-shadow .22s",
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,0.13)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)"; }}
    >
      {/* 1. Başlıq */}
      <div style={{ padding: "18px 18px 14px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1.35, margin: 0, letterSpacing: "-0.2px" }}>
          {title}
        </h3>
      </div>

      {/* 2. Thumbnail */}
      <div style={{ position: "relative", height: 190, flexShrink: 0, background: imgBg, overflow: "hidden" }}>
        <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: imgFit, objectPosition: "center", opacity: disabled ? 0.7 : 1 }} />
        {/* qaranlıq overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.16)" }} />

        {/* play düyməsi */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(0,0,0,0.48)", backdropFilter: "blur(4px)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={17} fill="white" color="white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* xidmət ikonu — sağ üst */}
        <div style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.22)" }}>
          <ServiceIcon size={16} color="#fff" />
        </div>

        {/* 0:15 badge */}
        <div style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 6px", borderRadius: 5, background: "rgba(0,0,0,0.62)", fontSize: 10, fontWeight: 700, color: "#fff" }}>
          0:15
        </div>

        {disabled && (
          <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)", fontSize: 10, fontWeight: 700, color: "#fff" }}>
            Tezliklə
          </div>
        )}
      </div>

      {/* 3. Mətn + düymə */}
      <div style={{ padding: "14px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65, flex: 1, marginBottom: 16 }}>{desc}</p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "11px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff",
          background: btn, boxShadow: disabled ? "none" : btnShadow,
          opacity: disabled ? 0.45 : 1, letterSpacing: "0.01em",
        }}>
          {btnLabel} <ArrowRight size={14} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  if (disabled) return <div style={{ height: "100%" }}>{inner}</div>;
  return <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>{inner}</Link>;
}

/* ─── Mobil kart: üfüqi — mətn sol, şəkil sağ ─── */
function MobileCard({ s }) {
  const { title, desc, href, img, imgFit, imgBg, color, btn, btnShadow, btnLabel, ServiceIcon, disabled } = s;

  const inner = (
    <div style={{
      background: "#fff", borderRadius: 16, overflow: "hidden",
      border: "1px solid #E8E8E8", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      display: "flex", minHeight: 130,
    }}>
      {/* Sol: mətn */}
      <div style={{ flex: 1, padding: "14px 14px 14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1.3, margin: "0 0 6px" }}>{title}</h3>
          <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.55, margin: 0 }}>{desc}</p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          marginTop: 10, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
          color: "#fff", background: btn, boxShadow: disabled ? "none" : btnShadow,
          opacity: disabled ? 0.45 : 1, alignSelf: "flex-start",
        }}>
          {btnLabel} <ArrowRight size={13} strokeWidth={2.5} />
        </div>
      </div>

      {/* Sağ: şəkil */}
      <div style={{ width: 130, flexShrink: 0, position: "relative", background: imgBg, overflow: "hidden" }}>
        <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: imgFit, objectPosition: "center", opacity: disabled ? 0.7 : 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.16)" }} />

        {/* play */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* xidmət ikonu */}
        <div style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.9)" }}>
          <ServiceIcon size={13} color="#fff" />
        </div>

        {/* 0:15 */}
        <div style={{ position: "absolute", bottom: 6, right: 6, padding: "2px 5px", borderRadius: 4, background: "rgba(0,0,0,0.6)", fontSize: 9, fontWeight: 700, color: "#fff" }}>
          0:15
        </div>

        {disabled && (
          <div style={{ position: "absolute", top: 8, left: 6, padding: "2px 6px", borderRadius: 999, background: "rgba(0,0,0,0.6)", fontSize: 9, fontWeight: 700, color: "#fff" }}>
            Tezliklə
          </div>
        )}
      </div>
    </div>
  );

  if (disabled) return inner;
  return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
}
