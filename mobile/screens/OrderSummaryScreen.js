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

const BRAND = "#1c5e20";
const AZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
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
  return (
    <View style={[styles.priceItem, sep && styles.priceItemSep]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.priceItemLabel} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={styles.priceItemSub}>{sub}</Text> : null}
      </View>
      <View style={[styles.priceBadge, isFree && styles.priceBadgeFree]}>
        <Text style={[styles.priceBadgeText, isFree && styles.priceBadgeTextFree]}>
          {isFree ? "Pulsuz" : value}
        </Text>
      </View>
    </View>
  );
}

export default function OrderSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
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

  const dateStr = selectedDate
    ? (() => {
        const d = new Date(selectedDate);
        return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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
      if (hCount > 0) parts.push(`${hCount} baş`);
      if (fCount > 0) parts.push(`${fCount} ayaq`);
      return { key, opt, sub: parts.join(" və "), totalFee: opt.fee * (hCount + fCount) };
    })
    .filter(Boolean);

  const infoRows = [
    { label: "Heyvan", value: animal?.nameAz },
    { label: "Miqdar", value: `${qty} ədəd` },
    { label: "Kəsim tarixi", value: dateStr },
    { label: "Çatdırılma vaxtı", value: timeSlot },
    { label: "Çatdırılma növü", value: distLabel },
    ...(distKey === "catdirilsin" && addressLocation ? [{ label: "Ünvan", value: addressLocation.address }] : []),
    ...(!isCharityDist
      ? [
          { label: "Əlaqə", value: [user?.name, user?.lastName].filter(Boolean).join(" ") || "-" },
          { label: "Telefon", value: phones.length ? phones.map((p) => toE164(p)).join("\n") : "Nömrə yoxdur" },
        ]
      : []),
    ...(notes ? [{ label: "Qeyd", value: notes }] : []),
    ...(addressNote ? [{ label: "Ünvan qeydi", value: addressNote }] : []),
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
      Alert.alert("Xəta", err.response?.data?.message || "Sifariş yaradıla bilmədi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={3} />

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 90, gap: 10 }}>
        <Text style={styles.pageTitle}>Sifariş Xülasəsi</Text>

        <View style={styles.card}>
          <View style={styles.cardHeadColored}>
            <Text style={styles.cardHeadColoredLabel}>SİFARİŞ MƏLUMATLARI</Text>
          </View>
          <View>
            {infoRows.map((row, i) => (
              <InfoRow key={row.label} label={row.label} value={row.value} sep={i < infoRows.length - 1} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeadColored}>
            <Text style={styles.cardHeadColoredLabel}>QİYMƏT HESABLAMASI</Text>
          </View>

          <View style={styles.topGrid}>
            <View style={styles.topGridCell}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.topGridTitle} numberOfLines={1}>{animal?.nameAz || "Heyvan"}</Text>
                <Text style={styles.topGridSub}>{qty} ədəd × {qty ? Math.round(animalBasePrice / qty) : 0} AZN</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{animalBasePrice.toFixed(0)} AZN</Text>
              </View>
            </View>
            <View style={[styles.topGridCell, styles.topGridCellRight]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.topGridTitle} numberOfLines={1}>{distLabel || "-"}</Text>
                <Text style={styles.topGridSub}>Çatdırılma növü</Text>
              </View>
              <View style={[styles.priceBadge, distFee === 0 && styles.priceBadgeFree]}>
                <Text style={[styles.priceBadgeText, distFee === 0 && styles.priceBadgeTextFree]}>
                  {distFee === 0 ? "Pulsuz" : `+${distFee} AZN`}
                </Text>
              </View>
            </View>
          </View>

          {(activeCutRows.length > 0 || activePartRows.length > 0) && (
            <View style={styles.midGrid}>
              {activeCutRows.length > 0 && (
                <View style={styles.midGridCell}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionHeadText}>DOĞRAMA ÜSULU</Text>
                  </View>
                  {activeCutRows.map((cs, i) => (
                    <PriceItem
                      key={cs.key}
                      label={cs.labelAz}
                      sub={`${cutStyles[cs.key]} heyvan`}
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
                    <Text style={styles.sectionHeadText}>BAŞ VƏ AYAQLAR</Text>
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
              <Text style={styles.totalLabel}>YEKUN MƏBLƏĞ</Text>
              <Text style={styles.totalSub}>Bütün xidmətlər daxil</Text>
            </View>
            <Text style={styles.totalValue}>{grandTotal.toFixed(0)} AZN</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>Sifarişi təsdiqlə</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },
  pageTitle: { fontSize: 16, fontWeight: "800", color: "#171717" },

  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardHeadColored: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#eef7ee" },
  cardHeadColoredLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6, color: BRAND },

  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  infoRowSep: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  infoLabel: { fontSize: 11.5, color: "#737373", fontWeight: "600", flexShrink: 0 },
  infoValue: { fontSize: 11.5, fontWeight: "800", color: "#171717", textAlign: "right", flexShrink: 1 },

  topGrid: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  topGridCell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, gap: 8 },
  topGridCellRight: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  topGridTitle: { fontSize: 12, fontWeight: "800", color: "#171717" },
  topGridSub: { fontSize: 10, color: "#9ca3af", marginTop: 2 },

  priceBadge: { backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  priceBadgeFree: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  priceBadgeText: { fontSize: 11, fontWeight: "800", color: "#171717" },
  priceBadgeTextFree: { color: "#059669" },

  midGrid: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  midGridCell: { flex: 1 },
  midGridCellRight: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  sectionHead: { backgroundColor: "#fafbfa", paddingHorizontal: 10, paddingVertical: 7 },
  sectionHeadText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5, color: "#9ca3af" },

  priceItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  priceItemSep: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  priceItemLabel: { fontSize: 11, fontWeight: "700", color: "#171717" },
  priceItemSub: { fontSize: 9.5, color: "#9ca3af", marginTop: 1 },

  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#f0f7f0" },
  totalLabel: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.6, color: "#171717" },
  totalSub: { fontSize: 9.5, color: "#9ca3af", marginTop: 2 },
  totalValue: { fontSize: 20, fontWeight: "900", color: BRAND },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: 16, paddingTop: 10, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  confirmBtn: { backgroundColor: BRAND, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
