import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Phone, Mail } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import api from "../lib/api";
import { formatPhone, toE164 } from "../lib/format";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const from = route.params?.from;
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    setLoading(true);
    try {
      const body = {};
      let identifier;
      if (mode === "phone") {
        identifier = toE164(phone);
        body.phone = identifier;
      } else {
        identifier = email.trim().toLowerCase();
        body.email = identifier;
      }
      await api.post("/auth/send-otp", { ...body, isRegister: true });
      navigation.navigate("Otp", {
        identifier,
        identifierType: mode,
        flow: "register",
        from,
      });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) {
        setError(msg || (mode === "phone" ? "Bu telefon nömrəsi artıq qeydiyyatdan keçib." : "Bu email artıq qeydiyyatdan keçib."));
      } else {
        setError(msg || "Xəta baş verdi. Yenidən cəhd edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Qeydiyyatdan keç</Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Telefon və ya email ilə hesab yaradın.
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
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Kod göndər →</Text>}
      </Pressable>

      <View style={s.helperRow}>
        <Text style={s.helperText}>Artıq hesabınız var?</Text>
      </View>

      <Pressable style={s.outlineBtn} onPress={() => navigation.replace("Login")}>
        <Text style={s.outlineBtnText}>Daxil ol</Text>
      </Pressable>
    </AuthShell>
  );
}
