"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, ArrowRight, ArrowLeft, MessageSquare } from "lucide-react";
import api from "../../../lib/api";

const formatPhone = (val) => {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

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
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8faf8" }}>
      {/* ── Sol panel — MeatBox branding ── */}
      <div
        style={{
          width: "42%",
          minHeight: "100vh",
          background: "linear-gradient(160deg,#1B5E20 0%,#2E7D32 55%,#388E3C 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
        }}
        className="hidden lg:flex"
      >
        <Link
          href="/"
          style={{
            position: "absolute", top: 20, left: 20,
            width: 36, height: 36, borderRadius: 12,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
        </Link>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
          <div style={{
            width: 120, height: 120, borderRadius: 28, overflow: "hidden",
            border: "2.5px solid rgba(255,255,255,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            background: "rgba(255,255,255,0.12)",
          }}>
            <Image src="/logo.png" alt="MeatBox" width={120} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div>
            <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: "-1px", lineHeight: 1 }}>
              MEAT<span style={{ color: "#86efac" }}>BOX</span>.AZ
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 10, lineHeight: 1.6, maxWidth: 220 }}>
              Taze Ət · Qurbanlıq · Xeyriyyə Platforması
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            {[
              { label: "Halal kəsim", desc: "Dini qaydalara uyğun" },
              { label: "Video hesabat", desc: "Kəsimi izləyin" },
              { label: "Sürətli çatdırılma", desc: "Qapınıza çatdırırıq" },
            ].map(({ label, desc }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 16px",
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["ETİBARLI", "HALAL", "SÜRƏTLİ"].map((t, i) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>{t}</span>
                {i < 2 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sağ panel — Form ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

        {/* Mobile back + logo */}
        <div className="lg:hidden" style={{ width: "100%", maxWidth: 400, marginBottom: 24 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1B5E20", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Ana səhifəyə qayıt
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <Image src="/logo.png" alt="MeatBox" width={44} height={44} style={{ borderRadius: 12 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1B5E20", fontStyle: "italic" }}>
              MEAT<span style={{ color: "#2E7D32" }}>BOX</span>.AZ
            </div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: 0 }}>Qeydiyyat</h1>
            <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>Saniyələr içində hesab açın</p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "#F3F4F6", borderRadius: 14,
            padding: 4, marginBottom: 20, gap: 4,
          }}>
            {[
              { key: "phone", icon: <MessageSquare size={14} />, label: "SMS" },
              { key: "email", icon: <Mail size={14} />, label: "Email" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  background: mode === key ? "#fff" : "transparent",
                  color: mode === key ? "#1B5E20" : "#6B7280",
                  boxShadow: mode === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "phone" ? (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Telefon Nömrəsi</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12,
                  padding: "12px 16px",
                }}>
                  <span style={{ fontSize: 20 }}>🇦🇿</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>+994</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 9))); setError(""); }}
                    placeholder="50 123 45 67"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: "#111827" }}
                    autoFocus
                    inputMode="numeric"
                  />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, marginLeft: 4 }}>Nömrənizə doğrulama kodu göndəriləcək</p>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Email ünvanı</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12,
                  padding: "12px 16px",
                }}>
                  <Mail size={17} color="#9CA3AF" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="email@gmail.com"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: "#111827" }}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, marginLeft: 4 }}>Email-inizə doğrulama kodu göndəriləcək</p>
              </div>
            )}

            {error && (
              <div style={{ background: "#FEF2F2", color: "#B91C1C", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10 }}>
                {error}
                {error.includes("artıq") && (
                  <button type="button" onClick={() => router.push("/auth/login")}
                    style={{ display: "block", marginTop: 6, background: "none", border: "none", cursor: "pointer", color: "#1B5E20", fontSize: 13, fontWeight: 700, textDecoration: "underline", padding: 0 }}>
                    Daxil ol səhifəsinə keç →
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "#9CA3AF" : "linear-gradient(135deg,#1B5E20,#2E7D32)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                boxShadow: loading ? "none" : "0 4px 14px rgba(27,94,32,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Göndərilir...
                </>
              ) : (
                <>
                  {mode === "phone" ? <MessageSquare size={16} /> : <Mail size={16} />}
                  Kod al
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Artıq hesabınız var?</span>
              <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
            </div>

            <Link
              href="/auth/login"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "13px 0", borderRadius: 12,
                border: "1.5px solid #E5E7EB",
                background: "#fff", color: "#111827",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}
            >
              Daxil ol
            </Link>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
