"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { X, ChevronRight, Check, MapPin } from "lucide-react";

const MapLocationPicker = dynamic(() => import("../MapLocationPicker"), { ssr: false });

const COUNTRIES = [
  { code: "AZE", nameAz: "Azərbaycan", flag: "🇦🇿", enabled: true },
  { code: "TUR", nameAz: "Türkiyə", flag: "🇹🇷", enabled: false },
  { code: "RUS", nameAz: "Rusiya", flag: "🇷🇺", enabled: false },
  { code: "GEO", nameAz: "Gürcüstan", flag: "🇬🇪", enabled: false },
];

const CITIES = {
  AZE: [
    { key: "baku", nameAz: "Bakı", enabled: true },
    { key: "sumqayit", nameAz: "Sumqayıt", enabled: false },
    { key: "ganja", nameAz: "Gəncə", enabled: false },
  ],
};

export default function DeliveryLocationModal({ onClose, onConfirm, initialLocation }) {
  // 0: redaktə xülasəsi (ölkə/şəhər + xəritəni yenilə), 1: ölkə, 2: şəhər, 3: xəritə
  const [step, setStep] = useState(initialLocation ? 0 : 1);
  const [country, setCountry] = useState(
    COUNTRIES.find((c) => c.code === initialLocation?.countryCode) || COUNTRIES[0],
  );
  const [city, setCity] = useState(
    CITIES.AZE.find((c) => c.key === initialLocation?.cityKey) || CITIES.AZE[0],
  );

  if (step === 3) {
    return (
      <MapLocationPicker
        initialLocation={initialLocation}
        onClose={onClose}
        onConfirm={(loc) =>
          onConfirm({
            countryCode: country.code,
            countryNameAz: country.nameAz,
            cityKey: city.key,
            cityNameAz: city.nameAz,
            ...loc,
          })
        }
      />
    );
  }

  const content = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999, display: "flex",
        alignItems: "center", justifyContent: "center", background: "rgba(15,15,15,0.55)", padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #F0EDE8" }}>
          <MapPin size={17} color="#f97316" />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#292524", flex: 1 }}>Çatdırılma yerini seçin</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, border: "1px solid #F0EDE8", background: "#FAFAF9", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <X size={16} color="#78716c" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 0 && (
          <div style={{ display: "flex", gap: 6, padding: "12px 16px 0" }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: step >= s ? "#f97316" : "#F0EDE8" }} />
            ))}
          </div>
        )}

        {step === 0 && (
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#a8a29e", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>
              Cari çatdırılma ünvanı
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14,
                  border: "1.5px solid #F0EDE8", background: "#fff", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 20 }}>{country.flag}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: "#a8a29e", margin: 0 }}>Ölkə</p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#292524", margin: 0 }}>{country.nameAz}</p>
                </div>
                <ChevronRight size={16} color="#d6d3d1" />
              </button>

              <button
                onClick={() => setStep(2)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14,
                  border: "1.5px solid #F0EDE8", background: "#fff", cursor: "pointer",
                }}
              >
                <MapPin size={18} color="#f97316" />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: "#a8a29e", margin: 0 }}>Şəhər</p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#292524", margin: 0 }}>{city.nameAz}</p>
                </div>
                <ChevronRight size={16} color="#d6d3d1" />
              </button>
            </div>

            <button
              onClick={() => setStep(3)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 14px", borderRadius: 14, border: "none", background: "#f97316",
                color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}
            >
              <MapPin size={16} /> Xəritədə konumu yenilə
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ padding: 16 }}>
            {initialLocation && (
              <button
                onClick={() => setStep(0)}
                style={{ fontSize: 12, fontWeight: 700, color: "#a8a29e", background: "none", border: "none", cursor: "pointer", marginBottom: 8, padding: 0 }}
              >
                ← Geri
              </button>
            )}
            <p style={{ fontSize: 12, fontWeight: 700, color: "#a8a29e", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>
              1. Ölkəni seçin
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  disabled={!c.enabled}
                  onClick={() => {
                    setCountry(c);
                    setStep(2);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14,
                    border: `1.5px solid ${country.code === c.code ? "#f97316" : "#F0EDE8"}`,
                    background: country.code === c.code ? "#FFF7ED" : "#fff",
                    cursor: c.enabled ? "pointer" : "not-allowed", opacity: c.enabled ? 1 : 0.45,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{c.flag}</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "#292524", flex: 1, textAlign: "left" }}>{c.nameAz}</span>
                  {!c.enabled && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#a8a29e" }}>Tezliklə</span>}
                  {c.enabled && <ChevronRight size={16} color="#d6d3d1" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 16 }}>
            <button
              onClick={() => setStep(1)}
              style={{ fontSize: 12, fontWeight: 700, color: "#a8a29e", background: "none", border: "none", cursor: "pointer", marginBottom: 8, padding: 0 }}
            >
              ← Ölkəni dəyiş ({country.nameAz})
            </button>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#a8a29e", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>
              2. Şəhəri seçin
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CITIES[country.code]?.map((c) => (
                <button
                  key={c.key}
                  disabled={!c.enabled}
                  onClick={() => {
                    setCity(c);
                    setStep(3);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14,
                    border: `1.5px solid ${city.key === c.key ? "#f97316" : "#F0EDE8"}`,
                    background: city.key === c.key ? "#FFF7ED" : "#fff",
                    cursor: c.enabled ? "pointer" : "not-allowed", opacity: c.enabled ? 1 : 0.45,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "#292524", flex: 1, textAlign: "left" }}>{c.nameAz}</span>
                  {!c.enabled && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#a8a29e" }}>Tezliklə</span>}
                  {c.enabled && <ChevronRight size={16} color="#d6d3d1" />}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: "#a8a29e", marginTop: 12, lineHeight: 1.5 }}>
              Hazırda çatdırılma yalnız Bakı və Abşeron ərazisinə mümkündür. Şəhəri seçdikdən sonra xəritədən dəqiq
              konumu göstərəcəksiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
