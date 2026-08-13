import { useCallback } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { ArrowLeft, User, UserRoundCheck, CirclePlus, Coins, Video, HandHeart, Heart } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE = "#301586";
const DARK = "#241a4d";

function stepsList(lang) {
  return [
    {
      Icon: UserRoundCheck,
      color: "#ea580c",
      bg: "#fed7aa",
      title: t(lang, "hiwC_step1Title"),
      desc: t(lang, "hiwC_step1Desc"),
    },
    {
      Icon: CirclePlus,
      color: "#0891b2",
      bg: "#a5f3fc",
      title: t(lang, "hiwC_step2Title"),
      desc: t(lang, "hiwC_step2Desc"),
    },
    {
      Icon: Coins,
      color: "#7c3aed",
      bg: "#ddd6fe",
      title: t(lang, "hiwC_step3Title"),
      desc: t(lang, "hiwC_step3Desc"),
    },
    {
      Icon: Video,
      color: "#db2777",
      bg: "#fce7f3",
      title: t(lang, "hiwC_step4Title"),
      desc: t(lang, "hiwC_step4Desc"),
    },
    {
      Icon: HandHeart,
      color: "#16a34a",
      bg: "#bbf7d0",
      title: t(lang, "hiwC_step5Title"),
      desc: t(lang, "hiwC_step5Desc"),
    },
  ];
}

export default function HowItWorksCollectiveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();

  const initials = getInitials(user);
  const STEPS = stepsList(lang);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "hiwC_headerTitle")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={PURPLE} iconColor="#fff" />
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

<ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: scale(20) }}>
        <Text style={styles.subTitle}>{t(lang, "hiwC_subTitle")}</Text>

        <View style={{ marginTop: scale(12) }}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={{ alignItems: "center" }}>
                <View style={[styles.stepIcon, { backgroundColor: s.bg }]}>
                  <s.Icon size={22} strokeWidth={2.3} color={s.color} />
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
              </View>
              <View style={styles.stepCard}>
                <View style={styles.stepTitleRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                </View>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerCard}>
          <View style={styles.footerIcon}>
            <Heart size={17} color="#fff" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTitle}>{t(lang, "hiwC_footerTitle")}</Text>
            <Text style={styles.footerSub}>{t(lang, "hiwC_footerSub")}</Text>
          </View>
        </View>
      </ScrollView>

      <CollectiveBottomNav active="HowItWorksCollective" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfaff" },

  header: {
    backgroundColor: PURPLE,
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
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },
  subTitle: { fontSize: scaleFont(13.5), fontWeight: "600", color: "#8778a8" },

  stepRow: { flexDirection: "row", gap: scale(12) },
  stepIcon: { width: scale(44), height: scale(44), borderRadius: scale(15), alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  stepConnector: { width: scale(2), flex: 1, backgroundColor: "#e4d9f9", marginVertical: scale(2), minHeight: scale(12) },
  stepCard: { flex: 1, borderRadius: scale(14), borderWidth: 1, borderColor: "#ece6f5", backgroundColor: "#fff", paddingHorizontal: scale(13), paddingVertical: scale(11), marginBottom: scale(8), shadowColor: "#2e175c", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  stepTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: scale(8), marginBottom: scale(4) },
  stepNum: { width: scale(22), height: scale(22), borderRadius: scale(11), backgroundColor: "#f1ecff", alignItems: "center", justifyContent: "center", marginTop: scale(1) },
  stepNumText: { fontSize: scaleFont(11.5), fontWeight: "900", color: "#5b22c7" },
  stepTitle: { flex: 1, fontSize: scaleFont(15), fontWeight: "800", color: DARK, lineHeight: moderateScale(20) },
  stepDesc: { fontSize: scaleFont(13.5), color: "#6b7280", lineHeight: moderateScale(19), paddingLeft: scale(30) },

  footerCard: { flexDirection: "row", alignItems: "center", gap: scale(12), marginTop: scale(8), borderRadius: scale(14), borderWidth: 1, borderColor: "#e7e1f0", backgroundColor: "#fff", paddingHorizontal: scale(15), paddingVertical: scale(13) },
  footerIcon: { width: scale(36), height: scale(36), borderRadius: scale(12), backgroundColor: "#5319bc", alignItems: "center", justifyContent: "center" },
  footerTitle: { fontSize: scaleFont(14), fontWeight: "800", color: DARK },
  footerSub: { fontSize: scaleFont(12.5), color: "#8778a8", marginTop: scale(2) },
});
