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
  const { identifier, identifierType, phone: legacyPhone } = route.params;
  const id = identifier || legacyPhone;
  const idType = identifierType || "phone";
  const { login } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRef = useRef(null);

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

  const handleChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    if (digits.length === OTP_LENGTH) {
      handleVerify(digits);
    }
  };

  const handleVerify = async (code) => {
    if (loading) return;
    const fullCode = code ?? otp;
    if (fullCode.length !== OTP_LENGTH) {
      Alert.alert("Xəta", "6 rəqəmli kodu tam daxil edin.");
      return;
    }
    setLoading(true);
    try {
      const payload =
        idType === "email"
          ? { email: id, code: fullCode }
          : { phone: id, code: fullCode };
      const res = await api.post("/auth/verify-otp", payload);
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
      setOtp("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const payload =
        idType === "email" ? { email: id } : { phone: id };
      await api.post("/auth/send-otp", payload);
      setResendTimer(60);
      setOtp("");
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Doğrulama kodu</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.phone}>{id}</Text>
            {idType === "email" ? " ünvanına" : " nömrəsinə"}{"\n"}6 rəqəmli
            kod göndərildi
          </Text>
        </View>

        {/* Gizli real input — bütün kodu alır */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otp}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
        />

        {/* Vizual qutular — yalnız göstərir */}
        <TouchableOpacity
          style={styles.otpContainer}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {Array(OTP_LENGTH)
            .fill("")
            .map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpInput,
                  otp[i] ? styles.otpInputFilled : null,
                  i === otp.length && styles.otpInputActive,
                ]}
              >
                <Text style={styles.otpDigit}>{otp[i] || ""}</Text>
              </View>
            ))}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || otp.length < OTP_LENGTH) && styles.buttonDisabled,
          ]}
          onPress={() => handleVerify(otp)}
          disabled={loading || otp.length < OTP_LENGTH}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Yoxlanılır..." : "Təsdiqlə"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
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
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
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
    alignItems: "center",
    justifyContent: "center",
  },
  otpInputFilled: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderColor: Colors.accent,
  },
  otpInputActive: {
    borderColor: Colors.white,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
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
