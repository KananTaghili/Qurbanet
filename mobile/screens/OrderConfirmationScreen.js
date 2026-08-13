import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Clock, Video, Truck, Store, Home as HomeIcon, Heart, HeartHandshake, Check } from "lucide-react-native";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

function distMeta(lang) {
  return {
    catdirilsin: { Icon: Truck, color: "#1B5E20", bg: "#F0F7F2", label: t(lang, "confirm_distDeliverLabel") },
    ozum: { Icon: Store, color: "#374151", bg: "#F9FAFB", label: t(lang, "confirm_distPickupLabel") },
    ozun_gotur: { Icon: Store, color: "#374151", bg: "#F9FAFB", label: t(lang, "confirm_distPickupLabel") },
    usaqlar_evi: { Icon: HomeIcon, color: "#1B5E20", bg: "#E8F5E9", label: t(lang, "confirm_distChildrensHome") },
    qocalar_evi: { Icon: Heart, color: "#6A1B9A", bg: "#F3E5F5", label: t(lang, "confirm_distElderlyHome") },
    ehtiyac_sahibleri: { Icon: HeartHandshake, color: "#1565C0", bg: "#E3F2FD", label: t(lang, "confirm_distNeedy") },
  };
}

function fmtSlaughterDate(iso, lang) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return `${d.getDate()} ${t(lang, "summary_months_full")[d.getMonth()]} ${d.getFullYear()}`;
}

function InfoCard({ Icon, bg, color, title, sub }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSub}>{sub}</Text>
      </View>
    </View>
  );
}

export default function OrderConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { createdOrder } = route.params || {};
  const { lang } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const orderNumber = createdOrder?.orderNumber || String(createdOrder?._id || "").slice(-6).toUpperCase() || "------";
  const slaughterDateStr = fmtSlaughterDate(createdOrder?.slaughterDate, lang);
  const slaughterTitle = slaughterDateStr ? t(lang, "confirm_slaughterOnTemplate").replace("{date}", slaughterDateStr) : t(lang, "confirm_slaughterIn48h");

  const distType = createdOrder?.distribution?.type;
  const distM = distMeta(lang)[distType];
  const DistIcon = distM?.Icon || Truck;
  const distBg = distM?.bg || "#F0F7F2";
  const distColor = distM?.color || "#1B5E20";
  const distLabel = distM?.label || t(lang, "confirm_distDefaultLabel");

  const orderId = createdOrder?.id || createdOrder?._id;
  const handleGoOrders = () =>
    navigation.reset({
      index: 1,
      routes: [{ name: "Qurban" }, { name: "OrderDetail", params: { orderId } }],
    });
  const handleGoHome = () => navigation.reset({ index: 0, routes: [{ name: "Home" }] });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={{ padding: scale(16), paddingTop: insets.top + 24, paddingBottom: insets.bottom + 150, gap: scale(12) }}>
        <View style={styles.successCircle}>
          <Check size={48} color="#fff" strokeWidth={3} />
        </View>

        <View style={{ alignItems: "center", marginTop: scale(4) }}>
          <Text style={styles.successTitle}>{t(lang, "confirm_successTitle")}</Text>
        </View>

        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>{t(lang, "confirm_orderNumberLabel")}</Text>
          <Text style={styles.orderNumberValue}>#{orderNumber}</Text>
        </View>

        <View style={{ gap: scale(10) }}>
          <InfoCard Icon={Clock} bg="#F0F7F2" color="#1B5E20" title={slaughterTitle} sub={t(lang, "confirm_slaughterSub")} />
          <InfoCard Icon={Video} bg="#EEF4FF" color="#1565C0" title={t(lang, "confirm_videoTitle")} sub={t(lang, "confirm_videoSub")} />
          <InfoCard Icon={DistIcon} bg={distBg} color={distColor} title={t(lang, "confirm_deliveryTitle")} sub={distLabel} />
        </View>

        <View style={styles.duaBox}>
          <Text style={styles.duaText}>{t(lang, "confirm_duaText")}</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={styles.trackBtn} onPress={handleGoOrders}>
          <Text style={styles.trackBtnText}>{t(lang, "confirm_trackBtn")}</Text>
        </Pressable>
        <Pressable style={styles.homeBtn} onPress={handleGoHome}>
          <Text style={styles.homeBtnText}>{t(lang, "confirm_homeBtn")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbf7f2" },

  successCircle: {
    width: scale(112),
    height: scale(112),
    borderRadius: scale(56),
    backgroundColor: BRAND,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  successTitle: { fontSize: scaleFont(20), fontWeight: "900", color: "#171717" },

  orderNumberCard: { backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#eee", padding: scale(18), alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  orderNumberLabel: { fontSize: scaleFont(10.5), fontWeight: "800", letterSpacing: 1, color: "#9ca3af", marginBottom: scale(5) },
  orderNumberValue: { fontSize: scaleFont(28), fontWeight: "900", color: BRAND, letterSpacing: 2 },

  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: scale(10), backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#eee", paddingHorizontal: scale(14), paddingVertical: scale(13), shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  infoIcon: { width: scale(36), height: scale(36), borderRadius: scale(12), alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: scaleFont(13), fontWeight: "800", color: "#171717", marginBottom: scale(2) },
  infoSub: { fontSize: scaleFont(11.5), color: "#737373", lineHeight: moderateScale(16) },

  duaBox: { backgroundColor: "#eef7ee", borderWidth: 1, borderColor: BRAND + "25", borderRadius: scale(16), paddingHorizontal: scale(16), paddingVertical: scale(16), alignItems: "center" },
  duaText: { fontSize: scaleFont(13), fontWeight: "700", color: BRAND, textAlign: "center", lineHeight: moderateScale(20) },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: scale(16), paddingTop: scale(10), gap: scale(10), shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  trackBtn: { backgroundColor: BRAND, borderRadius: scale(14), paddingVertical: scale(13), alignItems: "center", justifyContent: "center", shadowColor: BRAND, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  trackBtnText: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#fff" },
  homeBtn: { backgroundColor: "#eef7ee", borderWidth: 1.5, borderColor: BRAND + "40", borderRadius: scale(14), paddingVertical: scale(12), alignItems: "center", justifyContent: "center" },
  homeBtnText: { fontSize: scaleFont(13.5), fontWeight: "800", color: BRAND },
});
