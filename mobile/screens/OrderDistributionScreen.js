import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  Truck,
  Store,
  Home as HomeIcon,
  Heart,
  HeartHandshake,
  MapPin,
  Plus,
  X,
  AlertCircle,
  ChevronRight,
} from "lucide-react-native";
import OrderStepHeader from "../components/OrderStepHeader";
import MapLocationPicker from "../components/MapLocationPicker";
import api from "../lib/api";

const BRAND = "#1c5e20";

const AZ_OPERATORS = ["10", "12", "18", "20", "40", "41", "44", "50", "51", "55", "60", "70", "77", "99"];

function formatPhone(input) {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.startsWith("0")) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

function isValidAzPhone(formatted) {
  const d = formatted.replace(/\D/g, "");
  if (d.length === 9) return AZ_OPERATORS.includes(d.slice(0, 2));
  if (d.length === 10 && d.startsWith("0")) return AZ_OPERATORS.includes(d.slice(1, 3));
  return false;
}

function getPhoneError(formatted, isFirst) {
  const d = formatted.replace(/\D/g, "");
  if (!d) return isFirst ? "Boş ola bilməz." : null;
  const complete = d.startsWith("0") ? d.length === 10 : d.length === 9;
  if (!complete) return "Nömrəni tamamlayın.";
  const prefix = d.startsWith("0") ? d.slice(1, 3) : d.slice(0, 2);
  return AZ_OPERATORS.includes(prefix) ? null : "Bu operator kodu mövcud deyil.";
}

const DELIVERY_KEYS = ["catdirilsin", "ozum"];
const CHARITY_KEYS = ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];

const OPTION_META = {
  catdirilsin: { Icon: Truck, color: "#16a34a", light: "#f0fdf4" },
  ozum: { Icon: Store, color: "#374151", light: "#f9fafb" },
  usaqlar_evi: { Icon: HomeIcon, color: "#1B5E20", light: "#E8F5E9" },
  qocalar_evi: { Icon: Heart, color: "#6A1B9A", light: "#F3E5F5" },
  ehtiyac_sahibleri: { Icon: HeartHandshake, color: "#1565C0", light: "#E3F2FD" },
};

