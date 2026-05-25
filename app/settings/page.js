"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("password");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Cari şifrənizi daxil edin.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Yeni şifrə ən az 6 simvol olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yeni şifrələr uyğun gəlmir.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Yeni şifrə cari şifrə ilə eyni ola bilməz.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/auth/profile", {
        currentPassword,
        password: newPassword,
      });

      setSuccess("Şifrə uğurla yeniləndi!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Şifrə dəyişdirilə bilmədi. Yenidən cəhd edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="bg-primary text-white pt-6 pb-8 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Parametrlər</h1>
          <p className="text-white/75">Hesabınızı idarə edin</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {[
            { key: "password", label: "🔐 Şifrəni Dəyiş" },
            { key: "account", label: "👤 Hesab" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Password Change Tab */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="text-xl font-bold text-text-primary mb-1">
              Şifrənizi Dəyişin
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Hesabınızın təhlükəsizliyi üçün güclü bir şifrə istifadə edin.
            </p>

            <form
              onSubmit={handlePasswordChange}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 block">
                  Cari Şifrə *
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Cari şifrənizi daxil edin"
                    className="field-input pr-10"
                    maxLength={128}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showCurrent ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

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
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showNew ? "🙈" : "👁️"}
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
                    placeholder="Yeni şifrənizi yenidən daxil edin"
                    className="field-input pr-10"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  ✅ {success}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Yadda saxlanır...
                  </span>
                ) : (
                  "Şifrəni Yenilə"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="text-xl font-bold text-text-primary mb-6">
              Hesab Məlumatları
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary">
                  Telefon Nömrəsi
                </label>
                <p className="text-text-primary font-medium mt-1">
                  {user.phone || "-"}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-text-secondary">
                  Ad
                </label>
                <p className="text-text-primary font-medium mt-1">
                  {user.name || "Təyin edilməyib"}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-text-secondary">
                  Soyad
                </label>
                <p className="text-text-primary font-medium mt-1">
                  {user.lastName || "Təyin edilməyib"}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-50 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors"
              >
                Çıxış et
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
