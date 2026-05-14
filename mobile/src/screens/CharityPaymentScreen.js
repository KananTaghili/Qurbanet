import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Colors } from "../theme/colors";
import api from "../config/api";

export default function CharityPaymentScreen({ route, navigation }) {
  const { label, accentColor, summaryRows, totalAmount, charityType, modeKey } =
    route.params;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: accentColor,
      },
      headerTintColor: Colors.white,
    });
  }, [navigation, accentColor]);

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
    if (!isCardValid) {
      Alert.alert("Xəta", "Kart məlumatlarını düzgün daxil edin.");
      return;
    }
    setLoading(true);
    try {
      // Create charity order after successful payment
      const response = await api.post("/charity-orders", {
        label,
        charityType,
        modeKey,
        summaryRows,
        totalAmount,
        paymentMethod: "bank_card",
        status: "pending",
        video: null,
      });

      setLoading(false);
      navigation.replace("CharityConfirmation", {
        charityOrder: response.data.data,
        label,
        totalAmount,
      });
    } catch (error) {
      setLoading(false);
      Alert.alert(
        "Xəta",
        error.response?.data?.message || "Ödəniş zamanı xəta baş verdi",
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Amount hero */}
      <View style={[styles.amountCard, { backgroundColor: accentColor }]}>
        <MaterialCommunityIcons
          name="hand-heart-outline"
          size={28}
          color="rgba(255,255,255,0.75)"
          style={{ marginBottom: 6 }}
        />
        <Text style={styles.amountLabel}>Ödənilməli məbləğ</Text>
        <Text style={styles.amountValue}>{totalAmount} ₼</Text>
        <Text style={styles.amountTarget}>{label}</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ödənişin Xülasəsi</Text>
        {summaryRows.map((row, i) => (
          <View key={i} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{row.label}</Text>
            <Text style={styles.breakdownValue}>{row.value} ₼</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.totalLabel}>Cəmi</Text>
          <Text style={[styles.totalValue, { color: accentColor }]}>
            {totalAmount} ₼
          </Text>
        </View>
      </View>

      {/* Card fields */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kart məlumatları</Text>
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

      {/* Pay button */}
      <TouchableOpacity
        style={[
          styles.payBtn,
          { backgroundColor: accentColor },
          !isCardValid && styles.payBtnDisabled,
        ]}
        onPress={handlePay}
        disabled={loading || !isCardValid}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={Colors.white}
            />
            <Text style={styles.payBtnText}>Ödəniş et</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 12 },

  amountCard: {
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  amountLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  amountValue: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  amountTarget: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
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

  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
  },

  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    backgroundColor: Colors.background,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  row: { flexDirection: "row", gap: 8 },

  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 17,
  },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
