"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, Phone, Mail, KeyRound } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";

const formatPhone = (val) => {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

const ErrorBox = ({ msg }) =>
  msg ? (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl border border-red-100">
      <AlertCircle size={15} className="flex-shrink-0" />
      {msg}
    </div>
  ) : null;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState("identifier"); // "identifier" | "otp" | "reset"
  const [mode, setMode] = useState("phone"); // "phone" | "email"
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const inputs = useRef([]);
  const timerRef = useRef(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((p) => {
        if (p <= 1) { clearInterval(timerRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const buildPayload = () => {
    if (mode === "phone") {
      const raw = phone.replace(/\s/g, "");
      const full = raw.startsWith("0") ? "+994" + raw.slice(1)
        : raw.startsWith("+994") ? raw : "+994" + raw;
      return { phone: full };
    }
    return { email: email.trim().toLowerCase() };
  };

  const validate = () => {
    if (mode === "phone") {
      if (phone.replace(/\s/g, "").length < 9) {
        setError("Düzgün telefon nömrəsi daxil edin."); return false;
      }
    } else {
      if (!email.trim() || !email.includes("@")) {
        setError("Düzgün email ünvanı daxil edin."); return false;
      }
    }
    return true;
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!validate()) return;
    setSending(true);
    setError("");
    try {
      const payload = buildPayload();
      await api.post("/auth/forgot-password", payload);
      const key = mode === "phone" ? "forgot_phone" : "forgot_email";
      sessionStorage.setItem("forgot_identifier_type", mode);
      sessionStorage.setItem(key, mode === "phone" ? payload.phone : payload.email);
      setStep("otp");
      setCode(["", "", "", ""]);
      startTimer();
      setTimeout(() => inputs.current[0]?.focus(), 300);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 404) {
        setError(mode === "phone"
          ? "Bu telefon nömrəsi ilə qeydiyyatdan keçmiş hesab tapılmadı."
          : "Bu email ilə qeydiyyatdan keçmiş hesab tapılmadı.");
      } else {
        setError(msg || "Xəta baş verdi. Yenidən cəhd edin.");
      }
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: OTP ─────────────────────────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError("");
    if (digit && i < 3) inputs.current[i + 1]?.focus();
    if (next.every((d) => d)) setStep("reset");
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) { setCode(pasted.split("")); setStep("reset"); }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (resendTimer > 0 || sending) return;
    setSending(true);
    setError("");
    try {
      const type = sessionStorage.getItem("forgot_identifier_type") || "phone";
      const val = sessionStorage.getItem(type === "phone" ? "forgot_phone" : "forgot_email");
      await api.post("/auth/forgot-password", type === "phone" ? { phone: val } : { email: val });
      setCode(["", "", "", ""]);
      startTimer();
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Kod göndərilə bilmədi.");
    } finally {
      setSending(false);
    }
  };

  // ── Step 3: Reset Password ───────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (resetting) return;
    if (!newPassword || newPassword.length < 6) { setError("Şifrə ən az 6 simvol olmalıdır."); return; }
    if (newPassword !== confirmPassword) { setError("Şifrələr uyğun gəlmir."); return; }
    setResetting(true);
    setError("");
    try {
      const type = sessionStorage.getItem("forgot_identifier_type") || "phone";
      const val = sessionStorage.getItem(type === "phone" ? "forgot_phone" : "forgot_email");
      const payload = type === "phone"
        ? { phone: val, code: code.join(""), newPassword }
        : { email: val, code: code.join(""), newPassword };
      const res = await api.post("/auth/reset-password", payload);
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        sessionStorage.removeItem("forgot_phone");
        sessionStorage.removeItem("forgot_email");
        sessionStorage.removeItem("forgot_identifier_type");
        router.push("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Şifrə yenilənə bilmədi.");
      if (err.response?.status === 400) { setStep("otp"); setCode(["", "", "", ""]); }
    } finally {
      setResetting(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh", overflow: "hidden", background: "#241331",
      fontFamily: "'Manrope', sans-serif", color: "#111827", position: "relative",
      display: "grid", gridTemplateColumns: "1fr",
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

      {/* ── Brand panel ── */}
      <section style={{ position: "relative", zIndex: 1, color: "#fff" }}
        className="hidden lg:flex flex-col justify-center px-[6vw] py-[4vh] min-h-screen"
      >
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          style={{
            position: "absolute", top: 20, left: 20,
            width: 36, height: 36, borderRadius: 12,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", border: "none", cursor: "pointer",
          }}
          aria-label="Geri qayıt"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 420, margin: "0 auto", width: "100%", textAlign: "center" }}>
          <div style={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/meatbox_icon.png" alt="MEATBOX.AZ" width={160} height={160} style={{ objectFit: "contain" }} />
          </div>
          <h1 style={{ marginTop: 10, fontSize: "clamp(1.8rem,2.8vw,3rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.045em", color: "#fff" }}>
            MEAT<span style={{ color: "#ff1236" }}>BOX</span>
          </h1>
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>
            Şifrənizi bərpa edin
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {["ETİBARLI", "HALAL", "SÜRƏTLİ"].map((t, i) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)" }}>{t}</span>
                {i < 2 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "inline-block" }} />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form panel ── */}
      <section style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        className="min-h-screen lg:min-h-0 lg:h-screen"
      >
        <div style={{
          width: "100%", maxWidth: 365,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 24px 90px rgba(15,23,42,0.16)",
          padding: "28px 32px",
          fontFamily: "'Manrope', sans-serif",
        }}>

            {/* Step 1 — Identifier */}
            {step === "identifier" && (
              <>
                <div className="flex items-center gap-2.5 mb-1">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff1f3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <KeyRound size={20} style={{ color: "#c8102e" }} />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary">Şifrəni Sıfırla</h2>
                </div>
                <p className="text-sm text-text-secondary mb-6">
                  Qeydiyyat zamanı istifadə etdiyiniz telefon və ya email ilə daxil olun.
                </p>

                {/* Mode toggle */}
                <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 16, padding: 4, marginBottom: 20, gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setMode("phone"); setError(""); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, border: mode === "phone" ? "1px solid #ef9caf" : "1px solid transparent", background: mode === "phone" ? "#fff" : "transparent", color: mode === "phone" ? "#c8102e" : "#6b7280", boxShadow: mode === "phone" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <Phone size={15} /> Telefon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("email"); setError(""); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, border: mode === "email" ? "1px solid #ef9caf" : "1px solid transparent", background: mode === "email" ? "#fff" : "transparent", color: mode === "email" ? "#c8102e" : "#6b7280", boxShadow: mode === "email" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <Mail size={15} /> Email
                  </button>
                </div>

                <form onSubmit={handleSend} className="flex flex-col gap-4">
                  {mode === "phone" ? (
                    <div>
                      <label className="text-sm font-semibold text-text-primary mb-2 block">Telefon Nömrəsi *</label>
                      <div className="flex items-center gap-2 bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:bg-surface transition-all">
                        <span className="text-2xl flex-shrink-0">🇦🇿</span>
                        <span className="text-text-secondary font-semibold text-sm flex-shrink-0">+994</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => { setPhone(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 9))); setError(""); }}
                          placeholder="50 123 45 67"
                          className="flex-1 bg-transparent text-[17px] text-text-primary outline-none font-semibold tracking-wider"
                          autoFocus
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-semibold text-text-primary mb-2 block">Email *</label>
                      <div className="flex items-center gap-2 bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:bg-surface transition-all">
                        <Mail size={18} className="text-text-secondary flex-shrink-0" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          placeholder="email@example.com"
                          className="flex-1 bg-transparent text-[17px] text-text-primary outline-none font-semibold"
                          autoFocus
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  )}

                  <ErrorBox msg={error} />

                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                      background: sending ? "#9CA3AF" : "#f20b32", color: "#fff",
                      fontSize: 15, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: sending ? "none" : "0 4px 14px rgba(242,11,50,0.3)",
                      fontFamily: "inherit",
                    }}
                  >
                    {sending
                      ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Göndərilir...</span>
                      : "Kod göndər"}
                  </button>

                  <button type="button" onClick={() => router.push("/auth/login")} className="text-sm text-text-secondary hover:text-primary transition-colors text-center">
                    ← Geri qayıt
                  </button>
                </form>
              </>
            )}

            {/* Step 2 — OTP */}
            {step === "otp" && (
              <>
                <div className="flex items-center gap-2.5 mb-1">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff1f3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <KeyRound size={20} style={{ color: "#c8102e" }} />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary">Kodu daxil edin</h2>
                </div>
                <p className="text-sm text-text-secondary mb-6">
                  {mode === "phone" ? "Nömrənizə" : "Email ünvanınıza"} göndərilən 4 rəqəmli kodu daxil edin.
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                    {code.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputs.current[i] = el)}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        style={{ width: 56, height: 56, textAlign: "center", fontSize: 24, fontWeight: 700, borderWidth: 2, borderStyle: "solid", borderRadius: 16, outline: "none", transition: "all 0.15s", borderColor: d ? "#c8102e" : "#e5e7eb", background: d ? "#fff1f3" : "#f8f9fb", color: d ? "#c8102e" : "#111827", fontFamily: "inherit" }}
                      />
                    ))}
                  </div>

                  <ErrorBox msg={error} />

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || sending}
                    style={{ fontSize: 13, fontWeight: 600, textAlign: "center", background: "none", border: "none", padding: 0, fontFamily: "inherit", cursor: resendTimer > 0 ? "not-allowed" : "pointer", color: resendTimer > 0 ? "#9ca3af" : "#c8102e" }}
                  >
                    {resendTimer > 0 ? `Yenidən göndər (${resendTimer}s)` : "Kodu yenidən göndər"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep("identifier"); setError(""); setCode(["", "", "", ""]); }}
                    style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "center", fontFamily: "inherit" }}
                  >
                    ← Geri qayıt
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — Reset */}
            {step === "reset" && (
              <>
                <div className="flex items-center gap-2.5 mb-1">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff1f3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <KeyRound size={20} style={{ color: "#c8102e" }} />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary">Yeni Şifrə</h2>
                </div>
                <p className="text-sm text-text-secondary mb-6">Güclü yeni şifrə seçin.</p>

                <form onSubmit={handleReset} className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-semibold text-text-primary mb-2 block">Yeni Şifrə *</label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                        placeholder="Ən az 6 simvol"
                        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 44px 12px 14px", fontSize: 15, color: "#111827", background: "#f9fafb", outline: "none", fontFamily: "inherit" }}
                        maxLength={128}
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-text-primary mb-2 block">Şifrəni Təsdiqlə *</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        placeholder="Şifrənizi yenidən daxil edin"
                        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 44px 12px 14px", fontSize: 15, color: "#111827", background: "#f9fafb", outline: "none", fontFamily: "inherit" }}
                        maxLength={128}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <ErrorBox msg={error} />

                  <button
                    type="submit"
                    disabled={resetting}
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                      background: resetting ? "#9CA3AF" : "#f20b32", color: "#fff",
                      fontSize: 15, fontWeight: 700, cursor: resetting ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: resetting ? "none" : "0 4px 14px rgba(242,11,50,0.3)",
                      fontFamily: "inherit",
                    }}
                  >
                    {resetting
                      ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Yadda saxlanır...</span>
                      : "Şifrəni Yenilə"}
                  </button>

                  <button type="button" onClick={() => router.push("/auth/login")} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "center", fontFamily: "inherit" }}>
                    ← Daxil ol
                  </button>
                </form>
              </>
            )}

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
