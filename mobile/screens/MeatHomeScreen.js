import { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  AppState,
} from "react-native";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import {
  Truck,
  CheckCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  User,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import MeatBottomNav from "../components/MeatBottomNav";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";

function getFeatures(lang) {
  return [
    { Icon: Truck, label: t(lang, "homeFeatureDelivery"), sub: t(lang, "homeFeatureDeliverySub") },
    { Icon: CheckCircle, label: t(lang, "homeFeatureHalal"), sub: t(lang, "homeFeatureHalalSub") },
    { Icon: Award, label: t(lang, "meatHome_featureQuality"), sub: t(lang, "meatHome_featureQualitySub") },
  ];
}

function getTypeOptions(lang) {
  return [
    {
      key: "qoyun",
      title: t(lang, "meatHome_typeSheepTitle"),
      subtitle: t(lang, "meatHome_typeSheepSub"),
      img: require("../assets/images/meat-type-qoyun.png"),
    },
    {
      key: "dana",
      title: t(lang, "meatHome_typeBeefTitle"),
      subtitle: t(lang, "meatHome_typeBeefSub"),
      img: require("../assets/images/meat-type-dana.png"),
    },
    {
      key: "food",
      title: t(lang, "meatHome_typeFoodTitle"),
      subtitle: t(lang, "meatHome_typeFoodSub"),
      img: require("../assets/images/et-satisi-yemek.png"),
    },
  ];
}

function HeroBanner({ onStart, lang }) {
  return (
    <View style={styles.hero}>
      {/* Sadə mütləq mövqeli <Image> heç görünmürdü — sınanmış işləyən üsula
          (ImageBackground, ev ekranındakı ilə eyni) keçirik, sadəcə onu
          sağdakı dar sahəyə həsr olunmuş ayrıca View-un içinə qoyuruq. */}
      <View style={styles.heroImageBox}>
        <ImageBackground
          source={require("../assets/images/meat-hero.png")}
          style={{ flex: 1 }}
          resizeMode="cover"
        />
      </View>
      {/* Fotodan mətn sahəsinə keçid — tək bir sərt "pillə" hiss olunmasın deyə
          daha çox aralıq nöqtəsi ilə enli (0.2-dən 0.75-ə) və tədricən
          yumşalan bir keçid zolağı. */}
      <LinearGradient
        colors={[
          "#F3EFE7",
          "#F3EFE7",
          "rgba(243,239,231,0.92)",
          "rgba(243,239,231,0.7)",
          "rgba(243,239,231,0.45)",
          "rgba(243,239,231,0.22)",
          "rgba(243,239,231,0.08)",
          "rgba(243,239,231,0)",
          "rgba(243,239,231,0)",
        ]}
        locations={[0, 0.2, 0.32, 0.42, 0.52, 0.62, 0.7, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>{t(lang, "meatHome_heroTitle")}</Text>
        <Text style={styles.heroSub}>{t(lang, "meatHome_heroSub")}</Text>
        <Pressable style={styles.heroBtn} onPress={onStart}>
          <Text style={styles.heroBtnText}>{t(lang, "meatHome_heroBtn")}</Text>
          <ArrowRight size={15} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function TypeCard({ opt, onPress, lang }) {
  return (
    <Pressable style={styles.typeCard} onPress={onPress}>
      <Image source={opt.img} style={styles.typeCardImg} resizeMode="cover" />
      <View style={styles.typeCardBody}>
        <Text style={styles.typeCardTitle} numberOfLines={2}>
          {opt.title}
        </Text>
        <Text style={styles.typeCardSub} numberOfLines={2}>
          {opt.subtitle}
        </Text>
        <View style={styles.typeCardBtn}>
          <Text style={styles.typeCardBtnText}>{t(lang, "order")}</Text>
          <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

function MeatTypeSelector({ navigation, lang }) {
  const typeOptions = getTypeOptions(lang);
  return (
    <View style={styles.selector}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>{t(lang, "meatHome_selectorTitle")}</Text>
        <Text style={styles.selectorSub}>{t(lang, "meatHome_selectorSub")}</Text>
      </View>
      <View style={styles.selectorList}>
        {typeOptions.map((opt) => (
          <TypeCard
            key={opt.key}
            opt={opt}
            lang={lang}
            onPress={() => {
              if (opt.key === "food") {
                Alert.alert(
                  t(lang, "comingSoonTitle"),
                  t(lang, "meatHome_foodFilterComingSoonBody"),
                );
              }
              navigation.navigate("MeatProducts", {
                animal: opt.key === "food" ? undefined : opt.key,
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

function FeatureCard({ Icon, label, sub }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Icon size={19} color={BRAND} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.featureLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.featureSub} numberOfLines={2}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

export default function MeatHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const FEATURES = getFeatures(lang);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setStatusBarStyle("light");
    });
    return () => sub.remove();
  }, []);

  const initials = getInitials(user);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={26} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t(lang, "home_card3Title")}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable
              style={styles.loginBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <User size={22} color="#fff" />
              <Text style={styles.loginText}>{t(lang, "login")}</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu
              initials={initials}
              accentColor="rgba(255,255,255,0.2)"
            />
          )}
        </View>
      </View>

<ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: scale(14), paddingBottom: scale(16), gap: scale(12) }}
      >
        <HeroBanner onStart={() => navigation.navigate("MeatHowItWorks")} lang={lang} />
        <MeatTypeSelector navigation={navigation} lang={lang} />
        <View style={{ gap: scale(6) }}>
          {FEATURES.map(({ Icon, label, sub }) => (
            <FeatureCard key={label} Icon={Icon} label={label} sub={sub} />
          ))}
        </View>
      </ScrollView>

      <MeatBottomNav active="MeatHome" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flexShrink: 0,
  },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(40), height: scale(40), borderRadius: scale(10) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginRight: scale(5),
  },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  hero: {
    borderRadius: scale(16),
    overflow: "hidden",
    backgroundColor: "#F3EFE7",
    minHeight: scale(150),
    justifyContent: "center",
  },
  heroImageBox: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "58%",
    overflow: "hidden",
  },
  heroText: { padding: scale(16), maxWidth: "50%" },
  heroTitle: {
    fontSize: scaleFont(21),
    fontWeight: "900",
    color: "#0a0a0a",
    lineHeight: moderateScale(25),
    marginBottom: scale(7),
  },
  heroSub: {
    fontSize: scaleFont(13),
    color: "#525252",
    lineHeight: moderateScale(17),
    fontWeight: "500",
    marginBottom: scale(12),
  },
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

  selector: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  selectorHeader: { paddingHorizontal: scale(16), paddingTop: scale(14), paddingBottom: scale(8) },
  selectorTitle: { fontSize: scaleFont(19), fontWeight: "900", color: "#171717" },
  selectorSub: {
    fontSize: scaleFont(14),
    color: "#a3a3a3",
    fontWeight: "500",
    marginTop: scale(3),
  },
  selectorList: { paddingHorizontal: scale(16), paddingBottom: scale(16), gap: scale(11) },

  typeCard: {
    flexDirection: "row",
    minHeight: scale(128),
    borderRadius: scale(14),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  typeCardImg: { width: scale(178), height: "100%" },
  typeCardBody: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff",
    paddingHorizontal: scale(15),
    paddingVertical: scale(11),
    justifyContent: "center",
  },
  typeCardTitle: {
    fontSize: scaleFont(16.5),
    fontWeight: "900",
    color: "#171717",
    lineHeight: moderateScale(20),
  },
  typeCardSub: {
    fontSize: scaleFont(13.5),
    color: "#a3a3a3",
    fontWeight: "500",
    lineHeight: moderateScale(17),
    marginTop: scale(4),
  },
  typeCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: BRAND,
    borderRadius: scale(9),
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    marginTop: scale(9),
    alignSelf: "flex-start",
  },
  typeCardBtnText: { color: "#fff", fontSize: scaleFont(13.5), fontWeight: "800" },

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
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { fontSize: scaleFont(15), fontWeight: "900", color: "#171717" },
  featureSub: {
    fontSize: scaleFont(13),
    color: "#a3a3a3",
    fontWeight: "500",
    marginTop: scale(2),
  },
});
