import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Linking, AppState, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { CreditCard, Lock } from "lucide-react-native";
import MeatStepHeader from "../components/meat/MeatStepHeader";
import { useMeatCart } from "../context/MeatCartContext";
import api from "../lib/api";

const BRAND = "#4B0F0F";

// Veb-dəki lib/nativePay.js Capacitor-un daxili WebView-ında ödəniş
// səhifəsinin naviqasiyasını izləyib nəticəni avtomatik tuta bilir — bu, sırf
// Capacitor APK-ya xasdır. Expo-da (bu layihə) həmin plaginin qarşılığı
// yoxdur, ona görə Epoint-i cihazın öz brauzerində (Linking.openURL) açırıq.
// İstifadəçi ödənişi tamamlayıb tətbiqə qayıdanda (AppState "active" olanda)
// sifarişi yenidən yoxlayıb nəticəni özümüz müəyyən edirik.
export default function MeatCheckoutPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, totalPrice } = route.params || {};
  const { clearCart } = useMeatCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingReturn, setCheckingReturn] = useState(false);
  const awaitingReturnRef = useRef(false);

  useEffect(() => {
    if (!orderId) navigation.replace("MeatHome");
  }, [orderId]);

  const checkOrderStatus = useCallback(async () => {
    if (!orderId) return;
    setCheckingReturn(true);
    try {
      const res = await api.get(`/meat/orders/${orderId}`);
      const order = res.data?.data?.order;
      if (order?.payment?.status === "paid") {
        clearCart();
        navigation.replace("MeatOrderDetail", { orderId: order._id });
        return;
      }
      if (order?.payment?.status === "failed" || order?.status === "cancelled") {
        setError("Ödəniş uğursuz oldu. Yenidən cəhd edin.");
      }
    } catch (_) {
      /* sükutla keç — istifadəçi düyməni yenidən basa bilər */
    } finally {
      setCheckingReturn(false);
    }
  }, [orderId, clearCart, navigation]);

  // Brauzerdən tətbiqə qayıdışı tutmaq üçün — yalnız BİZ brauzeri açdıqdan
  // sonra (awaitingReturnRef) "active" olan zaman sifarişi yoxlayır.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && awaitingReturnRef.current) {
        awaitingReturnRef.current = false;
        checkOrderStatus();
      }
    });
    return () => sub.remove();
  }, [checkOrderStatus]);

  useFocusEffect(
    useCallback(() => {
      checkOrderStatus();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (!orderId) return null;

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/meat/orders/${orderId}/epoint/start`);
      if (res.data.success) {
        awaitingReturnRef.current = true;
        await Linking.openURL(res.data.data.redirect_url);
        setLoading(false);
        return;
      }
      setError(res.data.message || "Ödəniş başladıla bilmədi.");
    } catch (err) {
      setError(err.response?.data?.message || "Ödəniş başladıla bilmədi.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MeatStepHeader currentStep={3} />

      <View style={{ padding: 14, gap: 12 }}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Ödəniləcək məbləğ</Text>
          <Text style={styles.amountValue}>{totalPrice} AZN</Text>
        </View>

        <View style={styles.infoRow}>
          <CreditCard size={23} color={BRAND} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Bank kartı ilə ödəniş</Text>
            <Text style={styles.infoSub}>Visa, MasterCard — Epoint təhlükəsiz ödəniş sistemi</Text>
          </View>
        </View>

        <View style={styles.lockNotice}>
          <Lock size={17} color="#2563eb" style={{ marginTop: 1 }} />
          <Text style={styles.lockNoticeText}>
            Kart məlumatlarınız Epoint tərəfindən şifrələnərək qorunur.
          </Text>
        </View>

        {checkingReturn && (
          <View style={styles.checkingRow}>
            <ActivityIndicator size="small" color={BRAND} />
            <Text style={styles.checkingText}>Ödəniş nəticəsi yoxlanılır...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable style={[styles.payBtn, loading && styles.payBtnDisabled]} onPress={handlePay} disabled={loading}>
          <Text style={styles.payBtnText}>{loading ? "Yönləndirilir..." : `${totalPrice} AZN ödə`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  amountCard: { borderRadius: 18, backgroundColor: BRAND, paddingHorizontal: 24, paddingVertical: 24, alignItems: "center" },
  amountLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 },
  amountValue: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 16, borderWidth: 1, borderColor: "#f0ede8", backgroundColor: "#fff", padding: 16 },
  infoTitle: { fontSize: 16, fontWeight: "800", color: "#292524" },
  infoSub: { fontSize: 14, color: "#a8a29e", marginTop: 3 },

  lockNotice: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", paddingHorizontal: 14, paddingVertical: 12 },
  lockNoticeText: { flex: 1, fontSize: 14, color: "#1d4ed8" },

  checkingRow: { flexDirection: "row", alignItems: "center", gap: 9, justifyContent: "center" },
  checkingText: { fontSize: 14.5, color: "#78716C", fontWeight: "600" },

  errorBox: { borderRadius: 12, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", paddingHorizontal: 14, paddingVertical: 12 },
  errorText: { color: "#b91c1c", fontSize: 15, fontWeight: "700" },

  payBtn: { height: 56, borderRadius: 14, backgroundColor: BRAND, alignItems: "center", justifyContent: "center" },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: "#fff", fontSize: 16.5, fontWeight: "800" },
});
