import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { Colors } from "../theme/colors";

export default function ConfirmationScreen({ navigation, route }) {
  const { order } = route.params;
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const estimatedDate = order.estimatedDate
    ? new Date(order.estimatedDate).toLocaleDateString("az-AZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Sabah";
  const slaughterTimingText =
    Number(order.slaughterTimingHours) === 48 ? "48 saat sonra" : "1 gün sonra";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Uğur animasiyası */}
      <Animated.View
        style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}
      >
        <Text style={styles.successIcon}>✅</Text>
      </Animated.View>

      <Text style={styles.title}>Ödəniş uğurlu oldu!</Text>
      <Text style={styles.subtitle}>Qurbanınız qəbul edildi</Text>

      {/* Sifariş nömrəsi */}
      <View style={styles.orderCard}>
        <Text style={styles.orderLabel}>Sifariş nömrəsi</Text>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
      </View>

      {/* Məlumat kartları */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Gözləmə müddəti</Text>
            <Text style={styles.infoDesc}>
              Qurbanınız <Text style={styles.bold}>{slaughterTimingText}</Text>{" "}
              (təxmini: {estimatedDate}) kəsiləcək
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📸</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Kəsim videosu</Text>
            <Text style={styles.infoDesc}>
              Kəsim videosu və şəkilləri "Sifarişlərim" bölməsindən görə
              bilərsiniz
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🥩</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Ət paylanması</Text>
            <Text style={styles.infoDesc}>
              Seçdiyiniz üsula görə ət paylanacaq
            </Text>
          </View>
        </View>
      </View>

      {/* Duanı */}
      <View style={styles.duaCard}>
        <Text style={styles.duaText}>
          "Qurbanın qəbul olsun! Allah bu ibadəti sizin üçün mübarək etsin." 🤲
        </Text>
      </View>

      {/* Düymələr */}
      <TouchableOpacity
        style={styles.ordersButton}
        onPress={() => navigation.navigate("MyOrders")}
        activeOpacity={0.85}
      >
        <Text style={styles.ordersButtonText}>📋 Sifarişimi izlə</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.85}
      >
        <Text style={styles.homeButtonText}>Ana səhifəyə qayıt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40, alignItems: "center" },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primarySurface,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  successIcon: { fontSize: 60 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  orderLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  orderNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 4,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { fontSize: 28, marginRight: 12 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  infoDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  bold: { fontWeight: "700", color: Colors.primary },
  duaCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  duaText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 22,
    fontStyle: "italic",
  },
  ordersButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  ordersButtonText: { color: Colors.white, fontSize: 17, fontWeight: "700" },
  homeButton: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  homeButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
});
