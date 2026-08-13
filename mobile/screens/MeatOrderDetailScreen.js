import { useCallback, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Platform, StatusBar } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Beef,
  Wallet,
  Calendar,
  StickyNote,
  Activity,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import OrderAnimalPicker from "../components/meat/OrderAnimalPicker";
import { BRAND, TINT, STATUS_STEP, PipelineVertical } from "../components/meat/MeatOrderPipeline";
import MeatSpinner from "../components/meat/MeatSpinner";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

function statusLabels(lang) {
  return {
    awaiting_payment: t(lang, "meatOrderStatus_awaitingPayment"),
    placed: t(lang, "meatOrderStatus_placed"),
    preparing: t(lang, "meatOrderStatus_preparing"),
    delivering: t(lang, "meatOrderStatus_delivering"),
    completed: t(lang, "meatOrderStatus_completed"),
    cancelled: t(lang, "meatOrderStatus_cancelled"),
  };
}

const STATUS_COLORS = {
  awaiting_payment: "#a8a29e",
  placed: "#2563eb",
  preparing: "#d97706",
  delivering: "#7c3aed",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

const STATUS_ICONS = {
  awaiting_payment: Clock,
  placed: ShoppingCart,
  preparing: Package,
  delivering: Truck,
  completed: CheckCircle2,
  cancelled: XCircle,
};

function paymentStatusLabels(lang) {
  return { pending: t(lang, "meatOrderPayment_pending"), paid: t(lang, "meatOrderPayment_paid"), failed: t(lang, "meatOrderPayment_failed") };
}

function fmtDateTime(ds, lang) {
  if (!ds) return "—";
  const d = new Date(ds);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${t(lang, "months_short")[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function fmtDate(ds, lang) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${t(lang, "months_short")[d.getMonth()]} ${d.getFullYear()}`;
}

function Card({ title, Icon, children }) {
  return (
    <View style={styles.card}>
      {title && (
        <View style={styles.cardHeader}>
          {Icon && (
            <View style={styles.cardHeaderIcon}>
              <Icon size={18} color={BRAND} strokeWidth={2} />
            </View>
          )}
          <Text style={styles.cardHeaderText}>{title}</Text>
        </View>
      )}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export default function MeatOrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params || {};
  const { lang } = useLanguage();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, []),
  );

  const fetchOrder = useCallback(() => {
    if (!orderId) return;
    api
      .get(`/meat/orders/${orderId}`)
      .then((res) => {
        if (res.data?.success) setOrder(res.data.data.order);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder]),
  );

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
        <MeatSpinner size={32} />
      </View>
    );
  }

  if (notFound || !order) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", gap: scale(12), paddingHorizontal: scale(20) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
        <Text style={{ fontSize: scaleFont(18), fontWeight: "800", color: "#292524" }}>{t(lang, "meatOrderDetail_notFound")}</Text>
        <Pressable style={styles.backToListBtn} onPress={() => navigation.navigate("MeatMyOrders")}>
          <Text style={styles.backToListBtnText}>{t(lang, "meatOrderDetail_backBtn")}</Text>
        </Pressable>
      </View>
    );
  }

  const step = STATUS_STEP[order.status] ?? 0;
  const statusColor = STATUS_COLORS[order.status] || "#a8a29e";
  const StatusIcon = STATUS_ICONS[order.status] || Clock;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" translucent={false} />

      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { top: insets.top }]}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("MeatMyOrders"))}
        >
          <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { paddingTop: insets.top + 18 }]}>{t(lang, "meatOrderDetail_headerTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: insets.bottom + 24, gap: scale(14) }}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.orderNum}>#{order.orderNumber}</Text>
            <View style={styles.orderDateRow}>
              <Calendar size={14} color="#A8A29E" />
              <Text style={styles.orderDate}>{fmtDateTime(order.createdAt, lang)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <StatusIcon size={15} color={statusColor} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabels(lang)[order.status] || order.status}</Text>
          </View>
        </View>

        <Card title={t(lang, "meatOrderDetail_bodyMapTitle")}>
          <OrderAnimalPicker items={order.items} />
        </Card>

        <Card title={t(lang, "meatOrderDetail_productsTitleTemplate").replace("{count}", order.items.length)}>
          <View style={{ gap: scale(8) }}>
            {order.items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemImgWrap}>
                  {it.imageUrl ? (
                    <Image source={{ uri: it.imageUrl }} style={styles.itemImg} resizeMode="cover" />
                  ) : (
                    <Beef size={28} color="rgba(75,15,15,0.7)" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.itemName} numberOfLines={2}>{it.cutNameAz}</Text>
                  <Text style={styles.itemMeta} numberOfLines={1}>{it.animalNameAz} • {it.partNameAz}</Text>
                  <View style={styles.itemBottomRow}>
                    <Text style={styles.itemQty}>{it.quantityKg.toFixed(2)} {t(lang, "meatOrderDetail_kgUnit")} × {it.pricePerKg} AZN</Text>
                    <Text style={styles.itemTotal}>{it.lineTotal.toFixed(2)} AZN</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card title={t(lang, "meatOrderDetail_statusTitle")} Icon={Activity}>
          <PipelineVertical step={step} statusHistory={order.statusHistory} />
        </Card>

        <Card title={t(lang, "meatOrderDetail_deliveryTitle")} Icon={MapPin}>
          <Text style={styles.addrText}>{order.deliveryLocation?.address}</Text>
          <Text style={styles.addrSub}>
            {order.deliveryLocation?.cityNameAz}, {order.deliveryLocation?.countryNameAz}
          </Text>
          {order.contactInfo?.mobile && (
            <View style={styles.contactRow}>
              <Phone size={18} color={BRAND} />
              <Text style={styles.contactText}>
                {[order.contactInfo.firstName, order.contactInfo.lastName].filter(Boolean).join(" ")}
                {order.contactInfo.firstName || order.contactInfo.lastName ? " · " : ""}
                {order.contactInfo.mobile}
              </Text>
            </View>
          )}
        </Card>

        <Card title={t(lang, "meatOrderDetail_paymentTitle")} Icon={Wallet}>
          <Text style={styles.paymentStatus}>
            {paymentStatusLabels(lang)[order.payment?.status] || order.payment?.status}
            {order.payment?.paidAt ? ` · ${fmtDate(order.payment.paidAt, lang)}` : ""}
          </Text>
          <View style={{ gap: scale(6) }}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t(lang, "meatOrderDetail_productsAmountLabel")}</Text>
              <Text style={styles.paymentValue}>{order.itemsTotal.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t(lang, "meatOrderDetail_deliveryFeeLabel")}</Text>
              <Text style={styles.paymentValue}>{order.deliveryFee.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.paymentTotalRow}>
              <Text style={styles.paymentTotalLabel}>{t(lang, "meatOrderDetail_finalAmountLabel")}</Text>
              <Text style={styles.paymentTotalValue}>{order.totalPrice.toFixed(2)} AZN</Text>
            </View>
          </View>
        </Card>

        {order.userNote && (
          <Card title={t(lang, "meatOrderDetail_noteTitle")} Icon={StickyNote}>
            <Text style={styles.noteText}>{order.userNote}</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },

  header: { backgroundColor: "#FAF8F5" },
  backBtn: {
    position: "absolute",
    left: 0,
    zIndex: 10,
    width: scale(60),
    height: scale(60),
    borderBottomRightRadius: scale(60),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: scaleFont(20), fontWeight: "800", color: "#292524", paddingLeft: scale(96), paddingBottom: scale(14) },

  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: scale(8), paddingHorizontal: scale(2) },
  orderNum: { fontSize: scaleFont(21), fontWeight: "900", color: "#292524" },
  orderDateRow: { flexDirection: "row", alignItems: "center", gap: scale(5), marginTop: scale(4) },
  orderDate: { fontSize: scaleFont(14.5), fontWeight: "600", color: "#78716C" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: scale(6), paddingHorizontal: scale(13), paddingVertical: scale(8), borderRadius: scale(999) },
  statusBadgeText: { fontSize: scaleFont(14), fontWeight: "800" },

  card: { backgroundColor: "#fff", borderRadius: scale(18), borderWidth: 1.5, borderColor: "#f0ede8" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: scale(10), paddingHorizontal: scale(16), paddingTop: scale(16), paddingBottom: scale(12) },
  cardHeaderIcon: { width: scale(32), height: scale(32), borderRadius: scale(10), backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  cardHeaderText: { fontSize: scaleFont(14), fontWeight: "800", color: "#78716C", textTransform: "uppercase", letterSpacing: 0.4 },
  cardBody: { paddingHorizontal: scale(16), paddingBottom: scale(16) },

  itemRow: { flexDirection: "row", gap: scale(12), padding: scale(12), borderRadius: scale(14), borderWidth: 1, borderColor: "rgba(240,237,232,0.8)" },
  itemImgWrap: { width: scale(70), height: scale(70), borderRadius: scale(12), backgroundColor: "#F1E5E5", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  itemImg: { width: "100%", height: "100%" },
  itemName: { fontSize: scaleFont(16), fontWeight: "800", color: "#292524" },
  itemMeta: { fontSize: scaleFont(13.5), color: "#78716C", marginTop: scale(2) },
  itemBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: scale(8) },
  itemQty: { fontSize: scaleFont(13.5), color: "#a8a29e" },
  itemTotal: { fontSize: scaleFont(15), fontWeight: "900", color: BRAND },

  addrText: { fontSize: scaleFont(16.5), fontWeight: "700", color: "#292524" },
  addrSub: { fontSize: scaleFont(14), color: "#a8a29e", marginTop: scale(3) },
  contactRow: { flexDirection: "row", alignItems: "center", gap: scale(10), marginTop: scale(14), paddingTop: scale(14), borderTopWidth: 1, borderTopColor: "#f0ede8" },
  contactText: { fontSize: scaleFont(15.5), fontWeight: "700", color: "#292524", flex: 1 },

  paymentStatus: { fontSize: scaleFont(16), fontWeight: "700", color: "#292524", marginBottom: scale(12) },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentLabel: { fontSize: scaleFont(15), color: "#78716C" },
  paymentValue: { fontSize: scaleFont(15), fontWeight: "700", color: "#292524" },
  paymentTotalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: scale(10), marginTop: scale(3), borderTopWidth: 1, borderTopColor: "#f0ede8" },
  paymentTotalLabel: { fontSize: scaleFont(16), fontWeight: "800", color: "#292524" },
  paymentTotalValue: { fontSize: scaleFont(22), fontWeight: "900", color: BRAND },

  noteText: { fontSize: scaleFont(16), color: "#292524", lineHeight: moderateScale(22) },

  backToListBtn: { height: scale(48), paddingHorizontal: scale(26), borderRadius: scale(14), backgroundColor: BRAND, alignItems: "center", justifyContent: "center" },
  backToListBtnText: { color: "#fff", fontSize: scaleFont(15.5), fontWeight: "800" },
});
