import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { formatPhone, toE164 } from "../lib/format";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const AZ_OPERATORS = ["010", "020", "040", "050", "051", "055", "060", "070", "077", "099"];
const isValidAzPhone9 = (d) => d.length === 9 && AZ_OPERATORS.includes("0" + d.slice(0, 2));

// Web-dəki /order/contact səhifəsinin mobil qarşılığı — "Daxil ol" / "Yeni
// hesab" tab-ları ilə, sifariş axınının İÇİNDƏ (ayrıca Login ekranına
// atmadan) qonaqdan əlaqə məlumatı toplayır. Uğurlu olanda `onSuccess`
// çağırılır, halbuki `useAuth().login()` artıq çağırılmış olur.
export default function OrderContactForm({ accentColor = "#1c5e20", onSuccess }) {
  const { lang } = useLanguage();
  const { login } = useAuth();
  const [mode, setMode] = useState("register"); // "login" | "register" | "forgot"

  // Login
  const [loginIdMode, setLoginIdMode] = useState("phone");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password
  const [fpStep, setFpStep] = useState("identifier"); // "identifier" | "otp" | "reset"
  const [fpMethod, setFpMethod] = useState("phone");
  const [fpIdentifier, setFpIdentifier] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showFpPassword, setShowFpPassword] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  // Register
  const [verifyMethod, setVerifyMethod] = useState("sms"); // "sms" | "email"
  const [step, setStep] = useState("info"); // "info" | "otp"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef([]);

  const [error, setError] = useState("");

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const handleLogin = async () => {
    setError("");
    if (loginIdMode === "phone") {
      const digits = loginIdentifier.replace(/\D/g, "");
      if (!isValidAzPhone9(digits.length === 10 ? digits.slice(1) : digits)) {
        setError(t(lang, "authForm_errorPhone"));
        return;
      }
    } else if (!loginIdentifier.trim().includes("@")) {
      setError(t(lang, "authForm_errorEmail"));
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setError(t(lang, "authForm_errorPasswordShort"));
      return;
    }
    setLoginLoading(true);
    try {
      const body = { password: loginPassword };
      if (loginIdMode === "phone") body.phone = toE164(loginIdentifier);
      else body.email = loginIdentifier.trim().toLowerCase();
      const res = await api.post("/auth/login-password", body);
      const { token, user } = res.data.data;
      await login(token, user);
      onSuccess?.(user, token);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "authForm_errorGeneric"));
    } finally {
      setLoginLoading(false);
    }
  };

  const switchToForgot = () => {
    setMode("forgot");
    setFpStep("identifier");
    setFpMethod(loginIdMode);
    setFpIdentifier("");
    setFpOtp("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setError("");
  };

  const handleForgotSend = async () => {
    setError("");
    if (fpMethod === "phone") {
      const digits = fpIdentifier.replace(/\D/g, "");
      if (!isValidAzPhone9(digits.length === 10 ? digits.slice(1) : digits)) {
        setError(t(lang, "authForm_errorPhone"));
        return;
      }
    } else if (!fpIdentifier.trim().includes("@")) {
      setError(t(lang, "authForm_errorEmail"));
      return;
    }
    setFpLoading(true);
    try {
      const identifier = fpMethod === "phone" ? toE164(fpIdentifier) : fpIdentifier.trim().toLowerCase();
      await api.post("/auth/forgot-password", fpMethod === "phone" ? { phone: identifier } : { email: identifier });
      setFpIdentifier(identifier);
      setFpStep("otp");
    } catch (err) {
      const status = err.response?.status;
      setError(status === 404
        ? t(lang, fpMethod === "phone" ? "forgotPw_errorPhoneNotFound" : "forgotPw_errorEmailNotFound")
        : (err.response?.data?.message || t(lang, "authForm_errorGeneric")));
    } finally {
      setFpLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    setError("");
    if (fpOtp.length < 4) return setError(t(lang, "otp_errorCodeIncomplete"));
    setFpLoading(true);
    try {
      const payload = fpMethod === "phone" ? { phone: fpIdentifier, code: fpOtp } : { email: fpIdentifier, code: fpOtp };
      await api.post("/auth/verify-forgot-otp", payload);
      setFpStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "forgotPw_errorOtpWrong"));
    } finally {
      setFpLoading(false);
    }
  };

  const handleForgotReset = async () => {
    setError("");
    if (!fpNewPassword || fpNewPassword.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));
    if (fpNewPassword !== fpConfirmPassword) return setError(t(lang, "forgotPw_errorPasswordsMismatch"));
    setFpLoading(true);
    try {
      const payload = fpMethod === "phone"
        ? { phone: fpIdentifier, code: fpOtp, newPassword: fpNewPassword }
        : { email: fpIdentifier, code: fpOtp, newPassword: fpNewPassword };
      const res = await api.post("/auth/reset-password", payload);
      const { token, user } = res.data.data;
      await login(token, user);
      onSuccess?.(user, token);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "forgotPw_errorResetFailed"));
    } finally {
      setFpLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    if (firstName.trim().length < 2) return setError(t(lang, "authForm_errorFirstNameShort"));
    if (lastName.trim().length < 2) return setError(t(lang, "authForm_errorLastNameShort"));
    if (!password || password.length < 6) return setError(t(lang, "authForm_errorPasswordShort"));

    setSending(true);
    try {
      if (verifyMethod === "sms") {
        const digits = phone.replace(/\D/g, "");
        if (!isValidAzPhone9(digits.length === 10 ? digits.slice(1) : digits)) {
          setError(t(lang, "authForm_errorPhone"));
          setSending(false);
          return;
        }
        const norm = toE164(phone);
        await api.post("/auth/send-otp", { phone: norm, isRegister: true });
        setNormalizedPhone(norm);
      } else {
        const em = email.trim().toLowerCase();
        if (!em.includes("@")) {
          setError(t(lang, "authForm_errorEmail"));
          setSending(false);
          return;
        }
        await api.post("/auth/send-otp", { email: em, isRegister: true });
      }
      setCode(["", "", "", ""]);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 250);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      setError(
        status === 409
          ? msg || t(lang, "authForm_errorAccountExists")
          : msg || t(lang, "authForm_errorOtpSendFailed"),
      );
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
    if (digit && i < 3) otpRefs.current[i + 1]?.focus();
    if (digit && i === 3) handleVerify(next.join(""));
  };

  const handleVerify = async (fullCode) => {
    const otp = fullCode || code.join("");
    if (otp.length < 4) return;
    setVerifying(true);
    setError("");
    try {
      const payload =
        verifyMethod === "sms"
          ? { phone: normalizedPhone, code: otp, password }
          : { email: email.trim().toLowerCase(), code: otp, password };
      const res = await api.post("/auth/verify-otp", payload);
      let { token, user } = res.data.data;
      await login(token, user);

      try {
        const profileRes = await api.put("/auth/profile", {
          name: firstName.trim(),
          lastName: lastName.trim(),
        });
        token = profileRes.data.data?.token || token;
        user = profileRes.data.data?.user || { ...user, name: firstName.trim(), lastName: lastName.trim() };
        await login(token, user);
      } catch {
        // Profil yenilənməsə belə hesab yaradılıb — davam edirik.
      }

      onSuccess?.(user, token);
    } catch (err) {
      const status = err.response?.status;
      setError(
        !status || status >= 500
          ? t(lang, "authForm_errorServiceUnavailable")
          : err.response?.data?.message || t(lang, "authForm_errorWrongCode"),
      );
      setCode(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t(lang, "authForm_title")}</Text>

      {mode !== "forgot" && (
        <View style={styles.tabRow}>
          {[
            { k: "login", label: t(lang, "authForm_loginTab") },
            { k: "register", label: t(lang, "authForm_registerTab") },
          ].map(({ k, label }) => (
            <Pressable
              key={k}
              style={[styles.tabBtn, mode === k && { backgroundColor: accentColor }]}
              onPress={() => switchMode(k)}
            >
              <Text style={[styles.tabText, mode === k && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {mode === "login" ? (
        <View style={{ gap: scale(12) }}>
          <View style={styles.subTabRow}>
            {[
              { k: "phone", label: t(lang, "authForm_phoneTab") },
              { k: "email", label: t(lang, "authForm_emailTab") },
            ].map(({ k, label }) => (
              <Pressable
                key={k}
                style={[styles.subTabBtn, loginIdMode === k && { borderBottomColor: accentColor }]}
                onPress={() => {
                  setLoginIdMode(k);
                  setLoginIdentifier("");
                  setError("");
                }}
              >
                <Text style={[styles.subTabText, loginIdMode === k && { color: accentColor }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {loginIdMode === "phone" ? (
            <View>
              <Text style={styles.label}>{t(lang, "authForm_mobileLabel")}</Text>
              <View style={styles.inputBox}>
                <Text style={styles.phonePrefix}>+994</Text>
                <TextInput
                  style={styles.input}
                  value={loginIdentifier}
                  keyboardType="number-pad"
                  placeholder="50 123 45 67"
                  placeholderTextColor="#9ca3af"
                  maxLength={12}
                  onChangeText={(v) => setLoginIdentifier(formatPhone(v))}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>{t(lang, "authForm_emailLabel")}</Text>
              <TextInput
                style={styles.plainInput}
                value={loginIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="ad@meatbox.az"
                placeholderTextColor="#9ca3af"
                onChangeText={setLoginIdentifier}
              />
            </View>
          )}

          <View>
            <Text style={styles.label}>{t(lang, "authForm_passwordLabel")}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={loginPassword}
                secureTextEntry={!showLoginPassword}
                placeholder={t(lang, "authForm_passwordPlaceholder")}
                placeholderTextColor="#9ca3af"
                onChangeText={setLoginPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowLoginPassword((v) => !v)}>
                {showLoginPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.forgotLink} onPress={switchToForgot}>
            <Text style={[styles.forgotLinkText, { color: accentColor }]}>{t(lang, "login_forgotPassword")}</Text>
          </Pressable>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: accentColor }, loginLoading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t(lang, "authForm_loginButton")}</Text>}
          </Pressable>
        </View>
      ) : mode === "forgot" ? (
        <View style={{ gap: scale(12) }}>
          <Pressable style={styles.linkBtn} onPress={() => { setMode("login"); setError(""); }}>
            <Text style={styles.linkText}>{t(lang, "authForm_changeInfoLink")}</Text>
          </Pressable>

          {fpStep === "identifier" && (
            <>
              <View style={styles.subTabRow}>
                {[
                  { k: "phone", label: t(lang, "authForm_phoneTab") },
                  { k: "email", label: t(lang, "authForm_emailTab") },
                ].map(({ k, label }) => (
                  <Pressable
                    key={k}
                    style={[styles.subTabBtn, fpMethod === k && { borderBottomColor: accentColor }]}
                    onPress={() => { setFpMethod(k); setFpIdentifier(""); setError(""); }}
                  >
                    <Text style={[styles.subTabText, fpMethod === k && { color: accentColor }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              {fpMethod === "phone" ? (
                <View>
                  <Text style={styles.label}>{t(lang, "authForm_mobileLabel")}</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.phonePrefix}>+994</Text>
                    <TextInput
                      style={styles.input}
                      value={fpIdentifier}
                      keyboardType="number-pad"
                      placeholder="50 123 45 67"
                      placeholderTextColor="#9ca3af"
                      maxLength={12}
                      onChangeText={(v) => setFpIdentifier(formatPhone(v))}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>{t(lang, "authForm_emailLabel")}</Text>
                  <TextInput
                    style={styles.plainInput}
                    value={fpIdentifier}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="ad@meatbox.az"
                    placeholderTextColor="#9ca3af"
                    onChangeText={setFpIdentifier}
                  />
                </View>
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: accentColor }, fpLoading && { opacity: 0.6 }]}
                onPress={handleForgotSend}
                disabled={fpLoading}
              >
                {fpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t(lang, "forgotPw_sendCode")}</Text>}
              </Pressable>
            </>
          )}

          {fpStep === "otp" && (
            <>
              <Text style={styles.otpHint}>
                {t(lang, "authForm_otpHintTemplate").replace("{target}", fpIdentifier)}
              </Text>
              <TextInput
                style={styles.otpInput}
                value={fpOtp}
                onChangeText={(v) => { setFpOtp(v.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                keyboardType="number-pad"
                placeholder="••••"
                placeholderTextColor="#9ca3af"
                maxLength={4}
              />
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: accentColor }, (fpLoading || fpOtp.length < 4) && { opacity: 0.6 }]}
                onPress={handleForgotVerify}
                disabled={fpLoading || fpOtp.length < 4}
              >
                {fpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t(lang, "forgotPw_continueBtn")}</Text>}
              </Pressable>
            </>
          )}

          {fpStep === "reset" && (
            <>
              <View>
                <Text style={styles.label}>{t(lang, "forgotPw_newPasswordLabel")}</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={fpNewPassword}
                    secureTextEntry={!showFpPassword}
                    placeholder={t(lang, "authForm_passwordMinPlaceholder")}
                    placeholderTextColor="#9ca3af"
                    onChangeText={setFpNewPassword}
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowFpPassword((v) => !v)}>
                    {showFpPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
                  </Pressable>
                </View>
              </View>
              <View>
                <Text style={styles.label}>{t(lang, "forgotPw_confirmPasswordLabel")}</Text>
                <TextInput
                  style={styles.plainInput}
                  value={fpConfirmPassword}
                  secureTextEntry={!showFpPassword}
                  placeholder={t(lang, "forgotPw_confirmPasswordPlaceholder")}
                  placeholderTextColor="#9ca3af"
                  onChangeText={setFpConfirmPassword}
                />
              </View>
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: accentColor }, fpLoading && { opacity: 0.6 }]}
                onPress={handleForgotReset}
                disabled={fpLoading}
              >
                {fpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t(lang, "forgotPw_updateBtn")}</Text>}
              </Pressable>
            </>
          )}
        </View>
      ) : step === "info" ? (
        <View style={{ gap: scale(12) }}>
          <View style={styles.subTabRow}>
            {[
              { k: "sms", label: t(lang, "authForm_smsTab") },
              { k: "email", label: t(lang, "authForm_emailTab") },
            ].map(({ k, label }) => (
              <Pressable
                key={k}
                style={[styles.subTabBtn, verifyMethod === k && { borderBottomColor: accentColor }]}
                onPress={() => {
                  setVerifyMethod(k);
                  setError("");
                }}
              >
                <Text style={[styles.subTabText, verifyMethod === k && { color: accentColor }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t(lang, "authForm_nameLabel")}</Text>
              <TextInput
                style={styles.plainInput}
                value={firstName}
                autoCapitalize="words"
                placeholder={t(lang, "authForm_nameLabel")}
                placeholderTextColor="#9ca3af"
                onChangeText={setFirstName}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t(lang, "authForm_surnameLabel")}</Text>
              <TextInput
                style={styles.plainInput}
                value={lastName}
                autoCapitalize="words"
                placeholder={t(lang, "authForm_surnameLabel")}
                placeholderTextColor="#9ca3af"
                onChangeText={setLastName}
              />
            </View>
          </View>

          {verifyMethod === "sms" ? (
            <View>
              <Text style={styles.label}>{t(lang, "authForm_mobileLabel")}</Text>
              <View style={styles.inputBox}>
                <Text style={styles.phonePrefix}>+994</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  keyboardType="number-pad"
                  placeholder="50 123 45 67"
                  placeholderTextColor="#9ca3af"
                  maxLength={12}
                  onChangeText={(v) => setPhone(formatPhone(v))}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>{t(lang, "authForm_emailLabel")}</Text>
              <TextInput
                style={styles.plainInput}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="ad@meatbox.az"
                placeholderTextColor="#9ca3af"
                onChangeText={setEmail}
              />
            </View>
          )}

          <View>
            <Text style={styles.label}>{t(lang, "authForm_passwordRequiredLabel")}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={password}
                secureTextEntry={!showPassword}
                placeholder={t(lang, "authForm_passwordMinPlaceholder")}
                placeholderTextColor="#9ca3af"
                onChangeText={setPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
              </Pressable>
            </View>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: accentColor }, sending && { opacity: 0.6 }]}
            onPress={handleSendOtp}
            disabled={sending}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t(lang, "continue")}</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: scale(14) }}>
          <Text style={styles.otpHint}>
            {t(lang, "authForm_otpHintTemplate").replace(
              "{target}",
              verifyMethod === "sms" ? normalizedPhone : email.trim(),
            )}
          </Text>
          <View style={styles.otpRow}>
            {code.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                style={[styles.otpBox, d && { borderColor: accentColor, backgroundColor: accentColor + "10" }]}
                value={d}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(v) => handleOtpChange(i, v)}
              />
            ))}
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: accentColor }, verifying && { opacity: 0.6 }]}
            onPress={() => handleVerify()}
            disabled={verifying || code.join("").length < 4}
          >
            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t(lang, "authForm_verifyButton")}</Text>}
          </Pressable>

          <Pressable style={styles.linkBtn} onPress={() => setStep("info")}>
            <Text style={styles.linkText}>{t(lang, "authForm_changeInfoLink")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: scale(14),
    gap: scale(14),
  },
  cardTitle: { fontSize: scaleFont(19), fontWeight: "900", color: "#111827", textAlign: "center" },

  tabRow: { flexDirection: "row", gap: scale(6), backgroundColor: "#f5f5f4", borderRadius: scale(12), padding: scale(4) },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: scale(11), borderRadius: scale(9) },
  tabText: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#57534e" },
  tabTextActive: { color: "#fff" },

  subTabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  subTabBtn: { flex: 1, alignItems: "center", paddingVertical: scale(10), borderBottomWidth: 2, borderBottomColor: "transparent" },
  subTabText: { fontSize: scaleFont(13), fontWeight: "700", color: "#9ca3af" },

  row2: { flexDirection: "row", gap: scale(10) },

  label: { marginBottom: scale(6), fontSize: scaleFont(12.5), fontWeight: "700", color: "#374151" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(48),
    borderRadius: scale(12),
    backgroundColor: "#f4f4f6",
    overflow: "hidden",
  },
  phonePrefix: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#57534e", paddingHorizontal: scale(12) },
  input: { flex: 1, height: "100%", paddingHorizontal: scale(6), fontSize: scaleFont(14.5), color: "#374151" },
  plainInput: { height: scale(48), borderRadius: scale(12), backgroundColor: "#f4f4f6", paddingHorizontal: scale(14), fontSize: scaleFont(14.5), color: "#374151" },
  eyeBtn: { paddingHorizontal: scale(12), height: "100%", justifyContent: "center" },

  errorBox: { backgroundColor: "#FEF2F2", borderRadius: scale(10), paddingVertical: scale(10), paddingHorizontal: scale(12) },
  errorText: { color: "#B91C1C", fontSize: scaleFont(12.5), fontWeight: "600" },

  primaryBtn: { height: scale(50), borderRadius: scale(12), alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "800" },

  otpHint: { fontSize: scaleFont(12.5), color: "#6b7280", lineHeight: moderateScale(17) },
  otpRow: { flexDirection: "row", gap: scale(8), justifyContent: "center" },
  otpBox: {
    width: scale(52),
    height: scale(56),
    textAlign: "center",
    fontSize: scaleFont(19),
    fontWeight: "700",
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  linkBtn: { alignItems: "center" },
  linkText: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#6b7280" },
  forgotLink: { alignSelf: "flex-end" },
  forgotLinkText: { fontSize: scaleFont(12.5), fontWeight: "700" },
  otpInput: {
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingVertical: scale(14),
    fontSize: scaleFont(20),
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: scale(10),
    color: "#111827",
  },
});
