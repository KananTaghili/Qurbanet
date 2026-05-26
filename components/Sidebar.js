"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { t } from "../lib/i18n";
import api from "../lib/api";
import {
  Home,
  ClipboardList,
  HandHeart,
  HelpCircle,
  BookOpen,
  LogIn,
  LogOut,
  UserPlus,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const [charityEnabled, setCharityEnabled] = useState(true);

  useEffect(() => {
    api.get("/app-config/settings")
      .then(res => { setCharityEnabled(res.data?.data?.charityPageEnabled !== false); })
      .catch(() => {});
  }, []);

  const NAV = [
    { href: "/", Icon: Home, label: t(lang, 'home') },
    { href: "/my-orders", Icon: ClipboardList, label: t(lang, 'myOrders') },
    { href: "/need-support", Icon: HandHeart, label: t(lang, 'charity') },
    { href: "/how-it-works", Icon: HelpCircle, label: t(lang, 'howItWorks') },
    { href: "/qurban-rules", Icon: BookOpen, label: t(lang, 'rules') },
  ];

  const handleLogout = async () => {
    if (confirm("Hesabdan çıxmaq istədiyinizə əminsiniz?")) {
      await logout();
      router.push("/");
    }
  };

  return (
    <aside
      className="
        sidebar-component
        hidden md:flex flex-col
        w-[220px] lg:w-[250px] xl:w-[270px] 2xl:w-[290px]
        h-screen sticky top-0
        shrink-0
      "
    >
      {/* ── Logo ── */}
      <div className="px-3 lg:px-4 pt-4 lg:pt-5 pb-3 lg:pb-4 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 lg:gap-3 no-underline"
        >
          <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl overflow-hidden flex-shrink-0 border border-white/20">
            <Image
              src="/logo.png"
              alt="QurbanEt"
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="text-lg lg:text-xl font-black text-white italic leading-tight truncate">
              Qurban<span style={{ color: "#86efac" }}>Et</span>
            </div>
            <div
              className="text-[8px] lg:text-[9px] font-semibold tracking-widest mt-0.5 truncate"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              ETİBARLI · HALAL · SÜRƏTLİ
            </div>
          </div>
        </Link>

        {/* Language switcher */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer border-none"
              style={{
                background: lang === l.code ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: lang === l.code ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
              title={l.name}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-2 lg:py-3 overflow-y-auto">
        <div
          className="px-3 lg:px-4 pb-2 text-[9px] lg:text-[10px] font-bold tracking-widest"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          MENYU
        </div>
        {NAV.map(({ href, Icon, label }) => {
          const isCharity = href === "/need-support";
          const disabled = isCharity && !charityEnabled;
          const active = !disabled && (href === "/" ? pathname === "/" : pathname.startsWith(href));

          if (disabled) {
            return (
              <div
                key={href}
                className="sidebar-item text-sm lg:text-[15px] cursor-not-allowed opacity-40 pointer-events-none"
              >
                <span className="sidebar-item-icon">
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span className="flex-1 truncate">{label}</span>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item text-sm lg:text-[15px] ${
                active ? "active" : ""
              }`}
            >
              <span className="sidebar-item-icon">
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span className="flex-1 truncate">{label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User / Auth ── */}
      <div className="p-2 flex-shrink-0">
        {isGuest ? (
          <div className="flex flex-col gap-1.5">
            <Link
              href="/auth/register"
              className="sidebar-item"
              style={{ background: "rgba(134,239,172,0.18)", color: "#86efac" }}
            >
              <span
                className="sidebar-item-icon"
                style={{ background: "rgba(134,239,172,0.2)" }}
              >
                <UserPlus size={17} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: "#86efac" }}>
                  Qeydiyyat
                </div>
                <div className="text-[11px] lg:text-xs truncate" style={{ color: "rgba(134,239,172,0.65)" }}>
                  OTP ilə hesab aç
                </div>
              </div>
            </Link>
            <Link
              href="/auth/login"
              className="sidebar-item"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }}
            >
              <span
                className="sidebar-item-icon"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <LogIn size={17} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">Daxil ol</div>
                <div className="text-[11px] lg:text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Hesabınıza girin
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 lg:gap-2.5 px-2.5 lg:px-3 py-2">
              <div
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-white/30 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] lg:text-sm font-bold text-white truncate">
                  {user?.name}
                </div>
                <div
                  className="text-[11px] lg:text-xs truncate"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {user?.phone}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-sm"
              style={{ color: "rgba(255,150,150,0.85)" }}
            >
              <span className="sidebar-item-icon">
                <LogOut size={17} strokeWidth={2.5} />
              </span>
              Çıxış
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
