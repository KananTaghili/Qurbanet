"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname.startsWith("/auth");
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          background: "linear-gradient(160deg, #166534 0%, #14532d 100%)",
          opacity: appReady ? 0 : 1,
          visibility: appReady ? "hidden" : "visible",
          pointerEvents: appReady ? "none" : "auto",
          WebkitTransition: appReady ? "opacity 0.4s ease, visibility 0.4s ease" : "none",
          transition: appReady ? "opacity 0.4s ease, visibility 0.4s ease" : "none",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            border: "2px solid rgba(255,255,255,0.25)",
          }}
        >
          <Image
            src="/logo_test.png"
            alt="QurbanEt"
            width={100}
            height={100}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            priority
          />
        </div>

        {/* Brand name */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#fff",
              fontStyle: "italic",
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}
          >
            Qurban<span style={{ color: "#86efac" }}>Et</span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
              marginTop: 6,
              letterSpacing: "0.5px",
            }}
          >
            ETİBARLI · HALAL · SÜRƏTLİ
          </div>
        </div>

        {/* Spinner */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.15)",
            borderTopColor: "#86efac",
            WebkitAnimation: "spin 0.8s linear infinite",
            animation: "spin 0.8s linear infinite",
          }}
        />
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
      `}</style>
    </>
  );
}
