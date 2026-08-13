import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Phone, Mail, Eye, EyeOff, KeyRound } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import AuthShell from "../components/AuthShell";
import s from "../components/authFormStyles";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { formatPhone, toE164 } from "../lib/format";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const StepHeader = ({ title, subtitle }) => (
  <View style={styles.headRow}>
    <View style={styles.keyIcon}>
      <KeyRound size={20} color="#c8102e" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{title}</Text>
    </View>
  </View>
);

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { lang } = useLanguage();

  const [step, setStep] = useState("identifier");
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifierValue, setIdentifierValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const inputs = useRef([]);
  const timerRef = useRef(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((p) => {
        if (p <= 1) { clearInterval(timerRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const buildPayload = () => (mode === "phone" ? { phone: toE164(phone) } : { email: email.trim().toLowerCase() });

  const validate = () => {
    if (mode === "phone") {
      if (phone.replace(/\s/g, "").length < 9) { setError(t(lang, "authForm_errorPhone")); return false; }
    } else if (!email.trim() || !email.includes("@")) {
      setError(t(lang, "authForm_errorEmail")); return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (sending || !validate()) return;
    setSending(true);
    setError("");
    try {
      const payload = buildPayload();
      await api.post("/auth/forgot-password", payload);
      setIdentifierValue(mode === "phone" ? payload.phone : payload.email);
      setStep("otp");
      setCode(["", "", "", ""]);
      startTimer();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 404) setError(mode === "phone" ? t(lang, "forgotPw_errorPhoneNotFound") : t(lang, "forgotPw_errorEmailNotFound"));
      else if ((status === 500 || status === 503) && mode === "phone") setError(t(lang, "forgotPw_errorSmsFailed"));
      else setError(msg || t(lang, "authForm_errorGeneric"));
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (i, val) => {
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

  const handleResend = async () => {
    if (resendTimer > 0 || sending) return;
    setSending(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", mode === "phone" ? { phone: identifierValue } : { email: identifierValue });
      setCode(["", "", "", ""]);
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "forgotPw_errorResendFailed"));
    } finally {
      setSending(false);
    }
  };

  const [verifying, setVerifying] = useState(false);

  const handleVerifyOtp = async () => {
    const filled = code.filter((d) => d !== "").length;
    if (filled < 4) {
      setError(t(lang, "forgotPw_errorOtpEmpty"));
      setCode(["", "", "", ""]);
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const fullCode = code.join("");
      const payload = mode === "phone" ? { phone: identifierValue, code: fullCode } : { email: identifierValue, code: fullCode };
      await api.post("/auth/verify-forgot-otp", payload);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "forgotPw_errorOtpWrong"));
      setCode(["", "", "", ""]);
    } finally {
      setVerifying(false);
    }
  };

  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (resetting) return;
    if (!newPassword || newPassword.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));
    if (newPassword !== confirmPassword) return setError(t(lang, "forgotPw_errorPasswordsMismatch"));
    setResetting(true);
    setError("");
    try {
      const fullCode = code.join("");
      const payload = mode === "phone"
        ? { phone: identifierValue, code: fullCode, newPassword }
        : { email: identifierValue, code: fullCode, newPassword };
      const res = await api.post("/auth/reset-password", payload);
      if (res.data.success) {
        const { token, user } = res.data.data;
        await login(token, user);
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 400 && (msg?.includes("Yanlış kod") || msg?.includes("tapılmadı") || msg?.includes("vaxtı"))) {
        setCode(["", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
        setStep("otp");
        setError(t(lang, "forgotPw_errorOtpExpiredReenter"));
      } else {
        setError(msg || t(lang, "forgotPw_errorResetFailed"));
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <AuthShell onBack={() => navigation.goBack()}>
      {step === "identifier" && (
        <>
          <StepHeader title={t(lang, "forgotPw_title")} />
          <Text style={styles.subtitle}>{t(lang, "forgotPw_subtitle")}</Text>

          <View style={s.tabRow}>
            {[
              { key: "phone", Icon: Phone, label: t(lang, "authForm_phoneTab") },
              { key: "email", Icon: Mail, label: t(lang, "authForm_emailTab") },
            ].map(({ key, Icon, label }) => (
              <Pressable key={key} style={[s.tabBtn, mode === key && s.tabBtnActive]} onPress={() => { setMode(key); setError(""); }}>
                <Icon size={15} color={mode === key ? "#111827" : "#9ca3af"} />
                <Text style={[s.tabLabel, mode === key && s.tabLabelActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.field}>
            <Text style={s.label}>{mode === "phone" ? t(lang, "forgotPw_phoneNumberRequiredLabel") : t(lang, "forgotPw_emailRequiredLabel")}</Text>
            {mode === "phone" ? (
              <View style={s.inputBox}>
                <Text style={s.phonePrefix}>AZ +994</Text>
                <TextInput
                  style={s.input}
                  value={phone}
                  keyboardType="number-pad"
                  placeholder="50 123 45 67"
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
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                onChangeText={(v) => { setEmail(v); setError(""); }}
              />
            )}
          </View>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <Pressable style={[s.primaryBtn, sending && s.primaryBtnDisabled]} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t(lang, "forgotPw_sendCode")}</Text>}
          </Pressable>

          <Pressable style={s.linkBtn} onPress={() => navigation.goBack()}>
            <Text style={s.linkBtnText}>{t(lang, "forgotPw_backLink")}</Text>
          </Pressable>
        </>
      )}

      {step === "otp" && (
        <>
          <StepHeader title={t(lang, "forgotPw_otpTitle")} />
          <Text style={styles.subtitle}>{mode === "phone" ? t(lang, "forgotPw_otpSubToPhone") : t(lang, "forgotPw_otpSubToEmail")} {t(lang, "forgotPw_otpSubSuffix")}</Text>

          <View style={styles.otpRow}>
            {code.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                style={[styles.otpBox, d && styles.otpBoxFilled]}
                value={d}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(v) => handleOtpChange(i, v)}
                onKeyPress={(e) => handleKeyPress(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </View>
          <Pressable onPress={handleResend} disabled={resendTimer > 0 || sending} style={{ marginBottom: scale(16) }}>
            <Text style={[styles.resendText, resendTimer > 0 && { color: "#9ca3af" }]}>
              {resendTimer > 0 ? t(lang, "forgotPw_resendTemplate").replace("{s}", resendTimer) : t(lang, "forgotPw_resendNow")}
            </Text>
          </Pressable>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <Pressable style={[s.primaryBtn, verifying && s.primaryBtnDisabled]} onPress={handleVerifyOtp} disabled={verifying}>
            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t(lang, "forgotPw_continueBtn")}</Text>}
          </Pressable>

          <Pressable style={s.linkBtn} onPress={() => { setStep("identifier"); setError(""); }}>
            <Text style={s.linkBtnText}>{t(lang, "forgotPw_backLink")}</Text>
          </Pressable>
        </>
      )}

      {step === "reset" && (
        <>
          <StepHeader title={t(lang, "forgotPw_resetTitle")} />
          <Text style={styles.subtitle}>{t(lang, "forgotPw_resetSubtitle")}</Text>

          <View style={s.field}>
            <Text style={s.label}>{t(lang, "forgotPw_newPasswordLabel")}</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                value={newPassword}
                secureTextEntry={!showNew}
                maxLength={128}
                placeholder={t(lang, "authForm_passwordMinPlaceholder")}
                placeholderTextColor="#9ca3af"
                onChangeText={(v) => { setNewPassword(v); setError(""); }}
              />
              <Pressable style={s.eyeBtn} onPress={() => setShowNew((v) => !v)}>
                {showNew ? <EyeOff size={17} color="#9ca3af" /> : <Eye size={17} color="#9ca3af" />}
              </Pressable>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>{t(lang, "forgotPw_confirmPasswordLabel")}</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                value={confirmPassword}
                secureTextEntry={!showConfirm}
                maxLength={128}
                placeholder={t(lang, "forgotPw_confirmPasswordPlaceholder")}
                placeholderTextColor="#9ca3af"
                onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
              />
              <Pressable style={s.eyeBtn} onPress={() => setShowConfirm((v) => !v)}>
                {showConfirm ? <EyeOff size={17} color="#9ca3af" /> : <Eye size={17} color="#9ca3af" />}
              </Pressable>
            </View>
          </View>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <Pressable style={[s.primaryBtn, resetting && s.primaryBtnDisabled]} onPress={handleReset} disabled={resetting}>
            {resetting ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t(lang, "forgotPw_updateBtn")}</Text>}
          </Pressable>

          <Pressable style={s.linkBtn} onPress={() => { setStep("otp"); setError(""); }}>
            <Text style={s.linkBtnText}>{t(lang, "forgotPw_backLink")}</Text>
          </Pressable>
        </>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", gap: scale(10), marginBottom: scale(6) },
  keyIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: "#fff1f3",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: scaleFont(20), fontWeight: "900", color: "#111827" },
  subtitle: { fontSize: scaleFont(13), color: "#6b7280", marginBottom: scale(20), lineHeight: moderateScale(19) },
  otpRow: { flexDirection: "row", gap: scale(10), justifyContent: "center", marginBottom: scale(8) },
  otpBox: {
    width: scale(56),
    height: scale(56),
    textAlign: "center",
    fontSize: scaleFont(22),
    fontWeight: "700",
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8f9fb",
    color: "#111827",
  },
  otpBoxFilled: { borderColor: "#c8102e", backgroundColor: "#fff1f3", color: "#c8102e" },
  resendText: { fontSize: scaleFont(12), fontWeight: "600", textAlign: "center", color: "#c8102e" },
});
