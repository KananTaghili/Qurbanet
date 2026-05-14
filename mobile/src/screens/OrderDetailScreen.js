import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Colors } from "../theme/colors";
import api from "../config/api";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F9FB",
  border: "#EAECF0",
  borderStrong: "#D1D5DB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  primary: Colors.primary ?? "#4F46E5",
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 24,
  },
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

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  placed: {
    text: "#92400E",
    bg: "#FEF3C7",
    border: "#FCD34D",
    dot: "#F59E0B",
    label: "Gözləmədə",
  },
  confirmed: {
    text: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#3B82F6",
    label: "Təsdiqləndi",
  },
  slaughtering: {
    text: "#7C2D12",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
    label: "Kəsilir",
  },
  preparing: {
    text: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    dot: "#10B981",
    label: "Hazırlanır",
  },
  delivering: {
    text: "#1E3A8A",
    bg: "#EFF6FF",
    border: "#93C5FD",
    dot: "#3B82F6",
    label: "Çatdırılır",
  },
  completed: {
    text: "#14532D",
    bg: "#F0FDF4",
    border: "#86EFAC",
    dot: "#22C55E",
    label: "Tamamlandı",
  },
  cancelled: {
    text: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    dot: "#9CA3AF",
    label: "Ləğv edildi",
  },
};

const DISTRIBUTION_LABELS = {
  catdirilsin: "Sizə çatdırılsın",
  ozun_gotur: "Özünüz götürün",
  usaqlar_evi: "Uşaqlar evi",
  qocalar_evi: "Qocalar evi",
  ehtiyac_sahibleri: "Ehtiyac sahibləri",
};

const ANIMAL_ASSETS = {
  quzu: require("../assets/qoyun.jpg"),
  qoyun: require("../assets/qoyun.jpg"),
  qoc: require("../assets/qoc.jpg"),
  dana: require("../assets/dana.jpg"),
  deve: require("../assets/deve.jpg"),
};

const ORDER_FLOW_STEPS = [
  { key: "placed", label: "Sifariş verildi", icon: "cart-check" },
  { key: "confirmed", label: "Təsdiqləndi", icon: "clipboard-check-outline" },
  { key: "slaughtering", label: "Kəsilir", icon: "knife", mediaHint: true },
  { key: "preparing", label: "Hazırlanır", icon: "food-drumstick" },
  {
    key: "delivering",
    label: "Çatdırılır",
    icon: "truck-delivery-outline",
    mediaHint: true,
  },
  { key: "completed", label: "Tamamlandı", icon: "check-circle-outline" },
];

const STATUS_TO_STEP = {
  placed: 0,
  confirmed: 1,
  slaughtering: 2,
  preparing: 3,
  delivering: 4,
  completed: 5,
};

const ORDER_MODE_LABELS = { tek: "Tam heyvan", serikli: "Şərikli" };

const CUT_STYLE_OPTIONS = [
  { key: "tam_cemdek", labelAz: "Tam cəmdək" },
  { key: "kababliq", labelAz: "Kabablıq" },
  { key: "qazan_yemekleri", labelAz: "Qazan yeməkləri üçün" },
  { key: "kababliq_qazan", labelAz: "Kabablıq + qazan yeməkləri" },
];

const fmt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n % 1 === 0 ? String(n) : n.toFixed(1);
};

const fmtWeight = (s) =>
  s?.weightCategoryLabel ??
  s?.weightCategoryKey?.replace(/_/g, "-") + " kq" ??
  "-";

const STATUS_HISTORY_KEYS = {
  placed: "placed",
  confirmed: "confirmed",
  slaughtering: "slaughtering",
  preparing: "preparing",
  delivering: "delivering",
  completed: "completed",
};

const fmtStepDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("az-AZ");
};

const getStatusHistoryDate = (order, status) => {
  const item = (order.statusHistory ?? []).find((h) => h.status === status);
  return item?.at ?? null;
};

