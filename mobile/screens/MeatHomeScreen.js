import { useState, useCallback } from "react";
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
  StatusBar,
} from "react-native";
import {
  Truck,
  CheckCircle,
  Award,
  ArrowRight,
  Menu,
  User,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import MeatSideMenu from "../components/MeatSideMenu";
import MeatBottomNav from "../components/MeatBottomNav";

const BRAND = "#4B0F0F";

const FEATURES = [
  { Icon: Truck, label: "Evə çatdırılma", sub: "24-48 saat ərzində" },
  { Icon: CheckCircle, label: "Halal kəsim", sub: "Şəriətə uyğun kəsim" },
  { Icon: Award, label: "Keyfiyyətli məhsul", sub: "Seçilmiş sağlam heyvan" },
];

const TYPE_OPTIONS = [
  {
    key: "qoyun",
    title: "Qoyun əti",
    subtitle: "Təzə, yumşaq və şirəli qoyun əti",
    img: require("../assets/images/meat-type-qoyun.png"),
  },
  {
    key: "dana",
    title: "Dana əti",
    subtitle: "Keyfiyyətli və doyumlu dana əti",
    img: require("../assets/images/meat-type-dana.png"),
  },
  {
    key: "food",
    title: "Yeməyə görə seçim",
    subtitle: "İstədiyiniz yeməyə uyğun əti seçin",
    img: require("../assets/images/meat-type-food.png"),
  },
];

// Məhsullar siyahısı ekranı hələ qurulmayıb — bu düymələr basılanda
// "tezliklə" bildirişi göstərilir (bax MeatBottomNav.js / MeatSideMenu.js).
function comingSoon() {
  Alert.alert("Tezliklə", "Bu bölmə hələ hazırlanır.");
}

function HeroBanner({ onStart }) {
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
        <Text style={styles.heroTitle}>Halal, Təzə{"\n"}və Etibarlı Ət</Text>
        <Text style={styles.heroSub}>
          Ailəniz üçün seçilmiş ən keyfiyyətli qoyun və dana əti.
        </Text>
        <Pressable style={styles.heroBtn} onPress={onStart}>
          <Text style={styles.heroBtnText}>Necə işləyirik</Text>
          <ArrowRight size={15} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function TypeCard({ opt, onPress }) {
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
          <Text style={styles.typeCardBtnText}>Sifariş et</Text>
          <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

function MeatTypeSelector({ navigation }) {
  return (
    <View style={styles.selector}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Ət seçimi</Text>
        <Text style={styles.selectorSub}>Sizə uyğun olan seçimi edin</Text>
      </View>
      <View style={styles.selectorList}>
        {TYPE_OPTIONS.map((opt) => (
          <TypeCard
            key={opt.key}
            opt={opt}
            onPress={() => {
              if (opt.key === "food") {
                Alert.alert(
                  "Tezliklə",
                  "Yeməyə görə filtrləmə hələ hazırlanır — bu arada bütün məhsullara baxa bilərsiniz.",
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
  const [menuOpen, setMenuOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS !== "android") return;

      StatusBar.setBackgroundColor(BRAND);
      StatusBar.setTranslucent(false);
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, []),
  );

  const initials =
    [user?.name, user?.lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={BRAND}
        translucent={false}
      />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={26} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Ət Satışı
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
              <Text style={styles.loginText}>Daxil ol</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu
              initials={initials}
              accentColor="rgba(255,255,255,0.2)"
            />
          )}
        </View>
      </View>

      <MeatSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 16, gap: 12 }}
      >
        <HeroBanner onStart={() => navigation.navigate("MeatHowItWorks")} />
        <MeatTypeSelector navigation={navigation} />
        <View style={{ gap: 6 }}>
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
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  menuBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 22, fontWeight: "800" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 5,
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  hero: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3EFE7",
    minHeight: 150,
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
  heroText: { padding: 16, maxWidth: "50%" },
  heroTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0a0a0a",
    lineHeight: 25,
    marginBottom: 7,
  },
  heroSub: {
    fontSize: 13,
    color: "#525252",
    lineHeight: 17,
    fontWeight: "500",
    marginBottom: 12,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  heroBtnText: { color: "#fff", fontSize: 14.5, fontWeight: "800" },

  selector: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  selectorHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  selectorTitle: { fontSize: 19, fontWeight: "900", color: "#171717" },
  selectorSub: {
    fontSize: 14,
    color: "#a3a3a3",
    fontWeight: "500",
    marginTop: 3,
  },
  selectorList: { paddingHorizontal: 16, paddingBottom: 16, gap: 11 },

  typeCard: {
    flexDirection: "row",
    minHeight: 128,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  typeCardImg: { width: 178, height: "100%" },
  typeCardBody: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 11,
    justifyContent: "center",
  },
  typeCardTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#171717",
    lineHeight: 20,
  },
  typeCardSub: {
    fontSize: 13.5,
    color: "#a3a3a3",
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 4,
  },
  typeCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: BRAND,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 9,
    alignSelf: "flex-start",
  },
  typeCardBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "800" },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 13,
    minHeight: 62,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { fontSize: 15, fontWeight: "900", color: "#171717" },
  featureSub: {
    fontSize: 13,
    color: "#a3a3a3",
    fontWeight: "500",
    marginTop: 2,
  },
});
