import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Phone, Mail, Eye, EyeOff, ArrowRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { formatPhone, toE164 } from "../lib/format";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { lang } = useLanguage();
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
      if (phone.replace(/\s/g, "").length < 9) return setError(t(lang, "authForm_errorPhone"));
    } else if (!email.trim() || !email.includes("@")) {
      return setError(t(lang, "authForm_errorEmail"));
    }
    if (!password || password.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));

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
      setError(err.response?.data?.message || t(lang, "authForm_errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <View>
        <Text style={{ fontSize: scaleFont(20), fontWeight: "800", color: "#111827" }}>{t(lang, "login_welcomeTitle")}</Text>
        <Text style={{ marginTop: scale(4), fontSize: scaleFont(13), color: "#6b7280", marginBottom: scale(20) }}>
          {t(lang, "login_welcomeSub")}
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

      <View style={s.field}>
        <Text style={s.label}>{t(lang, "authForm_passwordLabel")}</Text>
        <View style={s.inputBox}>
          <TextInput
            style={s.input}
            value={password}
            secureTextEntry={!showPassword}
            maxLength={128}
            placeholder={t(lang, "authForm_passwordPlaceholder")}
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
          <Text style={s.forgotText}>{t(lang, "login_forgotPassword")}</Text>
        </Pressable>
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
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={s.primaryBtnText}>{t(lang, "authForm_loginButton")}</Text>
            <ArrowRight size={17} color="#fff" />
          </>
        )}
      </Pressable>

      <View style={s.helperRow}>
        <Text style={s.helperText}>{t(lang, "login_noAccount")}</Text>
      </View>

      <Pressable style={s.outlineBtn} onPress={() => navigation.replace("Register")}>
        <Text style={s.outlineBtnText}>{t(lang, "login_registerCta")}</Text>
      </Pressable>
    </AuthShell>
  );
}
