"use client";
import { useEffect, useState } from "react";

export default function VersionChecker() {
  const [newVersion, setNewVersion] = useState(false);

  useEffect(() => {
    // Next.js puts the current build ID in window.__NEXT_DATA__.buildId
    const buildId =
      typeof window !== "undefined" ? window.__NEXT_DATA__?.buildId : null;
    if (!buildId) return;

    const check = async () => {
      try {
        // If a new deploy happened, the old build manifest URL returns 404
        const res = await fetch(
          `/_next/static/${buildId}/_buildManifest.js`,
          { cache: "no-store" }
        );
        if (res.status === 404) setNewVersion(true);
      } catch {}
    };

    // First check after 60s (give the page time to settle), then every 3 min
    const t1 = setTimeout(check, 60_000);
    const t2 = setInterval(check, 3 * 60_000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, []);

  if (!newVersion) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,          // above mobile bottom nav
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#1b5e20",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 999,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span>🔄 Yeni versiya mövcuddur</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#fff",
          color: "#1b5e20",
          border: "none",
          borderRadius: 999,
          padding: "4px 14px",
          fontWeight: 700,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Yenilə
      </button>
    </div>
  );
}
