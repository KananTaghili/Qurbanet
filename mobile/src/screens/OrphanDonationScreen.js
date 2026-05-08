import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

const KABAB_ICON = require("../assets/kabab-icon.png");

const ORPHAN_TARGET = {
  key: "usaqlar_evi",
  label: "Yetim süfrəsi",
};

export default function OrphanDonationScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const [amount, setAmount] = useState("");
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadContactInfo = async () => {
      const raw = await AsyncStorage.getItem("contact_info");
      if (raw) {
        setContactInfo(JSON.parse(raw));
      }
    };
    loadContactInfo();
  }, []);

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Xəta", "Lütfən ədədi dəyər daxil edin");
      return;
    }

    // For now, just navigate to confirmation
    // In a real app, this would call an API
    navigation.navigate("OrphanDonationConfirmation", {
      target: ORPHAN_TARGET.key,
      amount: parseFloat(amount),
      targetLabel: ORPHAN_TARGET.label,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yetim Süfrəsi</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoTitleRow}>
          <Image source={KABAB_ICON} style={styles.infoTitleImage} />
          <Text style={styles.infoTitle}>Yetim süfrəsinə dəstək olun</Text>
        </View>
        <View style={styles.targetsContainer}>
          <View style={[styles.targetCard, styles.targetCardActive]}>
            <Image source={KABAB_ICON} style={styles.targetIconImage} />
            <Text style={[styles.targetLabel, styles.targetLabelActive]}>
              {ORPHAN_TARGET.label}
            </Text>
          </View>
          <Text style={styles.targetDescription}>
            Toplanan bağışlar yalnız yetimlər üçün yemək-içmək süfrəsi
            hazırlanmasına istifadə olunacaq.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Bağış Məbləği (AZN)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Məbləği daxil edin"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Sizin bağışınız yalnız yetimlər üçün süfrə hazırlanmasına sərf
          ediləcəkdir.
        </Text>
      </View>

      {amount ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bağış Özəti</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fəaliyyət:</Text>
            <Text style={styles.summaryValue}>{ORPHAN_TARGET.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Məbləğ:</Text>
            <Text style={styles.summaryValue}>{amount} ₼</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, !amount && styles.buttonDisabled]}
        onPress={handleDonate}
        disabled={!amount || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Bağışı Tamamla</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitleImage: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  targetsContainer: {
    gap: 10,
  },
  targetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  targetCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  targetDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
  },
  targetIconImage: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  targetLabelActive: {
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  infoBox: {
    backgroundColor: Colors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
