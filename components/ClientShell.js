"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/charity") || pathname.startsWith("/settings") || pathname.startsWith("/haqqimizda") || pathname.startsWith("/xidmetler") || pathname.startsWith("/nece-isleyir") || pathname.startsWith("/elaqe");
  const isHome = pathname === "/qurban";
  const { isLoading: authLoading } = useAuth();
  const { isReady: settingsReady } = useLanguage();

  const appReady = !authLoading && settingsReady;

  return (
    <>
      {/* Splash */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "linear-gradient(160deg, #1a0303 0%, #2d0a0a 50%, #1a0303 100%)",
          opacity: appReady ? 0 : 1,
          visibility: appReady ? "hidden" : "visible",
          pointerEvents: appReady ? "none" : "auto",
          WebkitTransition: appReady ? "opacity 0.4s ease, visibility 0.4s ease" : "none",
          transition: appReady ? "opacity 0.4s ease, visibility 0.4s ease" : "none",
        }}
      >
        {/* Logo */}
        <div style={{
          WebkitAnimation: "mbPulse 1.8s ease-in-out infinite",
          animation: "mbPulse 1.8s ease-in-out infinite",
        }}>
          <div style={{
            width: 110,
            height: 110,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 0 40px rgba(220,20,20,0.5), 0 8px 32px rgba(0,0,0,0.4)",
            border: "2px solid rgba(220,20,20,0.4)",
          }}>
            <Image
              src="/mb_logo_bottom.png"
              alt="MeatBox"
              width={110}
              height={110}
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#1a0303" }}
              priority
            />
          </div>
        </div>

        {/* Brand name */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 34,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            MEAT<span style={{ color: "#dc2626" }}>BOX</span>
          </div>
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 700,
            fontStyle: "italic",
            marginTop: 8,
            letterSpacing: "0.18em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            ETİBARLI &nbsp;·&nbsp; HALAL &nbsp;·&nbsp; SÜRƏTLİ
          </div>
        </div>

        {/* Spinner */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#dc2626",
          WebkitAnimation: "spin 0.8s linear infinite",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>

      {/* App */}
      {isLanding ? (
        <div
          style={{
            opacity: appReady ? 1 : 0,
            WebkitTransition: appReady ? "opacity 0.4s ease" : "none",
            transition: appReady ? "opacity 0.4s ease" : "none",
          }}
        >
          {children}
        </div>
      ) : (
        <div
          className={`app-root${isHome ? " home-mode" : ""}`}
          style={{
            opacity: appReady ? 1 : 0,
            WebkitTransition: appReady ? "opacity 0.4s ease" : "none",
            transition: appReady ? "opacity 0.4s ease" : "none",
          }}
        >
          <Sidebar />
          <div className="app-body">
            {!isHome && <Topbar />}
            <main className="app-main">
              {children}
            </main>
          </div>
        </div>
      )}

      <style>{`
        @-webkit-keyframes spin { to { -webkit-transform: rotate(360deg); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @-webkit-keyframes mbPulse { 0%,100% { -webkit-transform: scale(1); opacity:1; } 50% { -webkit-transform: scale(1.06); opacity:0.9; } }
        @keyframes mbPulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.06); opacity:0.9; } }
      `}</style>
    </>
  );
}
