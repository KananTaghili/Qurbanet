"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, KeyRound, Phone, Mail } from "lucide-react";
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

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setPhone("");
    setEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "phone") {
      const raw = phone.replace(/\s/g, "");
      if (raw.length < 9) {
        setError("Düzgün telefon nömrəsi daxil edin.");
        return;
      }
    } else {
      if (!email.trim() || !email.includes("@")) {
        setError("Düzgün email ünvanı daxil edin.");
        return;
      }
    }
    if (!password || password.length < 6) {
      setError("Şifrə ən az 6 simvol olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      const body = { password };
      if (mode === "phone") {
        const raw = phone.replace(/\s/g, "");
        body.phone = raw.startsWith("0")
          ? "+994" + raw.slice(1)
          : raw.startsWith("+994")
            ? raw
            : "+994" + raw;
      } else {
        body.email = email.trim().toLowerCase();
      }

      const res = await api.post("/auth/login-password", body);

      if (res.data.success) {
        const { token, user, needsName } = res.data.data;
        login(token, user);
        if (needsName || !user.name) {
          router.push("/auth/name");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin.",
      );
    } finally {
      setLoading(false);
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
        {/* Back button — mobile only */}
        <button
          type="button"
          onClick={() => router.back()}
          className="lg:hidden absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-2xl transition-colors"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
          aria-label="Geri qayıt"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-5 text-center animate-fade-up">
          {/* Logo */}
          <div
            className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)" }}
          >
            <Image
              src="/logo.png"
              alt="QurbanEt"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name */}
          <div>
            <div className="text-4xl lg:text-5xl font-black text-white italic leading-none">
              Qurban<span style={{ color: "#86efac" }}>Et</span>
            </div>
            <div
              className="text-sm lg:text-base mt-3 leading-relaxed max-w-[220px] mx-auto"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              İlahi qurbanınızı etibarla kəsdirin
            </div>
          </div>

          {/* Tagline */}
          <div
            className="flex items-center gap-3 text-[10px] font-bold tracking-widest"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <span>ETİBARLI</span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.35)" }}
            />
            <span>HALAL</span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.35)" }}
            />
            <span>SÜRƏTLİ</span>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-surface">
        <div className="w-full max-w-sm animate-fade-up">
          <h2 className="text-2xl font-black text-text-primary mb-1">Daxil ol</h2>
          <p className="text-sm text-text-secondary mb-6">
            Telefon nömrəsi və ya Gmail ilə daxil olun.
          </p>

          {/* Mode toggle */}
          <div className="flex bg-surface-alt rounded-2xl p-1 mb-5 gap-1">
            <button
              type="button"
              onClick={() => switchMode("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "phone"
                  ? "bg-surface shadow-sm text-primary"
                  : "text-text-secondary"
              }`}
            >
              <Phone size={15} />
              Telefon
            </button>
            <button
              type="button"
              onClick={() => switchMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "email"
                  ? "bg-surface shadow-sm text-primary"
                  : "text-text-secondary"
              }`}
            >
              <Mail size={15} />
              Gmail
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Phone input */}
            {mode === "phone" && (
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 block">
                  Telefon Nömrəsi *
                </label>
                <div className="flex items-center gap-2 bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:bg-surface transition-all">
                  <span className="text-2xl flex-shrink-0">🇦🇿</span>
                  <span className="text-text-secondary font-semibold text-sm flex-shrink-0">
                    +994
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 9)));
                      setError("");
                    }}
                    placeholder="50 123 45 67"
                    className="flex-1 bg-transparent text-[17px] text-text-primary outline-none font-semibold tracking-wider"
                    autoFocus
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}

            {/* Email input */}
            {mode === "email" && (
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 block">
                  Gmail *
                </label>
                <div className="flex items-center gap-2 bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:bg-surface transition-all">
                  <Mail size={18} className="text-text-secondary flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="email@example.com"
                    className="flex-1 bg-transparent text-[17px] text-text-primary outline-none font-semibold"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-text-primary mb-2 block">
                Şifrə *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Şifrənizi daxil edin"
                  className="field-input pr-10"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Daxil olunur...
                </span>
              ) : (
                "Daxil ol"
              )}
            </button>

            <div className="flex items-center gap-2 justify-center text-xs text-text-muted">
              <Lock size={13} />
              <span>Məlumatlarınız yalnız giriş üçün istifadə edilir</span>
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                <KeyRound size={15} />
                Şifrəni unutdum
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
