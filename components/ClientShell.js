"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function ClientShell({ children }) {
  const pathname = usePathname();

  // Native (Capacitor APK): nazik qırmızı scroll indikatoru.
  // Native scroll-a TOXUNMUR (smooth qalır) — sadəcə yan tərəfdə bar çəkir,
  // scroll edəndə görünür, dayananda solur (auto-hide).
  useEffect(() => {
    if (!Capacitor?.isNativePlatform?.()) return;
    document.documentElement.classList.add("cap-native");

    // Android geri düyməsi: app daxilində geri get; kök ekrandadırsa app-dan çıx
    let backHandle;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) {
          window.history.back();
        } else {
          App.exitApp();
        }
      }).then((h) => { backHandle = h; });
    }).catch(() => {});

    // Long-press menyusu / URL tooltip-i bloklala (native hiss)
    const onCtx = (e) => e.preventDefault();
    document.addEventListener("contextmenu", onCtx);

    const bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed;right:2px;top:0;width:4px;border-radius:999px;" +
      "background:#f20b32;z-index:99999;opacity:0;pointer-events:none;" +
      "transition:opacity .35s ease;will-change:transform,height;";
    document.body.appendChild(bar);

    let hideTimer;

    // Scroll konteynerinin class adına görə web-dəki thumb rəngi:
    // charity-scroll → bənövşəyi, qurban/order-scroll → yaşıl, hp-scroll → qırmızı.
    const COLORS = [
      ["charity-scroll", "#a78bfa"],
      ["qurban-scroll",  "#6abf69"],
      ["order-scroll",   "#6abf69"],
      ["hp-scroll",      "#f20b32"],
    ];
    const thumbColor = (el) => {
      let node = el;
      for (let i = 0; node && node.nodeType === 1 && i < 12; i++, node = node.parentElement) {
        const cn = typeof node.className === "string" ? node.className : "";
        for (const [k, c] of COLORS) if (cn.indexOf(k) !== -1) return c;
      }
      // fallback — route üzrə
      const p = window.location.pathname || "";
      if (p.startsWith("/charity")) return "#a78bfa";
      if (p.startsWith("/qurban") || p.startsWith("/order") || p.startsWith("/my-orders")) return "#6abf69";
      return "#f20b32";
    };

    // Scroll edən elementi tap (window və ya daxili konteyner) və ona uyğun bar çək
    const onScroll = (e) => {
      const t = e.target;
      let scrollTop, scrollHeight, clientHeight, areaTop, areaRight, areaH;

      if (t === document || t === document.documentElement || t === document.body) {
        const se = document.scrollingElement || document.documentElement;
        scrollTop = se.scrollTop; scrollHeight = se.scrollHeight;
        clientHeight = window.innerHeight;
        areaTop = 0; areaRight = window.innerWidth; areaH = window.innerHeight;
      } else if (t && t.scrollHeight != null) {
        scrollTop = t.scrollTop; scrollHeight = t.scrollHeight; clientHeight = t.clientHeight;
        const r = t.getBoundingClientRect();
        areaTop = r.top; areaRight = r.right; areaH = r.height;
      } else { return; }

      if (scrollHeight <= clientHeight + 4) { bar.style.opacity = "0"; return; }
      const thumb = Math.max(28, (clientHeight / scrollHeight) * areaH);
      const top = areaTop + (scrollTop / (scrollHeight - clientHeight)) * (areaH - thumb);
      // Rəng web-dəki scrollbar-color ilə eyni (scroll edən konteynerdən oxunur)
      const probe = (t === document || t === document.documentElement || t === document.body)
        ? (document.scrollingElement || document.body) : t;
      bar.style.background = thumbColor(probe);
      bar.style.height = thumb + "px";
      bar.style.right = Math.max(2, window.innerWidth - areaRight + 2) + "px";
      bar.style.transform = "translateY(" + top + "px)";
      bar.style.opacity = "1";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { bar.style.opacity = "0"; }, 700);
    };

    // capture: true — scroll hadisəsi bubble etmir, ona görə bütün elementlərdən tutaq
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("contextmenu", onCtx);
      clearTimeout(hideTimer);
      bar.remove();
      try { backHandle?.remove?.(); } catch (_) {}
    };
  }, []);

  // Native (APK): status bar = yuxarı toolbar rəngi, nav bar = aşağı menyu rəngi
  useEffect(() => {
    if (!Capacitor?.isNativePlatform?.()) return;
    const p = pathname || "/";

    // Status bar → toolbar rəngi
    let statusColor = "#ffffff", statusDark = true; // əsas/landing → ağ, tünd ikon
    if (p.startsWith("/charity")) { statusColor = "#301586"; statusDark = false; } // bənövşəyi
    else if (p.startsWith("/qurban") || p.startsWith("/order") || p.startsWith("/my-orders") || p.startsWith("/how-it-works") || p.startsWith("/qurban-rules")) { statusColor = "#1c5e20"; statusDark = false; } // yaşıl

    // Nav bar → aşağı menyu rəngi (bütün modullarda ağ menyu)
    const navColor = "#ffffff", navDark = true;

    // Native bridge (etibarlı). Bridge gec hazır ola / tema rəngi qaytara bilər —
    // ona görə bir neçə dəfə tətbiq edirik.
    const apply = () => {
      try { window.AndroidNav?.setBars?.(statusColor, statusDark, navColor, navDark); } catch (_) {}
    };
    apply();
    const t1 = setTimeout(apply, 120);
    const t2 = setTimeout(apply, 450);

    // Ehtiyat: status-bar plugin varsa o da çağırılsın
    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      StatusBar.setBackgroundColor({ color: statusColor }).catch(() => {});
      StatusBar.setStyle({ style: statusDark ? Style.Light : Style.Dark }).catch(() => {});
    }).catch(() => {});

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname]);

  const isLanding = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/charity") || pathname.startsWith("/qurban") || pathname.startsWith("/order") || pathname.startsWith("/my-orders") || pathname.startsWith("/how-it-works") || pathname.startsWith("/qurban-rules") || pathname.startsWith("/settings") || pathname.startsWith("/about") || pathname.startsWith("/services") || pathname.startsWith("/process") || pathname.startsWith("/contact");
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
