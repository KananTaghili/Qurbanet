import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, Clock, ArrowRight, AlertTriangle } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import OrderStepHeader from "../components/OrderStepHeader";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";
const TIME_SLOTS = ["12:00-15:00", "15:00-18:00", "18:00-21:00"];

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function Section({ label, Icon, error, children }) {
  return (
    <View style={[styles.section, error && styles.sectionError]}>
      <View style={[styles.sectionHead, error && styles.sectionHeadError]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
          {Icon ? <Icon size={12} color={error ? "#ef4444" : "#9ca3af"} /> : null}
          <Text style={[styles.sectionLabel, error && { color: "#ef4444" }]}>{label}</Text>
        </View>
        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4) }}>
            <AlertTriangle size={11} color="#ef4444" />
            <Text style={styles.sectionErrorText}>{error}</Text>
          </View>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

function OptionRow({ selected, onPress, label, sub, subGreen }) {
  return (
    <Pressable style={[styles.opt, selected && styles.optSelected]} onPress={onPress}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.optLabel, selected && { color: BRAND }]}>{label}</Text>
        {sub ? <Text style={[styles.optSub, { color: subGreen ? "#059669" : BRAND }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

function WeightPill({ w, selected, onPress }) {
  const lbl = w.labelAz || w.label || w.key;
  return (
    <Pressable style={[styles.weightPill, selected && styles.weightPillSelected]} onPress={onPress}>
      <Text style={[styles.weightPillLabel, selected && { color: BRAND }]}>{lbl} — {w.price} AZN</Text>
    </Pressable>
  );
}

export default function OrderQuantityScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { animal, deliveryWindows: dwFromParams } = route.params || {};
  const { lang } = useLanguage();

  const [qty, setQty] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [cutStyles, setCutStyles] = useState({});
  const [headBuckets, setHeadBuckets] = useState({});
  const [feetBuckets, setFeetBuckets] = useState({});
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTomorrow);
  const [timeSlot, setTimeSlot] = useState((dwFromParams && dwFromParams[0]) || TIME_SLOTS[0]);
  const [maxSlaughterDays, setMaxSlaughterDays] = useState(14);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const deliveryWindows = dwFromParams?.length ? dwFromParams : TIME_SLOTS;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("light").catch(() => {});
      NavigationBar.setBackgroundColorAsync(BRAND).catch(() => {});
    }, [])
  );

  useEffect(() => {
    const effectiveCutStyles = animal?.cutStyleOptions || [];
    const initCut = {};
    effectiveCutStyles.forEach((c) => { initCut[c.key] = 0; });
    setCutStyles(initCut);

    const initHead = {};
    (animal?.headOptions || []).filter((o) => o.isActive !== false).forEach((o) => { initHead[o.key] = 0; });
    setHeadBuckets(initHead);

    const initFeet = {};
    (animal?.feetOptions || []).filter((o) => o.isActive !== false).forEach((o) => { initFeet[o.key] = 0; });
    setFeetBuckets(initFeet);

    const ws = animal?.weightOptions || [];
    if (ws.length > 0) setSelectedWeight(ws[0]);
  }, [animal]);

  useEffect(() => {
    api.get("/app-config/settings")
      .then((res) => {
        const d = res.data?.data;
        if (d?.maxSlaughterDays > 0) setMaxSlaughterDays(d.maxSlaughterDays);
      })
      .catch(() => {});
  }, []);

  if (!animal) {
    return (
      <View style={styles.root}>
        <Text style={{ padding: scale(20) }}>{t(lang, "qty_animalNotFound")}</Text>
      </View>
    );
  }

  const maxQty = Number(animal.maxQuantity) || 1;
  const isSingle = maxQty === 1;
  const effectiveCutStyles = animal.cutStyleOptions || [];
  const weights = animal.weightOptions || [];
  const effectivePrice = selectedWeight ? selectedWeight.price : (animal.pricePerShare || 0);
  const animalSharePrice = effectivePrice * qty;

  const activeHeadOptions = (animal.headOptions || []).filter((o) => o.isActive !== false);
  const headFee = animal.hasHeadOption !== false
    ? activeHeadOptions.reduce((sum, o) => sum + (headBuckets[o.key] || 0) * (o.fee || 0), 0)
    : 0;
  const cutStyleFee = effectiveCutStyles.reduce((sum, cs) => sum + (cutStyles[cs.key] || 0) * (cs.fee || 0), 0);
  const totalPrice = (animalSharePrice + headFee + cutStyleFee).toFixed(0);
  const totalCutCount = Object.values(cutStyles).reduce((s, v) => s + (v || 0), 0);

  const needsHead = animal.hasHeadOption !== false && activeHeadOptions.length > 0;
  const headTotal = needsHead ? qty : 0;
  const feetTotal = (animal.hasFeetOption !== false && (animal.feetOptions || []).length > 0) ? qty * 4 : 0;
  const headAssigned = Object.values(headBuckets).reduce((s, v) => s + v, 0);

  const cutStyleError = submitAttempted && effectiveCutStyles.length > 0 && totalCutCount === 0 ? t(lang, "qty_selectErr") : null;
  const partsError = submitAttempted && needsHead && headAssigned === 0 ? t(lang, "qty_selectErr") : null;

  const dateOptions = useMemo(() => {
    const opts = [];
    for (let i = 1; i <= Math.min(maxSlaughterDays, 14); i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      opts.push(d);
    }
    return opts;
  }, [maxSlaughterDays]);

  const dateLabel = (d) => `${d.getDate()} ${t(lang, "months_short")[d.getMonth()]}`;
  const isTomorrow = (d) => d.toDateString() === getTomorrow().toDateString();

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (effectiveCutStyles.length > 0 && totalCutCount === 0) return;
    if (needsHead && headAssigned === 0) return;
    navigation.navigate("OrderDistribution", {
      animal,
      qty,
      selectedWeight,
      cutStyles,
      headBuckets,
      feetBuckets,
      notes,
      selectedDate,
      timeSlot,
      totalPrice,
      deliveryWindows: dwFromParams,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={1} />

      <ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: scale(16), gap: scale(10) }}>
        <Text style={styles.pageTitle}>{t(lang, "qty_pageTitle")}</Text>

        {/* Animal card */}
        <View style={styles.animalCard}>
          <View style={styles.animalImgWrap}>
            <Image
              source={animal.imageUrl ? { uri: animal.imageUrl } : require("../assets/images/qoyun-fallback.jpg")}
              style={styles.animalImg}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, padding: scale(10), justifyContent: "space-between" }}>
            <View>
              <Text style={styles.animalMuted}>{t(lang, "qty_selectedAnimalLabel")}</Text>
              <Text style={styles.animalName}>{animal.nameAz}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: scale(4), marginTop: scale(3) }}>
                <Text style={styles.animalPrice}>{effectivePrice}</Text>
                <Text style={styles.animalPriceUnit}>AZN{!isSingle ? t(lang, "qty_perUnitSuffix") : ""}</Text>
              </View>
            </View>
            {!isSingle && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: scale(6) }}>
                <Text style={styles.qtyLabel}>{t(lang, "qty_quantityLabel")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <Pressable style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]} onPress={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <Pressable style={[styles.qtyBtn, qty >= maxQty && styles.qtyBtnDisabled]} onPress={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

        {weights.length > 0 && (
          <Section label={t(lang, "qty_weightCategoryLabel")}>
            <View style={styles.pillGrid}>
              {weights.map((w) => (
                <WeightPill
                  key={w.key || w.labelAz}
                  w={w}
                  selected={selectedWeight?.key === w.key}
                  onPress={() => setSelectedWeight(w)}
                />
              ))}
            </View>
          </Section>
        )}

        {effectiveCutStyles.length > 0 && (
          <Section label={t(lang, "qty_cutStyleLabel")} error={cutStyleError}>
            <View style={styles.optGrid}>
              {effectiveCutStyles.map((cs) => (
                <OptionRow
                  key={cs.key}
                  selected={(cutStyles[cs.key] || 0) > 0}
                  onPress={() => {
                    const z = Object.fromEntries(effectiveCutStyles.map((c) => [c.key, 0]));
                    setCutStyles({ ...z, [cs.key]: qty });
                  }}
                  label={cs.labelAz}
                  sub={cs.fee > 0 ? `+${cs.fee * qty} AZN` : t(lang, "dist_freeLabel")}
                  subGreen={cs.fee === 0}
                />
              ))}
            </View>
          </Section>
        )}

        {needsHead && (
          <Section label={t(lang, "qty_headFeetLabel")} error={partsError}>
            <View style={styles.optGrid}>
              {activeHeadOptions.map((opt) => {
                const on = (headBuckets[opt.key] || 0) > 0;
                const fee = opt.fee || 0;
                return (
                  <OptionRow
                    key={opt.key}
                    selected={on}
                    onPress={() => {
                      const hZ = Object.fromEntries(Object.keys(headBuckets).map((k) => [k, 0]));
                      const fZ = Object.fromEntries(Object.keys(feetBuckets).map((k) => [k, 0]));
                      setHeadBuckets({ ...hZ, [opt.key]: headTotal });
                      setFeetBuckets({ ...fZ, [opt.key]: feetTotal });
                    }}
                    label={opt.labelAz}
                    sub={fee > 0 ? `+${fee * qty} AZN` : t(lang, "dist_freeLabel")}
                    subGreen={fee === 0}
                  />
                );
              })}
            </View>
          </Section>
        )}

        <Section label={t(lang, "qty_notesLabel")}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t(lang, "qty_notesPlaceholder")}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        </Section>

        <Section label={t(lang, "qty_slaughterDateLabel")} Icon={CalendarDays}>
          <View style={{ padding: scale(8), gap: scale(8) }}>
            <Pressable
              style={[styles.dateQuickBtn, isTomorrow(selectedDate) && !showDatePicker && styles.dateQuickBtnActive]}
              onPress={() => { setSelectedDate(getTomorrow()); setShowDatePicker(false); }}
            >
              <Text style={[styles.dateQuickLabel, isTomorrow(selectedDate) && !showDatePicker && { color: BRAND }]}>{t(lang, "qty_tomorrow")}</Text>
              <Text style={styles.dateQuickSub}>{dateLabel(getTomorrow())}</Text>
            </Pressable>
            <Pressable style={styles.dateOtherBtn} onPress={() => setShowDatePicker((v) => !v)}>
              <CalendarDays size={14} color={BRAND} />
              <Text style={styles.dateOtherLabel}>
                {!isTomorrow(selectedDate) ? dateLabel(selectedDate) : t(lang, "qty_otherDatePick")}
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: scaleFont(11) }}>{showDatePicker ? "▲" : "▼"}</Text>
            </Pressable>
            {showDatePicker && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: scale(6) }}>
                {dateOptions.map((d) => {
                  const sel = d.toDateString() === selectedDate.toDateString();
                  return (
                    <Pressable
                      key={d.toISOString()}
                      style={[styles.dateCell, sel && styles.dateCellSelected]}
                      onPress={() => { setSelectedDate(d); setShowDatePicker(false); }}
                    >
                      <Text style={[styles.dateCellText, sel && { color: "#fff" }]}>{dateLabel(d)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Section>

        <Section label={t(lang, "qty_deliveryTimeLabel")} Icon={Clock}>
          <View style={styles.timeGrid}>
            {deliveryWindows.map((slot) => (
              <Pressable
                key={slot}
                style={[styles.timeSlot, timeSlot === slot && styles.timeSlotSelected]}
                onPress={() => setTimeSlot(slot)}
              >
                <Text style={[styles.timeSlotText, timeSlot === slot && { color: BRAND }]}>{slot}</Text>
              </Pressable>
            ))}
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.priceBar, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.priceBarLabel}>{t(lang, "qty_totalAmountLabel")}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: scale(4) }}>
            <Text style={styles.priceBarValue}>{totalPrice}</Text>
            <Text style={styles.priceBarUnit}>AZN</Text>
          </View>
        </View>
        <Pressable style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>{t(lang, "continue")}</Text>
          <ArrowRight size={16} color={BRAND} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },
  pageTitle: { fontSize: scaleFont(19), fontWeight: "900", color: "#171717" },

  animalCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: scale(14), overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 },
  animalImgWrap: { width: scale(220), aspectRatio: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: "#e8f5e9" },
  animalImg: { width: "100%", height: "100%" },
  animalMuted: { fontSize: scaleFont(10), fontWeight: "700", letterSpacing: 0.5, color: "#a3a3a3" },
  animalName: { fontSize: scaleFont(17), fontWeight: "900", color: "#171717", marginTop: scale(2) },
  animalPrice: { fontSize: scaleFont(22), fontWeight: "900", color: BRAND },
  animalPriceUnit: { fontSize: scaleFont(12), fontWeight: "600", color: "#a3a3a3" },
  qtyLabel: { fontSize: scaleFont(10), fontWeight: "700", color: "#a3a3a3", letterSpacing: 0.5 },
  qtyBtn: { width: scale(42), height: scale(42), borderRadius: scale(12), backgroundColor: BRAND, alignItems: "center", justifyContent: "center" },
  qtyBtnDisabled: { backgroundColor: "#e5e7eb" },
  qtyBtnText: { color: "#fff", fontSize: scaleFont(21), fontWeight: "800" },
  qtyValue: { width: scale(30), textAlign: "center", fontSize: scaleFont(19), fontWeight: "900", color: BRAND },

  section: { backgroundColor: "#fff", borderRadius: scale(12), overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  sectionError: { borderWidth: 1.5, borderColor: "#f87171" },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(10), paddingVertical: scale(7), borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  sectionHeadError: { backgroundColor: "#fef2f2", borderBottomColor: "#fecaca" },
  sectionLabel: { fontSize: scaleFont(11), fontWeight: "800", letterSpacing: 0.8, color: "#9ca3af" },
  sectionErrorText: { fontSize: scaleFont(11), fontWeight: "800", color: "#ef4444" },

  optGrid: { padding: scale(10), flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  opt: { width: "47%", flexDirection: "row", alignItems: "center", gap: scale(8), borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#f7f8f7", paddingHorizontal: scale(10), paddingVertical: scale(10) },
  optSelected: { borderColor: BRAND, backgroundColor: "#e7f3ea" },
  radio: { width: scale(16), height: scale(16), borderRadius: scale(8), borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: BRAND, backgroundColor: BRAND },
  radioDot: { width: scale(6), height: scale(6), borderRadius: scale(3), backgroundColor: "#fff" },
  optLabel: { fontSize: scaleFont(13.5), fontWeight: "700", color: "#171717" },
  optSub: { fontSize: scaleFont(11.5), fontWeight: "800", marginTop: scale(1) },

  pillGrid: { padding: scale(10), flexDirection: "row", flexWrap: "wrap", gap: scale(6) },
  weightPill: { width: "48%", borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#f7f8f7", paddingHorizontal: scale(10), paddingVertical: scale(10) },
  weightPillSelected: { borderColor: BRAND, backgroundColor: "#e7f3ea" },
  weightPillLabel: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#171717" },

  notesInput: { margin: scale(10), minHeight: scale(70), borderRadius: scale(10), borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", padding: scale(10), fontSize: scaleFont(13), color: "#171717", textAlignVertical: "top" },

  dateQuickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#f7f8f7", paddingHorizontal: scale(14), paddingVertical: scale(11) },
  dateQuickBtnActive: { borderColor: BRAND, backgroundColor: "#e7f3ea" },
  dateQuickLabel: { fontSize: scaleFont(14.5), fontWeight: "800", color: "#171717" },
  dateQuickSub: { fontSize: scaleFont(12), fontWeight: "600", color: "#9ca3af" },
  dateOtherBtn: { flexDirection: "row", alignItems: "center", gap: scale(8), borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#f7f8f7", paddingHorizontal: scale(14), paddingVertical: scale(10) },
  dateOtherLabel: { flex: 1, fontSize: scaleFont(13), fontWeight: "600", color: "#171717" },
  dateCell: { paddingHorizontal: scale(13), paddingVertical: scale(9), borderRadius: scale(8), backgroundColor: "#f7f8f7", borderWidth: 1, borderColor: "#e5e7eb" },
  dateCellSelected: { backgroundColor: BRAND, borderColor: BRAND },
  dateCellText: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#171717" },

  timeGrid: { padding: scale(10), flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  timeSlot: { width: "47%", alignItems: "center", borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#f7f8f7", paddingVertical: scale(11) },
  timeSlotSelected: { borderColor: BRAND, backgroundColor: "#e7f3ea" },
  timeSlotText: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#171717" },

  priceBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  priceBarLabel: { fontSize: scaleFont(10), fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: 1 },
  priceBarValue: { fontSize: scaleFont(28), fontWeight: "900", color: "#fff" },
  priceBarUnit: { fontSize: scaleFont(14), fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  continueBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: "#fff", borderRadius: scale(12), paddingHorizontal: scale(18), paddingVertical: scale(12) },
  continueBtnText: { fontSize: scaleFont(14.5), fontWeight: "800", color: BRAND },
});
