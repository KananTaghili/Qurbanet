import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { ArrowLeft, User, ChartBarBig, Coins, Beef, UserRoundCheck, Lock, FileText } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE = "#301586";
const DARK = "#241a4d";

function staticTerms(lang) {
  return [
    {
      Icon: Beef,
      bg: "#fffbeb",
      color: "#f59e0b",
      titleColor: "#b45309",
      value: t(lang, "terms_oneOpenValue"),
      label: t(lang, "terms_oneOpenLabel"),
    },
    {
      Icon: UserRoundCheck,
      bg: "#eff6ff",
      color: "#3b82f6",
      titleColor: "#1d4ed8",
      value: t(lang, "terms_oneOpenerValue"),
      label: t(lang, "terms_oneOpenerLabel"),
    },
    {
      Icon: Lock,
      bg: "#fff1f2",
      color: "#f43f5e",
      titleColor: "#be123c",
      value: t(lang, "terms_anonymousValue"),
      label: t(lang, "terms_anonymousLabel"),
    },
    {
      Icon: FileText,
      bg: "#f0fdfa",
      color: "#14b8a6",
      titleColor: "#0f766e",
      value: t(lang, "terms_profileValue"),
      label: t(lang, "terms_profileLabel"),
    },
  ];
}

export default function TermsCollectiveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const [minDon, setMinDon] = useState(10);
  const [minOpenPct, setMinOpenPct] = useState(30);

  const initials = getInitials(user);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    api.get("/campaigns/settings")
      .then((res) => {
        const s = res.data?.data?.settings || {};
        if (s.minDonation) setMinDon(s.minDonation);
        if (s.minOpenPercent) setMinOpenPct(s.minOpenPercent);
      })
      .catch(() => {});
  }, []);

  const sertler = [
    {
      Icon: ChartBarBig,
      bg: "#f5f3ff",
      color: "#8b5cf6",
      titleColor: "#6d28d9",
      value: t(lang, "terms_minOpenValueTemplate").replace("{pct}", minOpenPct),
      label: t(lang, "terms_minOpenLabelTemplate").replace("{pct}", minOpenPct),
    },
    {
      Icon: Coins,
      bg: "#ecfdf5",
      color: "#10b981",
      titleColor: "#047857",
      value: t(lang, "terms_minDonValueTemplate").replace("{amount}", minDon),
      label: t(lang, "terms_minDonLabelTemplate").replace("{amount}", minDon),
    },
    ...staticTerms(lang),
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "terms_headerTitle")}</Text>
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
        <Text style={styles.subTitle}>{t(lang, "terms_subTitle")}</Text>

        <View style={styles.grid}>
          {sertler.map((s) => (
            <View key={s.value} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: s.bg }]}>
                <s.Icon size={20} color={s.color} />
              </View>
              <Text style={[styles.cardValue, { color: s.titleColor }]}>{s.value}</Text>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <CollectiveBottomNav active="TermsCollective" />
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
  subTitle: { fontSize: scaleFont(14.5), fontWeight: "600", color: "#8778a8", marginBottom: scale(12) },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: scale(14), borderWidth: 1, borderColor: "#eee8f6", padding: scale(14), gap: scale(8), shadowColor: "#2e175c", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardIcon: { width: scale(38), height: scale(38), borderRadius: scale(12), alignItems: "center", justifyContent: "center" },
  cardValue: { fontSize: scaleFont(15.5), fontWeight: "800", lineHeight: moderateScale(20) },
  cardLabel: { fontSize: scaleFont(13), color: "#9ca3af", lineHeight: moderateScale(18) },
});
