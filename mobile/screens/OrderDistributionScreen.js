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
import { AZ_OPERATORS, formatPhone, isValidAzPhone } from "../lib/phone";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

function getPhoneError(formatted, isFirst, lang) {
  const d = formatted.replace(/\D/g, "");
  if (!d) return isFirst ? t(lang, "dist_errorEmpty") : null;
  const complete = d.startsWith("0") ? d.length === 10 : d.length === 9;
  if (!complete) return t(lang, "dist_errorIncomplete");
  const prefix = d.startsWith("0") ? d.slice(1, 3) : d.slice(0, 2);
  return AZ_OPERATORS.includes(prefix) ? null : t(lang, "dist_errorBadOperator");
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
  const { lang } = useLanguage();
  const meta = OPTION_META[optKey];
  const Icon = meta.Icon;
  return (
    <Pressable
      style={[styles.optRow, grid && styles.optRowGrid, selected && styles.optRowSelected, disabled && styles.optRowDisabled]}
      onPress={() => !disabled && onPress(optKey)}
      disabled={disabled}
    >
      <View style={[styles.optIcon, { backgroundColor: disabled ? "#f3f4f6" : meta.light }]}>
        <Icon size={17} color={disabled ? "#d1d5db" : meta.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.optLabel} numberOfLines={2}>{data.labelAz}</Text>
        <Text style={[styles.optFee, { color: disabled ? "#9ca3af" : meta.color }]}>
          {disabled ? t(lang, "dist_disabledLabel") : (data.fee || 0) > 0 ? `+${data.fee} AZN` : t(lang, "dist_freeLabel")}
        </Text>
        {optKey === "catdirilsin" && !disabled && (
          <Text style={styles.optNote} numberOfLines={1}>{t(lang, "dist_deliveryNote")}</Text>
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
  const { lang } = useLanguage();

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
          catdirilsin: { labelAz: t(lang, "dist_optDeliverLabel"), fee: effectiveFee(delivOpt) },
          ozum: { labelAz: t(lang, "dist_optPickupLabel"), fee: 0 },
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
  }, [animal, lang]);

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

      <ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: insets.bottom + 90, gap: scale(10) }}>
        <Text style={styles.pageTitle}>{t(lang, "dist_pageTitle")}</Text>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadLabel}>{t(lang, "dist_methodSectionLabel")}</Text>
          </View>
          {submitAttempted && !selectionOk && (
            <View style={styles.errorBanner}>
              <AlertCircle size={14} color="#dc2626" />
              <Text style={styles.errorBannerText}>{t(lang, "dist_selectMethodError")}</Text>
            </View>
          )}
          <View style={{ padding: scale(8), gap: scale(6) }}>
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
              <Text style={styles.cardHeadLabel}>{t(lang, "dist_pickupLocationSectionLabel")}</Text>
            </View>
            <View style={{ padding: scale(12), gap: scale(8) }}>
              <View style={styles.pickupBox}>
                <Store size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickupTitle}>{t(lang, "dist_pickupLocationTitle")}</Text>
                  <Text style={styles.pickupAddr}>{meatPickupLocation.address}</Text>
                </View>
              </View>
              <Pressable style={styles.mapsBtn} onPress={openMaps}>
                <MapPin size={14} color={BRAND} />
                <Text style={styles.mapsBtnText}>{t(lang, "dist_openInGoogleMaps")}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {needsLocation && (
          <View style={[styles.card, submitAttempted && !addressLocation && styles.cardError]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadLabel}>{t(lang, "dist_addressSectionLabel")}</Text>
            </View>
            <View style={{ padding: scale(10), gap: scale(8) }}>
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  {t(lang, "dist_deliveryWarningTemplate").split("{area}")[0]}
                  <Text style={{ fontWeight: "800" }}>{t(lang, "dist_deliveryWarningArea")}</Text>
                  {t(lang, "dist_deliveryWarningTemplate").split("{area}")[1]}
                </Text>
              </View>

              {addressLocation ? (
                <Pressable style={styles.addressChosen} onPress={() => setShowMap(true)}>
                  <MapPin size={17} color={BRAND} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.addressChosenText} numberOfLines={2}>{addressLocation.address}</Text>
                    <Text style={styles.addressChosenEdit}>{t(lang, "dist_editAddress")}</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable style={styles.mapPickBtn} onPress={() => setShowMap(true)}>
                  <MapPin size={14} color={BRAND} />
                  <Text style={styles.mapPickBtnText}>{t(lang, "dist_pickAddressFromMap")}</Text>
                </Pressable>
              )}

              {submitAttempted && !addressLocation && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={14} color="#dc2626" />
                  <Text style={styles.errorBannerText}>{t(lang, "dist_selectAddressError")}</Text>
                </View>
              )}
              <TextInput
                style={styles.noteInput}
                value={addressNote}
                onChangeText={setAddressNote}
                placeholder={t(lang, "dist_addressNotePlaceholder")}
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
              <Text style={styles.cardHeadLabel}>{t(lang, "dist_contactPhoneSectionLabel")}</Text>
              <Pressable
                style={[styles.addPhoneBtn, phones.length >= 4 && styles.addPhoneBtnDisabled]}
                disabled={phones.length >= 4}
                onPress={() => {
                  setPhones((p) => [...p, ""]);
                  setTouchedPhones((t) => [...t, false]);
                }}
              >
                <Plus size={12} color={phones.length >= 4 ? "#9ca3af" : BRAND} />
                <Text style={[styles.addPhoneText, phones.length >= 4 && { color: "#9ca3af" }]}>{t(lang, "dist_addPhoneBtn")}</Text>
              </Pressable>
            </View>
            <View style={styles.phoneGrid}>
              {phones.map((phone, idx) => {
                const showError = (touchedPhones[idx] || submitAttempted) && focusedPhoneIdx !== idx;
                const errorText = showError ? getPhoneError(phone, idx === 0, lang) : null;
                return (
                  <View key={idx} style={[styles.phoneGridItem, { gap: scale(3) }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
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
                          <X size={18} color="#9ca3af" />
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
            <Text style={styles.cardHeadLabel}>{t(lang, "dist_orderSummarySectionLabel")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(lang, "dist_animalTypeLabel")}</Text>
            <Text style={styles.summaryValue}>{animal?.nameAz} × {qty}</Text>
          </View>
          {selectedKey && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t(lang, "dist_deliveryLabel")}</Text>
              <Text style={[styles.summaryValue, { color: selectedFee === 0 ? "#059669" : "#171717" }]}>
                {selectedFee === 0 ? t(lang, "dist_freeLabel") : `+${selectedFee} AZN`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.bottomLabel}>{t(lang, "dist_totalAmountLabel")}</Text>
          <Text style={styles.bottomValue}>{totalAmount.toFixed(0)} AZN</Text>
        </View>
        <Pressable style={[styles.continueBtn, !canContinue && { opacity: 0.5 }]} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>{t(lang, "continue")}</Text>
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },
  pageTitle: { fontSize: scaleFont(19), fontWeight: "900", color: "#171717" },

  card: { backgroundColor: "#fff", borderRadius: scale(12), overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardError: { borderWidth: 1.5, borderColor: "#f87171" },
  cardHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: scale(10), paddingVertical: scale(9), borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fafbfa" },
  cardHeadLabel: { fontSize: scaleFont(12), fontWeight: "800", letterSpacing: 0.6, color: "#9ca3af" },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: scale(8), paddingHorizontal: scale(10), paddingVertical: scale(7), margin: scale(8) },
  errorBannerText: { fontSize: scaleFont(12), fontWeight: "700", color: "#dc2626" },

  optGridRow: { flexDirection: "row", gap: scale(6) },
  optRow: { flexDirection: "row", alignItems: "center", gap: scale(8), borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff", paddingHorizontal: scale(10), paddingVertical: scale(9) },
  optRowGrid: { flex: 1, minWidth: 0, paddingHorizontal: scale(8) },
  optRowSelected: { borderColor: BRAND, backgroundColor: "#f0f7f0" },
  optRowDisabled: { opacity: 0.55 },
  optIcon: { width: scale(32), height: scale(32), borderRadius: scale(9), alignItems: "center", justifyContent: "center" },
  optLabel: { fontSize: scaleFont(13.5), fontWeight: "700", color: "#171717" },
  optFee: { fontSize: scaleFont(11.5), fontWeight: "700", marginTop: scale(1) },
  optNote: { fontSize: scaleFont(11), color: "#d97706", marginTop: scale(1) },
  radio: { width: scale(17), height: scale(17), borderRadius: scale(9), borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: BRAND, backgroundColor: BRAND },
  radioDot: { width: scale(6), height: scale(6), borderRadius: scale(3), backgroundColor: "#fff" },

  pickupBox: { flexDirection: "row", alignItems: "flex-start", gap: scale(8), backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: scale(10), padding: scale(10) },
  pickupTitle: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#059669" },
  pickupAddr: { fontSize: scaleFont(12), color: "#047857", marginTop: scale(2), lineHeight: moderateScale(17) },
  mapsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), borderWidth: 1, borderColor: BRAND + "50", backgroundColor: "#f0f7f0", borderRadius: scale(10), paddingVertical: scale(10) },
  mapsBtnText: { fontSize: scaleFont(13.5), fontWeight: "800", color: BRAND },

  warnBox: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: scale(8), padding: scale(8) },
  warnText: { fontSize: scaleFont(11.5), color: "#92400e", fontWeight: "600", lineHeight: moderateScale(16) },
  noteInput: { minHeight: scale(44), borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: scale(10), backgroundColor: "#f9fafb", padding: scale(10), fontSize: scaleFont(13), color: "#171717", textAlignVertical: "top" },

  mapPickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), borderWidth: 1.5, borderColor: BRAND, borderStyle: "dashed", backgroundColor: "#f0f7f0", borderRadius: scale(10), paddingVertical: scale(13) },
  mapPickBtnText: { fontSize: scaleFont(13.5), fontWeight: "800", color: BRAND },
  addressChosen: { flexDirection: "row", alignItems: "flex-start", gap: scale(8), borderWidth: 1.5, borderColor: BRAND + "50", backgroundColor: "#f0f7f0", borderRadius: scale(10), padding: scale(10) },
  addressChosenText: { fontSize: scaleFont(13), fontWeight: "700", color: "#171717", lineHeight: moderateScale(17) },
  addressChosenEdit: { fontSize: scaleFont(12), fontWeight: "800", color: BRAND, marginTop: scale(3) },

  addPhoneBtn: { flexDirection: "row", alignItems: "center", gap: scale(4), backgroundColor: "#eef7ee", borderWidth: 1, borderColor: BRAND + "40", borderRadius: scale(8), paddingHorizontal: scale(8), paddingVertical: scale(5) },
  addPhoneBtnDisabled: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  addPhoneText: { fontSize: scaleFont(12), fontWeight: "800", color: BRAND },
  phoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8), padding: scale(10) },
  phoneGridItem: { width: "47%" },
  phoneBox: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: scale(10), backgroundColor: "#f9fafb", overflow: "hidden" },
  phoneBoxError: { borderColor: "#f87171" },
  phonePrefix: { fontSize: scaleFont(11.5), fontWeight: "800", color: "#374151", paddingHorizontal: scale(6), borderRightWidth: 1, borderRightColor: "#e5e7eb", paddingVertical: scale(11) },
  phoneInput: { flex: 1, paddingHorizontal: scale(6), paddingVertical: scale(11), fontSize: scaleFont(13), color: "#171717" },
  fieldError: { fontSize: scaleFont(11.5), color: "#dc2626", fontWeight: "700", paddingLeft: scale(2) },

  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(12), paddingVertical: scale(10), borderTopWidth: 1, borderTopColor: "#f5f5f5" },
  summaryLabel: { fontSize: scaleFont(12.5), color: "#737373", fontWeight: "600" },
  summaryValue: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#171717" },

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
    paddingHorizontal: scale(16),
    paddingTop: scale(10),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomLabel: { fontSize: scaleFont(11), fontWeight: "800", color: "#9ca3af", letterSpacing: 0.6 },
  bottomValue: { fontSize: scaleFont(22), fontWeight: "900", color: BRAND },
  continueBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: BRAND, borderRadius: scale(12), paddingHorizontal: scale(20), paddingVertical: scale(13) },
  continueBtnText: { fontSize: scaleFont(14.5), fontWeight: "800", color: "#fff" },
});
