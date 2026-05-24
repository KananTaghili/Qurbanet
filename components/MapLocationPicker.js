"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, X, Check } from "lucide-react";

const DEFAULT = { lat: 40.4093, lng: 49.8671 };
const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
const ML_CSS = "https://unpkg.com/maplibre-gl@4.5.2/dist/maplibre-gl.css";
const ML_JS  = "https://unpkg.com/maplibre-gl@4.5.2/dist/maplibre-gl.js";

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=az`,
    );
    const data = await res.json();
    if (!data.address) return data.display_name?.split(",").slice(0, 3).join(",") || "";
    const a = data.address;
    const parts = [
      a.road || a.pedestrian,
      a.house_number,
      a.suburb || a.neighbourhood,
      a.city_district || a.district,
      a.city || a.town || a.village,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : data.display_name?.split(",").slice(0, 3).join(",") || "";
  } catch {
    return "";
  }
}

let mlLoaded = false;
let mlCallbacks = [];

function loadMapLibre(cb) {
  if (mlLoaded && window.maplibregl) { cb(); return; }
  mlCallbacks.push(cb);
  if (mlCallbacks.length > 1) return;

  if (!document.querySelector("[data-ml-css]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = ML_CSS;
    link.setAttribute("data-ml-css", "1");
    document.head.appendChild(link);
  }

  const script = document.createElement("script");
  script.src = ML_JS;
  script.setAttribute("data-ml-js", "1");
  script.onload = () => {
    mlLoaded = true;
    mlCallbacks.forEach((fn) => fn());
    mlCallbacks = [];
  };
  document.head.appendChild(script);
}

function makeMarkerEl() {
  const el = document.createElement("div");
  el.style.cssText =
    "width:32px;height:32px;background:#1B5E20;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)";
  return el;
}

export default function MapLocationPicker({ onClose, onConfirm, initialLocation }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  const initLat = initialLocation?.coordinates ? Number(initialLocation.coordinates.lat) : null;
  const initLng = initialLocation?.coordinates ? Number(initialLocation.coordinates.lng) : null;

  const [coords, setCoords]     = useState(initLat && initLng ? { lat: initLat, lng: initLng } : null);
  const [address, setAddress]   = useState(initialLocation?.address || "");
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const placeMarker = async (lat, lng) => {
    setCoords({ lat, lng });
    setGeocoding(true);

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else if (mapRef.current) {
      const m = new window.maplibregl.Marker({ element: makeMarkerEl(), draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      markerRef.current = m;
      m.on("dragend", async () => {
        const p = m.getLngLat();
        setCoords({ lat: p.lat, lng: p.lng });
        setGeocoding(true);
        const a = await reverseGeocode(p.lat, p.lng);
        setAddress(a);
        setGeocoding(false);
      });
    }

    const a = await reverseGeocode(lat, lng);
    setAddress(a);
    setGeocoding(false);
  };

  useEffect(() => {
    loadMapLibre(() => {
      if (!containerRef.current) return;

      const centerLat = initLat || DEFAULT.lat;
      const centerLng = initLng || DEFAULT.lng;

      const map = new window.maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [centerLng, centerLat],
        zoom: 14,
        attributionControl: false,
        trackResize: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        if (initLat && initLng) {
          const m = new window.maplibregl.Marker({ element: makeMarkerEl(), draggable: true })
            .setLngLat([centerLng, centerLat])
            .addTo(map);
          markerRef.current = m;
          m.on("dragend", async () => {
            const p = m.getLngLat();
            setCoords({ lat: p.lat, lng: p.lng });
            setGeocoding(true);
            const a = await reverseGeocode(p.lat, p.lng);
            setAddress(a);
            setGeocoding(false);
          });
        }
        map.on("click", (e) => placeMarker(e.lngLat.lat, e.lngLat.lng));
        map.resize();
        setMapReady(true);
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, []);

  const handleUseCurrent = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 16 });
        placeMarker(lat, lng);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleConfirm = () => {
    if (!coords) return;
    onConfirm({
      address: address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      coordinates: { lat: coords.lat, lng: coords.lng },
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #EAECF0", background: "#fff", flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #EAECF0", background: "#F8F9FB", cursor: "pointer", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={18} />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={16} color="#1B5E20" />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Çatdırılma ünvanı</span>
        </div>
        <button onClick={handleConfirm} disabled={!coords}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 10, border: "none",
            cursor: coords ? "pointer" : "not-allowed",
            background: coords ? "#1B5E20" : "#CBD5E1",
            color: "#fff", fontWeight: 700, fontSize: 14,
          }}>
          <Check size={15} strokeWidth={3} />
          Təsdiqlə
        </button>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", zIndex: 10, color: "#94A3B8", fontSize: 14 }}>
            Xəritə yüklənir...
          </div>
        )}
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {mapReady && (
          <button onClick={handleUseCurrent} disabled={geoLoading}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 1000,
              display: "flex", alignItems: "center", gap: 6,
              background: "#fff", border: "1px solid #EAECF0", borderRadius: 10,
              padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#1B5E20",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: geoLoading ? "default" : "pointer",
              opacity: geoLoading ? 0.6 : 1,
            }}>
            <Navigation size={14} />
            Hazırkı konum
          </button>
        )}

        {mapReady && !coords && (
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(255,255,255,0.92)", border: "1px solid #EAECF0", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#6B7280", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", pointerEvents: "none", whiteSpace: "nowrap" }}>
            Xəritəyə toxunun
          </div>
        )}
      </div>

      {/* Address bar */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #EAECF0", background: "#F8FAFC", flexShrink: 0, height: 60, overflow: "hidden" }}>
        {geocoding ? (
          <span style={{ fontSize: 13, color: "#94A3B8" }}>Ünvan axtarılır...</span>
        ) : coords ? (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.4 }}>{address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}</p>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: "#94A3B8" }}>Məkanı seçmək üçün xəritəyə klikləyin</span>
        )}
      </div>
    </div>
  );
}
