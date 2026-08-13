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
  AppState,
} from "react-native";
import {
  ArrowLeft,
  User,
  ChevronRight,
  Truck,
  CircleCheckBig,
  Video,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

function featuresList(lang) {
  return [
    { Icon: Truck, label: t(lang, "homeFeatureDelivery"), sub: t(lang, "homeFeatureDeliverySub") },
    { Icon: CircleCheckBig, label: t(lang, "homeFeatureHalal"), sub: t(lang, "homeFeatureHalalSub") },
    { Icon: Video, label: t(lang, "qurbanHome_featureVideo"), sub: t(lang, "qurbanHome_featureVideoSub") },
  ];
}

function HeroBanner({ onLearnRules, lang }) {
  return (
    <ImageBackground
      source={require("../assets/images/qurban-hero.png")}
      style={styles.hero}
      imageStyle={{ borderRadius: scale(16) }}
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
          {t(lang, "qurbanHome_heroTitleLine1")}{"\n"}
          <Text style={{ color: BRAND }}>{t(lang, "qurbanHome_heroTitleLine2")}</Text>
        </Text>
        <Text style={styles.heroSub}>
          {t(lang, "qurbanHome_heroSub")}
        </Text>
        <Pressable style={styles.heroBtn} onPress={onLearnRules}>
          <Text style={styles.heroBtnText}>{t(lang, "qurbanHome_learnRulesBtn")}</Text>
          <ChevronRight size={15} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function AnimalCard({ animal, onSelect, lang }) {
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
            {animal.pricePerShare} AZN <Text style={styles.cardPriceSuffix}>{t(lang, "qurbanHome_priceFromSuffix")}</Text>
          </Text>
        )}
        <Text style={styles.cardPriceLabel}>{t(lang, "qurbanHome_startingPricesLabel")}</Text>
        <View style={styles.cardBtnRow}>
          <View style={[styles.cardBtn, inactive && { backgroundColor: "#d1d5db" }]}>
            <Text style={styles.cardBtnText}>{t(lang, "qurbanHome_orderBtn")}</Text>
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
  const { lang } = useLanguage();
  const [animals, setAnimals] = useState([]);
  const [deliveryWindows, setDeliveryWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bottom system nav bar sits on the WHITE bottom tab bar here, not the green header
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setStatusBarStyle("light");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    api
      .get("/orders/animals")
      .then((res) => {
        setAnimals(res.data.data?.animals || []);
        setDeliveryWindows(res.data.data?.deliveryWindows || []);
      })
      .catch((err) => {
        console.error("orders/animals fetch failed:", err.message, err.response?.status, err.response?.data);
        setError(err.response?.data?.message || err.message || t(lang, "qurbanHome_unknownError"));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (animal) => {
    navigation.navigate("OrderQuantity", { animal, deliveryWindows });
  };

  const initials = getInitials(user);
  const FEATURES = featuresList(lang);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={26} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "qurbanHome_headerTitle")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={22} color="#fff" />
              <Text style={styles.loginText}>{t(lang, "login")}</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

<ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: scale(16) }}>
        <HeroBanner onLearnRules={() => navigation.navigate("QurbanRules")} lang={lang} />

        <View style={{ marginTop: scale(14) }}>
          <Text style={styles.sectionTitle}>{t(lang, "qurbanHome_sectionTitle")}</Text>
          <Text style={styles.sectionSub}>{t(lang, "qurbanHome_sectionSub")}</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{t(lang, "qurbanHome_connectionErrorPrefix")} {error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={{ paddingVertical: scale(40) }}>
              <ActivityIndicator size="large" color={BRAND} />
            </View>
          ) : animals.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Image source={require("../assets/images/qoyun-empty.png")} style={styles.emptyImg} resizeMode="contain" />
              <Text style={styles.emptyText}>{t(lang, "qurbanHome_noAnimalsAssigned")}</Text>
            </View>
          ) : (
            <View style={{ gap: scale(10), marginTop: scale(10) }}>
              {animals.map((a) => (
                <AnimalCard key={a._id || a.type} animal={a} onSelect={handleSelect} lang={lang} />
              ))}
            </View>
          )}
        </View>

        {!loading && (
          <View style={{ marginTop: scale(16), gap: scale(8) }}>
            {FEATURES.map(({ Icon, label, sub }) => (
              <View key={label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon size={19} color={BRAND} strokeWidth={2} />
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
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(10), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(40), height: scale(40), borderRadius: scale(10) },
  iconBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  errorBox: {
    marginTop: scale(10),
    backgroundColor: "#FEF2F2",
    borderRadius: scale(12),
    padding: scale(12),
  },
  errorText: { color: "#B91C1C", fontSize: scaleFont(12), fontWeight: "600" },

  hero: {
    borderRadius: scale(16),
    overflow: "hidden",
    backgroundColor: "#e9f1eb",
    minHeight: scale(150),
    justifyContent: "center",
  },
  heroText: { padding: scale(16), maxWidth: "68%" },
  heroTitle: { fontSize: scaleFont(21), fontWeight: "900", color: "#082d15", lineHeight: moderateScale(25), marginBottom: scale(7) },
  heroSub: { fontSize: scaleFont(13), color: "#52675a", lineHeight: moderateScale(17), marginBottom: scale(12) },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(7),
    backgroundColor: BRAND,
    borderRadius: scale(12),
    paddingVertical: scale(11),
    paddingHorizontal: scale(18),
    alignSelf: "flex-start",
  },
  heroBtnText: { color: "#fff", fontSize: scaleFont(14.5), fontWeight: "800" },

  sectionTitle: { fontSize: scaleFont(19), fontWeight: "900", color: "#171717" },
  sectionSub: { fontSize: scaleFont(14), color: "#8a8a8a", marginTop: scale(3) },

  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  cardImgWrap: {
    width: scale(178),
    aspectRatio: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cardImg: { width: "100%", height: "100%" },
  cardBody: { flex: 1, padding: scale(12), justifyContent: "center" },
  cardName: { fontSize: scaleFont(16.5), fontWeight: "900", color: "#171717" },
  cardPrice: { fontSize: scaleFont(19), fontWeight: "900", color: BRAND, marginTop: scale(4) },
  cardPriceSuffix: { fontSize: scaleFont(11), fontWeight: "700", color: "#737373" },
  cardPriceLabel: { fontSize: scaleFont(10), fontWeight: "700", color: "#16a34a", marginTop: scale(2) },
  cardBtnRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: scale(8) },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: BRAND,
    borderRadius: scale(999),
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
  },
  cardBtnText: { color: "#fff", fontSize: scaleFont(13.5), fontWeight: "800" },

  emptyWrap: { alignItems: "center", paddingVertical: scale(24) },
  emptyImg: { width: scale(180), height: scale(180), opacity: 0.55 },
  emptyText: { marginTop: scale(8), fontSize: scaleFont(13), fontWeight: "800", color: "#525252" },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingVertical: scale(12),
    paddingHorizontal: scale(13),
    minHeight: scale(62),
  },
  featureIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(12),
    backgroundColor: "#e7f3ea",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { fontSize: scaleFont(15), fontWeight: "900", color: "#171717" },
  featureSub: { fontSize: scaleFont(13), color: "#8a8a8a", marginTop: scale(2) },
});
