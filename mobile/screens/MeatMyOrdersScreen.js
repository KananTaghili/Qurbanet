import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform, StatusBar, Modal } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import {
  Menu,
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
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import MeatSideMenu from "../components/MeatSideMenu";
import MeatBottomNav from "../components/MeatBottomNav";
import OrderReceipt from "../components/meat/OrderReceipt";
import Pipeline, { BRAND, TINT, PIPELINE_STEPS, STATUS_STEP, CancelledBadge } from "../components/meat/MeatOrderPipeline";
import api from "../lib/api";

const AZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

function fmtDate(ds) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${AZ_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
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

const TAB_META = {
  all: { label: "Hamısı", Icon: ClipboardList },
  active: { label: "Aktiv", Icon: Activity },
  completed: { label: "Tamamlanmış", Icon: CheckCircle2 },
  cancelled: { label: "Ləğv edildi", Icon: XCircle },
};

// Web-dəki StatusFilter dropdown-unun portu — açılan düymə cari filtri
// göstərir, basılanda altında bütün seçimləri sadalayan üzən panel açılır.
function StatusFilter({ tabs, value, onChange }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState(null);
  const current = tabs.find((t) => t.key === value) || tabs[0];
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

function OrderCard({ order, onPress }) {
  const step = STATUS_STEP[order.status] ?? 0;
  const PipeIcon = step < 0 ? XCircle : PIPELINE_STEPS[Math.max(0, step)]?.Icon || ShoppingBag;

  // Kartın hamısı TƏK bir Pressable-a bükülməzdi — RN-in toxunma responder
  // sistemi barmaq ekrana toxunan kimi ən yaxın Pressable-ı dərhal "responder"
  // seçir (hərəkət məsafəsini gözləmədən), ona görə daxildəki üfüqi ScrollView
  // (OrderReceipt) heç vaxt sürüşdürmə jestini "qazana" bilmirdi. Sərlövhə və
  // alt sətir adi Pressable-lardır; bədən xəritəsi sahəsi isə yuxarıdakı
  // TapToOpen ilə (klikə görə) örtülüb — hər ikisi eyni onPress-i çağırır.
  return (
    <View style={{ marginTop: 22 }}>
      <View style={styles.statusFloat}>
        <PipeIcon size={24} color="#fff" />
      </View>
      <View style={styles.orderCard}>
        <Pressable onPress={onPress} style={styles.orderTitleRow}>
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
          <View style={styles.orderDateRow}>
            <Calendar size={15} color="#A8A29E" />
            <Text style={styles.orderDate}>{fmtDate(order.createdAt)}</Text>
          </View>
        </Pressable>

        <TapToOpen onPress={onPress}>
          <View style={{ marginBottom: 12 }}>
            <OrderReceipt items={order.items} />
          </View>
        </TapToOpen>

        <Pressable onPress={onPress}>
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <ShoppingBag size={14} color="#6B1717" />
              <Text style={styles.chipText}>{order.items?.length || 0} məhsul</Text>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

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
      fetchOrders();
    }, [fetchOrders]),
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
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={26} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Sifarişlərim</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={22} color="#fff" />
              <Text style={styles.loginText}>Daxil ol</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

      <MeatSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView nestedScrollEnabled contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
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
            <Text style={styles.emptyTitle}>Hələ ki, heç bir sifarişiniz yoxdur</Text>
            <Text style={styles.emptySub}>MeatBox-un təzə və halal ət məhsullarından sifariş verin, qapınıza qədər çatdıraq.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate("MeatHome")}>
              <Text style={styles.emptyBtnText}>Təzə Məhsullara Bax</Text>
              <ArrowRight size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard Icon={ClipboardList} label="Sifarişlər" value={orders.length} />
              <StatCard Icon={Activity} label="Aktiv" value={activeCount} />
              <StatCard Icon={Wallet} label="Məbləğ" value={`${totalPaid.toFixed(2)} AZN`} />
            </View>

            <View style={{ alignItems: "flex-start" }}>
              <StatusFilter tabs={TABS} value={filter} onChange={setFilter} />
            </View>

            {filteredOrders.length === 0 ? (
              <Text style={styles.noneInCategory}>Bu kateqoriyada sifariş yoxdur.</Text>
            ) : (
              filteredOrders.map((o) => (
                <OrderCard key={o._id} order={o} onPress={() => navigation.navigate("MeatOrderDetail", { orderId: o._id })} />
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
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 0 },
  menuBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#fff", fontSize: 22, fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 5 },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 10, gap: 10 },
  emptyIconOuter: { marginBottom: 4 },
  emptyIcon: { width: 104, height: 104, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: TINT, borderWidth: 1, borderColor: "rgba(75,15,15,0.1)" },
  emptyIconBadge: { position: "absolute", top: -4, right: -4, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: BRAND },
  emptyTitle: { fontSize: 21, fontWeight: "900", color: "#292524", textAlign: "center" },
  emptySub: { fontSize: 17, color: "#78716C", textAlign: "center", maxWidth: 300, lineHeight: 24 },
  emptyBtn: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: BRAND, borderRadius: 16, paddingHorizontal: 26, paddingVertical: 16 },
  emptyBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#f0ede8",
    paddingVertical: 15,
    paddingHorizontal: 6,
  },
  statIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 13, color: "#9ca3af", fontWeight: "700", textAlign: "center", lineHeight: 16.5 },
  statValue: { fontSize: 18, fontWeight: "900", color: "#292524", textAlign: "center" },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ecdede",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  filterBtnOpen: { borderColor: BRAND },
  filterBtnText: { fontSize: 16.5, fontWeight: "800", color: BRAND },
  filterBtnCount: { backgroundColor: TINT, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 3 },
  filterBtnCountText: { fontSize: 14, fontWeight: "900", color: BRAND },

  dropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#f0ede8",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 15, paddingVertical: 14 },
  dropdownItemActive: { backgroundColor: TINT },
  dropdownItemSep: { borderBottomWidth: 1, borderBottomColor: "#f3f0ea" },
  dropdownIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  dropdownLabel: { flex: 1, fontSize: 16.5, fontWeight: "700", color: "#374151" },
  dropdownCount: { backgroundColor: "#f3f4f6", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 3 },
  dropdownCountText: { fontSize: 14, fontWeight: "900", color: "#6b7280" },

  noneInCategory: { textAlign: "center", color: "#78716C", fontSize: 17, fontWeight: "600", paddingVertical: 40 },

  statusFloat: { position: "absolute", top: -17, right: 10, zIndex: 10, width: 48, height: 48, borderRadius: 24, backgroundColor: BRAND, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  orderCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: "#f0ede8", shadowColor: BRAND, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  orderTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  orderNum: { fontSize: 19.5, fontWeight: "900", color: "#292524" },
  orderDateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderDate: { fontSize: 15.5, fontWeight: "600", color: "#78716C" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: TINT, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 },
  chipText: { fontSize: 15.5, fontWeight: "800", color: "#6B1717" },
  pipeWrap: { paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F5F2EC" },
});
