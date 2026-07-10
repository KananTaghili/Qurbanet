import { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  Menu,
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
import QurbanSideMenu from "../components/QurbanSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";

const BRAND = "#1c5e20";

const SECTIONS = [
  {
    Icon: BookOpen,
    accent: "#166534",
    light: "#dcfce7",
    title: "Məqsədinə və hökmünə görə qurbanlar",
    items: [
      "Bayram qurbanı (Udhiyyə) — Qurban bayramı günlərində Allah rizası üçün kəsilən qurbandır. Ən məşhur qurban növüdür.",
      "Həcc qurbanı (Hədy) — Həcc və ümrə ilə əlaqəli kəsilən qurban. Xüsusilə təməttu və qiran həccində vacib olur.",
      "Əqiq qurbanı — Yeni doğulan uşağa görə şükür məqsədilə kəsilən qurban. Adətən oğlan üçün iki, qız üçün bir qoyun kəsilməsi müstəhəb sayılır.",
      'Nəzir qurbanı — İnsan bir işi əldə edərsə və ya bir hadisə baş verərsə qurban kəsməyi özünə vacib etdikdə kəsilən qurban. Məsələn: "İşim düzəlsə, qurban kəsəcəyəm."',
      "Kəffarə qurbanı — Bəzi səhvlərin və ya pozulan ibadətlərin kəffarəsi olaraq kəsilən qurban. Xüsusilə həccdə müəyyən qadağaların pozulması zamanı olur.",
      "Sədəqə və ya nafilə qurbanı — Müəyyən vaxt olmadan sadəcə Allah rizası üçün kəsilən qurban.",
    ],
  },
  {
    Icon: CircleCheckBig,
    accent: "#1e40af",
    light: "#dbeafe",
    title: "Qurbanlığın Şərtləri",
    items: [
      "Qurbanlıq şəriətdə icazəli olan heyvanlardan olmalıdır, dəvə, inək, qoyun, quzu və s.",
      "Qurbanlıq heyvanın şəriətdə yaşı müvafiq olan heyvandan olmalıdır, o da quzunu altı ayında, qoyunu bir ilində, inəyi iki ilində, dəvəni də beş ilində kəsmək olar.",
      "Qurbanlıq heyvanı xəstəlik, korluq, axsaqlıq, cılızlıq kimi xəstəliklərdən uzaq olmalıdır.",
      "Qurbanlıq heyvan qurban kəsənin şəxsi mülkü olmalıdır, yəni o, heyvanın sahibi olmalıdır.",
      "Qurbanlıq yalnız qurban kəsənin öz haqqı olmalıdır, başqasından asılı olaraq qurban kəsmək icazəli deyildir.",
    ],
  },
  {
    Icon: Users,
    accent: "#6b21a8",
    light: "#f3e8ff",
    title: "Kimlər qurban kəsməlidir?",
    items: [
      "Bir ailə başçısı xırda buynuzlu heyvanlardan birini qurban kəsərsə artıq bütün ailəsinə də bu qurbanlığı şamil etmiş olar.",
      "Dəvəni və inəyi yeddi nəfər öz aralarında şərikli kəsə bilər, və o paylardan biri ailə başçısına düşərsə artıq onu da bütün ailəyə şamil etmək olar.",
      "Xırda buynuzlu heyvanları iki və daha çox şəxs şərikli kəsə bilməz.",
    ],
  },
  {
    Icon: Beef,
    accent: "#9a3412",
    light: "#fee2e2",
    title: "Kəsilən Qurbanlıqdan hansı hissə yeyilir və hansı hissə paylanılır?",
    items: [
      "Qurban kəsən şəxs üçün ondan yemək, hədiyyə və sədəqə vermək icazəlidir.",
      "Alimlər yeyiləcək, hədiyyə və sədəqə veriləcək qurbanlığın miqdarı barəsində ixtilaf etmişlər, bu işdə qurban kəsən şəxs istədiyi kimi bölgü apara bilər, amma ən çox seçilən görüş odur ki, Qurbanlıq ətin üçdə biri yeyilir, üçdə biri hədiyyə verilir, qalan üçdə biri isə sədəqə verilir.",
      "Qurbanlıq ətini, dərisini və ya hansısa orqanını satmaq icazəli deyil və onu nəyinsə müqabilində pulun əvəzinə vermək də icazəli deyildir.",
    ],
  },
  {
    Icon: Knife,
    accent: "#065f46",
    light: "#d1fae5",
    title: "Heyvan kəsməyin şərtləri",
    items: [
      "Heyvan kəsən şəxs ağıl sahibi və ağı qaradan seçməyi bacaran insan olmalıdır. Bir şeyi başqa şeydən ayırıb seçə bilməyən və ya dəlinin kəsdiyi heyvan halal sayılmır.",
      "Kəsilən heyvan Allahdan qeyrisi üçün kəsilməməlidir.",
      "Onun üzərində Allahın adından başqa heç kimin adı çəkilməməlidir.",
      "Heyvan kəsilən an Allahın adını onun üzərində çəkmək gərəkdir, yəni Bismilləh (Allahın adı ilə) demək.",
      "Heyvanı kəsdikdə iti bir alətlə kəsmək gərəkdir.",
      "Heyvan kəsildikdə qanı axıdılmalıdır.",
      "Kəsilən heyvan şəriətdə kəsilməsi halal olan heyvan olmalıdır.",
    ],
  },
  {
    Icon: Star,
    accent: "#92400e",
    light: "#fef3c7",
    title: "Heyvan kəsməyin ədəbləri",
    items: [
      "Heyvan kəsildikdə, kəsildiyi an heyvanı qibləyə tərəf uzatmaq.",
      "Rahat bir şəkildə heyvanı kəsmək, yəni iti bir alətlə və tez bir şəkildə bunu etmək lazımdır.",
      "Dəvə kəsdikdə onu ayaq üstə dayanan vaxtda kəsmək (buda dəvənin kəsmə qaydasıdır), digər heyvanları isə yerə uzadaraq kəsmək gərəkdir.",
      "Boyun damarları ilə yanaşı ulğumu birdə qida borusunu kəsmək.",
      "Qurban kəsilən heyvandan bıçağı gizlətmək lazımdır, yalnız kəsdiyi zaman onu görməsi istisnadır.",
      'Allahın adını çəkdikdən sonra təkbir etmək, yəni "Allahu Əkbər" (Allah ən böyükdür) demək.',
      "Heyvanı kəsdikdə Allahın adını çəkib və təkbir dedikdən sonra, kimin adından kəsildiyini söyləmək, misal; Allahım bu qurbanı məndən qəbul et, başqasından olduqda isə: Allahım bu qurbanı filankəsdən qəbul et.",
    ],
  },
  {
    Icon: ShieldAlert,
    accent: "#991b1b",
    light: "#fee2e2",
    title: "Heyvan kəsdikdə bu əməllərdən çəkinmək gərəkdir",
    items: [
      "İti olmayan alətlə heyvanı kəsmək.",
      "Kəsdiyi aləti itilədikdə heyvana onu göstərmək.",
      "Başqa bir heyvanın qabağında digər heyvanı kəsmək.",
      "Heyvanı kəsmədən öncə ona əziyyət vermək, misal: boynunu və ya ayağını qırmaq, tükünü yolmaq və s. bu kimi əməllər haramdır.",
    ],
  },
];

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
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

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
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Qurbanın Əhkamları</Text>
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

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}>
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { top: -50, right: -50, width: 180, height: 180 }]} />
          <View style={[styles.heroCircle, { bottom: -30, right: 40, width: 100, height: 100 }]} />
          <View style={styles.heroIcon}>
            <BookOpen size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.heroTitle}>Qurbanın Əhkamları</Text>
            <Text style={styles.heroDesc}>İslam dininə görə qurban kəsmənin qaydaları, şərtləri və ədəbləri.</Text>
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
          <Text style={styles.footerText}>
            "Qurbanlarınız Allah qatında qəbul olsun. Allah sizdən razı olsun."
          </Text>
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

  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#166534",
    overflow: "hidden",
  },
  heroCircle: { position: "absolute", borderRadius: 999, borderWidth: 24, borderColor: "rgba(255,255,255,0.04)" },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroTitle: { fontSize: 17, fontWeight: "900", color: "#fff", marginBottom: 4 },
  heroDesc: { fontSize: 11.5, color: "rgba(255,255,255,0.7)", lineHeight: 16 },

  card: { borderRadius: 16, borderWidth: 1, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  cardIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardNum: { fontSize: 10, fontWeight: "900", marginTop: 1 },
  cardTitle: { flex: 1, fontSize: 12.5, fontWeight: "700", lineHeight: 17 },
  chevronWrap: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },

  itemsWrap: { borderTopWidth: 1 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  itemNum: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 2 },
  itemNumText: { fontSize: 9.5, fontWeight: "900", color: "#fff" },
  itemText: { flex: 1, fontSize: 12, color: "#475569", lineHeight: 18 },

  footerQuote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  footerIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(22,163,74,0.15)" },
  footerText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#166534", fontStyle: "italic", lineHeight: 17 },
});
