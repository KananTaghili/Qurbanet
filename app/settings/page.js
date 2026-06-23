"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock, User, Eye, EyeOff, Phone, Mail,
  CheckCircle, AlertCircle, LogOut, Pencil, X, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

/* ── Password input ─────────────────────────────── */
function PasswordInput({ value, onChange, placeholder, show, onToggle, autoFocus, name, autoComplete }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        name={name}
        autoComplete={autoComplete}
        maxLength={128}
        style={{
          width: "100%", height: 44, boxSizing: "border-box",
          border: "1px solid #e5e7eb", borderRadius: 12,
          padding: "0 44px 0 14px", fontSize: 14, fontFamily: "inherit",
          outline: "none", background: "#f9fafb", color: "#111827",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#c8102e")}
        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#9ca3af", display: "flex", alignItems: "center", padding: 0,
        }}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

/* ── Alert box ──────────────────────────────────── */
function Alert({ type, message }) {
  const isError = type === "error";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: isError ? "#fef2f2" : "#f0fdf4",
      border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
      color: isError ? "#b91c1c" : "#15803d",
      fontSize: 13, fontWeight: 600,
      padding: "10px 14px", borderRadius: 10,
    }}>
      {isError ? <AlertCircle size={15} style={{ flexShrink: 0 }} /> : <CheckCircle size={15} style={{ flexShrink: 0 }} />}
      {message}
    </div>
  );
}

