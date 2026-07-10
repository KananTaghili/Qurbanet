import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function OtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  const { identifier, identifierType, flow, from } = route.params || {};
  const isLogin = flow === "login";

  const [code, setCode] = useState(["", "", "", ""]);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError("");
    if (digit && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleKeyPress = (i, e) => {
    if (e.nativeEvent.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleSubmit = async () => {
    const otp = code.join("");
    if (otp.length < 4) return setError("4 rəqəmli kodu daxil edin.");
    if (!isLogin) {
      if (name.trim().length < 2) return setError("Ad ən az 2 hərf olmalıdır.");
      if (lastName.trim().length < 2) return setError("Soyad ən az 2 hərf olmalıdır.");
      if (!password || password.length < 6) return setError("Şifrə ən az 6 simvol olmalıdır.");
    }

    setLoading(true);
    try {
      const payload = identifierType === "email" ? { email: identifier, code: otp } : { phone: identifier, code: otp };
      if (!isLogin && password) payload.password = password;

      const res = await api.post("/auth/verify-otp", payload);
      if (res.data.success) {
        let { token, user } = res.data.data;
        await login(token, user);

        if (!isLogin && name.trim()) {
          try {
            const profileRes = await api.put("/auth/profile", { name: name.trim(), lastName: lastName.trim() });
            token = profileRes.data.data?.token || token;
            user = profileRes.data.data?.user || { ...user, name: name.trim() };
            await login(token, user);
          } catch (profileErr) {
            setError(profileErr.response?.data?.message || "Ad yenilənə bilmədi.");
            setLoading(false);
            return;
          }
        }

        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (!status || status >= 500) setError("Xidmət müvəqqəti əlçatan deyil. Bir az sonra yenidən cəhd edin.");
      else if (status === 404) setError("Kod müddəti bitib və ya tapılmadı. Yenidən kod göndərin.");
      else setError(msg || "Daxil etdiyiniz kod yanlışdır. Yenidən cəhd edin.");
      setCode(["", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const subtitle = identifierType === "email" ? "ünvanına göndərilən 4 rəqəmli kodu daxil edin." : "nömrəsinə göndərilən 4 rəqəmli kodu daxil edin.";

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <View style={styles.headRow}>
        <Pressable style={styles.smallBack} onPress={() => navigation.goBack()}>
          <ArrowLeft size={17} color="#241331" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Kodu daxil edin</Text>
      </View>
      <Text style={styles.subtitle}>
        <Text style={{ fontWeight: "800", color: "#241331" }}>{identifier}</Text> {subtitle}
      </Text>

      <View style={styles.otpRow}>
        {code.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            style={[styles.otpBox, d && styles.otpBoxFilled]}
            value={d}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(v) => handleChange(i, v)}
            onKeyPress={(e) => handleKeyPress(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </View>

      {!isLogin && (
        <>
          <View style={s.field}>
            <Text style={s.label}>Ad *</Text>
            <TextInput
              style={s.plainInput}
              value={name}
              autoCapitalize="words"
              placeholder="Məsələn: Əli"
              placeholderTextColor="#9ca3af"
              onChangeText={(v) => { setName(v); setError(""); }}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Soyad *</Text>
            <TextInput
              style={s.plainInput}
              value={lastName}
              autoCapitalize="words"
              placeholder="Məsələn: Hüseynov"
              placeholderTextColor="#9ca3af"
              onChangeText={(v) => { setLastName(v); setError(""); }}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Şifrə *</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                value={password}
                secureTextEntry={!showPassword}
                maxLength={128}
                placeholder="Ən az 6 simvol"
                placeholderTextColor="#9ca3af"
                onChangeText={(v) => { setPassword(v); setError(""); }}
              />
              <Pressable style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={17} color="#9ca3af" /> : <Eye size={17} color="#9ca3af" />}
              </Pressable>
            </View>
          </View>
        </>
      )}

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable style={[s.primaryBtn, loading && s.primaryBtnDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Təsdiq et</Text>}
      </Pressable>

      <Pressable style={s.linkBtn} onPress={() => navigation.goBack()}>
        <Text style={s.linkBtnText}>
          {identifierType === "email" ? "← Email ünvanını dəyiş" : "← Telefon nömrəsini dəyiş"}
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  smallBack: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 19 },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 20 },
  otpBox: {
    width: 52,
    height: 56,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  otpBoxFilled: { borderColor: "#c8102e", backgroundColor: "#fff5f5", color: "#c8102e" },
});
