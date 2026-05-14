import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../theme/colors";
import api from "../config/api";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  primary: Colors.primary ?? "#4F46E5",
};

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  placed: { color: "#F59E0B", bg: "#FEF3C7", label: "Gözləmədə" },
  confirmed: { color: "#10B981", bg: "#D1FAE5", label: "Təsdiqləndi" },
  slaughtering: { color: "#EF4444", bg: "#FEE2E2", label: "Kəsilir" },
  preparing: { color: "#6366F1", bg: "#EDE9FE", label: "Hazırlanır" },
  delivering: { color: "#3B82F6", bg: "#DBEAFE", label: "Çatdırılır" },
  completed: { color: "#059669", bg: "#D1FAE5", label: "Tamamlandı" },
  cancelled: { color: "#6B7280", bg: "#F3F4F6", label: "Ləğv edildi" },
};

// ─── Charity config — ikonlar NeedSupportScreen ilə eyni ──────────────────────
// usaqlar_evi  → home (36) + flower badge (13) — yaşıl
// qocalar_evi  → home-heart (36) — mavi
// ehtiyac_sahibleri → hand-heart-outline (36) — bənövşəyi
const CHARITY_CONFIG = {
  usaqlar_evi: {
    label: "Uşaqlar evi",
    iconMain: "home",
    iconOverlay: "flower", // evin mərkəzində çiçək — şəkildəki kimi
    accentColor: "#1B6B35",
    accentBg: "#E8F5E9",
    accentMid: "#A5D6A7",
    tagBg: "#C8E6C9",
    tagColor: "#1B5E20",
  },
  qocalar_evi: {
    label: "Qocalar evi",
    iconMain: "home-heart",
    iconOverlay: null,
    accentColor: "#7B1FA2",
    accentBg: "#F3E5F5",
    accentMid: "#CE93D8",
    tagBg: "#E1BEE7",
    tagColor: "#6A1B9A",
  },
  ehtiyac_sahibleri: {
    label: "Ehtiyac sahibləri",
    iconMain: "handshake", // şəkildəki əl-əl ikonu
    iconOverlay: null,
    accentColor: "#1565C0",
    accentBg: "#E3F2FD",
    accentMid: "#90CAF9",
    tagBg: "#BBDEFB",
    tagColor: "#0D47A1",
  },
};

const ANIMAL_ASSETS = {
  quzu: require("../assets/qoyun.jpg"),
  qoyun: require("../assets/qoyun.jpg"),
  qoc: require("../assets/qoc.jpg"),
  dana: require("../assets/dana.jpg"),
  deve: require("../assets/deve.jpg"),
};

// ─── Shared primitives ─────────────────────────────────────────────────────────
const StatusDot = ({ color }) => (
  <View
    style={{
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: color,
      marginRight: 5,
    }}
  />
);

const ArrowLink = ({ color }) => {
  const c = color ?? T.primary;
  return (
    <View style={sh.footer}>
      <Text style={[sh.detailLink, { color: c }]}>Ətraflı bax</Text>
      <View style={sh.arrowWrapper}>
        <View style={[sh.arrowLine, { backgroundColor: c }]} />
        <View style={[sh.arrowHead, { borderColor: c }]} />
      </View>
    </View>
  );
};

const Divider = () => <View style={sh.divider} />;

const sh = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  detailLink: { fontSize: 12, fontWeight: "700", letterSpacing: 0.1 },
  arrowWrapper: { flexDirection: "row", alignItems: "center" },
  arrowLine: { width: 10, height: 1.5, borderRadius: 1 },
  arrowHead: {
    width: 5,
    height: 5,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    transform: [{ rotate: "45deg" }],
    marginLeft: -2,
  },
  divider: { height: 1, backgroundColor: "#F1F3F6", marginBottom: 12 },
});

