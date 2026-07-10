import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Clock, Video, Truck, Store, Home as HomeIcon, Heart, HeartHandshake, Check } from "lucide-react-native";

const BRAND = "#1c5e20";
const AZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

const DIST_META = {
  catdirilsin: { Icon: Truck, color: "#1B5E20", bg: "#F0F7F2", label: "Qurbanınız sizə çatdırılacaq" },
  ozum: { Icon: Store, color: "#374151", bg: "#F9FAFB", label: "Qurbanınızı özünüz götürəcəksiniz" },
  ozun_gotur: { Icon: Store, color: "#374151", bg: "#F9FAFB", label: "Qurbanınızı özünüz götürəcəksiniz" },
  usaqlar_evi: { Icon: HomeIcon, color: "#1B5E20", bg: "#E8F5E9", label: "Qurbanınız uşaqlar evinə paylanacaq" },
  qocalar_evi: { Icon: Heart, color: "#6A1B9A", bg: "#F3E5F5", label: "Qurbanınız qocalar evinə paylanacaq" },
  ehtiyac_sahibleri: { Icon: HeartHandshake, color: "#1565C0", bg: "#E3F2FD", label: "Qurbanınız ehtiyac sahiblərinə paylanacaq" },
};

function fmtSlaughterDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const orderNumber = createdOrder?.orderNumber || String(createdOrder?._id || "").slice(-6).toUpperCase() || "------";
  const slaughterDateStr = fmtSlaughterDate(createdOrder?.slaughterDate);
  const slaughterTitle = slaughterDateStr ? `${slaughterDateStr} tarixdə kəsiləcək` : "48 saat sonra kəsiləcək";

  const distType = createdOrder?.distribution?.type;
  const distMeta = DIST_META[distType];
  const DistIcon = distMeta?.Icon || Truck;
  const distBg = distMeta?.bg || "#F0F7F2";
  const distColor = distMeta?.color || "#1B5E20";
  const distLabel = distMeta?.label || "Seçdiyiniz üsula görə paylanacaq";

  const handleGoOrders = () => navigation.reset({ index: 0, routes: [{ name: "Qurban" }] });
  const handleGoHome = () => navigation.reset({ index: 0, routes: [{ name: "Home" }] });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 150, gap: 12 }}>
        <View style={styles.successCircle}>
          <Check size={48} color="#fff" strokeWidth={3} />
        </View>

        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text style={styles.successTitle}>Ödəniş uğurlu oldu!</Text>
        </View>

        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>SİFARİŞ NÖMRƏSİ</Text>
          <Text style={styles.orderNumberValue}>#{orderNumber}</Text>
        </View>

        <View style={{ gap: 10 }}>
          <InfoCard Icon={Clock} bg="#F0F7F2" color="#1B5E20" title={slaughterTitle} sub="Kəsim günü digər bildirişlər göndəriləcək." />
          <InfoCard Icon={Video} bg="#EEF4FF" color="#1565C0" title="Kəsim videosu" sub="Kəsim günü sifarişlərim bölməsindən izləyə bilərsiniz." />
          <InfoCard Icon={DistIcon} bg={distBg} color={distColor} title="Qurbanlığın çatdırılması" sub={distLabel} />
        </View>

        <View style={styles.duaBox}>
          <Text style={styles.duaText}>Qurbanlarınız Allah qatında qəbul olsun!</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={styles.trackBtn} onPress={handleGoOrders}>
          <Text style={styles.trackBtnText}>Sifarişimi izlə</Text>
        </Pressable>
        <Pressable style={styles.homeBtn} onPress={handleGoHome}>
          <Text style={styles.homeBtnText}>Ana səhifəyə qayıt</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbf7f2" },

  successCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
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
  successTitle: { fontSize: 20, fontWeight: "900", color: "#171717" },

  orderNumberCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eee", padding: 18, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  orderNumberLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1, color: "#9ca3af", marginBottom: 5 },
  orderNumberValue: { fontSize: 28, fontWeight: "900", color: BRAND, letterSpacing: 2 },

  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eee", paddingHorizontal: 14, paddingVertical: 13, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  infoIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 13, fontWeight: "800", color: "#171717", marginBottom: 2 },
  infoSub: { fontSize: 11.5, color: "#737373", lineHeight: 16 },

  duaBox: { backgroundColor: "#eef7ee", borderWidth: 1, borderColor: BRAND + "25", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, alignItems: "center" },
  duaText: { fontSize: 13, fontWeight: "700", color: BRAND, textAlign: "center", lineHeight: 20 },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: 16, paddingTop: 10, gap: 10, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  trackBtn: { backgroundColor: BRAND, borderRadius: 14, paddingVertical: 13, alignItems: "center", justifyContent: "center", shadowColor: BRAND, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  trackBtnText: { fontSize: 13.5, fontWeight: "800", color: "#fff" },
  homeBtn: { backgroundColor: "#eef7ee", borderWidth: 1.5, borderColor: BRAND + "40", borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  homeBtnText: { fontSize: 13.5, fontWeight: "800", color: BRAND },
});
