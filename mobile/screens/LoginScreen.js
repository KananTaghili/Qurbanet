import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Phone, Mail, Eye, EyeOff, ArrowRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { formatPhone, toE164 } from "../lib/format";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setPhone("");
    setEmail("");
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError("");
    if (mode === "phone") {
      if (phone.replace(/\s/g, "").length < 9) return setError("Düzgün telefon nömrəsi daxil edin.");
    } else if (!email.trim() || !email.includes("@")) {
      return setError("Düzgün email ünvanı daxil edin.");
    }
    if (!password || password.length < 6) return setError("Şifrə ən az 6 simvol olmalıdır.");

    setLoading(true);
    try {
      const body = { password };
      if (mode === "phone") body.phone = toE164(phone);
      else body.email = email.trim().toLowerCase();

      const res = await api.post("/auth/login-password", body);
      if (res.data.success) {
        const { token, user } = res.data.data;
        await login(token, user);
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Xoş gəlmisiniz</Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Hesabınıza daxil olun və sifarişlərinizi idarə edin.
        </Text>
      </View>

      <View style={s.tabRow}>
        {[
          { key: "phone", Icon: Phone, label: "Telefon" },
          { key: "email", Icon: Mail, label: "Email" },
        ].map(({ key, Icon, label }) => (
          <Pressable
            key={key}
            style={[s.tabBtn, mode === key && s.tabBtnActive]}
            onPress={() => switchMode(key)}
          >
            <Icon size={15} color={mode === key ? "#111827" : "#9ca3af"} />
            <Text style={[s.tabLabel, mode === key && s.tabLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.field}>
        <Text style={s.label}>{mode === "phone" ? "Telefon Nömrəsi" : "Email"}</Text>
        {mode === "phone" ? (
          <View style={s.inputBox}>
            <Text style={s.phonePrefix}>AZ +994</Text>
            <TextInput
              style={s.input}
              value={phone}
              keyboardType="number-pad"
              placeholder="23 232 32 32"
              placeholderTextColor="#9ca3af"
              onChangeText={(v) => { setPhone(formatPhone(v.replace(/\D/g, "").slice(0, 9))); setError(""); }}
            />
          </View>
        ) : (
          <TextInput
            style={s.plainInput}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="ad@meatbox.az"
            placeholderTextColor="#9ca3af"
            onChangeText={(v) => { setEmail(v); setError(""); }}
          />
        )}
      </View>

      <View style={s.field}>
        <Text style={s.label}>Şifrə</Text>
        <View style={s.inputBox}>
          <TextInput
            style={s.input}
            value={password}
            secureTextEntry={!showPassword}
            maxLength={128}
            placeholder="Şifrənizi daxil edin"
            placeholderTextColor="#9ca3af"
            onChangeText={(v) => { setPassword(v); setError(""); }}
          />
          <Pressable style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
          </Pressable>
        </View>
      </View>

      <View style={s.forgotRow}>
        <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={s.forgotText}>Şifrəni unutdum</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[s.primaryBtn, loading && s.primaryBtnDisabled, { marginTop: 8 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={s.primaryBtnText}>Daxil ol</Text>
            <ArrowRight size={17} color="#fff" />
          </>
        )}
      </Pressable>

      <View style={s.helperRow}>
        <Text style={s.helperText}>Hesabınız yoxdur?</Text>
      </View>

      <Pressable style={s.outlineBtn} onPress={() => navigation.replace("Register")}>
        <Text style={s.outlineBtnText}>Qeydiyyatdan keç</Text>
      </Pressable>
    </AuthShell>
  );
}
