import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Platform,
  AppState,
} from "react-native";
import { StatusBar as ExpoStatusBar, setStatusBarStyle } from "expo-status-bar";
import {
  HeartHandshake,
  Beef,
  ArrowRight,
  User,
  Menu,
} from "lucide-react-native";
import { KnifeIcon } from "phosphor-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import CardVideo from "../components/CardVideo";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import SideMenu from "../components/SideMenu";
import IconPattern from "../components/IconPattern";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import { scale, scaleFont } from "../lib/scale";

function getCards(lang) {
  return [
    {
      title: t(lang, "home_card1Title"),
      text: t(lang, "home_card1Text"),
      button: t(lang, "home_card1Btn"),
      Icon: KnifeIcon,
      color: "#0b6c24",
      videoUrl: "https://www.youtube.com/embed/cF5NRPK49zU?autoplay=1",
      videoType: "youtube",
      fallbackVideoUrl:
        "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4",
      fallbackVideoType: "mp4",
      screen: "Qurban",
    },
    {
      title: t(lang, "home_card3Title"),
      text: t(lang, "home_card3Text"),
      button: t(lang, "home_card3Btn"),
      Icon: Beef,
      color: "#4B0F0F",
      videoUrl: "https://www.youtube.com/embed/7JRzuVPT5zU?autoplay=1",
      videoType: "youtube",
      fallbackVideoUrl:
        "https://videos.pexels.com/video-files/3191887/3191887-hd_1920_1080_25fps.mp4",
      fallbackVideoType: "mp4",
      screen: "MeatHome",
    },
    {
      title: t(lang, "home_card2Title"),
      text: t(lang, "home_card2Text"),
      button: t(lang, "home_card2Btn"),
      Icon: HeartHandshake,
      color: "#301586",
      videoUrl:
        "https://www.shutterstock.com/shutterstock/videos/3442647947/preview/stock-footage-close-up-of-a-man-s-hand-holding-a-cardboard-box-suggesting-a-delivery-service-in-a-nondescript.webm",
      videoType: "html5",
      fallbackVideoUrl:
        "https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4",
      fallbackVideoType: "mp4",
      screen: "CollectiveQurban",
    },
  ];
}

function ServiceCard({ item, onPress }) {
  const Icon = item.Icon;
  return (
    <View style={styles.cardOuter}>
      <View style={[styles.cardBadge, { borderColor: item.color + "40" }]}>
        <Icon size={28} color={item.color} weight="bold" />
      </View>
      <View style={styles.cardBody}>
        <CardVideo
          videoUrl={item.videoUrl}
          videoType={item.videoType}
          fallbackVideoUrl={item.fallbackVideoUrl}
          fallbackVideoType={item.fallbackVideoType}
        />
        <View style={styles.cardFooterRow}>
          <Text style={[styles.cardTitle, { color: "#8F0000" }]}>
            {item.title}
          </Text>
          <Pressable
            style={[
              styles.cardBtn,
              { backgroundColor: "#8F0000" },
              !item.screen && { opacity: 0.5 },
            ]}
            onPress={() => item.screen && onPress(item.screen)}
            disabled={!item.screen}
          >
            <Text style={styles.cardBtnText}>{item.button}</Text>
            <ArrowRight size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const cards = getCards(lang);
  const initials =
    [user?.name, user?.lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, []),
  );

  useEffect(() => {
    if (!menuOpen) setStatusBarStyle("light");
  }, [menuOpen]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setStatusBarStyle("light");
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <ExpoStatusBar style="light" />

      {/* Header */}
      <View style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
              <Menu size={22} color="#fff" />
            </Pressable>
            <Image
              source={require("../assets/images/logo-white.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRight}>
            <NotificationBell accentColor="#0b6c24" iconColor="#fff" />
            {isGuest ? (
              <Pressable
                style={styles.loginBtn}
                onPress={() => navigation.navigate("Login")}
              >
                <User size={18} color="#fff" />
                <Text style={styles.loginText}>{t(lang, "login")}</Text>
              </Pressable>
            ) : (
              <HeaderUserMenu initials={initials} />
            )}
          </View>
        </View>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Services */}
        <View
          style={[
            styles.servicesSection,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <IconPattern
            source={require("../assets/images/meatbox-bg-icon.png")}
            color="#4B0F0F"
            size={40}
            opacity={0.06}
            rows={12}
            cols={7}
            spacingX={64}
            spacingY={58}
          />
          {cards.map((item) => (
            <ServiceCard
              key={item.title}
              item={item}
              onPress={(screen) => navigation.navigate(screen)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0ddd3" },
  headerSafeArea: {
    backgroundColor: "#2e1914",
    paddingTop: StatusBar.currentHeight || 0,
    overflow: "hidden",
  },
  header: {
    height: scale(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(6), flex: 1 },
  menuBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerLogo: { width: scale(155), height: scale(42) },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(14) },
  bellBtn: { alignItems: "center", justifyContent: "center" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginRight: scale(5),
  },
  loginText: { fontSize: scaleFont(14), fontWeight: "600", color: "#fff" },
  avatar: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#0b6c24",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(5),
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: scaleFont(12) },

  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, backgroundColor: "#f0ddd3" },

  servicesSection: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#f0ddd3",
    paddingTop: scale(18),
    paddingHorizontal: scale(16),
    paddingBottom: scale(8),
    overflow: "hidden",
  },

  cardOuter: { marginTop: scale(32) },
  cardBadge: {
    position: "absolute",
    top: scale(-22),
    right: scale(20),
    zIndex: 10,
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
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
    borderRadius: scale(16),
    paddingBottom: scale(14),
    marginBottom: scale(6),
    overflow: "hidden",
    shadowColor: "#231208",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(12),
    paddingHorizontal: scale(16),
  },
  cardTitle: {
    fontSize: scaleFont(19),
    fontWeight: "800",
    flexShrink: 1,
    paddingRight: scale(10),
  },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    borderRadius: scale(10),
    paddingVertical: scale(11),
    paddingHorizontal: scale(18),
  },
  cardBtnText: { color: "#fff", fontWeight: "800", fontSize: scaleFont(13.5) },
});
