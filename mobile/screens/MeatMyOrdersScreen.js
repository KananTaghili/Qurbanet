import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform, StatusBar, Modal } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import {
  ArrowLeft,
  User,
  ClipboardList,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  Activity,
  Wallet,
  MapPin,
  ChevronDown,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import MeatBottomNav from "../components/MeatBottomNav";
import OrderReceipt from "../components/meat/OrderReceipt";
import Pipeline, { BRAND, TINT, PIPELINE_STEPS, STATUS_STEP, CancelledBadge } from "../components/meat/MeatOrderPipeline";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t as translate } from "../i18n/i18n";

function fmtDate(ds, lang) {
  if (!ds) return "—";
  const d = new Date(ds);
  const monthsShort = translate(lang, "meatOrders_monthsShort");
  return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
}

function StatCard({ Icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon size={22} color={BRAND} strokeWidth={1.8} />
      </View>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function getTabMeta(lang) {
  return {
    all: { label: translate(lang, "allLabel"), Icon: ClipboardList },
    active: { label: translate(lang, "orders_active"), Icon: Activity },
    completed: { label: translate(lang, "navCompleted"), Icon: CheckCircle2 },
    cancelled: { label: translate(lang, "orders_cancelled"), Icon: XCircle },
  };
}

// Web-dəki StatusFilter dropdown-unun portu — açılan düymə cari filtri
// göstərir, basılanda altında bütün seçimləri sadalayan üzən panel açılır.
function StatusFilter({ tabs, value, onChange, lang }) {
  const TAB_META = getTabMeta(lang);
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState(null);
  const current = tabs.find((tab) => tab.key === value) || tabs[0];
  const CurrentIcon = TAB_META[current.key].Icon;

  const openDropdown = () => {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <>
      <Pressable
        ref={btnRef}
        style={[styles.filterBtn, open && styles.filterBtnOpen]}
        onPress={openDropdown}
      >
        <CurrentIcon size={18} color={BRAND} strokeWidth={2.2} />
        <Text style={styles.filterBtnText}>{TAB_META[current.key].label}</Text>
        <View style={styles.filterBtnCount}>
          <Text style={styles.filterBtnCountText}>{current.count}</Text>
        </View>
        <ChevronDown
          size={18}
          color={BRAND}
          strokeWidth={2.5}
          style={{ opacity: 0.6, transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        {layout && (
          <View
            style={[
              styles.dropdown,
              { top: layout.y + layout.height + 8, left: layout.x, minWidth: Math.max(230, layout.width) },
            ]}
          >
            {tabs.map((tab, i) => {
              const meta = TAB_META[tab.key];
              const active = tab.key === value;
              return (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                    i !== tabs.length - 1 && styles.dropdownItemSep,
                  ]}
                  onPress={() => {
                    onChange(tab.key);
                    setOpen(false);
                  }}
                >
                  <View style={[styles.dropdownIconWrap, active && { backgroundColor: "#fff" }]}>
                    <meta.Icon size={17} color={active ? BRAND : "#6b7280"} />
                  </View>
                  <Text style={[styles.dropdownLabel, active && { color: BRAND }]}>{meta.label}</Text>
                  <View style={[styles.dropdownCount, active && { backgroundColor: "#fff" }]}>
                    <Text style={[styles.dropdownCountText, active && { color: BRAND }]}>{tab.count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

// Bədən xəritəsi sahəsində toxunma (Pressable əvəzinə) xam touch hadisələri
// ilə izlənir: Pressable ScrollView-u əhatə etsə, RN-in responder sistemi
// sürüşdürmə jestini ScrollView-a heç buraxmır (o, "responder"-i dərhal özünə
// götürür). Xam onTouchStart/onTouchEnd isə responder üçün "yarışmır", sadəcə
// hadisəni müşahidə edir — barmaq az hərəkət edibsə (klik), onPress çağırılır;
// çox hərəkət edibsə (sürüşdürmə), ScrollView öz jestini normal qazanır və
// bu View heç nə etmir. Bax OrderAnimalPicker.js-dəki useSwipe ilə eyni üsul.
const TAP_MOVE_THRESHOLD = 10;
function TapToOpen({ onPress, children }) {
  const start = useRef(null);
  return (
    <View
      onTouchStart={(e) => {
        const t = e.nativeEvent.touches[0];
        start.current = { x: t.pageX, y: t.pageY };
      }}
      onTouchEnd={(e) => {
        if (!start.current) return;
        const t = e.nativeEvent.changedTouches[0];
        const dx = Math.abs(t.pageX - start.current.x);
        const dy = Math.abs(t.pageY - start.current.y);
        start.current = null;
        if (dx < TAP_MOVE_THRESHOLD && dy < TAP_MOVE_THRESHOLD) onPress();
      }}
    >
      {children}
    </View>
  );
}

function OrderCard({ order, onPress, lang }) {
  const step = STATUS_STEP[order.status] ?? 0;
  const PipeIcon = step < 0 ? XCircle : PIPELINE_STEPS[Math.max(0, step)]?.Icon || ShoppingBag;

  // Kartın hamısı TƏK bir Pressable-a bükülməzdi — RN-in toxunma responder
  // sistemi barmaq ekrana toxunan kimi ən yaxın Pressable-ı dərhal "responder"
  // seçir (hərəkət məsafəsini gözləmədən), ona görə daxildəki üfüqi ScrollView
  // (OrderReceipt) heç vaxt sürüşdürmə jestini "qazana" bilmirdi. Sərlövhə və
  // alt sətir adi Pressable-lardır; bədən xəritəsi sahəsi isə yuxarıdakı
  // TapToOpen ilə (klikə görə) örtülüb — hər ikisi eyni onPress-i çağırır.
  return (
    <View style={{ marginTop: scale(22) }}>
      <View style={styles.statusFloat}>
        <PipeIcon size={24} color="#fff" />
      </View>
      <View style={styles.orderCard}>
        <Pressable onPress={onPress} style={styles.orderTitleRow}>
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
          <View style={styles.orderDateRow}>
            <Calendar size={15} color="#A8A29E" />
            <Text style={styles.orderDate}>{fmtDate(order.createdAt, lang)}</Text>
          </View>
        </Pressable>

        <TapToOpen onPress={onPress}>
          <View style={{ marginBottom: scale(12) }}>
            <OrderReceipt items={order.items} />
          </View>
        </TapToOpen>

        <Pressable onPress={onPress}>
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <ShoppingBag size={14} color="#6B1717" />
              <Text style={styles.chipText}>{order.items?.length || 0} {translate(lang, "meatCheckout_productsUnit")}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: TINT }]}>
              <Wallet size={14} color={BRAND} />
              <Text style={[styles.chipText, { color: BRAND }]}>{Number(order.totalPrice).toFixed(2)} AZN</Text>
            </View>
            {order.deliveryLocation?.cityNameAz && (
              <View style={styles.chip}>
                <MapPin size={14} color="#6B1717" />
                <Text style={styles.chipText}>{order.deliveryLocation.cityNameAz}</Text>
              </View>
            )}
          </View>

          <View style={styles.pipeWrap}>
            {step < 0 ? <CancelledBadge /> : <Pipeline step={step} />}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export default function MeatMyOrdersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const initials = getInitials(user);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS !== "android") return;
      StatusBar.setBackgroundColor(BRAND);
      StatusBar.setTranslucent(false);
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (isGuest) navigation.replace("Register");
    }, [isGuest, navigation]),
  );

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api
      .get("/meat/orders/my")
      .then((res) => setOrders(res.data?.data?.orders || []))
      .catch((err) => console.error("Sifarişlər yüklənərkən xəta yarandı:", err))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isGuest) {
        setLoading(false);
        return;
      }
      fetchOrders();
    }, [fetchOrders, isGuest]),
  );

  const activeCount = useMemo(() => orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length, [orders]);
  const totalPaid = useMemo(
    () => orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
    [orders],
  );

  const TABS = useMemo(
    () =>
      [
        { key: "all", count: orders.length, filterFn: () => true },
        { key: "active", count: activeCount, filterFn: (o) => !["completed", "cancelled"].includes(o.status) },
        { key: "completed", count: orders.filter((o) => o.status === "completed").length, filterFn: (o) => o.status === "completed" },
        { key: "cancelled", count: orders.filter((o) => o.status === "cancelled").length, filterFn: (o) => o.status === "cancelled" },
      ].filter((tab) => tab.key === "all" || tab.count > 0),
    [orders, activeCount],
  );

  const activeTab = TABS.find((t) => t.key === filter) || TABS[0];
  const filteredOrders = orders.filter(activeTab.filterFn);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND} translucent={false} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{translate(lang, "myOrders")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={22} color="#fff" />
              <Text style={styles.loginText}>{translate(lang, "login")}</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

      <ScrollView nestedScrollEnabled contentContainerStyle={{ padding: scale(14), paddingBottom: scale(20) }}>
        {loading ? (
          <View style={{ paddingVertical: scale(60), alignItems: "center" }}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconOuter}>
              <View style={styles.emptyIcon}>
                <ClipboardList size={42} color={BRAND} />
              </View>
              <View style={styles.emptyIconBadge}>
                <Sparkles size={18} color="#fff" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>{translate(lang, "orders_emptyTitle")}</Text>
            <Text style={styles.emptySub}>{translate(lang, "orders_emptyDesc")}</Text>
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate("MeatHome")}>
              <Text style={styles.emptyBtnText}>{translate(lang, "orders_emptyBtn")}</Text>
              <ArrowRight size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard Icon={ClipboardList} label={translate(lang, "orders_statOrders")} value={orders.length} />
              <StatCard Icon={Activity} label={translate(lang, "orders_active")} value={activeCount} />
              <StatCard Icon={Wallet} label={translate(lang, "orders_statAmount")} value={`${totalPaid.toFixed(2)} AZN`} />
            </View>

            <View style={{ alignItems: "flex-start" }}>
              <StatusFilter tabs={TABS} value={filter} onChange={setFilter} lang={lang} />
            </View>

            {filteredOrders.length === 0 ? (
              <Text style={styles.noneInCategory}>{translate(lang, "orders_noneInCategory")}</Text>
            ) : (
              filteredOrders.map((o) => (
                <OrderCard key={o._id} order={o} lang={lang} onPress={() => navigation.navigate("MeatOrderDetail", { orderId: o._id })} />
              ))
            )}
          </>
        )}
      </ScrollView>

      <MeatBottomNav active="MeatMyOrders" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },

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
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(12), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingVertical: scale(60), paddingHorizontal: scale(10), gap: scale(10) },
  emptyIconOuter: { marginBottom: scale(4) },
  emptyIcon: { width: scale(104), height: scale(104), borderRadius: scale(26), alignItems: "center", justifyContent: "center", backgroundColor: TINT, borderWidth: 1, borderColor: "rgba(75,15,15,0.1)" },
  emptyIconBadge: { position: "absolute", top: scale(-4), right: scale(-4), width: scale(32), height: scale(32), borderRadius: scale(16), alignItems: "center", justifyContent: "center", backgroundColor: BRAND },
  emptyTitle: { fontSize: scaleFont(21), fontWeight: "900", color: "#292524", textAlign: "center" },
  emptySub: { fontSize: scaleFont(17), color: "#78716C", textAlign: "center", maxWidth: scale(300), lineHeight: moderateScale(24) },
  emptyBtn: { marginTop: scale(6), flexDirection: "row", alignItems: "center", gap: scale(8), backgroundColor: BRAND, borderRadius: scale(16), paddingHorizontal: scale(26), paddingVertical: scale(16) },
  emptyBtnText: { color: "#fff", fontSize: scaleFont(17), fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: scale(8), marginBottom: scale(16) },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: scale(7),
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: "#f0ede8",
    paddingVertical: scale(15),
    paddingHorizontal: scale(6),
  },
  statIcon: { width: scale(42), height: scale(42), borderRadius: scale(13), backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: scaleFont(13), color: "#9ca3af", fontWeight: "700", textAlign: "center", lineHeight: moderateScale(16.5) },
  statValue: { fontSize: scaleFont(18), fontWeight: "900", color: "#292524", textAlign: "center" },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(9),
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ecdede",
    borderRadius: scale(16),
    paddingHorizontal: scale(18),
    paddingVertical: scale(13),
  },
  filterBtnOpen: { borderColor: BRAND },
  filterBtnText: { fontSize: scaleFont(16.5), fontWeight: "800", color: BRAND },
  filterBtnCount: { backgroundColor: TINT, borderRadius: scale(9), paddingHorizontal: scale(10), paddingVertical: scale(3) },
  filterBtnCountText: { fontSize: scaleFont(14), fontWeight: "900", color: BRAND },

  dropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: "#f0ede8",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: scale(11), paddingHorizontal: scale(15), paddingVertical: scale(14) },
  dropdownItemActive: { backgroundColor: TINT },
  dropdownItemSep: { borderBottomWidth: 1, borderBottomColor: "#f3f0ea" },
  dropdownIconWrap: { width: scale(32), height: scale(32), borderRadius: scale(10), backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  dropdownLabel: { flex: 1, fontSize: scaleFont(16.5), fontWeight: "700", color: "#374151" },
  dropdownCount: { backgroundColor: "#f3f4f6", borderRadius: scale(9), paddingHorizontal: scale(10), paddingVertical: scale(3) },
  dropdownCountText: { fontSize: scaleFont(14), fontWeight: "900", color: "#6b7280" },

  noneInCategory: { textAlign: "center", color: "#78716C", fontSize: scaleFont(17), fontWeight: "600", paddingVertical: scale(40) },

  statusFloat: { position: "absolute", top: scale(-17), right: scale(10), zIndex: 10, width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: BRAND, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  orderCard: { backgroundColor: "#fff", borderRadius: scale(20), padding: scale(16), borderWidth: 1.5, borderColor: "#f0ede8", shadowColor: BRAND, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  orderTitleRow: { flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(12) },
  orderNum: { fontSize: scaleFont(19.5), fontWeight: "900", color: "#292524" },
  orderDateRow: { flexDirection: "row", alignItems: "center", gap: scale(5) },
  orderDate: { fontSize: scaleFont(15.5), fontWeight: "600", color: "#78716C" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: scale(7), marginBottom: scale(12) },
  chip: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: TINT, borderRadius: scale(9), paddingHorizontal: scale(12), paddingVertical: scale(9) },
  chipText: { fontSize: scaleFont(15.5), fontWeight: "800", color: "#6B1717" },
  pipeWrap: { paddingTop: scale(12), borderTopWidth: 1, borderTopColor: "#F5F2EC" },
});
