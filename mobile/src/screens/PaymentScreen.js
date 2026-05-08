import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Colors } from "../theme/colors";
import api from "../config/api";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

export default function PaymentScreen({ navigation, route }) {
  const { order } = route.params;
  useCategoryActiveGuard({
    animalType: order?.animalType,
    navigation,
    enabled: !!order?.animalType,
  });

  const [method, setMethod] = useState("bank_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const isCardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handlePay = async () => {
    if (method === "bank_card" && !isCardValid) {
      Alert.alert("Xəta", "Kart məlumatlarını düzgün daxil edin.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/orders/${order.id}/pay`, {
        paymentMethod: method,
      });
      if (res.data.success) {
        navigation.replace("Confirmation", { order: res.data.data.order });
      }
    } catch (err) {
      Alert.alert(
        "Ödəniş xətası",
        err.response?.data?.message || "Xəta baş verdi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OrderStepHeader currentStep={3} />

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Ödənilməli məbləğ</Text>
        <Text style={styles.amountValue}>{order.totalPrice} ₼</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Ödəniş seç</Text>
        <TouchableOpacity
          style={[styles.option, method === "bank_card" && styles.optionActive]}
          onPress={() => setMethod("bank_card")}
        >
          <Text style={styles.optionTitle}>
            Bank kart məlumatları ilə ödəniş
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.option,
            method === "cash_on_delivery" && styles.optionActive,
          ]}
          onPress={() => setMethod("cash_on_delivery")}
        >
          <Text style={styles.optionTitle}>Yerində ödəniş</Text>
          <Text style={styles.optionSub}>Kəsim ödənişdən sonra olacaq</Text>
        </TouchableOpacity>
      </View>

      {method === "bank_card" ? (
        <View style={styles.card}>
          <Text style={styles.title}>Kart məlumatları</Text>
          <TextInput
            style={styles.input}
            placeholder="0000 0000 0000 0000"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
            maxLength={19}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="MM/YY"
              keyboardType="number-pad"
              value={expiry}
              onChangeText={(v) => setExpiry(formatExpiry(v))}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="CVV"
              keyboardType="number-pad"
              value={cvv}
              onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>
            {method === "bank_card" ? "Ödəniş et" : "Seçimi təsdiqlə"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 30 },
  amountCard: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 12,
  },
  amountLabel: { color: "rgba(255,255,255,0.8)" },
  amountValue: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  optionTitle: { color: Colors.textPrimary, fontWeight: "600" },
  optionSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  row: { flexDirection: "row", gap: 8 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});
