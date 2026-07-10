import { useCallback, useRef, useState } from "react";
import { View, Text, Image, Pressable, FlatList, ScrollView, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Menu, User, Video, ShieldCheck, Clock3, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import QurbanSideMenu from "../components/QurbanSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";

const BRAND = "#1c5e20";
const CARD_GAP = 12;

const STEPS = [
  {
    label: "Addım 1",
    title: "Qurbanlıq Seçimi",
    desc: "Müxtəlif bölgələrimizdən gətirilən qurbanlıq xüsusiyyətlərinə malik heyvanlar sifariş etdiyiniz heyvan tipi, çəkisi və s. seçimlərinizə uyğun olaraq seçilir.",
    img: require("../assets/images/qoyun_big.png"),
    color: "#166534",
    light: "#dcfce7",
    mid: "#16a34a",
  },
  {
    label: "Addım 2",
    title: "Kəsim",
    desc: "Heyvanlar baytarlıq-sanitariya tələblərinə ciddi şəkildə riayət olunan heyvan kəsim məntəqələrində, xüsusi təmiz geyimdə işçi heyəti tərəfindən kəsilir. Kəsim prosesi bütünlüklə şəriət qaydalarına uyğun həyata keçirilir. Kəsim zamanı sizin adınız səsləndirilməklə qısa video çəkilir və sizin proqram səhifənizə göndərilir.",
    img: require("../assets/images/bicaq.png"),
    color: "#9a3412",
    light: "#fee2e2",
    mid: "#ea580c",
  },
  {
    label: "Addım 3",
    title: "Hazırlanma",
    desc: "Hazırlanma mərhələsində kəsilmiş qurbanlıq ətinin həm dadlı həm də yumuşaq olması üçün bir müddət otaq tempraturunda asılı vəziyyətdə saxlanılır, daha sonra saxlamağa uyğun tempraturlarda olan soyuducularda dinləndirilir. Soyuducuda dinləndirilmiş qurbanlıq heyvan əti sizin seçiminizə uyğun olaraq tam cəmdək vəya doğranmış şəkildə paketlərə doldurularaq çatdırılmağa hazır vəziyyətə gətirilir.",
    img: require("../assets/images/meatbox-qutu.png"),
    fit: "contain",
    color: "#065f46",
    light: "#d1fae5",
    mid: "#059669",
  },
  {
    label: "Addım 4",
    title: "Çatdırılma",
    desc: "Çatdırılma ət məhsullarının daşınması və çatdırılması tələblərinə uyğun olaraq tempratur, gigiyena və sanitar qaydalara əməl edilməklə çatdırılır. Çatdırılma sizin sifariş zamanı seçdiyiniz tarixdə həyata keçirilir.",
    img: require("../assets/images/masin.png"),
    color: "#1e3a8a",
    light: "#dbeafe",
    mid: "#2563eb",
  },
];

const HERO_STATS = [
  { Icon: ShieldCheck, label: "100% Halal Kəsim" },
  { Icon: Video, label: "Video Hesabat" },
  { Icon: Clock3, label: "24–48s Çatdırılma" },
];

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
        <ScrollView style={styles.cardDescScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.cardDesc}>{step.desc}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

export default function HowItWorksQurbanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = screenWidth - 24;
  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

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
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Necə işləyir?</Text>
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

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 12 }}>
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { top: -40, right: -40, width: 160, height: 160 }]} />
          <View style={[styles.heroCircle, { bottom: -24, left: -16, width: 120, height: 120 }]} />
          <Text style={styles.heroTitle}>Necə İşləyirik?</Text>
          <Text style={styles.heroDesc}>Qurbanlıq Sifarişi — seçimdən çatdırılmaya qədər şəffaf, etibarlı və sürətli.</Text>
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
            <Text style={styles.ctaText}>Sifarişə başla</Text>
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
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  menuBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 5 },
  loginText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  hero: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 20, backgroundColor: "#1c5e20", overflow: "hidden" },
  heroCircle: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.05)" },
  heroTitle: { fontSize: 19, fontWeight: "900", color: "#fff", marginBottom: 5 },
  heroDesc: { fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 18, marginBottom: 12 },
  heroStatsRow: { flexDirection: "row", gap: 6 },
  heroStat: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  heroStatText: { fontSize: 9.5, fontWeight: "700", color: "rgba(255,255,255,0.85)" },

  card: { borderRadius: 20, borderWidth: 2, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImgWrap: { height: 260, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", position: "relative" },
  stepBadge: { position: "absolute", top: 10, left: 10, zIndex: 2, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  stepBadgeText: { fontSize: 10, fontWeight: "800" },
  cardImg: { width: "94%", height: "88%", borderRadius: 14 },
  cardBody: { paddingHorizontal: 16, paddingVertical: 16, borderLeftWidth: 3, justifyContent: "flex-end" },
  cardTitle: { fontSize: 16, fontWeight: "900" },
  cardDivider: { width: 30, height: 2.5, borderRadius: 2, marginTop: 8, marginBottom: 10 },
  cardDescScroll: { maxHeight: 110 },
  cardDesc: { fontSize: 12.5, color: "#737373", lineHeight: 19 },

  arrowsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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

  dotsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { backgroundColor: BRAND, width: 16 },

  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12, shadowColor: BRAND, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  ctaText: { fontSize: 13.5, fontWeight: "800", color: "#fff" },
});
