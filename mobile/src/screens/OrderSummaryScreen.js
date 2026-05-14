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
  charity_only: "Ehtiyaclılara Göndəriləcək",
};

const formatQurbanParts = (parts) => {
  if (!parts) return "-";
  const countFieldsAvailable =
    parts.headTotalCount != null || parts.feetTotalCount != null;

  if (countFieldsAvailable) {
    const formatBucketLine = (label, free, charity, ready) => {
      const segments = [];
      if (free > 0) segments.push(`pulsuz ${free}`);
      if (charity > 0) segments.push(`sədəqə ${charity}`);
      if (ready > 0) segments.push(`ütülsün + doğransın ${ready}`);
      return `${label}: ${segments.length ? segments.join(", ") : `0`}`;
    };

    const headLine = parts.head
      ? formatBucketLine(
          "Baş",
          Number(parts.headFreeCount || 0),
          Number(parts.headCharityCount || 0),
          Number(parts.headReadyCount || 0),
        )
      : null;

    const feetLine = parts.feet
      ? formatBucketLine(
          "Ayaqlar",
          Number(parts.feetFreeCount || 0),
          Number(parts.feetCharityCount || 0),
          Number(parts.feetReadyCount || 0),
        )
      : null;

    return [headLine, feetLine].filter(Boolean).join(" | ") || "-";
  }

  const selected = [];
  const headProcess =
    typeof parts.headProcess === "string"
      ? parts.headProcess
      : parts.headReady
        ? "utulun"
        : "none";
  const feetProcess =
    typeof parts.feetProcess === "string"
      ? parts.feetProcess
      : parts.feetReady
        ? "utulun"
        : "none";

  if (parts.head) {
    if (headProcess === "utulun") {
      selected.push("baş + ütülsün");
    } else if (headProcess === "dogransin") {
      selected.push("baş + ütülsün + doğransın");
    } else if (headProcess === "sedeqe") {
      selected.push("baş + pulsuz sədəqə et");
    } else {
      selected.push("baş");
    }
  }
  if (parts.feet) {
    if (feetProcess === "utulun") {
      selected.push("ayaqları + ütülsün");
    } else if (feetProcess === "dogransin") {
      selected.push("ayaqları + ütülsün + doğransın");
    } else if (feetProcess === "sedeqe") {
      selected.push("ayaqları + pulsuz sədəqə et");
    } else {
      selected.push("ayaqları");
    }
  }
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
        cutStyle: draft.cutStyle,
        slaughterTimingHours: draft.slaughterTimingHours,
        slaughterDate: draft.slaughterDate,
        deliveryDate: draft.deliveryDate,
        deliveryWindow: draft.deliveryWindow,
        contactInfo: draft.contactInfo,
        orphanDelight: draft.orphanDelight,
        userNote: draft.note,
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
      <Text style={[styles.title, { marginBottom: 14, marginTop: 20 }]}>
        Sifariş xülasəsi
      </Text>

      <View style={styles.card}>
        <SummaryRow label="Qurban" value={draft.animal?.nameAz} />
        <SummaryRow label="Miqdar" value={quantityText} />
        <SummaryRow
          label={
            draft.distribution?.type === "ehtiyac_sahibleri" &&
            draft.portionSplit?.selfParts === 0
              ? "Ehtiyaclılara Göndəriləcək"
              : "Çatdırılma"
          }
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
          label={
            draft.distribution?.type === "ozun_gotur"
              ? "Götürüləcək hissələr"
              : "Göndəriləcək hissələr"
          }
          value={formatQurbanParts(draft.qurbanParts)}
        />
        {draft.cutStyle?.labelAz ? (
          <SummaryRow
            label="Doğranma növü"
            value={`${draft.cutStyle.labelAz}${
              Number(draft.cutStyle.extraFee || 0) > 0
                ? ` (+${draft.cutStyle.extraFee} ₼)`
                : " (Pulsuz)"
            }`}
          />
        ) : null}
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
