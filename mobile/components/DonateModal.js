import { useEffect, useState } from "react";
import { View, Text, Image, TextInput, Pressable, ScrollView, ActivityIndicator, Switch, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Shield } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { toE164 } from "../lib/format";
import api from "../lib/api";

const PURPLE_MID = "#5b21b6";
const DARK = "#241a4d";
const STEPS = ["Məbləğ", "Təsdiq"];

function userFullName(user) {
  return [user?.name, user?.lastName].filter(Boolean).join(" ").trim() || "İstifadəçi";
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

export default function DonateModal({ visible, campaign, onClose, onSuccess }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();

  const [step, setStep] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [minDon, setMinDon] = useState(10);
  const [nearlyFullPercent, setNearlyFullPercent] = useState(90);
  const [nearlyFullMinDonation, setNearlyFullMinDonation] = useState(1);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [contMode, setContMode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setAmount("");
    setNote("");
    setIsAnon(false);
    setContMode("");
    setGuestName("");
    setGuestPhone("");
    setError("");
    setPayUrl(null);
    setLoadingSettings(true);

    api.get("/campaigns/settings")
      .then((res) => {
        const s = res.data?.data?.settings || {};
        setMinDon(s.minDonation || 10);
        setNearlyFullPercent(s.nearlyFullPercent || 90);
        setNearlyFullMinDonation(s.nearlyFullMinDonation || 1);
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
  const finalValid = !isGuest || contMode === "registered" || (contMode === "guest" && guestName.trim() && guestPhone.trim());

  const goNext = () => {
    setError("");
    if (step === 0 && !validAmt) return;
    setStep(1);
  };
  const goBack = () => {
    setError("");
    setStep(0);
  };

  const handleGoLogin = () => {
    onClose();
    navigation.navigate("Login");
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
      setError("Ödəniş uğursuz oldu. Yenidən cəhd edin.");
    }
  };

  const handleConfirm = async () => {
    if (!finalValid) return;
    if (isGuest && contMode === "registered") {
      handleGoLogin();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const isGuestMode = isGuest && contMode === "guest";
      const donorName = isGuestMode ? guestName.trim() : userFullName(user);
      const donorPhone = isGuestMode ? toE164(guestPhone) : undefined;
      const body = { amount: numAmount, donorName, donorPhone, isAnonymous: isAnon, note: note || undefined };
      const r1 = await api.post(`/campaigns/${campaign._id}/donate`, body);
      const { donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaign._id}/epoint/start`, { donationId });
      setPayUrl(r2.data.data.redirect_url);
    } catch (err) {
      setError(err.response?.data?.message || "Xəta baş verdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (payUrl) {
    return (
      <View style={styles.fullOverlay}>
        <View style={[styles.payHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.payCloseBtn} onPress={() => setPayUrl(null)}>
            <X size={18} color="#374151" />
          </Pressable>
          <Text style={styles.payTitle}>MeatBox Ödəniş</Text>
          <View style={{ width: 32 }} />
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
            <Image source={{ uri: animal.image }} style={styles.headerImg} resizeMode="contain" />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{animal.nameAz} Qurbanı</Text>
          <Text style={styles.headerSub}>Minimum {effectiveMin} AZN ianə edin</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <X size={18} color="#8a7ba7" />
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        {loadingSettings ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: 40 }} />
        ) : (
          <>
            {step === 0 && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={styles.label}>Ödəmək istədiyiniz məbləğ</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder={String(effectiveMin)}
                  />
                  <Text style={[styles.hint, !validAmt && amount !== "" && { color: "#e11d48" }]}>
                    Minimum {effectiveMin} AZN, maksimum {remaining} AZN (qalan məbləğ).
                  </Text>
                </View>
                <View>
                  <Text style={styles.label}>Qeyd (istəyə bağlı)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="İanə ilə bağlı qeyd..."
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </View>
                <View style={styles.anonRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.anonTitle}>Anonim ianə</Text>
                    <Text style={styles.anonSub}>Adınız iştirakçılara göstərilməyəcək</Text>
                  </View>
                  <Switch value={isAnon} onValueChange={setIsAnon} trackColor={{ true: PURPLE_MID }} />
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={{ gap: 12 }}>
                {!isGuest ? (
                  <View style={styles.accountBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Shield size={12} color={PURPLE_MID} />
                      <Text style={styles.accountBoxLabel}>Aktiv hesab</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={styles.accountAvatar}>
                        <Text style={styles.accountAvatarText}>{initials2(userFullName(user))}</Text>
                      </View>
                      <Text style={styles.accountName} numberOfLines={1}>{userFullName(user)}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable style={[styles.contModeBtn, contMode === "registered" && styles.contModeBtnActive]} onPress={() => setContMode("registered")}>
                        <Text style={styles.contModeTitle}>Qeydiyyat ilə</Text>
                        <Text style={styles.contModeSub}>Hesabınıza daxil olun</Text>
                      </Pressable>
                      <Pressable style={[styles.contModeBtn, contMode === "guest" && styles.contModeBtnActive]} onPress={() => setContMode("guest")}>
                        <Text style={styles.contModeTitle}>Qeydiyyatsız</Text>
                        <Text style={styles.contModeSub}>Ad və nömrə ilə davam edin</Text>
                      </Pressable>
                    </View>
                    {contMode === "guest" && (
                      <View style={{ gap: 8 }}>
                        <TextInput style={styles.textInput} value={guestName} onChangeText={setGuestName} placeholder="Ad Soyad" placeholderTextColor="#9ca3af" />
                        <TextInput style={styles.textInput} value={guestPhone} onChangeText={setGuestPhone} placeholder="+994 50 000 00 00" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
                      </View>
                    )}
                  </>
                )}

                <View style={styles.finalSummary}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Shield size={12} color={PURPLE_MID} />
                    <Text style={styles.accountBoxLabel}>İanə xülasəsi</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>Heyvan</Text>
                    <Text style={styles.finalValue}>{animal.nameAz}</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>İanə məbləği</Text>
                    <Text style={styles.finalValue}>{numAmount.toLocaleString()} AZN</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>Anonim</Text>
                    <Text style={styles.finalValue}>{isAnon ? "Bəli" : "Xeyr"}</Text>
                  </View>
                </View>

                {!!error && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!loadingSettings && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {step > 0 && (
            <Pressable style={styles.backFooterBtn} onPress={goBack}>
              <Text style={styles.backFooterBtnText}>Geri</Text>
            </Pressable>
          )}
          {step === 0 ? (
            <Pressable style={[styles.nextBtn, !validAmt && { opacity: 0.5 }]} onPress={goNext} disabled={!validAmt}>
              <Text style={styles.nextBtnText}>Davam et</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.nextBtn, (!finalValid || submitting) && { opacity: 0.5 }]} onPress={handleConfirm} disabled={!finalValid || submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.nextBtnText}>İanəni təsdiqlə ✓</Text>}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 100 },

  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#ede9fe", backgroundColor: "#f5f3ff" },
  headerImgWrap: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerImg: { width: "80%", height: "80%" },
  headerTitle: { fontSize: 14, fontWeight: "800", color: DARK },
  headerSub: { fontSize: 11, color: "#8a7ba7", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,111,160,0.12)" },

  stepsRow: { flexDirection: "row", justifyContent: "center", gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ecff" },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#e8e4f4", alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: PURPLE_MID },
  stepDotDone: { backgroundColor: "#10b981" },
  stepDotText: { fontSize: 10, fontWeight: "800", color: "#7c6fa0" },
  stepLabel: { fontSize: 11, fontWeight: "600", color: "#7c6fa0" },

  label: { fontSize: 12, fontWeight: "700", color: DARK, marginBottom: 8 },
  hint: { fontSize: 10.5, color: "#7c6fa0", marginTop: 5, lineHeight: 15 },
  amountInput: { borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: DARK },
  noteInput: { minHeight: 70, borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: DARK, textAlignVertical: "top" },

  anonRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", padding: 12 },
  anonTitle: { fontSize: 13, fontWeight: "700", color: DARK },
  anonSub: { fontSize: 11, color: "#7c6fa0", marginTop: 1 },

  accountBox: { borderRadius: 14, borderWidth: 1, borderColor: "#e9d9ff", backgroundColor: "rgba(243,232,255,0.4)", padding: 10 },
  accountBoxLabel: { fontSize: 11, fontWeight: "700", color: PURPLE_MID },
  accountAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: 13, fontWeight: "900", color: "#fff" },
  accountName: { flex: 1, fontSize: 13, fontWeight: "800", color: DARK },

  contModeBtn: { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: "#f3e8ff", padding: 10 },
  contModeBtnActive: { borderColor: PURPLE_MID, backgroundColor: "#f5f3ff" },
  contModeTitle: { fontSize: 12.5, fontWeight: "800", color: DARK },
  contModeSub: { fontSize: 10, color: "#7c6fa0", marginTop: 2 },
  textInput: { borderRadius: 10, borderWidth: 1, borderColor: "#e8e4f4", backgroundColor: "#f8f6ff", paddingHorizontal: 12, paddingVertical: 10, fontSize: 12.5, color: DARK },

  finalSummary: { borderRadius: 14, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.35)", padding: 10 },
  finalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  finalLabel: { fontSize: 11.5, color: "#7c6fa0" },
  finalValue: { fontSize: 12, fontWeight: "700", color: DARK },

  errorBanner: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  errorBannerText: { fontSize: 11.5, fontWeight: "700", color: "#dc2626" },

  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0ecff" },
  backFooterBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#e9d9ff", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  backFooterBtnText: { fontSize: 13, fontWeight: "700", color: DARK },
  nextBtn: { flex: 2, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 12, backgroundColor: PURPLE_MID },
  nextBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  payHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  payCloseBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8f9fb", alignItems: "center", justifyContent: "center" },
  payTitle: { fontSize: 13, fontWeight: "800", color: "#171717" },
});
