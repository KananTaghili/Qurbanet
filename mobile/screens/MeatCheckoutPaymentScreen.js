import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CreditCard, Lock, X } from "lucide-react-native";
import MeatStepHeader from "../components/meat/MeatStepHeader";
import { useMeatCart } from "../context/MeatCartContext";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";

// Qurbanlıq axınındakı OrderPaymentScreen.js ilə eyni üsul — Epoint TƏTBİQ
// DAXİLİNDƏ, gömülü <WebView> ilə açılır (xarici brauzerə/başqa tətbiqə heç
// vaxt çıxmır). Naviqasiya "nəticə" URL-inə çatan kimi (backend Epoint-dən
// sonra frontend-in /meat/checkout/confirmation və ya
// /meat/checkout/payment?payment=fail səhifəsinə yönləndirir) avtomatik tutulur.
function isResultUrl(u) {
  if (!u) return false;
  const low = u.toLowerCase();
  if (low.includes("epoint") || low.includes("pashabank") || low.includes("/api/")) return false;
  return low.includes("meat/checkout") || low.includes("payment=");
}

function isSuccessUrl(u) {
  return u.toLowerCase().includes("/meat/checkout/confirmation");
}

export default function MeatCheckoutPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { orderId, totalPrice, autoPay } = route.params || {};
  const { clearCart } = useMeatCart();
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState(null);
  const finishedRef = useRef(false);
  const autoPayTriedRef = useRef(false);

  useEffect(() => {
    if (!orderId) navigation.replace("MeatHome");
  }, [orderId]);

  useEffect(() => {
    if (Platform.OS !== "android" || !payUrl) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPayUrl(null);
      return true;
    });
    return () => sub.remove();
  }, [payUrl]);

  const handlePay = useCallback(async () => {
    if (!orderId) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/meat/orders/${orderId}/epoint/start`);
      if (res.data.success) {
        finishedRef.current = false;
        setPayUrl(res.data.data.redirect_url);
      } else {
        setError(res.data.message || t(lang, "meatPay_startFailed"));
      }
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "meatPay_startFailed"));
    }
    setLoading(false);
  }, [orderId]);

  // Səbətdən birbaşa gələndə ("Ət Satışı"nda xülasə addımı olmadan) ödəniş
  // ekranı açılan kimi Epoint-i avtomatik başladır — istifadəçi ayrıca
  // "ödə" düyməsinə basmır (veb-in "birbaşa Epoint-ə keçid" davranışı).
  useFocusEffect(
    useCallback(() => {
      if (autoPay && !autoPayTriedRef.current) {
        autoPayTriedRef.current = true;
        handlePay();
      }
    }, [autoPay, handlePay]),
  );

  const handleWebViewNav = (navState) => {
    if (finishedRef.current) return;
    if (isResultUrl(navState.url)) {
      finishedRef.current = true;
      setPayUrl(null);
      if (isSuccessUrl(navState.url)) {
        clearCart();
        navigation.replace("MeatOrderDetail", { orderId });
      } else {
        setError(t(lang, "donateModal_paymentFailed"));
      }
    }
  };

  if (!orderId) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MeatStepHeader currentStep={3} backTo="MeatCheckoutSummary" />

      <View style={{ padding: scale(14), gap: scale(12) }}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t(lang, "meatPay_amountLabel")}</Text>
          <Text style={styles.amountValue}>{totalPrice} AZN</Text>
        </View>

        <View style={styles.infoRow}>
          <CreditCard size={23} color={BRAND} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t(lang, "meatPay_cardTitle")}</Text>
            <Text style={styles.infoSub}>{t(lang, "meatPay_cardSub")}</Text>
          </View>
        </View>

        <View style={styles.lockNotice}>
          <Lock size={17} color="#2563eb" style={{ marginTop: scale(1) }} />
          <Text style={styles.lockNoticeText}>
            {t(lang, "meatPay_lockNotice")}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable style={[styles.payBtn, loading && styles.payBtnDisabled]} onPress={handlePay} disabled={loading}>
          <Text style={styles.payBtnText}>{loading ? t(lang, "meatPay_redirecting") : t(lang, "meatPay_payAmountTemplate").replace("{amount}", totalPrice)}</Text>
        </Pressable>
      </View>

      {!!payUrl && (
        <View style={styles.webviewOverlay}>
          <StatusBar style="dark" />
          <View style={[styles.webviewHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.webviewCloseBtn} onPress={() => setPayUrl(null)}>
              <X size={18} color="#374151" />
            </Pressable>
            <Text style={styles.webviewTitle}>{t(lang, "meatPay_webviewTitle")}</Text>
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
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  amountCard: { borderRadius: scale(18), backgroundColor: BRAND, paddingHorizontal: scale(24), paddingVertical: scale(24), alignItems: "center" },
  amountLabel: { fontSize: scaleFont(13), fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: scale(5) },
  amountValue: { fontSize: scaleFont(38), fontWeight: "900", color: "#fff", letterSpacing: -0.5 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: scale(13), borderRadius: scale(16), borderWidth: 1, borderColor: "#f0ede8", backgroundColor: "#fff", padding: scale(16) },
  infoTitle: { fontSize: scaleFont(16), fontWeight: "800", color: "#292524" },
  infoSub: { fontSize: scaleFont(14), color: "#a8a29e", marginTop: scale(3) },

  lockNotice: { flexDirection: "row", alignItems: "flex-start", gap: scale(10), borderRadius: scale(12), borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", paddingHorizontal: scale(14), paddingVertical: scale(12) },
  lockNoticeText: { flex: 1, fontSize: scaleFont(14), color: "#1d4ed8" },

  errorBox: { borderRadius: scale(12), borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", paddingHorizontal: scale(14), paddingVertical: scale(12) },
  errorText: { color: "#b91c1c", fontSize: scaleFont(15), fontWeight: "700" },

  payBtn: { height: scale(56), borderRadius: scale(14), backgroundColor: BRAND, alignItems: "center", justifyContent: "center" },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: "#fff", fontSize: scaleFont(16.5), fontWeight: "800" },

  webviewOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 50, elevation: 50 },
  webviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(14), paddingBottom: scale(10), borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  webviewCloseBtn: { width: scale(32), height: scale(32), borderRadius: scale(8), borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8f9fb", alignItems: "center", justifyContent: "center" },
  webviewTitle: { fontSize: scaleFont(13), fontWeight: "800", color: "#171717" },
  webviewLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
