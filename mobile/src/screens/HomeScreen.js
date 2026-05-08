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

const LOGO = require("../assets/logo.jpg");

const ANIMAL_ASSETS = {
  qoyun: require("../assets/qoyun.jpg"),
  qoc: require("../assets/qoc.jpg"),
  dana: require("../assets/dana.jpg"),
  deve: require("../assets/deve.jpg"),
};

const STATIC_ANIMALS = [
  { key: "qoyun", label: "Qoyun" },
  { key: "qoc", label: "Qoç" },
  { key: "dana", label: "Dana" },
  { key: "deve", label: "Dəvə" },
];

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
      {/* Gradient header: logo + 3-dot menu + 4 tabs */}
      <LinearGradient
        colors={["#76AD79", "#1B5E20"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 8 }]}
      >
        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.menuSpacer} />
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
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

        {/* 4 Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                (tab.key === "how" || tab.key === "orders") &&
                  styles.tabBtnRaised,
              ]}
              onPress={() => navigation.navigate(tab.screen)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color="#fff"
                style={styles.tabBtnIcon}
              />
              <Text style={styles.tabBtnText}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animals grid */}
        <View style={styles.animalsGrid}>
          {STATIC_ANIMALS.map((staticA) => {
            const apiAnimal = animals.find((x) => x.type === staticA.key);
            return (
              <TouchableOpacity
                key={staticA.key}
                style={styles.animalCard}
                onPress={() => apiAnimal && handleSelectAnimal(apiAnimal)}
                activeOpacity={0.88}
              >
                <Image
                  source={ANIMAL_ASSETS[staticA.key]}
                  style={styles.animalImage}
                  resizeMode="cover"
                />
                <View style={styles.animalBottomRow}>
                  <View style={styles.animalInfoCol}>
                    <Text numberOfLines={1} style={styles.animalName}>
                      {apiAnimal?.nameAz || staticA.label}
                    </Text>
                    {apiAnimal?.pricePerShare != null && (
                      <Text style={styles.animalPrice}>
                        {apiAnimal.pricePerShare} ₼
                        <Text style={styles.perShare}> / pay</Text>
                      </Text>
                    )}
                  </View>
                  {apiAnimal && (
                    <View style={styles.selectBadge}>
                      <Text style={styles.selectBadgeText}>Seç</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
    paddingBottom: 28,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  menuSpacer: { width: 36 },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
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
  tabsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabBtnRaised: {
    transform: [{ translateY: 0 }],
  },
  tabBtnIcon: {
    marginBottom: 8,
  },
  tabBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 17,
  },

  /* ── Scroll ── */
  scrollView: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 60 },

  /* ── Animals grid ── */
  animalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  animalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: "48%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.05)",
  },
  animalImage: {
    width: "100%",
    height: 130,
    backgroundColor: Colors.primarySurface,
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
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  animalPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: 2,
  },
  perShare: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  selectBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
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
