import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import {
  Menu,
  User,
  ChevronRight,
  Truck,
  CircleCheckBig,
  Video,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import QurbanSideMenu from "../components/QurbanSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";

const BRAND = "#1c5e20";

const FEATURES = [
  { Icon: Truck, label: "Evə çatdırılma", sub: "24-48 saat ərzində" },
  { Icon: CircleCheckBig, label: "Halal kəsim", sub: "Şəriətə uyğun kəsim" },
  { Icon: Video, label: "Video izləmə", sub: "Kəsim anı çəkilişi" },
];

function HeroBanner() {
  return (
    <ImageBackground
      source={require("../assets/images/qurban-hero.png")}
      style={styles.hero}
      imageStyle={{ borderRadius: 16 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "#e9f1eb",
          "#e9f1eb",
          "rgba(233,241,235,0.9)",
          "rgba(233,241,235,0.6)",
          "rgba(233,241,235,0.25)",
          "rgba(233,241,235,0)",
        ]}
        locations={[0, 0.4, 0.55, 0.68, 0.82, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>
          Süfrəniz bərəkətli,{"\n"}
          <Text style={{ color: BRAND }}>Qurbanınız qəbul olsun!</Text>
        </Text>
        <Text style={styles.heroSub}>
          Qurbanlıq heyvanınızı seçin, halal kəsim və çatdırılma prosesini rahatlıqla bizə həvalə edin.
        </Text>
        <Pressable style={styles.heroBtn}>
          <Text style={styles.heroBtnText}>Qurbanın Əhkamlarını Öyrən</Text>
          <ChevronRight size={14} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function AnimalCard({ animal, onSelect }) {
  const inactive = animal.isActive === false;
  return (
    <Pressable
      style={[styles.card, inactive && { opacity: 0.5 }]}
      onPress={() => !inactive && onSelect(animal)}
      disabled={inactive}
    >
      <View style={styles.cardImgWrap}>
        <Image
          source={animal.imageUrl ? { uri: animal.imageUrl } : require("../assets/images/qoyun-fallback.jpg")}
          style={styles.cardImg}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{animal.nameAz}</Text>
        {animal.pricePerShare != null && (
          <Text style={styles.cardPrice}>
            {animal.pricePerShare} AZN <Text style={styles.cardPriceSuffix}>-dən</Text>
          </Text>
        )}
        <Text style={styles.cardPriceLabel}>Başlayan qiymətlərlə</Text>
        <View style={styles.cardBtnRow}>
          <View style={[styles.cardBtn, inactive && { backgroundColor: "#d1d5db" }]}>
            <Text style={styles.cardBtnText}>Sifariş ver</Text>
            {!inactive && <ChevronRight size={12} color="#fff" strokeWidth={2.5} />}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function QurbanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [deliveryWindows, setDeliveryWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Bottom system nav bar sits on the WHITE bottom tab bar here, not the green header
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    api
      .get("/orders/animals")
      .then((res) => {
        setAnimals(res.data.data?.animals || []);
        setDeliveryWindows(res.data.data?.deliveryWindows || []);
      })
      .catch((err) => {
        console.error("orders/animals fetch failed:", err.message, err.response?.status, err.response?.data);
        setError(err.response?.data?.message || err.message || "Naməlum xəta");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (animal) => {
    navigation.navigate("OrderQuantity", { animal, deliveryWindows });
  };

  const initials = [user?.name, user?.lastName].filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Qurbanlıq Sifarişi</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={18} color="#fff" />
              <Text style={styles.loginText}>Daxil ol</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

      <QurbanSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 16 }}>
        <HeroBanner />

        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionTitle}>Qurbanlığınızı Seçin</Text>
          <Text style={styles.sectionSub}>Qurbanlıq heyvan növünü seçərək sifarişinizi tamamlayın</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Bağlantı xətası: {error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={{ paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={BRAND} />
            </View>
          ) : animals.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Image source={require("../assets/images/qoyun-empty.png")} style={styles.emptyImg} resizeMode="contain" />
              <Text style={styles.emptyText}>Heyvan təyin edilməyib</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 10 }}>
              {animals.map((a) => (
                <AnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} />
              ))}
            </View>
          )}
        </View>

        {!loading && (
          <View style={{ marginTop: 16, gap: 8 }}>
            {FEATURES.map(({ Icon, label, sub }) => (
              <View key={label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon size={18} color={BRAND} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{label}</Text>
                  <Text style={styles.featureSub}>{sub}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <QurbanBottomNav active="Qurban" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7f8f6" },
  header: {
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  menuBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 5 },
  loginText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  errorBox: {
    marginTop: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: "#B91C1C", fontSize: 12, fontWeight: "600" },

  hero: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e9f1eb",
    minHeight: 150,
    justifyContent: "center",
  },
  heroText: { padding: 16, maxWidth: "68%" },
  heroTitle: { fontSize: 17, fontWeight: "800", color: "#082d15", lineHeight: 22, marginBottom: 6 },
  heroSub: { fontSize: 12, color: "#52675a", lineHeight: 17, marginBottom: 10 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  heroBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#171717" },
  sectionSub: { fontSize: 12, color: "#8a8a8a", marginTop: 2 },

  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  cardImgWrap: {
    width: 150,
    aspectRatio: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cardImg: { width: "100%", height: "100%" },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  cardName: { fontSize: 16, fontWeight: "800", color: "#171717" },
  cardPrice: { fontSize: 19, fontWeight: "900", color: BRAND, marginTop: 4 },
  cardPriceSuffix: { fontSize: 11, fontWeight: "700", color: "#737373" },
  cardPriceLabel: { fontSize: 10, fontWeight: "700", color: "#16a34a", marginTop: 2 },
  cardBtnRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  cardBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  emptyWrap: { alignItems: "center", paddingVertical: 24 },
  emptyImg: { width: 180, height: 180, opacity: 0.55 },
  emptyText: { marginTop: 8, fontSize: 13, fontWeight: "800", color: "#525252" },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e7f3ea",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { fontSize: 13, fontWeight: "800", color: "#171717" },
  featureSub: { fontSize: 11, color: "#8a8a8a", marginTop: 1 },
});
