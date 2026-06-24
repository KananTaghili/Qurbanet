"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  Plus, Bell, User, ChevronDown, ArrowLeft, X,
  Heart, Menu, Shield, ChevronRight, Mail, Phone, Lock,
  UserRoundCheck, Video, HeartHandshake,
} from "lucide-react";
import { CharityLayoutContext } from "./_context";
import { SIDEBAR_NAV, ANIMAL_IMG_FALLBACK } from "./_lib";
import api from "../../lib/api";

const userFullName = (user) => [user?.name, user?.lastName].filter(Boolean).join(" ").trim() || "İstifadəçi";
const initials2 = (name) => (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

/* ─── Forgot Password Inline ─────────────────────────────────── */
function ForgotPasswordInline({ onBack, onSuccess }) {
  const [fpStep,   setFpStep]   = useState("id");
  const [fpMethod, setFpMethod] = useState("email");
  const [fpInput,  setFpInput]  = useState("");
  const [fpId,     setFpId]     = useState("");
  const [fpCode,   setFpCode]   = useState("");
  const [fpNew,    setFpNew]    = useState("");
  const [fpConf,   setFpConf]   = useState("");
  const [fpLoading,setFpLoading]= useState(false);
  const [fpError,  setFpError]  = useState("");

  const fpPhoneFilter = (v) => v.replace(/[^\d\s+\-()]/g, "");
  const fpPhoneOk = (v) => /^(\+994|0)(50|51|55|60|70|77|99)\d{7}$/.test(v.replace(/[\s\-()]/g, ""));

  const handleSend = async () => {
    setFpError("");
    const val = fpInput.trim();
    if (!val) return setFpError(fpMethod === "email" ? "Email ünvanını daxil edin" : "Telefon nömrəsini daxil edin");
    if (fpMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return setFpError("Email ünvanı düzgün deyil");
    if (fpMethod === "phone" && !fpPhoneOk(val)) return setFpError("Düzgün AZ nömrəsi daxil edin (+994XXXXXXXXX)");
    setFpLoading(true);
    try {
      const payload = fpMethod === "email" ? { email: val } : { phone: val };
      await api.post("/auth/forgot-password", payload);
      setFpId(val);
      setFpStep("otp");
    } catch (err) {
      const msg = err.response?.data?.message;
      setFpError(err.response?.status === 404
        ? "Bu hesab tapılmadı. Email və ya nömrəni yoxlayın."
        : msg || "Xəta baş verdi. Yenidən cəhd edin.");
    } finally { setFpLoading(false); }
  };

  const handleReset = async () => {
    setFpError("");
    if (!fpCode || fpCode.length < 4) return setFpError("Doğrulama kodunu tam daxil edin");
    if (!fpNew || fpNew.length < 6) return setFpError("Yeni şifrə minimum 6 simvol olmalıdır");
    if (fpNew !== fpConf) return setFpError("Şifrələr uyğun gəlmir");
    setFpLoading(true);
    try {
      const payload = fpMethod === "email"
        ? { email: fpId, code: fpCode, newPassword: fpNew }
        : { phone: fpId, code: fpCode, newPassword: fpNew };
      const res = await api.post("/auth/reset-password", payload);
      const { token, user } = res.data.data;
      await onSuccess(token, user);
    } catch (err) {
      const msg = err.response?.data?.message;
      setFpError(msg?.toLowerCase().includes("code") || msg?.toLowerCase().includes("kod")
        ? "Kod yanlışdır və ya müddəti bitib. Yenidən kod alın."
        : msg || "Şifrə yenilənə bilmədi.");
      if (err.response?.status === 400) { setFpStep("otp"); setFpCode(""); }
    } finally { setFpLoading(false); }
  };

  const inputCls = "w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]";

  return (
    <div className="flex flex-col gap-3">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#7c6fa0] hover:text-[#1a0f2e] transition-colors self-start">
        <ChevronDown size={13} className="rotate-90" /> Geri qayıt
      </button>
      <div className="text-sm font-bold text-[#1a0f2e]">Şifrəni bərpa et</div>
      <div className="text-xs text-[#7c6fa0]">
        {fpStep === "id" && "Qeydiyyatda istifadə etdiyiniz email və ya telefonu daxil edin."}
        {fpStep === "otp" && <><b className="text-purple-700">{fpId}</b> ünvanına doğrulama kodu göndərildi.</>}
        {fpStep === "reset" && "Yeni şifrənizi daxil edin."}
      </div>
      {fpStep === "id" && (
        <>
          <div className="flex gap-2">
            {([["email", Mail, "Email"], ["phone", Phone, "Telefon"]]).map(([mt, Icon, label]) => (
              <button key={mt} onClick={() => { setFpMethod(mt); setFpInput(""); setFpError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-semibold transition-all ${fpMethod === mt ? "border-purple-500 bg-purple-50 text-purple-700" : "border-[#e8e4f4] text-[#7c6fa0] hover:border-purple-300"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <div className="relative">
            {fpMethod === "email" ? <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" /> : <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />}
            <input type={fpMethod === "email" ? "email" : "tel"} inputMode={fpMethod === "phone" ? "tel" : undefined}
              placeholder={fpMethod === "email" ? "Email ünvanı" : "+994 50 000 00 00"}
              value={fpInput}
              onChange={e => { const v = fpMethod === "phone" ? fpPhoneFilter(e.target.value) : e.target.value; setFpInput(v); setFpError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className={inputCls} autoFocus />
          </div>
          {fpError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{fpError}</p>}
          <button onClick={handleSend} disabled={fpLoading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
            {fpLoading ? "Göndərilir..." : "Kod göndər →"}
          </button>
        </>
      )}
      {fpStep === "otp" && (
        <>
          <input type="text" inputMode="numeric" maxLength={4} placeholder="• • • •"
            value={fpCode}
            onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setFpCode(v); setFpError(""); if (v.length === 4) setFpStep("reset"); }}
            className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-3 text-xl text-center font-black tracking-[0.5em] text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" autoFocus />
          {fpError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{fpError}</p>}
          <button type="button" onClick={handleSend} disabled={fpLoading}
            className="text-xs font-semibold text-purple-600 hover:underline self-center disabled:opacity-60">
            {fpLoading ? "Göndərilir..." : "Kodu yenidən göndər"}
          </button>
        </>
      )}
      {fpStep === "reset" && (
        <>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
            <input type="password" placeholder="Yeni şifrə" value={fpNew}
              onChange={e => { setFpNew(e.target.value); setFpError(""); }}
              className={inputCls} autoFocus />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
            <input type="password" placeholder="Şifrəni təkrarla" value={fpConf}
              onChange={e => { setFpConf(e.target.value); setFpError(""); }}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              className={inputCls} />
          </div>
          {fpError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{fpError}</p>}
          <button onClick={handleReset} disabled={fpLoading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
            {fpLoading ? "Yenilənir..." : "Şifrəni yenilə →"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── New Opening Modal ──────────────────────────────────────── */
const NOM_STEPS = ["Heyvan növü", "Ödəniş", "Təsdiq"];

function NewOpeningModal({ onClose, preselectedAnimalName }) {
  const { isGuest, user, login } = useAuth();
  const [step,        setStep]        = useState(0);
  const [stepDir,     setStepDir]     = useState("fwd");
  const [closing,     setClosing]     = useState(false);
  const handleClose = () => { setClosing(true); setTimeout(onClose, 260); };
  const wrapRef = useRef(null);
  const prevH = useRef(null);
  const changeStep = (dir, next) => {
    if (wrapRef.current) prevH.current = wrapRef.current.offsetHeight;
    setStepDir(dir); setStep(next);
  };
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || prevH.current == null) return;
    const from = prevH.current, to = el.scrollHeight;
    prevH.current = null;
    if (Math.abs(from - to) < 2) return;
    el.style.height = from + "px";
    requestAnimationFrame(() => {
      el.style.height = to + "px";
      el.addEventListener("transitionend", () => { el.style.height = ""; }, { once: true });
    });
  }, [step]);
  const [selAnimalId, setSelAnimalId] = useState(null);
  const [isAnon,      setIsAnon]      = useState(false);
  const [amount,      setAmount]      = useState("");
  const [note,        setNote]        = useState("");
  const [contMode,    setContMode]    = useState("");
  const [name,        setName]        = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [phone,       setPhone]       = useState("");
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [anonExpanded, setAnonExpanded] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [authPhase,    setAuthPhase]   = useState(false);
  const [authMode,     setAuthMode]    = useState("login");
  const [authMethod,   setAuthMethod]  = useState("email");
  const [authInput,      setAuthInput]     = useState("");
  const [authPassword,   setAuthPassword]  = useState("");
  const [authRegFirst,   setAuthRegFirst]  = useState("");
  const [authRegLast,    setAuthRegLast]   = useState("");
  const [authOtp,        setAuthOtp]       = useState("");
  const [authOtpSent,  setAuthOtpSent] = useState(false);
  const [authLoading,  setAuthLoading] = useState(false);
  const [authError,    setAuthError]   = useState("");
  const [forgotPhase,  setForgotPhase] = useState(false);

  useEffect(() => {
    api.get("/campaigns/settings")
      .then(res => {
        const d = res.data?.data || {};
        setSettingsData(d);
        if (d.animals?.length) {
          const mp = d.settings?.maxPerAnimal || 1;
          const preselected = preselectedAnimalName
            ? d.animals.find(a => a.nameAz === preselectedAnimalName && (a.activeCount || 0) < mp)
            : null;
          const first = preselected || d.animals.find(a => (a.activeCount || 0) < mp) || d.animals[0];
          setSelAnimalId(first._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const animals       = settingsData?.animals || [];
  const settings      = settingsData?.settings || {};
  const maxPerAnimal  = settings.maxPerAnimal || 1;
  const isAtLimit     = (item) => item.activeCount >= maxPerAnimal;
  const animal        = animals.find(a => String(a._id) === String(selAnimalId)) || null;
  const minPct     = settings.minOpenPercent || 30;
  const minDon     = settings.minDonation    || 10;
  const minAmount  = animal ? Math.min(Math.ceil(Math.round(animal.price * 100) * minPct / 100) / 100, animal.price) : 0;
  const numAmount  = Number(amount || 0);
  const validAmt   = animal ? (numAmount >= minAmount && numAmount <= animal.price) : false;
  const remaining  = animal ? Math.max(animal.price - numAmount, 0) : 0;
  const finalValid = !isGuest || contMode === "registered" || (contMode === "guest" && name.trim() && guestLastName.trim());

  const goNext = () => {
    if (step === 0 && (!animal || isAtLimit(animal))) return;
    if (step === 0) { setAmount(String(minAmount)); changeStep("fwd", 1); return; }
    if (step === 1 && !validAmt) return;
    changeStep("fwd", step + 1);
  };

  const handleConfirm = async () => {
    if (!finalValid || !animal) return;
    if (isGuest && contMode === "registered") { setAuthPhase(true); return; }
    setSubmitting(true);
    try {
      const isGuestMode = isGuest && contMode === "guest";
      const body = {
        animalId: animal._id, amount: numAmount, isAnonymous: isAnon, note: note || undefined,
        ...(!isAnon ? {
          openerName: isGuestMode ? `${name.trim()} ${guestLastName.trim()}` : userFullName(user),
          ...(isGuestMode ? { openerPhone: phone } : {}),
        } : {}),
      };
      const r1 = await api.post("/campaigns", body);
      const { campaignId, donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaignId}/epoint/start`, { donationId });
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  const resetAuth = () => {
    setAuthOtpSent(false); setAuthOtp(""); setAuthError("");
    setAuthInput(""); setAuthPassword(""); setAuthRegFirst(""); setAuthRegLast("");
    setForgotPhase(false);
  };

  const afterAuth = async (token, u) => {
    login(token, u);
    setAuthPhase(false);
    setSubmitting(true);
    try {
      const body = { animalId: animal._id, amount: numAmount, isAnonymous: isAnon, note: note || undefined };
      const r1 = await api.post("/campaigns", body);
      const { campaignId, donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaignId}/epoint/start`, { donationId });
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v) => /^(\+994|0)(50|51|55|60|70|77|99)\d{7}$/.test(v.replace(/[\s\-()]/g, ""));
  const validateInput = (val) => {
    if (!val) return authMethod === "email" ? "Email ünvanını daxil edin" : "Telefon nömrəsini daxil edin";
    if (authMethod === "email" && !isValidEmail(val)) return "Email ünvanı düzgün deyil (məs: ad@mail.com)";
    if (authMethod === "phone" && !isValidPhone(val)) return "Telefon nömrəsi düzgün deyil (məs: +994501234567)";
    return null;
  };

  const handleAuthLogin = async () => {
    setAuthError("");
    const val = authInput.trim();
    const inputErr = validateInput(val);
    if (inputErr) return setAuthError(inputErr);
    if (!authPassword) return setAuthError("Şifrəni daxil edin");
    if (authPassword.length < 6) return setAuthError("Şifrə minimum 6 simvoldan ibarət olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = authMethod === "email";
      const body = isEmail ? { email: val, password: authPassword } : { phone: val, password: authPassword };
      const res = await api.post("/auth/login-password", body);
      const { token, user: u } = res.data.data;
      await afterAuth(token, u);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes("password") || msg?.toLowerCase().includes("şifrə")) {
        setAuthError("Email və ya şifrə yanlışdır. Yenidən cəhd edin.");
      } else if (msg?.toLowerCase().includes("not found") || msg?.toLowerCase().includes("tapılmadı")) {
        setAuthError("Bu hesab tapılmadı. Əvvəlcə qeydiyyatdan keçin.");
      } else {
        setAuthError(msg || "Giriş uğursuz oldu. Yenidən cəhd edin.");
      }
      setAuthLoading(false);
    }
  };

  const handleAuthSendOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    const first = authRegFirst.trim();
    const last  = authRegLast.trim();
    if (!first) return setAuthError("Adınızı daxil edin");
    if (!/^[a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s]{2,}$/.test(first)) return setAuthError("Ad yalnız hərf ola bilər (min 2 simvol)");
    if (!last) return setAuthError("Soyadınızı daxil edin");
    if (!/^[a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s]{2,}$/.test(last)) return setAuthError("Soyad yalnız hərf ola bilər (min 2 simvol)");
    const inputErr = validateInput(val);
    if (inputErr) return setAuthError(inputErr);
    if (!authPassword) return setAuthError("Şifrəni daxil edin");
    if (authPassword.length < 6) return setAuthError("Şifrə minimum 6 simvoldan ibarət olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = authMethod === "email";
      const body = isEmail ? { email: val, isRegister: true } : { phone: val, channel: "sms", isRegister: true };
      await api.post("/auth/send-otp", body);
      setAuthOtpSent(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes("exist") || msg?.toLowerCase().includes("mövcud")) {
        setAuthError("Bu email/telefon artıq qeydiyyatdan keçib. Daxil olmağa cəhd edin.");
      } else {
        setAuthError(msg || "Kod göndərilmədi. Bir az sonra yenidən cəhd edin.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthVerifyOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (!authOtp) return setAuthError("Doğrulama kodunu daxil edin");
    if (authOtp.length < 4) return setAuthError("Doğrulama kodu ən azı 4 rəqəmdən ibarət olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = authMethod === "email";
      const body = isEmail ? { email: val, code: authOtp, password: authPassword } : { phone: val, code: authOtp, password: authPassword };
      const res = await api.post("/auth/verify-otp", body);
      const { token, user: u } = res.data.data;
      const fullName = `${authRegFirst.trim()} ${authRegLast.trim()}`;
      const pRes = await api.put("/auth/profile", { name: fullName }, { headers: { Authorization: `Bearer ${token}` } });
      const finalToken = pRes.data?.data?.token || token;
      const finalUser  = pRes.data?.data?.user  || { ...u, name: fullName };
      await afterAuth(finalToken, finalUser);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes("expired") || msg?.toLowerCase().includes("müddəti")) {
        setAuthError("Kodun müddəti bitib. Geri qayıdıb yeni kod göndərin.");
      } else if (msg?.toLowerCase().includes("invalid") || msg?.toLowerCase().includes("yanlış")) {
        setAuthError("Daxil etdiyiniz kod yanlışdır. Yenidən yoxlayın.");
      } else {
        setAuthError(msg || "Kod yanlışdır və ya müddəti bitib.");
      }
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ animation: `${closing ? "_nom-bd-out" : "_nom-bd-in"} 0.26s ease forwards` }}>
      <style>{`
        @keyframes _nom-bd-in  { from { background:rgba(0,0,0,0);   backdrop-filter:blur(0px);  } to { background:rgba(0,0,0,.40); backdrop-filter:blur(4px); } }
        @keyframes _nom-bd-out { from { background:rgba(0,0,0,.40); backdrop-filter:blur(4px); } to { background:rgba(0,0,0,0);   backdrop-filter:blur(0px);  } }
        @keyframes _nom-in   { from { transform:scale(.94) translateY(10px); opacity:0; } to { transform:scale(1) translateY(0); opacity:1; } }
        @keyframes _nom-out  { from { transform:scale(1) translateY(0); opacity:1; } to { transform:scale(.94) translateY(10px); opacity:0; } }
        @keyframes _nom-fwd { from { transform:translateX(22px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes _nom-bwd { from { transform:translateX(-22px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        .nom-step-fwd { animation: _nom-fwd 0.22s cubic-bezier(.25,.8,.25,1); }
        .nom-step-bwd { animation: _nom-bwd 0.22s cubic-bezier(.25,.8,.25,1); }
      `}</style>
      <div className="absolute inset-0" onClick={handleClose} />
      <div className="relative mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ maxHeight: "min(640px, calc(100vh - 2rem))", animation: `${closing ? "_nom-out" : "_nom-in"} 0.26s cubic-bezier(.34,1.2,.64,1) forwards` }}>
        <>
          <div className="flex items-center justify-between border-b border-purple-100 px-4 py-2 shrink-0"
            style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
            <div>
              <div className="font-bold text-[#1a0f2e]">Yeni Açılış Et</div>
              <div className="text-xs text-[#7c6fa0]">Heyvan seçin və minimum 30% ilkin ödəniş edin</div>
            </div>
            <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-100 transition-colors">
              <X size={16} className="text-[#7c6fa0]" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 border-b border-purple-100 px-4 py-1.5 shrink-0">
            {NOM_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${i === step ? "text-purple-700" : i < step ? "text-emerald-600" : "text-[#7c6fa0]"}`}>
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    i === step ? "bg-purple-600 text-white" : i < step ? "bg-emerald-500 text-white" : "bg-[#e8e4f4] text-[#7c6fa0]"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  {s}
                </div>
                {i < NOM_STEPS.length - 1 && <ChevronDown size={12} className="text-[#7c6fa0] -rotate-90" />}
              </div>
            ))}
          </div>

          <div ref={wrapRef} className="overflow-hidden px-4"
            style={{ transition: "height 0.28s cubic-bezier(.25,.8,.25,1)" }}>
          <div key={`nom-step-${step}`} className={`py-2 ${stepDir === "fwd" ? "nom-step-fwd" : "nom-step-bwd"}`}>

            {/* Mini Auth Phase */}
            {authPhase && forgotPhase && (
              <ForgotPasswordInline onBack={() => setForgotPhase(false)} onSuccess={afterAuth} />
            )}
            {authPhase && !forgotPhase && (
              <div className="flex flex-col gap-3">
                {/* Back */}
                <button onClick={() => { setAuthPhase(false); resetAuth(); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#7c6fa0] hover:text-[#1a0f2e] transition-colors self-start">
                  <ChevronDown size={13} className="rotate-90" /> Geri qayıt
                </button>

                {/* Mode tabs */}
                <div className="flex rounded-2xl bg-[#f0ecff] p-1 gap-1">
                  {[["login","Daxil ol"],["register","Qeydiyyat"]].map(([m, label]) => (
                    <button key={m} onClick={() => { setAuthMode(m); resetAuth(); }}
                      className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${authMode === m ? "bg-white shadow-sm text-purple-700" : "text-[#7c6fa0] hover:text-purple-600"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Method tabs */}
                <div className="flex gap-2">
                  {([["email", Mail, "Email"], ["phone", Phone, "Telefon"]]).map(([mt, Icon, label]) => (
                    <button key={mt} onClick={() => { setAuthMethod(mt); setAuthInput(""); setAuthError(""); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-semibold transition-all ${authMethod === mt ? "border-purple-500 bg-purple-50 text-purple-700" : "border-[#e8e4f4] text-[#7c6fa0] hover:border-purple-300"}`}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {/* Login form */}
                {authMode === "login" && (
                  <div className="flex flex-col gap-2.5 mt-1">
                    <div className="relative">
                      {authMethod === "email"
                        ? <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        : <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />}
                      <input
                        type={authMethod === "email" ? "email" : "tel"}
                        inputMode={authMethod === "phone" ? "tel" : undefined}
                        placeholder={authMethod === "email" ? "Email ünvanı" : "+994 50 000 00 00"}
                        value={authInput}
                        onChange={e => {
                          const v = authMethod === "phone" ? e.target.value.replace(/[^\d\s+\-()]/g, "") : e.target.value;
                          setAuthInput(v);
                          setAuthError("");
                        }}
                        className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]" />
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                      <input type="password" placeholder="Şifrə" value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAuthLogin()}
                        className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]" />
                    </div>
                    {authError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{authError}</p>}
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setForgotPhase(true)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-colors">
                        Şifrəmi unutdum
                      </button>
                    </div>
                    <button onClick={handleAuthLogin} disabled={authLoading}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                      style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                      {authLoading ? "Giriş edilir..." : "Daxil ol"}
                    </button>
                  </div>
                )}

                {/* Register form */}
                {authMode === "register" && !authOtpSent && (
                  <div className="flex flex-col gap-2.5 mt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Ad" value={authRegFirst}
                        onChange={e => setAuthRegFirst(e.target.value)}
                        className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]" />
                      <input type="text" placeholder="Soyad" value={authRegLast}
                        onChange={e => setAuthRegLast(e.target.value)}
                        className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]" />
                    </div>
                    <div className="relative">
                      {authMethod === "email"
                        ? <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        : <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />}
                      <input
                        type={authMethod === "email" ? "email" : "tel"}
                        inputMode={authMethod === "phone" ? "tel" : undefined}
                        placeholder={authMethod === "email" ? "Email ünvanı" : "+994 50 000 00 00"}
                        value={authInput}
                        onChange={e => {
                          const v = authMethod === "phone" ? e.target.value.replace(/[^\d\s+\-()]/g, "") : e.target.value;
                          setAuthInput(v);
                          setAuthError("");
                        }}
                        className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]" />
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                      <input type="password" placeholder="Şifrə (min 6 simvol)" value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAuthSendOtp()}
                        className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors placeholder:text-[#b0a4cc]" />
                    </div>
                    {authError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{authError}</p>}
                    <button onClick={handleAuthSendOtp} disabled={authLoading}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                      style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                      {authLoading ? "Göndərilir..." : "Kod göndər →"}
                    </button>
                  </div>
                )}

                {/* OTP verify */}
                {authMode === "register" && authOtpSent && (
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2.5 text-xs text-[#7c6fa0]">
                      Doğrulama kodu <b className="text-purple-700">{authInput}</b> ünvanına göndərildi.{" "}
                      <button onClick={() => { setAuthOtpSent(false); setAuthOtp(""); setAuthError(""); }}
                        className="text-purple-600 font-semibold underline">Dəyiş</button>
                    </div>
                    <input type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
                      value={authOtp} autoFocus
                      onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={e => e.key === "Enter" && handleAuthVerifyOtp()}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-3 text-xl text-center font-black tracking-[0.5em] text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                    {authError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{authError}</p>}
                    <button onClick={handleAuthVerifyOtp} disabled={authLoading || authOtp.length < 4}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                      style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                      {authLoading ? "Yoxlanılır..." : "Qeydiyyatı tamamla ✓"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 0 — Animal selection */}
            {!authPhase && step === 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold text-[#1a0f2e]">Heyvan növünü seçin</div>
                {loadingSettings ? (
                  <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {animals.map(item => {
                      const limited = isAtLimit(item);
                      const isSelected = !limited && String(selAnimalId) === String(item._id);
                      return (
                        <button key={item._id} onClick={() => !limited && setSelAnimalId(item._id)} disabled={limited}
                          className={`relative rounded-2xl border-2 p-2 text-left transition-all overflow-hidden ${
                            limited ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-70"
                              : isSelected ? "border-purple-500 bg-purple-50"
                              : "border-purple-100 hover:border-purple-300"}`}>
                          {limited && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 rounded-2xl z-10">
                              <span className="rounded-xl bg-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-white text-center leading-snug">
                                Açılış Limitinə<br />Çatıb
                              </span>
                            </div>
                          )}
                          <div className="mb-1.5 flex items-center gap-2">
                            <img src={item.image || ANIMAL_IMG_FALLBACK[item.nameAz] || "/qoyun.png"} alt={item.nameAz}
                              className="h-8 w-8 rounded-lg bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                            <div>
                              <div className="text-sm font-bold text-[#1a0f2e]">{item.nameAz}</div>
                              <div className="text-[10px] font-semibold text-purple-700">Qurbanlıq seçimi</div>
                            </div>
                          </div>
                          <div className="mt-1 flex flex-col gap-1 text-[10px]">
                            <div className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1">
                              <span className="text-[#7c6fa0]">Diri çəki</span>
                              <b className="text-right">{item.weightRange || "—"}</b>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1">
                              <span className="text-[#7c6fa0]">Qiymət</span>
                              <b className="text-right">{item.price.toLocaleString()} AZN</b>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <label className="mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-purple-100 bg-purple-50/30 p-2">
                  <div>
                    <div className="text-sm font-bold text-[#1a0f2e]">Anonim açılış</div>
                    <div className="text-xs text-[#7c6fa0]">Adınız iştirakçılara göstərilməyəcək</div>
                  </div>
                  <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="h-5 w-5 accent-purple-700" />
                </label>
              </div>
            )}

            {/* Step 1 — Payment */}
            {!authPhase && step === 1 && animal && (
              <div className="space-y-2">
                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-2.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <img src={animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || "/qoyun.png"} alt={animal.nameAz}
                        className="h-10 w-10 rounded-xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                      <div>
                        <div className="font-bold text-[#1a0f2e]">{animal.nameAz} Qurbanı</div>
                        <div className="text-xs text-[#7c6fa0]">Diri çəki: {animal.weightRange} • {animal.price.toLocaleString()} AZN</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-[#7c6fa0]">
                      Minimum ilkin ödəniş<br />
                      <b className="text-sm text-purple-700">{minAmount.toLocaleString()} AZN</b>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Ödəmək istədiyiniz məbləğ</label>
                  <input type="number" min={minAmount} max={animal.price} step={0.01} value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] focus:border-purple-400 focus:outline-none transition-colors" />
                  <div className={`mt-1 text-xs ${validAmt ? "text-[#7c6fa0]" : "text-rose-500"}`}>
                    Minimum {minAmount.toLocaleString()} AZN — heyvanın tam məbləği yığılana qədər minimum {minDon} AZN-lik ianələr qəbul olunacaq.
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setNoteExpanded(v => !v)}
                    className="mb-1.5 flex w-full items-center justify-between">
                    <span className="text-xs font-semibold text-[#1a0f2e]">Qeyd</span>
                    <ChevronDown size={14} className={`text-[#7c6fa0] transition-transform duration-200 ${noteExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {noteExpanded ? (
                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Açılışla bağlı qeyd..." rows={4} autoFocus
                      className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] placeholder:text-[#7c6fa0] focus:border-purple-400 focus:outline-none transition-colors" />
                  ) : (
                    <div onClick={() => setNoteExpanded(true)}
                      className="w-full cursor-text rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#7c6fa0] line-clamp-2 min-h-[44px]">
                      {note || "Açılışla bağlı qeyd..."}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 — Confirmation */}
            {!authPhase && step === 2 && animal && (
              <div className="space-y-2">
                {!isGuest ? (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-2.5">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                      <Shield size={12} /> Aktiv hesab
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-700 text-sm font-extrabold text-white">
                        {initials2(userFullName(user))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="break-all font-bold text-[#1a0f2e] text-sm leading-tight">{userFullName(user)}</div>
                        <div className="truncate text-xs text-[#7c6fa0]">{user?.phone || user?.email || ""}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Qeydiyyatlı</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setContMode("registered")}
                        className={`rounded-2xl border-2 p-2 text-left transition ${contMode === "registered" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                        <div className="font-bold text-[#1a0f2e]">Qeydiyyat ilə</div>
                        <div className="mt-0.5 text-xs text-[#7c6fa0]">Hesabınıza daxil olaraq davam edin</div>
                      </button>
                      {settings.allowGuest !== false && (
                        <button onClick={() => setContMode("guest")}
                          className={`rounded-2xl border-2 p-2 text-left transition ${contMode === "guest" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                          <div className="font-bold text-[#1a0f2e]">Qeydiyyatsız</div>
                          <div className="mt-0.5 text-xs text-[#7c6fa0]">Ad soyad ilə davam edin</div>
                        </button>
                      )}
                    </div>
                    {contMode === "guest" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Ad</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Adınız"
                              className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Soyad</label>
                            <input value={guestLastName} onChange={e => setGuestLastName(e.target.value)} placeholder="Soyadınız"
                              className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Telefon</label>
                          <input value={phone} inputMode="tel"
                            onChange={e => setPhone(e.target.value.replace(/[^\d\s+\-()]/g, ""))}
                            placeholder="+994 50 000 00 00"
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${phone && !/^(\+994|0)(50|51|55|60|70|77|99)\d{7}$/.test(phone.replace(/[\s\-()]/g, "")) ? "border-rose-300 bg-rose-50 focus:border-rose-400" : "border-purple-100 bg-purple-50/30 focus:border-purple-400"}`} />
                          {phone && !/^(\+994|0)(50|51|55|60|70|77|99)\d{7}$/.test(phone.replace(/[\s\-()]/g, "")) && (
                            <p className="mt-1 text-xs text-rose-500">Düzgün AZ nömrəsi daxil edin (+994XXXXXXXXX)</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {isAnon && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                    <button type="button" onClick={() => setAnonExpanded(v => !v)}
                      className="flex w-full items-start justify-between gap-2 text-left">
                      <p className={`text-[12px] font-semibold leading-relaxed text-amber-800 ${anonExpanded ? "" : "line-clamp-2"}`}>
                        Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir. Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur, üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                      </p>
                      <ChevronDown size={14} className={`shrink-0 mt-0.5 text-amber-600 transition-transform duration-200 ${anonExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                )}
                <div className="rounded-2xl border border-purple-100 p-2.5"
                  style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                    <Shield size={12} /> Açılış xülasəsi
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7c6fa0]">Heyvan</span>
                      <span className="flex items-center gap-2 font-semibold">
                        <img src={animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || "/qoyun.png"} alt={animal.nameAz}
                          className="h-7 w-7 rounded-full bg-purple-100 object-cover ring-1 ring-purple-200" />
                        {animal.nameAz}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c6fa0]">Tam məbləğ</span>
                      <span className="font-semibold">{animal.price.toLocaleString()} AZN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c6fa0]">İlkin ödəniş</span>
                      <span className="font-semibold">{numAmount.toLocaleString()} AZN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c6fa0]">Anonim</span>
                      <span className="font-semibold">{isAnon ? "Bəli" : "Xeyr"}</span>
                    </div>
                    <div className="flex justify-between border-t border-purple-100 pt-2">
                      <span className="font-bold text-[#1a0f2e]">Qalan toplanacaq</span>
                      <span className="font-bold text-purple-700">{remaining.toLocaleString()} AZN</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[#7c6fa0]">
                  Pay sistemi yoxdur. Tam məbləğ tamamlanana qədər digər istifadəçilər minimum {minDon} AZN ianə edə biləcəklər.
                </p>
              </div>
            )}
          </div></div>

          {!authPhase && (
            <div className="flex gap-3 px-4 pb-3 pt-2 shrink-0 border-t border-purple-100">
              {step > 0 && (
                <button onClick={() => changeStep("bwd", step - 1)}
                  className="flex-1 rounded-xl border border-purple-200 py-2.5 text-sm font-semibold text-[#1a0f2e] hover:bg-purple-50 transition-colors">
                  Geri
                </button>
              )}
              {step < NOM_STEPS.length - 1 ? (
                <button onClick={goNext} disabled={(step === 0 && !animal) || (step === 1 && !validAmt)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                  Davam et
                </button>
              ) : (
                <button onClick={handleConfirm} disabled={!finalValid || submitting}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                  {submitting ? "Yönləndirilir..." : "Açılışı təsdiqlə ✓"}
                </button>
              )}
            </div>
          )}
        </>
      </div>
    </div>
  );
}

/* ─── Layout ─────────────────────────────────────────────────── */
export default function CharityLayout({ children }) {
  const { isGuest, user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewOpening, setShowNewOpening] = useState(false);
  const [preselectedAnimal, setPreselectedAnimal] = useState(null);

  const visibleNav = isGuest
    ? SIDEBAR_NAV.filter(n => n.href !== "/charity/donations")
    : SIDEBAR_NAV;

  const isActive = (href) => {
    if (href === "/charity") return pathname === "/charity" || pathname === "/charity/";
    return pathname.startsWith(href);
  };

  return (
    <CharityLayoutContext.Provider value={{ openNewCampaign: (animalName) => { setPreselectedAnimal(animalName || null); setShowNewOpening(true); } }}>
      <main className="bg-background p-3 pb-3 font-sans text-foreground md:p-7 md:pb-7 overflow-hidden" style={{ height: "100dvh" }}>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl flex h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-3.5rem)]">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col overflow-hidden" style={{ backgroundColor: "#301586" }}>
          {/* Back arrow — very top of sidebar */}
          <div className="px-4 pb-1" style={{ paddingTop: 14 }}>
            <Link href="/" className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 text-white shadow hover:bg-white/20 transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </Link>
          </div>
          {/* Logo + HeartHandshake icon top-left */}
          <div className="flex justify-center pb-4" style={{ marginTop: -1 }}>
            <div className="relative" style={{ width: 160 }}>
              <div className="absolute -top-3 -right-3 z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-[#6820a3]/30 bg-white shadow-lg">
                <HeartHandshake className="h-7 w-7 text-[#6820a3]" />
              </div>
              <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={160} height={88}
                style={{ width: 160, height: "auto", objectFit: "contain" }} priority />
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {visibleNav.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                  isActive(href) ? "bg-white/15 text-white font-semibold" : "text-purple-100/70 hover:bg-white/5 hover:text-white"
                }`}>
                <Icon size={15} className={isActive(href) ? "text-white" : "text-purple-200/60"} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mx-3 mb-3">
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div className="px-3 py-1.5 flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Heart size={11} style={{ color: "rgba(255,255,255,0.85)" }} />
                </div>
                <p className="text-[11px] font-semibold leading-tight text-white/80">Birlikdə xeyir, birlikdə paylaşaq</p>
              </div>
              <div className="mx-3 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
              <div className="px-2 pb-2 pt-1.5">
                <button onClick={() => setShowNewOpening(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-all"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Plus size={13} strokeWidth={2.5} /> Yeni açılış et
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* TopBar */}
          <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 border-b border-purple-900/20 shrink-0"
            style={{ backgroundColor: "#301586" }}>
            <div className="flex items-center gap-2 min-w-0">
              {/* Hamburger — mobile only */}
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
                onClick={() => setMobileMenuOpen(true)}>
                <Menu size={18} className="text-white" />
              </button>
              {/* Back arrow — mobile topbar only */}
              <Link href="/" className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0">
                <ArrowLeft size={18} className="text-white" />
              </Link>
              <div className="flex items-center gap-2 lg:hidden shrink-0">
                <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={80} height={44}
                  style={{ height: 28, width: "auto", objectFit: "contain" }} />
              </div>
              <span className="text-[13px] md:text-[15px] font-semibold text-white line-clamp-1 min-w-0">
                <span>Kollektiv Qurban</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell size={16} className="text-white" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-[#301586]" />
              </button>
              {isGuest ? (
                <Link href="/auth/register"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#301586] text-[12px] font-semibold hover:bg-purple-50 transition-all shadow-sm">
                  Qeydiyyat <ChevronDown size={12} />
                </Link>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
                    {initials2(userFullName(user))}
                  </div>
                  <span className="text-[12px] font-semibold text-white/90 max-w-[120px] truncate">
                    {userFullName(user)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile left drawer — backdrop */}
          <div
            className={`lg:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile left drawer — panel */}
          <div className={`lg:hidden fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ backgroundColor: "#301586" }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center">
                <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={130} height={70}
                  style={{ height: "auto", objectFit: "contain" }} />
              </div>
              <button onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {visibleNav.map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                    isActive(href) ? "bg-white/15 text-white font-semibold" : "text-purple-100/70 hover:bg-white/10 hover:text-white"
                  }`}>
                  <Icon size={16} className={isActive(href) ? "text-white" : "text-purple-200/60"} />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Bottom: user info or register */}
            <div className="px-4 pb-6 border-t border-white/10 pt-4">
              {isGuest ? (
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-white text-[#301586] text-[13px] font-semibold hover:bg-purple-50 transition-all">
                  Qeydiyyat
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                    {initials2(userFullName(user))}
                  </div>
                  <span className="text-[13px] font-semibold text-white/90 truncate">{userFullName(user)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#7c3aed33 transparent" }}>
          {children}
          </div>

          {/* Mobile Bottom Nav */}
          <nav className="lg:hidden shrink-0 border-t border-[#e7e1f0] bg-white flex z-40">
            {visibleNav.map(({ icon: Icon, label, short, href }) => (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive(href) ? "text-[#4b14bd]" : "text-gray-400"
                }`}>
                <Icon size={20} strokeWidth={isActive(href) ? 2.2 : 1.8} />
                <span className="text-[9px] font-medium leading-none truncate max-w-[56px]">{short || label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {showNewOpening && <NewOpeningModal preselectedAnimalName={preselectedAnimal} onClose={() => { setShowNewOpening(false); setPreselectedAnimal(null); }} />}
      </main>
    </CharityLayoutContext.Provider>
  );
}
