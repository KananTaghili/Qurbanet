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
  AppState,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Video,
  Heart,
  Users,
  Plus,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import NewOpeningModal from "../components/NewOpeningModal";
import DonateModal from "../components/DonateModal";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const DARK = "#241a4d";
const ACCENT = "#551dc7";
const PURPLE = "#301586";
const PURPLE_MID = "#4b14bd";
const RING_SIZE = 144;
const RING_R = 60;

function getFeatures(lang) {
  return [
    { Icon: ShieldCheck, title: t(lang, "collective_feature1Title"), desc: t(lang, "collective_feature1Desc") },
    { Icon: Video, title: t(lang, "collective_feature2Title"), desc: t(lang, "collective_feature2Desc") },
    { Icon: Heart, title: t(lang, "collective_feature3Title"), desc: t(lang, "collective_feature3Desc") },
    { Icon: Users, title: t(lang, "collective_feature4Title"), desc: t(lang, "collective_feature4Desc") },
  ];
}

function HeroBanner({ onNewOpening, lang }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlow} />
      <ImageBackground
        source={require("../assets/images/kollektiv-hero.png")}
        style={styles.heroImg}
        imageStyle={{ borderRadius: scale(16) }}
        resizeMode="cover"
      >
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>
            {t(lang, "collective_heroTitleLine1")}{"\n"}
            <Text style={{ color: ACCENT }}>{t(lang, "collective_heroTitleLine2")}</Text>
          </Text>
          <Text style={styles.heroSub}>{t(lang, "collective_heroSub")}</Text>
          <Pressable style={styles.heroBtn} onPress={() => onNewOpening()}>
            <Plus size={13} color="#fff" strokeWidth={2.5} />
            <Text style={styles.heroBtnText}>{t(lang, "collective_heroBtn")}</Text>
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
          <Image
            source={{ uri: imgSrc }}
            style={[styles.ringImg, placeholder && { opacity: 0.4 }]}
            resizeMode="contain"
          />
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

function AnimalCard({ item, onDonate, onOpen, lang }) {
  const animal = item.animal || {};
  const opener = item.opener?.isAnonymous ? t(lang, "collective_anonymous") : (item.opener?.name || t(lang, "collective_unknown"));
  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>{animal.nameAz}</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{t(lang, "collective_badgeOngoing")}</Text>
        </View>
      </View>
      <RingProgress percent={item.percent} imgSrc={animal.imageHome || animal.image} />
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
        <Text style={styles.donateBtnText}>{t(lang, "collective_donateBtn")}</Text>
      </Pressable>
    </Pressable>
  );
}

function PlaceholderCard({ animal, onOpen, lang }) {
  return (
    <Pressable style={styles.placeholderCard} onPress={() => onOpen(animal?.nameAz)}>
      <View style={styles.cardTopRow}>
        {animal ? (
          <Text style={styles.placeholderTitle} numberOfLines={1}>{animal.nameAz}</Text>
        ) : (
          <View style={{ height: scale(14), width: scale(56), borderRadius: scale(4), backgroundColor: "#ede9fe" }} />
        )}
        <View style={styles.placeholderBadge}>
          <Text style={styles.placeholderBadgeText}>{t(lang, "collective_openingNone")}</Text>
        </View>
      </View>
      <RingProgress percent={0} imgSrc={animal?.imageHome || animal?.image} placeholder />
      <Text style={styles.placeholderAmount}>— / — AZN</Text>
      <View style={styles.organizerRow}>
        <View style={[styles.organizerAvatar, { backgroundColor: "#f3effe" }]} />
        <View style={{ height: scale(10), width: scale(70), borderRadius: scale(5), backgroundColor: "#f3effe" }} />
      </View>
      <Pressable style={styles.openBtn} onPress={() => onOpen(animal?.nameAz)}>
        <Plus size={13} color="#fff" strokeWidth={2.6} />
        <Text style={styles.donateBtnText}>{t(lang, "collective_openBtn")}</Text>
      </Pressable>
    </Pressable>
  );
}

export default function CollectiveQurbanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const FEATURES = getFeatures(lang);
  const [campaigns, setCampaigns] = useState([]);
  const [allAnimals, setAllAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOpeningOpen, setNewOpeningOpen] = useState(false);
  const [preselectedAnimal, setPreselectedAnimal] = useState(null);
  const [donateTarget, setDonateTarget] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setStatusBarStyle("light");
    });
    return () => sub.remove();
  }, []);

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
      .catch((err) => setError(err.response?.data?.message || err.message || t(lang, "collective_unknownError")))
      .finally(() => setLoading(false));
  }, [lang]);

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

  const initials = getInitials(user);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={26} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "collective_headerTitle")}</Text>
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

<ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: scale(16) }}>
        <HeroBanner onNewOpening={handleNewOpening} lang={lang} />

        <View style={{ marginTop: scale(14), marginBottom: scale(8) }}>
          <Text style={styles.sectionTitle}>{t(lang, "collective_sectionTitle")}</Text>
          <Text style={styles.sectionSub}>{t(lang, "collective_sectionSub")}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t(lang, "collective_connError")} {error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={{ paddingVertical: scale(40) }}>
            <ActivityIndicator size="large" color={PURPLE} />
          </View>
        ) : (
          <View style={styles.grid}>
            {campaigns.map((c) => (
              <AnimalCard key={c._id} item={c} lang={lang} onDonate={handleDonate} onOpen={(cItem) => navigation.navigate("CampaignDetail", { campaignId: cItem._id })} />
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <PlaceholderCard key={`ph-${i}`} animal={missingAnimals[i] || null} lang={lang} onOpen={handleNewOpening} />
            ))}
          </View>
        )}

        {!loading && (
          <View style={styles.featuresGrid}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <View key={title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Icon size={17} color={PURPLE_MID} />
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
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(10), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(40), height: scale(40), borderRadius: scale(10) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  errorBox: { marginBottom: scale(10), backgroundColor: "#FEF2F2", borderRadius: scale(12), padding: scale(12) },
  errorText: { color: "#B91C1C", fontSize: scaleFont(12), fontWeight: "600" },

  hero: { borderRadius: scale(16), overflow: "hidden", backgroundColor: "#ede9fe", minHeight: scale(180) },
  heroGlow: { position: "absolute", top: scale(-40), right: scale(-40), width: scale(160), height: scale(160), borderRadius: scale(999), backgroundColor: "rgba(124,58,237,0.18)" },
  heroImg: { width: "100%", minHeight: scale(180), justifyContent: "center" },
  heroText: { padding: scale(18), maxWidth: "62%" },
  heroTitle: { fontSize: scaleFont(23), fontWeight: "900", color: DARK, lineHeight: moderateScale(28), marginBottom: scale(7) },
  heroSub: { fontSize: scaleFont(14), color: "#6b7280", lineHeight: moderateScale(18), marginBottom: scale(12) },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(7),
    backgroundColor: PURPLE_MID,
    borderRadius: scale(10),
    paddingVertical: scale(11),
    paddingHorizontal: scale(18),
    alignSelf: "flex-start",
    shadowColor: PURPLE_MID,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBtnText: { color: "#fff", fontSize: scaleFont(14.5), fontWeight: "700" },

  sectionTitle: { fontSize: scaleFont(20), fontWeight: "900", color: DARK },
  sectionSub: { fontSize: scaleFont(14.5), color: "#9ca3af", marginTop: scale(3) },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: scale(10) },

  card: { width: "48%", backgroundColor: "#fff", borderRadius: scale(18), borderWidth: 1, borderColor: "#eee8f6", padding: scale(10) },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: scale(6), marginBottom: scale(4) },
  cardTitle: { flex: 1, fontSize: scaleFont(17.5), fontWeight: "900", color: DARK },
  cardBadge: { backgroundColor: "#ecfdf5", borderRadius: scale(6), paddingHorizontal: scale(7), paddingVertical: scale(3) },
  cardBadgeText: { fontSize: scaleFont(9.5), fontWeight: "600", color: "#059669" },
  cardAmount: { textAlign: "center", fontSize: scaleFont(15.5), fontWeight: "700", color: "#281d55", marginTop: scale(5) },

  organizerRow: { flexDirection: "row", alignItems: "center", gap: scale(6), marginTop: scale(13) },
  organizerAvatar: { width: scale(26), height: scale(26), borderRadius: scale(13), backgroundColor: "#f3e8ff", alignItems: "center", justifyContent: "center" },
  organizerAvatarText: { fontSize: scaleFont(10), fontWeight: "700", color: PURPLE_MID },
  organizerName: { flex: 1, fontSize: scaleFont(13), fontWeight: "600", color: "#342760" },

  donateBtn: { marginTop: scale(13), borderRadius: scale(10), paddingVertical: scale(11), alignItems: "center", backgroundColor: PURPLE_MID },
  donateBtnText: { color: "#fff", fontSize: scaleFont(15.5), fontWeight: "700" },

  placeholderCard: { width: "48%", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: scale(18), borderWidth: 2, borderStyle: "dashed", borderColor: "#ddd6fe", padding: scale(10) },
  placeholderTitle: { flex: 1, fontSize: scaleFont(17.5), fontWeight: "900", color: "#6b4fa0" },
  placeholderBadge: { backgroundColor: "#f5f3ff", borderRadius: scale(999), paddingHorizontal: scale(7), paddingVertical: scale(3) },
  placeholderBadgeText: { fontSize: scaleFont(9), fontWeight: "700", color: "#c4b5fd" },
  placeholderAmount: { textAlign: "center", fontSize: scaleFont(15.5), fontWeight: "600", color: "#ddd6fe", marginTop: scale(5) },
  openBtn: { marginTop: scale(13), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), borderRadius: scale(10), paddingVertical: scale(11), backgroundColor: PURPLE_MID },

  ringWrap: { alignSelf: "center", marginTop: scale(4), width: RING_SIZE, height: RING_SIZE + 16, alignItems: "center" },
  ringImgWrap: {
    position: "absolute",
    top: (RING_SIZE - (RING_R - 6) * 2) / 2,
    width: (RING_R - 6) * 2,
    height: (RING_R - 6) * 2,
    borderRadius: RING_R - 6,
    backgroundColor: "#f8f5ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ringImg: { width: "95%", height: "95%" },
  ringBadge: { position: "absolute", top: RING_SIZE - 8, borderRadius: scale(12), backgroundColor: PURPLE_MID, borderWidth: 2, borderColor: "#fff", paddingHorizontal: scale(11), paddingVertical: scale(5) },
  ringBadgeText: { fontSize: scaleFont(14), fontWeight: "900", color: "#fff" },

  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8), marginTop: scale(16) },
  featureCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#fff",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#eee8f6",
    paddingHorizontal: scale(10),
    paddingVertical: scale(10),
  },
  featureIcon: { width: scale(36), height: scale(36), borderRadius: scale(12), backgroundColor: "rgba(75,20,189,0.08)", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: scaleFont(13.5), fontWeight: "900", color: DARK },
  featureDesc: { fontSize: scaleFont(11.5), color: "#8a7ba7", marginTop: scale(1) },
});
