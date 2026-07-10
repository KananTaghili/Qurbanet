import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  Menu,
  User,
  ShieldCheck,
  Video,
  Heart,
  Users,
  Plus,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import CollectiveSideMenu from "../components/CollectiveSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import NewOpeningModal from "../components/NewOpeningModal";
import DonateModal from "../components/DonateModal";

const DARK = "#241a4d";
const ACCENT = "#551dc7";
const PURPLE = "#301586";
const PURPLE_MID = "#4b14bd";
const RING_SIZE = 96;
const RING_R = 40;

const FEATURES = [
  { Icon: ShieldCheck, title: "Tam şəffaflıq", desc: "Hər addımı izləyə bilərsiniz" },
  { Icon: Video, title: "Kəsim videosu", desc: "Kəsim videosunu izləyin" },
  { Icon: Heart, title: "Ehtiyac sahiblərinə", desc: "Birbaşa çatdırılır" },
  { Icon: Users, title: "Birlikdə xeyir", desc: "Kiçik məbləğlə böyük xeyir" },
];

function HeroBanner({ onNewOpening }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlow} />
      <ImageBackground
        source={require("../assets/images/kollektiv-hero.png")}
        style={styles.heroImg}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
      >
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>
            Birlikdə qurban,{"\n"}
            <Text style={{ color: ACCENT }}>birlikdə xeyir.</Text>
          </Text>
          <Text style={styles.heroSub}>
            Heyvanı birlikdə alın, ehtiyac sahiblərinə çatdıraq. Tam şəffaflıq, tam izlənilənlik.
          </Text>
          <Pressable style={styles.heroBtn} onPress={() => onNewOpening()}>
            <Plus size={13} color="#fff" strokeWidth={2.5} />
            <Text style={styles.heroBtnText}>Yeni açılış et</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

function RingProgress({ percent, imgSrc, placeholder }) {
  const circ = 2 * Math.PI * RING_R;
  const p = Math.max(0, Math.min(percent ?? 0, 100));
  const dash = (p / 100) * circ;

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#4513ad" />
            <Stop offset="58%" stopColor="#5f2bd1" />
            <Stop offset="100%" stopColor="#7547e6" />
          </LinearGradient>
        </Defs>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={placeholder ? "#ede9fe" : "#d9cdfa"} strokeWidth={6} fill="none" opacity={0.9} />
        {!placeholder && (
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke="url(#ringGrad)"
            strokeWidth={9}
            fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            rotation={90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        )}
      </Svg>
      <View style={styles.ringImgWrap}>
        {imgSrc ? (
          <Image source={{ uri: imgSrc }} style={styles.ringImg} resizeMode="contain" />
        ) : (
          <Plus size={26} color="#ddd6fe" strokeWidth={1.5} />
        )}
      </View>
      <View style={[styles.ringBadge, placeholder && { backgroundColor: "#ede9fe" }]}>
        <Text style={[styles.ringBadgeText, placeholder && { color: "#c4b5fd" }]}>{placeholder ? "—%" : `${p}%`}</Text>
      </View>
    </View>
  );
}

function AnimalCard({ item, onDonate, onOpen }) {
  const animal = item.animal || {};
  const opener = item.opener?.isAnonymous ? "Anonim" : (item.opener?.name || "Naməlum");
  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>{animal.nameAz}</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>Davam Edir</Text>
        </View>
      </View>
      <RingProgress percent={item.percent} imgSrc={animal.image} />
      <Text style={styles.cardAmount}>
        {item.collectedAmount} / {item.totalAmount} <Text style={{ color: PURPLE_MID }}>AZN</Text>
      </Text>
      <View style={styles.organizerRow}>
        <View style={styles.organizerAvatar}>
          <Text style={styles.organizerAvatarText}>
            {opener.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
          </Text>
        </View>
        <Text style={styles.organizerName} numberOfLines={1}>{opener}</Text>
      </View>
      <Pressable style={styles.donateBtn} onPress={() => onDonate(item)}>
        <Text style={styles.donateBtnText}>İanə et →</Text>
      </Pressable>
    </Pressable>
  );
}

