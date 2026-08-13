import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { X, Check, MapPin, Phone, Plus, ChevronDown, Navigation } from "lucide-react-native";
import * as Location from "expo-location";
import { MAX_PHONES, formatPhone, isValidAzPhone, toE164, fromE164 } from "../../lib/phone";
import { scale, scaleFont } from "../../lib/scale";
import { useLanguage } from "../../context/LanguageContext";
import { t as translate } from "../../i18n/i18n";

const BRAND = "#4B0F0F";
const FALLBACK_DELIVERY_PRICE = 5;
const DEFAULT_COORDS = { lat: 40.4093, lng: 49.8671 };

const FALLBACK_COUNTRIES = [
  {
    code: "AZE",
    nameAz: "Azərbaycan",
    enabled: true,
    cities: [
      { key: "baku", nameAz: "Bakı", enabled: true, deliveryPrice: FALLBACK_DELIVERY_PRICE, lat: 40.4093, lng: 49.8671 },
      { key: "sumqayit", nameAz: "Sumqayıt", enabled: true, deliveryPrice: FALLBACK_DELIVERY_PRICE, lat: 40.5891, lng: 49.6686 },
      { key: "ganja", nameAz: "Gəncə", enabled: false, deliveryPrice: FALLBACK_DELIVERY_PRICE, lat: 40.6828, lng: 46.3606 },
    ],
  },
  { code: "TUR", nameAz: "Türkiyə", enabled: false, cities: [] },
  {
    code: "UZB",
    nameAz: "Özbəkistan",
    enabled: true,
    cities: [
      { key: "tashkent", nameAz: "Daşkənd", enabled: true, deliveryPrice: FALLBACK_DELIVERY_PRICE, lat: 41.2995, lng: 69.2401 },
      { key: "samarkand", nameAz: "Səmərqənd", enabled: false, deliveryPrice: FALLBACK_DELIVERY_PRICE, lat: 39.6542, lng: 66.9597 },
    ],
  },
  { code: "RUS", nameAz: "Rusiya", enabled: false, cities: [] },
  { code: "GEO", nameAz: "Gürcüstan", enabled: false, cities: [] },
];

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=az`, {
      headers: { "User-Agent": "MeatBoxApp/1.0" },
    });
    const data = await res.json();
    const a = data.address || {};
    const city = (a.city || a.town || a.village || "").toLowerCase();
    const county = (a.county || "").toLowerCase();
    const state = (a.state || "").toLowerCase();
    const country = (a.country_code || "").toLowerCase();
    const isBaku = country === "az" && (city.includes("bak") || county.includes("abseron") || county.includes("abşeron") || county.includes("absheron") || state.includes("bak") || state.includes("bakı"));
    const parts = [a.road || a.pedestrian, a.house_number, a.suburb || a.neighbourhood, a.city_district || a.district, a.city || a.town || a.village].filter(Boolean);
    const address = parts.length ? parts.join(", ") : (data.display_name || "").split(",").slice(0, 3).join(",");
    return { address, isBaku };
  } catch {
    return { address: "", isBaku: null };
  }
}

/* ── Sadə açılan seçici (ölkə/şəhər) ── */
function SimpleSelect({ label, options, selectedKey, getKey, getLabel, onSelect, lang }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => getKey(o) === selectedKey);

  return (
    <View style={{ flex: 1 }}>
      <Pressable style={styles.selectBtn} onPress={() => setOpen((v) => !v)}>
        <Text style={[styles.selectBtnText, !selected && { color: "#a8a29e" }]} numberOfLines={1}>
          {selected ? getLabel(selected) : label}
        </Text>
        <ChevronDown size={15} color="#a8a29e" />
      </Pressable>
      {open && (
        <View style={styles.selectDropdown}>
          {options.map((o) => {
            const key = getKey(o);
            const isSel = key === selectedKey;
            return (
              <Pressable
                key={key}
                disabled={!o.enabled}
                onPress={() => { onSelect(o); setOpen(false); }}
                style={[styles.selectOption, isSel && styles.selectOptionActive, !o.enabled && { opacity: 0.4 }]}
              >
                <Text style={styles.selectOptionText}>{getLabel(o)}</Text>
                {isSel && <Check size={14} color={BRAND} />}
                {!o.enabled && <Text style={styles.selectOptionSoon}>{translate(lang, "deliveryLoc_comingSoon")}</Text>}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function MeatDeliveryLocationModal({ onClose, onConfirm, initialLocation, defaultPhone }) {
  const { lang } = useLanguage();
  const mapRef = useRef(null);
  const scrollRef = useRef(null);
  const firstPhoneRef = useRef(null);
  const [countries] = useState(FALLBACK_COUNTRIES);
  const [country, setCountry] = useState(
    FALLBACK_COUNTRIES.find((c) => c.code === initialLocation?.countryCode && c.enabled) ||
      FALLBACK_COUNTRIES.find((c) => c.enabled) ||
      FALLBACK_COUNTRIES[0],
  );
  const [city, setCity] = useState(() => {
    const cities = FALLBACK_COUNTRIES.find((c) => c.code === (initialLocation?.countryCode || country?.code))?.cities || [];
    return cities.find((c) => c.key === initialLocation?.cityKey && c.enabled) || cities.find((c) => c.enabled) || cities[0];
  });

  const initLat = initialLocation?.coordinates?.lat ? Number(initialLocation.coordinates.lat) : null;
  const initLng = initialLocation?.coordinates?.lng ? Number(initialLocation.coordinates.lng) : null;
  const [coords, setCoords] = useState(initLat && initLng ? { lat: initLat, lng: initLng } : null);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [outsideBaku, setOutsideBaku] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [phones, setPhones] = useState(() => {
    if (initialLocation?.phones?.length) return initialLocation.phones.map(fromE164);
    const prefilled = fromE164(defaultPhone);
    return [prefilled];
  });
  const [phonesTouched, setPhonesTouched] = useState(false);

  // Nömrə inputuna avtomatik fokus — MobileGrowModal-ın böyümə animasiyası
  // (~320ms) bitəndən sonra, ki klaviatura animasiya ilə toqquşmasın.
  useEffect(() => {
    const t = setTimeout(() => firstPhoneRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  const cities = country?.cities || [];

  const handleSelectCountry = (c) => {
    setCountry(c);
    const firstCity = (c.cities || []).find((ci) => ci.enabled) || c.cities?.[0];
    if (firstCity) setCity(firstCity);
  };

  const handleSelectCity = (c) => {
    setCity(c);
    if (c.lat && c.lng) {
      mapRef.current?.animateToRegion({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.15, longitudeDelta: 0.15 }, 500);
    }
  };

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

  const useCurrentLocation = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 500);
      await placeMarker(latitude, longitude);
    } catch {
      /* ignore */
    } finally {
      setGeoLoading(false);
    }
  };

  const phonesValid = phones.some((p) => isValidAzPhone(p)) && phones.every((p) => !p.trim() || isValidAzPhone(p));
  const canConfirm = coords && !outsideBaku && !geocoding && phonesValid;

  const handleConfirm = () => {
    setPhonesTouched(true);
    if (!coords || outsideBaku || geocoding || !phonesValid) return;
    const validPhones = phones.filter((p) => p.trim() && isValidAzPhone(p)).map(toE164);
    onConfirm({
      countryCode: country.code,
      countryNameAz: country.nameAz,
      deliveryPrice: Number(city?.deliveryPrice ?? FALLBACK_DELIVERY_PRICE),
      cityKey: city?.key,
      cityNameAz: city?.nameAz,
      address: address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      coordinates: coords,
      phones: validPhones,
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      <View style={styles.header}>
        <MapPin size={17} color={BRAND} />
        <Text style={styles.title}>{translate(lang, "deliveryLoc_title")}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X size={16} color="#78716c" />
        </Pressable>
      </View>

      {/* Hər şey (seçicilər + xəritə + telefon) TƏK scroll daxilindədir ki,
          klaviatura açılanda fokuslanan input avtomatik görünən sahəyə
          sürüşsün (RN-in TextInput-un ScrollView içindəki default davranışı). */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: scale(14) }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", gap: scale(8), padding: scale(14), paddingBottom: scale(8), zIndex: 10 }}>
          <SimpleSelect label={translate(lang, "deliveryLoc_selectCountry")} options={countries} selectedKey={country?.code} getKey={(c) => c.code} getLabel={(c) => c.nameAz} onSelect={handleSelectCountry} lang={lang} />
          <SimpleSelect label={translate(lang, "deliveryLoc_selectCity")} options={cities} selectedKey={city?.key} getKey={(c) => c.key} getLabel={(c) => c.nameAz} onSelect={handleSelectCity} lang={lang} />
        </View>

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: initLat || city?.lat || DEFAULT_COORDS.lat,
              longitude: initLng || city?.lng || DEFAULT_COORDS.lng,
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

          <Pressable style={styles.geoBtn} onPress={useCurrentLocation} disabled={geoLoading}>
            {geoLoading ? <ActivityIndicator size="small" color={BRAND} /> : <Navigation size={13} color={BRAND} />}
            <Text style={styles.geoBtnText}>{translate(lang, "deliveryLoc_currentLocation")}</Text>
          </Pressable>

          {!coords && (
            <View style={styles.hintBubble} pointerEvents="none">
              <Text style={styles.hintText}>{translate(lang, "deliveryLoc_tapMap")}</Text>
            </View>
          )}

          {outsideBaku && (
            <View style={styles.warnBanner}>
              <Text style={styles.warnBannerText}>{translate(lang, "deliveryLoc_zoneWarning")}</Text>
            </View>
          )}
        </View>

        <View style={styles.addressBar}>
          {geocoding ? (
            <Text style={styles.addressPlaceholder}>{translate(lang, "deliveryLoc_addressSearching")}</Text>
          ) : coords ? (
            <>
              <Text style={styles.addressText} numberOfLines={1}>{address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}</Text>
              <Text style={styles.addressCoords}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
            </>
          ) : (
            <Text style={styles.addressPlaceholder}>{translate(lang, "deliveryLoc_addressPlaceholder")}</Text>
          )}
        </View>

        <View style={styles.phoneSection}>
          <View style={styles.phoneHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
              <Phone size={14} color={BRAND} />
              <Text style={styles.phoneLabel}>{translate(lang, "deliveryLoc_contactPhone")}</Text>
            </View>
            <Pressable
              disabled={phones.length >= MAX_PHONES}
              onPress={() => setPhones((p) => [...p, ""])}
              style={[styles.addPhoneBtn, phones.length >= MAX_PHONES && { opacity: 0.4 }]}
            >
              <Plus size={12} color={BRAND} />
              <Text style={styles.addPhoneText}>{translate(lang, "deliveryLoc_addPhone")}</Text>
            </Pressable>
          </View>

          {phones.map((phone, idx) => {
            const isEmpty = phonesTouched && idx === 0 && !phone.trim();
            const isInvalid = phonesTouched && phone.trim() && !isValidAzPhone(phone);
            const hasError = isEmpty || isInvalid;
            return (
              <View key={idx} style={{ marginBottom: scale(6) }}>
                <View style={styles.phoneRow}>
                  <View style={[styles.phoneInputWrap, hasError && { borderColor: "#f87171" }]}>
                    <Text style={styles.phonePrefix}>+994</Text>
                    <TextInput
                      ref={idx === 0 ? firstPhoneRef : null}
                      value={phone}
                      onChangeText={(t) => setPhones((prev) => prev.map((p, i) => (i === idx ? formatPhone(t) : p)))}
                      placeholder="50 123 45 67"
                      keyboardType="number-pad"
                      maxLength={12}
                      style={styles.phoneInput}
                    />
                  </View>
                  {phones.length > 1 && (
                    <Pressable onPress={() => setPhones((p) => p.filter((_, i) => i !== idx))} style={{ padding: scale(4) }}>
                      <X size={16} color="#a8a29e" />
                    </Pressable>
                  )}
                </View>
                {isEmpty && <Text style={styles.errorText}>{translate(lang, "deliveryLoc_enterPhone")}</Text>}
                {isInvalid && <Text style={styles.errorText}>{translate(lang, "deliveryLoc_invalidPhone")}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]} onPress={handleConfirm}>
          <Check size={16} color={canConfirm ? "#fff" : "#a8a29e"} />
          <Text style={[styles.confirmBtnText, !canConfirm && { color: "#a8a29e" }]}>{translate(lang, "deliveryLoc_confirm")}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: scale(8), paddingHorizontal: scale(16), paddingVertical: scale(13), borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  title: { flex: 1, fontSize: scaleFont(14.5), fontWeight: "800", color: "#292524" },
  closeBtn: { width: scale(28), height: scale(28), borderRadius: scale(10), borderWidth: 1, borderColor: "#f0ede8", alignItems: "center", justifyContent: "center" },

  selectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: scale(38), borderRadius: scale(10), borderWidth: 1.5, borderColor: "#f0ede8", paddingHorizontal: scale(10), backgroundColor: "#fff" },
  selectBtnText: { fontSize: scaleFont(12), fontWeight: "700", color: "#292524" },
  selectDropdown: {
    position: "absolute", top: scale(42), left: 0, right: 0, zIndex: 20,
    backgroundColor: "#fff", borderRadius: scale(12), borderWidth: 1, borderColor: "#f0ede8",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    padding: scale(4),
  },
  selectOption: { flexDirection: "row", alignItems: "center", gap: scale(6), paddingVertical: scale(9), paddingHorizontal: scale(10), borderRadius: scale(8) },
  selectOptionActive: { backgroundColor: "#FFF7ED" },
  selectOptionText: { flex: 1, fontSize: scaleFont(12), fontWeight: "700", color: "#292524" },
  selectOptionSoon: { fontSize: scaleFont(9), fontWeight: "700", color: "#a8a29e" },

  mapWrap: { height: scale(230), marginHorizontal: scale(14), borderRadius: scale(16), overflow: "hidden", borderWidth: 1, borderColor: "#f0ede8" },
  geoBtn: {
    position: "absolute", top: scale(10), right: scale(10), flexDirection: "row", alignItems: "center", gap: scale(6),
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0ede8", borderRadius: scale(10), paddingHorizontal: scale(10), paddingVertical: scale(8),
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  geoBtnText: { fontSize: scaleFont(11), fontWeight: "700", color: BRAND },
  hintBubble: { position: "absolute", bottom: scale(10), alignSelf: "center", backgroundColor: "rgba(255,255,255,0.94)", borderWidth: 1, borderColor: "#f0ede8", borderRadius: scale(10), paddingHorizontal: scale(12), paddingVertical: scale(7) },
  hintText: { fontSize: scaleFont(11), fontWeight: "600", color: "#78716c" },
  warnBanner: { position: "absolute", left: scale(8), right: scale(8), bottom: scale(8), backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: scale(10), padding: scale(8) },
  warnBannerText: { fontSize: scaleFont(10.5), fontWeight: "700", color: "#991B1B" },

  addressBar: { marginHorizontal: scale(14), marginTop: scale(8), padding: scale(10), borderRadius: scale(12), backgroundColor: "#FAF9F7", borderWidth: 1, borderColor: "#f0ede8" },
  addressPlaceholder: { fontSize: scaleFont(12), color: "#a8a29e", fontWeight: "500" },
  addressText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#292524" },
  addressCoords: { fontSize: scaleFont(10), color: "#a8a29e", marginTop: scale(2) },

  phoneSection: { padding: scale(14), borderTopWidth: 1, borderTopColor: "#f0ede8", marginTop: scale(8) },
  phoneHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(8) },
  phoneLabel: { fontSize: scaleFont(11), fontWeight: "800", color: "#a8a29e", textTransform: "uppercase", letterSpacing: 0.3 },
  addPhoneBtn: { flexDirection: "row", alignItems: "center", gap: scale(4), borderWidth: 1, borderColor: "rgba(75,15,15,0.3)", backgroundColor: "#F1E5E5", borderRadius: scale(10), paddingVertical: scale(5), paddingHorizontal: scale(10) },
  addPhoneText: { fontSize: scaleFont(11), fontWeight: "700", color: BRAND },

  phoneRow: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  phoneInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: scale(10), borderWidth: 1.5, borderColor: "#e7e5e4", overflow: "hidden" },
  phonePrefix: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#a8a29e", paddingHorizontal: scale(8), paddingVertical: scale(9), borderRightWidth: 1, borderRightColor: "#e7e5e4" },
  phoneInput: { flex: 1, fontSize: scaleFont(12.5), paddingHorizontal: scale(8), paddingVertical: scale(9), color: "#292524" },
  errorText: { fontSize: scaleFont(10.5), color: "#ef4444", fontWeight: "600", marginTop: scale(2) },

  footer: { padding: scale(14), borderTopWidth: 1, borderTopColor: "#f0ede8" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(8), backgroundColor: BRAND, borderRadius: scale(14), paddingVertical: scale(13) },
  confirmBtnDisabled: { backgroundColor: "#e7e5e4" },
  confirmBtnText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "800" },
});
