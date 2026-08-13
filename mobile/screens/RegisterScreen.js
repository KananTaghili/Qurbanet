import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Phone, Mail } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import api from "../lib/api";
import { formatPhone, toE164 } from "../lib/format";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const from = route.params?.from;
  const { lang } = useLanguage();
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
      if (phone.replace(/\s/g, "").length < 9) return setError(t(lang, "authForm_errorPhone"));
    } else if (!email.trim() || !email.includes("@")) {
      return setError(t(lang, "authForm_errorEmail"));
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
        setError(msg || (mode === "phone" ? t(lang, "register_errorPhoneExists") : t(lang, "register_errorEmailExists")));
      } else {
        setError(msg || t(lang, "authForm_errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <View>
        <Text style={{ fontSize: scaleFont(20), fontWeight: "800", color: "#111827" }}>{t(lang, "register_title")}</Text>
        <Text style={{ marginTop: scale(4), fontSize: scaleFont(13), color: "#6b7280", marginBottom: scale(20) }}>
          {t(lang, "register_subtitle")}
        </Text>
      </View>

      <View style={s.tabRow}>
        {[
          { key: "phone", Icon: Phone, label: t(lang, "authForm_phoneTab") },
          { key: "email", Icon: Mail, label: t(lang, "authForm_emailTab") },
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
        <Text style={s.label}>{mode === "phone" ? t(lang, "login_phoneNumberLabel") : t(lang, "authForm_emailLabel")}</Text>
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
        style={[s.primaryBtn, loading && s.primaryBtnDisabled, { marginTop: scale(8) }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t(lang, "register_sendCode")}</Text>}
      </Pressable>

      <View style={s.helperRow}>
        <Text style={s.helperText}>{t(lang, "register_haveAccount")}</Text>
      </View>

      <Pressable style={s.outlineBtn} onPress={() => navigation.replace("Login")}>
        <Text style={s.outlineBtnText}>{t(lang, "authForm_loginButton")}</Text>
      </Pressable>
    </AuthShell>
  );
}
