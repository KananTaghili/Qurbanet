import { useCallback, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  ArrowLeft,
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
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import QurbanBottomNav from "../components/QurbanBottomNav";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

function fmtDate(ds, lang) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${t(lang, "months_short")[d.getMonth()]} ${d.getFullYear()}`;
}

function statusCfg(lang) {
  return {
    awaiting_payment: { label: t(lang, "orderStatus_awaitingPayment"), step: 0 },
    placed: { label: t(lang, "orderStatus_placed"), step: 0 },
    pending_payment: { label: t(lang, "orderStatus_awaitingPayment"), step: 0 },
    confirmed: { label: t(lang, "orderStatus_confirmed"), step: 1 },
    paid: { label: t(lang, "orderStatus_paid"), step: 1 },
    slaughtering: { label: t(lang, "orderStatus_slaughtering"), step: 2 },
    preparing: { label: t(lang, "orderStatus_preparing"), step: 3 },
    delivering: { label: t(lang, "orderStatus_delivering"), step: 4 },
    completed: { label: t(lang, "orderStatus_completed"), step: 5 },
    cancelled: { label: t(lang, "orderStatus_cancelled"), step: -1 },
  };
}

function pipelineSteps(lang) {
  return [
    { label: t(lang, "pipeline_checking"), Icon: Clock },
    { label: t(lang, "pipeline_confirm"), Icon: CheckCircle2 },
    { label: t(lang, "pipeline_slaughtering"), Icon: Knife },
    { label: t(lang, "pipeline_preparing"), Icon: Package },
    { label: t(lang, "pipeline_delivering"), Icon: Truck },
    { label: t(lang, "pipeline_done"), Icon: Star },
  ];
}

function CancelledBadge({ lang }) {
  return (
    <View style={styles.cancelledBadge}>
      <XCircle size={14} color="#DC2626" />
      <Text style={styles.cancelledText}>{t(lang, "orderStatus_cancelled")}</Text>
    </View>
  );
}

function Pipeline({ step, lang }) {
  if (step < 0) return null;
  const steps = pipelineSteps(lang);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {steps.map(({ label, Icon }, i) => {
        const done = i <= step;
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
              <View style={[styles.pipeLine, { backgroundColor: i === 0 ? "transparent" : done ? BRAND : "#e5e7eb" }]} />
              <View style={[styles.pipeCircle, { backgroundColor: done ? BRAND : "#e9eee9", borderColor: done ? BRAND : "#d1d5db" }]}>
                <Icon size={13} color={done ? "#fff" : "#9ca3af"} />
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
        <Icon size={19} color={BRAND} strokeWidth={1.8} />
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function OrderCard({ item, onPress, lang }) {
  const cfg = statusCfg(lang)[item.status] || statusCfg(lang).placed;
  const steps = pipelineSteps(lang);
  const PipeIcon = steps[Math.max(0, cfg.step)]?.Icon || Clock;
  const title = item.animalNameAz || t(lang, "myOrders_animalFallback");
  const orderNum = item.orderNumber || `QRB-${new Date(item.createdAt || Date.now()).getFullYear()}-${String(item.id || item._id).slice(-5).toUpperCase()}`;
  const qty = item.quantity || item.sharedPortion || 1;
  const amount = item.totalPrice ?? null;
  const weight = item.lambSelection?.weightCategoryLabel || null;
  const imgSrc = item.animalImageUrl;

  return (
    <Pressable style={{ marginTop: scale(24) }} onPress={onPress}>
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
            <Text style={styles.orderDate}>{fmtDate(item.createdAt, lang)}</Text>
          </View>
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <ShoppingBag size={12} color="#2d5a2d" />
              <Text style={styles.chipText}>{qty} {t(lang, "myOrders_unitLabel")}</Text>
            </View>
            {amount != null && (
              <View style={styles.chip}>
                <Wallet size={12} color={BRAND} />
                <Text style={[styles.chipText, { color: BRAND }]}>{amount} AZN</Text>
              </View>
            )}
            {weight && (
              <View style={styles.chip}>
                <Scale size={12} color="#2d5a2d" />
                <Text style={styles.chipText}>{weight}</Text>
              </View>
            )}
            {item.media?.length > 0 && (
              <View style={[styles.chip, { backgroundColor: "#eff6ff" }]}>
                <Video size={12} color="#2563eb" />
                <Text style={[styles.chipText, { color: "#2563eb" }]}>{t(lang, "myOrders_videoLabel")}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.pipeWrap}>
          {cfg.step < 0 ? <CancelledBadge lang={lang} /> : <Pipeline step={cfg.step} lang={lang} />}
        </View>
      </View>
    </Pressable>
  );
}

function tabMeta(lang) {
  return {
    all: { label: t(lang, "myOrders_tabAll"), Icon: ClipboardList },
    active: { label: t(lang, "myOrders_tabActive"), Icon: Activity },
    completed: { label: t(lang, "myOrders_tabCompleted"), Icon: CheckCircle2 },
    cancelled: { label: t(lang, "myOrders_tabCancelled"), Icon: XCircle },
  };
}

export default function MyOrdersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const TAB_META = tabMeta(lang);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filter, setFilter] = useState("all");

  const initials = getInitials(user);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (isGuest) navigation.replace("Register");
    }, [isGuest, navigation])
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
      if (isGuest) {
        setLoading(false);
        return;
      }
      fetchOrders();
    }, [fetchOrders, isGuest])
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
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "myOrders")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
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

<ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: scale(20) }}>
        {loading ? (
          <View style={{ paddingVertical: scale(60), alignItems: "center" }}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : fetchError ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: "#fef2f2" }]}>
              <ClipboardList size={32} color="#f87171" />
            </View>
            <Text style={styles.emptyTitle}>{t(lang, "myOrders_loadErrorTitle")}</Text>
            <Text style={styles.emptySub}>{t(lang, "myOrders_loadErrorSub")}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchOrders}>
              <RefreshCw size={14} color="#fff" />
              <Text style={styles.retryBtnText}>{t(lang, "myOrders_retryBtn")}</Text>
            </Pressable>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <ClipboardList size={32} color={BRAND} />
            </View>
            <Text style={styles.emptyTitle}>{t(lang, "myOrders_emptyTitle")}</Text>
            <Text style={styles.emptySub}>{t(lang, "myOrders_emptySub")}</Text>
            <Pressable style={styles.retryBtn} onPress={() => navigation.navigate("Qurban")}>
              <Text style={styles.retryBtnText}>{t(lang, "myOrders_placeOrderBtn")}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard Icon={ClipboardList} label={t(lang, "myOrders_statTotal")} value={orders.length} />
              <StatCard Icon={Activity} label={t(lang, "myOrders_statActive")} value={activeCount} />
              <StatCard Icon={Wallet} label={t(lang, "myOrders_statAmount")} value={`${totalAmount.toFixed(0)} AZN`} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: scale(8), paddingVertical: scale(4) }}>
              {TABS.map((tab) => {
                const meta = TAB_META[tab.key];
                const active = tab.key === filter;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => setFilter(tab.key)}
                  >
                    <meta.Icon size={14} color={active ? "#fff" : BRAND} />
                    <Text style={[styles.filterPillText, active && { color: "#fff" }]}>{meta.label}</Text>
                    <View style={[styles.filterCount, active && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                      <Text style={[styles.filterCountText, active && { color: "#fff" }]}>{tab.count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filtered.length === 0 ? (
              <Text style={styles.noneInCategory}>{t(lang, "myOrders_noneInCategory")}</Text>
            ) : (
              filtered.map((item) => (
                <OrderCard key={item.id || item._id} item={item} lang={lang} onPress={() => navigation.navigate("OrderDetail", { orderId: item.id || item._id })} />
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
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(10), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingVertical: scale(60), gap: scale(6) },
  emptyIcon: { width: scale(64), height: scale(64), borderRadius: scale(18), alignItems: "center", justifyContent: "center", backgroundColor: "#e8f5e9", marginBottom: scale(6) },
  emptyTitle: { fontSize: scaleFont(15), fontWeight: "800", color: "#071b0d" },
  emptySub: { fontSize: scaleFont(12), color: "#9ca3af", marginBottom: scale(6) },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: BRAND, borderRadius: scale(12), paddingHorizontal: scale(20), paddingVertical: scale(10) },
  retryBtnText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: scale(8), marginBottom: scale(12) },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: scale(14), borderWidth: 1.5, borderColor: "#e8f0e8", paddingVertical: scale(13), paddingHorizontal: scale(6), alignItems: "center", gap: scale(6) },
  statIcon: { width: scale(38), height: scale(38), borderRadius: scale(13), backgroundColor: "#e8f5e9", alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: scaleFont(12), color: "#9ca3af", fontWeight: "600" },
  statValue: { fontSize: scaleFont(17), fontWeight: "900", color: "#071b0d" },

  filterPill: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: "#fff", borderWidth: 2, borderColor: "#d4edda", borderRadius: scale(999), paddingHorizontal: scale(13), paddingVertical: scale(8) },
  filterPillActive: { backgroundColor: BRAND, borderColor: BRAND },
  filterPillText: { fontSize: scaleFont(13), fontWeight: "800", color: BRAND },
  filterCount: { backgroundColor: "#e8f5e9", borderRadius: scale(8), paddingHorizontal: scale(7), paddingVertical: scale(2) },
  filterCountText: { fontSize: scaleFont(11.5), fontWeight: "900", color: BRAND },

  noneInCategory: { textAlign: "center", color: "#9ca3af", fontSize: scaleFont(13), paddingVertical: scale(40) },

  statusFloat: { position: "absolute", top: scale(-14), right: scale(10), zIndex: 10, width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: BRAND, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  orderCard: { backgroundColor: "#fff", borderRadius: scale(18), overflow: "hidden", borderWidth: 1.5, borderColor: "#e8f0e8", shadowColor: BRAND, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  orderImgWrap: { width: "100%", height: scale(175), backgroundColor: "#fff" },
  orderImg: { position: "absolute", top: 0, bottom: 0, left: scale(50), right: scale(50) },
  orderImgOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: scale(8), paddingVertical: scale(5), backgroundColor: "rgba(0,0,0,0.4)" },
  orderNumText: { fontSize: scaleFont(9), fontWeight: "800", color: "rgba(255,255,255,0.9)" },
  orderBody: { paddingHorizontal: scale(12), paddingVertical: scale(12), gap: scale(7) },
  orderTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: scale(8) },
  orderTitle: { flex: 1, fontSize: scaleFont(19), fontWeight: "900", color: "#071b0d" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: scale(7) },
  chip: { flexDirection: "row", alignItems: "center", gap: scale(5), backgroundColor: "#f0f7f0", borderRadius: scale(9), paddingHorizontal: scale(9), paddingVertical: scale(5) },
  chipText: { fontSize: scaleFont(13), fontWeight: "800", color: "#2d5a2d" },
  orderDate: { fontSize: scaleFont(12.5), color: "#9ca3af", flexShrink: 0 },
  pipeWrap: { paddingHorizontal: scale(12), paddingVertical: scale(10), borderTopWidth: 1, borderTopColor: "#f3f4f6" },

  pipeLine: { flex: 1, height: scale(1.5) },
  pipeCircle: { width: scale(30), height: scale(30), borderRadius: scale(15), borderWidth: 2, alignItems: "center", justifyContent: "center" },
  pipeLabel: { fontSize: scaleFont(9.5), fontWeight: "800", marginTop: scale(4), textAlign: "center" },

  cancelledBadge: { flexDirection: "row", alignItems: "center", gap: scale(8), backgroundColor: "#FEE2E2", borderWidth: 1.5, borderColor: "#FECACA", borderRadius: scale(12), paddingHorizontal: scale(12), paddingVertical: scale(8), alignSelf: "flex-start" },
  cancelledText: { fontSize: scaleFont(12), fontWeight: "800", color: "#991B1B" },
});
