import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

export default function OtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  const { lang } = useLanguage();
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
    if (otp.length < 4) return setError(t(lang, "otp_errorCodeIncomplete"));
    if (!isLogin) {
      if (name.trim().length < 2) return setError(t(lang, "authForm_errorFirstNameShort"));
      if (lastName.trim().length < 2) return setError(t(lang, "authForm_errorLastNameShort"));
      if (!password || password.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));
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
            setError(profileErr.response?.data?.message || t(lang, "otp_errorNameUpdateFailed"));
            setLoading(false);
            return;
          }
        }

        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (!status || status >= 500) setError(t(lang, "authForm_errorServiceUnavailable"));
      else if (status === 404) setError(t(lang, "otp_errorCodeExpired"));
      else setError(msg || t(lang, "authForm_errorWrongCode"));
      setCode(["", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const subtitle = identifierType === "email" ? t(lang, "otp_subtitleToEmail") : t(lang, "otp_subtitleToPhone");

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      <View style={styles.headRow}>
        <Pressable style={styles.smallBack} onPress={() => navigation.goBack()}>
          <ArrowLeft size={17} color="#241331" />
        </Pressable>
        <Text style={{ fontSize: scaleFont(20), fontWeight: "800", color: "#111827" }}>{t(lang, "otp_title")}</Text>
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
            <Text style={s.label}>{t(lang, "otp_firstNameLabel")}</Text>
            <TextInput
              style={s.plainInput}
              value={name}
              autoCapitalize="words"
              placeholder={t(lang, "otp_firstNamePlaceholder")}
              placeholderTextColor="#9ca3af"
              onChangeText={(v) => { setName(v); setError(""); }}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>{t(lang, "otp_lastNameLabel")}</Text>
            <TextInput
              style={s.plainInput}
              value={lastName}
              autoCapitalize="words"
              placeholder={t(lang, "otp_lastNamePlaceholder")}
              placeholderTextColor="#9ca3af"
              onChangeText={(v) => { setLastName(v); setError(""); }}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>{t(lang, "authForm_passwordRequiredLabel")}</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                value={password}
                secureTextEntry={!showPassword}
                maxLength={128}
                placeholder={t(lang, "authForm_passwordMinPlaceholder")}
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
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t(lang, "authForm_verifyButton")}</Text>}
      </Pressable>

      <Pressable style={s.linkBtn} onPress={() => navigation.goBack()}>
        <Text style={s.linkBtnText}>
          {identifierType === "email" ? t(lang, "otp_changeEmailLink") : t(lang, "otp_changePhoneLink")}
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", gap: scale(10), marginBottom: scale(6) },
  smallBack: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: scaleFont(13), color: "#6b7280", marginBottom: scale(20), lineHeight: moderateScale(19) },
  otpRow: { flexDirection: "row", gap: scale(10), justifyContent: "center", marginBottom: scale(20) },
  otpBox: {
    width: scale(52),
    height: scale(56),
    textAlign: "center",
    fontSize: scaleFont(20),
    fontWeight: "700",
    borderRadius: scale(14),
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  otpBoxFilled: { borderColor: "#c8102e", backgroundColor: "#fff5f5", color: "#c8102e" },
});
