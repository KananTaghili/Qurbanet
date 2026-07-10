import { useCallback, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  Menu,
  User,
  ClipboardList,
  Video,
  ArrowRight,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Wallet,
  Activity,
  Scale,
  Star,
} from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import { useAuth } from "../context/AuthContext";
import QurbanSideMenu from "../components/QurbanSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";
import api from "../lib/api";

const BRAND = "#1c5e20";
const AZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

function fmtDate(ds) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${AZ_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CFG = {
  awaiting_payment: { label: "Ödəniş gözlənilir", step: 0 },
  placed: { label: "Sifariş yoxlanılır", step: 0 },
  pending_payment: { label: "Ödəniş gözlənilir", step: 0 },
  confirmed: { label: "Təsdiqləndi", step: 1 },
  paid: { label: "Ödənilib", step: 1 },
  slaughtering: { label: "Kəsilir", step: 2 },
  preparing: { label: "Hazırlanır", step: 3 },
  delivering: { label: "Çatdırılır", step: 4 },
  completed: { label: "Tamamlandı", step: 5 },
  cancelled: { label: "Ləğv edildi", step: -1 },
};

const PIPELINE_STEPS = [
  { label: "Yoxlanılır", Icon: Clock },
  { label: "Təsdiq", Icon: CheckCircle2 },
  { label: "Kəsilir", Icon: Knife },
  { label: "Hazırlanır", Icon: Package },
  { label: "Çatdırılır", Icon: Truck },
  { label: "Tamam", Icon: Star },
];

function CancelledBadge() {
  return (
    <View style={styles.cancelledBadge}>
      <XCircle size={14} color="#DC2626" />
      <Text style={styles.cancelledText}>Ləğv edildi</Text>
    </View>
  );
}

function Pipeline({ step }) {
  if (step < 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {PIPELINE_STEPS.map(({ label, Icon }, i) => {
        const done = i <= step;
        const isLast = i === PIPELINE_STEPS.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
              <View style={[styles.pipeLine, { backgroundColor: i === 0 ? "transparent" : done ? BRAND : "#e5e7eb" }]} />
              <View style={[styles.pipeCircle, { backgroundColor: done ? BRAND : "#e9eee9", borderColor: done ? BRAND : "#d1d5db" }]}>
                <Icon size={10} color={done ? "#fff" : "#9ca3af"} />
              </View>
              <View style={[styles.pipeLine, { backgroundColor: isLast ? "transparent" : done && i < step ? BRAND : "#e5e7eb" }]} />
            </View>
            <Text style={[styles.pipeLabel, { color: done ? BRAND : "#9ca3af" }]} numberOfLines={1}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StatCard({ Icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon size={15} color={BRAND} strokeWidth={1.8} />
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function OrderCard({ item, onPress }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.placed;
  const PipeIcon = PIPELINE_STEPS[Math.max(0, cfg.step)]?.Icon || Clock;
  const title = item.animalNameAz || "Heyvan";
  const orderNum = item.orderNumber || `QRB-${new Date(item.createdAt || Date.now()).getFullYear()}-${String(item.id || item._id).slice(-5).toUpperCase()}`;
  const qty = item.quantity || item.sharedPortion || 1;
  const amount = item.totalPrice ?? null;
  const weight = item.lambSelection?.weightCategoryLabel || null;
  const imgSrc = item.animalImageUrl;

  return (
    <Pressable style={{ marginTop: 24 }} onPress={onPress}>
      <View style={styles.statusFloat}>
        <PipeIcon size={18} color="#fff" />
      </View>
      <View style={styles.orderCard}>
        <View style={styles.orderImgWrap}>
          {imgSrc ? (
            <Image source={{ uri: imgSrc }} style={styles.orderImg} resizeMode="cover" />
          ) : (
            <Image source={require("../assets/images/qoyun-fallback.jpg")} style={styles.orderImg} resizeMode="cover" />
          )}
          <View style={styles.orderImgOverlay}>
            <Text style={styles.orderNumText} numberOfLines={1}>{orderNum}</Text>
          </View>
        </View>
        <View style={styles.orderBody}>
          <View style={styles.orderTitleRow}>
            <Text style={styles.orderTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.orderDate}>{fmtDate(item.createdAt)}</Text>
          </View>
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <ShoppingBag size={9} color="#2d5a2d" />
              <Text style={styles.chipText}>{qty} ədəd</Text>
            </View>
            {amount != null && (
              <View style={styles.chip}>
                <Wallet size={9} color={BRAND} />
                <Text style={[styles.chipText, { color: BRAND }]}>{amount} AZN</Text>
              </View>
            )}
            {weight && (
              <View style={styles.chip}>
                <Scale size={9} color="#2d5a2d" />
                <Text style={styles.chipText}>{weight}</Text>
              </View>
            )}
            {item.media?.length > 0 && (
              <View style={[styles.chip, { backgroundColor: "#eff6ff" }]}>
                <Video size={9} color="#2563eb" />
                <Text style={[styles.chipText, { color: "#2563eb" }]}>Video</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.pipeWrap}>
          {cfg.step < 0 ? <CancelledBadge /> : <Pipeline step={cfg.step} />}
        </View>
      </View>
    </Pressable>
  );
}

const TAB_META = {
  all: { label: "Hamısı", Icon: ClipboardList },
  active: { label: "Aktiv", Icon: Activity },
  completed: { label: "Tamamlanmış", Icon: CheckCircle2 },
  cancelled: { label: "Ləğv edildi", Icon: XCircle },
};

export default function MyOrdersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filter, setFilter] = useState("all");

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setFetchError(false);
    api.get("/orders/my")
      .then((res) => setOrders(res.data.data?.orders || []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const activeCount = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
  const totalAmount = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);

  const TABS = [
    { key: "all", count: orders.length, filterFn: () => true },
    { key: "active", count: activeCount, filterFn: (o) => !["completed", "cancelled"].includes(o.status) },
    { key: "completed", count: orders.filter((o) => o.status === "completed").length, filterFn: (o) => o.status === "completed" },
    { key: "cancelled", count: orders.filter((o) => o.status === "cancelled").length, filterFn: (o) => o.status === "cancelled" },
  ].filter((tab) => tab.key === "all" || tab.count > 0);

  const activeTab = TABS.find((t) => t.key === filter) || TABS[0];
  const filtered = orders.filter(activeTab.filterFn);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Sifarişlərim</Text>
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

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : fetchError ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: "#fef2f2" }]}>
              <ClipboardList size={32} color="#f87171" />
            </View>
            <Text style={styles.emptyTitle}>Sifarişlər yüklənmədi</Text>
            <Text style={styles.emptySub}>İnternet bağlantınızı yoxlayın</Text>
            <Pressable style={styles.retryBtn} onPress={fetchOrders}>
              <RefreshCw size={14} color="#fff" />
              <Text style={styles.retryBtnText}>Yenidən cəhd et</Text>
            </Pressable>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <ClipboardList size={32} color={BRAND} />
            </View>
            <Text style={styles.emptyTitle}>Hələ sifarişiniz yoxdur</Text>
            <Text style={styles.emptySub}>İlk qurbanlıq sifarişinizi verin</Text>
            <Pressable style={styles.retryBtn} onPress={() => navigation.navigate("Qurban")}>
              <Text style={styles.retryBtnText}>Sifariş ver</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard Icon={ClipboardList} label="Ümumi" value={orders.length} />
              <StatCard Icon={Activity} label="Aktiv" value={activeCount} />
              <StatCard Icon={Wallet} label="Məbləğ" value={`${totalAmount.toFixed(0)} AZN`} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {TABS.map((tab) => {
                const meta = TAB_META[tab.key];
                const active = tab.key === filter;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => setFilter(tab.key)}
                  >
                    <meta.Icon size={13} color={active ? "#fff" : BRAND} />
                    <Text style={[styles.filterPillText, active && { color: "#fff" }]}>{meta.label}</Text>
                    <View style={[styles.filterCount, active && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                      <Text style={[styles.filterCountText, active && { color: "#fff" }]}>{tab.count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filtered.length === 0 ? (
              <Text style={styles.noneInCategory}>Bu kateqoriyada sifariş yoxdur</Text>
            ) : (
              filtered.map((item) => (
                <OrderCard key={item.id || item._id} item={item} onPress={() => navigation.navigate("OrderDetail", { orderId: item.id || item._id })} />
              ))
            )}
          </>
        )}
      </ScrollView>

      <QurbanBottomNav active="MyOrders" />
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

  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 6 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#e8f5e9", marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#071b0d" },
  emptySub: { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BRAND, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e8f0e8", paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", gap: 4 },
  statIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#e8f5e9", alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 9, color: "#9ca3af", fontWeight: "600" },
  statValue: { fontSize: 13, fontWeight: "900", color: "#071b0d" },

  filterPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderWidth: 2, borderColor: "#d4edda", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterPillActive: { backgroundColor: BRAND, borderColor: BRAND },
  filterPillText: { fontSize: 12, fontWeight: "800", color: BRAND },
  filterCount: { backgroundColor: "#e8f5e9", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  filterCountText: { fontSize: 10, fontWeight: "900", color: BRAND },

  noneInCategory: { textAlign: "center", color: "#9ca3af", fontSize: 13, paddingVertical: 40 },

  statusFloat: { position: "absolute", top: -14, right: 10, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  orderCard: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: "#e8f0e8", shadowColor: BRAND, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  orderImgWrap: { width: "100%", height: 140, backgroundColor: "#f0f7f0" },
  orderImg: { width: "100%", height: "100%" },
  orderImgOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "rgba(0,0,0,0.4)" },
  orderNumText: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.9)" },
  orderBody: { paddingHorizontal: 12, paddingVertical: 12, gap: 7 },
  orderTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  orderTitle: { flex: 1, fontSize: 16, fontWeight: "900", color: "#071b0d" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f0f7f0", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  chipText: { fontSize: 10, fontWeight: "800", color: "#2d5a2d" },
  orderDate: { fontSize: 10, color: "#9ca3af", flexShrink: 0 },
  pipeWrap: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },

  pipeLine: { flex: 1, height: 1.5 },
  pipeCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  pipeLabel: { fontSize: 7.5, fontWeight: "800", marginTop: 3, textAlign: "center" },

  cancelledBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", borderWidth: 1.5, borderColor: "#FECACA", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" },
  cancelledText: { fontSize: 12, fontWeight: "800", color: "#991B1B" },
});
