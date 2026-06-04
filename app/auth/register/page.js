"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Phone, Mail, ArrowRight, MessageSquare } from "lucide-react";
import api from "../../../lib/api";

const formatPhone = (val) => {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState("phone"); // "phone" | "email"
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
      const raw = phone.replace(/\s/g, "");
      if (raw.length < 9) { setError("Düzgün telefon nömrəsi daxil edin."); return; }
    } else {
      if (!email.trim() || !email.includes("@")) { setError("Düzgün email ünvanı daxil edin."); return; }
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const body = {};
      let identifier;
      if (mode === "phone") {
        const raw = phone.replace(/\s/g, "");
        identifier = raw.startsWith("0")
          ? "+994" + raw.slice(1)
          : raw.startsWith("+994") ? raw : "+994" + raw;
        body.phone = identifier;
      } else {
        identifier = email.trim().toLowerCase();
        body.email = identifier;
      }

      await api.post("/auth/send-otp", { ...body, isRegister: true }, { signal: abortRef.current.signal });

      sessionStorage.setItem("otp_identifier", identifier);
      sessionStorage.setItem("otp_identifier_type", mode === "email" ? "email" : "phone");
      router.push("/auth/otp");
    } catch (err) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) {
        setError(msg || (mode === "phone"
          ? "Bu telefon nömrəsi artıq sistemdə qeydiyyatdan keçib."
          : "Bu email artıq sistemdə qeydiyyatdan keçib."));
      } else {
        setError(msg || "Xəta baş verdi. Yenidən cəhd edin.");
      }
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

          <div className="flex flex-col items-center gap-5 text-center">
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
                İlahi qurbanınızı etibarla kəsdirin
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>ETİBARLI</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
              <span>HALAL</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
              <span>SÜRƏTLİ</span>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-surface">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-black text-text-primary mb-1">Qeydiyyat</h2>
            <p className="text-sm text-text-secondary mb-6">
              SMS və ya Email OTP ilə saniyələr içində hesab açın.
            </p>

            {/* Mode toggle */}
            <div className="flex bg-surface-alt rounded-2xl p-1 mb-5 gap-1">
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === "phone" ? "bg-surface shadow-sm text-primary" : "text-text-secondary"
                }`}
              >
                <MessageSquare size={15} />
                SMS
              </button>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === "email" ? "bg-surface shadow-sm text-primary" : "text-text-secondary"
                }`}
              >
                <Mail size={15} />
                Email
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {mode === "phone" ? (
                <div>
                  <label className="text-sm font-semibold text-text-primary mb-2 block">
                    Telefon Nömrəsi *
                  </label>
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
                  <p className="text-xs text-text-muted mt-1.5 ml-1">Nömrənizə SMS OTP göndəriləcək</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-semibold text-text-primary mb-2 block">
                    Email ünvanı *
                  </label>
                  <div className="flex items-center gap-2 bg-surface-alt border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:bg-surface transition-all">
                    <Mail size={18} className="text-text-secondary flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="email@gmail.com"
                      className="flex-1 bg-transparent text-[17px] text-text-primary outline-none font-semibold"
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1.5 ml-1">Email-inizə OTP kodu göndəriləcək</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex flex-col gap-2">
                  <span>{error}</span>
                  {error.includes("artıq") && (
                    <button
                      type="button"
                      onClick={() => router.push("/auth/login")}
                      className="text-left text-sm font-bold text-primary underline underline-offset-2"
                    >
                      Daxil ol səhifəsinə keç →
                    </button>
                  )}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Göndərilir...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === "phone" ? <MessageSquare size={16} /> : <Mail size={16} />}
                    OTP kodu al
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium">Artıq hesabınız var?</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="w-full py-3 rounded-2xl border-2 border-border bg-surface text-sm font-bold text-text-primary hover:border-primary hover:text-primary transition-all"
              >
                Daxil ol
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
