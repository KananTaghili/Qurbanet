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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../theme/colors";
import api from "../config/api";

const STATUS_COLORS = {
  placed: Colors.statusPendingPayment,
  confirmed: Colors.statusPaid,
  slaughtering: Colors.warning,
  preparing: Colors.statusProcessing,
  delivering: Colors.info,
  completed: Colors.statusCompleted,
  cancelled: Colors.statusCancelled,
};

const ANIMAL_ASSETS = {
  quzu: require("../assets/qoyun.jpg"),
  qoyun: require("../assets/qoyun.jpg"),
  qoc: require("../assets/qoc.jpg"),
  dana: require("../assets/dana.jpg"),
  deve: require("../assets/deve.jpg"),
};

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data.data.orders);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrder = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || Colors.textSecondary;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderLeft}>
            <Image
              source={
                item.animalImageUrl
                  ? { uri: item.animalImageUrl }
                  : ANIMAL_ASSETS[item.animalType] || ANIMAL_ASSETS.qoyun
              }
              style={styles.orderImage}
            />
            <View>
              <Text style={styles.orderTitle}>{item.animalNameAz}</Text>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.detailText}>
            🔢 {item.orderMode === "serikli" ? "Hissə" : "Miqdar"}:{" "}
            {item.orderMode === "serikli"
              ? `${Number(item.sharedPortion || item.quantity).toFixed(1)} hissə`
              : `${item.quantity} ədəd`}
          </Text>
          <Text style={styles.detailText}>💰 Məbləğ: {item.totalPrice} ₼</Text>
        </View>

        {item.media && item.media.length > 0 && (
          <View style={styles.mediaBadge}>
            <Text style={styles.mediaText}>
              📸 {item.media.length} media faylı mövcuddur
            </Text>
          </View>
        )}

        <View style={styles.orderFooter}>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString("az-AZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={styles.orderArrow}>Detay →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Hələ sifariş yoxdur</Text>
        <Text style={styles.emptyText}>İlk qurban sifarişinizi verin</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.emptyButtonText}>Sifariş ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderLeft: { flexDirection: "row", alignItems: "center" },
  orderImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: Colors.primarySurface,
  },
  orderTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  orderNumber: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: "700" },
  orderDetails: { flexDirection: "row", gap: 16, marginBottom: 8 },
  detailText: { fontSize: 13, color: Colors.textSecondary },
  mediaBadge: {
    backgroundColor: Colors.primarySurface,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  mediaText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  orderDate: { fontSize: 12, color: Colors.textDisabled },
  orderArrow: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
