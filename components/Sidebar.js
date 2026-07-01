"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../lib/i18n";
import api from "../lib/api";
import {
  List,
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
  const { lang } = useLanguage();
  const [charityEnabled, setCharityEnabled] = useState(false);

  useEffect(() => {
    api.get("/app-config/settings")
      .then(res => { setCharityEnabled(res.data?.data?.charityPageEnabled !== false); })
      .catch(() => {});
  }, []);

  const NAV = [
    { href: "/qurban", Icon: List, label: t(lang, 'animalSelection') },
    { href: "/my-orders", Icon: ClipboardList, label: t(lang, 'myOrders') },
    { href: "/how-it-works", Icon: HelpCircle, label: t(lang, 'howItWorks') },
    { href: "/qurban-rules", Icon: BookOpen, label: t(lang, 'rules') },
  ];

  const handleLogout = async () => {
    if (confirm("Hesabdan çıxmaq istədiyinizə əminsiniz?")) {
      await logout();
      router.push("/qurban");
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
      <div className="px-3 lg:px-4 pb-3 lg:pb-4 flex-shrink-0" style={{ paddingTop: 'calc(1rem + 5px)' }}>
        <Link href="/qurban" className="flex items-center justify-center no-underline">
          <Image
            src="/mb_logo_bottom_slogan.png"
            alt="MeatBox"
            width={200}
            height={120}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
            priority
          />
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-2 lg:py-3 overflow-y-auto">
        <div
          className="px-3 lg:px-4 pb-2 text-[9px] lg:text-[10px] font-bold tracking-widest"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          MENYU
        </div>
        {NAV.filter(({ href }) => href !== "/need-support" || charityEnabled).map(({ href, Icon, label }) => {
          const active = href === "/qurban" ? pathname === "/qurban" : pathname.startsWith(href);

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

      {/* ── Hadith ── */}
      <div className="px-3 lg:px-4 pb-3 flex-shrink-0">
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-3xl font-serif leading-none mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>"</div>
          <p className="text-[12px] lg:text-[13px] font-bold leading-snug italic mb-2.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Qurban ətindən yeyin, ehtiyacı olanlara paylayın və saxlayın.
          </p>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
          <p className="text-[10px] lg:text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Hədis · Buxari, Muslim
          </p>
        </div>
      </div>

      {/* ── User / Auth ── */}
      <div className="p-2 flex-shrink-0">
        {isGuest ? (
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/auth/register?from=${encodeURIComponent(pathname)}`}
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
              href={`/auth/login?from=${encodeURIComponent(pathname)}`}
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
                  {[user?.name, user?.lastName].filter(Boolean).join(" ")}
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
