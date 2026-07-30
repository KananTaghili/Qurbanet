import { useCallback, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform, StatusBar } from "react-native";
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
import api from "../lib/api";

const STATUS_LABELS = {
  awaiting_payment: "Ödəniş gözlənilir",
  placed: "Sifariş verildi",
  preparing: "Hazırlanır",
  delivering: "Çatdırılır",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};

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

const PAYMENT_STATUS_LABELS = { pending: "Gözlənilir", paid: "Ödənilib", failed: "Uğursuz" };

const AZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyun", "İyul", "Avq", "Sen", "Okt", "Noy", "Dek"];

function fmtDateTime(ds) {
  if (!ds) return "—";
  const d = new Date(ds);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function fmtDate(ds) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  if (notFound || !order) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 20 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#292524" }}>Sifariş tapılmadı</Text>
        <Pressable style={styles.backToListBtn} onPress={() => navigation.navigate("MeatMyOrders")}>
          <Text style={styles.backToListBtnText}>Geri qayıt</Text>
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
        <Text style={[styles.headerTitle, { paddingTop: insets.top + 18 }]}>Sifariş detalı</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.orderNum}>#{order.orderNumber}</Text>
            <View style={styles.orderDateRow}>
              <Calendar size={14} color="#A8A29E" />
              <Text style={styles.orderDate}>{fmtDateTime(order.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <StatusIcon size={15} color={statusColor} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{STATUS_LABELS[order.status] || order.status}</Text>
          </View>
        </View>

        <Card title="Bədən xəritəsi">
          <OrderAnimalPicker items={order.items} />
        </Card>

        <Card title={`Məhsullar (${order.items.length})`}>
          <View style={{ gap: 8 }}>
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
                    <Text style={styles.itemQty}>{it.quantityKg.toFixed(2)} kq × {it.pricePerKg} AZN</Text>
                    <Text style={styles.itemTotal}>{it.lineTotal.toFixed(2)} AZN</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card title="Sifariş statusu" Icon={Activity}>
          <PipelineVertical step={step} statusHistory={order.statusHistory} />
        </Card>

        <Card title="Çatdırılma" Icon={MapPin}>
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

        <Card title="Ödəniş" Icon={Wallet}>
          <Text style={styles.paymentStatus}>
            {PAYMENT_STATUS_LABELS[order.payment?.status] || order.payment?.status}
            {order.payment?.paidAt ? ` · ${fmtDate(order.payment.paidAt)}` : ""}
          </Text>
          <View style={{ gap: 6 }}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Məhsulların məbləği</Text>
              <Text style={styles.paymentValue}>{order.itemsTotal.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Çatdırılma haqqı</Text>
              <Text style={styles.paymentValue}>{order.deliveryFee.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.paymentTotalRow}>
              <Text style={styles.paymentTotalLabel}>Yekun məbləğ</Text>
              <Text style={styles.paymentTotalValue}>{order.totalPrice.toFixed(2)} AZN</Text>
            </View>
          </View>
        </Card>

        {order.userNote && (
          <Card title="Qeyd" Icon={StickyNote}>
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
    width: 60,
    height: 60,
    borderBottomRightRadius: 60,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#292524", paddingLeft: 96, paddingBottom: 14 },

  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, paddingHorizontal: 2 },
  orderNum: { fontSize: 21, fontWeight: "900", color: "#292524" },
  orderDateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  orderDate: { fontSize: 14.5, fontWeight: "600", color: "#78716C" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
  statusBadgeText: { fontSize: 14, fontWeight: "800" },

  card: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1.5, borderColor: "#f0ede8" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  cardHeaderIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  cardHeaderText: { fontSize: 14, fontWeight: "800", color: "#78716C", textTransform: "uppercase", letterSpacing: 0.4 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16 },

  itemRow: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(240,237,232,0.8)" },
  itemImgWrap: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#F1E5E5", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  itemImg: { width: "100%", height: "100%" },
  itemName: { fontSize: 16, fontWeight: "800", color: "#292524" },
  itemMeta: { fontSize: 13.5, color: "#78716C", marginTop: 2 },
  itemBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  itemQty: { fontSize: 13.5, color: "#a8a29e" },
  itemTotal: { fontSize: 15, fontWeight: "900", color: BRAND },

  addrText: { fontSize: 16.5, fontWeight: "700", color: "#292524" },
  addrSub: { fontSize: 14, color: "#a8a29e", marginTop: 3 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#f0ede8" },
  contactText: { fontSize: 15.5, fontWeight: "700", color: "#292524", flex: 1 },

  paymentStatus: { fontSize: 16, fontWeight: "700", color: "#292524", marginBottom: 12 },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentLabel: { fontSize: 15, color: "#78716C" },
  paymentValue: { fontSize: 15, fontWeight: "700", color: "#292524" },
  paymentTotalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: 10, marginTop: 3, borderTopWidth: 1, borderTopColor: "#f0ede8" },
  paymentTotalLabel: { fontSize: 16, fontWeight: "800", color: "#292524" },
  paymentTotalValue: { fontSize: 22, fontWeight: "900", color: BRAND },

  noteText: { fontSize: 16, color: "#292524", lineHeight: 22 },

  backToListBtn: { height: 48, paddingHorizontal: 26, borderRadius: 14, backgroundColor: BRAND, alignItems: "center", justifyContent: "center" },
  backToListBtnText: { color: "#fff", fontSize: 15.5, fontWeight: "800" },
});
