"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MessageSquare, Mail } from "lucide-react";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";

const OTP_LENGTH = 4;
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const AZ_OPERATORS = ["010","020","040","050","051","055","060","070","077","099"];

const formatPhone = (input) => {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.startsWith("0")) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8,10)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7,9)}`;
};

const isValidAzPhone = (formatted) => {
  const d = formatted.replace(/\D/g, "");
  if (d.length === 10) return AZ_OPERATORS.includes(d.slice(0,3));
  if (d.length === 9)  return AZ_OPERATORS.includes("0" + d.slice(0,2));
  return false;
};

export default function ContactPage() {
  const router = useRouter();
  const { order, updateOrder, isLoaded } = useOrder();
  const { user, login } = useAuth();

  const isRegistered = !!user?.name;

  const [step, setStep] = useState("info");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState("sms");
  const [error, setError] = useState("");

  const [sending, setSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const timerRef = useRef(null);
  const otpInputRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (!isLoaded) return;
    const flowActive = sessionStorage.getItem("qurbanet_flow");
    if (!order || !flowActive) { router.replace("/"); return; }

    if (isRegistered) {
      const contactInfo = {
        firstName: user.name || "",
        lastName: user.lastName || "",
        ...(user.phone ? { phone: user.phone } : {}),
        ...(user.email ? { email: user.email } : {}),
      };
      updateOrder({ contactInfo });
      router.replace("/order/summary");
      return;
    }

    // Guest: restore previously saved contact info
    try {
      const raw = localStorage.getItem('contact_info');
      if (raw) {
        const ci = JSON.parse(raw);
        if (ci?.firstName) setFirstName(ci.firstName);
        if (ci?.lastName)  setLastName(ci.lastName);
        if (ci?.phone)     setPhone(ci.phone.replace(/^\+?994/, ''));
        if (ci?.email)     setEmail(ci.email);
        if (ci?.verifyMethod) setVerifyMethod(ci.verifyMethod);
        return;
      }
    } catch (_) {}

    if (order.contactInfo) {
      setFirstName(order.contactInfo.firstName || "");
      setLastName(order.contactInfo.lastName || "");
      setPhone(order.contactInfo.phone?.replace(/^\+?994/, "") || "");
      setEmail(order.contactInfo.email || "");
      if (order.contactInfo.verifyMethod)
        setVerifyMethod(order.contactInfo.verifyMethod);
    }
  }, [isLoaded]);

  if (!isLoaded || !order) return null;

  // ── Registered user: confirm and proceed ──────────────────────────────────
  const handleRegisteredSubmit = () => {
    setError("");
    if (firstName.trim().length < 2) { setError("Ad ən az 2 simvol olmalıdır."); return; }

    const contactInfo = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(user.phone ? { phone: user.phone } : {}),
      ...(user.email ? { email: user.email } : {}),
    };
    updateOrder({ contactInfo });
    router.push("/order/summary");
  };

  // ── Guest OTP flow ─────────────────────────────────────────────────────────
  const startTimer = () => {
    clearInterval(timerRef.current);
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setError("");
    setPhoneError("");
    if (firstName.trim().length < 2) { setError("Ad ən az 2 simvol olmalıdır."); return; }
    if (lastName.trim().length < 2) { setError("Soyad ən az 2 simvol olmalıdır."); return; }
    if (password.length < 6) { setError("Şifrə ən az 6 simvol olmalıdır."); return; }

    setSending(true);
    try {
      if (verifyMethod === "sms") {
        if (!isValidAzPhone(phone)) {
          setPhoneError("Düzgün AZ nömrəsi daxil edin: 050 XXX XX XX");
          setSending(false);
          return;
        }
        const raw  = phone.replace(/\D/g, "");
        const norm = "+994" + (raw.startsWith("0") ? raw.slice(1) : raw);
        await api.post("/auth/send-otp", { phone: norm, channel: "sms" });
        setNormalizedPhone(norm);
      } else {
        const em = email.trim().toLowerCase();
        if (!isValidEmail(em)) { setError("Düzgün Gmail ünvanı daxil edin."); setSending(false); return; }
        await api.post("/auth/send-otp", { email: em });
      }
      setOtpCode("");
      setStep("otp");
      startTimer();
      setTimeout(() => otpInputRef.current?.focus(), 350);
    } catch (err) {
      setError(err.response?.data?.message || "OTP göndərilmədi. Yenidən cəhd edin.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (code) => {
    const fullCode = code || otpCode;
    if (fullCode.length !== OTP_LENGTH) return;
    setVerifying(true);
    setError("");
    try {
      const body = { code: fullCode, password };
      if (verifyMethod === "sms") body.phone = normalizedPhone;
      else body.email = email.trim().toLowerCase();

      const res = await api.post("/auth/verify-otp", body);
      const { token: newToken, user: newUser } = res.data.data;
      if (newToken) login(newToken, newUser);

      const contactInfo = {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        ...(verifyMethod === "sms"
          ? { phone: normalizedPhone }
          : { email: email.trim().toLowerCase() }),
        verifyMethod,
      };

      try { localStorage.setItem('contact_info', JSON.stringify(contactInfo)); } catch (_) {}
      updateOrder({ contactInfo });
      router.push("/order/summary");
    } catch (err) {
      setError(err.response?.data?.message || "Yanlış kod. Yenidən cəhd edin.");
      setOtpCode("");
      setTimeout(() => otpInputRef.current?.focus(), 0);
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtpCode(digits);
    if (digits.length === OTP_LENGTH) handleVerify(digits);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    try {
      const body = verifyMethod === "sms"
        ? { phone: normalizedPhone, channel: "sms" }
        : { email: email.trim().toLowerCase() };
      await api.post("/auth/send-otp", body);
      setOtpCode("");
      startTimer();
      setTimeout(() => otpInputRef.current?.focus(), 0);
    } catch {
      setError("OTP göndərilmədi. Yenidən cəhd edin.");
    }
  };

  const renderOtpBoxes = () =>
    Array.from({ length: OTP_LENGTH }).map((_, i) => {
      const digit = otpCode[i] || "";
      const isFocused = i === otpCode.length && !digit;
      return (
        <div
          key={i}
          className={`w-14 h-16 flex items-center justify-center border-2 rounded-xl text-2xl font-black text-text-primary transition-colors select-none ${
            digit
              ? "border-primary bg-primary/5"
              : isFocused
                ? "border-primary"
                : "border-border bg-surface-alt"
          }`}
        >
          {digit}
        </div>
      );
    });

  const inputCls =
    "w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white transition-colors font-medium disabled:opacity-60";

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title="Əlaqə məlumatları" />
      <StepHeader currentStep={2} />

      <div className="flex-1 page-scroll">
        <div className="p-4 w-full max-w-3xl mx-auto flex flex-col gap-4">

          {/* ── Registered user view ─────────────────────────────────────── */}
          {isRegistered ? (
            <>
              <div>
                <h1 className="text-xl font-bold text-text-primary">Əlaqə Məlumatları</h1>
                <p className="text-sm text-text-secondary mt-1">Məlumatlarınız profildən götürüldü.</p>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Ad</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                      placeholder="Ad"
                      className={inputCls}
                      autoCapitalize="words"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Soyad</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Soyad"
                      className={inputCls}
                      autoCapitalize="words"
                    />
                  </div>
                </div>

                {user?.phone && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Mobil nömrə</label>
                    <div className="flex items-center bg-surface-alt border border-border rounded-xl opacity-60">
                      <div className="flex items-center gap-1.5 px-3 border-r border-border shrink-0">
                        <span className="text-lg leading-none">🇦🇿</span>
                        <span className="text-sm font-semibold text-text-secondary">+994</span>
                      </div>
                      <span className="flex-1 px-3 py-3 text-sm text-text-primary font-medium">
                        {user.phone.replace(/^\+?994/, "")}
                      </span>
                    </div>
                  </div>
                )}

                {user?.email && !user?.phone && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Email</label>
                    <input type="email" value={user.email} disabled className={inputCls} />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button className="btn-primary" onClick={handleRegisteredSubmit}>
                Ödəniş mərhələsinə keç
              </button>
            </>
          ) : (
            /* ── Guest OTP flow ───────────────────────────────────────────── */
            <>
              <div>
                <h1 className="text-xl font-bold text-text-primary">Əlaqə Məlumatları</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {verifyMethod === "email"
                    ? "Ad, Soyad, Gmail və Şifrə tələb olunur."
                    : "Ad, Soyad, Nömrə və Şifrə tələb olunur."}
                </p>
              </div>

              {/* Fields card */}
              <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                <div className="p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">Ad</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ad"
                        className={inputCls}
                        autoCapitalize="words"
                        disabled={step === "otp"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">Soyad</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Soyad"
                        className={inputCls}
                        autoCapitalize="words"
                        disabled={step === "otp"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      {verifyMethod === "email" ? (
                        <>
                          <label className="block text-sm text-text-secondary mb-1.5">Gmail</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@gmail.com"
                            className={inputCls}
                            autoComplete="email"
                            disabled={step === "otp"}
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-sm text-text-secondary mb-1.5">Mobil nömrə</label>
                          <div
                            className={`flex items-center bg-surface-alt border rounded-xl focus-within:bg-white transition-colors ${
                              phoneError ? "border-red-400 focus-within:border-red-400" : "border-border focus-within:border-primary"
                            } ${step === "otp" ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-center gap-1.5 px-3 border-r border-border shrink-0">
                              <span className="text-lg leading-none">🇦🇿</span>
                              <span className="text-sm font-semibold text-text-secondary">+994</span>
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => { setPhoneError(""); setPhone(formatPhone(e.target.value)); }}
                              placeholder="50 123 45 67"
                              className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted px-3 py-3 font-medium border-none"
                              inputMode="numeric"
                              maxLength={12}
                              disabled={step === "otp"}
                            />
                          </div>
                          {phoneError && (
                            <p className="text-xs text-red-500 font-semibold mt-1">{phoneError}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">
                        Şifrə <span className="text-red-500">*</span>
                      </label>
                      <div
                        className={`flex items-center bg-surface-alt border border-border rounded-xl focus-within:border-primary focus-within:bg-white transition-colors ${step === "otp" ? "opacity-60" : ""}`}
                      >
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ən az 6 simvol"
                          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted px-4 py-3 font-medium border-none"
                          disabled={step === "otp"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="px-4 py-3 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel selector */}
              {step === "info" && (
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <p className="text-sm text-text-secondary mb-3">Kodu necə almaq istərsiniz?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: "sms", label: "SMS", Icon: MessageSquare },
                      { k: "email", label: "Gmail", Icon: Mail },
                    ].map(({ k, label, Icon }) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setVerifyMethod(k); setPhoneError(""); }}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                          verifyMethod === k
                            ? "border-primary bg-primary-surface text-primary"
                            : "border-border bg-surface-alt text-text-secondary hover:border-primary/40"
                        }`}
                      >
                        <Icon size={17} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {step === "info" && (
                <button
                  className={`btn-primary ${sending ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={handleSendOtp}
                  disabled={sending}
                >
                  {sending ? "Göndərilir..." : "Ödəniş mərhələsinə keç"}
                </button>
              )}

              {step === "otp" && (
                <div className="bg-surface rounded-2xl border-2 border-primary/30 p-6 flex flex-col gap-4">
                  <div className="text-center">
                    <h2 className="text-base font-bold text-text-primary mb-1">Doğrulama kodu</h2>
                    <p className="text-sm text-text-secondary">
                      {verifyMethod === "email"
                        ? `Kod ${email.trim()} ünvanına göndərildi`
                        : `Kod ${normalizedPhone} nömrəsinə SMS ilə göndərildi`}
                    </p>
                  </div>

                  <div
                    className="flex justify-center gap-3 cursor-pointer"
                    onClick={() => otpInputRef.current?.focus()}
                  >
                    {renderOtpBoxes()}
                  </div>

                  <input
                    ref={otpInputRef}
                    value={otpCode}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    autoComplete="one-time-code"
                    autoFocus
                    className="sr-only"
                  />

                  <button
                    className={`btn-primary ${verifying || otpCode.length < OTP_LENGTH ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleVerify()}
                    disabled={verifying || otpCode.length < OTP_LENGTH}
                  >
                    {verifying ? "Yoxlanılır..." : "Təsdiqləyin"}
                  </button>

                  <button
                    onClick={handleResend}
                    disabled={resendTimer > 0}
                    className={`text-sm font-semibold text-center py-1 ${resendTimer > 0 ? "text-text-muted cursor-default" : "text-primary cursor-pointer"}`}
                  >
                    {resendTimer > 0 ? `Yenidən göndər (${resendTimer}s)` : "Yenidən göndər"}
                  </button>

                  <button
                    onClick={() => { setStep("info"); clearInterval(timerRef.current); setError(""); }}
                    className="text-sm text-text-secondary text-center py-1 cursor-pointer hover:text-text-primary transition-colors"
                  >
                    Məlumatları dəyişdir
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
