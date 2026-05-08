import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && value) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code) => {
    if (loading) return;
    const fullCode = code || otp.join("");
    if (fullCode.length !== OTP_LENGTH) {
      Alert.alert("Xəta", "6 rəqəmli kodu tam daxil edin.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { phone, code: fullCode });
      if (res.data.success) {
        const { token, user, needsName } = res.data.data;
        if (needsName) {
          navigation.navigate("Name", { token, user });
        } else {
          await login(token, user);
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Kod yanlışdır. Yenidən cəhd edin.";
      Alert.alert("Xəta", msg);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await api.post("/auth/send-otp", { phone });
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      Alert.alert("✅", "Yeni kod göndərildi.");
    } catch (err) {
      Alert.alert("Xəta", "Kod göndərilə bilmədi.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Başlıq */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Doğrulama kodu</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.phone}>{phone}</Text> nömrəsinə{"\n"}6 rəqəmli
            kod göndərildi
          </Text>
        </View>

        {/* OTP inputlar */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(val) => handleChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Yoxla düyməsi */}
        <TouchableOpacity
          style={[
            styles.button,
            (loading || otp.some((d) => !d)) && styles.buttonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={loading || otp.some((d) => !d)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Yoxlanılır..." : "Təsdiqlə"}
          </Text>
        </TouchableOpacity>

        {/* Yenidən göndər */}
        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text
            style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}
          >
            {resendTimer > 0
              ? `Yenidən göndər (${resendTimer}s)`
              : "Kodu yenidən göndər"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.testNote}>💡 Test: kod 123456</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flex: 1, padding: 24, justifyContent: "center" },
  back: { position: "absolute", top: 50, left: 24 },
  backText: { color: Colors.white, fontSize: 16 },
  header: { alignItems: "center", marginBottom: 40 },
  icon: { fontSize: 56 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  phone: { fontWeight: "700", color: Colors.white },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
  },
  otpInputFilled: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderColor: Colors.accent,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Colors.primaryDark, fontSize: 17, fontWeight: "800" },
  resend: {
    textAlign: "center",
    fontSize: 15,
    color: Colors.accent,
    fontWeight: "600",
  },
  resendDisabled: { color: "rgba(255,255,255,0.4)" },
  testNote: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 24,
  },
});
