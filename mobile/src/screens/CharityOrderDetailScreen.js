import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../theme/colors";
import api from "../config/api";

const STATUS_CONFIG = {
  pending: { color: "#F59E0B", bg: "#FEF3C7", label: "Gözləmədə" },
  confirmed: { color: "#10B981", bg: "#D1FAE5", label: "Təsdiqləndi" },
  completed: { color: "#059669", bg: "#D1FAE5", label: "Tamamlandı" },
  cancelled: { color: "#6B7280", bg: "#F3F4F6", label: "Ləğv edildi" },
};

const CHARITY_TYPE_LABELS = {
  usaqlar_evi: "Uşaqlar evi",
  qocalar_evi: "Qocalar evi",
  ehtiyac_sahibleri: "Ehtiyac sahibləri",
};

const CHARITY_ICONS = {
  usaqlar_evi: "home",
  qocalar_evi: "home-heart",
  ehtiyac_sahibleri: "handshake",
};

const CHARITY_COLORS = {
  usaqlar_evi: "#1B5E20",
  qocalar_evi: "#6A1B9A",
  ehtiyac_sahibleri: "#1565C0",
};

export default function CharityOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charityColor = order
    ? CHARITY_COLORS[order.charityType] || Colors.primary
    : Colors.primary;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: charityColor,
      },
      headerTintColor: Colors.white,
    });
  }, [navigation, charityColor]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/charity-orders/${orderId}`);
      setOrder(res.data.data);
    } catch (error) {
      console.error("Xeyriyyə ödənişi yüklənmədi:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrder();
    }, [orderId]),
  );

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
        <Text style={styles.errorText}>Xeyriyyə ödənişi tapılmadı</Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const charityLabel = CHARITY_TYPE_LABELS[order.charityType] || order.label;
  const charityIcon = CHARITY_ICONS[order.charityType] || "heart";
  const isUsaqlarEvi = order.charityType === "usaqlar_evi";

  const dateStr = new Date(order.createdAt).toLocaleDateString("az-AZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrder();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: charityColor }]}>
          {isUsaqlarEvi ? (
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons
                name="home"
                size={60}
                color={Colors.white}
              />
              <View
                style={{
                  position: "absolute",
                  alignSelf: "center",
                  top: 26,
                  backgroundColor: Colors.white,
                  width: 27,
                  height: 26,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="flower"
                  size={24}
                  color={Colors.primary}
                />
              </View>
            </View>
          ) : (
            <MaterialCommunityIcons
              name={charityIcon}
              size={48}
              color={Colors.white}
            />
          )}
          <Text style={styles.heroTitle}>{charityLabel}</Text>
          <Text style={styles.heroAmount}>{order.totalAmount} ₼</Text>
          <Text style={styles.heroDate}>{dateStr}</Text>
        </View>

        {/* Status Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vəziyyət</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>

          {/* Status Timeline */}
          <View style={styles.timeline}>
            {order.statusHistory?.map((item, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: charityColor },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{item.status}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(item.changedAt).toLocaleDateString("az-AZ")}
                  </Text>
                  {item.note && (
                    <Text style={styles.timelineNote}>{item.note}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ödənişin Xülasəsi</Text>
          {order.summaryRows?.map((row, idx) => (
            <View key={idx} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{row.label}</Text>
              <Text style={styles.breakdownValue}>{row.value} ₼</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Cəmi</Text>
            <Text style={[styles.totalValue, { color: charityColor }]}>
              {order.totalAmount} ₼
            </Text>
          </View>
        </View>

        {/* Video Section */}
        {order.video && order.video.url ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Video</Text>
            <TouchableOpacity
              style={[styles.videoThumbnail, { borderColor: charityColor }]}
              onPress={() => Linking.openURL(order.video.url)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="play-circle"
                size={56}
                color={charityColor}
              />
              <Text style={styles.videoLabel}>Videoyu açın</Text>
              <Text style={styles.videoDate}>
                {new Date(order.video.uploadedAt).toLocaleDateString("az-AZ")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Video</Text>
            <View style={styles.emptyVideo}>
              <MaterialCommunityIcons
                name="video-off"
                size={40}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyVideoText}>Video hələ yüklənməyib</Text>
            </View>
          </View>
        )}

        {/* Order Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sifariş Məlumatları</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sifariş Nömrəsi</Text>
            <Text style={styles.infoValue}>{order.orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ödəniş Üsulu</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === "bank_card" ? "Bank kart" : "Nağd"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ödəniş Vəziyyəti</Text>
            <Text style={[styles.infoValue, { color: "#10B981" }]}>
              Ödənildi
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },

  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 8,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroIconOverlay: {
    position: "absolute",
    top: 27,
    alignSelf: "center",
    width: 18,
    height: 18,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  heroTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  heroAmount: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -1,
  },
  heroDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 8,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },

  timeline: {
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    paddingLeft: 16,
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginLeft: -26,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    textTransform: "capitalize",
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },

  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },

  videoThumbnail: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    minHeight: 140,
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  videoDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  emptyVideo: {
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  emptyVideoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: "500",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
