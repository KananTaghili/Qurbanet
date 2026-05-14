import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Colors } from "../theme/colors";
import api, { BASE_URL } from "../config/api";

const LOGO = require("../assets/logo.png");

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("994")) {
    const local = digits.slice(3);
    return formatLocal(local, "+994");
  }
  if (digits.startsWith("0")) {
    return formatLocal(digits.slice(1), "0");
  }
  return formatLocal(digits, "");
};

const formatLocal = (local, prefix) => {
  if (local.length <= 2) return `${prefix}${local}`;
  if (local.length <= 5)
    return `${prefix}${local.slice(0, 2)} ${local.slice(2)}`;
  if (local.length <= 7)
    return `${prefix}${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  return `${prefix}${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
};

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const raw = phone.replace(/\s/g, "");
    if (raw.length < 9) {
      Alert.alert("Xəta", "Düzgün telefon nömrəsi daxil edin.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/send-otp", { phone: raw });
      if (res.data.success) {
        navigation.navigate("OTP", { phone: res.data.data.phone });
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      const networkDetails = [
        err.code ? `Kod: ${err.code}` : null,
        err.message ? `Mesaj: ${err.message}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const networkMsg =
        "Servere qosulmaq olmadi. Telefon ve komputer eyni Wi-Fi-da olsun.\n" +
        `API: ${BASE_URL}` +
        (networkDetails ? `\n${networkDetails}` : "");

      Alert.alert("Xəta", msg || networkMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Başlıq */}
        <View style={styles.header}>
          <Image source={LOGO} style={styles.logo} />
          <Text style={styles.appName}>Qurban.az</Text>
          <Text style={styles.tagline}>
            İlahi qurbanınızı etibarla kəsdirin
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>Daxil ol / Qeydiyyat</Text>
          <Text style={styles.subtitle}>
            Azərbaycan nömrənizi daxil edin, doğrulama kodu göndərəcəyik.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.flag}>🇦🇿</Text>
            <TextInput
              style={styles.input}
              placeholder="050 123 45 67"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(val) => setPhone(formatPhone(val))}
              maxLength={16}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? "Göndərilir..." : "Kod göndər"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            🔒 Nömrəniz yalnız giriş üçün istifadə edilir
          </Text>
        </View>

        <Text style={styles.testHint}>Test rejimi: OTP kodu — 123456</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.75)",
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: Colors.background,
  },
  flag: { fontSize: 24, marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.textPrimary,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 17, fontWeight: "700" },
  note: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
  },
  testHint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 20,
  },
});
