"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Phone, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";

const formatPhone = (val) => {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (!password || password.length < 6) { setError("Şifrə ən az 6 simvol olmalıdır."); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const body = { password };
      if (mode === "phone") {
        const raw = phone.replace(/\s/g, "");
        body.phone = raw.startsWith("0") ? "+994" + raw.slice(1) : raw.startsWith("+994") ? raw : "+994" + raw;
      } else {
        body.email = email.trim().toLowerCase();
      }
      const res = await api.post("/auth/login-password", body, { signal: abortRef.current.signal });
      if (res.data.success) {
        const { token, user, needsName } = res.data.data;
        login(token, user);
        if (needsName || !user.name) router.push("/auth/name");
        else router.push("/");
      }
    } catch (err) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
      setError(err.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", height: "100vh", overflow: "hidden", display: "flex", background: "#f8faf8" }}>
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
        {/* Back */}
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
          {/* Logo */}
          <div style={{
            width: 120, height: 120, borderRadius: 28, overflow: "hidden",
            border: "2.5px solid rgba(255,255,255,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            background: "rgba(255,255,255,0.12)",
          }}>
            <Image src="/logo_test.png" alt="MeatBox" width={120} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* Brand name */}
          <div>
            <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: "-1px", lineHeight: 1 }}>
              MEAT<span style={{ color: "#86efac" }}>BOX</span>.AZ
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 10, lineHeight: 1.6, maxWidth: 220 }}>
              ETİBARLI · HALAL · SÜRƏTLİ
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            {[
              { label: "Halal kəsim", desc: "Dini qaydalara uyğun" },
              { label: "Video hesabat", desc: "Kəsimi izləyin" },
              { label: "Sürətli çatdırılma", desc: "Qapınıza çatdırırıq" },
            ].map(({ label, desc }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "10px 16px",
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
            <Image src="/logo_test.png" alt="MeatBox" width={44} height={44} style={{ borderRadius: 12 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1B5E20", fontStyle: "italic" }}>
              MEAT<span style={{ color: "#2E7D32" }}>BOX</span>.AZ
            </div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: 0 }}>Xoş gəlmisiniz</h1>
            <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>Hesabınıza daxil olun</p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "#F3F4F6", borderRadius: 14,
            padding: 4, marginBottom: 20, gap: 4,
          }}>
            {[{ key: "phone", icon: <Phone size={14} />, label: "Telefon" }, { key: "email", icon: <Mail size={14} />, label: "Email" }].map(({ key, icon, label }) => (
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
            {/* Phone / Email input */}
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
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Email</label>
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
                    placeholder="email@example.com"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: "#111827" }}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Şifrə</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Şifrənizi daxil edin"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12,
                    padding: "12px 44px 12px 16px", fontSize: 16, fontWeight: 600,
                    color: "#111827", outline: "none",
                  }}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#FEF2F2", color: "#B91C1C", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "#9CA3AF" : "linear-gradient(135deg,#1B5E20,#2E7D32)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                boxShadow: loading ? "none" : "0 4px 14px rgba(27,94,32,0.35)",
                transition: "all 0.15s",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Daxil olunur...
                </span>
              ) : "Daxil ol"}
            </button>

            {/* Forgot + Register */}
            <div style={{ paddingTop: 8, borderTop: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#1B5E20", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <KeyRound size={14} /> Şifrəni unutdum
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>Hesabınız yoxdur?</span>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
              </div>

              <Link
                href="/auth/register"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "13px 0", borderRadius: 12,
                  border: "1.5px solid #1B5E2040",
                  background: "#f0fdf4", color: "#1B5E20",
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                Qeydiyyatdan keç
              </Link>
            </div>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
