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
} from "react-native";
import { Colors } from "../theme/colors";
import api from "../config/api";

const STATUS_STYLES = {
  placed: { text: "#8A5A00", bg: "#FFF4D6", border: "#F2C46B" },
  confirmed: { text: "#0F4C8A", bg: "#E8F2FF", border: "#9CC3F0" },
  slaughtering: { text: "#7C2D12", bg: "#FCE7D6", border: "#F5B38D" },
  preparing: { text: "#0F766E", bg: "#E6F7F5", border: "#8FD8CF" },
  delivering: { text: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD" },
  completed: { text: "#1E6B3B", bg: "#EAF8EF", border: "#9FD5B0" },
  cancelled: { text: "#9F1D1D", bg: "#FDECEC", border: "#F2A8A8" },
};

const DISTRIBUTION_LABELS = {
  catdirilsin: "🚚 Sizə çatdırılsın",
  ozun_gotur: "🏠 Özünüz götürün",
  usaqlar_evi: "🏫 Uşaqlar evi",
  qocalar_evi: "👵 Qocalar evi",
  ehtiyac_sahibleri: "🤲 Ehtiyac sahibləri",
};

const ANIMAL_ASSETS = {
  quzu: require("../assets/qoyun.jpg"),
  qoyun: require("../assets/qoyun.jpg"),
  qoc: require("../assets/qoc.jpg"),
  dana: require("../assets/dana.jpg"),
  deve: require("../assets/deve.jpg"),
};

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Sifariş tapılmadı.</Text>
      </View>
    );
  }

  const statusStyle = STATUS_STYLES[order.status] || {
    text: Colors.textSecondary,
    bg: "#F2F2F2",
    border: "#DDDDDD",
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.orderNum}>Sifariş № {order.orderNumber}</Text>
          <Image
            source={
              order.animalImageUrl
                ? { uri: order.animalImageUrl }
                : ANIMAL_ASSETS[order.animalType] || ANIMAL_ASSETS.qoyun
            }
            style={styles.headerImage}
          />
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusStyle.bg,
              borderColor: statusStyle.border,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {order.statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Sifariş məlumatları</Text>
        <InfoRow label="Heyvan" value={order.animalNameAz} />
        <InfoRow
          label={order.orderMode === "serikli" ? "Hissə" : "Miqdar"}
          value={
            order.orderMode === "serikli"
              ? `${Number(order.sharedPortion || order.quantity).toFixed(1)} hissə`
              : `${order.quantity} ədəd`
          }
        />
        <InfoRow label="Cəmi" value={`${order.totalPrice} ₼`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚚 Çatdırılma</Text>
        <InfoRow
          label="Üsul"
          value={
            DISTRIBUTION_LABELS[order.distribution?.type] ||
            order.distribution?.type
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
        <InfoRow label="Saat aralığı" value={order.deliveryWindow || "-"} />
      </View>

      {order.statusTimeline?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧭 Sifariş statusları</Text>
          {order.statusTimeline.map((stage) => (
            <Text key={stage.key} style={styles.timelineItem}>
              {stage.done ? "✅" : "⬜"} {stage.label}
            </Text>
          ))}
        </View>
      ) : null}

      {order.processChecklist?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Kəsim prosesi qeydləri</Text>
          {order.processChecklist.map((step) => (
            <Text key={step.key} style={styles.timelineItem}>
              {step.completed ? "✅" : "⬜"} {step.title}
            </Text>
          ))}
        </View>
      ) : null}

      {order.deliveryProof?.handoverVideoUrl ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎥 Təhvil videosu</Text>
          <Text style={styles.infoText}>
            {order.deliveryProof.handoverVideoUrl}
          </Text>
        </View>
      ) : null}

      {order.status === "completed" && !order.review ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⭐ Xidmətə rəy</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rating}
            onChangeText={setRating}
            placeholder="1-5"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder="Rəyinizi yazın"
          />
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={submitReview}
            disabled={sendingReview}
          >
            <Text style={styles.reviewBtnText}>
              {sendingReview ? "Göndərilir..." : "Rəyi göndər"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {order.review ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Sizin rəyiniz</Text>
          <InfoRow label="Bal" value={`${order.review.rating}/5`} />
          <Text style={styles.infoText}>{order.review.comment || "-"}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 30 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNum: { color: Colors.white, fontSize: 17, fontWeight: "700" },
  headerImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  statusText: { fontWeight: "700", fontSize: 12 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { color: Colors.primary, fontWeight: "700", marginBottom: 8 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
    gap: 12,
  },
  infoLabel: { color: Colors.textSecondary, fontSize: 13 },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },
  timelineItem: { color: Colors.textPrimary, marginBottom: 6, fontSize: 13 },
  infoText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  reviewBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  reviewBtnText: { color: Colors.white, fontWeight: "700" },
});
