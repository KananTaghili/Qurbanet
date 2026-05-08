import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import api from "../config/api";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

const DISTRIBUTION_LABELS = {
  catdirilsin: "Sizə çatdırılsın",
  ozun_gotur: "Özünüz götürün",
  usaqlar_evi: "Uşaqlar evi",
  qocalar_evi: "Qocalar evi",
  ehtiyac_sahibleri: "Ehtiyac sahibləri",
};

const formatQurbanParts = (parts) => {
  if (!parts) return "-";
  const selected = [];
  if (parts.head) selected.push("1 baş");
  if (parts.feet) selected.push("2 ayaqlar");
  return selected.length ? selected.join(", ") : "-";
};

export default function OrderSummaryScreen({ navigation, route }) {
  const draft = route.params?.draft || route.params || {};
  useCategoryActiveGuard({
    animalType: draft?.animal?.type,
    navigation,
    enabled: !!draft?.animal?.type,
  });

  const [loading, setLoading] = useState(false);

  const quantityText = useMemo(() => {
    if (draft.orderMode === "serikli") {
      return `${Number(draft.sharedPortion || draft.quantity).toFixed(1)} hissə`;
    }
    return `${draft.quantity} ədəd`;
  }, [draft.orderMode, draft.quantity, draft.sharedPortion]);

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post("/orders", {
        animalType: draft.animal?.type,
        quantity: draft.quantity,
        orderMode: draft.orderMode,
        sharedPortion: draft.sharedPortion,
        distribution: draft.distribution,
        lambSelection: draft.lambSelection,
        qurbanParts: draft.qurbanParts,
        slaughterTimingHours: draft.slaughterTimingHours,
        slaughterDate: draft.slaughterDate,
        deliveryDate: draft.deliveryDate,
        deliveryWindow: draft.deliveryWindow,
        contactInfo: draft.contactInfo,
        orphanDelight: draft.orphanDelight,
      });

      if (res.data.success) {
        navigation.navigate("Payment", { order: res.data.data.order });
      }
    } catch (err) {
      Alert.alert(
        "Xəta",
        err.response?.data?.message || "Sifariş yaradılarkən xəta baş verdi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OrderStepHeader currentStep={3} />
      <Text style={styles.title}>Sifariş xülasəsi</Text>

      <View style={styles.card}>
        <SummaryRow label="Qurban" value={draft.animal?.nameAz} />
        <SummaryRow label="Miqdar" value={quantityText} />
        <SummaryRow
          label="Çatdırılma"
          value={
            DISTRIBUTION_LABELS[draft.distribution?.type] ||
            draft.distribution?.type
          }
        />
        <SummaryRow
          label="Kəsim günü"
          value={new Date(draft.slaughterDate).toLocaleDateString("az-AZ")}
        />
        <SummaryRow label="Çatdırılma aralığı" value={draft.deliveryWindow} />
        <SummaryRow
          label="Əlaqə"
          value={`${draft.contactInfo?.firstName || ""} ${draft.contactInfo?.lastName || ""} (${draft.contactInfo?.mobile || ""})`}
        />
        {draft.lambSelection?.weightCategoryKey ? (
          <SummaryRow
            label="Çəki seçimi"
            value={draft.lambSelection.weightCategoryKey}
          />
        ) : null}
        {draft.lambSelection?.meatFormKey ? (
          <SummaryRow
            label="Ət forması"
            value={draft.lambSelection.meatFormKey}
          />
        ) : null}
        <SummaryRow
          label="Göndəriləcək hissələr"
          value={formatQurbanParts(draft.qurbanParts)}
        />
        {draft.orphanDelight?.enabled ? (
          <SummaryRow
            label="Yetimləri Sevindir"
            value={`${draft.orphanDelight.target} (+${draft.orphanDelight.extraAmount} ₼)`}
          />
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreateOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Ödənişə keç</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },
  rowLabel: { color: Colors.textSecondary, fontSize: 13 },
  rowValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "65%",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
