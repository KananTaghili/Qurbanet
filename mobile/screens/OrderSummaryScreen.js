import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform, Alert } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import OrderStepHeader from "../components/OrderStepHeader";
import { useAuth } from "../context/AuthContext";
import { toE164 } from "../lib/format";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";
const CHARITY_KEYS = ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];

function InfoRow({ label, value, sep = true }) {
  if (!value) return null;
  return (
    <View style={[styles.infoRow, sep && styles.infoRowSep]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PriceItem({ label, sub, value, isFree, sep }) {
  const { lang } = useLanguage();
  return (
    <View style={[styles.priceItem, sep && styles.priceItemSep]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.priceItemLabel} numberOfLines={2}>{label}</Text>
        {sub ? <Text style={styles.priceItemSub}>{sub}</Text> : null}
      </View>
      <View style={[styles.priceBadge, isFree && styles.priceBadgeFree]}>
        <Text style={[styles.priceBadgeText, isFree && styles.priceBadgeTextFree]}>
          {isFree ? t(lang, "dist_freeLabel") : value}
        </Text>
      </View>
    </View>
  );
}

export default function OrderSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user, isGuest } = useAuth();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  // Qonaq (qeydiyyatsız) istifadəçidə ad/soyad olmur — backend bunu tələb
  // edir. Web-dəki /order/contact səhifəsinin analoqu olan bu axına yönləndiririk.
  useFocusEffect(
    useCallback(() => {
      if (isGuest) navigation.replace("OrderContact", route.params);
    }, [isGuest, route.params])
  );

  const {
    animal,
    qty = 1,
    selectedWeight,
    cutStyles = {},
    headBuckets = {},
    feetBuckets = {},
    notes,
    selectedDate,
    timeSlot,
    totalPrice = 0,
    distKey,
    distLabel,
    distFee = 0,
    addressLocation,
    addressNote,
    phones = [],
  } = route.params || {};

  if (isGuest) return null;

  const dateStr = selectedDate
    ? (() => {
        const d = new Date(selectedDate);
        return `${d.getDate()} ${t(lang, "summary_months_full")[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : "-";

  const isCharityDist = CHARITY_KEYS.includes(distKey);

  const effectiveCutStyles = animal?.cutStyleOptions || [];
  const activeHeadOptions = (animal?.headOptions || []).filter((o) => o.isActive !== false);
  const activeFeetOptions = (animal?.feetOptions || []).filter((o) => o.isActive !== false);

  const headFee = activeHeadOptions.reduce((s, o) => s + (headBuckets[o.key] || 0) * (o.fee || 0), 0);
  const feetFee = activeFeetOptions.reduce((s, o) => s + (feetBuckets[o.key] || 0) * (o.fee || 0), 0);
  const cutFee = effectiveCutStyles.reduce((s, cs) => s + (cutStyles[cs.key] || 0) * (cs.fee || 0), 0);
  const animalBasePrice = Math.max(0, (parseFloat(totalPrice) || 0) - headFee - feetFee - cutFee);

  const grandTotal = (parseFloat(totalPrice) || 0) + distFee;

  const activeCutRows = effectiveCutStyles.filter((cs) => (cutStyles[cs.key] || 0) > 0);
  const allPartKeys = [...new Set([...activeHeadOptions.map((o) => o.key), ...activeFeetOptions.map((o) => o.key)])];
  const activePartRows = allPartKeys
    .map((key) => {
      const headOpt = activeHeadOptions.find((o) => o.key === key);
      const feetOpt = activeFeetOptions.find((o) => o.key === key);
      const opt = headOpt || feetOpt;
      const hCount = headBuckets[key] || 0;
      const fCount = feetBuckets[key] || 0;
      if (hCount === 0 && fCount === 0) return null;
      const parts = [];
      if (hCount > 0) parts.push(`${hCount} ${t(lang, "summary_headSuffix")}`);
      if (fCount > 0) parts.push(`${fCount} ${t(lang, "summary_feetSuffix")}`);
      return { key, opt, sub: parts.join(` ${t(lang, "summary_andWord")} `), totalFee: opt.fee * (hCount + fCount) };
    })
    .filter(Boolean);

  const infoRows = [
    { label: t(lang, "summary_animalLabel"), value: animal?.nameAz },
    { label: t(lang, "summary_quantityLabel"), value: `${qty} ${t(lang, "summary_unitSuffix")}` },
    { label: t(lang, "summary_slaughterDateLabel"), value: dateStr },
    { label: t(lang, "summary_deliveryTimeLabel"), value: timeSlot },
    { label: t(lang, "summary_deliveryTypeLabel"), value: distLabel },
    ...(distKey === "catdirilsin" && addressLocation ? [{ label: t(lang, "summary_addressLabel"), value: addressLocation.address }] : []),
    ...(!isCharityDist
      ? [
          { label: t(lang, "summary_contactLabel"), value: [user?.name, user?.lastName].filter(Boolean).join(" ") || "-" },
          { label: t(lang, "summary_phoneLabel"), value: phones.length ? phones.map((p) => toE164(p)).join("\n") : t(lang, "summary_noPhone") },
        ]
      : []),
    ...(notes ? [{ label: t(lang, "summary_noteLabel"), value: notes }] : []),
    ...(addressNote ? [{ label: t(lang, "summary_addressNoteLabel"), value: addressNote }] : []),
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let distributionObj;
      if (distKey === "catdirilsin") {
        distributionObj = {
          type: "catdirilsin",
          location: addressLocation?.address || "",
          coordinates: addressLocation?.coordinates
            ? { lat: addressLocation.coordinates.lat, lng: addressLocation.coordinates.lng }
            : undefined,
        };
      } else if (distKey === "ozum") {
        distributionObj = { type: "ozum" };
      } else {
        distributionObj = { type: distKey || "ozum" };
      }

      const cutStyleAllocations = Object.entries(cutStyles)
        .filter(([, count]) => (count || 0) > 0)
        .map(([key, count]) => ({ key, count }));

      const headTotalCount = Object.values(headBuckets).reduce((s, v) => s + (v || 0), 0);
      const feetTotalCount = Object.values(feetBuckets).reduce((s, v) => s + (v || 0), 0);

      const payload = {
        animalType: animal.type,
        orderMode: "adi",
        quantity: qty,
        slaughterDate: selectedDate ? new Date(selectedDate).toISOString() : null,
        deliveryWindow: timeSlot,
        distribution: distributionObj,
        lambSelection: selectedWeight
          ? { weightCategoryKey: selectedWeight.key, weightCategoryLabel: selectedWeight.labelAz || selectedWeight.label || selectedWeight.key }
          : undefined,
        cutStyle: cutStyleAllocations.length > 0 ? { allocations: cutStyleAllocations } : undefined,
        qurbanParts:
          headTotalCount > 0 || feetTotalCount > 0
            ? {
                headTotalCount,
                headTorchedCount: headBuckets.torched || 0,
                headReadyCount: headBuckets.ready || 0,
                headFreeCount: headBuckets.free || 0,
                headCharityCount: headBuckets.charity || 0,
                feetTotalCount,
                feetTorchedCount: feetBuckets.torched || 0,
                feetReadyCount: feetBuckets.ready || 0,
                feetFreeCount: feetBuckets.free || 0,
                feetCharityCount: feetBuckets.charity || 0,
              }
            : undefined,
        contactInfo: { firstName: user?.name || "", lastName: user?.lastName || "", mobile: phones[0] ? toE164(phones[0]) : undefined },
        selfPickup: distKey === "ozum",
        userNote: notes || undefined,
        deliveryPhones: phones.length ? phones.map((p) => toE164(p)) : undefined,
        addressNote: addressNote || undefined,
      };

      const res = await api.post("/orders", payload);
      if (res.data.success) {
        const createdOrder = res.data.data.order;
        navigation.navigate("OrderPayment", {
          createdOrderId: createdOrder.id || createdOrder._id,
          createdOrder,
          grandTotal,
        });
      }
    } catch (err) {
      Alert.alert(t(lang, "summary_errorTitle"), err.response?.data?.message || t(lang, "summary_errorCreateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={3} />

      <ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: insets.bottom + 90, gap: scale(10) }}>
        <Text style={styles.pageTitle}>{t(lang, "summary_pageTitle")}</Text>

        <View style={styles.card}>
          <View style={styles.cardHeadColored}>
            <Text style={styles.cardHeadColoredLabel}>{t(lang, "summary_orderInfoLabel")}</Text>
          </View>
          <View>
            {infoRows.map((row, i) => (
              <InfoRow key={row.label} label={row.label} value={row.value} sep={i < infoRows.length - 1} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeadColored}>
            <Text style={styles.cardHeadColoredLabel}>{t(lang, "summary_priceCalcLabel")}</Text>
          </View>

          <View style={styles.topGrid}>
            <View style={styles.topGridCell}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.topGridTitle} numberOfLines={2}>{animal?.nameAz || t(lang, "summary_animalFallback")}</Text>
                <Text style={styles.topGridSub}>{qty} {t(lang, "summary_unitSuffix")} × {qty ? Math.round(animalBasePrice / qty) : 0} AZN</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{animalBasePrice.toFixed(0)} AZN</Text>
              </View>
            </View>
            <View style={[styles.topGridCell, styles.topGridCellRight]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.topGridTitle} numberOfLines={2}>{distLabel || "-"}</Text>
                <Text style={styles.topGridSub}>{t(lang, "summary_deliveryTypeSub")}</Text>
              </View>
              <View style={[styles.priceBadge, distFee === 0 && styles.priceBadgeFree]}>
                <Text style={[styles.priceBadgeText, distFee === 0 && styles.priceBadgeTextFree]}>
                  {distFee === 0 ? t(lang, "dist_freeLabel") : `+${distFee} AZN`}
                </Text>
              </View>
            </View>
          </View>

          {(activeCutRows.length > 0 || activePartRows.length > 0) && (
            <View style={styles.midGrid}>
              {activeCutRows.length > 0 && (
                <View style={styles.midGridCell}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionHeadText}>{t(lang, "qty_cutStyleLabel")}</Text>
                  </View>
                  {activeCutRows.map((cs, i) => (
                    <PriceItem
                      key={cs.key}
                      label={cs.labelAz}
                      sub={`${cutStyles[cs.key]} ${t(lang, "summary_animalCountSuffix")}`}
                      value={`+${cs.fee * cutStyles[cs.key]} AZN`}
                      isFree={cs.fee === 0}
                      sep={i < activeCutRows.length - 1}
                    />
                  ))}
                </View>
              )}
              {activePartRows.length > 0 && (
                <View style={[styles.midGridCell, styles.midGridCellRight]}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionHeadText}>{t(lang, "qty_headFeetLabel")}</Text>
                  </View>
                  {activePartRows.map((r, i) => (
                    <PriceItem
                      key={r.key}
                      label={r.opt.labelAz}
                      sub={r.sub}
                      value={`+${r.totalFee} AZN`}
                      isFree={r.opt.fee === 0}
                      sep={i < activePartRows.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>{t(lang, "summary_finalAmountLabel")}</Text>
              <Text style={styles.totalSub}>{t(lang, "summary_allServicesIncluded")}</Text>
            </View>
            <Text style={styles.totalValue}>{grandTotal.toFixed(0)} AZN</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>{t(lang, "summary_confirmBtn")}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },
  pageTitle: { fontSize: scaleFont(21), fontWeight: "900", color: "#171717" },

  card: { backgroundColor: "#fff", borderRadius: scale(12), overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardHeadColored: { paddingHorizontal: scale(12), paddingVertical: scale(11), backgroundColor: "#eef7ee" },
  cardHeadColoredLabel: { fontSize: scaleFont(13), fontWeight: "800", letterSpacing: 0.6, color: BRAND },

  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: scale(12), paddingVertical: scale(10), gap: scale(10) },
  infoRowSep: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  infoLabel: { fontSize: scaleFont(14.5), color: "#737373", fontWeight: "600", flexShrink: 0 },
  infoValue: { fontSize: scaleFont(14.5), fontWeight: "800", color: "#171717", textAlign: "right", flexShrink: 1 },

  topGrid: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  topGridCell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: scale(12), gap: scale(8) },
  topGridCellRight: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  topGridTitle: { fontSize: scaleFont(15), fontWeight: "800", color: "#171717" },
  topGridSub: { fontSize: scaleFont(12.5), color: "#9ca3af", marginTop: scale(2) },

  priceBadge: { backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: scale(8), paddingHorizontal: scale(10), paddingVertical: scale(7) },
  priceBadgeFree: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  priceBadgeText: { fontSize: scaleFont(14), fontWeight: "800", color: "#171717" },
  priceBadgeTextFree: { color: "#059669" },

  midGrid: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  midGridCell: { flex: 1 },
  midGridCellRight: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  sectionHead: { backgroundColor: "#fafbfa", paddingHorizontal: scale(10), paddingVertical: scale(8) },
  sectionHeadText: { fontSize: scaleFont(11.5), fontWeight: "800", letterSpacing: 0.5, color: "#9ca3af" },

  priceItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(10), paddingVertical: scale(10), gap: scale(6) },
  priceItemSep: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  priceItemLabel: { fontSize: scaleFont(14), fontWeight: "700", color: "#171717" },
  priceItemSub: { fontSize: scaleFont(12), color: "#9ca3af", marginTop: scale(1) },

  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(14), paddingVertical: scale(16), backgroundColor: "#f0f7f0" },
  totalLabel: { fontSize: scaleFont(13), fontWeight: "900", letterSpacing: 0.6, color: "#171717" },
  totalSub: { fontSize: scaleFont(12), color: "#9ca3af", marginTop: scale(2) },
  totalValue: { fontSize: scaleFont(26), fontWeight: "900", color: BRAND },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: scale(16), paddingTop: scale(10), shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  confirmBtn: { backgroundColor: BRAND, borderRadius: scale(12), paddingVertical: scale(16), alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: scaleFont(17), fontWeight: "800", color: "#fff" },
});
