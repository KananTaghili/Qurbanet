import { useCallback, useRef, useState } from "react";
import { View, Text, Image, Pressable, FlatList, ScrollView, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { ArrowLeft, User, Video, ShieldCheck, Clock3, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";
const CARD_GAP = 12;

function stepsList(lang) {
  return [
    {
      label: t(lang, "hiwQ_step1Label"),
      title: t(lang, "hiwQ_step1Title"),
      desc: t(lang, "hiwQ_step1Desc"),
      img: require("../assets/images/qoyun_big.png"),
      color: "#166534",
      light: "#dcfce7",
      mid: "#16a34a",
    },
    {
      label: t(lang, "hiwQ_step2Label"),
      title: t(lang, "hiwQ_step2Title"),
      desc: t(lang, "hiwQ_step2Desc"),
      img: require("../assets/images/bicaq.png"),
      color: "#9a3412",
      light: "#fee2e2",
      mid: "#ea580c",
    },
    {
      label: t(lang, "hiwQ_step3Label"),
      title: t(lang, "hiwQ_step3Title"),
      desc: t(lang, "hiwQ_step3Desc"),
      img: require("../assets/images/meatbox-qutu.png"),
      fit: "contain",
      color: "#065f46",
      light: "#d1fae5",
      mid: "#059669",
    },
    {
      label: t(lang, "hiwQ_step4Label"),
      title: t(lang, "hiwQ_step4Title"),
      desc: t(lang, "hiwQ_step4Desc"),
      img: require("../assets/images/masin.png"),
      color: "#1e3a8a",
      light: "#dbeafe",
      mid: "#2563eb",
    },
  ];
}

function heroStats(lang) {
  return [
    { Icon: ShieldCheck, label: t(lang, "hiwQ_statHalal") },
    { Icon: Video, label: t(lang, "hiwQ_statVideo") },
    { Icon: Clock3, label: t(lang, "hiwQ_statDelivery") },
  ];
}

function StepCard({ step, width }) {
  return (
    <View style={[styles.card, { borderColor: step.light, width }]}>
      <View style={styles.cardImgWrap}>
        <View style={[styles.stepBadge, { backgroundColor: step.light }]}>
          <Text style={[styles.stepBadgeText, { color: step.color }]}>{step.label}</Text>
        </View>
        <Image
          source={step.img}
          style={styles.cardImg}
          resizeMode={step.fit === "contain" ? "contain" : "cover"}
        />
      </View>
      <View style={[styles.cardBody, { borderLeftColor: step.light }]}>
        <Text style={[styles.cardTitle, { color: step.color }]}>{step.title}</Text>
        <View style={[styles.cardDivider, { backgroundColor: step.mid }]} />
        <Text style={styles.cardDesc}>{step.desc}</Text>
      </View>
    </View>
  );
}

export default function HowItWorksQurbanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = screenWidth - 24;
  const initials = getInitials(user);
  const STEPS = stepsList(lang);
  const HERO_STATS = heroStats(lang);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const goToIndex = (i) => {
    if (i < 0 || i >= STEPS.length) return;
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setActiveIndex(i);
  };

  const onMomentumEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP));
    setActiveIndex(i);
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
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "hiwQ_headerTitle")}</Text>
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

      <ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: scale(20), gap: scale(12) }}>
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { top: scale(-40), right: scale(-40), width: scale(160), height: scale(160) }]} />
          <View style={[styles.heroCircle, { bottom: scale(-24), left: scale(-16), width: scale(120), height: scale(120) }]} />
          <Text style={styles.heroTitle}>{t(lang, "hiwQ_heroTitle")}</Text>
          <Text style={styles.heroDesc}>{t(lang, "hiwQ_heroDesc")}</Text>
          <View style={styles.heroStatsRow}>
            {HERO_STATS.map(({ Icon, label }) => (
              <View key={label} style={styles.heroStat}>
                <Icon size={11} color="#86efac" strokeWidth={2} />
                <Text style={styles.heroStatText} numberOfLines={1}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={STEPS}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_GAP}
          disableIntervalMomentum
          decelerationRate="fast"
          contentContainerStyle={{ gap: CARD_GAP }}
          keyExtractor={(s) => s.title}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, i) => ({ length: cardWidth + CARD_GAP, offset: (cardWidth + CARD_GAP) * i, index: i })}
          renderItem={({ item }) => <StepCard step={item} width={cardWidth} />}
        />

        <View style={styles.arrowsRow}>
          <Pressable
            style={[styles.arrowBtn, activeIndex === 0 && styles.arrowBtnDisabled]}
            onPress={() => goToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            <ChevronLeft size={20} color={activeIndex === 0 ? "#d1d5db" : BRAND} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.dotsRow}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>

          <Pressable
            style={[styles.arrowBtn, activeIndex === STEPS.length - 1 && styles.arrowBtnDisabled]}
            onPress={() => goToIndex(activeIndex + 1)}
            disabled={activeIndex === STEPS.length - 1}
          >
            <ChevronRight size={20} color={activeIndex === STEPS.length - 1 ? "#d1d5db" : BRAND} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={{ alignItems: "center" }}>
          <Pressable style={styles.ctaBtn} onPress={() => navigation.navigate("Qurban")}>
            <Text style={styles.ctaText}>{t(lang, "hiwQ_startOrderBtn")}</Text>
            <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </ScrollView>

      <QurbanBottomNav active="HowItWorksQurban" />
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

  hero: { borderRadius: scale(16), paddingHorizontal: scale(18), paddingVertical: scale(20), backgroundColor: "#1c5e20", overflow: "hidden" },
  heroCircle: { position: "absolute", borderRadius: scale(999), backgroundColor: "rgba(255,255,255,0.05)" },
  heroTitle: { fontSize: scaleFont(19), fontWeight: "900", color: "#fff", marginBottom: scale(5) },
  heroDesc: { fontSize: scaleFont(12.5), color: "rgba(255,255,255,0.7)", lineHeight: moderateScale(18), marginBottom: scale(12) },
  heroStatsRow: { flexDirection: "row", gap: scale(6) },
  heroStat: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), borderRadius: scale(999), paddingHorizontal: scale(6), paddingVertical: scale(6), backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  heroStatText: { fontSize: scaleFont(9.5), fontWeight: "700", color: "rgba(255,255,255,0.85)" },

  card: { borderRadius: scale(20), borderWidth: 2, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImgWrap: { height: scale(260), backgroundColor: "#fff", alignItems: "center", justifyContent: "center", position: "relative" },
  stepBadge: { position: "absolute", top: scale(10), left: scale(10), zIndex: 2, paddingHorizontal: scale(9), paddingVertical: scale(3), borderRadius: scale(999) },
  stepBadgeText: { fontSize: scaleFont(10), fontWeight: "800" },
  cardImg: { width: "94%", height: "88%", borderRadius: scale(14) },
  cardBody: { paddingHorizontal: scale(16), paddingVertical: scale(16), borderLeftWidth: 3, justifyContent: "flex-end" },
  cardTitle: { fontSize: scaleFont(16), fontWeight: "900" },
  cardDivider: { width: scale(30), height: scale(2.5), borderRadius: scale(2), marginTop: scale(8), marginBottom: scale(10) },
  cardDesc: { fontSize: scaleFont(12.5), color: "#737373", lineHeight: moderateScale(19) },

  arrowsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(14) },
  arrowBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  arrowBtnDisabled: { opacity: 0.5 },

  dotsRow: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  dot: { width: scale(6), height: scale(6), borderRadius: scale(3), backgroundColor: "#d1d5db" },
  dotActive: { backgroundColor: BRAND, width: scale(16) },

  ctaBtn: { flexDirection: "row", alignItems: "center", gap: scale(8), backgroundColor: BRAND, borderRadius: scale(14), paddingHorizontal: scale(22), paddingVertical: scale(12), shadowColor: BRAND, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  ctaText: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#fff" },
});