/* ── Section card ───────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px",
      borderBottom: "1px solid #f1f5f9",
      background: "#fafafa",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "#fff1f2",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={15} color="#c8102e" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ── Info row ───────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 18px", borderBottom: "1px solid #f9fafb",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "#fff1f2",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={14} color="#c8102e" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

/* ── Account card ───────────────────────────────── */
function AccountCard({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || name.trim().length < 2) { setError("Ad ən az 2 simvol olmalıdır."); return; }
    setLoading(true);
    try {
      await api.put("/auth/profile", { name: name.trim(), lastName: lastName.trim() });
      updateUser({ name: name.trim(), lastName: lastName.trim() });
      setSuccess("Məlumatlar yeniləndi!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user.name || "");
    setLastName(user.lastName || "");
    setError("");
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader
        icon={User}
        title="Hesab məlumatları"
        subtitle="Ad, soyad, əlaqə"
        action={!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 700, color: "#c8102e",
              background: "#fff1f2", border: "none", borderRadius: 8,
              padding: "6px 12px", cursor: "pointer",
            }}
          >
            <Pencil size={12} />
            Redaktə et
          </button>
        )}
      />

      {editing ? (
        <form onSubmit={handleSave} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Ad *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Adınızı daxil edin"
              autoFocus
              name="given-name"
              autoComplete="given-name"
              style={{
                width: "100%", height: 44, boxSizing: "border-box",
                border: "1px solid #e5e7eb", borderRadius: 12,
                padding: "0 14px", fontSize: 14, fontFamily: "inherit",
                outline: "none", background: "#f9fafb", color: "#111827",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c8102e")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Soyad</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(""); }}
              placeholder="Soyadınızı daxil edin"
              name="family-name"
              autoComplete="family-name"
              style={{
                width: "100%", height: 44, boxSizing: "border-box",
                border: "1px solid #e5e7eb", borderRadius: 12,
                padding: "0 14px", fontSize: 14, fontFamily: "inherit",
                outline: "none", background: "#f9fafb", color: "#111827",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c8102e")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          {user.phone && <InfoRow icon={Phone} label="Telefon" value={user.phone} />}
          {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}

          {error && <Alert type="error" message={error} />}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1, height: 42, borderRadius: 12, border: "1px solid #e5e7eb",
                background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
              }}
            >
              <X size={14} /> Ləğv et
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, height: 42, borderRadius: 12, border: "none",
                background: loading ? "#9ca3af" : "#c8102e",
                color: "#fff", fontSize: 13, fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
                boxShadow: loading ? "none" : "0 4px 12px rgba(200,16,46,0.2)",
              }}
            >
              {loading
                ? <span style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                : <><CheckCircle size={14} /> Yadda saxla</>
              }
            </button>
          </div>
        </form>
      ) : (
        <>
          <InfoRow icon={User} label="Ad" value={user.name} />
          <InfoRow icon={User} label="Soyad" value={user.lastName} />
          {user.phone && <InfoRow icon={Phone} label="Telefon" value={user.phone} />}
          {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
          {success && (
            <div style={{ padding: "10px 18px" }}>
              <Alert type="success" message={success} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* ── Password card ──────────────────────────────── */
function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!current)                     { setError("Cari şifrənizi daxil edin."); return; }
    if (!next || next.length < 6)     { setError("Yeni şifrə ən az 6 simvol olmalıdır."); return; }
    if (next !== confirm)             { setError("Şifrələr uyğun gəlmir."); return; }
    if (current === next)             { setError("Yeni şifrə cari şifrə ilə eyni ola bilməz."); return; }
    setLoading(true);
    try {
      await api.put("/auth/profile", { currentPassword: current, password: next });
      setSuccess("Şifrə uğurla yeniləndi!");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Şifrə dəyişdirilə bilmədi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={Lock} title="Şifrəni dəyiş" subtitle="Güclü şifrə istifadə edin" />
      <form onSubmit={handleSubmit} autoComplete="off" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Cari şifrə *</label>
          <PasswordInput
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setError(""); }}
            placeholder="Cari şifrənizi daxil edin"
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            name="current-password"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Yeni şifrə *</label>
          <PasswordInput
            value={next}
            onChange={(e) => { setNext(e.target.value); setError(""); }}
            placeholder="Ən az 6 simvol"
            show={showNext}
            onToggle={() => setShowNext((v) => !v)}
            name="new-password"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Şifrəni təsdiqlə *</label>
          <PasswordInput
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            placeholder="Yeni şifrənizi təkrarlayın"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            name="confirm-password"
            autoComplete="new-password"
          />
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", height: 44, borderRadius: 12, border: "none",
            background: loading ? "#9ca3af" : "#c8102e",
            color: "#fff", fontSize: 14, fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit",
            boxShadow: loading ? "none" : "0 4px 14px rgba(200,16,46,0.2)",
            marginTop: 4,
          }}
        >
          {loading ? (
            <><span style={{ width: 15, height: 15, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Yadda saxlanır...</>
          ) : (
            <><Lock size={15} /> Şifrəni yenilə</>
          )}
        </button>
      </form>
    </Card>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const { user, isGuest, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (isGuest) router.replace("/auth/login");
  }, [isGuest, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user || isGuest) return null;

  const initials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || user?.name?.[0]?.toUpperCase() || "";
  const fullName = [user.name, user.lastName].filter(Boolean).join(" ");

  const tabs = [
    { key: "account",  label: "Hesab",    Icon: User },
    { key: "password", label: "Şifrə",    Icon: Lock },
  ];

  return (
    <>
      {/* ── Sticky header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "#f5f5f7", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#374151", flexShrink: 0,
            }}
          >
            <ArrowLeft size={17} strokeWidth={2.5} />
          </button>

          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827" }}>
              MEAT<span style={{ color: "#c8102e" }}>BOX</span><span style={{ color: "#9ca3af", fontSize: 13 }}>.AZ</span>
            </span>
          </Link>

          <div style={{ width: 34 }} />
        </div>
      </header>

      <main style={{ background: "#f8fafc", minHeight: "calc(100vh - 56px)", fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>

          {/* ── Profile hero ── */}
          <div style={{
            background: "linear-gradient(135deg, #c8102e 0%, #9b0a22 100%)",
            borderRadius: 20,
            padding: "24px 20px",
            marginBottom: 24,
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 8px 28px rgba(200,16,46,0.22)",
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "#fff",
              letterSpacing: "2px", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fullName}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>
                {user.phone || user.email}
              </div>
            </div>
          </div>

          {/* ── Desktop: 2-column ── */}
          <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AccountCard user={user} updateUser={updateUser} />
              <LogoutBtn onLogout={handleLogout} />
            </div>
            <PasswordCard />
          </div>

          {/* ── Mobile: tabs ── */}
          <div className="md:hidden">
            {/* Tab switcher */}
            <div style={{
              display: "flex", gap: 4,
              background: "#fff", borderRadius: 14,
              padding: 4, marginBottom: 16,
              border: "1px solid #f1f5f9",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              {tabs.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 0", borderRadius: 10, border: "none",
                    background: activeTab === key ? "#c8102e" : "transparent",
                    color: activeTab === key ? "#fff" : "#6b7280",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "account" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <AccountCard user={user} updateUser={updateUser} />
                <LogoutBtn onLogout={handleLogout} />
              </div>
            )}
            {activeTab === "password" && <PasswordCard />}
          </div>

        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .hidden.md\\:grid { display: grid !important; }
          .md\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}

function LogoutBtn({ onLogout }) {
  return (
    <button
      onClick={onLogout}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "14px 18px", background: "#fff",
        borderRadius: 16, border: "1px solid #fee2e2",
        cursor: "pointer", textAlign: "left",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.borderColor = "#fca5a5"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fee2e2"; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <LogOut size={16} color="#c8102e" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#c8102e" }}>Çıxış et</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Hesabdan çıx</div>
      </div>
    </button>
  );
}
