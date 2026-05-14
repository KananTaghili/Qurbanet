import React, { useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Colors } from "../theme/colors";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  border: "#EAECF0",
  textPrimary: "#111827",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  primary: Colors.primary ?? "#1B6B35",
  shadow: Platform.select({
    ios: {
      shadowColor: "#1A1A2E",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
    android: { elevation: 3 },
  }),
};

// ─── Charity label map ─────────────────────────────────────────────────────────
const TARGET_CONFIG = {
  usaqlar_evi: {
    label: "Uşaqlar evi",
    icon: "home",
    overlayIcon: "flower",
    color: "#1B6B35",
    bg: "#E8F5E9",
    border: "#A5D6A7",
  },
  qocalar_evi: {
    label: "Qocalar evi",
    icon: "home-heart",
    overlayIcon: null,
    color: "#7B1FA2",
    bg: "#F3E5F5",
    border: "#CE93D8",
  },
  ehtiyac_sahibleri: {
    label: "Ehtiyac sahibləri",
    icon: "handshake",
    overlayIcon: null,
    color: "#1565C0",
    bg: "#E3F2FD",
    border: "#90CAF9",
  },
};

// ─── Info row card ─────────────────────────────────────────────────────────────
const InfoCard = ({ icon, iconColor, iconBg, title, children }) => (
  <View style={[ic.card, T.shadow]}>
    <View style={[ic.iconBox, { backgroundColor: iconBg ?? T.primary + "15" }]}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={iconColor ?? T.primary}
      />
    </View>
    <View style={ic.body}>
      <Text style={ic.title}>{title}</Text>
      <View style={{ marginTop: 3 }}>{children}</View>
    </View>
  </View>
);

const ic = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 14,
    width: "100%",
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700", color: T.textPrimary },
});

// ─── Charity icon (same as NeedSupportScreen / MyOrdersScreen) ────────────────
const CharityIcon = ({ cfg }) => (
  <View style={[chi.box, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
    <MaterialCommunityIcons name={cfg.icon} size={36} color={cfg.color} />
    {cfg.overlayIcon && (
      <View style={[chi.overlay, { backgroundColor: cfg.color }]}>
        <MaterialCommunityIcons
          name={cfg.overlayIcon}
          size={14}
          color="#FFFFFF"
        />
      </View>
    )}
  </View>
);

const chi = StyleSheet.create({
  box: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    position: "relative",
    marginBottom: 16,
  },
  overlay: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function CharityConfirmationScreen({ navigation, route }) {
  const { charityOrder, label, totalAmount } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const targetCfg = TARGET_CONFIG[charityOrder?.charityType] ?? {
    label: label ?? "Xeyir işi",
    icon: "heart-outline",
    overlayIcon: null,
    color: T.primary,
    bg: T.primary + "15",
    border: T.primary + "40",
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: targetCfg.color,
      },
      headerTintColor: Colors.white,
    });
  }, [navigation, targetCfg.color]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Animated success icon ── */}
      <Animated.View
        style={[s.successCircle, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={[s.checkRing, { borderColor: T.primary + "30" }]}>
          <View style={[s.checkInner, { backgroundColor: T.primary + "18" }]}>
            <MaterialCommunityIcons
              name="check-bold"
              size={38}
              color={T.primary}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Titles ── */}
      <Text style={s.title}>Ödəniş uğurlu oldu!</Text>
      <Text style={s.subtitle}>Xeyriyyə ödənişiniz qəbul edildi</Text>

      {/* ── Charity icon + order number card ── */}
      <View style={[s.orderCard, { backgroundColor: targetCfg.color }]}>
        <CharityIcon cfg={targetCfg} />
        <Text style={s.orderLabel}>Sifariş nömrəsi</Text>
        <Text style={s.orderNumber}>{charityOrder?.orderNumber}</Text>
      </View>

      {/* ── Info cards ── */}
      <InfoCard
        icon={targetCfg.icon}
        iconColor={targetCfg.color}
        iconBg={targetCfg.bg}
        title="Xeyriyyə istiqaməti"
      >
        <Text
          style={[s.infoDesc, { color: targetCfg.color, fontWeight: "700" }]}
        >
          {targetCfg.label}
        </Text>
      </InfoCard>

      <InfoCard
        icon="credit-card-outline"
        iconColor="#059669"
        iconBg="#ECFDF5"
        title="Ödəniş məlumatı"
      >
        <Text style={s.infoDesc}>
          Kart ilə{" "}
          <Text style={[s.bold, { color: T.primary }]}>{totalAmount} ₼</Text>{" "}
          ödənildi
        </Text>
      </InfoCard>

      <InfoCard
        icon="video-outline"
        iconColor="#7C3AED"
        iconBg="#F3E8FF"
        title="Video və status"
      >
        <Text style={s.infoDesc}>
          Status yeniləmələri və admin tərəfindən yüklənən video{" "}
          <Text style={{ fontWeight: "700", color: T.textPrimary }}>
            "Sifarişlərim"
          </Text>{" "}
          bölməsində görünəcək.
        </Text>
      </InfoCard>

      {/* ── Dua card ── */}
      <View style={s.duaCard}>
        <View style={s.duaIconWrap}>
          <MaterialCommunityIcons
            name="hands-pray"
            size={20}
            color={T.primary}
          />
        </View>
        <Text style={s.duaText}>
          "Allah xeyriyyənizi qəbul etsin. Ehtiyac sahibləri üçün dəstəyiniz
          dəyərlidir."
        </Text>
      </View>

      {/* ── Buttons ── */}
      <TouchableOpacity
        style={[s.primaryBtn, { backgroundColor: targetCfg.color }]}
        onPress={() =>
          navigation.navigate("MyOrders", { charityOrderId: charityOrder?._id })
        }
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={20}
          color="#FFFFFF"
        />
        <Text style={s.primaryBtnText}>Sifarişimi izlə</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.secondaryBtn}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.85}
      >
        <Text style={s.secondaryBtnText}>Ana səhifəyə qayıt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 44, alignItems: "center" },

  // ── Success animation ──────────────────────
  successCircle: { marginTop: 36, marginBottom: 20, alignItems: "center" },
  checkRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Titles ─────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: T.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: T.textSec,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },

  // ── Order card ─────────────────────────────
  orderCard: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  orderLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  orderNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
    letterSpacing: 1.5,
  },

  // ── Info cards ─────────────────────────────
  infoDesc: { fontSize: 13, color: T.textSec, lineHeight: 19 },
  bold: { fontWeight: "700" },

  // ── Dua card ───────────────────────────────
  duaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: T.primary + "10",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginVertical: 6,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: T.primary,
  },
  duaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  duaText: {
    flex: 1,
    fontSize: 13,
    color: T.textPrimary,
    lineHeight: 21,
    fontStyle: "italic",
  },

  // ── Buttons ────────────────────────────────
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    width: "100%",
    marginBottom: 10,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  secondaryBtn: {
    backgroundColor: T.surface,
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
  },
  secondaryBtnText: { color: T.textSec, fontSize: 15, fontWeight: "600" },
});
