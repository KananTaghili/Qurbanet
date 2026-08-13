import { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { CreditCard, Lock, X } from "lucide-react-native";
import OrderStepHeader from "../components/OrderStepHeader";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

function isResultUrl(u) {
  if (!u) return false;
  const low = u.toLowerCase();
  if (low.includes("epoint") || low.includes("pashabank") || low.includes("/api/")) return false;
  return (
    low.includes("meatbox") ||
    low.includes("paymentdone") ||
    low.includes("payment=") ||
    low.includes("/order/confirmation") ||
    low.includes("/order/error")
  );
}

function isSuccessUrl(u) {
  return u.toLowerCase().includes("/order/confirmation");
}

function PayMethodOption({ selected, onPress, Icon, label, sub }) {
  return (
    <Pressable style={[styles.methodOpt, selected && styles.methodOptSelected]} onPress={onPress}>
      <Icon size={20} color={selected ? BRAND : "#737373"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.methodLabel}>{label}</Text>
        {sub ? <Text style={styles.methodSub}>{sub}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function OrderPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { createdOrderId, createdOrder, grandTotal = 0 } = route.params || {};
  const { lang } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android" || !payUrl) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPayUrl(null);
      return true;
    });
    return () => sub.remove();
  }, [payUrl]);

  const amount = Number(createdOrder?.totalPrice || grandTotal || 0);

  const breakdownRows = (() => {
    if (!createdOrder) return [];
    const rows = [];
    const basePrice = Number(createdOrder.pricePerUnit || 0);
    const qty = createdOrder.orderMode === "serikli" ? Number(createdOrder.sharedPortion || 1) : Number(createdOrder.quantity || 1);
    rows.push({ label: `${createdOrder.animalNameAz} (${qty} ${t(lang, "summary_unitSuffix")} × ${basePrice} AZN)`, value: Number((basePrice * qty).toFixed(2)) });
    const cutExtra = Number(createdOrder.cutStyle?.extraFee || 0);
    if (cutExtra > 0) rows.push({ label: t(lang, "payment_cutExtraLabel"), value: cutExtra });
    const partsExtra = Number(((createdOrder.qurbanParts?.headFee || 0) + (createdOrder.qurbanParts?.feetFee || 0)).toFixed(2));
    if (partsExtra > 0) rows.push({ label: t(lang, "payment_partsExtraLabel"), value: partsExtra });
    const delFee = Number(createdOrder.deliveryFee || 0);
    rows.push(delFee > 0 ? { label: t(lang, "dist_deliveryLabel"), value: delFee } : { label: t(lang, "dist_deliveryLabel"), free: true });
    return rows;
  })();

  const handleWebViewNav = (navState) => {
    if (finishedRef.current) return;
    if (isResultUrl(navState.url)) {
      finishedRef.current = true;
      setPayUrl(null);
      if (isSuccessUrl(navState.url)) {
        navigation.reset({ index: 0, routes: [{ name: "OrderConfirmation", params: { createdOrder } }] });
      } else {
        setError(t(lang, "payment_paymentFailed"));
      }
    }
  };

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/orders/${createdOrderId}/epoint/start`);
      if (res.data.success) {
        finishedRef.current = false;
        setPayUrl(res.data.data.redirect_url);
      } else {
        setError(res.data.message || t(lang, "payment_paymentFailedShort"));
      }
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "payment_paymentFailedShort"));
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={3} />

      <ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: insets.bottom + 90, gap: scale(10) }}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t(lang, "payment_amountDueLabel")}</Text>
          <Text style={styles.amountValue}>{amount.toFixed(2)} AZN</Text>
        </View>

        {breakdownRows.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadLabel}>{t(lang, "payment_priceBreakdownLabel")}</Text>
            </View>
            {breakdownRows.map((row, i) => (
              <View key={i} style={[styles.breakdownRow, i < breakdownRows.length - 1 && styles.breakdownRowSep]}>
                <Text style={styles.breakdownLabel} numberOfLines={2}>{row.label}</Text>
                <Text style={[styles.breakdownValue, row.free && { color: "#059669" }]}>
                  {row.free ? t(lang, "dist_freeLabel") : `${row.value?.toFixed(2)} AZN`}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t(lang, "payment_totalLabel")}</Text>
              <Text style={styles.totalValue}>{amount.toFixed(2)} AZN</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadLabel}>{t(lang, "payment_methodLabel")}</Text>
          </View>
          <View style={{ padding: scale(10) }}>
            <PayMethodOption
              selected
              onPress={() => {}}
              Icon={CreditCard}
              label={t(lang, "payment_cardMethodLabel")}
              sub={t(lang, "payment_cardMethodSub")}
            />
          </View>
        </View>

        <View style={styles.infoBoxBlue}>
          <Lock size={15} color="#2563eb" />
          <Text style={styles.infoTextBlue}>{t(lang, "payment_secureInfo")}</Text>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handlePay} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>{t(lang, "payment_payWithCardTemplate").replace("{amount}", amount.toFixed(2))}</Text>
          )}
        </Pressable>
      </View>

      {!!payUrl && (
        <View style={styles.webviewOverlay}>
          <StatusBar style="dark" />
          <View style={[styles.webviewHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.webviewCloseBtn} onPress={() => setPayUrl(null)}>
              <X size={20} color="#374151" />
            </Pressable>
            <Text style={styles.webviewTitle}>{t(lang, "payment_webviewTitle")}</Text>
            <View style={{ width: scale(32) }} />
          </View>
          <WebView
            style={{ flex: 1 }}
            source={{ uri: payUrl }}
            onNavigationStateChange={handleWebViewNav}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={BRAND} />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },

  amountCard: { backgroundColor: BRAND, borderRadius: scale(16), paddingVertical: scale(22), paddingHorizontal: scale(16), alignItems: "center" },
  amountLabel: { fontSize: scaleFont(12), fontWeight: "700", color: "rgba(255,255,255,0.75)", letterSpacing: 0.8, marginBottom: scale(7) },
  amountValue: { fontSize: scaleFont(36), fontWeight: "900", color: "#fff", letterSpacing: -0.5 },

  card: { backgroundColor: "#fff", borderRadius: scale(12), overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardHead: { paddingHorizontal: scale(12), paddingVertical: scale(11), borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fafbfa" },
  cardHeadLabel: { fontSize: scaleFont(12), fontWeight: "800", letterSpacing: 0.6, color: "#9ca3af" },

  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(12), paddingVertical: scale(11), gap: scale(10) },
  breakdownRowSep: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  breakdownLabel: { fontSize: scaleFont(13), color: "#737373", flex: 1 },
  breakdownValue: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#171717" },

  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(14), paddingVertical: scale(15), backgroundColor: "#f0f7f0" },
  totalLabel: { fontSize: scaleFont(13), fontWeight: "900", letterSpacing: 0.6, color: "#171717" },
  totalValue: { fontSize: scaleFont(22), fontWeight: "900", color: BRAND },

  methodOpt: { flexDirection: "row", alignItems: "center", gap: scale(11), borderRadius: scale(10), borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff", paddingHorizontal: scale(13), paddingVertical: scale(12) },
  methodOptSelected: { borderColor: BRAND, backgroundColor: "#f0f7f0" },
  methodLabel: { fontSize: scaleFont(15), fontWeight: "700", color: "#171717" },
  methodSub: { fontSize: scaleFont(12.5), color: "#9ca3af", marginTop: scale(2) },
  radio: { width: scale(18), height: scale(18), borderRadius: scale(9), borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: BRAND },
  radioDot: { width: scale(9), height: scale(9), borderRadius: scale(5), backgroundColor: BRAND },

  infoBoxBlue: { flexDirection: "row", alignItems: "flex-start", gap: scale(8), backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: scale(10), padding: scale(11) },
  infoTextBlue: { flex: 1, fontSize: scaleFont(13), color: "#1d4ed8", lineHeight: moderateScale(18) },

  errorBanner: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: scale(10), paddingHorizontal: scale(12), paddingVertical: scale(11) },
  errorBannerText: { fontSize: scaleFont(13), fontWeight: "700", color: "#dc2626" },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: scale(16), paddingTop: scale(10), shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  confirmBtn: { backgroundColor: BRAND, borderRadius: scale(12), paddingVertical: scale(16), alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: scaleFont(16), fontWeight: "800", color: "#fff" },

  webviewOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 50, elevation: 50 },
  webviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(14), paddingBottom: scale(10), borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  webviewCloseBtn: { width: scale(34), height: scale(34), borderRadius: scale(9), borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8f9fb", alignItems: "center", justifyContent: "center" },
  webviewTitle: { fontSize: scaleFont(15), fontWeight: "800", color: "#171717" },
  webviewLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