function OptionRow({ optKey, data, selected, disabled, onPress, grid }) {
  const meta = OPTION_META[optKey];
  const Icon = meta.Icon;
  return (
    <Pressable
      style={[styles.optRow, grid && styles.optRowGrid, selected && styles.optRowSelected, disabled && styles.optRowDisabled]}
      onPress={() => !disabled && onPress(optKey)}
      disabled={disabled}
    >
      <View style={[styles.optIcon, { backgroundColor: disabled ? "#f3f4f6" : meta.light }]}>
        <Icon size={15} color={disabled ? "#d1d5db" : meta.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.optLabel} numberOfLines={1}>{data.labelAz}</Text>
        <Text style={[styles.optFee, { color: disabled ? "#9ca3af" : meta.color }]}>
          {disabled ? "Deaktivdir" : (data.fee || 0) > 0 ? `+${data.fee} AZN` : "Pulsuz"}
        </Text>
        {optKey === "catdirilsin" && !disabled && (
          <Text style={styles.optNote} numberOfLines={1}>Yalnız Bakı və ətrafı</Text>
        )}
      </View>
      <View style={[styles.radio, selected && !disabled && styles.radioSelected]}>
        {selected && !disabled ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function OrderDistributionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const orderData = route.params || {};
  const { animal, qty = 1, totalPrice = 0 } = orderData;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const [selectedKey, setSelectedKey] = useState(null);
  const [optionData, setOptionData] = useState({});
  const [meatPickupLocation, setMeatPickupLocation] = useState(null);
  const [addressLocation, setAddressLocation] = useState(null);
  const [addressNote, setAddressNote] = useState("");
  const [phones, setPhones] = useState([""]);
  const [touchedPhones, setTouchedPhones] = useState([false]);
  const [focusedPhoneIdx, setFocusedPhoneIdx] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    api.get("/app-config/settings")
      .then((res) => {
        const loc = res.data?.data?.meatPickupLocation;
        if (loc?.address) setMeatPickupLocation(loc);
      })
      .catch(() => {});

    api.get("/app-config/delivery-options")
      .then((res) => {
        const options = res.data?.data?.deliveryOptions || [];
        const animalId = animal?._id;
        const effectiveFee = (opt) => {
          const specific = (opt?.categorySpecificPrices || []).find(
            (sp) => (sp.categoryId?._id || sp.categoryId) === animalId
          );
          return specific != null ? specific.price : (opt?.basePrice ?? 0);
        };
        const delivOpt = options.find((o) => o.key === "catdirilsin");
        const data = {
          catdirilsin: { labelAz: "Sizə çatdırılsın", fee: effectiveFee(delivOpt) },
          ozum: { labelAz: "Özüm götürəcəm", fee: 0 },
        };
        const charityOpts = CHARITY_KEYS.map((key) => options.find((o) => o.key === key)).filter((o) => {
          if (!o) return false;
          const hasSpecific = (o.categorySpecificPrices || []).some((sp) => (sp.categoryId?._id || sp.categoryId) === animalId);
          if (hasSpecific) return true;
          const cats = o.applicableCategories || [];
          if (cats.length === 0) return false;
          return cats.some((c) => (c._id || c) === animalId);
        });
        charityOpts.forEach((o) => {
          data[o.key] = { labelAz: o.labelAz, fee: effectiveFee(o), disabled: !o.isActive };
        });
        setOptionData(data);
      })
      .catch(() => {});
  }, [animal]);

  const needsLocation = selectedKey === "catdirilsin";
  const needsPhone = selectedKey === "catdirilsin" || selectedKey === "ozum";
  const deliveryKeys = DELIVERY_KEYS.filter((k) => k in optionData);
  const charityKeys = CHARITY_KEYS.filter((k) => k in optionData);

  const selectionOk = selectedKey !== null;
  const phonesValid = needsPhone
    ? phones.some((p) => isValidAzPhone(p)) && phones.every((p) => !p.trim() || isValidAzPhone(p))
    : true;
  const addrOk = (!needsLocation || !!addressLocation) && phonesValid;
  const canContinue = selectionOk && addrOk;

  const selectedFee = selectedKey ? (optionData[selectedKey]?.fee ?? 0) : 0;
  const totalAmount = (parseFloat(totalPrice) || 0) + selectedFee;

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!canContinue) return;
    navigation.navigate("OrderSummary", {
      ...orderData,
      distKey: selectedKey,
      distLabel: optionData[selectedKey]?.labelAz,
      distFee: selectedFee,
      addressLocation: needsLocation ? addressLocation : null,
      addressNote: addressNote.trim() || null,
      phones: phones.map((p) => p.trim()).filter(Boolean),
    });
  };

  const openMaps = () => {
    const url = meatPickupLocation?.lat && meatPickupLocation?.lng
      ? `https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meatPickupLocation?.address || "")}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={2} />

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 90, gap: 10 }}>
        <Text style={styles.pageTitle}>Çatdırılma seçin</Text>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadLabel}>ÇATDIRILMA ÜSULU</Text>
          </View>
          {submitAttempted && !selectionOk && (
            <View style={styles.errorBanner}>
              <AlertCircle size={13} color="#dc2626" />
              <Text style={styles.errorBannerText}>Çatdırılma üsulunu seçin.</Text>
            </View>
          )}
          <View style={{ padding: 8, gap: 6 }}>
            <View style={styles.optGridRow}>
              {deliveryKeys.map((key) => (
                <OptionRow key={key} optKey={key} data={optionData[key]} selected={selectedKey === key} onPress={setSelectedKey} grid />
              ))}
            </View>
            {charityKeys.map((key) => (
              <OptionRow key={key} optKey={key} data={optionData[key]} selected={selectedKey === key} disabled={optionData[key]?.disabled} onPress={setSelectedKey} />
            ))}
          </View>
        </View>

        {selectedKey === "ozum" && meatPickupLocation && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadLabel}>GÖTÜRMƏ MƏKANI</Text>
            </View>
            <View style={{ padding: 12, gap: 8 }}>
              <View style={styles.pickupBox}>
                <Store size={16} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickupTitle}>Əti götürəcəyiniz yer</Text>
                  <Text style={styles.pickupAddr}>{meatPickupLocation.address}</Text>
                </View>
              </View>
              <Pressable style={styles.mapsBtn} onPress={openMaps}>
                <MapPin size={13} color={BRAND} />
                <Text style={styles.mapsBtnText}>Google Maps-də aç</Text>
              </Pressable>
            </View>
          </View>
        )}

        {needsLocation && (
          <View style={[styles.card, submitAttempted && !addressLocation && styles.cardError]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadLabel}>ÇATDIRILMA ÜNVANI *</Text>
            </View>
            <View style={{ padding: 10, gap: 8 }}>
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  Çatdırılma xidməti yalnız <Text style={{ fontWeight: "800" }}>Bakı və Bakı ətrafı ərazilər</Text> üçün nəzərdə tutulub.
                </Text>
              </View>

              {addressLocation ? (
                <Pressable style={styles.addressChosen} onPress={() => setShowMap(true)}>
                  <MapPin size={15} color={BRAND} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.addressChosenText} numberOfLines={2}>{addressLocation.address}</Text>
                    <Text style={styles.addressChosenEdit}>Ünvanı dəyiş</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable style={styles.mapPickBtn} onPress={() => setShowMap(true)}>
                  <MapPin size={13} color={BRAND} />
                  <Text style={styles.mapPickBtnText}>Xəritədən ünvan seçin</Text>
                </Pressable>
              )}

              {submitAttempted && !addressLocation && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={13} color="#dc2626" />
                  <Text style={styles.errorBannerText}>Xəritədən ünvan seçin.</Text>
                </View>
              )}
              <TextInput
                style={styles.noteInput}
                value={addressNote}
                onChangeText={setAddressNote}
                placeholder="Əlavə qeyd (mənzil, giriş, mərtəbə...)"
                placeholderTextColor="#9ca3af"
                multiline
              />
            </View>
          </View>
        )}

        <MapLocationPicker
          visible={showMap}
          initialLocation={addressLocation}
          onClose={() => setShowMap(false)}
          onConfirm={(loc) => {
            setAddressLocation(loc);
            setShowMap(false);
          }}
        />

        {needsPhone && (
          <View style={styles.card}>
            <View style={[styles.cardHead, { justifyContent: "space-between" }]}>
              <Text style={styles.cardHeadLabel}>ƏLAQƏ NÖMRƏSİ *</Text>
              <Pressable
                style={[styles.addPhoneBtn, phones.length >= 4 && styles.addPhoneBtnDisabled]}
                disabled={phones.length >= 4}
                onPress={() => {
                  setPhones((p) => [...p, ""]);
                  setTouchedPhones((t) => [...t, false]);
                }}
              >
                <Plus size={11} color={phones.length >= 4 ? "#9ca3af" : BRAND} />
                <Text style={[styles.addPhoneText, phones.length >= 4 && { color: "#9ca3af" }]}>Nömrə əlavə et</Text>
              </Pressable>
            </View>
            <View style={styles.phoneGrid}>
              {phones.map((phone, idx) => {
                const showError = (touchedPhones[idx] || submitAttempted) && focusedPhoneIdx !== idx;
                const errorText = showError ? getPhoneError(phone, idx === 0) : null;
                return (
                  <View key={idx} style={[styles.phoneGridItem, { gap: 3 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={[styles.phoneBox, !!errorText && styles.phoneBoxError]}>
                        <Text style={styles.phonePrefix}>+994</Text>
                        <TextInput
                          style={styles.phoneInput}
                          value={phone}
                          onChangeText={(v) => setPhones((prev) => prev.map((p, i) => (i === idx ? formatPhone(v) : p)))}
                          onFocus={() => setFocusedPhoneIdx(idx)}
                          onBlur={() => {
                            setFocusedPhoneIdx((cur) => (cur === idx ? null : cur));
                            setTouchedPhones((t) => t.map((v, i) => (i === idx ? true : v)));
                          }}
                          placeholder="50 XXX XX XX"
                          placeholderTextColor="#9ca3af"
                          keyboardType="number-pad"
                          maxLength={12}
                        />
                      </View>
                      {phones.length > 1 && (
                        <Pressable
                          onPress={() => {
                            setPhones((p) => p.filter((_, i) => i !== idx));
                            setTouchedPhones((t) => t.filter((_, i) => i !== idx));
                          }}
                        >
                          <X size={16} color="#9ca3af" />
                        </Pressable>
                      )}
                    </View>
                    {errorText && (
                      <Text style={styles.fieldError}>{errorText}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadLabel}>SİFARİŞ XÜLASƏSİ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Qurbanlıq növü</Text>
            <Text style={styles.summaryValue}>{animal?.nameAz} × {qty}</Text>
          </View>
          {selectedKey && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Çatdırılma</Text>
              <Text style={[styles.summaryValue, { color: selectedFee === 0 ? "#059669" : "#171717" }]}>
                {selectedFee === 0 ? "Pulsuz" : `+${selectedFee} AZN`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.bottomLabel}>ÜMUMİ MƏBLƏĞ</Text>
          <Text style={styles.bottomValue}>{totalAmount.toFixed(0)} AZN</Text>
        </View>
        <Pressable style={[styles.continueBtn, !canContinue && { opacity: 0.5 }]} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Davam et</Text>
          <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },
  pageTitle: { fontSize: 16, fontWeight: "800", color: "#171717" },

  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardError: { borderWidth: 1.5, borderColor: "#f87171" },
  cardHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fafbfa" },
  cardHeadLabel: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.6, color: "#9ca3af" },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, margin: 8 },
  errorBannerText: { fontSize: 11, fontWeight: "700", color: "#dc2626" },

  optGridRow: { flexDirection: "row", gap: 6 },
  optRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 8 },
  optRowGrid: { flex: 1, minWidth: 0, paddingHorizontal: 8 },
  optRowSelected: { borderColor: BRAND, backgroundColor: "#f0f7f0" },
  optRowDisabled: { opacity: 0.55 },
  optIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  optLabel: { fontSize: 12, fontWeight: "700", color: "#171717" },
  optFee: { fontSize: 10.5, fontWeight: "700", marginTop: 1 },
  optNote: { fontSize: 9, color: "#d97706", marginTop: 1 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: BRAND, backgroundColor: BRAND },
  radioDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },

  pickupBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 10, padding: 10 },
  pickupTitle: { fontSize: 12, fontWeight: "800", color: "#059669" },
  pickupAddr: { fontSize: 11, color: "#047857", marginTop: 2, lineHeight: 16 },
  mapsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: BRAND + "50", backgroundColor: "#f0f7f0", borderRadius: 10, paddingVertical: 9 },
  mapsBtnText: { fontSize: 12, fontWeight: "800", color: BRAND },

  warnBox: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 8, padding: 8 },
  warnText: { fontSize: 10.5, color: "#92400e", fontWeight: "600", lineHeight: 15 },
  noteInput: { minHeight: 44, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f9fafb", padding: 10, fontSize: 12, color: "#171717", textAlignVertical: "top" },

  mapPickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: BRAND, borderStyle: "dashed", backgroundColor: "#f0f7f0", borderRadius: 10, paddingVertical: 12 },
  mapPickBtnText: { fontSize: 12, fontWeight: "800", color: BRAND },
  addressChosen: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1.5, borderColor: BRAND + "50", backgroundColor: "#f0f7f0", borderRadius: 10, padding: 10 },
  addressChosenText: { fontSize: 11.5, fontWeight: "700", color: "#171717", lineHeight: 16 },
  addressChosenEdit: { fontSize: 10, fontWeight: "800", color: BRAND, marginTop: 3 },

  addPhoneBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#eef7ee", borderWidth: 1, borderColor: BRAND + "40", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  addPhoneBtnDisabled: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  addPhoneText: { fontSize: 10, fontWeight: "800", color: BRAND },
  phoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 10 },
  phoneGridItem: { width: "47%" },
  phoneBox: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f9fafb", overflow: "hidden" },
  phoneBoxError: { borderColor: "#f87171" },
  phonePrefix: { fontSize: 10, fontWeight: "800", color: "#374151", paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: "#e5e7eb", paddingVertical: 10 },
  phoneInput: { flex: 1, paddingHorizontal: 6, paddingVertical: 10, fontSize: 11.5, color: "#171717" },
  fieldError: { fontSize: 9.5, color: "#dc2626", fontWeight: "700", paddingLeft: 2 },

  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#f5f5f5" },
  summaryLabel: { fontSize: 11, color: "#737373", fontWeight: "600" },
  summaryValue: { fontSize: 12, fontWeight: "800", color: "#171717" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomLabel: { fontSize: 9, fontWeight: "800", color: "#9ca3af", letterSpacing: 0.6 },
  bottomValue: { fontSize: 20, fontWeight: "900", color: BRAND },
  continueBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BRAND, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  continueBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },
});
