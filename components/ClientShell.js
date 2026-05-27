"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { isLoading: authLoading } = useAuth();
  const { isReady: settingsReady } = useLanguage();

  const appReady = !authLoading && settingsReady;

  return (
    <>
      {/* Splash — fades out once auth + settings are both resolved */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#1b5e20",
          opacity: appReady ? 0 : 1,
          pointerEvents: appReady ? "none" : "auto",
          transition: appReady ? "opacity 0.35s ease" : "none",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            overflow: "hidden",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Image
            src="/logo.png"
            alt="QurbanEt"
            width={80}
            height={80}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            priority
          />
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#fff",
            fontStyle: "italic",
            letterSpacing: "-0.5px",
          }}
        >
          Qurban<span style={{ color: "#86efac" }}>Et</span>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#fff",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>

      {/* App — rendered immediately (for API calls etc.) but visually hidden until ready */}
      <div
        className={`app-root${isHome ? " home-mode" : ""}`}
        style={{
          opacity: appReady ? 1 : 0,
          transition: appReady ? "opacity 0.35s ease" : "none",
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
