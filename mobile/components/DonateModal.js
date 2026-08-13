import { useEffect, useState } from "react";
import { View, Text, Image, TextInput, Pressable, ScrollView, ActivityIndicator, Switch, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Shield } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { formatPhone, toE164, isValidAzPhone, AZ_OPERATORS } from "../lib/phone";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import InlineAuth from "./InlineAuth";

const PURPLE_MID = "#5b21b6";
const DARK = "#241a4d";
const AZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

function userFullName(user, lang) {
  return [user?.name, user?.lastName].filter(Boolean).join(" ").trim() || t(lang, "donateModal_defaultUser");
}
function initials2(name) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${AZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}
function isResultUrl(u) {
  if (!u) return false;
  const low = u.toLowerCase();
  if (low.includes("epoint") || low.includes("pashabank") || low.includes("/api/")) return false;
  return low.includes("payment=success") || low.includes("payment=fail") || low.includes("campaign-result");
}
function isSuccessUrl(u) {
  return u.toLowerCase().includes("payment=success");
}

export default function DonateModal({ visible, campaign, onClose, onSuccess }) {
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const STEPS = [t(lang, "donateModal_stepAmount"), t(lang, "donateModal_stepConfirm")];

  const [step, setStep] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [minDon, setMinDon] = useState(10);
  const [nearlyFullPercent, setNearlyFullPercent] = useState(90);
  const [nearlyFullMinDonation, setNearlyFullMinDonation] = useState(1);
  const [amount, setAmount] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [contMode, setContMode] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState(null);

  const [authPhase, setAuthPhase] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setAmount("");
    setIsAnon(false);
    setContMode("");
    setGuestFirstName("");
    setGuestLastName("");
    setGuestPhone("");
    setError("");
    setPayUrl(null);
    setLoadingSettings(true);
    setAuthPhase(false);

    api.get("/campaigns/settings")
      .then((res) => {
        const s = res.data?.data?.settings || {};
        const minDonation = s.minDonation || 10;
        const nfPercent = s.nearlyFullPercent || 90;
        const nfMinDonation = s.nearlyFullMinDonation || 1;
        setMinDon(minDonation);
        setNearlyFullPercent(nfPercent);
        setNearlyFullMinDonation(nfMinDonation);

        const remaining = campaign?.remainingAmount ?? Math.max(0, (campaign?.totalAmount || 0) - (campaign?.collectedAmount || 0));
        const completionPct = campaign?.totalAmount > 0 ? (campaign.collectedAmount / campaign.totalAmount) * 100 : 0;
        const isNearlyFull = completionPct >= nfPercent;
        const baseMin = isNearlyFull ? nfMinDonation : minDonation;
        const eMin = remaining < baseMin ? 0.01 : baseMin;
        setAmount(String(eMin));
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, [visible]);

  if (!visible || !campaign) return null;

  const animal = campaign.animal || {};
  const remaining = campaign.remainingAmount ?? Math.max(0, (campaign.totalAmount || 0) - (campaign.collectedAmount || 0));
  const completionPct = campaign.totalAmount > 0 ? (campaign.collectedAmount / campaign.totalAmount) * 100 : 0;
  const isNearlyFull = completionPct >= nearlyFullPercent;
  const baseMin = isNearlyFull ? nearlyFullMinDonation : minDon;
  // Qalan məbləğ minimum ianədən azdırsa, istifadəçini qalanın hamısını verməyə məcbur etmə —
  // ən kiçik pul vahidinə (0.01 AZN) qədər enməyə icazə ver.
  const effectiveMin = remaining < baseMin ? 0.01 : baseMin;
  const numAmount = Number(amount || 0);
  const validAmt = numAmount >= effectiveMin && numAmount <= remaining;
  const guestPhoneDigits = guestPhone.replace(/\D/g, "");
  const guestPhonePrefix = guestPhoneDigits.startsWith("0") ? guestPhoneDigits.slice(1, 3) : guestPhoneDigits.slice(0, 2);
  const guestPhoneOperatorInvalid = guestPhoneDigits.length >= 2 && !AZ_OPERATORS.includes(guestPhonePrefix);
  const finalValid = !isGuest || contMode === "registered" || (contMode === "guest" && guestFirstName.trim() && guestLastName.trim() && isValidAzPhone(guestPhone));

  const goNext = () => {
    setError("");
    if (step === 0 && !validAmt) return;
    setStep(1);
  };
  const goBack = () => {
    setError("");
    setStep(0);
  };

  const handleWebViewNav = (navState) => {
    if (!isResultUrl(navState.url)) return;
    setPayUrl(null);
    if (isSuccessUrl(navState.url)) {
      let campaignId, role, amt;
      try {
        const qs = navState.url.split("?")[1] || "";
        const params = new URLSearchParams(qs);
        campaignId = params.get("campaignId") || campaign._id;
        role = params.get("role") || "donor";
        amt = params.get("amount") || String(numAmount);
      } catch (_) {}
      onClose();
      onSuccess?.({ campaignId, role, amount: amt });
    } else {
      setError(t(lang, "donateModal_paymentFailed"));
    }
  };

  const handleConfirm = async (overrideUser) => {
    if (!overrideUser) {
      if (!finalValid) return;
      if (isGuest && contMode === "registered") {
        setAuthPhase(true);
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      const isGuestMode = isGuest && contMode === "guest" && !overrideUser;
      const donorName = isGuestMode ? `${guestFirstName.trim()} ${guestLastName.trim()}`.trim() : userFullName(overrideUser || user, lang);
      const donorPhone = isGuestMode ? toE164(guestPhone) : undefined;
      const body = { amount: numAmount, donorName, donorPhone, isAnonymous: isAnon };
      const r1 = await api.post(`/campaigns/${campaign._id}/donate`, body);
      const { donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaign._id}/epoint/start`, { donationId });
      setPayUrl(r2.data.data.redirect_url);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "donateModal_genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthed = async (u) => {
    setAuthPhase(false);
    await handleConfirm(u);
  };

  if (payUrl) {
    return (
      <View style={styles.fullOverlay}>
        <View style={[styles.payHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.payCloseBtn} onPress={() => setPayUrl(null)}>
            <X size={22} color="#374151" />
          </Pressable>
          <Text style={styles.payTitle}>{t(lang, "collModal_payTitle")}</Text>
          <View style={{ width: scale(32) }} />
        </View>
        <WebView style={{ flex: 1 }} source={{ uri: payUrl }} onNavigationStateChange={handleWebViewNav} startInLoadingState />
      </View>
    );
  }

  return (
    <View style={styles.fullOverlay}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerImgWrap}>
          {animal.image ? (
            <Image source={{ uri: animal.image }} style={styles.headerImg} resizeMode="cover" />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{animal.nameAz} {t(lang, "collectiveConfirm_campaignSuffix")}</Text>
          <Text style={styles.headerSub}>
            {t(lang, "donateModal_minDonateTemplate").replace("{min}", effectiveMin)}
          </Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <X size={22} color="#8a7ba7" />
        </Pressable>
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]}>
              <Text style={[styles.stepDotText, i <= step && { color: "#fff" }]}>{i < step ? "✓" : i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && { color: PURPLE_MID, fontWeight: "800" }]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: scale(16), paddingBottom: insets.bottom + 16 }}>
        {loadingSettings ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: scale(40) }} />
        ) : (
          <>
            {step === 0 && (
              <View style={{ gap: scale(12) }}>
                <View>
                  <Text style={styles.label}>{t(lang, "collModal_amountLabel")}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder={String(effectiveMin)}
                  />
                  <Text style={[styles.hint, !validAmt && amount !== "" && { color: "#e11d48" }]}>
                    {t(lang, "donateModal_amountHintTemplate")
                      .replace("{min}", effectiveMin)
                      .replace("{max}", remaining)}
                  </Text>
                </View>
                <View style={styles.anonRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.anonTitle}>{t(lang, "collModal_anonDonateTitle")}</Text>
                    <Text style={styles.anonSub}>{t(lang, "collModal_anonSub")}</Text>
                  </View>
                  <Switch value={isAnon} onValueChange={setIsAnon} trackColor={{ true: PURPLE_MID }} />
                </View>

                <View style={styles.finalSummary}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(10) }}>
                    <Shield size={16} color={PURPLE_MID} />
                    <Text style={styles.accountBoxLabel}>{t(lang, "donateModal_campaignInfo")}</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, completionPct))}%` }]} />
                  </View>
                  <View style={styles.progressLabelsRow}>
                    <Text style={styles.progressCollectedText}>
                      {t(lang, "donateModal_collectedTemplate")
                        .replace("{amount}", campaign.collectedAmount)
                        .replace("{pct}", Math.round(completionPct))}
                    </Text>
                    <Text style={styles.progressRemainingText}>
                      {t(lang, "donateModal_remainingTemplate")
                        .replace("{amount}", remaining)
                        .replace("{pct}", 100 - Math.round(completionPct))}
                    </Text>
                  </View>

                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>{t(lang, "donateModal_totalAmount")}</Text>
                    <Text style={styles.finalValue}>{campaign.totalAmount} AZN</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>{t(lang, "donateModal_opener")}</Text>
                    <Text style={styles.finalValue} numberOfLines={1}>
                      {campaign.opener?.isAnonymous ? t(lang, "collective_anonymous") : (campaign.opener?.name || t(lang, "collective_unknown"))}
                    </Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>{t(lang, "donateModal_openDate")}</Text>
                    <Text style={styles.finalValue}>{fmtDate(campaign.createdAt)}</Text>
                  </View>
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={{ gap: scale(12) }}>
                {authPhase ? (
                  <InlineAuth onBack={() => setAuthPhase(false)} onAuthed={handleAuthed} />
                ) : (
                  <>
                    {!isGuest ? (
                      <View style={styles.accountBox}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(8) }}>
                          <Shield size={16} color={PURPLE_MID} />
                          <Text style={styles.accountBoxLabel}>{t(lang, "donateModal_activeAccount")}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
                          <View style={styles.accountAvatar}>
                            <Text style={styles.accountAvatarText}>{initials2(userFullName(user, lang))}</Text>
                          </View>
                          <Text style={styles.accountName} numberOfLines={1}>{userFullName(user, lang)}</Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: "row", gap: scale(8) }}>
                          <Pressable style={[styles.contModeBtn, contMode === "registered" && styles.contModeBtnActive]} onPress={() => setContMode("registered")}>
                            <Text style={styles.contModeTitle}>{t(lang, "collModal_contModeRegisteredTitle")}</Text>
                            <Text style={styles.contModeSub}>{t(lang, "collModal_contModeRegisteredSub")}</Text>
                          </Pressable>
                          <Pressable style={[styles.contModeBtn, contMode === "guest" && styles.contModeBtnActive]} onPress={() => setContMode("guest")}>
                            <Text style={styles.contModeTitle}>{t(lang, "collModal_contModeGuestTitle")}</Text>
                            <Text style={styles.contModeSub}>{t(lang, "collModal_contModeGuestSub")}</Text>
                          </Pressable>
                        </View>
                        {contMode === "guest" && (
                          <View style={{ gap: scale(8) }}>
                            <View style={{ flexDirection: "row", gap: scale(8) }}>
                              <TextInput style={[styles.textInput, { flex: 1 }]} value={guestFirstName} onChangeText={setGuestFirstName} placeholder={t(lang, "otp_firstNamePlaceholder")} placeholderTextColor="#9ca3af" autoCapitalize="words" />
                              <TextInput style={[styles.textInput, { flex: 1 }]} value={guestLastName} onChangeText={setGuestLastName} placeholder={t(lang, "otp_lastNamePlaceholder")} placeholderTextColor="#9ca3af" autoCapitalize="words" />
                            </View>
                            <TextInput
                              style={styles.textInput}
                              value={guestPhone}
                              onChangeText={(v) => setGuestPhone(formatPhone(v))}
                              placeholder="50 000 00 00"
                              placeholderTextColor="#9ca3af"
                              keyboardType="phone-pad"
                            />
                            {guestPhoneOperatorInvalid && (
                              <Text style={styles.phoneErrorText}>{t(lang, "donateModal_invalidOperator")}</Text>
                            )}
                          </View>
                        )}
                      </>
                    )}

                    {isAnon && (
                      <View style={styles.anonNoteBox}>
                        <Text style={styles.anonNoteText}>{t(lang, "newOpening_anonNote")}</Text>
                      </View>
                    )}

                    <View style={styles.finalSummary}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(8) }}>
                        <Shield size={16} color={PURPLE_MID} />
                        <Text style={styles.accountBoxLabel}>{t(lang, "collModal_donateSummary")}</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "donateModal_animalLabel")}</Text>
                        <Text style={styles.finalValue}>{animal.nameAz}</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "collModal_finalDonateAmount")}</Text>
                        <Text style={styles.finalValue}>{numAmount.toLocaleString()} AZN</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "collective_anonymous")}</Text>
                        <Text style={styles.finalValue}>{isAnon ? t(lang, "yesLabel") : t(lang, "noLabel")}</Text>
                      </View>
                    </View>

                    {!!error && (
                      <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{error}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!loadingSettings && !authPhase && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {step > 0 && (
            <Pressable style={styles.backFooterBtn} onPress={goBack}>
              <Text style={styles.backFooterBtnText}>{t(lang, "backBtn")}</Text>
            </Pressable>
          )}
          {step === 0 ? (
            <Pressable style={[styles.nextBtn, !validAmt && { opacity: 0.5 }]} onPress={goNext} disabled={!validAmt}>
              <Text style={styles.nextBtnText}>{t(lang, "continue")}</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.nextBtn, (!finalValid || submitting) && { opacity: 0.5 }]} onPress={() => handleConfirm()} disabled={!finalValid || submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.nextBtnText}>{t(lang, "collModal_confirmDonateBtn")}</Text>}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 100 },

  header: { flexDirection: "row", alignItems: "center", gap: scale(11), paddingHorizontal: scale(16), paddingBottom: scale(12), borderBottomWidth: 1, borderBottomColor: "#ede9fe", backgroundColor: "#f5f3ff" },
  headerImgWrap: { width: scale(48), height: scale(48), borderRadius: scale(14), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "#fff", overflow: "hidden" },
  headerImg: { width: "100%", height: "100%" },
  headerTitle: { fontSize: scaleFont(17.5), fontWeight: "800", color: DARK },
  headerSub: { fontSize: scaleFont(13.5), color: "#8a7ba7", marginTop: scale(2) },
  closeBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,111,160,0.12)" },

  stepsRow: { flexDirection: "row", justifyContent: "center", gap: scale(18), paddingVertical: scale(12), borderBottomWidth: 1, borderBottomColor: "#f0ecff" },
  stepItem: { flexDirection: "row", alignItems: "center", gap: scale(7) },
  stepDot: { width: scale(24), height: scale(24), borderRadius: scale(12), backgroundColor: "#e8e4f4", alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: PURPLE_MID },
  stepDotDone: { backgroundColor: "#10b981" },
  stepDotText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#7c6fa0" },
  stepLabel: { fontSize: scaleFont(13.5), fontWeight: "600", color: "#7c6fa0" },

  label: { fontSize: scaleFont(15), fontWeight: "700", color: DARK, marginBottom: scale(9) },
  hint: { fontSize: scaleFont(13), color: "#7c6fa0", marginTop: scale(6), lineHeight: moderateScale(17) },
  amountInput: { borderRadius: scale(12), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: scale(15), paddingVertical: scale(12), fontSize: scaleFont(17), color: DARK },

  progressTrack: { height: scale(8), borderRadius: scale(999), backgroundColor: "#e6dcff", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: scale(999), backgroundColor: PURPLE_MID },
  progressLabelsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: scale(6), marginBottom: scale(10) },
  progressCollectedText: { fontSize: scaleFont(12), fontWeight: "700", color: PURPLE_MID },
  progressRemainingText: { fontSize: scaleFont(12), fontWeight: "700", color: "#059669" },

  anonRow: { flexDirection: "row", alignItems: "center", gap: scale(11), borderRadius: scale(12), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", padding: scale(14) },
  anonTitle: { fontSize: scaleFont(15.5), fontWeight: "700", color: DARK },
  anonSub: { fontSize: scaleFont(13.5), color: "#7c6fa0", marginTop: scale(1) },

  accountBox: { borderRadius: scale(14), borderWidth: 1, borderColor: "#e9d9ff", backgroundColor: "rgba(243,232,255,0.4)", padding: scale(12) },
  accountBoxLabel: { fontSize: scaleFont(13.5), fontWeight: "700", color: PURPLE_MID },
  accountAvatar: { width: scale(42), height: scale(42), borderRadius: scale(21), backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: scaleFont(15.5), fontWeight: "900", color: "#fff" },
  accountName: { flex: 1, fontSize: scaleFont(15.5), fontWeight: "800", color: DARK },

  contModeBtn: { flex: 1, borderRadius: scale(14), borderWidth: 2, borderColor: "#f3e8ff", padding: scale(12) },
  contModeBtnActive: { borderColor: PURPLE_MID, backgroundColor: "#f5f3ff" },
  contModeTitle: { fontSize: scaleFont(15), fontWeight: "800", color: DARK },
  contModeSub: { fontSize: scaleFont(12.5), color: "#7c6fa0", marginTop: scale(2) },
  textInput: { borderRadius: scale(10), borderWidth: 1, borderColor: "#e8e4f4", backgroundColor: "#f8f6ff", paddingHorizontal: scale(14), paddingVertical: scale(12), fontSize: scaleFont(15), color: DARK },
  phoneErrorText: { fontSize: scaleFont(12.5), color: "#e11d48", marginTop: -scale(2) },

  anonNoteBox: { borderRadius: scale(12), borderWidth: 1, borderColor: "#fde68a", backgroundColor: "rgba(254,243,199,0.5)", padding: scale(12) },
  anonNoteText: { fontSize: scaleFont(13), color: "#92400e", lineHeight: moderateScale(18) },

  finalSummary: { borderRadius: scale(14), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.35)", padding: scale(12) },
  finalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scale(6) },
  finalLabel: { fontSize: scaleFont(14), color: "#7c6fa0" },
  finalValue: { fontSize: scaleFont(14.5), fontWeight: "700", color: DARK },

  errorBanner: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(12) },
  errorBannerText: { fontSize: scaleFont(14), fontWeight: "700", color: "#dc2626" },

  footer: { flexDirection: "row", gap: scale(10), paddingHorizontal: scale(16), paddingTop: scale(11), borderTopWidth: 1, borderTopColor: "#f0ecff" },
  backFooterBtn: { flex: 1, borderRadius: scale(12), borderWidth: 1, borderColor: "#e9d9ff", alignItems: "center", justifyContent: "center", paddingVertical: scale(14) },
  backFooterBtnText: { fontSize: scaleFont(15.5), fontWeight: "700", color: DARK },
  nextBtn: { flex: 2, borderRadius: scale(12), alignItems: "center", justifyContent: "center", paddingVertical: scale(14), backgroundColor: PURPLE_MID },
  nextBtnText: { fontSize: scaleFont(15.5), fontWeight: "800", color: "#fff" },


  payHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(14), paddingBottom: scale(11), borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  payCloseBtn: { width: scale(36), height: scale(36), borderRadius: scale(10), borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8f9fb", alignItems: "center", justifyContent: "center" },
  payTitle: { fontSize: scaleFont(16), fontWeight: "800", color: "#171717" },
});
