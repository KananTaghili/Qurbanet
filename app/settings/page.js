"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock, User, Eye, EyeOff, Phone, Mail,
  CheckCircle, AlertCircle, LogOut, Pencil, X, ArrowLeft, Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const RED = "#f20b32";
const RED_BG = "#fff1f3";

/* ─── tiny helpers ─────────────────────────────────── */
function Spinner() {
  return <span style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />;
}

function Alert({ ok, msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: ok ? "#f0fdf4" : "#fff1f3", border: `1px solid ${ok ? "#bbf7d0" : "#ffd0d8"}`, color: ok ? "#15803d" : "#b91c1c" }}>
      {ok ? <CheckCircle size={13} style={{ flexShrink: 0 }} /> : <AlertCircle size={13} style={{ flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, name, autoComplete, autoFocus }) {
  return (
    <input
      type="text" value={value} onChange={onChange} placeholder={placeholder}
      name={name} autoComplete={autoComplete} autoFocus={autoFocus}
      style={{ width: "100%", height: 42, boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 13px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#111827", transition: "border-color .15s" }}
      onFocus={e => e.target.style.borderColor = RED}
      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
    />
  );
}

function PasswordInput({ value, onChange, placeholder, name, autoComplete, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"} value={value} onChange={onChange}
        placeholder={placeholder} name={name} autoComplete={autoComplete} autoFocus={autoFocus}
        style={{ width: "100%", height: 42, boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 42px 0 13px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#111827", transition: "border-color .15s" }}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
      />
      <button type="button" onClick={() => setShow(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 18px", borderBottom: "1px solid #f5f5f7" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: RED_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color={RED} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

/* ─── Card shell ────────────────────────────────────── */
function CardShell({ children, fullHeight }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", ...(fullHeight ? { display: "flex", flexDirection: "column", height: "100%" } : {}) }}>
      {children}
    </div>
  );
}

function CardHead({ icon: Icon, title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: RED_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={RED} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─── Account card ──────────────────────────────────── */
const LETTERS_RE = /^[a-zA-ZüöğışçəÜÖĞIŞÇƏ\s'-]+$/;

function AccountCard({ user, updateUser, fullHeight }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = name.trim() !== (user.name || "").trim() || lastName.trim() !== (user.lastName || "").trim();

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!hasChanges) return;
    if (name.trim().length < 2) { setError("Ad ən az 2 simvol olmalıdır."); return; }
    if (!LETTERS_RE.test(name.trim())) { setError("Ad yalnız hərflərdən ibarət olmalıdır."); return; }
    if (lastName.trim() && !LETTERS_RE.test(lastName.trim())) { setError("Soyad yalnız hərflərdən ibarət olmalıdır."); return; }
    setLoading(true);
    try {
      await api.put("/auth/profile", { name: name.trim(), lastName: lastName.trim() });
      updateUser({ name: name.trim(), lastName: lastName.trim() });
      setSuccess("Məlumatlar yeniləndi!"); setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Xəta baş verdi."); }
    finally { setLoading(false); }
  };

  const cancel = () => { setName(user.name || ""); setLastName(user.lastName || ""); setError(""); setEditing(false); };

  return (
    <CardShell fullHeight={fullHeight}>
      <CardHead icon={User} title="Hesab məlumatları" sub="Ad, soyad, əlaqə"
        action={!editing && (
          <button onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: RED, background: RED_BG, border: "none", borderRadius: 8, padding: "5px 11px", cursor: "pointer" }}>
            <Pencil size={11} /> Redaktə
          </button>
        )}
      />

      {editing ? (
        /* ── Edit form ── */
        <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 11, overflowY: "auto" }} className="no-sb">
          <Field label="AD *">
            <TextInput value={name} onChange={e => { const v = e.target.value; if (v === "" || LETTERS_RE.test(v)) { setName(v); setError(""); } }} placeholder="Adınızı daxil edin" name="given-name" autoComplete="given-name" autoFocus />
          </Field>
          <Field label="SOYAD">
            <TextInput value={lastName} onChange={e => { const v = e.target.value; if (v === "" || LETTERS_RE.test(v)) { setLastName(v); setError(""); } }} placeholder="Soyadınızı daxil edin" name="family-name" autoComplete="family-name" />
          </Field>
          {error && <Alert msg={error} />}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
              <X size={12} /> Ləğv et
            </button>
            <button onClick={save} disabled={loading || !hasChanges} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: (loading || !hasChanges) ? "#9ca3af" : RED, color: "#fff", fontSize: 12, fontWeight: 800, cursor: (loading || !hasChanges) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit", boxShadow: (loading || !hasChanges) ? "none" : "0 3px 10px rgba(242,11,50,.22)", opacity: !hasChanges && !loading ? 0.6 : 1 }}>
              {loading ? <Spinner /> : <><CheckCircle size={12} /> Yadda saxla</>}
            </button>
          </div>
          {/* Contact info at bottom — same style as InfoRow */}
          <div style={{ borderTop: "1px solid #f3f4f6", margin: "0 -18px -16px" }}>
            {user.phone && <InfoRow icon={Phone} label="Telefon" value={user.phone} />}
            {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
          </div>
        </div>
      ) : (
        /* ── Display mode ── */
        <>
          <InfoRow icon={User} label="Ad" value={user.name} />
          <InfoRow icon={User} label="Soyad" value={user.lastName} />
          {user.phone && <InfoRow icon={Phone} label="Telefon" value={user.phone} />}
          {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
          {success && <div style={{ padding: "10px 18px" }}><Alert ok msg={success} /></div>}
        </>
      )}
    </CardShell>
  );
}

/* ─── Password card ─────────────────────────────────── */
function PasswordCard({ fullHeight }) {
  const [vals, setVals]   = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const set = key => e => { setVals(v => ({ ...v, [key]: e.target.value })); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!vals.current)              { setError("Cari şifrənizi daxil edin."); return; }
    if (vals.next.length < 6)       { setError("Yeni şifrə ən az 6 simvol olmalıdır."); return; }
    if (vals.next !== vals.confirm)  { setError("Şifrələr uyğun gəlmir."); return; }
    if (vals.current === vals.next)  { setError("Yeni şifrə cari ilə eyni ola bilməz."); return; }
    setLoading(true);
    try {
      await api.put("/auth/profile", { currentPassword: vals.current, password: vals.next });
      setSuccess("Şifrə uğurla yeniləndi!");
      setVals({ current: "", next: "", confirm: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Şifrə dəyişdirilə bilmədi."); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: "current", label: "CARİ ŞİFRƏ *", ph: "Cari şifrənizi daxil edin", ac: "current-password", af: true },
    { key: "next",    label: "YENİ ŞİFRƏ *",  ph: "Ən az 6 simvol",            ac: "new-password" },
    { key: "confirm", label: "TƏSDİQLƏ *",     ph: "Yeni şifrəni təkrarlayın",  ac: "new-password" },
  ];

  return (
    <CardShell fullHeight={fullHeight}>
      <CardHead icon={Shield} title="Şifrəni dəyiş" sub="Güclü şifrə istifadə edin" />
      <form onSubmit={submit} autoComplete="off" style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 11 }}>
        {fields.map(({ key, label, ph, ac, af }) => (
          <Field key={key} label={label}>
            <PasswordInput value={vals[key]} onChange={set(key)} placeholder={ph} name={`${key}-pw`} autoComplete={ac} autoFocus={af} />
          </Field>
        ))}
        {error   && <Alert msg={error} />}
        {success && <Alert ok msg={success} />}
        <button type="submit" disabled={loading} style={{ marginTop: "auto", width: "100%", height: 42, borderRadius: 10, border: "none", background: loading ? "#9ca3af" : RED, color: "#fff", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 14px rgba(242,11,50,.25)" }}>
          {loading ? <><Spinner /> Yadda saxlanır...</> : <><Lock size={14} /> Şifrəni yenilə</>}
        </button>
      </form>
    </CardShell>
  );
}

/* ─── Logout ────────────────────────────────────────── */
function LogoutBtn({ onLogout }) {
  return (
    <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", background: "#fff", borderRadius: 16, border: "1px solid #fee2e2", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.05)", fontFamily: "inherit", flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.borderColor = "#fca5a5"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fee2e2"; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: RED_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <LogOut size={15} color={RED} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: RED }}>Çıxış et</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Hesabdan çıx</div>
      </div>
    </button>
  );
}

/* ─── Page ──────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const { user, isGuest, isLoading, logout, updateUser } = useAuth();
  const [tab, setTab] = useState("account");

  useEffect(() => {
    if (!isLoading && isGuest) router.replace("/auth/login");
  }, [isLoading, isGuest, router]);

  if (isLoading || !user || isGuest) return null;

  const logout_ = async () => { await logout(); router.push("/"); };
  const initials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName = [user.name, user.lastName].filter(Boolean).join(" ");

  return (
    <>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, height: 56, background: "rgba(255,255,255,.97)", backdropFilter: "blur(14px)", borderBottom: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,.05)", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: 10, background: "#f5f5f7", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
            <ArrowLeft size={17} strokeWidth={2.5} />
          </button>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Image src="/meatbox logo right black.png" alt="MEATBOX" width={140} height={40} style={{ objectFit: "contain", height: 32, width: "auto" }} />
          </Link>
          <div style={{ width: 34 }} />
        </div>
      </header>

      {/* Main — fixed height, no page scroll */}
      <main style={{ height: "calc(100vh - 56px)", overflow: "hidden", background: "#f6f7f9", fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 16px 16px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Profile hero */}
          <div style={{ flexShrink: 0, background: `linear-gradient(135deg, ${RED} 0%, #a8001a 100%)`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 6px 22px rgba(242,11,50,.24)" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "2px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "2px", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{user.phone || user.email}</div>
            </div>
          </div>

          {/* ── DESKTOP layout (md+) ── */}
          <div className="s-desktop" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0, alignItems: "stretch" }}>
            {/* Left col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <AccountCard user={user} updateUser={updateUser} fullHeight />
              </div>
              <LogoutBtn onLogout={logout_} />
            </div>
            {/* Right col */}
            <div style={{ height: "100%" }}>
              <PasswordCard fullHeight />
            </div>
          </div>

          {/* ── MOBILE layout ── */}
          <div className="s-mobile" style={{ flex: 1, minHeight: 0, flexDirection: "column", gap: 12 }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, border: "1px solid #ebebeb", flexShrink: 0 }}>
              {[["account", "Hesab", User], ["password", "Şifrə", Shield]].map(([key, label, Icon]) => (
                <button key={key} onClick={() => setTab(key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: tab === key ? RED : "transparent", color: tab === key ? "#fff" : "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: tab === key ? "0 2px 8px rgba(242,11,50,.2)" : "none" }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {tab === "account" ? (
                <>
                  <div style={{ flex: 1, minHeight: 0 }}><AccountCard user={user} updateUser={updateUser} fullHeight /></div>
                  <LogoutBtn onLogout={logout_} />
                </>
              ) : (
                <div style={{ flex: 1, minHeight: 0 }}><PasswordCard fullHeight /></div>
              )}
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-sb::-webkit-scrollbar { display: none; }
        .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
        .s-desktop { display: none !important; }
        .s-mobile  { display: flex !important; }
        @media (min-width: 768px) {
          .s-desktop { display: grid !important; }
          .s-mobile  { display: none !important; }
        }
      `}</style>
    </>
  );
}
