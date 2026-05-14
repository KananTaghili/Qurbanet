import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import api, { BASE_URL } from "../config/api";
import { io } from "socket.io-client";

const LOGO = require("../assets/logo.png");

const TABS = [
  {
    key: "how",
    label: "Necə\nİşləyirik",
    screen: "HowItWorks",
    icon: "help-circle-outline",
  },
  {
    key: "charity",
    label: "Xeyriyyə",
    screen: "NeedSupport",
    icon: "hand-heart-outline",
  },
  {
    key: "rules",
    label: "Qurbanın\nƏhkamları",
    screen: "QurbanRules",
    icon: "book-open-page-variant-outline",
  },
  {
    key: "orders",
    label: "Sifarişlərim",
    screen: "MyOrders",
    icon: "clipboard-text-outline",
  },
];

const azNumberToWords = (num) => {
  const n = Math.trunc(Math.abs(Number(num)));
  if (!Number.isFinite(n)) return "";

  const ones = [
    "sıfır",
    "bir",
    "iki",
    "üç",
    "dörd",
    "beş",
    "altı",
    "yeddi",
    "səkkiz",
    "doqquz",
  ];
  const tens = [
    "",
    "on",
    "iyirmi",
    "otuz",
    "qırx",
    "əlli",
    "altmış",
    "yetmiş",
    "səksən",
    "doxsan",
  ];

  if (n < 10) return ones[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${tens[t]} ${ones[o]}` : tens[t];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const hPart = h === 1 ? "yüz" : `${ones[h]} yüz`;
    const rPart = rest ? azNumberToWords(rest) : "";
    return rPart ? `${hPart} ${rPart}` : hPart;
  }
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    const thPart = th === 1 ? "min" : `${azNumberToWords(th)} min`;
    const rPart = rest ? azNumberToWords(rest) : "";
    return rPart ? `${thPart} ${rPart}` : thPart;
  }

  // Fallback for very large prices: use digits-based heuristic
  return String(n);
};

const getDenSuffixAz = (value) => {
  if (value == null) return "dən";
  const words = azNumberToWords(value);

  // Azerbaijan vowel harmony: back vowels -> "dan", front vowels -> "dən"
  const back = new Set(["a", "ı", "o", "u"]);
  const front = new Set(["ə", "e", "i", "ö", "ü"]);

  for (let i = words.length - 1; i >= 0; i--) {
    const ch = words[i].toLowerCase();
    if (back.has(ch)) return "dan";
    if (front.has(ch)) return "dən";
  }

  // If we can't detect a vowel (or got digits), default to "dən"
  return "dən";
};

export default function HomeScreen({ navigation, route }) {
  const { isGuest, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deactivationNotice, setDeactivationNotice] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchAnimals();
    const socketUrl = BASE_URL.replace(/\/api$/, "");
    const socket = io(socketUrl, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("category_updated", () => {
      fetchAnimals();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const notice = route?.params?.categoryDeactivatedNotice;
    if (!notice) return;
    setDeactivationNotice(notice);
    const timer = setTimeout(() => {
      setDeactivationNotice("");
      navigation.setParams({ categoryDeactivatedNotice: undefined });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation, route?.params?.categoryDeactivatedNotice]);

  const fetchAnimals = async () => {
    try {
      const res = await api.get("/orders/animals");
      setAnimals(res.data.data.animals);
    } catch {
      // silently ignore, show static cards
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnimal = (animal) => {
    navigation.navigate("Quantity", { animal });
  };

  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert("Çıxış", "Hesabdan çıxmaq istədiyinizə əminsiniz?", [
      { text: "Ləğv et", style: "cancel" },
      { text: "Çıxış", style: "destructive", onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.gradientHeader,
          { paddingTop: insets.top + 8, backgroundColor: "#1B5E20" },
        ]}
      >
        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoBrand}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <View style={styles.brandTextWrapper}>
              <Text style={styles.brandName}>
                Qurban<Text style={styles.brandNameAccent}>Et</Text>
              </Text>
              <Text style={styles.brandTagline}>
                Etibarli · Halal · Sürətli
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animals list */}
        <View style={styles.animalsGrid}>
          {animals.map((apiAnimal) => {
            return (
              <TouchableOpacity
                key={apiAnimal._id || apiAnimal.type}
                style={styles.animalCard}
                onPress={() => handleSelectAnimal(apiAnimal)}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: apiAnimal.imageUrl }}
                  style={styles.animalImage}
                  resizeMode="cover"
                />
                <View style={styles.animalContentRow}>
                  <View style={styles.animalInfoWrapper}>
                    <Text numberOfLines={1} style={styles.animalName}>
                      {apiAnimal.nameAz}
                    </Text>
                    {apiAnimal.pricePerShare != null && (
                      <>
                        <View style={styles.priceRow}>
                          <Text style={styles.animalPrice}>
                            {apiAnimal.orderMode === "serikli"
                              ? (
                                  apiAnimal.pricePerShare /
                                  (apiAnimal.totalShares || 1)
                                ).toFixed(0)
                              : apiAnimal.pricePerShare}
                          </Text>
                          <Text style={styles.priceSuffix}>
                            {getDenSuffixAz(apiAnimal.pricePerShare)}
                          </Text>
                        </View>
                        <Text style={styles.priceHint}>
                          Başlayan qiymətlərlə
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={styles.selectBadgeWrapper}>
                    <View style={styles.selectBadge}>
                      <Text style={styles.selectBadgeText}>Seç</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[styles.tabsContainer, { paddingBottom: insets.bottom + 6 }]}
      >
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => navigation.navigate(tab.screen)}
              activeOpacity={0.75}
            >
              <View style={styles.tabIconWrap}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={28}
                  color="#2E7D32"
                />
              </View>
              <Text style={styles.tabBtnText} numberOfLines={2}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3-dot dropdown menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuDropdown}>
                {!isGuest && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                  >
                    <Text style={styles.menuItemText}>Çıxır</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Deactivation notice */}
      {deactivationNotice ? (
        <View style={styles.noticeOverlay} pointerEvents="none">
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>{deactivationNotice}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* ── Gradient header ── */
  gradientHeader: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  logoBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  menuSpacer: { width: 36 },
  logo: {
    width: 58,
    height: 58,
    borderWidth: 0,
  },
  brandTextWrapper: {
    flexDirection: "column",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  brandNameAccent: {
    color: "#A5D6A7",
    fontWeight: "900",
    fontStyle: "italic",
  },
  brandTagline: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.4,
    fontWeight: "600",
    marginTop: 2,
  },
  menuButton: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginVertical: 1.5,
  },

  /* ── Tabs ── */
  tabsContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  tabIconWrap: {
    width: 56,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tabBtnText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
    height: 28,
  },

  /* ── Scroll ── */
  scrollView: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 16 },

  /* ── Animals list ── */
  animalsGrid: {
    flexDirection: "column",
    rowGap: 10,
  },
  animalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: "100%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  animalImage: {
    width: 170,
    height: 130,
    backgroundColor: Colors.primarySurface,
    marginLeft: 20,
  },
  animalContentRow: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingRight: 20,
    height: 130,
  },
  selectBadgeWrapper: {
    alignItems: "flex-end",
  },
  animalInfoWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  animalBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  animalInfoCol: { flex: 1, paddingRight: 6 },
  animalName: {
    fontSize: 21,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  animalPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    columnGap: 6,
    marginTop: 2,
  },
  priceSuffix: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  priceHint: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
    marginTop: 4,
  },
  selectBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBadgeText: { color: Colors.white, fontSize: 12, fontWeight: "700" },

  /* ── 3-dot menu ── */
  modalOverlay: {
    flex: 1,
  },
  menuDropdown: {
    position: "absolute",
    top: 110,
    right: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: "600",
  },

  /* ── Notice overlay ── */
  noticeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  noticeCard: {
    backgroundColor: "rgba(12,25,46,0.92)",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    maxWidth: "84%",
  },
  noticeText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
