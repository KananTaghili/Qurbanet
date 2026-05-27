"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Settings, Phone, Mail, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  "/": "Əsas Səhifə",
  "/my-orders": "Sifarişlərim",
  "/need-support": "Xeyriyyə",
  "/how-it-works": "Necə İşləyirik?",
  "/qurban-rules": "Qurbanın Əhkamları",
  "/settings": "Parametrlər",
  "/auth/login": "Giriş",
  "/auth/register": "Qeydiyyat",
  "/auth/otp": "Doğrulama",
  "/auth/name": "Ad daxil edin",
  "/auth/forgot-password": "Şifrəni Sıfırla",
  "/order/quantity": "Miqdar seçin",
  "/order/distribution": "Çatdırılma seçin",
  "/order/contact": "Əlaqə məlumatları",
  "/order/summary": "Sifariş xülasəsi",
  "/order/payment": "Ödəniş",
  "/order/confirmation": "Sifariş Tamamlandı ✓",
  "/order/cash-payment": "Nağd Ödəniş",
  "/charity/payment": "Xeyriyyə Ödənişi",
  "/charity/confirmation": "Xeyriyyə Tamamlandı ✓",
};

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/my-orders/")) return "Sifariş Detalı";
  if (pathname.startsWith("/need-support/")) return "Xeyriyyə";
  if (pathname.startsWith("/charity-order/")) return "Xeyriyyə Sifarişi";
  return "QurbanEt";
}

const BACK_ROUTES = {
  "/settings": "/",
  "/order/quantity": "/",
  "/order/distribution": "/order/quantity",
  "/order/contact": "/order/distribution",
  "/order/summary": "/order/contact",
  "/order/payment": "/order/summary",
  "/need-support": "/",
  "/how-it-works": "/",
  "/qurban-rules": "/",
  "/my-orders": "/",
  "/charity/payment": "/need-support",
  "/auth/login": "/",
  "/auth/otp": "/auth/login",
  "/auth/name": "/",
  "/auth/forgot-password": "/",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const backEntry = Object.entries(BACK_ROUTES).find(
    ([k]) => pathname === k || pathname.startsWith(k + "/"),
  );
  const backTo = backEntry?.[1];
  const showBack = !!backTo && pathname !== "/";

  const handleLogout = async () => {
    setMenuOpen(false);
    if (confirm("Hesabdan çıxmaq istədiyinizə əminsiniz?")) {
      await logout();
      router.push("/");
    }
  };

  return (
    <header className="topbar-component">
      {/* Left: back + title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showBack && (
          <button
            onClick={() => router.push(backTo)}
            className="w-[34px] h-[34px] rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 transition-colors"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
          >
            ‹
          </button>
        )}
        <h1 className="text-base font-extrabold tracking-tight text-white truncate">
          {getTitle(pathname)}
        </h1>
      </div>

      {/* Right: contact info (desktop) + user area */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Contact info — desktop only */}
        <div className="hidden md:flex items-center gap-5 mr-1">
          <a
            href="tel:+994103990222"
            className="flex items-center gap-1.5 no-underline group"
          >
            <Phone size={12} style={{ color: "#86efac", flexShrink: 0 }} />
            <span
              className="text-[11px] font-medium transition-colors group-hover:text-white"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              +994 10 399 0222
            </span>
          </a>
          <a
            href="mailto:info@qurbanet.az"
            className="flex items-center gap-1.5 no-underline group"
          >
            <Mail size={12} style={{ color: "#86efac", flexShrink: 0 }} />
            <span
              className="text-[11px] font-medium transition-colors group-hover:text-white"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              info@qurbanet.az
            </span>
          </a>
        </div>

        {/* Auth area */}
        {isGuest ? (
          <button
            onClick={() => router.push("/auth/login")}
            className="rounded-xl px-3.5 py-1.5 text-sm font-bold transition-colors text-white"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            Daxil ol
          </button>
        ) : (
          <div ref={menuRef} className="relative">
            {/* Clickable user pill */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 min-w-0 cursor-pointer rounded-xl px-1.5 py-1 transition-colors hover:bg-white/10"
            >
              {/* Settings icon visible on desktop only */}
              <Settings
                size={18}
                color="white"
                strokeWidth={2}
                className="hidden md:block flex-shrink-0"
              />
              <div
                className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm font-semibold text-white/80 truncate max-w-[90px]">
                {user?.name || ""}
              </span>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50"
                style={{
                  background: "#fff",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  border: "1px solid rgba(0,0,0,0.07)",
                  minWidth: 210,
                }}
              >
                {/* User info header */}
                <div
                  className="px-4 py-3 flex items-center gap-2.5"
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                    style={{ background: "#1b5e20" }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">
                      {[user?.name, user?.lastName].filter(Boolean).join(" ")}
                    </div>
                    {user?.phone && (
                      <div className="text-xs text-slate-400 truncate">{user.phone}</div>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <button
                  onClick={() => { setMenuOpen(false); router.push("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer border-none bg-transparent"
                  style={{ hover: { background: "#f8fafc" } }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#e8f5e9" }}
                  >
                    <Settings size={15} style={{ color: "#1b5e20" }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">Parametrlər</span>
                </button>

                <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />

                {/* Phone */}
                <a
                  href="tel:+994103990222"
                  className="flex items-center gap-3 px-4 py-3 no-underline transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#e8f5e9" }}
                  >
                    <Phone size={15} style={{ color: "#1b5e20" }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">+994 10 399 0222</span>
                </a>

                {/* Email */}
                <a
                  href="mailto:info@qurbanet.az"
                  className="flex items-center gap-3 px-4 py-3 no-underline transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#e8f5e9" }}
                  >
                    <Mail size={15} style={{ color: "#1b5e20" }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">info@qurbanet.az</span>
                </a>

                <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer border-none bg-transparent"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fee2e2" }}
                  >
                    <LogOut size={15} style={{ color: "#ef4444" }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                    Çıxış et
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
