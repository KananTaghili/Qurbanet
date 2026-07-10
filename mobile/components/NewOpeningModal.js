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
import { toE164 } from "../lib/format";
import api from "../lib/api";

const PURPLE_MID = "#5b21b6";
const DARK = "#241a4d";
const STEPS = ["Heyvan növü", "Ödəniş", "Təsdiq"];

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

export default function NewOpeningModal({ visible, onClose, onSuccess, preselectedAnimalName }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();

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
      .catch(() => setError("Heyvan siyahısı yüklənmədi."))
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
  const finalValid = !isGuest || contMode === "registered" || (contMode === "guest" && guestName.trim() && guestLastName.trim());

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

  const handleGoLogin = () => {
    onClose();
    navigation.navigate("Login");
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
      setError("Ödəniş uğursuz oldu. Yenidən cəhd edin.");
    }
  };

  const handleConfirm = async () => {
    if (!finalValid || !animal) return;
    if (isGuest && contMode === "registered") {
      handleGoLogin();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const isGuestMode = isGuest && contMode === "guest";
      const body = {
        animalId: animal._id,
        amount: numAmount,
        isAnonymous: isAnon,
        note: note || undefined,
        ...(!isAnon
          ? {
              openerName: isGuestMode ? `${guestName.trim()} ${guestLastName.trim()}` : userFullName(user),
              ...(isGuestMode ? { openerPhone: toE164(guestPhone) } : {}),
            }
          : {}),
      };
      const r1 = await api.post("/campaigns", body);
      const { campaignId, donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaignId}/epoint/start`, { donationId });
      setPayUrl(r2.data.data.redirect_url);
    } catch (err) {
      setError(err.response?.data?.message || "Xəta baş verdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Yeni Açılış Et</Text>
          <Text style={styles.headerSub}>Heyvan seçin və minimum {minPct}% ilkin ödəniş edin</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <X size={18} color="#7c6fa0" />
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        {loadingSettings ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: 40 }} />
        ) : (
          <>
            {step === 0 && (
              <View>
                <Text style={styles.label}>Heyvan növünü seçin</Text>
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
                              Bu heyvan üçün artıq açılış var{"\n"}və limitindədir.
                            </Text>
                            <Pressable
                              style={styles.limitDonateBtn}
                              onPress={() => {
                                onClose();
                                navigation.navigate("CollectiveQurban");
                              }}
                            >
                              <Text style={styles.limitDonateBtnText}>İanə et</Text>
                            </Pressable>
                          </View>
                        )}
                        <View style={styles.animalCardTop}>
                          {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.animalImg} resizeMode="cover" />
                          ) : (
                            <View style={[styles.animalImg, { backgroundColor: "#f3e8ff" }]} />
                          )}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.animalName} numberOfLines={1}>{item.nameAz}</Text>
                            <Text style={styles.animalSub}>Qurbanlıq seçimi</Text>
                          </View>
                        </View>
                        <View style={styles.animalStatRow}>
                          <Text style={styles.animalStatLabel}>Diri çəki</Text>
                          <Text style={styles.animalStatValue}>{item.weightRange || "—"}</Text>
                        </View>
                        <View style={styles.animalStatRow}>
                          <Text style={styles.animalStatLabel}>Qiymət</Text>
                          <Text style={styles.animalStatValue}>{item.price?.toLocaleString()} AZN</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.anonRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.anonTitle}>Anonim açılış</Text>
                    <Text style={styles.anonSub}>Adınız iştirakçılara göstərilməyəcək</Text>
                  </View>
                  <Switch value={isAnon} onValueChange={setIsAnon} trackColor={{ true: PURPLE_MID }} />
                </View>
              </View>
            )}

            {step === 1 && animal && (
              <View style={{ gap: 12 }}>
                <View style={styles.summaryBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    {animal.image ? (
                      <Image source={{ uri: animal.image }} style={styles.summaryImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.summaryImg, { backgroundColor: "#f3e8ff" }]} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.summaryName}>{animal.nameAz} Qurbanı</Text>
                      <Text style={styles.summarySub}>Diri çəki: {animal.weightRange} • {animal.price?.toLocaleString()} AZN</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.summaryMinLabel}>Minimum ilkin ödəniş</Text>
                    <Text style={styles.summaryMinValue}>{minAmount.toLocaleString()} AZN</Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>Ödəmək istədiyiniz məbləğ</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder={String(minAmount)}
                  />
                  <Text style={[styles.hint, !validAmt && amount !== "" && { color: "#e11d48" }]}>
                    Minimum {minAmount.toLocaleString()} AZN — heyvanın tam məbləği yığılana qədər minimum {minDon} AZN-lik ianələr qəbul olunacaq.
                  </Text>
                </View>

                <View>
                  <Text style={styles.label}>Qeyd (istəyə bağlı)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Açılışla bağlı qeyd..."
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </View>
              </View>
            )}

            {step === 2 && animal && (
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
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.accountName} numberOfLines={1}>{userFullName(user)}</Text>
                      </View>
                      <View style={styles.registeredBadge}>
                        <Text style={styles.registeredBadgeText}>Qeydiyyatlı</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        style={[styles.contModeBtn, contMode === "registered" && styles.contModeBtnActive]}
                        onPress={() => setContMode("registered")}
                      >
                        <Text style={styles.contModeTitle}>Qeydiyyat ilə</Text>
                        <Text style={styles.contModeSub}>Hesabınıza daxil olaraq davam edin</Text>
                      </Pressable>
                      {settings.allowGuest !== false && (
                        <Pressable
                          style={[styles.contModeBtn, contMode === "guest" && styles.contModeBtnActive]}
                          onPress={() => setContMode("guest")}
                        >
                          <Text style={styles.contModeTitle}>Qeydiyyatsız</Text>
                          <Text style={styles.contModeSub}>Ad soyad ilə davam edin</Text>
                        </Pressable>
                      )}
                    </View>
                    {contMode === "guest" && (
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TextInput style={[styles.textInput, { flex: 1 }]} value={guestName} onChangeText={setGuestName} placeholder="Adınız" placeholderTextColor="#9ca3af" />
                          <TextInput style={[styles.textInput, { flex: 1 }]} value={guestLastName} onChangeText={setGuestLastName} placeholder="Soyadınız" placeholderTextColor="#9ca3af" />
                        </View>
                        <TextInput
                          style={styles.textInput}
                          value={guestPhone}
                          onChangeText={setGuestPhone}
                          placeholder="+994 50 000 00 00"
                          placeholderTextColor="#9ca3af"
                          keyboardType="phone-pad"
                        />
                      </View>
                    )}
                  </>
                )}

                {isAnon && (
                  <View style={styles.anonNoteBox}>
                    <Text style={styles.anonNoteText}>
                      Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir. Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur, üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                    </Text>
                  </View>
                )}

                <View style={styles.finalSummary}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Shield size={12} color={PURPLE_MID} />
                    <Text style={styles.accountBoxLabel}>Açılış xülasəsi</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>Heyvan</Text>
                    <Text style={styles.finalValue}>{animal.nameAz}</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>Tam məbləğ</Text>
                    <Text style={styles.finalValue}>{animal.price?.toLocaleString()} AZN</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>İlkin ödəniş</Text>
                    <Text style={styles.finalValue}>{numAmount.toLocaleString()} AZN</Text>
                  </View>
                  <View style={styles.finalRow}>
                    <Text style={styles.finalLabel}>Anonim</Text>
                    <Text style={styles.finalValue}>{isAnon ? "Bəli" : "Xeyr"}</Text>
                  </View>
                  <View style={[styles.finalRow, styles.finalRowTotal]}>
                    <Text style={styles.finalTotalLabel}>Qalan toplanacaq</Text>
                    <Text style={styles.finalTotalValue}>{remaining.toLocaleString()} AZN</Text>
                  </View>
                </View>

                <Text style={styles.finalNote}>
                  Pay sistemi yoxdur. Tam məbləğ tamamlanana qədər digər istifadəçilər minimum {minDon} AZN ianə edə biləcəklər.
                </Text>

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
          {step < STEPS.length - 1 ? (
            <Pressable
              style={[styles.nextBtn, ((step === 0 && (!animal || isAtLimit(animal))) || (step === 1 && !validAmt)) && { opacity: 0.5 }]}
              onPress={goNext}
              disabled={(step === 0 && (!animal || isAtLimit(animal))) || (step === 1 && !validAmt)}
            >
              <Text style={styles.nextBtnText}>Davam et</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.nextBtn, (!finalValid || submitting) && { opacity: 0.5 }]} onPress={handleConfirm} disabled={!finalValid || submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.nextBtnText}>Açılışı təsdiqlə ✓</Text>}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 100 },

  header: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#f0ecff", backgroundColor: "#f5f3ff" },
  headerTitle: { fontSize: 15, fontWeight: "800", color: DARK },
  headerSub: { fontSize: 11, color: "#7c6fa0", marginTop: 2 },
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

  animalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  animalCard: { width: "48%", borderRadius: 16, borderWidth: 2, borderColor: "#f3e8ff", padding: 8, position: "relative", overflow: "hidden" },
  animalCardSelected: { borderColor: PURPLE_MID, backgroundColor: "#f5f3ff" },
  animalCardLimited: { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  limitOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 8, backgroundColor: "rgba(241,245,249,0.92)" },
  limitOverlayText: { backgroundColor: "#334155", color: "#fff", fontSize: 9, fontWeight: "800", textAlign: "center", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, lineHeight: 12 },
  limitDonateBtn: { backgroundColor: PURPLE_MID, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  limitDonateBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  animalCardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  animalImg: { width: 52, height: 32, borderRadius: 8 },
  animalName: { fontSize: 13, fontWeight: "800", color: DARK },
  animalSub: { fontSize: 9, fontWeight: "700", color: PURPLE_MID },
  animalStatRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 3 },
  animalStatLabel: { fontSize: 9.5, color: "#7c6fa0" },
  animalStatValue: { fontSize: 9.5, fontWeight: "800", color: DARK },

  anonRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", padding: 12 },
  anonTitle: { fontSize: 13, fontWeight: "700", color: DARK },
  anonSub: { fontSize: 11, color: "#7c6fa0", marginTop: 1 },

  summaryBox: { flexDirection: "row", justifyContent: "space-between", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.35)", padding: 10 },
  summaryImg: { width: 44, height: 44, borderRadius: 10 },
  summaryName: { fontSize: 13, fontWeight: "800", color: DARK },
  summarySub: { fontSize: 10.5, color: "#7c6fa0", marginTop: 2 },
  summaryMinLabel: { fontSize: 9.5, color: "#7c6fa0" },
  summaryMinValue: { fontSize: 13, fontWeight: "800", color: PURPLE_MID },

  amountInput: { borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: DARK },
  noteInput: { minHeight: 80, borderRadius: 12, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.3)", paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: DARK, textAlignVertical: "top" },

  accountBox: { borderRadius: 14, borderWidth: 1, borderColor: "#e9d9ff", backgroundColor: "rgba(243,232,255,0.4)", padding: 10 },
  accountBoxLabel: { fontSize: 11, fontWeight: "700", color: PURPLE_MID },
  accountAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: 13, fontWeight: "900", color: "#fff" },
  accountName: { fontSize: 13, fontWeight: "800", color: DARK },
  registeredBadge: { backgroundColor: "#d1fae5", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  registeredBadgeText: { fontSize: 9, fontWeight: "800", color: "#047857" },

  contModeBtn: { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: "#f3e8ff", padding: 10 },
  contModeBtnActive: { borderColor: PURPLE_MID, backgroundColor: "#f5f3ff" },
  contModeTitle: { fontSize: 12.5, fontWeight: "800", color: DARK },
  contModeSub: { fontSize: 10, color: "#7c6fa0", marginTop: 2 },

  textInput: { borderRadius: 10, borderWidth: 1, borderColor: "#e8e4f4", backgroundColor: "#f8f6ff", paddingHorizontal: 12, paddingVertical: 10, fontSize: 12.5, color: DARK },

  anonNoteBox: { borderRadius: 12, borderWidth: 1, borderColor: "#fde68a", backgroundColor: "rgba(254,243,199,0.5)", padding: 10 },
  anonNoteText: { fontSize: 10.5, color: "#92400e", lineHeight: 15 },

  finalSummary: { borderRadius: 14, borderWidth: 1, borderColor: "#f3e8ff", backgroundColor: "rgba(243,232,255,0.35)", padding: 10 },
  finalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  finalLabel: { fontSize: 11.5, color: "#7c6fa0" },
  finalValue: { fontSize: 12, fontWeight: "700", color: DARK },
  finalRowTotal: { borderTopWidth: 1, borderTopColor: "#e9d9ff", marginTop: 4, paddingTop: 8 },
  finalTotalLabel: { fontSize: 12.5, fontWeight: "900", color: DARK },
  finalTotalValue: { fontSize: 13, fontWeight: "900", color: PURPLE_MID },
  finalNote: { fontSize: 10.5, color: "#9ca3af", lineHeight: 15 },

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
