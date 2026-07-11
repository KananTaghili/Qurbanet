import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "MeatBox — Etibarlı · Halal · Sürətli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Static export (Capacitor) üçün build zamanı bir dəfə generasiya olunsun
export const dynamic = "force-static";

// Steak ikonunu build zamanı data URI kimi oxu
let iconSrc = null;
try {
  const data = readFileSync(join(process.cwd(), "public", "meatbox_icon.png"));
  iconSrc = `data:image/png;base64,${data.toString("base64")}`;
} catch (_) {}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d0d0d",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Qırmızı işıq (glow) */}
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 760,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(242,11,50,0.22) 0%, rgba(242,11,50,0) 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Steak ikonu */}
          {iconSrc && (
            <img
              src={iconSrc}
              width={168}
              height={168}
              style={{ borderRadius: 36, marginBottom: 28 }}
            />
          )}

          {/* MEATBOX wordmark */}
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#ffffff" }}>MEAT</span>
            <span style={{ color: "#f20b32" }}>BOX</span>
          </div>

          {/* Qırmızı ayırıcı */}
          <div
            style={{
              width: 84,
              height: 5,
              borderRadius: 99,
              background: "#f20b32",
              marginTop: 26,
              display: "flex",
            }}
          />

          {/* Slogan */}
          <div
            style={{
              marginTop: 26,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 8,
              color: "rgba(255,255,255,0.72)",
              display: "flex",
            }}
          >
            ETİBARLI · HALAL · SÜRƏTLİ
          </div>

          {/* Domen */}
          <div
            style={{
              marginTop: 46,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.42)",
              display: "flex",
            }}
          >
            meatbox.az
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
