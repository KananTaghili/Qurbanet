"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock, User, Eye, EyeOff, Phone, Mail, CheckCircle,
  AlertCircle, LogOut, ChevronRight, Shield, IdCard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

function PasswordInput({ value, onChange, placeholder, show, onToggle, autoFocus }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={128}
        className="w-full bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted outline-none font-medium transition-all focus:border-primary focus:bg-white"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-xl bg-primary-surface flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-bold text-text-primary truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("password");

  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [success, setSuccess]                   = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!currentPassword)                        { setError("Cari şifrənizi daxil edin."); return; }
    if (!newPassword || newPassword.length < 6)  { setError("Yeni şifrə ən az 6 simvol olmalıdır."); return; }
    if (newPassword !== confirmPassword)          { setError("Yeni şifrələr uyğun gəlmir."); return; }
    if (currentPassword === newPassword)          { setError("Yeni şifrə cari şifrə ilə eyni ola bilməz."); return; }

    setLoading(true);
    try {
      await api.put("/auth/profile", { currentPassword, password: newPassword });
      setSuccess("Şifrə uğurla yeniləndi!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Şifrə dəyişdirilə bilmədi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); router.push("/auth/login"); };

  if (!user) { router.push("/auth/login"); return null; }

  const tabs = [
    { key: "password", label: "Şifrəni Dəyiş", Icon: Lock },
    { key: "account",  label: "Hesab",          Icon: User },
  ];

  return (
    <div className="min-h-screen bg-bg pb-24">

      {/* ── Hero header ── */}
      <div className="bg-primary px-6 pt-8 pb-12">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Shield size={20} color="white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Parametrlər</h1>
          </div>
          <p className="text-white/65 text-sm ml-[52px]">Hesabınızı idarə edin</p>
        </div>
      </div>

      {/* ── Floating card ── */}
      <div className="max-w-xl mx-auto px-4 -mt-6">

        {/* Tab selector */}
        <div className="bg-white rounded-2xl shadow-card border border-border p-1.5 flex gap-1.5 mb-4">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setError(""); setSuccess(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === key
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Password tab ── */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-alt/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-surface flex items-center justify-center">
                <Lock size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-text-primary">Şifrəni Dəyiş</p>
                <p className="text-[11px] text-text-secondary">Güclü şifrə istifadə edin</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5 block">
                  Cari Şifrə *
                </label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  placeholder="Cari şifrənizi daxil edin"
                  show={showCurrent}
                  onToggle={() => setShowCurrent((v) => !v)}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5 block">
                  Yeni Şifrə *
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="Ən az 6 simvol"
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5 block">
                  Şifrəni Təsdiqlə *
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="Yeni şifrənizi yenidən daxil edin"
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  <CheckCircle size={16} className="flex-shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ boxShadow: "0 4px 14px rgba(27,94,32,0.25)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Yadda saxlanır...
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Şifrəni Yenilə
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Account tab ── */}
        {activeTab === "account" && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-surface-alt/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-surface flex items-center justify-center">
                  <IdCard size={15} className="text-primary" />
                </div>
                <p className="text-sm font-extrabold text-text-primary">Hesab Məlumatları</p>
              </div>

              <InfoRow icon={User}  label="Ad"              value={user.name} />
              <InfoRow icon={User}  label="Soyad"           value={user.lastName} />
              <InfoRow icon={Phone} label="Telefon"         value={user.phone} />
              {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between gap-3 bg-white border border-border rounded-2xl px-5 py-4 shadow-card hover:bg-red-50 hover:border-red-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut size={16} className="text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-600">Çıxış et</p>
                  <p className="text-[11px] text-text-secondary">Hesabdan çıx</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
