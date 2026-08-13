import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { ChevronLeft, Phone, Mail, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { formatPhone, toE164, isValidAzPhone, AZ_OPERATORS } from "../lib/phone";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE_MID = "#5b21b6";
const DARK = "#241a4d";

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function operatorInvalid(value) {
  const digits = value.replace(/\D/g, "");
  const prefix = digits.startsWith("0") ? digits.slice(1, 3) : digits.slice(0, 2);
  return digits.length >= 2 && !AZ_OPERATORS.includes(prefix);
}

// Inline login / register / forgot-password flow, embedded directly inside a modal
// step instead of navigating away to the Login/Register/ForgotPassword screens —
// so the caller's in-progress flow (donation, campaign opening, ...) isn't lost.
export default function InlineAuth({ onBack, onAuthed }) {
  const { login } = useAuth();
  const { lang } = useLanguage();

  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [method, setMethod] = useState("phone"); // "phone" | "email"
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fpStep, setFpStep] = useState("identifier"); // "identifier" | "otp" | "reset"
  const [fpIdentifier, setFpIdentifier] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");

  const phoneOperatorInvalid = operatorInvalid(phone);
  const fpOperatorInvalid = method === "phone" && operatorInvalid(fpIdentifier);

  const switchMode = (m) => {
    setMode(m);
    setOtpSent(false);
    setOtp("");
    setError("");
    setPhone("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    if (m === "forgot") {
      setFpStep("identifier");
      setFpIdentifier("");
      setFpOtp("");
      setFpNewPassword("");
      setFpConfirmPassword("");
    }
  };

  const handleLogin = async () => {
    setError("");
    if (method === "phone") {
      if (!isValidAzPhone(phone)) return setError(t(lang, "authForm_errorPhone"));
    } else if (!isValidEmail(email.trim())) {
      return setError(t(lang, "authForm_errorEmail"));
    }
    if (!password || password.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));

    setLoading(true);
    try {
      const body = { password };
      if (method === "phone") body.phone = toE164(phone);
      else body.email = email.trim().toLowerCase();
      const res = await api.post("/auth/login-password", body);
      const { token, user } = res.data.data;
      await login(token, user);
      onAuthed(user);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "authForm_errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    if (firstName.trim().length < 2) return setError(t(lang, "authForm_errorFirstNameShort"));
    if (lastName.trim().length < 2) return setError(t(lang, "authForm_errorLastNameShort"));
    if (method === "phone") {
      if (!isValidAzPhone(phone)) return setError(t(lang, "authForm_errorPhone"));
    } else if (!isValidEmail(email.trim())) {
      return setError(t(lang, "authForm_errorEmail"));
    }
    if (!password || password.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));

    setLoading(true);
    try {
      const body = {};
      if (method === "phone") body.phone = toE164(phone);
      else body.email = email.trim().toLowerCase();
      await api.post("/auth/send-otp", { ...body, isRegister: true });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "authForm_errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length < 4) return setError(t(lang, "otp_errorCodeIncomplete"));

    setLoading(true);
    try {
      const payload = method === "email"
        ? { email: email.trim().toLowerCase(), code: otp, password }
        : { phone: toE164(phone), code: otp, password };
      const res = await api.post("/auth/verify-otp", payload);
      let { token, user: u } = res.data.data;
      await login(token, u);
      try {
        const fName = firstName.trim();
        const lName = lastName.trim();
        const profileRes = await api.put("/auth/profile", { name: fName, lastName: lName });
        token = profileRes.data.data?.token || token;
        u = profileRes.data.data?.user || { ...u, name: fName, lastName: lName };
        await login(token, u);
      } catch (profileErr) {
        setError(profileErr.response?.data?.message || t(lang, "otp_errorNameUpdateFailed"));
        setLoading(false);
        return;
      }
      onAuthed(u);
    } catch (err) {
      const status = err.response?.status;
      setError(status === 404 ? t(lang, "otp_errorCodeExpired") : (err.response?.data?.message || t(lang, "authForm_errorWrongCode")));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSend = async () => {
    setError("");
    if (method === "phone") {
      if (!isValidAzPhone(fpIdentifier)) return setError(t(lang, "authForm_errorPhone"));
    } else if (!isValidEmail(fpIdentifier.trim())) {
      return setError(t(lang, "authForm_errorEmail"));
    }
    setLoading(true);
    try {
      const identifier = method === "phone" ? toE164(fpIdentifier) : fpIdentifier.trim().toLowerCase();
      await api.post("/auth/forgot-password", method === "phone" ? { phone: identifier } : { email: identifier });
      setFpIdentifier(identifier);
      setFpStep("otp");
    } catch (err) {
      const status = err.response?.status;
      setError(status === 404
        ? t(lang, method === "phone" ? "forgotPw_errorPhoneNotFound" : "forgotPw_errorEmailNotFound")
        : (err.response?.data?.message || t(lang, "authForm_errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    setError("");
    if (fpOtp.length < 4) return setError(t(lang, "otp_errorCodeIncomplete"));
    setLoading(true);
    try {
      const payload = method === "phone" ? { phone: fpIdentifier, code: fpOtp } : { email: fpIdentifier, code: fpOtp };
      await api.post("/auth/verify-forgot-otp", payload);
      setFpStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "forgotPw_errorOtpWrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async () => {
    setError("");
    if (!fpNewPassword || fpNewPassword.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));
    if (fpNewPassword !== fpConfirmPassword) return setError(t(lang, "forgotPw_errorPasswordsMismatch"));
    setLoading(true);
    try {
      const payload = method === "phone"
        ? { phone: fpIdentifier, code: fpOtp, newPassword: fpNewPassword }
        : { email: fpIdentifier, code: fpOtp, newPassword: fpNewPassword };
      const res = await api.post("/auth/reset-password", payload);
      const { token, user } = res.data.data;
      await login(token, user);
      onAuthed(user);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "forgotPw_errorResetFailed"));
    } finally {
      setLoading(false);
    }
  };

  const MethodToggle = ({ value, onChange }) => (
    <View style={{ flexDirection: "row", gap: scale(8) }}>
      <Pressable style={[styles.methodBtn, value === "phone" && styles.methodBtnActive]} onPress={() => onChange("phone")}>
        <Phone size={13} color={value === "phone" ? PURPLE_MID : "#8a7ba7"} />
        <Text style={[styles.methodText, value === "phone" && { color: PURPLE_MID }]}>{t(lang, "authForm_phoneTab")}</Text>
      </Pressable>
      <Pressable style={[styles.methodBtn, value === "email" && styles.methodBtnActive]} onPress={() => onChange("email")}>
        <Mail size={13} color={value === "email" ? PURPLE_MID : "#8a7ba7"} />
        <Text style={[styles.methodText, value === "email" && { color: PURPLE_MID }]}>{t(lang, "authForm_emailTab")}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: scale(10) }}>
      <Pressable style={styles.backRow} onPress={mode === "forgot" ? () => switchMode("login") : onBack}>
        <ChevronLeft size={15} color="#8a7ba7" />
        <Text style={styles.backText}>{t(lang, "backBtn")}</Text>
      </Pressable>

      {mode !== "forgot" && (
        <>
          <View style={styles.tabsRow}>
            <Pressable style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]} onPress={() => switchMode("login")}>
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>{t(lang, "authForm_loginButton")}</Text>
            </Pressable>
            <Pressable style={[styles.tabBtn, mode === "register" && styles.tabBtnActive]} onPress={() => switchMode("register")}>
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>{t(lang, "register_title")}</Text>
            </Pressable>
          </View>
          <MethodToggle value={method} onChange={(m) => { setMethod(m); setError(""); }} />
        </>
      )}

      {mode === "login" && (
        <View style={{ gap: scale(8) }}>
          {method === "phone" ? (
            <>
              <TextInput style={styles.textInput} value={phone} onChangeText={(v) => { setPhone(formatPhone(v)); setError(""); }} placeholder="50 000 00 00" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
              {phoneOperatorInvalid && <Text style={styles.errorHint}>{t(lang, "donateModal_invalidOperator")}</Text>}
            </>
          ) : (
            <TextInput style={styles.textInput} value={email} onChangeText={(v) => { setEmail(v); setError(""); }} placeholder="ad@meatbox.az" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" />
          )}
          <View style={styles.passwordRow}>
            <TextInput style={styles.passwordInput} value={password} onChangeText={(v) => { setPassword(v); setError(""); }} placeholder={t(lang, "authForm_passwordPlaceholder")} placeholderTextColor="#9ca3af" secureTextEntry={!showPassword} />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={17} color="#9ca3af" /> : <Eye size={17} color="#9ca3af" />}
            </Pressable>
          </View>
          <Pressable style={styles.forgotLink} onPress={() => switchMode("forgot")}>
            <Text style={styles.forgotLinkText}>{t(lang, "login_forgotPassword")}</Text>
          </Pressable>
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
          <Pressable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{t(lang, "authForm_loginButton")}</Text>}
          </Pressable>
        </View>
      )}

      {mode === "register" && !otpSent && (
        <View style={{ gap: scale(8) }}>
          <View style={{ flexDirection: "row", gap: scale(8) }}>
            <TextInput style={[styles.textInput, { flex: 1 }]} value={firstName} onChangeText={(v) => { setFirstName(v); setError(""); }} placeholder={t(lang, "otp_firstNamePlaceholder")} placeholderTextColor="#9ca3af" autoCapitalize="words" />
            <TextInput style={[styles.textInput, { flex: 1 }]} value={lastName} onChangeText={(v) => { setLastName(v); setError(""); }} placeholder={t(lang, "otp_lastNamePlaceholder")} placeholderTextColor="#9ca3af" autoCapitalize="words" />
          </View>
          {method === "phone" ? (
            <>
              <TextInput style={styles.textInput} value={phone} onChangeText={(v) => { setPhone(formatPhone(v)); setError(""); }} placeholder="50 000 00 00" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
              {phoneOperatorInvalid && <Text style={styles.errorHint}>{t(lang, "donateModal_invalidOperator")}</Text>}
            </>
          ) : (
            <TextInput style={styles.textInput} value={email} onChangeText={(v) => { setEmail(v); setError(""); }} placeholder="ad@meatbox.az" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" />
          )}
          <View style={styles.passwordRow}>
            <TextInput style={styles.passwordInput} value={password} onChangeText={(v) => { setPassword(v); setError(""); }} placeholder={t(lang, "authForm_passwordMinPlaceholder")} placeholderTextColor="#9ca3af" secureTextEntry={!showPassword} />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={17} color="#9ca3af" /> : <Eye size={17} color="#9ca3af" />}
            </Pressable>
          </View>
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
          <Pressable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{t(lang, "register_sendCode")}</Text>}
          </Pressable>
        </View>
      )}

      {mode === "register" && otpSent && (
        <View style={{ gap: scale(8) }}>
          <View style={styles.otpHintBox}>
            <Text style={styles.otpHintText}>
              {t(lang, "authForm_otpHintTemplate").replace("{target}", method === "phone" ? toE164(phone) : email.trim())}
            </Text>
            <Pressable onPress={() => { setOtpSent(false); setOtp(""); setError(""); }}>
              <Text style={styles.otpChangeLink}>{method === "phone" ? t(lang, "otp_changePhoneLink") : t(lang, "otp_changeEmailLink")}</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={(v) => { setOtp(v.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            keyboardType="number-pad"
            placeholder="••••"
            placeholderTextColor="#c4b5e0"
            maxLength={4}
          />
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
          <Pressable style={[styles.submitBtn, (loading || otp.length < 4) && { opacity: 0.6 }]} onPress={handleVerifyOtp} disabled={loading || otp.length < 4}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{t(lang, "authForm_verifyButton")}</Text>}
          </Pressable>
        </View>
      )}

      {mode === "forgot" && (
        <View style={{ gap: scale(8) }}>
          <Text style={styles.forgotTitle}>{t(lang, "forgotPw_title")}</Text>

          {fpStep === "identifier" && (
            <>
              <MethodToggle value={method} onChange={(m) => { setMethod(m); setFpIdentifier(""); setError(""); }} />
              {method === "phone" ? (
                <>
                  <TextInput style={styles.textInput} value={fpIdentifier} onChangeText={(v) => { setFpIdentifier(formatPhone(v)); setError(""); }} placeholder="50 000 00 00" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
                  {fpOperatorInvalid && <Text style={styles.errorHint}>{t(lang, "donateModal_invalidOperator")}</Text>}
                </>
              ) : (
                <TextInput style={styles.textInput} value={fpIdentifier} onChangeText={(v) => { setFpIdentifier(v); setError(""); }} placeholder="ad@meatbox.az" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" />
              )}
              {!!error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}
              <Pressable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleForgotSend} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{t(lang, "forgotPw_sendCode")}</Text>}
              </Pressable>
            </>
          )}

          {fpStep === "otp" && (
            <>
              <View style={styles.otpHintBox}>
                <Text style={styles.otpHintText}>
                  {t(lang, "authForm_otpHintTemplate").replace("{target}", fpIdentifier)}
                </Text>
              </View>
              <TextInput
                style={styles.otpInput}
                value={fpOtp}
                onChangeText={(v) => { setFpOtp(v.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                keyboardType="number-pad"
                placeholder="••••"
                placeholderTextColor="#c4b5e0"
                maxLength={4}
              />
              {!!error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}
              <Pressable style={[styles.submitBtn, (loading || fpOtp.length < 4) && { opacity: 0.6 }]} onPress={handleForgotVerify} disabled={loading || fpOtp.length < 4}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{t(lang, "forgotPw_continueBtn")}</Text>}
              </Pressable>
            </>
          )}

          {fpStep === "reset" && (
            <>
              <View style={styles.passwordRow}>
                <TextInput style={styles.passwordInput} value={fpNewPassword} onChangeText={(v) => { setFpNewPassword(v); setError(""); }} placeholder={t(lang, "authForm_passwordMinPlaceholder")} placeholderTextColor="#9ca3af" secureTextEntry={!showPassword} />
                <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={17} color="#9ca3af" /> : <Eye size={17} color="#9ca3af" />}
                </Pressable>
              </View>
              <TextInput style={styles.textInput} value={fpConfirmPassword} onChangeText={(v) => { setFpConfirmPassword(v); setError(""); }} placeholder={t(lang, "forgotPw_confirmPasswordPlaceholder")} placeholderTextColor="#9ca3af" secureTextEntry={!showPassword} />
              {!!error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}
              <Pressable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleForgotReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>{t(lang, "forgotPw_updateBtn")}</Text>}
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: scale(4), alignSelf: "flex-start" },
  backText: { fontSize: scaleFont(13), fontWeight: "700", color: "#8a7ba7" },
  tabsRow: { flexDirection: "row", gap: scale(4), backgroundColor: "#f0ecff", borderRadius: scale(14), padding: scale(4) },
  tabBtn: { flex: 1, borderRadius: scale(10), alignItems: "center", paddingVertical: scale(9) },
  tabBtnActive: { backgroundColor: "#fff" },
  tabText: { fontSize: scaleFont(14), fontWeight: "700", color: "#8a7ba7" },
  tabTextActive: { color: PURPLE_MID },
  methodBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), borderRadius: scale(10), borderWidth: 2, borderColor: "#f3e8ff", paddingVertical: scale(9) },
  methodBtnActive: { borderColor: PURPLE_MID, backgroundColor: "#f5f3ff" },
  methodText: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#8a7ba7" },
  textInput: { borderRadius: scale(10), borderWidth: 1, borderColor: "#e8e4f4", backgroundColor: "#f8f6ff", paddingHorizontal: scale(14), paddingVertical: scale(12), fontSize: scaleFont(15), color: DARK },
  errorHint: { fontSize: scaleFont(12.5), color: "#e11d48", marginTop: -scale(2) },
  passwordRow: { flexDirection: "row", alignItems: "center", borderRadius: scale(10), borderWidth: 1, borderColor: "#e8e4f4", backgroundColor: "#f8f6ff", paddingRight: scale(10) },
  passwordInput: { flex: 1, paddingHorizontal: scale(14), paddingVertical: scale(12), fontSize: scaleFont(15), color: DARK },
  eyeBtn: { padding: scale(4) },
  forgotLink: { alignSelf: "flex-end" },
  forgotLinkText: { fontSize: scaleFont(12.5), fontWeight: "700", color: PURPLE_MID },
  forgotTitle: { fontSize: scaleFont(15.5), fontWeight: "800", color: DARK },
  otpHintBox: { borderRadius: scale(12), borderWidth: 1, borderColor: "#e9d9ff", backgroundColor: "rgba(243,232,255,0.4)", padding: scale(11), gap: scale(4) },
  otpHintText: { fontSize: scaleFont(12.5), color: "#7c6fa0" },
  otpChangeLink: { fontSize: scaleFont(12.5), fontWeight: "700", color: PURPLE_MID },
  otpInput: { borderRadius: scale(12), borderWidth: 2, borderColor: "#e8e4f4", backgroundColor: "#f8f6ff", paddingVertical: scale(14), fontSize: scaleFont(22), fontWeight: "800", textAlign: "center", letterSpacing: scale(10), color: DARK },
  errorBanner: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(12) },
  errorBannerText: { fontSize: scaleFont(14), fontWeight: "700", color: "#dc2626" },
  submitBtn: { borderRadius: scale(12), alignItems: "center", justifyContent: "center", paddingVertical: scale(14), backgroundColor: PURPLE_MID },
  submitBtnText: { fontSize: scaleFont(15.5), fontWeight: "800", color: "#fff" },
});
