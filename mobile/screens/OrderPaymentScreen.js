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
      <Icon size={18} color={selected ? BRAND : "#737373"} />
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
    rows.push({ label: `${createdOrder.animalNameAz} (${qty} ədəd × ${basePrice} AZN)`, value: Number((basePrice * qty).toFixed(2)) });
    const cutExtra = Number(createdOrder.cutStyle?.extraFee || 0);
    if (cutExtra > 0) rows.push({ label: "Doğrama əlavəsi", value: cutExtra });
    const partsExtra = Number(((createdOrder.qurbanParts?.headFee || 0) + (createdOrder.qurbanParts?.feetFee || 0)).toFixed(2));
    if (partsExtra > 0) rows.push({ label: "Baş və ayaq əlavəsi", value: partsExtra });
    const delFee = Number(createdOrder.deliveryFee || 0);
    rows.push(delFee > 0 ? { label: "Çatdırılma", value: delFee } : { label: "Çatdırılma", free: true });
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
        setError("Ödəniş uğursuz oldu. Yenidən cəhd edin.");
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
        setError(res.data.message || "Ödəniş uğursuz oldu.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Ödəniş uğursuz oldu.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={3} />

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 90, gap: 10 }}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>ÖDƏNİLMƏLİ MƏBLƏĞ</Text>
          <Text style={styles.amountValue}>{amount.toFixed(2)} AZN</Text>
        </View>

        {breakdownRows.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadLabel}>QİYMƏT TƏRKİBİ</Text>
            </View>
            {breakdownRows.map((row, i) => (
              <View key={i} style={[styles.breakdownRow, i < breakdownRows.length - 1 && styles.breakdownRowSep]}>
                <Text style={styles.breakdownLabel} numberOfLines={2}>{row.label}</Text>
                <Text style={[styles.breakdownValue, row.free && { color: "#059669" }]}>
                  {row.free ? "Pulsuz" : `${row.value?.toFixed(2)} AZN`}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CƏMİ</Text>
              <Text style={styles.totalValue}>{amount.toFixed(2)} AZN</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadLabel}>ÖDƏNİŞ ÜSULU</Text>
          </View>
          <View style={{ padding: 10 }}>
            <PayMethodOption
              selected
              onPress={() => {}}
              Icon={CreditCard}
              label="Bank Kartı ilə ödə"
              sub="Visa / Mastercard · EPoint · Təhlükəsiz"
            />
          </View>
        </View>

        <View style={styles.infoBoxBlue}>
          <Lock size={13} color="#2563eb" />
          <Text style={styles.infoTextBlue}>Ödəniş tətbiqin içərisindəki təhlükəsiz ödəniş səhifəsində tamamlanacaq.</Text>
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
            <Text style={styles.confirmBtnText}>{amount.toFixed(2)} AZN · Bank Kartı ilə ödə</Text>
          )}
        </Pressable>
      </View>

      {!!payUrl && (
        <View style={styles.webviewOverlay}>
          <StatusBar style="dark" />
          <View style={[styles.webviewHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.webviewCloseBtn} onPress={() => setPayUrl(null)}>
              <X size={18} color="#374151" />
            </Pressable>
            <Text style={styles.webviewTitle}>MeatBox Ödəniş</Text>
            <View style={{ width: 32 }} />
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

  amountCard: { backgroundColor: BRAND, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16, alignItems: "center" },
  amountLabel: { fontSize: 10.5, fontWeight: "700", color: "rgba(255,255,255,0.75)", letterSpacing: 0.8, marginBottom: 6 },
  amountValue: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },

  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardHead: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fafbfa" },
  cardHeadLabel: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.6, color: "#9ca3af" },

  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  breakdownRowSep: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  breakdownLabel: { fontSize: 11, color: "#737373", flex: 1 },
  breakdownValue: { fontSize: 11.5, fontWeight: "800", color: "#171717" },

  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f0f7f0" },
  totalLabel: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.6, color: "#171717" },
  totalValue: { fontSize: 18, fontWeight: "900", color: BRAND },

  methodOpt: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10 },
  methodOptSelected: { borderColor: BRAND, backgroundColor: "#f0f7f0" },
  methodLabel: { fontSize: 12.5, fontWeight: "700", color: "#171717" },
  methodSub: { fontSize: 10.5, color: "#9ca3af", marginTop: 2 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: BRAND },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND },

  infoBoxBlue: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 10, padding: 10 },
  infoTextBlue: { flex: 1, fontSize: 11, color: "#1d4ed8", lineHeight: 15 },

  errorBanner: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  errorBannerText: { fontSize: 11.5, fontWeight: "700", color: "#dc2626" },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: 16, paddingTop: 10, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  confirmBtn: { backgroundColor: BRAND, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: 13.5, fontWeight: "800", color: "#fff" },

  webviewOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 50, elevation: 50 },
  webviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  webviewCloseBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8f9fb", alignItems: "center", justifyContent: "center" },
  webviewTitle: { fontSize: 13, fontWeight: "800", color: "#171717" },
  webviewLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