function PlaceholderCard({ animal, onOpen }) {
  return (
    <Pressable style={styles.placeholderCard} onPress={() => onOpen(animal?.nameAz)}>
      <View style={styles.cardTopRow}>
        {animal ? (
          <Text style={styles.placeholderTitle} numberOfLines={1}>{animal.nameAz}</Text>
        ) : (
          <View style={{ height: 14, width: 56, borderRadius: 4, backgroundColor: "#ede9fe" }} />
        )}
        <View style={styles.placeholderBadge}>
          <Text style={styles.placeholderBadgeText}>Açılış yoxdur</Text>
        </View>
      </View>
      <RingProgress percent={0} imgSrc={animal?.imageHome || animal?.image} placeholder />
      <Text style={styles.placeholderAmount}>— / — AZN</Text>
      <View style={styles.organizerRow}>
        <View style={[styles.organizerAvatar, { backgroundColor: "#f3effe" }]} />
        <View style={{ height: 10, width: 70, borderRadius: 5, backgroundColor: "#f3effe" }} />
      </View>
      <Pressable style={styles.openBtn} onPress={() => onOpen(animal?.nameAz)}>
        <Plus size={13} color="#fff" strokeWidth={2.6} />
        <Text style={styles.donateBtnText}>Açılış et</Text>
      </Pressable>
    </Pressable>
  );
}

