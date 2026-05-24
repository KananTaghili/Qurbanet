"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";

const formatPhone = (val) => {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Step: "phone" | "otp" | "reset"
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputs = useRef([]);
  const timerRef = useRef(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const raw = phone.replace(/\s/g, "");
    if (raw.length < 9) {
      setError("Düzgün telefon nömrəsi daxil edin.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const fullPhone = raw.startsWith("0")
        ? "+994" + raw.slice(1)
        : raw.startsWith("+994")
          ? raw
          : "+994" + raw;

      await api.post("/auth/forgot-password", { phone: fullPhone });
      sessionStorage.setItem("forgot_phone", fullPhone);
      setStep("otp");
      setCode(["", "", "", "", "", ""]);
      startTimer();
      setTimeout(() => inputs.current[0]?.focus(), 300);
    } catch (err) {
      setError(
        err.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin.",
      );
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────

  const handleOtpChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError("");
    if (digit && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d)) submitOtp(next);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0)
      inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split("");
      setCode(arr);
      submitOtp(arr);
    }
  };

  const submitOtp = (digits) => {
    if (verifying) return;
    const full = digits.join("");
    if (full.length !== 6) return;
    // OTP is verified server-side during reset-password; just proceed to next step
    setStep("reset");
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (resendTimer > 0) return;

    setSending(true);
    setError("");
    try {
      const forgotPhone = sessionStorage.getItem("forgot_phone");
      await api.post("/auth/forgot-password", { phone: forgotPhone });
      setCode(["", "", "", "", "", ""]);
      startTimer();
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Kod göndərilə bilmədi.");
    } finally {
      setSending(false);
    }
  };

  // ── Step 3: Reset Password ───────────────────────────────────────────────

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setError("Şifrə ən az 6 simvol olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Şifrələr uyğun gəlmir.");
      return;
    }

    setResetting(true);
    setError("");
    try {
      const forgotPhone = sessionStorage.getItem("forgot_phone");
      const otpCode = code.join("");

      const res = await api.post("/auth/reset-password", {
        phone: forgotPhone,
        code: otpCode,
        newPassword,
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        sessionStorage.removeItem("forgot_phone");
        router.push("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Şifrə yenilənə bilmədi. Yenidən cəhd edin.",
      );
      // OTP was invalid — go back to OTP step
      if (err.response?.status === 400) {
        setStep("otp");
        setCode(["", "", "", "", "", ""]);
      }
    } finally {
      setResetting(false);
    }
  };

  const ErrorBox = ({ msg }) => msg ? (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
      <AlertCircle size={15} className="flex-shrink-0" />
      {msg}
    </div>
  ) : null;

  return (
    <div className="flex-1 flex flex-col bg-primary">
      <div className="flex-1 flex flex-col justify-center items-center px-6 gap-8 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white/20">
            <Image
              src="/logo.png"
              alt="QurbanEt"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-3xl font-black text-white italic">
            Qurban<span className="text-green-300">Et</span>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md">
          {/* Step 1: Phone */}
          {step === "phone" && (
            <>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Şifrəni Sıfırla
              </h2>
              <p className="text-sm text-text-secondary mb-5">
                Telefon nömrənizi daxil edin.
              </p>

              <form
                onSubmit={handlePhoneSubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:bg-surface transition-all">
                  <span className="text-2xl flex-shrink-0">🇦🇿</span>
                  <span className="text-text-secondary font-semibold text-sm flex-shrink-0">
                    +994
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(
                        formatPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 9),
                        ),
                      );
                      setError("");
                    }}
                    placeholder="50 123 45 67"
                    className="flex-1 bg-transparent text-[17px] text-text-primary outline-none font-semibold tracking-wider"
                    autoFocus
                    inputMode="numeric"
                  />
                </div>

                <ErrorBox msg={error} />

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending}
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Göndərilir...
                    </span>
                  ) : (
                    "Kod göndər"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/auth/phone")}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  ← Geri qayıt
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Kodu daxil edin
              </h2>
              <p className="text-sm text-text-secondary mb-5">
                Nömrənizə göndərilən 6 rəqəmli kodu daxil edin.
              </p>

              <div className="flex flex-col gap-4">
                <div
                  className="flex gap-2 justify-center mb-4"
                  onPaste={handlePaste}
                >
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
                      className="w-12 h-12 text-center text-2xl font-bold border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    />
                  ))}
                </div>

                <ErrorBox msg={error} />

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || sending}
                  className={`text-sm font-semibold transition-colors ${
                    resendTimer > 0
                      ? "text-text-muted cursor-not-allowed"
                      : "text-primary hover:text-primary-dark cursor-pointer"
                  }`}
                >
                  {resendTimer > 0
                    ? `Yenidən göndər (${resendTimer}s)`
                    : "Kodu yenidən göndər"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                    setCode(["", "", "", "", "", ""]);
                  }}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  ← Geri qayıt
                </button>
              </div>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Yeni Şifrə
              </h2>
              <p className="text-sm text-text-secondary mb-5">
                Yeni şifrənizi daxil edin.
              </p>

              <form
                onSubmit={handleResetSubmit}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-sm font-semibold text-text-primary mb-2 block">
                    Yeni Şifrə *
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Ən az 6 simvol"
                      className="field-input pr-10"
                      maxLength={128}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-text-primary mb-2 block">
                    Şifrəni Təsdiqlə *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Şifrənizi yenidən daxil edin"
                      className="field-input pr-10"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <ErrorBox msg={error} />

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={resetting}
                >
                  {resetting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Yadda saxlanır...
                    </span>
                  ) : (
                    "Şifrəni Yenilə"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/auth/phone")}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  ← Daxil ol
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
