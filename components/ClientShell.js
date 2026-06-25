"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/charity") || pathname.startsWith("/qurban") || pathname.startsWith("/order") || pathname.startsWith("/my-orders") || pathname.startsWith("/how-it-works") || pathname.startsWith("/qurban-rules") || pathname.startsWith("/settings") || pathname.startsWith("/haqqimizda") || pathname.startsWith("/xidmetler") || pathname.startsWith("/nece-isleyir") || pathname.startsWith("/elaqe");
  const isHome = false;
  const { isLoading: authLoading } = useAuth();
  const { isReady: settingsReady } = useLanguage();

  const appReady = !authLoading && settingsReady;
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (appReady) {
      const t = setTimeout(() => setShowSplash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [appReady]);

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
        background: "#0d0d0d",
        opacity: showSplash ? 1 : 0,
        visibility: showSplash ? "visible" : "hidden",
        pointerEvents: showSplash ? "auto" : "none",
        WebkitTransition: "opacity 0.6s ease, visibility 0.6s ease",
        transition: "opacity 0.6s ease, visibility 0.6s ease",
        overflow: "hidden",
      }}>

        {/* Glow behind logo */}
        <div style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)",
          WebkitAnimation: "mbGlow 2.4s ease-in-out infinite",
          animation: "mbGlow 2.4s ease-in-out infinite",
        }} />

        {/* Logo + text group */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          position: "relative",
          zIndex: 1,
        }}>

          {/* App icon */}
          <div style={{
            WebkitAnimation: "mbScaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
            animation: "mbScaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <Image
              src="/meatbox_icon.png"
              alt="MeatBox"
              width={180}
              height={180}
              style={{ objectFit: "contain", borderRadius: 36, display: "block" }}
              priority
            />
          </div>

          {/* MEATBOX wordmark */}
          <div style={{
            marginTop: 22,
            WebkitAnimation: "mbFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s both",
            animation: "mbFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s both",
          }}>
            <span style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1,
            }}>MEAT</span><span style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#dc2626",
              letterSpacing: 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1,
            }}>BOX</span>
          </div>

          {/* Divider */}
          <div style={{
            marginTop: 14,
            width: 40,
            height: 2,
            borderRadius: 99,
            background: "#dc2626",
            WebkitAnimation: "mbFadeUp 0.5s ease 0.5s both",
            animation: "mbFadeUp 0.5s ease 0.5s both",
          }} />

          {/* Slogan */}
          <p style={{
            margin: "12px 0 0",
            fontSize: 15,
            fontWeight: 600,
            fontStyle: "italic",
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            WebkitAnimation: "mbFadeUp 0.5s ease 0.65s both",
            animation: "mbFadeUp 0.5s ease 0.65s both",
          }}>
            ETİBARLI &nbsp;·&nbsp; HALAL &nbsp;·&nbsp; SÜRƏTLİ
          </p>
        </div>

        {/* Bottom loading dots */}
        <div style={{
          position: "absolute",
          bottom: 52,
          display: "flex",
          gap: 8,
          WebkitAnimation: "mbFadeUp 0.4s ease 0.8s both",
          animation: "mbFadeUp 0.4s ease 0.8s both",
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#dc2626",
              WebkitAnimation: `mbDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              animation: `mbDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* App */}
      {isLanding ? (
        <div
          style={{
            opacity: showSplash ? 0 : 1,
            WebkitTransition: "opacity 0.5s ease",
            transition: "opacity 0.5s ease",
          }}
        >
          {children}
        </div>
      ) : (
        <div
          className={`app-root${isHome ? " home-mode" : ""}`}
          style={{
            opacity: showSplash ? 0 : 1,
            WebkitTransition: "opacity 0.5s ease",
            transition: "opacity 0.5s ease",
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
        @keyframes mbScaleIn { from { opacity:0; transform:scale(0.6); } to { opacity:1; transform:scale(1); } }
        @-webkit-keyframes mbScaleIn { from { opacity:0; -webkit-transform:scale(0.6); } to { opacity:1; -webkit-transform:scale(1); } }
        @keyframes mbFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @-webkit-keyframes mbFadeUp { from { opacity:0; -webkit-transform:translateY(14px); } to { opacity:1; -webkit-transform:translateY(0); } }
        @keyframes mbGlow { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
        @-webkit-keyframes mbGlow { 0%,100% { opacity:0.6; -webkit-transform:scale(1); } 50% { opacity:1; -webkit-transform:scale(1.15); } }
        @keyframes mbDot { 0%,100% { opacity:0.25; transform:scale(0.75); } 50% { opacity:1; transform:scale(1); } }
        @-webkit-keyframes mbDot { 0%,100% { opacity:0.25; -webkit-transform:scale(0.75); } 50% { opacity:1; -webkit-transform:scale(1); } }
      `}</style>
    </>
  );
}