const getProcessNoteDate = (order, stages) => {
  const list = (order.processNotes ?? [])
    .filter((n) => stages.includes(n.stage) && n.createdAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return list[0]?.createdAt ?? null;
};

const getStepDate = (order, stepKey) => {
  const timelineDate = (order.statusTimeline ?? []).find(
    (t) => t.key === stepKey,
  )?.at;
  if (timelineDate) return timelineDate;

  const historyDate = getStatusHistoryDate(order, STATUS_HISTORY_KEYS[stepKey]);
  if (historyDate) return historyDate;

  switch (stepKey) {
    case "placed":
      return order.createdAt ?? null;
    case "confirmed":
      return order.confirmedAt ?? null;
    case "slaughtering":
      return (
        order.slaughterDate ??
        getProcessNoteDate(order, ["slaughter_day", "slaughter_moment"])
      );
    case "preparing":
      return getProcessNoteDate(order, ["post_slaughter"]);
    case "delivering":
      return (
        order.deliveryDate ?? getProcessNoteDate(order, ["delivery_handover"])
      );
    case "completed":
      return order.status === "completed" ? order.updatedAt : null;
    default:
      return null;
  }
};

// ─── Primitive components ──────────────────────────────────────────────────────

/** Thin horizontal rule */
const Divider = ({ style }) => <View style={[divStyle.line, style]} />;
const divStyle = StyleSheet.create({
  line: { height: 1, backgroundColor: T.border, marginVertical: 4 },
});

/** Section card wrapper */
const Card = ({ children, style }) => (
  <View style={[cardStyle.card, style]}>{children}</View>
);
const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: T.surface,
    borderRadius: T.radius.lg,
    padding: 18,
    marginBottom: 12,
    ...T.shadow,
  },
});

/** Section heading inside a card */
const SectionHeading = ({ icon, title }) => (
  <View style={secStyle.row}>
    <View style={secStyle.iconBox}>
      <MaterialCommunityIcons name={icon} size={22} color={T.primary} />
    </View>
    <Text style={secStyle.title}>{title}</Text>
  </View>
);
const secStyle = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: T.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: T.textPrimary,
    letterSpacing: -0.3,
  },
});

/** Label / value row */
const InfoRow = ({ label, value, accent, last }) => (
  <View style={[rowStyle.row, last && rowStyle.last]}>
    <Text style={rowStyle.label}>{label}</Text>
    <Text
      style={[
        rowStyle.value,
        accent && { color: T.primary, fontWeight: "700" },
      ]}
    >
      {value ?? "-"}
    </Text>
  </View>
);
const rowStyle = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  last: { borderBottomWidth: 0 },
  label: { fontSize: 15, color: T.textSecondary, flex: 1 },
  value: {
    fontSize: 15,
    color: T.textPrimary,
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "58%",
  },
});

/** Sub-section block inside a card */
const SubBlock = ({ title, children }) => (
  <View style={subStyle.block}>
    <Text style={subStyle.title}>{title}</Text>
    {children}
  </View>
);
const subStyle = StyleSheet.create({
  block: {
    backgroundColor: T.surfaceAlt,
    borderRadius: T.radius.md,
    padding: 12,
    marginTop: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
});

// ─── Star Rating Input ────────────────────────────────────────────────────────
const StarInput = ({ value, onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={starStyle.row}>
      {stars.map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => onChange(String(s))}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={s <= Number(value) ? "star" : "star-outline"}
            size={32}
            color={s <= Number(value) ? "#F59E0B" : T.borderStrong}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
const starStyle = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 10,
  },
});

