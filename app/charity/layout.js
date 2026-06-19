"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  Plus, Bell, User, ChevronDown, ArrowLeft, X,
  Heart, Menu, Shield, ChevronRight, Mail, Phone, Lock,
  UserRoundCheck, Video,
} from "lucide-react";
import { CharityLayoutContext } from "./_context";
import { SIDEBAR_NAV, ANIMAL_IMG_FALLBACK } from "./_lib";
import api from "../../lib/api";

const userFullName = (user) => [user?.name, user?.lastName].filter(Boolean).join(" ").trim() || "İstifadəçi";
const initials2 = (name) => (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

/* ─── New Opening Modal ──────────────────────────────────────── */
const NOM_STEPS = ["Heyvan növü", "Ödəniş", "Təsdiq"];

function NewOpeningModal({ onClose }) {
  const { isGuest, user, login } = useAuth();
  const [step,        setStep]        = useState(0);
  const [selAnimalId, setSelAnimalId] = useState(null);
  const [isAnon,      setIsAnon]      = useState(false);
  const [amount,      setAmount]      = useState("");
  const [note,        setNote]        = useState("");
  const [contMode,    setContMode]    = useState("");
  const [name,        setName]        = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [phone,       setPhone]       = useState("");
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

  useEffect(() => {
    api.get("/campaigns/settings")
      .then(res => {
        const d = res.data?.data || {};
        setSettingsData(d);
        if (d.animals?.length) {
          const mp = d.settings?.maxPerAnimal || 1;
          const first = d.animals.find(a => (a.activeCount || 0) < mp) || d.animals[0];
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
    if (step === 0) { setAmount(String(minAmount)); setStep(1); return; }
    if (step === 1 && !validAmt) return;
    setStep(s => s + 1);
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

  const handleAuthLogin = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (!val) return setAuthError("Email və ya telefon daxil edin");
    if (!authPassword) return setAuthError("Şifrə daxil edin");
    setAuthLoading(true);
    try {
      const isEmail = val.includes("@");
      const body = isEmail ? { email: val, password: authPassword } : { phone: val, password: authPassword };
      const res = await api.post("/auth/login-password", body);
      const { token, user: u } = res.data.data;
      await afterAuth(token, u);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Giriş uğursuz oldu");
      setAuthLoading(false);
    }
  };

  const handleAuthSendOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (!authRegFirst.trim()) return setAuthError("Adınızı daxil edin");
    if (!authRegLast.trim())  return setAuthError("Soyadınızı daxil edin");
    if (!val) return setAuthError("Email və ya telefon daxil edin");
    if (!authPassword || authPassword.length < 6) return setAuthError("Şifrə minimum 6 simvol olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = val.includes("@");
      const body = isEmail ? { email: val, isRegister: true } : { phone: val, channel: "sms", isRegister: true };
      await api.post("/auth/send-otp", body);
      setAuthOtpSent(true);
    } catch (err) {
      setAuthError(err.response?.data?.message || "OTP göndərilmədi");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthVerifyOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (authOtp.length < 4) return setAuthError("OTP kodu daxil edin");
    setAuthLoading(true);
    try {
      const isEmail = val.includes("@");
      const body = isEmail ? { email: val, code: authOtp, password: authPassword } : { phone: val, code: authOtp, password: authPassword };
      const res = await api.post("/auth/verify-otp", body);
      const { token, user: u } = res.data.data;
      const fullName = `${authRegFirst.trim()} ${authRegLast.trim()}`;
      const pRes = await api.put("/auth/profile", { name: fullName }, { headers: { Authorization: `Bearer ${token}` } });
      const finalToken = pRes.data?.data?.token || token;
      const finalUser  = pRes.data?.data?.user  || { ...u, name: fullName };
      await afterAuth(finalToken, finalUser);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Kod yanlışdır");
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto flex h-[560px] max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <>
          <div className="flex items-center justify-between border-b border-purple-100 px-5 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
            <div>
              <div className="font-bold text-[#1a0f2e]">Yeni Açılış Et</div>
              <div className="text-xs text-[#7c6fa0]">Heyvan seçin və minimum 30% ilkin ödəniş edin</div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-100 transition-colors">
              <X size={16} className="text-[#7c6fa0]" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 border-b border-purple-100 px-5 py-2 shrink-0">
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

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#a78bfa transparent" }}>

            {/* Mini Auth Phase */}
            {authPhase && (
              <div className="flex flex-col gap-2.5">
                <button onClick={() => { setAuthPhase(false); resetAuth(); }}
                  className="flex items-center gap-1 text-xs text-[#7c6fa0] hover:text-[#1a0f2e] transition-colors self-start mb-0.5">
                  <ChevronDown size={13} className="rotate-90" /> Geri qayıt
                </button>
                <div className="flex rounded-xl bg-[#f5f3ff] p-1 gap-1">
                  {[["login","Daxil ol"],["register","Qeydiyyat"]].map(([m, label]) => (
                    <button key={m} onClick={() => { setAuthMode(m); resetAuth(); }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${authMode === m ? "bg-white shadow text-purple-700" : "text-[#7c6fa0]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {([["email", Mail, "Email"], ["phone", Phone, "Telefon"]]).map(([mt, Icon, label]) => (
                    <button key={mt} onClick={() => { setAuthMethod(mt); setAuthInput(""); setAuthError(""); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-semibold transition-all ${authMethod === mt ? "border-purple-400 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-500"}`}>
                      <Icon size={13} />{label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2" style={{ minHeight: "240px" }}>
                  {authMode === "login" && (
                    <>
                      <div className="invisible select-none rounded-xl border border-transparent px-3 py-2.5 text-sm" aria-hidden>x</div>
                      <div className="invisible select-none rounded-xl border border-transparent px-3 py-2.5 text-sm" aria-hidden>x</div>
                      <input type={authMethod === "email" ? "email" : "tel"} placeholder={authMethod === "email" ? "Email" : "+994 50 000 00 00"}
                        value={authInput} onChange={e => setAuthInput(e.target.value)}
                        className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        <input type="password" placeholder="Şifrə" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAuthLogin()}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                      </div>
                      {authError && <p className="text-xs text-red-500 -mt-0.5">{authError}</p>}
                      <div className="flex justify-end -mt-0.5">
                        <a href="/auth/forgot-password" target="_blank" rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:text-purple-800 hover:underline transition-colors">
                          Şifrəmi unutdum
                        </a>
                      </div>
                      <button onClick={handleAuthLogin} disabled={authLoading}
                        className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all mt-auto"
                        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                        {authLoading ? "Giriş edilir..." : "Daxil ol"}
                      </button>
                    </>
                  )}
                  {authMode === "register" && !authOtpSent && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Ad" value={authRegFirst} onChange={e => setAuthRegFirst(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                        <input type="text" placeholder="Soyad" value={authRegLast} onChange={e => setAuthRegLast(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                      </div>
                      <input type={authMethod === "email" ? "email" : "tel"} placeholder={authMethod === "email" ? "Email" : "+994 50 000 00 00"}
                        value={authInput} onChange={e => setAuthInput(e.target.value)}
                        className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        <input type="password" placeholder="Şifrə (min 6 simvol)" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAuthSendOtp()}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                      </div>
                      {authError && <p className="text-xs text-red-500 -mt-0.5">{authError}</p>}
                      <button onClick={handleAuthSendOtp} disabled={authLoading}
                        className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all mt-auto"
                        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                        {authLoading ? "Göndərilir..." : "OTP kodu göndər"}
                      </button>
                    </>
                  )}
                </div>
                {authMode === "register" && authOtpSent && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-[#7c6fa0]">
                      Kod <b>{authInput}</b> ünvanına göndərildi.{" "}
                      <button onClick={() => { setAuthOtpSent(false); setAuthOtp(""); setAuthError(""); }}
                        className="text-purple-600 underline">Dəyiş</button>
                    </p>
                    <input type="text" inputMode="numeric" maxLength={6} placeholder="6 rəqəmli OTP kodu"
                      value={authOtp} autoFocus onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={e => e.key === "Enter" && handleAuthVerifyOtp()}
                      className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-center font-bold tracking-[0.4em] text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors" />
                    {authError && <p className="text-xs text-red-500 -mt-0.5">{authError}</p>}
                    <button onClick={handleAuthVerifyOtp} disabled={authLoading || authOtp.length < 4}
                      className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all"
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
                          className={`relative rounded-2xl border-2 p-3 text-left transition-all overflow-hidden ${
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
                          <div className="mb-2 flex items-center gap-2">
                            <img src={item.image || ANIMAL_IMG_FALLBACK[item.nameAz] || "/qoyun.png"} alt={item.nameAz}
                              className="h-10 w-10 rounded-xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                            <div>
                              <div className="text-sm font-bold text-[#1a0f2e]">{item.nameAz}</div>
                              <div className="text-[10px] font-semibold text-purple-700">Qurbanlıq seçimi</div>
                            </div>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs">
                            <div className="rounded-lg bg-white/70 p-1.5">
                              <span className="block text-[#7c6fa0]">Qiymət</span>
                              <b>{item.price.toLocaleString()} AZN</b>
                            </div>
                            <div className="rounded-lg bg-white/70 p-1.5">
                              <span className="block text-[#7c6fa0]">Diri çəki</span>
                              <b>{item.weightRange || "—"}</b>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/30 p-3">
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
              <div className="space-y-3">
                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3">
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
                  <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Qeyd</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Açılışla bağlı qeyd..." rows={2}
                    className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] placeholder:text-[#7c6fa0] focus:border-purple-400 focus:outline-none transition-colors" />
                </div>
              </div>
            )}

            {/* Step 2 — Confirmation */}
            {!authPhase && step === 2 && animal && (
              <div className="space-y-3">
                {!isGuest ? (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                      <Shield size={12} /> Aktiv hesab
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-700 text-sm font-extrabold text-white">
                        {initials2(userFullName(user))}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-bold text-[#1a0f2e]">{userFullName(user)}</div>
                        <div className="truncate text-xs text-[#7c6fa0]">{user?.phone || user?.email || ""}</div>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Qeydiyyatlı</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setContMode("registered")}
                        className={`rounded-2xl border-2 p-3 text-left transition ${contMode === "registered" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                        <div className="font-bold text-[#1a0f2e]">Qeydiyyat ilə</div>
                        <div className="mt-0.5 text-xs text-[#7c6fa0]">Hesabınıza daxil olaraq davam edin</div>
                      </button>
                      {settings.allowGuest !== false && (
                        <button onClick={() => setContMode("guest")}
                          className={`rounded-2xl border-2 p-3 text-left transition ${contMode === "guest" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
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
                          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+994 XX XXX XX XX"
                            className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                {isAnon && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-[12px] font-semibold leading-relaxed text-amber-800">
                    Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir. Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur, üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                  </div>
                )}
                <div className="rounded-2xl border border-purple-100 p-3"
                  style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
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
          </div>

          {!authPhase && (
            <div className="flex gap-3 px-5 pb-4 pt-3 shrink-0 border-t border-purple-100">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
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
  const { isGuest } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewOpening, setShowNewOpening] = useState(false);

  const visibleNav = isGuest
    ? SIDEBAR_NAV.filter(n => n.href !== "/charity/donations")
    : SIDEBAR_NAV;

  const isActive = (href) => {
    if (href === "/charity") return pathname === "/charity" || pathname === "/charity/";
    return pathname.startsWith(href);
  };

  return (
    <CharityLayoutContext.Provider value={{ openNewCampaign: () => setShowNewOpening(true) }}>
      <div className="flex h-screen overflow-hidden bg-[#f7f5ff]">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-56 min-h-screen flex-col shrink-0" style={{ backgroundColor: "#301586" }}>
          <div className="px-4 py-5 flex items-center gap-3">
            <Image src="/logo_test.png" alt="meatbox.az" width={44} height={44}
              className="rounded-full object-contain bg-white shadow-sm" />
            <div className="text-white font-semibold text-[15px] tracking-wide">meatbox.az</div>
          </div>
          <div className="px-3 mb-3">
            <button onClick={() => setShowNewOpening(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
              style={{ backdropFilter: "blur(4px)" }}>
              <Plus size={15} /> Yeni açılış et
            </button>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {visibleNav.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive(href) ? "bg-white/15 text-white font-semibold" : "text-purple-100/70 hover:bg-white/5 hover:text-white"
                }`}>
                <Icon size={16} className={isActive(href) ? "text-white" : "text-purple-200/60"} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mx-3 mb-5 p-3.5 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Heart size={13} className="text-white/80" />
              <span className="text-white/80 text-xs font-medium">Birlikdə xeyir,</span>
            </div>
            <span className="text-purple-100/60 text-xs">birlikdə paylaşaq</span>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TopBar */}
          <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 border-b border-purple-900/20 shrink-0"
            style={{ backgroundColor: "#301586" }}>
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0">
                <ArrowLeft size={18} className="text-white" />
              </Link>
              <div className="flex items-center gap-2 lg:hidden">
                <Image src="/logo_test.png" alt="meatbox.az" width={30} height={30}
                  className="rounded-full object-contain bg-white shadow-sm shrink-0" />
              </div>
              <span className="text-[13px] md:text-[16px] font-semibold text-white truncate">
                Kollektiv Qurban-Xeyriyyə Platforması
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell size={16} className="text-white" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-[#301586]" />
              </button>
              <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center hover:bg-white/10 transition-colors">
                <User size={16} className="text-white" />
              </button>
              <Link href="/auth/register"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#301586] text-[12px] font-semibold hover:bg-purple-50 transition-all shadow-sm">
                Qeydiyyat <ChevronDown size={12} />
              </Link>
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Mobile slide-down menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden shrink-0 border-b border-purple-900/30 py-2 px-3" style={{ backgroundColor: "#301586" }}>
              {visibleNav.map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive(href) ? "bg-white/15 text-white font-semibold" : "text-purple-100/70"
                  }`}>
                  <Icon size={15} className={isActive(href) ? "text-white" : "text-purple-200/60"} />
                  {label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3 px-3">
                <Link href="/auth/register"
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white text-[#301586] text-[12px] font-semibold">
                  Qeydiyyat
                </Link>
              </div>
            </div>
          )}

          {/* Page content */}
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#e7e1f0] bg-white flex">
          {visibleNav.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive(href) ? "text-[#4b14bd]" : "text-gray-400"
              }`}>
              <Icon size={20} strokeWidth={isActive(href) ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium leading-none truncate max-w-[52px]">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {showNewOpening && <NewOpeningModal onClose={() => setShowNewOpening(false)} />}
    </CharityLayoutContext.Provider>
  );
}
