"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, ArrowRight, ArrowLeft, MessageSquare, Beef } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
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
    title: "Kollektiv Qurban",
    text: "Dini qaydalara uyğun",
    icon: "/icon_charity.png",
    iconWrap: { border: "2px solid #e7d2ff", background: "#f6edff" },
  },
  {
    title: "Ət Sifarişi",
    text: "Qapınıza çatdırırıq",
    icon: null,
    IconComponent: Beef,
    iconColor: "#c85a13",
    iconWrap: { border: "2px solid rgba(200,90,19,0.3)", background: "#fff4ee" },
  },
];

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isGuest, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const abortRef = useRef(null);

  const navigate = (path) => { setIsExiting(true); setTimeout(() => router.push(path), 260); };

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    if (!authLoading && !isGuest) router.replace("/");
  }, [authLoading, isGuest, router]);

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
      const from = searchParams.get("from");
      if (from) sessionStorage.setItem("otp_from", from);
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
    <main className="h-screen overflow-hidden bg-background p-3 md:p-7" style={{ fontFamily: "'Manrope', sans-serif", color: "#111827" }}>
    <div style={{
      position: "relative",
      overflow: "hidden",
      borderRadius: "1.75rem",
      border: "1px solid rgba(255,255,255,0.13)",
      boxShadow: "0 25px 80px rgba(0,0,0,0.55)",
      background: "#130807",
      height: "100%",
      display: "grid",
      gridTemplateColumns: "1fr",
    }}
    className="lg:grid auth-grid-cols"
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
        className="hidden lg:flex flex-col justify-center px-[6vw] py-[4vh] h-full overflow-y-auto"
      >
        <Link
          href="/"
          className="hidden lg:flex"
          style={{
            position: "absolute", top: 20, left: 20,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}
        >
          <ArrowLeft size={18} />
        </Link>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 420, margin: "0 auto", width: "100%", textAlign: "center" }}>
          {/* Logo */}
          <div className="lp-fade-up" style={{ width: 200, display: "flex", alignItems: "center", justifyContent: "center", animationDelay: "0.05s" }}>
            <Image src="/meatbox logo bottom white.png" alt="MEATBOX.AZ loqosu" width={200} height={154} style={{ objectFit: "contain", width: "100%", height: "auto" }} />
          </div>

          {/* Slogan */}
          <div className="lp-fade-up" style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center", animationDelay: "0.18s" }}>
            {["ETİBARLI", "HALAL", "SÜRƏTLİ"].map((t, i) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)" }}>{t}</span>
                {i < 2 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "inline-block" }} />}
              </span>
            ))}
          </div>

          {/* Feature cards — staggered */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 9, width: "100%" }}>
            {features.map((feature, idx) => { const { title, text, icon, iconWrap } = feature; return (
              <div key={title} className="lp-fade-up" style={{
                display: "flex", alignItems: "center", gap: 12,
                borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.075)",
                padding: "10px 14px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.12)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                animationDelay: `${0.32 + idx * 0.12}s`,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", ...iconWrap }}>
                  {feature.IconComponent
                    ? <feature.IconComponent size={22} color={feature.iconColor} />
                    : <Image src={icon} alt={title} width={22} height={22} style={{ objectFit: "contain" }} />}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</div>
                  <div style={{ marginTop: 1, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{text}</div>
                </div>
              </div>
            ); })}
          </div>

        </div>
      </section>

      {/* Right panel — form */}
      <section style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", overflowX: "hidden" }}
        className="h-full overflow-y-auto"
      >
        <div style={{ margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", paddingTop: 8, paddingBottom: 8 }}>
        {/* Mobile branding — above card, hidden on desktop */}
        <div className="flex lg:hidden flex-col items-center auth-mobile-brand">
          <div className="auth-mobile-logo" style={{ width: 160 }}>
            <Image src="/meatbox logo bottom white.png" alt="MEATBOX.AZ" width={160} height={123} style={{ objectFit: "contain", width: "100%", height: "auto" }} />
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
            {["ETİBARLI", "HALAL", "SÜRƏTLİ"].map((t, i) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.85)" }}>{t}</span>
                {i < 2 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "inline-block" }} />}
              </span>
            ))}
          </div>
        </div>

        <div className={`auth-card auth-card-pad${isExiting ? " auth-card-out" : ""}`} style={{
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
              onClick={() => navigate(`/auth/login${searchParams.get("from") ? `?from=${encodeURIComponent(searchParams.get("from"))}` : ""}`)}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.6"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <ArrowLeft size={14} /> Geri qayıt
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.045em", color: "#111827", margin: 0 }}>Qeydiyyatdan keç</h2>
            <p style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>Yeni hesab yaradın və sifarişlərinizi rahat idarə edin.</p>
          </div>

          {/* Mode toggle — sliding pill */}
          <div style={{ marginTop: 12, position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f3f4f6", borderRadius: 14, padding: 3 }}>
            <div style={{
              position: "absolute", top: 3, bottom: 3,
              width: "calc(50% - 3px)",
              left: mode === "phone" ? 3 : "calc(50%)",
              background: "#fff",
              borderRadius: 11,
              boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
              border: "1px solid #ef9caf",
              transition: "left 0.22s cubic-bezier(0.34,1.4,0.64,1)",
              pointerEvents: "none",
            }} />
            {[
              { key: "phone", icon: <MessageSquare size={14} />, label: "SMS" },
              { key: "email", icon: <Mail size={14} />, label: "Email" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                style={{
                  position: "relative", zIndex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  borderRadius: 11, padding: "7px 0", fontSize: 12, fontWeight: 800,
                  border: "none", background: "transparent",
                  color: mode === key ? "#c8102e" : "#6b7280",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "color 0.22s ease",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Phone / Email */}
            {mode === "phone" ? (
              <label key="phone" className="auth-tab-field" style={{ display: "block" }}>
                <span style={{ display: "block", marginBottom: 2, fontSize: 12, fontWeight: 800, color: "#1f2937" }}>Telefon nömrəsi</span>
                <div style={{ display: "flex", overflow: "hidden", borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", borderRight: "1px solid #e5e7eb", fontSize: 13, fontWeight: 800, color: "#c8102e", whiteSpace: "nowrap", flexShrink: 0 }}>AZ +994</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 9))); setError(""); }}
                    placeholder="50 123 45 67"
                    style={{ height: 40, flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 14px", fontSize: 14, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}
                    autoFocus
                    inputMode="numeric"
                  />
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, marginLeft: 4 }}>Nömrənizə doğrulama kodu göndəriləcək</p>
              </label>
            ) : (
              <label key="email" className="auth-tab-field" style={{ display: "block" }}>
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
                    onClick={() => router.push(`/auth/login${searchParams.get("from") ? `?from=${encodeURIComponent(searchParams.get("from"))}` : ""}`)}
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
              className="auth-btn-primary"
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
            <button
              type="button"
              onClick={() => navigate(`/auth/login${searchParams.get("from") ? `?from=${encodeURIComponent(searchParams.get("from"))}` : ""}`)}
              className="auth-btn-outline"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 40, width: "100%", borderRadius: 14, border: "1.5px solid #e5e7eb",
                background: "#fff", color: "#111827",
                fontSize: 14, fontWeight: 800,
                fontFamily: "inherit", cursor: "pointer",
              }}
            >
              Daxil ol
            </button>
          </form>
        </div>
        </div>{/* end margin:auto wrapper */}
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-fade-up {
          opacity: 0;
          animation: lpFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes authCardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes authCardOut {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(-18px) scale(0.97); }
        }
        @keyframes authTabField {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .auth-card { animation: authCardIn 0.38s cubic-bezier(0.34,1.4,0.64,1) both; }
        .auth-card-out { animation: authCardOut 0.24s ease-in both !important; }
        .auth-tab-field { animation: authTabField 0.22s ease both; }
        .auth-btn-primary { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
        .auth-btn-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-2px); box-shadow: 0 16px 32px rgba(242,11,50,0.28) !important; }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .auth-btn-outline { transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease; }
        .auth-btn-outline:hover { background: #f9fafb !important; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08) !important; }
        .auth-btn-outline:active { transform: translateY(0) scale(0.98); }
        @media (max-width: 420px) {
          .auth-card-pad { padding: 24px 20px !important; }
        }
        @media (min-width: 1024px) {
          .auth-grid-cols { grid-template-columns: 1.22fr 0.78fr !important; }
        }
        @media (max-height: 720px) and (max-width: 1023px) {
          .auth-mobile-logo { width: 110px !important; }
          .auth-mobile-brand { gap: 4px !important; }
        }
        @media (max-height: 620px) and (max-width: 1023px) {
          .auth-mobile-brand { display: none !important; }
        }
      `}</style>
    </div>
    </main>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterPageInner /></Suspense>;
}
