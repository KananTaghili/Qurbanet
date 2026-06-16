import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QurbanEt — Etibarli · Halal · Sürətli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(160deg, #1B5E20 0%, #2E7D32 55%, #388E3C 100%)",
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
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Logo text */}
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: "white",
              fontStyle: "italic",
              letterSpacing: -3,
              lineHeight: 1,
              display: "flex",
            }}
          >
            <span style={{ color: "white" }}>Qurban</span>
            <span style={{ color: "#86efac" }}>Et</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 30,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 600,
              marginTop: 20,
              display: "flex",
            }}
          >
            İlahi qurbanınızı etibarla kəsdirin
          </div>

          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 44,
            }}
          >
            {["ETİBARLI", "HALAL", "SÜRƏTLİ"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "2px solid rgba(255,255,255,0.22)",
                  borderRadius: 20,
                  padding: "12px 32px",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: 3,
                  display: "flex",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Domain */}
          <div
            style={{
              marginTop: 40,
              fontSize: 22,
              color: "rgba(255,255,255,0.4)",
              fontWeight: 600,
              letterSpacing: 1,
              display: "flex",
            }}
          >
            qurbanet.az
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