// ─── Charity Icon Box — NeedSupportScreen ilə eyni məntiq ─────────────────────
// usaqlar_evi  → home (arxada, böyük) + flower (evin mərkəzində, üstündə)
// qocalar_evi  → home-heart (tək ikon)
// ehtiyac_sahibleri → handshake (tək ikon)
const CharityIconBox = ({ cfg }) => (
  <View
    style={[
      cib.box,
      { backgroundColor: cfg.accentBg, borderColor: cfg.accentMid },
    ]}
  >
    {/* Əsas ikon */}
    <MaterialCommunityIcons
      name={cfg.iconMain}
      size={36}
      color={cfg.accentColor}
    />
    {/* Overlay ikon — evin mərkəzində çiçək (usaqlar_evi) */}
    {cfg.iconOverlay && (
      <View
        style={{
          position: "absolute",
          alignSelf: "center",
          top: 25, // Evin mərkəzinə görə tənzimləmə
          backgroundColor: "#1B5E20", // Arxa fon üçün yaşıl rəng
          width: 20,
          height: 20,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name="flower"
          size={18}
          color="#FFFFFF" // Yaşılın üzərində ağ gül
        />
      </View>
    )}
  </View>
);

const cib = StyleSheet.create({
  box: {
    width: 68,
    height: 68,
    borderRadius: 15,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    position: "relative",
  },
  // Centered overlay — evin qapısı yerinə, şəkildəki kimi
  overlay: {
    position: "absolute",
    top: 18, // evin "qapı" hissəsinə uyğun
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

// ─── Regular Order Card ────────────────────────────────────────────────────────
const RegularOrderCard = ({ item, onPress }) => {
  const cfg = STATUS_CONFIG[item.status] ?? { color: T.textSec, bg: "#F3F4F6" };

  const imageSource = item.animalImageUrl
    ? { uri: item.animalImageUrl }
    : (ANIMAL_ASSETS[item.animalType] ?? ANIMAL_ASSETS.qoyun);

  const quantityLabel =
    item.orderMode === "serikli"
      ? `${Number(item.sharedPortion || item.quantity).toFixed(1)} hissə`
      : `${item.quantity} ədəd`;

  const dateStr = new Date(item.createdAt).toLocaleDateString("az-AZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[s.accentBar, { backgroundColor: cfg.color }]} />
      <View style={s.cardInner}>
        <View style={s.headerRow}>
          <View style={[s.imageWrapper, { borderColor: cfg.color }]}>
            <Image
              source={imageSource}
              style={s.animalImage}
              resizeMode="cover"
            />
          </View>
          <View style={s.titleBlock}>
            <Text style={s.animalName} numberOfLines={1}>
              {item.animalNameAz}
            </Text>
            <Text style={s.orderNumber}>{item.orderNumber}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
            <StatusDot color={cfg.color} />
            <Text style={[s.statusLabel, { color: cfg.color }]}>
              {item.statusLabel ?? cfg.label}
            </Text>
          </View>
        </View>

        <Divider />

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaCaption}>
              {item.orderMode === "serikli" ? "Hissə" : "Miqdar"}
            </Text>
            <Text style={s.metaValue}>{quantityLabel}</Text>
          </View>
          <View style={s.metaSep} />
          <View style={s.metaItem}>
            <Text style={s.metaCaption}>Məbləğ</Text>
            <Text style={[s.metaValue, s.price]}>{item.totalPrice} ₼</Text>
          </View>
          <View style={s.metaSep} />
          <View style={s.metaItem}>
            <Text style={s.metaCaption}>Tarix</Text>
            <Text style={s.metaValue}>{dateStr}</Text>
          </View>
        </View>

        {item.media?.length > 0 && (
          <View style={s.mediaStrip}>
            <MaterialCommunityIcons
              name="image-multiple-outline"
              size={14}
              color="#6366F1"
            />
            <Text style={s.mediaStripText}>
              {item.media.length} media faylı mövcuddur
            </Text>
          </View>
        )}

        <ArrowLink />
      </View>
    </TouchableOpacity>
  );
};

// ─── Charity Order Card ────────────────────────────────────────────────────────
const CharityOrderCard = ({ item, onPress }) => {
  const statusCfg = STATUS_CONFIG[item.status] ?? {
    color: T.textSec,
    bg: "#F3F4F6",
    label: "-",
  };
  const charityCfg = CHARITY_CONFIG[item.charityType] ?? {
    label: item.label ?? "Xeyir işi",
    iconMain: "heart-outline",
    iconOverlay: null,
    accentColor: "#6366F1",
    accentBg: "#EEF2FF",
    accentMid: "#C7D2FE",
    tagBg: "#E0E7FF",
    tagColor: "#4338CA",
  };

  const dateStr = new Date(item.createdAt).toLocaleDateString("az-AZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      <View
        style={[s.accentBar, { backgroundColor: charityCfg.accentColor }]}
      />

      <View style={s.cardInner}>
        <View style={s.headerRow}>
          {/* NeedSupportScreen ilə eyni icon box */}
          <CharityIconBox cfg={charityCfg} />

          <View style={s.titleBlock}>
            <Text style={s.animalName} numberOfLines={1}>
              {charityCfg.label}
            </Text>
            <Text style={s.orderNumber}>{item.orderNumber}</Text>
            {/* Xeyir işi tag */}
            <View style={[s.charityTag, { backgroundColor: charityCfg.tagBg }]}>
              <MaterialCommunityIcons
                name="charity"
                size={10}
                color={charityCfg.tagColor}
              />
              <Text style={[s.charityTagText, { color: charityCfg.tagColor }]}>
                Xeyir işi
              </Text>
            </View>
          </View>

          <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <StatusDot color={statusCfg.color} />
            <Text style={[s.statusLabel, { color: statusCfg.color }]}>
              {item.statusLabel ?? statusCfg.label}
            </Text>
          </View>
        </View>

        <Divider />

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaCaption}>Məbləğ</Text>
            <Text
              style={[
                s.metaValue,
                { color: charityCfg.accentColor, fontWeight: "700" },
              ]}
            >
              {item.totalAmount} ₼
            </Text>
          </View>
          <View style={s.metaSep} />
          <View style={s.metaItem}>
            <Text style={s.metaCaption}>Tarix</Text>
            <Text style={s.metaValue}>{dateStr}</Text>
          </View>
        </View>

        {item.video?.url && (
          <View
            style={[s.mediaStrip, { backgroundColor: charityCfg.accentBg }]}
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={14}
              color={charityCfg.accentColor}
            />
            <Text style={[s.mediaStripText, { color: charityCfg.accentColor }]}>
              Video mövcuddur
            </Text>
          </View>
        )}

        <ArrowLink color={charityCfg.accentColor} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onPress }) => (
  <View style={s.emptyContainer}>
    <View style={s.emptyIllustration}>
      <View style={s.silhouetteBody} />
      <View style={s.silhouetteHead} />
      <View style={s.silhouetteLeg1} />
      <View style={s.silhouetteLeg2} />
    </View>
    <Text style={s.emptyTitle}>Sifariş tapılmadı</Text>
    <Text style={s.emptySubtitle}>
      İlk qurban sifarişinizi aşağıdakı düymə ilə başladın
    </Text>
    <TouchableOpacity style={s.emptyBtn} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.emptyBtnText}>Sifariş ver</Text>
    </TouchableOpacity>
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const [ordersRes, charityRes] = await Promise.all([
        api.get("/orders/my").catch(() => ({ data: { data: { orders: [] } } })),
        api.get("/charity-orders").catch(() => ({ data: { data: [] } })),
      ]);
      const regularOrders = ordersRes.data?.data?.orders ?? [];
      const charityOrders = charityRes.data?.data ?? [];
      const allOrders = [...regularOrders, ...charityOrders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setOrders(allOrders);
    } catch (err) {
      console.error("Sifarişlər yüklənmədi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, []),
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={s.loadingText}>Sifarişlər yüklənir...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return <EmptyState onPress={() => navigation.navigate("Home")} />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={orders}
        keyExtractor={(item) => (item._id ?? item.id)?.toString()}
        renderItem={({ item }) => {
          const isCharity = item.charityType !== undefined;
          const onPress = () =>
            isCharity
              ? navigation.navigate("CharityOrderDetail", { orderId: item._id })
              : navigation.navigate("OrderDetail", { orderId: item.id });
          return isCharity ? (
            <CharityOrderCard item={item} onPress={onPress} />
          ) : (
            <RegularOrderCard item={item} onPress={onPress} />
          );
        }}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrders();
            }}
            tintColor={T.primary}
          />
        }
      />
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  list: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: T.bg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: T.bg,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: T.textSec, marginTop: 4 },

  // ── Card shell ─────────────────────────────
  card: {
    flexDirection: "row",
    backgroundColor: T.surface,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: { width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  cardInner: { flex: 1, padding: 14 },

  // ── Header ─────────────────────────────────
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  titleBlock: { flex: 1, marginRight: 8 },
  animalName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.textPrimary,
    letterSpacing: -0.2,
  },
  orderNumber: {
    fontSize: 12,
    color: T.textMuted,
    marginTop: 2,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // ── Regular image ───────────────────────────
  imageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F0F0F5",
    marginRight: 12,
    borderWidth: 2.5,
  },
  animalImage: { width: "100%", height: "100%" },

  // ── Charity tag ─────────────────────────────
  charityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 5,
  },
  charityTagText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  // ── Status badge ────────────────────────────
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },

  // ── Meta row ───────────────────────────────
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  metaItem: { flex: 1, alignItems: "center" },
  metaSep: { width: 1, height: 28, backgroundColor: "#E5E7EB" },
  metaCaption: {
    fontSize: 10,
    color: T.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: { fontSize: 13, color: "#374151", fontWeight: "600" },
  price: { color: T.primary, fontWeight: "700" },

  // ── Media strip ─────────────────────────────
  mediaStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
    gap: 6,
  },
  mediaStripText: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "600",
    marginLeft: 2,
  },

  // ── Empty state ─────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: T.bg,
    paddingHorizontal: 32,
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    marginBottom: 28,
    position: "relative",
  },
  silhouetteBody: {
    position: "absolute",
    width: 52,
    height: 36,
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    top: 24,
    left: 14,
  },
  silhouetteHead: {
    position: "absolute",
    width: 22,
    height: 20,
    backgroundColor: "#D1D5DB",
    borderRadius: 10,
    top: 8,
    left: 44,
  },
  silhouetteLeg1: {
    position: "absolute",
    width: 8,
    height: 22,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    bottom: 0,
    left: 22,
  },
  silhouetteLeg2: {
    position: "absolute",
    width: 8,
    height: 22,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    bottom: 0,
    left: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: T.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: T.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
