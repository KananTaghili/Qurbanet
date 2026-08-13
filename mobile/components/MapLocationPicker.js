import { useState, useRef } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { X, Check, Navigation, MapPin } from "lucide-react-native";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const DEFAULT = { lat: 40.4093, lng: 49.8671 };
const BOUNDS = { minLat: 39.9, maxLat: 40.8, minLng: 49.3, maxLng: 50.7 };
const BRAND = "#1B5E20";

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=az`,
      { headers: { "User-Agent": "MeatBoxApp/1.0" } }
    );
    const data = await res.json();
    const a = data.address || {};
    const city = (a.city || a.town || a.village || "").toLowerCase();
    const county = (a.county || "").toLowerCase();
    const state = (a.state || "").toLowerCase();
    const country = (a.country_code || "").toLowerCase();

    const isBaku = country === "az" && (
      city.includes("bak") ||
      county.includes("abseron") || county.includes("abşeron") || county.includes("absheron") ||
      state.includes("bak") || state.includes("bakı")
    );

    const parts = [
      a.road || a.pedestrian,
      a.house_number,
      a.suburb || a.neighbourhood,
      a.city_district || a.district,
      a.city || a.town || a.village,
    ].filter(Boolean);
    const address = parts.length ? parts.join(", ") : data.display_name?.split(",").slice(0, 3).join(",") || "";

    return { address, isBaku };
  } catch {
    return { address: "", isBaku: null };
  }
}

export default function MapLocationPicker({ visible, onClose, onConfirm, initialLocation }) {
  const { lang } = useLanguage();
  const mapRef = useRef(null);
  const initLat = initialLocation?.coordinates?.lat ? Number(initialLocation.coordinates.lat) : null;
  const initLng = initialLocation?.coordinates?.lng ? Number(initialLocation.coordinates.lng) : null;

  const [coords, setCoords] = useState(initLat && initLng ? { lat: initLat, lng: initLng } : null);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [outsideBaku, setOutsideBaku] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const placeMarker = async (lat, lng) => {
    setCoords({ lat, lng });
    setGeocoding(true);
    const { address: a, isBaku } = await reverseGeocode(lat, lng);
    setAddress(a);
    setOutsideBaku(isBaku === false);
    setGeocoding(false);
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placeMarker(latitude, longitude);
  };

  const handleUseCurrent = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setGeoLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 500);
      await placeMarker(latitude, longitude);
    } catch {}
    setGeoLoading(false);
  };

  const handleConfirm = () => {
    if (!coords || outsideBaku) return;
    onConfirm({
      address: address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      coordinates: { lat: coords.lat, lng: coords.lng },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#6B7280" />
          </Pressable>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: scale(6) }}>
            <MapPin size={18} color={BRAND} />
            <Text style={styles.headerTitle}>{t(lang, "mapPicker_title")}</Text>
          </View>
          <Pressable
            style={[styles.confirmBtn, (!coords || outsideBaku || geocoding) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!coords || outsideBaku || geocoding}
          >
            <Check size={16} color="#fff" strokeWidth={3} />
            <Text style={styles.confirmBtnText}>{t(lang, "mapPicker_confirmButton")}</Text>
          </Pressable>
        </View>

        {outsideBaku && (
          <View style={styles.warnBanner}>
            <Text style={{ fontSize: scaleFont(17) }}>⚠️</Text>
            <Text style={styles.warnBannerText}>
              {t(lang, "mapPicker_outsideBakuWarning")}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: initLat || DEFAULT.lat,
              longitude: initLng || DEFAULT.lng,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
            minZoomLevel={9}
            onPress={handleMapPress}
          >
            {coords && (
              <Marker
                coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                draggable
                pinColor={BRAND}
                onDragEnd={(e) => placeMarker(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
              />
            )}
          </MapView>

          <Pressable style={styles.geoBtn} onPress={handleUseCurrent} disabled={geoLoading}>
            {geoLoading ? <ActivityIndicator size="small" color={BRAND} /> : <Navigation size={16} color={BRAND} />}
            <Text style={styles.geoBtnText}>{t(lang, "mapPicker_currentLocationButton")}</Text>
          </Pressable>

          {!coords && (
            <View style={styles.hintBubble} pointerEvents="none">
              <Text style={styles.hintText}>{t(lang, "mapPicker_tapMapHint")}</Text>
            </View>
          )}
        </View>

        <View style={styles.addressBar}>
          {geocoding ? (
            <Text style={styles.addressPlaceholder}>{t(lang, "mapPicker_geocoding")}</Text>
          ) : coords ? (
            <View>
              <Text style={styles.addressText} numberOfLines={1}>
                {address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
              </Text>
              <Text style={styles.addressCoords}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
            </View>
          ) : (
            <Text style={styles.addressPlaceholder}>{t(lang, "mapPicker_selectLocationHint")}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", gap: scale(10), paddingHorizontal: scale(16), paddingVertical: scale(13), borderBottomWidth: 1, borderBottomColor: "#EAECF0" },
  closeBtn: { width: scale(36), height: scale(36), borderRadius: scale(9), borderWidth: 1, borderColor: "#EAECF0", backgroundColor: "#F8F9FB", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontWeight: "700", fontSize: scaleFont(16), color: "#111827" },
  confirmBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), paddingHorizontal: scale(16), paddingVertical: scale(10), borderRadius: scale(10), backgroundColor: BRAND },
  confirmBtnDisabled: { backgroundColor: "#CBD5E1" },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: scaleFont(14.5) },
  warnBanner: { backgroundColor: "#FEF2F2", borderBottomWidth: 1, borderBottomColor: "#FECACA", paddingHorizontal: scale(16), paddingVertical: scale(9), flexDirection: "row", alignItems: "center", gap: scale(8) },
  warnBannerText: { fontSize: scaleFont(13), fontWeight: "600", color: "#991B1B", flex: 1 },
  geoBtn: { position: "absolute", top: scale(12), right: scale(12), flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: "#fff", borderWidth: 1, borderColor: "#EAECF0", borderRadius: scale(10), paddingHorizontal: scale(13), paddingVertical: scale(9), shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  geoBtnText: { fontSize: scaleFont(12.5), fontWeight: "700", color: BRAND },
  hintBubble: { position: "absolute", bottom: scale(12), alignSelf: "center", backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: "#EAECF0", borderRadius: scale(10), paddingHorizontal: scale(15), paddingVertical: scale(9) },
  hintText: { fontSize: scaleFont(12.5), fontWeight: "600", color: "#6B7280" },
  addressBar: { paddingHorizontal: scale(16), paddingVertical: scale(10), borderTopWidth: 1, borderTopColor: "#EAECF0", backgroundColor: "#F8FAFC", height: scale(60), justifyContent: "center" },
  addressPlaceholder: { fontSize: scaleFont(14), color: "#94A3B8" },
  addressText: { fontSize: scaleFont(14), fontWeight: "700", color: "#111827" },
  addressCoords: { fontSize: scaleFont(11.5), color: "#94A3B8", marginTop: scale(2) },
});
