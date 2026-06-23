"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock, User, Eye, EyeOff, Phone, Mail,
  CheckCircle, AlertCircle, LogOut, Pencil, X, ArrowLeft, Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const RED = "#f20b32";
const RED_LIGHT = "#fff1f3";
const RED_BORDER = "#ffd0d8";

/* ── Helpers ──────────────────────────────────────── */
function Alert({ type, msg }) {
  const ok = type === "success";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      background: ok ? "#f0fdf4" : "#fff1f3",
      border: `1px solid ${ok ? "#bbf7d0" : RED_BORDER}`,
      color: ok ? "#15803d" : "#b91c1c",
      fontSize: 13, fontWeight: 600,
      padding: "10px 14px", borderRadius: 10,
    }}>
      {ok ? <CheckCircle size={14} style={{ flexShrink: 0 }} /> : <AlertCircle size={14} style={{ flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function PwInput({ value, onChange, placeholder, show, onToggle, name, autoComplete, autoFocus }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value} onChange={onChange} placeholder={placeholder}
        name={name} autoComplete={autoComplete} autoFocus={autoFocus} maxLength={128}
        style={{
          width: "100%", height: 46, boxSizing: "border-box",
          border: "1.5px solid #e5e7eb", borderRadius: 12,
          padding: "0 46px 0 14px", fontSize: 14, fontFamily: "inherit",
          outline: "none", background: "#f9fafb", color: "#111827",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
      />
      <button type="button" onClick={onToggle} style={{
        position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
        display: "flex", alignItems: "center", padding: 0,
      }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/* ── Card shell ───────────────────────────────────── */
function Card({ children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: "1px solid #f0f0f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function CardHead({ icon: Icon, title, sub, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px",
      background: "#fafafa",
      borderBottom: "1px solid #f3f4f6",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: RED_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color={RED} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid #f9fafb" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: RED_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color={RED} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

/* ── Account card ────────────────────────────────── */
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

  const handleCancel = () => { setName(user.name || ""); setLastName(user.lastName || ""); setError(""); setEditing(false); };

  return (
    <Card>
      <CardHead
        icon={User} title="Hesab məlumatları" sub="Ad, soyad, əlaqə"
        action={!editing && (
          <button onClick={() => setEditing(true)} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 700, color: RED,
            background: RED_LIGHT, border: "none", borderRadius: 8,
            padding: "6px 12px", cursor: "pointer",
          }}>
            <Pencil size={12} /> Redaktə
          </button>
        )}
      />

      {editing ? (
        <form onSubmit={handleSave} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Ad *</label>
            <input
              type="text" value={name} onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="Adınızı daxil edin" autoFocus name="given-name" autoComplete="given-name"
              style={{ width: "100%", height: 46, boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "0 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#111827", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Soyad</label>
            <input
              type="text" value={lastName} onChange={e => { setLastName(e.target.value); setError(""); }}
              placeholder="Soyadınızı daxil edin" name="family-name" autoComplete="family-name"
              style={{ width: "100%", height: 46, boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "0 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#111827", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
          {user.phone && <InfoRow icon={Phone} label="Telefon" value={user.phone} />}
          {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
          {error && <Alert type="error" msg={error} />}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={handleCancel} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
              <X size={13} /> Ləğv et
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: loading ? "#9ca3af" : RED, color: "#fff", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", boxShadow: loading ? "none" : `0 4px 14px rgba(242,11,50,0.25)` }}>
              {loading
                ? <span style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                : <><CheckCircle size={13} /> Yadda saxla</>
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
          {success && <div style={{ padding: "10px 18px" }}><Alert type="success" msg={success} /></div>}
        </>
      )}
    </Card>
  );
}

/* ── Password card ───────────────────────────────── */
function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!current)                { setError("Cari şifrənizi daxil edin."); return; }
    if (!next || next.length < 6){ setError("Yeni şifrə ən az 6 simvol olmalıdır."); return; }
    if (next !== confirm)        { setError("Şifrələr uyğun gəlmir."); return; }
    if (current === next)        { setError("Yeni şifrə cari ilə eyni ola bilməz."); return; }
    setLoading(true);
    try {
      await api.put("/auth/profile", { currentPassword: current, password: next });
      setSuccess("Şifrə uğurla yeniləndi!");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Şifrə dəyişdirilə bilmədi.");
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHead icon={Shield} title="Şifrəni dəyiş" sub="Güclü şifrə istifadə edin" />
      <form onSubmit={handleSubmit} autoComplete="off" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Cari şifrə *", val: current, set: setCurrent, key: "current", ac: "current-password", af: true },
          { label: "Yeni şifrə *", val: next, set: setNext, key: "next", ac: "new-password" },
          { label: "Şifrəni təsdiqlə *", val: confirm, set: setConfirm, key: "confirm", ac: "new-password" },
        ].map(({ label, val, set, key, ac, af }) => (
          <div key={key}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{label}</label>
            <PwInput
              value={val} onChange={e => { set(e.target.value); setError(""); }}
              placeholder={key === "current" ? "Cari şifrənizi daxil edin" : key === "next" ? "Ən az 6 simvol" : "Yeni şifrəni təkrarlayın"}
              show={show[key]} onToggle={() => setShow(s => ({ ...s, [key]: !s[key] }))}
              name={`${key}-password`} autoComplete={ac} autoFocus={af}
            />
          </div>
        ))}
        {error && <Alert type="error" msg={error} />}
        {success && <Alert type="success" msg={success} />}
        <button type="submit" disabled={loading} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: loading ? "#9ca3af" : RED, color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", boxShadow: loading ? "none" : `0 4px 16px rgba(242,11,50,0.25)`, marginTop: 4 }}>
          {loading
            ? <><span style={{ width: 15, height: 15, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Yadda saxlanır...</>
            : <><Lock size={15} /> Şifrəni yenilə</>
          }
        </button>
      </form>
    </Card>
  );
}

/* ── Logout button ───────────────────────────────── */
function LogoutBtn({ onLogout }) {
  return (
    <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "#fff", borderRadius: 18, border: "1px solid #fee2e2", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", fontFamily: "inherit" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.borderColor = "#fca5a5"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fee2e2"; }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 11, background: RED_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <LogOut size={16} color={RED} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: RED }}>Çıxış et</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Hesabdan çıx</div>
      </div>
    </button>
  );
}

/* ── Main page ───────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const { user, isGuest, isLoading, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    // Wait for auth to finish loading before deciding to redirect
    if (!isLoading && isGuest) router.replace("/auth/login");
  }, [isLoading, isGuest, router]);

  // Show nothing while auth loads to avoid flash
  if (isLoading) return null;
  if (!user || isGuest) return null;

  const handleLogout = async () => { await logout(); router.push("/"); };

  const initials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || user?.name?.[0]?.toUpperCase() || "?";
  const fullName = [user.name, user.lastName].filter(Boolean).join(" ");

  const tabs = [
    { key: "account",  label: "Hesab",  Icon: User },
    { key: "password", label: "Şifrə",  Icon: Shield },
  ];

  return (
    <>
      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #f0f0f0",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f5f7", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", flexShrink: 0 }}>
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em", color: "#111827", lineHeight: 1 }}>
              MEAT<span style={{ color: RED }}>BOX</span><span style={{ color: "#9ca3af", fontSize: 16 }}>.AZ</span>
            </span>
          </Link>
          <div style={{ width: 36 }} />
        </div>
      </header>

      <main style={{ background: "#f6f7f9", minHeight: "calc(100vh - 58px)", fontFamily: "'Manrope', sans-serif", paddingBottom: 40 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

          {/* ── Profile hero ── */}
          <div style={{
            background: `linear-gradient(135deg, ${RED} 0%, #b5001f 100%)`,
            borderRadius: 20,
            padding: "20px 22px",
            marginBottom: 20,
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 8px 28px rgba(242,11,50,0.28)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "2px", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fullName}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>
                {user.phone || user.email}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 12px", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>HESAB</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>Aktiv</div>
            </div>
          </div>

          {/* ── Desktop: 2-col ── */}
          <div className="settings-desktop" style={{ gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <AccountCard user={user} updateUser={updateUser} />
              <LogoutBtn onLogout={handleLogout} />
            </div>
            <div>
              <PasswordCard />
            </div>
          </div>

          {/* ── Mobile: tabs ── */}
          <div className="settings-mobile">
            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 14, padding: 4, marginBottom: 14, border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {tabs.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "none", background: activeTab === key ? RED : "transparent", color: activeTab === key ? "#fff" : "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", boxShadow: activeTab === key ? "0 2px 8px rgba(242,11,50,0.2)" : "none" }}>
                  <Icon size={14} /> {label}
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
        .settings-desktop { display: none; }
        .settings-mobile  { display: block; }
        @media (min-width: 768px) {
          .settings-desktop { display: grid; grid-template-columns: 1fr 1fr; }
          .settings-mobile  { display: none; }
        }
      `}</style>
    </>
  );
}
