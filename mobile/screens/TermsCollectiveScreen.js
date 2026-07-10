import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Menu, User, ChartBarBig, Coins, Beef, UserRoundCheck, Lock, FileText } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import CollectiveSideMenu from "../components/CollectiveSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import api from "../lib/api";

const PURPLE = "#301586";
const DARK = "#241a4d";

const SERTLER_STATIC = [
  {
    Icon: Beef,
    bg: "#fffbeb",
    color: "#f59e0b",
    titleColor: "#b45309",
    value: "Hər heyvan növünə 1 ədəd",
    label: "Hər heyvan tipi üçün yalnız 1 açılış ola bilər. Yeni açılış üçün müvafiq heyvan tipinə uyğun davam edən açılışın bitməsi lazımdır.",
  },
  {
    Icon: UserRoundCheck,
    bg: "#eff6ff",
    color: "#3b82f6",
    titleColor: "#1d4ed8",
    value: "Yeni açılışa 1 nəfər",
    label: "Yeni açılışı yalnız bir nəfər edə bilər. Yeni açılış əlavə et səhifəsinə daxil olaraq aktiv görünən heyvan tipini seçib ilkin ödənişi etdikdən sonra açılış baş tutacaq.",
  },
  {
    Icon: Lock,
    bg: "#fff1f2",
    color: "#f43f5e",
    titleColor: "#be123c",
    value: "Anonim açılış və ya ianə",
    label: "Əgər adınızın digər istifadəçilərə görünməsini istəmirsinizsə həm Anonim olaraq açılış edə bilərsiniz, həm də ianə verə bilərsiniz. Bu zaman qeydiyyat etməyə ehtiyac yoxdur.",
  },
  {
    Icon: FileText,
    bg: "#f0fdfa",
    color: "#14b8a6",
    titleColor: "#0f766e",
    value: "Şəxsi səhifə",
    label: "Əgər qeydiyyatdan keçmisinizsə əsas səhifədən İanələrim bölməsinə keçərək etdiyiniz açılış və ianə detalları haqqında ətraflı məlumat əldə edə bilərsiniz.",
  },
];

export default function TermsCollectiveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [minDon, setMinDon] = useState(10);
  const [minOpenPct, setMinOpenPct] = useState(30);

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

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
      value: `Yeni Açılış üçün minimum ${minOpenPct}%`,
      label: `Yeni ianə açılışı zamanı ümumi qurbanlıq məbləğinin minimum ${minOpenPct}%-ni açılış edən şəxs ödəməlidir.`,
    },
    {
      Icon: Coins,
      bg: "#ecfdf5",
      color: "#10b981",
      titleColor: "#047857",
      value: `İanə üçün minimum ${minDon} AZN`,
      label: `Əsas səhifədə göstərilən açılışı davam edən qurbanlıqlara ianə vermək üçün minimum ${minDon} AZN tələb olunur.`,
    },
    ...SERTLER_STATIC,
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Şərtlərimiz</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={PURPLE} iconColor="#fff" />
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

      <CollectiveSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>
        <Text style={styles.subTitle}>Platforma qaydaları və istifadə şərtləri</Text>

        <View style={styles.grid}>
          {sertler.map((s) => (
            <View key={s.value} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: s.bg }]}>
                <s.Icon size={16} color={s.color} />
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
  subTitle: { fontSize: 12, fontWeight: "600", color: "#8778a8", marginBottom: 12 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#eee8f6", padding: 12, gap: 6, shadowColor: "#2e175c", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardValue: { fontSize: 12.5, fontWeight: "800", lineHeight: 17 },
  cardLabel: { fontSize: 10.5, color: "#9ca3af", lineHeight: 15 },
});
