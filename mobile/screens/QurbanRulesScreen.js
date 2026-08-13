import { useCallback, useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  ArrowLeft,
  User,
  BookOpen,
  CircleCheckBig,
  Users,
  Beef,
  Star,
  ShieldAlert,
  HandHeart,
  ChevronDown,
} from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t, QURBAN_SECTIONS_TEXT } from "../i18n/i18n";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";
import { scale, moderateScale, scaleFont } from "../lib/scale";

const BRAND = "#1c5e20";

const SECTION_META = [
  { Icon: BookOpen, accent: "#166534", light: "#dcfce7" },
  { Icon: CircleCheckBig, accent: "#1e40af", light: "#dbeafe" },
  { Icon: Users, accent: "#6b21a8", light: "#f3e8ff" },
  { Icon: Beef, accent: "#9a3412", light: "#fee2e2" },
  { Icon: Knife, accent: "#065f46", light: "#d1fae5" },
  { Icon: Star, accent: "#92400e", light: "#fef3c7" },
  { Icon: ShieldAlert, accent: "#991b1b", light: "#fee2e2" },
];

function useSections(lang) {
  const texts = QURBAN_SECTIONS_TEXT[lang] || QURBAN_SECTIONS_TEXT.az;
  return SECTION_META.map((meta, i) => ({ ...meta, ...texts[i] }));
}

function Section({ section, idx, open, onToggle }) {
  const { Icon, accent, light, title, items } = section;
  const num = String(idx + 1).padStart(2, "0");

  return (
    <View style={[styles.card, { borderColor: open ? accent + "50" : "#e5e7eb" }]}>
      <Pressable
        style={[styles.cardHead, open && { backgroundColor: accent }]}
        onPress={onToggle}
      >
        <View style={[styles.cardIcon, { backgroundColor: open ? "rgba(255,255,255,0.18)" : light }]}>
          <Icon size={16} color={open ? "#fff" : accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: scale(8) }}>
          <Text style={[styles.cardNum, { color: open ? "rgba(255,255,255,0.55)" : accent }]}>{num}</Text>
          <Text style={[styles.cardTitle, { color: open ? "#fff" : "#1e293b" }]}>{title}</Text>
        </View>
        <View style={[styles.chevronWrap, open && { backgroundColor: "rgba(255,255,255,0.2)", transform: [{ rotate: "180deg" }] }]}>
          <ChevronDown size={13} color={open ? "#fff" : "#94a3b8"} strokeWidth={2.5} />
        </View>
      </Pressable>

      {open && (
        <View style={[styles.itemsWrap, { borderTopColor: accent + "20" }]}>
          {items.map((item, pi) => (
            <View key={pi} style={[styles.itemRow, pi < items.length - 1 && { borderBottomColor: accent + "12", borderBottomWidth: 1 }]}>
              <View style={[styles.itemNum, { backgroundColor: accent }]}>
                <Text style={styles.itemNumText}>{pi + 1}</Text>
              </View>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function QurbanRulesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);

  const initials = getInitials(user);
  const SECTIONS = useSections(lang);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const scrollRef = useRef(null);
  const sectionYs = useRef({});

  const toggle = (i) => {
    setOpenIndex((prev) => {
      const next = prev === i ? null : i;
      if (next !== null) {
        setTimeout(() => {
          const y = sectionYs.current[next];
          if (y != null) scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
        }, 150);
      }
      return next;
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "rules")}</Text>
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

<ScrollView ref={scrollRef} contentContainerStyle={{ padding: scale(12), paddingBottom: scale(20), gap: scale(10) }}>
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { top: scale(-50), right: scale(-50), width: scale(180), height: scale(180) }]} />
          <View style={[styles.heroCircle, { bottom: scale(-30), right: scale(40), width: scale(100), height: scale(100) }]} />
          <View style={styles.heroIcon}>
            <BookOpen size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.heroTitle}>{t(lang, "qurbanRulesTitle")}</Text>
            <Text style={styles.heroDesc}>{t(lang, "qurbanRulesDesc")}</Text>
          </View>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} onLayout={(e) => { sectionYs.current[i] = e.nativeEvent.layout.y; }}>
            <Section section={s} idx={i} open={openIndex === i} onToggle={() => toggle(i)} />
          </View>
        ))}

        <View style={styles.footerQuote}>
          <View style={styles.footerIcon}>
            <HandHeart size={18} color="#16a34a" />
          </View>
          <Text style={styles.footerText}>{t(lang, "qurbanFooterText")}</Text>
        </View>
      </ScrollView>

      <QurbanBottomNav active="QurbanRules" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f7f9" },

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
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
    borderRadius: scale(16),
    paddingHorizontal: scale(18),
    paddingVertical: scale(18),
    backgroundColor: "#166534",
    overflow: "hidden",
  },
  heroCircle: { position: "absolute", borderRadius: scale(999), borderWidth: 24, borderColor: "rgba(255,255,255,0.04)" },
  heroIcon: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroTitle: { fontSize: scaleFont(17), fontWeight: "900", color: "#fff", marginBottom: scale(4) },
  heroDesc: { fontSize: scaleFont(11.5), color: "rgba(255,255,255,0.7)", lineHeight: moderateScale(16) },

  card: { borderRadius: scale(16), borderWidth: 1, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(12) },
  cardIcon: { width: scale(34), height: scale(34), borderRadius: scale(11), alignItems: "center", justifyContent: "center" },
  cardNum: { fontSize: scaleFont(10), fontWeight: "900", marginTop: scale(1) },
  cardTitle: { flex: 1, fontSize: scaleFont(12.5), fontWeight: "700", lineHeight: moderateScale(17) },
  chevronWrap: { width: scale(26), height: scale(26), borderRadius: scale(13), backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },

  itemsWrap: { borderTopWidth: 1 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(11) },
  itemNum: { width: scale(18), height: scale(18), borderRadius: scale(9), alignItems: "center", justifyContent: "center", marginTop: scale(2) },
  itemNumText: { fontSize: scaleFont(9.5), fontWeight: "900", color: "#fff" },
  itemText: { flex: 1, fontSize: scaleFont(12), color: "#475569", lineHeight: moderateScale(18) },

  footerQuote: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  footerIcon: { width: scale(38), height: scale(38), borderRadius: scale(11), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(22,163,74,0.15)" },
  footerText: { flex: 1, fontSize: scaleFont(12), fontWeight: "600", color: "#166534", fontStyle: "italic", lineHeight: moderateScale(17) },
});
