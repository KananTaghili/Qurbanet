"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, ArrowRight, ArrowLeft, MessageSquare, ShieldCheck } from "lucide-react";
import api from "../../../lib/api";

const formatPhone = (val) => {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

const features = [
  {
    title: "Qurbanlıq Sifarişi",
    text: "Kəsimi izləyin",
    icon: "/icon_qurban.png",
    iconWrap: { border: "2px solid #b9f7cf", background: "#eafbf0" },
  },
  {
    title: "Kollektiv Qurban-Xeyriyyə",
    text: "Dini qaydalara uyğun",
    icon: "/icon_charity.png",
    iconWrap: { border: "2px solid #e7d2ff", background: "#f6edff" },
  },
  {
    title: "Ət Sifarişi",
    text: "Qapınıza çatdırırıq",
    icon: "/icon_meat.png",
    iconWrap: { border: "2px solid #ffc6cc", background: "#fff0f1" },
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const switchMode = (m) => { setMode(m); setError(""); setPhone(""); setEmail(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (mode === "phone") {
      if (phone.replace(/\s/g, "").length < 9) { setError("Düzgün telefon nömrəsi daxil edin."); return; }
    } else {
      if (!email.trim() || !email.includes("@")) { setError("Düzgün email ünvanı daxil edin."); return; }
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const body = {};
      let identifier;
      if (mode === "phone") {
        const raw = phone.replace(/\s/g, "");
        identifier = raw.startsWith("0") ? "+994" + raw.slice(1) : raw.startsWith("+994") ? raw : "+994" + raw;
        body.phone = identifier;
      } else {
        identifier = email.trim().toLowerCase();
        body.email = identifier;
      }
      await api.post("/auth/send-otp", { ...body, isRegister: true }, { signal: abortRef.current.signal });
      sessionStorage.setItem("otp_identifier", identifier);
      sessionStorage.setItem("otp_identifier_type", mode === "email" ? "email" : "phone");
      router.push("/auth/otp");
    } catch (err) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) {
        setError(msg || (mode === "phone" ? "Bu telefon nömrəsi artıq qeydiyyatdan keçib." : "Bu email artıq qeydiyyatdan keçib."));
      } else {
        setError(msg || "Xəta baş verdi. Yenidən cəhd edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      overflow: "hidden",
      background: "#241331",
      fontFamily: "'Manrope', sans-serif",
      color: "#111827",
      position: "relative",
      display: "grid",
      gridTemplateColumns: "1fr",
    }}
    className="lg:grid lg:h-screen auth-grid-cols"
    >
      {/* Background image */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <Image
          src="/auth_bg.jpg"
          alt="Arxa fon"
          fill
          style={{ objectFit: "cover", objectPosition: "center", opacity: 0.55 }}
          priority
        />
      </div>

      {/* Left panel */}
      <section style={{ position: "relative", zIndex: 1, color: "#fff" }}
        className="hidden lg:flex flex-col justify-center px-[6vw] py-[4vh] min-h-screen"
      >
        <Link
          href="/"
          style={{
            position: "absolute", top: 20, left: 20,
            width: 36, height: 36, borderRadius: 12,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}
        >
          <ArrowLeft size={18} />
        </Link>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 460, margin: "0 auto", width: "100%", textAlign: "center" }}>
          {/* Logo */}
          <div style={{ width: 192, height: 192, display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
            <Image src="/meatbox_icon.png" alt="MEATBOX.AZ loqosu" width={220} height={220} style={{ objectFit: "contain", transform: "scale(1.15)" }} />
          </div>

          {/* Brand title */}
          <h1 style={{ marginTop: 20, fontSize: "clamp(2.2rem,3.5vw,3.8rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.045em", color: "#fff" }}>
            MEAT<span style={{ color: "#ff1236" }}>BOX</span>
          </h1>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, fontSize: "clamp(0.75rem,0.85vw,0.9rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.28em", color: "rgba(255,255,255,0.8)" }}>
            <span>Etibarlı</span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c2dca", display: "inline-block" }} />
            <span>Halal</span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#24b34b", display: "inline-block" }} />
            <span>Sürətli</span>
          </div>

          {/* Feature cards */}
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            {features.map(({ title, text, icon, iconWrap }) => (
              <div key={title} style={{
                display: "flex", alignItems: "center", gap: 14,
                borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.075)",
                padding: "12px 16px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 40px rgba(0,0,0,0.15)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px rgba(0,0,0,0.14)", ...iconWrap }}>
                  <Image src={icon} alt={title} width={28} height={28} style={{ objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</div>
                  <div style={{ marginTop: 2, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{text}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer tagline */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "#fff" }}>
            <ShieldCheck size={16} />
            <span>Təmiz ət</span>
            <span style={{ color: "#7c2dca" }}>•</span>
            <span>Təmiz niyyət</span>
            <span style={{ color: "#ef1234" }}>•</span>
            <span>Təmiz xidmət</span>
          </div>
        </div>
      </section>

      {/* Right panel — form */}
      <section style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        className="min-h-screen lg:min-h-0 lg:h-screen"
      >
        {/* Mobile back button */}
        <Link
          href="/"
          className="lg:hidden"
          style={{
            position: "absolute", top: 16, left: 16,
            width: 36, height: 36, borderRadius: 12,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}
        >
          <ArrowLeft size={18} />
        </Link>

        <div style={{
          width: "100%",
          maxWidth: 365,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 24px 90px rgba(15,23,42,0.16)",
          padding: "28px 32px",
          fontFamily: "'Manrope', sans-serif",
        }}>
          {/* Back to login */}
          <div>
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              <ArrowLeft size={14} /> Geri qayıt
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.045em", color: "#111827", margin: 0 }}>Qeydiyyatdan keç</h2>
            <p style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>Yeni hesab yaradın və sifarişlərinizi rahat idarə edin.</p>
          </div>

          {/* Mode toggle */}
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", background: "#fff", borderRadius: 15, border: "1px solid #e5e7eb", padding: 2 }}>
            {[
              { key: "phone", icon: <MessageSquare size={14} />, label: "SMS" },
              { key: "email", icon: <Mail size={14} />, label: "Email" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  borderRadius: 13, padding: "6px 0", fontSize: 12, fontWeight: 800,
                  border: mode === key ? "1px solid #ef9caf" : "1px solid transparent",
                  background: mode === key ? "#fff" : "transparent",
                  color: mode === key ? "#c8102e" : "#6b7280",
                  boxShadow: mode === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Phone / Email */}
            {mode === "phone" ? (
              <label style={{ display: "block" }}>
                <span style={{ display: "block", marginBottom: 2, fontSize: 12, fontWeight: 800, color: "#1f2937" }}>Telefon nömrəsi</span>
                <div style={{ display: "flex", overflow: "hidden", borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" }}>
                  <span style={{ display: "flex", minWidth: 56, alignItems: "center", justifyContent: "center", borderRight: "1px solid #e5e7eb", fontSize: 12, fontWeight: 800, color: "#c8102e" }}>AZ</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 9))); setError(""); }}
                    placeholder="+994   50 123 45 67"
                    style={{ height: 40, flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 20px", fontSize: 14, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}
                    autoFocus
                    inputMode="numeric"
                  />
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, marginLeft: 4 }}>Nömrənizə doğrulama kodu göndəriləcək</p>
              </label>
            ) : (
              <label style={{ display: "block" }}>
                <span style={{ display: "block", marginBottom: 2, fontSize: 12, fontWeight: 800, color: "#1f2937" }}>Email ünvanı</span>
                <div style={{ display: "flex", alignItems: "center", overflow: "hidden", borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", padding: "0 12px" }}>
                  <Mail size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="email@gmail.com"
                    style={{ height: 40, flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 10px", fontSize: 14, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, marginLeft: 4 }}>Email-inizə doğrulama kodu göndəriləcək</p>
              </label>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 600, padding: "10px 14px", borderRadius: 10 }}>
                {error}
                {error.includes("artıq") && (
                  <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    style={{ display: "block", marginTop: 4, background: "none", border: "none", cursor: "pointer", color: "#c8102e", fontSize: 12, fontWeight: 700, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}
                  >
                    Daxil ol səhifəsinə keç →
                  </button>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                height: 40, width: "100%", borderRadius: 14, border: "none",
                background: loading ? "#9ca3af" : "#f20b32",
                color: "#fff", fontSize: 14, fontWeight: 800,
                boxShadow: loading ? "none" : "0 10px 20px rgba(242,11,50,0.15)",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 15, height: 15, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Göndərilir...
                </span>
              ) : (
                <>
                  {mode === "phone" ? <MessageSquare size={15} /> : <Mail size={15} />}
                  Kod al
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#9ca3af" }}>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span>Artıq hesabınız var?</span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>

            {/* Login link */}
            <Link
              href="/auth/login"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 40, borderRadius: 14, border: "1.5px solid #e5e7eb",
                background: "#fff", color: "#111827",
                fontSize: 14, fontWeight: 800, textDecoration: "none",
                fontFamily: "inherit",
              }}
            >
              Daxil ol
            </Link>
          </form>
        </div>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .auth-grid-cols { grid-template-columns: 1.22fr 0.78fr !important; }
        }
      `}</style>
    </main>
  );
}
