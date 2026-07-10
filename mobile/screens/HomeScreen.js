import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  HeartHandshake,
  Beef,
  ArrowRight,
  User,
  Menu,
} from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import CardVideo from "../components/CardVideo";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../context/AuthContext";

const cards = [
  {
    title: "Qurbanlıq Sifarişi",
    text: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Etibarlı və şəffaf xidmət.",
    button: "SİFARİŞ ET",
    Icon: Knife,
    color: "#0b6c24",
    videoUrl: "https://www.youtube.com/embed/cF5NRPK49zU?autoplay=1",
    videoType: "youtube",
    screen: "Qurban",
  },
  {
    title: "Kollektiv Qurban",
    text: "Birlikdə qurban kəsdirək, ehtiyacı olanlara pay göndərək. Şəffaf və etibarlı xeyriyyə platforması.",
    button: "QOŞUL",
    Icon: HeartHandshake,
    color: "#6820a3",
    videoUrl:
      "https://www.shutterstock.com/shutterstock/videos/3442647947/preview/stock-footage-close-up-of-a-man-s-hand-holding-a-cardboard-box-suggesting-a-delivery-service-in-a-nondescript.webm",
    videoType: "mp4",
    screen: "CollectiveQurban",
  },
  {
    title: "Ət Satışı",
    text: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.",
    button: "MƏHSULLARA BAX",
    Icon: Beef,
    color: "#f97316",
    videoUrl: "https://www.youtube.com/embed/7JRzuVPT5zU?autoplay=1",
    videoType: "youtube",
  },
];

function ServiceCard({ item, onPress }) {
  const Icon = item.Icon;
  return (
    <View style={styles.cardOuter}>
      <View style={[styles.cardBadge, { borderColor: item.color + "40" }]}>
        <Icon size={30} color={item.color} weight="bold" />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: item.color }]}>{item.title}</Text>
        <CardVideo videoUrl={item.videoUrl} videoType={item.videoType} />
        <Text style={styles.cardText}>{item.text}</Text>
        <Pressable
          style={[styles.cardBtn, { backgroundColor: item.color }, !item.screen && { opacity: 0.5 }]}
          onPress={() => item.screen && onPress(item.screen)}
          disabled={!item.screen}
        >
          <Text style={styles.cardBtnText}>{item.button}</Text>
          <ArrowRight size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = [user?.name, user?.lastName].filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
              <Menu size={22} color="#171717" />
            </Pressable>
            <Image
              source={require("../assets/images/logo-black.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRight}>
            <NotificationBell accentColor="#0b6c24" iconColor="#171717" />
            {isGuest ? (
              <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
                <User size={18} color="#171717" />
                <Text style={styles.loginText}>Daxil ol</Text>
              </Pressable>
            ) : (
              <HeaderUserMenu initials={initials} />
            )}
          </View>
        </View>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Hero */}
        <ImageBackground
          source={require("../assets/images/hero-bg.jpg")}
          style={styles.hero}
          imageStyle={{ opacity: 0.97 }}
        >
          <LinearGradient
            colors={["rgba(5,2,0,0.60)", "rgba(5,2,0,0.22)", "rgba(0,0,0,0)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.55 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Bərəkətli qurbanlıq,{"\n"}Rahat ət sifarişi!</Text>
            <Text style={styles.heroSlogan}>ETİBARLI  •  HALAL  •  SÜRƏTLİ</Text>
            {isGuest ? (
              <Pressable style={styles.ctaBtn} onPress={() => navigation.navigate("Register")}>
                <Text style={styles.ctaText}>Qeydiyyatdan keç  →</Text>
              </Pressable>
            ) : (
              <View style={styles.ctaBtn}>
                <Text style={styles.ctaText}>Xoş gəlmisiniz, {user?.name}!</Text>
              </View>
            )}
          </View>
        </ImageBackground>

        {/* Services */}
        <View style={styles.servicesSection}>
          {cards.map((item) => (
            <ServiceCard key={item.title} item={item} onPress={(screen) => navigation.navigate(screen)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  headerSafeArea: {
    backgroundColor: "#ffffff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: { width: 110, height: 28 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  bellBtn: { alignItems: "center", justifyContent: "center" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 5 },
  loginText: { fontSize: 14, fontWeight: "600", color: "#171717" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0b6c24",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  scroll: { flex: 1 },

  hero: {
    minHeight: 190,
    justifyContent: "center",
    backgroundColor: "#190908",
    overflow: "hidden",
  },
  heroContent: { paddingHorizontal: 24, paddingVertical: 18, maxWidth: 380 },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  heroSlogan: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 16,
  },
  ctaBtn: {
    backgroundColor: "#CC0000",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  servicesSection: {
    backgroundColor: "#fbf7f2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -22,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  cardOuter: { marginTop: 32 },
  cardBadge: {
    position: "absolute",
    top: -32,
    right: 20,
    zIndex: 10,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#231208",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardBody: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e8e2db",
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
    shadowColor: "#231208",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: { fontSize: 19, fontWeight: "800", paddingRight: 72 },
  cardText: { paddingVertical: 8, fontSize: 12, lineHeight: 18, color: "#404040" },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 10,
    paddingVertical: 11,
  },
  cardBtnText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
});