export default function CollectiveQurbanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [allAnimals, setAllAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newOpeningOpen, setNewOpeningOpen] = useState(false);
  const [preselectedAnimal, setPreselectedAnimal] = useState(null);
  const [donateTarget, setDonateTarget] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/campaigns/settings").catch(() => ({ data: {} })),
      api.get("/campaigns").catch(() => ({ data: {} })),
    ])
      .then(([sRes, cRes]) => {
        setAllAnimals(sRes.data?.data?.animals || []);
        setCampaigns(cRes.data?.data?.campaigns || []);
      })
      .catch((err) => setError(err.response?.data?.message || err.message || "Naməlum xəta"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewOpening = (animalName) => {
    setPreselectedAnimal(animalName || null);
    setNewOpeningOpen(true);
  };
  const handleOpeningSuccess = ({ campaignId, role, amount } = {}) => {
    setNewOpeningOpen(false);
    navigation.navigate("CollectiveConfirmation", { campaignId, role, amount });
  };
  const handleDonate = (item) => {
    setDonateTarget(item);
  };
  const handleDonateSuccess = ({ campaignId, role, amount } = {}) => {
    setDonateTarget(null);
    navigation.navigate("CollectiveConfirmation", { campaignId, role, amount });
  };

  const activeAnimalNames = new Set(campaigns.map((c) => c.animal?.nameAz));
  const missingAnimals = allAnimals.filter((a) => !activeAnimalNames.has(a.nameAz));
  const placeholderCount = Math.max(0, 4 - campaigns.length);

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Kollektiv Qurban</Text>
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

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 16 }}>
        <HeroBanner onNewOpening={handleNewOpening} />

        <View style={{ marginTop: 14, marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Davam edən açılışlar</Text>
          <Text style={styles.sectionSub}>İanə etmək üçün açılışa basın</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Bağlantı xətası: {error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={PURPLE} />
          </View>
        ) : (
          <View style={styles.grid}>
            {campaigns.map((c) => (
              <AnimalCard key={c._id} item={c} onDonate={handleDonate} onOpen={(cItem) => navigation.navigate("CampaignDetail", { campaignId: cItem._id })} />
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <PlaceholderCard key={`ph-${i}`} animal={missingAnimals[i] || null} onOpen={handleNewOpening} />
            ))}
          </View>
        )}

        {!loading && (
          <View style={styles.featuresGrid}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <View key={title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Icon size={15} color={PURPLE_MID} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.featureTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.featureDesc} numberOfLines={2}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CollectiveBottomNav active="CollectiveQurban" />

      <NewOpeningModal
        visible={newOpeningOpen}
        preselectedAnimalName={preselectedAnimal}
        onClose={() => setNewOpeningOpen(false)}
        onSuccess={handleOpeningSuccess}
      />

      <DonateModal
        visible={!!donateTarget}
        campaign={donateTarget}
        onClose={() => setDonateTarget(null)}
        onSuccess={handleDonateSuccess}
      />
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

  errorBox: { marginBottom: 10, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12 },
  errorText: { color: "#B91C1C", fontSize: 12, fontWeight: "600" },

  hero: { borderRadius: 16, overflow: "hidden", backgroundColor: "#ede9fe", minHeight: 180 },
  heroGlow: { position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 999, backgroundColor: "rgba(124,58,237,0.18)" },
  heroImg: { width: "100%", minHeight: 180, justifyContent: "center" },
  heroText: { padding: 18, maxWidth: "62%" },
  heroTitle: { fontSize: 18, fontWeight: "900", color: DARK, lineHeight: 23, marginBottom: 6 },
  heroSub: { fontSize: 11.5, color: "#6b7280", lineHeight: 16, marginBottom: 10 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PURPLE_MID,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    shadowColor: PURPLE_MID,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBtnText: { color: "#fff", fontSize: 12.5, fontWeight: "700" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: DARK },
  sectionSub: { fontSize: 11.5, color: "#9ca3af", marginTop: 2 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  card: { width: "48%", backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#eee8f6", padding: 10 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: DARK },
  cardBadge: { backgroundColor: "#ecfdf5", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cardBadgeText: { fontSize: 8.5, fontWeight: "600", color: "#059669" },
  cardAmount: { textAlign: "center", fontSize: 12, fontWeight: "700", color: "#281d55", marginTop: 4 },

  organizerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  organizerAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#f3e8ff", alignItems: "center", justifyContent: "center" },
  organizerAvatarText: { fontSize: 9, fontWeight: "700", color: PURPLE_MID },
  organizerName: { flex: 1, fontSize: 11, fontWeight: "600", color: "#342760" },

  donateBtn: { marginTop: 12, borderRadius: 10, paddingVertical: 8, alignItems: "center", backgroundColor: PURPLE_MID },
  donateBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  placeholderCard: { width: "48%", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 18, borderWidth: 2, borderStyle: "dashed", borderColor: "#ddd6fe", padding: 10 },
  placeholderTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#6b4fa0" },
  placeholderBadge: { backgroundColor: "#f5f3ff", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  placeholderBadgeText: { fontSize: 8, fontWeight: "700", color: "#c4b5fd" },
  placeholderAmount: { textAlign: "center", fontSize: 12, fontWeight: "600", color: "#ddd6fe", marginTop: 4 },
  openBtn: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 8, backgroundColor: PURPLE_MID },

  ringWrap: { alignSelf: "center", marginTop: 4, width: RING_SIZE, height: RING_SIZE + 16, alignItems: "center" },
  ringImgWrap: {
    position: "absolute",
    top: (RING_SIZE - (RING_R - 8) * 2) / 2,
    width: (RING_R - 8) * 2,
    height: (RING_R - 8) * 2,
    borderRadius: RING_R - 8,
    backgroundColor: "#f8f5ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ringImg: { width: "92%", height: "92%" },
  ringBadge: { position: "absolute", top: RING_SIZE - 8, borderRadius: 12, backgroundColor: PURPLE_MID, borderWidth: 2, borderColor: "#fff", paddingHorizontal: 10, paddingVertical: 4 },
  ringBadgeText: { fontSize: 12, fontWeight: "900", color: "#fff" },

  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  featureCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee8f6",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  featureIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(75,20,189,0.08)", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 11, fontWeight: "700", color: DARK },
  featureDesc: { fontSize: 9.5, color: "#8a7ba7", marginTop: 1 },
});
