import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Menu, User, UserRoundCheck, CirclePlus, Coins, Video, HandHeart, Heart } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import CollectiveSideMenu from "../components/CollectiveSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";

const PURPLE = "#301586";
const DARK = "#241a4d";

const STEPS = [
  {
    Icon: UserRoundCheck,
    color: "#ea580c",
    bg: "#fed7aa",
    title: "Qeydiyyatdan keçirsiz və ya Anonim davam edirsiz",
    desc: "Platformada hesab yaradın və ya qeydiyyatdan keçmədən anonim şəkildə davam edərək şəxsiyyətinizi təsdiqləyin.",
  },
  {
    Icon: CirclePlus,
    color: "#0891b2",
    bg: "#a5f3fc",
    title: "Yeni Açılış edirsiz və ya Davam edən açılışlardan seçirsiz",
    desc: "Əgər hansısa qurbanlıq tipi açılışı yoxdursa yeni açılış edə bilərsiniz. Və ya davam edən qurban açılışlarına baxıb, sizə uyğun olanı seçə bilərsiniz.",
  },
  {
    Icon: Coins,
    color: "#7c3aed",
    bg: "#ddd6fe",
    title: "İanə məbləğini daxil edib, ödəniş səhifəsinə keçirsiz",
    desc: "Seçdiyiniz heyvana görə ianə məbləğini daxil edib, təhlükəsiz ödəniş səhifəsinə keçirsiz.",
  },
  {
    Icon: Video,
    color: "#db2777",
    bg: "#fce7f3",
    title: "Tamamlanmış qurbanlığın kəsim videosunu izləyə bilərsiz",
    desc: "Qurbanlığın tam məbləği toplandıqdan sonra qurbanlığı biz alırıq və kəsirik. Kəsim zamanı qurbanlığın kəsim videosu çəkilir və səhifəyə yüklənir.",
  },
  {
    Icon: HandHeart,
    color: "#16a34a",
    bg: "#bbf7d0",
    title: "Kəsilmiş qurbanlığı biz çatdırırıq",
    desc: "Kəsilmiş qurbanlıq doğranaraq paylara bölünür və ehtiyac sahibi ailələrə paylanılır.",
  },
];

export default function HowItWorksCollectiveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

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
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Necə işləyir?</Text>
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
        <Text style={styles.subTitle}>Kollektiv platformasında qurban prosesi</Text>

        <View style={{ marginTop: 12 }}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={{ alignItems: "center" }}>
                <View style={[styles.stepIcon, { backgroundColor: s.bg }]}>
                  <s.Icon size={20} strokeWidth={2.3} color={s.color} />
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
            <Heart size={15} color="#fff" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTitle}>Yaxşılıq elə ki, başına gəlsin.</Text>
            <Text style={styles.footerSub}>Tam şəffaflıq · Halal kəsim · Ehtiyac sahiblərinə çatdırılır</Text>
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
  subTitle: { fontSize: 12, fontWeight: "600", color: "#8778a8" },

  stepRow: { flexDirection: "row", gap: 12 },
  stepIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  stepConnector: { width: 2, flex: 1, backgroundColor: "#e4d9f9", marginVertical: 2, minHeight: 12 },
  stepCard: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: "#ece6f5", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, shadowColor: "#2e175c", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  stepTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 4 },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#f1ecff", alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumText: { fontSize: 10, fontWeight: "900", color: "#5b22c7" },
  stepTitle: { flex: 1, fontSize: 13, fontWeight: "800", color: DARK, lineHeight: 18 },
  stepDesc: { fontSize: 12, color: "#6b7280", lineHeight: 17, paddingLeft: 28 },

  footerCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: "#e7e1f0", backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12 },
  footerIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#5319bc", alignItems: "center", justifyContent: "center" },
  footerTitle: { fontSize: 12.5, fontWeight: "800", color: DARK },
  footerSub: { fontSize: 11, color: "#8778a8", marginTop: 2 },
});
