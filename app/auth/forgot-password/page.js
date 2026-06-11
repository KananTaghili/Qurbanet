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
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Brand panel ── */}
        <div
          className="relative flex flex-col items-center justify-center py-10 px-8 lg:py-0 lg:w-[44%]"
          style={{ background: "linear-gradient(160deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)" }}
        >
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="lg:hidden absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-2xl transition-colors"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
            aria-label="Geri qayıt"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-5 text-center animate-fade-up">
            <div
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)" }}
            >
              <Image src="/logo.png" alt="QurbanEt" width={128} height={128} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black text-white italic leading-none">
                Qurban<span style={{ color: "#86efac" }}>Et</span>
              </div>
              <div className="text-sm lg:text-base mt-3 leading-relaxed max-w-[220px] mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
                Şifrənizi bərpa edin
              </div>
            </div>
            <div className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              ETİBARLI · HALAL · SÜRƏTLİ
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-surface">
          <div className="w-full max-w-sm animate-fade-up">

            {/* Step 1 — Identifier */}
            {step === "identifier" && (
              <>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center">
                    <KeyRound size={20} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary">Şifrəni Sıfırla</h2>
                </div>
                <p className="text-sm text-text-secondary mb-6">
                  Qeydiyyat zamanı istifadə etdiyiniz telefon və ya email ilə daxil olun.
                </p>

                {/* Mode toggle */}
                <div className="flex bg-surface-alt rounded-2xl p-1 mb-5 gap-1">
                  <button
                    type="button"
                    onClick={() => { setMode("phone"); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "phone" ? "bg-surface shadow-sm text-primary" : "text-text-secondary"}`}
                  >
                    <Phone size={15} /> Telefon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("email"); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "email" ? "bg-surface shadow-sm text-primary" : "text-text-secondary"}`}
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

                  <button type="submit" className="btn-primary" disabled={sending}>
                    {sending
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Göndərilir...</span>
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
                  <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center">
                    <KeyRound size={20} className="text-primary" />
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
                        className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-2xl focus:outline-none transition-all ${d ? "border-primary bg-primary-surface text-primary" : "border-border bg-surface-alt text-text-primary"} focus:border-primary`}
                      />
                    ))}
                  </div>

                  <ErrorBox msg={error} />

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || sending}
                    className={`text-sm font-semibold transition-colors text-center ${resendTimer > 0 ? "text-text-muted cursor-not-allowed" : "text-primary hover:text-primary-dark cursor-pointer"}`}
                  >
                    {resendTimer > 0 ? `Yenidən göndər (${resendTimer}s)` : "Kodu yenidən göndər"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep("identifier"); setError(""); setCode(["", "", "", ""]); }}
                    className="text-sm text-text-secondary hover:text-primary transition-colors text-center"
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
                  <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center">
                    <KeyRound size={20} className="text-primary" />
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
                        className="field-input pr-10"
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
                        className="field-input pr-10"
                        maxLength={128}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <ErrorBox msg={error} />

                  <button type="submit" className="btn-primary" disabled={resetting}>
                    {resetting
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Yadda saxlanır...</span>
                      : "Şifrəni Yenilə"}
                  </button>

                  <button type="button" onClick={() => router.push("/auth/login")} className="text-sm text-text-secondary hover:text-primary transition-colors text-center">
                    ← Daxil ol
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
