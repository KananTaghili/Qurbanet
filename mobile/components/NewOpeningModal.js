import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
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

function userFullName(user, lang) {
  return [user?.name, user?.lastName].filter(Boolean).join(" ").trim() || t(lang, "donateModal_defaultUser");
}
function initials2(name) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
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

export default function NewOpeningModal({ visible, onClose, onSuccess, preselectedAnimalName }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const STEPS = [t(lang, "newOpening_stepAnimalType"), t(lang, "newOpening_stepAmount"), t(lang, "newOpening_stepPaymentConfirm")];

  const [step, setStep] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [settings, setSettings] = useState({});
  const [selAnimalId, setSelAnimalId] = useState(null);
  const [isAnon, setIsAnon] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [contMode, setContMode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState(null);
  const [authPhase, setAuthPhase] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setIsAnon(false);
    setAmount("");
    setNote("");
    setContMode("");
    setGuestName("");
    setGuestLastName("");
    setGuestPhone("");
    setError("");
    setPayUrl(null);
    setLoadingSettings(true);
    setAuthPhase(false);

    api.get("/campaigns/settings")
      .then((res) => {
        const d = res.data?.data || {};
        setSettings(d.settings || {});
        const list = d.animals || [];
        setAnimals(list);
        const maxPer = d.settings?.maxPerAnimal || 1;
        const preselected = preselectedAnimalName
          ? list.find((a) => a.nameAz === preselectedAnimalName && (a.activeCount || 0) < maxPer)
          : null;
        const first = preselected || list.find((a) => (a.activeCount || 0) < maxPer) || list[0];
        if (first) setSelAnimalId(first._id);
      })
      .catch(() => setError(t(lang, "newOpening_animalListError")))
      .finally(() => setLoadingSettings(false));
  }, [visible]);

  const animal = animals.find((a) => String(a._id) === String(selAnimalId)) || null;
  const maxPerAnimal = settings.maxPerAnimal || 1;
  const isAtLimit = (item) => (item.activeCount || 0) >= maxPerAnimal;
  const minPct = settings.minOpenPercent || 30;
  const minDon = settings.minDonation || 10;
  const minAmount = animal ? Math.min(Math.ceil(Math.round(animal.price * 100) * minPct / 100) / 100, animal.price) : 0;
  const numAmount = Number(amount || 0);
  const validAmt = animal ? numAmount >= minAmount && numAmount <= animal.price : false;
  const remaining = animal ? Math.max(animal.price - numAmount, 0) : 0;
  const guestPhoneDigits = guestPhone.replace(/\D/g, "");
  const guestPhonePrefix = guestPhoneDigits.startsWith("0") ? guestPhoneDigits.slice(1, 3) : guestPhoneDigits.slice(0, 2);
  const guestPhoneOperatorInvalid = guestPhoneDigits.length >= 2 && !AZ_OPERATORS.includes(guestPhonePrefix);
  const finalValid = !isGuest || contMode === "registered" || (contMode === "guest" && guestName.trim() && guestLastName.trim() && isValidAzPhone(guestPhone));

  const goNext = () => {
    setError("");
    if (step === 0) {
      if (!animal || isAtLimit(animal)) return;
      setAmount(String(minAmount));
      setStep(1);
      return;
    }
    if (step === 1 && !validAmt) return;
    setStep(step + 1);
  };
  const goBack = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const handleWebViewNav = (navState) => {
    if (!isResultUrl(navState.url)) return;
    setPayUrl(null);
    if (isSuccessUrl(navState.url)) {
      let campaignId, role, amount;
      try {
        const qs = navState.url.split("?")[1] || "";
        const params = new URLSearchParams(qs);
        campaignId = params.get("campaignId");
        role = params.get("role") || "opener";
        amount = params.get("amount") || String(numAmount);
      } catch (_) {}
      onClose();
      onSuccess?.({ campaignId, role, amount });
    } else {
      setError(t(lang, "donateModal_paymentFailed"));
    }
  };

  const handleConfirm = async (overrideUser) => {
    if (!animal) return;
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
      const body = {
        animalId: animal._id,
        amount: numAmount,
        isAnonymous: isAnon,
        note: note || undefined,
        ...(!isAnon
          ? {
              openerName: isGuestMode ? `${guestName.trim()} ${guestLastName.trim()}` : userFullName(overrideUser || user, lang),
              ...(isGuestMode ? { openerPhone: toE164(guestPhone) } : {}),
            }
          : {}),
      };
      const r1 = await api.post("/campaigns", body);
      const { campaignId, donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaignId}/epoint/start`, { donationId });
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

  if (!visible) return null;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t(lang, "collModal_newOpeningTitle")}</Text>
          <Text style={styles.headerSub}>{t(lang, "newOpening_headerSubTemplate").replace("{pct}", minPct)}</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <X size={22} color="#7c6fa0" />
        </Pressable>
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]}>
              <Text style={[styles.stepDotText, (i <= step) && { color: "#fff" }]}>{i < step ? "✓" : i + 1}</Text>
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
              <View>
                <Text style={styles.label}>{t(lang, "collModal_selectAnimalType")}</Text>
                <View style={styles.animalGrid}>
                  {animals.map((item) => {
                    const limited = isAtLimit(item);
                    const selected = !limited && String(selAnimalId) === String(item._id);
                    return (
                      <Pressable
                        key={item._id}
                        style={[styles.animalCard, selected && styles.animalCardSelected, limited && styles.animalCardLimited]}
                        onPress={() => !limited && setSelAnimalId(item._id)}
                        disabled={limited}
                      >
                        {limited && (
                          <View style={styles.limitOverlay}>
                            <Text style={styles.limitOverlayText}>
                              {t(lang, "newOpening_limitOverlayText")}
                            </Text>
                            <Pressable
                              style={styles.limitDonateBtn}
                              onPress={() => {
                                onClose();
                                navigation.navigate("CollectiveQurban");
                              }}
                            >
                              <Text style={styles.limitDonateBtnText}>{t(lang, "collModal_limitDonateBtn")}</Text>
                            </Pressable>
                          </View>
                        )}
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.animalImg} resizeMode="cover" />
                        ) : (
                          <View style={[styles.animalImg, { backgroundColor: "#f3e8ff" }]} />
                        )}
                        <View style={styles.animalCardBody}>
                          <View style={styles.animalCardTop}>
                            <Text style={styles.animalName} numberOfLines={1}>{item.nameAz}</Text>
                            {selected && (
                              <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>{t(lang, "collModal_selected")}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.animalSub}>{t(lang, "collModal_animalSub")}</Text>
                          <View style={styles.animalStatsRow}>
                            <View style={styles.animalStatBox}>
                              <Text style={styles.animalStatLabel}>{t(lang, "collModal_liveWeight")}</Text>
                              <Text style={styles.animalStatValue} numberOfLines={1}>{item.weightRange || "—"}</Text>
                            </View>
                            <View style={styles.animalStatBox}>
                              <Text style={styles.animalStatLabel}>{t(lang, "collModal_price")}</Text>
                              <Text style={styles.animalStatValue} numberOfLines={1}>{item.price?.toLocaleString()} AZN</Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.anonRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.anonTitle}>{t(lang, "collModal_anonOpenTitle")}</Text>
                    <Text style={styles.anonSub}>{t(lang, "collModal_anonSub")}</Text>
                  </View>
                  <Switch value={isAnon} onValueChange={setIsAnon} trackColor={{ true: PURPLE_MID }} />
                </View>
              </View>
            )}

            {step === 1 && animal && (
              <View style={{ gap: scale(12) }}>
                <View style={styles.summaryBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1 }}>
                    {animal.image ? (
                      <Image source={{ uri: animal.image }} style={styles.summaryImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.summaryImg, { backgroundColor: "#f3e8ff" }]} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.summaryName}>{animal.nameAz} {t(lang, "collectiveConfirm_campaignSuffix")}</Text>
                      <Text style={styles.summarySub}>{t(lang, "newOpening_summarySubTemplate").replace("{weight}", animal.weightRange).replace("{price}", animal.price?.toLocaleString())}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.summaryMinLabel} numberOfLines={1}>{t(lang, "collModal_minInitialPayment")} ({minPct}%)</Text>
                    <Text style={styles.summaryMinValue}>{minAmount.toLocaleString()} AZN</Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>{t(lang, "collModal_amountLabel")}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder={String(minAmount)}
                  />
                  <Text style={[styles.hint, !validAmt && amount !== "" && { color: "#e11d48" }]}>
                    {t(lang, "newOpening_amountHintTemplate").replace("{min}", minAmount.toLocaleString()).replace("{minDon}", minDon)}
                  </Text>
                </View>

                <View>
                  <Text style={styles.label}>{t(lang, "collModal_noteLabel")}</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder={t(lang, "newOpening_notePlaceholder")}
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </View>
              </View>
            )}

            {step === 2 && animal && (
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
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.accountName} numberOfLines={1}>{userFullName(user, lang)}</Text>
                          </View>
                          <View style={styles.registeredBadge}>
                            <Text style={styles.registeredBadgeText}>{t(lang, "collModal_registeredBadge")}</Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: "row", gap: scale(8) }}>
                          <Pressable
                            style={[styles.contModeBtn, contMode === "registered" && styles.contModeBtnActive]}
                            onPress={() => setContMode("registered")}
                          >
                            <Text style={styles.contModeTitle}>{t(lang, "collModal_contModeRegisteredTitle")}</Text>
                            <Text style={styles.contModeSub}>{t(lang, "collModal_contModeRegisteredSubAlt")}</Text>
                          </Pressable>
                          {settings.allowGuest !== false && (
                            <Pressable
                              style={[styles.contModeBtn, contMode === "guest" && styles.contModeBtnActive]}
                              onPress={() => setContMode("guest")}
                            >
                              <Text style={styles.contModeTitle}>{t(lang, "collModal_contModeGuestTitle")}</Text>
                              <Text style={styles.contModeSub}>{t(lang, "collModal_contModeGuestSubAlt")}</Text>
                            </Pressable>
                          )}
                        </View>
                        {contMode === "guest" && (
                          <View style={{ gap: scale(8) }}>
                            <View style={{ flexDirection: "row", gap: scale(8) }}>
                              <TextInput style={[styles.textInput, { flex: 1 }]} value={guestName} onChangeText={setGuestName} placeholder={t(lang, "newOpening_firstNamePlaceholder")} placeholderTextColor="#9ca3af" />
                              <TextInput style={[styles.textInput, { flex: 1 }]} value={guestLastName} onChangeText={setGuestLastName} placeholder={t(lang, "newOpening_lastNamePlaceholder")} placeholderTextColor="#9ca3af" />
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
                        <Text style={styles.anonNoteText}>
                          {t(lang, "newOpening_anonNote")}
                        </Text>
                      </View>
                    )}

                    <View style={styles.finalSummary}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(8) }}>
                        <Shield size={16} color={PURPLE_MID} />
                        <Text style={styles.accountBoxLabel}>{t(lang, "collModal_openingSummary")}</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "donateModal_animalLabel")}</Text>
                        <Text style={styles.finalValue}>{animal.nameAz}</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "collModal_finalFullAmount")}</Text>
                        <Text style={styles.finalValue}>{animal.price?.toLocaleString()} AZN</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "collModal_finalInitialPayment")}</Text>
                        <Text style={styles.finalValue}>{numAmount.toLocaleString()} AZN</Text>
                      </View>
                      <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>{t(lang, "collective_anonymous")}</Text>
                        <Text style={styles.finalValue}>{isAnon ? t(lang, "yesLabel") : t(lang, "noLabel")}</Text>
                      </View>
                      <View style={[styles.finalRow, styles.finalRowTotal]}>
                        <Text style={styles.finalTotalLabel}>{t(lang, "newOpening_remainingLabel")}</Text>
                        <Text style={styles.finalTotalValue}>{remaining.toLocaleString()} AZN</Text>
                      </View>
                    </View>

                    <Text style={styles.finalNote}>
                      {t(lang, "newOpening_finalNoteTemplate").replace("{minDon}", minDon)}
                    </Text>

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
          {step < STEPS.length - 1 ? (
            <Pressable
              style={[styles.nextBtn, ((step === 0 && (!animal || isAtLimit(animal))) || (step === 1 && !validAmt)) && { opacity: 0.5 }]}
              onPress={goNext}
              disabled={(step === 0 && (!animal || isAtLimit(animal))) || (step === 1 && !validAmt)}
            >
              <Text style={styles.nextBtnText}>{t(lang, "continue")}</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.nextBtn, (!finalValid || submitting) && { opacity: 0.5 }]} onPress={() => handleConfirm()} disabled={!finalValid || submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.nextBtnText}>{t(lang, "collModal_confirmOpenBtn")}</Text>}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 100 },

  header: { flexDirection: "row", alignItems: "flex-start", gap: scale(11), paddingHorizontal: scale(16), paddingBottom: scale(12), borderBottomWidth: 1, borderBottomColor: "#f0ecff", backgroundColor: "#f5f3ff" },
  headerTitle: { fontSize: scaleFont(18.5), fontWeight: "800", color: DARK },
  headerSub: { fontSize: scaleFont(13.5), color: "#7c6fa0", marginTop: scale(2) },
  closeBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,111,160,0.12)" },

  stepsRow: { flexDirection: "row", justifyContent: "center", gap: scale(18), paddingVertical: scale(12), borderBottomWidth: 1, borderBottomColor: "#f0ecff" },
  stepItem: { flexDirection: "row", alignItems: "center", gap: scale(7) },
  stepDot: { width: scale(24), height: scale(24), borderRadius: scale(12), backgroundColor: "#e8e4f4", alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: PURPLE_MID },
  stepDotDone: { backgroundColor: "#10b981" },
  stepDotText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#7c6fa0" },
  stepLabel: { fontSize: scaleFont(13.5), fontWeight: "600", color: "#7c6fa0" },

  label: { fontSize: scaleFont(15.5), fontWeight: "700", color: DARK, marginBottom: scale(8) },
  hint: { fontSize: scaleFont(13), color: "#7c6fa0", marginTop: scale(6), lineHeight: moderateScale(17) },

  animalGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(9) },
  animalCard: { width: "48%", borderRadius: scale(16), borderWidth: 2, borderColor: "#f3e8ff", position: "relative", overflow: "hidden", backgroundColor: "#fff" },
  animalCardSelected: { borderColor: PURPLE_MID, backgroundColor: "#f5f3ff" },
  animalCardLimited: { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  limitOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: "center", justifyContent: "center", gap: scale(6), paddingHorizontal: scale(8), backgroundColor: "rgba(241,245,249,0.94)" },
  limitOverlayText: { backgroundColor: "#334155", color: "#fff", fontSize: scaleFont(11.5), fontWeight: "800", textAlign: "center", borderRadius: scale(10), paddingHorizontal: scale(8), paddingVertical: scale(6), lineHeight: moderateScale(15) },
  limitDonateBtn: { backgroundColor: PURPLE_MID, borderRadius: scale(999), paddingHorizontal: scale(14), paddingVertical: scale(7) },
  limitDonateBtnText: { color: "#fff", fontSize: scaleFont(12.5), fontWeight: "800" },
  animalImg: { width: "100%", height: scale(88) },
  animalCardBody: { padding: scale(11), gap: scale(6) },
  animalCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: scale(6) },
  animalName: { flex: 1, fontSize: scaleFont(15.5), fontWeight: "800", color: DARK },
  selectedBadge: { backgroundColor: PURPLE_MID, borderRadius: scale(999), paddingHorizontal: scale(8), paddingVertical: scale(3) },
  selectedBadgeText: { color: "#fff", fontSize: scaleFont(11), fontWeight: "800" },
  animalSub: { fontSize: scaleFont(12), fontWeight: "700", color: PURPLE_MID, marginTop: scale(-3) },
  animalStatsRow: { flexDirection: "column", gap: scale(5) },
  animalStatBox: { backgroundColor: "rgba(243,232,255,0.5)", borderRadius: scale(9), paddingHorizontal: scale(10), paddingVertical: scale(6), gap: scale(2) },
  animalStatLabel: { fontSize: scaleFont(11.5), fontWeight: "600", color: "#7c6fa0" },
  animalStatValue: { fontSize: scaleFont(14.5), fontWeight: "800", color: DARK },

  anonRow: { flexDirection: "row", alignItems: "center", gap: scale(10), marginTop: scale(11), borderRadius: scale(12), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", padding: scale(12) },
  anonTitle: { fontSize: scaleFont(15), fontWeight: "700", color: DARK },
  anonSub: { fontSize: scaleFont(13), color: "#7c6fa0", marginTop: scale(1) },

  summaryBox: { flexDirection: "row", justifyContent: "space-between", gap: scale(10), borderRadius: scale(14), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.35)", padding: scale(12) },
  summaryImg: { width: scale(50), height: scale(50), borderRadius: scale(12) },
  summaryName: { fontSize: scaleFont(15.5), fontWeight: "800", color: DARK },
  summarySub: { fontSize: scaleFont(13), color: "#7c6fa0", marginTop: scale(2) },
  summaryMinLabel: { fontSize: scaleFont(12), color: "#7c6fa0" },
  summaryMinValue: { fontSize: scaleFont(15.5), fontWeight: "800", color: PURPLE_MID },

  amountInput: { borderRadius: scale(12), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: scale(15), paddingVertical: scale(12), fontSize: scaleFont(17), color: DARK },
  noteInput: { minHeight: scale(82), borderRadius: scale(12), borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: scale(15), paddingVertical: scale(12), fontSize: scaleFont(15.5), color: DARK, textAlignVertical: "top" },

  accountBox: { borderRadius: scale(14), borderWidth: 1, borderColor: "#e9d9ff", backgroundColor: "rgba(243,232,255,0.4)", padding: scale(12) },
  accountBoxLabel: { fontSize: scaleFont(13.5), fontWeight: "700", color: PURPLE_MID },
  accountAvatar: { width: scale(42), height: scale(42), borderRadius: scale(21), backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: scaleFont(15.5), fontWeight: "900", color: "#fff" },
  accountName: { fontSize: scaleFont(15.5), fontWeight: "800", color: DARK },
  registeredBadge: { backgroundColor: "#d1fae5", borderRadius: scale(999), paddingHorizontal: scale(10), paddingVertical: scale(5) },
  registeredBadgeText: { fontSize: scaleFont(11.5), fontWeight: "800", color: "#047857" },

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
  finalRowTotal: { borderTopWidth: 1, borderTopColor: "#e9d9ff", marginTop: scale(4), paddingTop: scale(9) },
  finalTotalLabel: { fontSize: scaleFont(15), fontWeight: "900", color: DARK },
  finalTotalValue: { fontSize: scaleFont(15.5), fontWeight: "900", color: PURPLE_MID },
  finalNote: { fontSize: scaleFont(13), color: "#9ca3af", lineHeight: moderateScale(18) },

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