// ─── Hero Header ──────────────────────────────────────────────────────────────
const HeroHeader = ({ order, statusCfg }) => {
  const imageSource = order.animalImageUrl
    ? { uri: order.animalImageUrl }
    : (ANIMAL_ASSETS[order.animalType] ?? ANIMAL_ASSETS.qoyun);

  return (
    <View style={heroStyle.wrapper}>
      {/* Background gradient layer */}
      <View style={[heroStyle.gradient, { backgroundColor: T.primary }]} />
      <View style={heroStyle.gradientOverlay} />

      <View style={heroStyle.content}>
        {/* Left column */}
        <View style={heroStyle.left}>
          <Text style={heroStyle.orderNumLabel}>Sifariş nömrəsi</Text>
          <Text style={heroStyle.orderNum}>{order.orderNumber}</Text>

          {/* Status pill */}
          <View
            style={[
              heroStyle.statusPill,
              { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
            ]}
          >
            <View
              style={[heroStyle.statusDot, { backgroundColor: statusCfg.dot }]}
            />
            <Text style={[heroStyle.statusText, { color: statusCfg.text }]}>
              {order.statusLabel ?? statusCfg.label}
            </Text>
          </View>

          <Text style={heroStyle.animalName}>{order.animalNameAz}</Text>
          <Text style={heroStyle.price}>{order.totalPrice} ₼</Text>
        </View>

        {/* Animal image */}
        <View style={[heroStyle.imageFrame, { borderColor: statusCfg.dot }]}>
          <Image
            source={imageSource}
            style={heroStyle.image}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
};

const heroStyle = StyleSheet.create({
  wrapper: {
    borderRadius: T.radius.xl,
    overflow: "hidden",
    marginBottom: 14,
    ...T.shadow,
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 20,
    paddingBottom: 22,
    minHeight: 170,
  },
  left: { flex: 1, marginRight: 16 },
  orderNumLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  orderNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  animalName: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  // Image: 96×96, hard border matching status color
  imageFrame: {
    width: 96,
    height: 96,
    borderRadius: 18,
    borderWidth: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  image: { width: "100%", height: "100%" },
});

// ─── Timeline ─────────────────────────────────────────────────────────────────
const Timeline = ({
  order,
  currentStepIndex,
  slaughterMedia,
  deliveryMedia,
}) => (
  <Card>
    <SectionHeading icon="timeline-check-outline" title="Sifariş gedişatı" />
    {ORDER_FLOW_STEPS.map((step, index) => {
      const isDone = order.status === "completed" || index < currentStepIndex;
      const isActive =
        order.status !== "completed" && index === currentStepIndex;
      const isFuture = !isDone && !isActive;
      const isLast = index === ORDER_FLOW_STEPS.length - 1;

      // Dot colours
      const dotBorderColor = isDone
        ? T.primary
        : isActive
          ? T.primary
          : "#DDE1E7";
      const dotBgColor = isDone
        ? T.primary
        : isActive
          ? T.primary + "18"
          : T.surfaceAlt;
      const dotIconColor = isDone
        ? "#FFFFFF"
        : isActive
          ? T.primary
          : "#C4CAD4";

      // Date
      const rawDate = getStepDate(order, step.key);
      const dateStr = fmtStepDate(rawDate);
      const hasDate = !!rawDate && dateStr !== "-";

      // Media
      const mediaAvailable =
        step.key === "slaughtering"
          ? slaughterMedia
          : step.key === "delivering"
            ? deliveryMedia
            : null;

      return (
        <View key={step.key} style={tlStyle.row}>
          {/* ── Left axis ── */}
          <View style={tlStyle.axis}>
            {/* Dot */}
            <View
              style={[
                tlStyle.dot,
                { borderColor: dotBorderColor, backgroundColor: dotBgColor },
              ]}
            >
              <MaterialCommunityIcons
                name={isDone ? "check-bold" : step.icon}
                size={isDone ? 18 : 20}
                color={dotIconColor}
              />
            </View>
            {/* Connector line */}
            {!isLast && (
              <View
                style={[
                  tlStyle.line,
                  { backgroundColor: isDone ? T.primary + "60" : "#E5E8EF" },
                ]}
              />
            )}
          </View>

          {/* ── Right body ── */}
          <View style={[tlStyle.body, isLast && tlStyle.bodyLast]}>
            {/* Step label */}
            <Text
              style={[
                tlStyle.label,
                isFuture && tlStyle.labelFuture,
                isDone && tlStyle.labelDone,
                isActive && tlStyle.labelActive,
              ]}
            >
              {step.label}
            </Text>

            {/* Date pill — only when date exists */}
            {hasDate && (
              <View
                style={[
                  tlStyle.datePill,
                  isDone && tlStyle.datePillDone,
                  isActive && tlStyle.datePillActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={12}
                  color={
                    isActive ? T.primary : isDone ? "#059669" : T.textMuted
                  }
                />
                <Text
                  style={[
                    tlStyle.dateText,
                    isDone && tlStyle.dateTextDone,
                    isActive && tlStyle.dateTextActive,
                  ]}
                >
                  {dateStr}
                </Text>
              </View>
            )}

            {/* Future — no date yet chip */}
            {isFuture && (
              <View style={tlStyle.futurePill}>
                <MaterialCommunityIcons
                  name="clock-time-four-outline"
                  size={12}
                  color={T.textMuted}
                />
                <Text style={tlStyle.futureText}>Gözlənilir</Text>
              </View>
            )}

            {/* Media badge */}
            {step.mediaHint && (
              <View
                style={[
                  tlStyle.mediaBadge,
                  mediaAvailable
                    ? tlStyle.mediaBadgeReady
                    : tlStyle.mediaBadgePending,
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    mediaAvailable ? "play-circle-outline" : "clock-outline"
                  }
                  size={12}
                  color={mediaAvailable ? "#065F46" : "#92400E"}
                />
                <Text
                  style={[
                    tlStyle.mediaText,
                    { color: mediaAvailable ? "#065F46" : "#92400E" },
                  ]}
                >
                  {mediaAvailable
                    ? "Video / Foto mövcuddur"
                    : "Video / Foto gözlənilir"}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    })}
  </Card>
);

const tlStyle = StyleSheet.create({
  // ── Structure ──────────────────────────────
  row: { flexDirection: "row", gap: 14 },
  axis: { width: 44, alignItems: "center" },

  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  line: {
    width: 2,
    flex: 1,
    minHeight: 22,
    marginVertical: 4,
    borderRadius: 2,
  },

  body: { flex: 1, paddingBottom: 20, paddingTop: 6 },
  bodyLast: { paddingBottom: 0 },

  // ── Step label ─────────────────────────────
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: T.textSecondary,
    marginBottom: 5,
  },
  labelFuture: { color: "#C4CAD4", fontWeight: "500" },
  labelDone: { color: T.textPrimary, fontWeight: "700" },
  labelActive: {
    color: T.primary,
    fontWeight: "800",
    fontSize: 16,
  },

  // ── Date pill ──────────────────────────────
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePillDone: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  datePillActive: {
    backgroundColor: T.primary + "12",
    borderColor: T.primary + "40",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: T.textMuted,
  },
  dateTextDone: { color: "#059669" },
  dateTextActive: { color: T.primary },

  // ── Future pill ────────────────────────────
  futurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  futureText: { fontSize: 12, fontWeight: "600", color: T.textMuted },

  // ── Media badge ────────────────────────────
  mediaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
    borderWidth: 1,
  },
  mediaBadgeReady: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  mediaBadgePending: { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" },
  mediaText: { fontSize: 12, fontWeight: "700" },
});

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewForm = ({
  rating,
  setRating,
  comment,
  setComment,
  onSubmit,
  sending,
}) => (
  <Card>
    <SectionHeading icon="star-outline" title="Xidmətə rəy bildirin" />
    <Text style={rvStyle.hint}>
      Heyvanın keyfiyyəti və xidmətdən nə qədər məmnun qaldınız?
    </Text>
    <StarInput value={rating} onChange={setRating} />
    <TextInput
      style={rvStyle.input}
      multiline
      value={comment}
      onChangeText={setComment}
      placeholder="Rəyinizi buraya yazın..."
      placeholderTextColor={T.textMuted}
      textAlignVertical="top"
    />
    <TouchableOpacity
      style={[rvStyle.btn, sending && rvStyle.btnDisabled]}
      onPress={onSubmit}
      disabled={sending}
      activeOpacity={0.85}
    >
      <Text style={rvStyle.btnText}>
        {sending ? "Göndərilir..." : "Rəyi göndər"}
      </Text>
    </TouchableOpacity>
  </Card>
);

const ReviewDisplay = ({ review }) => (
  <Card>
    <SectionHeading icon="star-check-outline" title="Sizin rəyiniz" />
    <View style={rvStyle.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialCommunityIcons
          key={s}
          name={s <= review.rating ? "star" : "star-outline"}
          size={22}
          color={s <= review.rating ? "#F59E0B" : T.borderStrong}
        />
      ))}
      <Text style={rvStyle.ratingNum}>{review.rating}/5</Text>
    </View>
    {review.comment ? (
      <Text style={rvStyle.comment}>{review.comment}</Text>
    ) : null}
  </Card>
);

const rvStyle = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: T.textSecondary,
    marginBottom: 4,
    lineHeight: 19,
  },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.md,
    padding: 12,
    minHeight: 100,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: T.surfaceAlt,
    fontSize: 13,
    color: T.textPrimary,
  },
  btn: {
    backgroundColor: T.primary,
    borderRadius: T.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  ratingNum: {
    fontSize: 14,
    fontWeight: "700",
    color: T.textPrimary,
    marginLeft: 6,
  },
  comment: { fontSize: 13, color: T.textSecondary, lineHeight: 20 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data.order);
    } catch (err) {
      console.error("Sifariş detayı yüklənmədi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  const submitReview = async () => {
    setSendingReview(true);
    try {
      await api.post(`/orders/${orderId}/review`, {
        rating: Number(rating),
        comment,
      });
      Alert.alert("Uğurlu", "Rəyiniz qəbul edildi.");
      fetchOrder();
    } catch (err) {
      Alert.alert(
        "Xəta",
        err.response?.data?.message || "Rəy göndərilə bilmədi.",
      );
    } finally {
      setSendingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={scr.centered}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={scr.loadingText}>Yüklənir...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={scr.centered}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={T.textMuted}
        />
        <Text style={scr.errorText}>Sifariş tapılmadı</Text>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] ?? {
    text: T.textSecondary,
    bg: "#F3F4F6",
    border: "#E5E7EB",
    dot: "#9CA3AF",
    label: "",
  };
  const currentStepIdx = STATUS_TO_STEP[order.status] ?? 0;

  const slaughterMedia =
    (order.processNotes ?? []).some(
      (n) =>
        ["slaughter_moment", "post_slaughter"].includes(n.stage) &&
        !!n.videoUrl,
    ) || (order.media ?? []).some((m) => ["video", "photo"].includes(m.type));

  const deliveryMedia =
    !!order.deliveryProof?.handoverVideoUrl ||
    (order.processNotes ?? []).some(
      (n) => n.stage === "delivery_handover" && !!n.videoUrl,
    );

  // Cut style
  const isLargeAnimal = ["dana", "deve"].includes(order.animalType);
  const cutStyle = order.cutStyle ?? {};
  const allocMap = (cutStyle.allocations ?? []).reduce((a, i) => {
    if (i?.key) a[i.key] = Math.max(0, Number(i.count) || 0);
    return a;
  }, {});
  const hasAllocs = Object.values(allocMap).some((c) => c > 0);
  const fallbackCount =
    order.orderMode === "serikli"
      ? 1
      : Math.max(1, Number(order.quantity) || 1);
  const cutRows = CUT_STYLE_OPTIONS.map((o) => ({
    ...o,
    count:
      allocMap[o.key] ??
      (!hasAllocs && cutStyle?.key === o.key ? fallbackCount : 0),
  }));

  const qp = order.qurbanParts ?? {};
  const hasHead = Number(qp.headTotalCount || 0) > 0 || qp.head;
  const hasFeet = Number(qp.feetTotalCount || 0) > 0 || qp.feet;

  return (
    <ScrollView
      style={scr.container}
      contentContainerStyle={scr.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <HeroHeader order={order} statusCfg={statusCfg} />

      {/* ── Timeline ── */}
      <Timeline
        order={order}
        currentStepIndex={currentStepIdx}
        slaughterMedia={slaughterMedia}
        deliveryMedia={deliveryMedia}
      />

      {/* ── Order Info ── */}
      <Card>
        <SectionHeading
          icon="file-document-outline"
          title="Sifariş məlumatları"
        />
        <InfoRow label="Heyvan" value={order.animalNameAz} />
        <InfoRow label="Çəki aralığı" value={fmtWeight(order.lambSelection)} />
        <InfoRow
          label="Sifariş növü"
          value={ORDER_MODE_LABELS[order.orderMode] ?? "-"}
        />
        <InfoRow
          label={order.orderMode === "serikli" ? "Hissə" : "Miqdar"}
          value={
            order.orderMode === "serikli"
              ? `${Number(order.sharedPortion || order.quantity).toFixed(1)} hissə`
              : `${order.quantity} ədəd`
          }
        />
        <InfoRow
          label="Cəmi məbləğ"
          value={`${order.totalPrice} ₼`}
          accent
          last
        />
      </Card>

      {/* ── Quantity Details ── */}
      <Card>
        <SectionHeading icon="knife" title="Miqdar seçimi detalları" />

        {order.portionSplit && (
          <SubBlock title="Paylanma bölgüsü">
            <InfoRow
              label="Sənə düşən"
              value={`${fmt(order.portionSplit.selfParts)} / ${fmt(order.portionSplit.totalParts)}`}
            />
            <InfoRow
              label="Ehtiyac sahiblərinə"
              value={`${fmt(order.portionSplit.charityParts)} / ${fmt(order.portionSplit.totalParts)}`}
              last
            />
          </SubBlock>
        )}

        {!isLargeAnimal && (
          <SubBlock title="Doğrama forması">
            <InfoRow label="Seçilən forma" value={cutStyle.labelAz ?? "-"} />
            <InfoRow
              label="Əlavə ödəniş"
              value={`${fmt(cutStyle.extraFee)} ₼`}
              last
            />
            {cutRows.map((item, i) => (
              <InfoRow
                key={item.key}
                label={item.labelAz}
                value={`${fmt(item.count)} ədəd`}
                last={i === cutRows.length - 1}
              />
            ))}
          </SubBlock>
        )}

        {!isLargeAnimal && hasHead && (
          <SubBlock title="Baş bölgüsü">
            <InfoRow label="Cəmi" value={`${fmt(qp.headTotalCount)} ədəd`} />
            <InfoRow
              label="Baş (necə var)"
              value={`${fmt(qp.headFreeCount)} ədəd`}
            />
            <InfoRow
              label="Baş (ütülmüş)"
              value={`${fmt(qp.headTorchedCount)} ədəd`}
            />
            <InfoRow
              label="Baş (ütülmüş və doğranmış)"
              value={`${fmt(qp.headReadyCount)} ədəd`}
            />
            <InfoRow
              label="Sədəqə"
              value={`${fmt(qp.headCharityCount)} ədəd`}
              last
            />
          </SubBlock>
        )}

        {!isLargeAnimal && hasFeet && (
          <SubBlock title="Ayaq bölgüsü">
            <InfoRow label="Cəmi" value={`${fmt(qp.feetTotalCount)} ədəd`} />
            <InfoRow
              label="Ayaq (necə var)"
              value={`${fmt(qp.feetFreeCount)} ədəd`}
            />
            <InfoRow
              label="Ayaq (ütülmüş)"
              value={`${fmt(qp.feetTorchedCount)} ədəd`}
            />
            <InfoRow
              label="Ayaq (ütülmüş və doğranmış)"
              value={`${fmt(qp.feetReadyCount)} ədəd`}
            />
            <InfoRow
              label="Sədəqə"
              value={`${fmt(qp.feetCharityCount)} ədəd`}
              last
            />
          </SubBlock>
        )}
      </Card>

      {/* ── Delivery ── */}
      <Card>
        <SectionHeading icon="truck-delivery-outline" title="Çatdırılma" />
        <InfoRow
          label="Üsul"
          value={
            DISTRIBUTION_LABELS[order.distribution?.type] ??
            order.distribution?.type ??
            "-"
          }
        />
        <InfoRow
          label="Çatdırılma günü"
          value={
            order.deliveryDate
              ? new Date(order.deliveryDate).toLocaleDateString("az-AZ")
              : "-"
          }
        />
        <InfoRow
          label="Saat aralığı"
          value={order.deliveryWindow ?? "-"}
          last
        />
      </Card>

      {/* ── Delivery Video ── */}
      {order.deliveryProof?.handoverVideoUrl && (
        <Card>
          <SectionHeading icon="video-outline" title="Təhvil videosu" />
          <Text style={scr.videoUrl} numberOfLines={2}>
            {order.deliveryProof.handoverVideoUrl}
          </Text>
        </Card>
      )}

      {/* ── Review Form ── */}
      {order.status === "completed" && !order.review && (
        <ReviewForm
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          onSubmit={submitReview}
          sending={sendingReview}
        />
      )}

      {/* ── Existing Review ── */}
      {order.review && <ReviewDisplay review={order.review} />}
    </ScrollView>
  );
}

// ─── Screen styles ─────────────────────────────────────────────────────────────
const scr = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.bg,
  },
  loadingText: { fontSize: 14, color: T.textSecondary },
  errorText: { fontSize: 16, color: T.textSecondary, marginTop: 8 },
  videoUrl: { fontSize: 12, color: T.primary, fontWeight: "500" },
});
