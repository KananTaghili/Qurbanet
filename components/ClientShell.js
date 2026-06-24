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
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#c0150f",
        opacity: appReady ? 0 : 1,
        visibility: appReady ? "hidden" : "visible",
        pointerEvents: appReady ? "none" : "auto",
        WebkitTransition: appReady ? "opacity 0.45s ease, visibility 0.45s ease" : "none",
        transition: appReady ? "opacity 0.45s ease, visibility 0.45s ease" : "none",
      }}>
        {/* Logo */}
        <div style={{
          WebkitAnimation: "mbFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
          animation: "mbFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}>
          <Image
            src="/mb_logo_bottom.png"
            alt="MeatBox"
            width={130}
            height={130}
            style={{ objectFit: "contain", filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.3))" }}
            priority
          />
          <p style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            fontStyle: "italic",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.75)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            ETİBARLI &nbsp;·&nbsp; HALAL &nbsp;·&nbsp; SÜRƏTLİ
          </p>
        </div>

        {/* Loading bar */}
        <div style={{
          position: "absolute",
          bottom: 48,
          width: 120,
          height: 3,
          borderRadius: 99,
          background: "rgba(255,255,255,0.2)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            borderRadius: 99,
            background: "#fff",
            WebkitAnimation: "mbBar 1.2s ease-in-out infinite",
            animation: "mbBar 1.2s ease-in-out infinite",
          }} />
        </div>
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
        @-webkit-keyframes mbFadeUp { from { opacity:0; -webkit-transform:translateY(18px); } to { opacity:1; -webkit-transform:translateY(0); } }
        @keyframes mbFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @-webkit-keyframes mbBar { 0% { width:0%; margin-left:0; } 60% { width:100%; margin-left:0; } 100% { width:0%; margin-left:100%; } }
        @keyframes mbBar { 0% { width:0%; margin-left:0; } 60% { width:100%; margin-left:0; } 100% { width:0%; margin-left:100%; } }
      `}</style>
    </>
  );
}
