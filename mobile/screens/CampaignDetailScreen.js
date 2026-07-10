import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Share, StyleSheet, Platform, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { ArrowLeft, Heart, CalendarDays, Coins, Users, CheckCircle2, Share2, ChevronDown } from "lucide-react-native";
import api from "../lib/api";
import DonateModal from "../components/DonateModal";

const PURPLE_MID = "#4b14bd";
const DARK = "#33245f";
const AZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
const RING_SIZE = 96;
const RING_R = 42;

const AVATAR_PALETTE = [
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ccfbf1", text: "#115e59" },
  { bg: "#e0e7ff", text: "#3730a3" },
  { bg: "#ffedd5", text: "#9a3412" },
];

function avatarColor(name) {
  if (!name || name === "Anonim") return { bg: "#f1f5f9", text: "#64748b" };
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function initials(name) {
  if (!name || name === "Anonim") return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${AZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}
function fmtDonTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${fmtDate(d)}  •  ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
}

function DonorRow({ d, i }) {
  const c = avatarColor(d.isAnonymous ? null : d.name);
  return (
    <View style={styles.donorRow}>
      <Text style={styles.donorIdx}>{i + 1}</Text>
      <View style={[styles.donorAvatar, { backgroundColor: c.bg }]}>
        <Text style={[styles.donorAvatarText, { color: c.text }]}>{d.isAnonymous ? "AN" : initials(d.name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.donorName} numberOfLines={1}>{d.isAnonymous ? "Anonim" : d.name}</Text>
        <Text style={styles.donorTime}>{fmtDonTime(d.paidAt)}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.donorAmount}>{d.amount} AZN</Text>
        <Text style={styles.donorPercent}>{Math.round(d.percent)}%</Text>
      </View>
    </View>
  );
}

export default function CampaignDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { campaignId } = route.params || {};

  const cardWidth = screenWidth - 24;
  const imgWidth = Math.round((cardWidth * 3) / 5) + 10;
  const ringWidth = cardWidth - imgWidth;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const fetchCampaign = useCallback(() => {
    if (!campaignId) return;
    setLoading(true);
    api.get(`/campaigns/${campaignId}`)
      .then((r) => setCampaign(r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleShare = () => {
    Share.share({ message: `MeatBox Kollektiv Qurban — ${campaign?.animal?.nameAz || "Qurban"} açılışına baxın!` }).catch(() => {});
  };

  const handleDonateSuccess = ({ campaignId: cid, role, amount } = {}) => {
    setDonateOpen(false);
    navigation.navigate("CollectiveConfirmation", { campaignId: cid || campaignId, role, amount });
  };

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={PURPLE_MID} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", gap: 10 }]}>
        <StatusBar style="dark" />
        <Text style={{ fontSize: 32 }}>⚠️</Text>
        <Text style={{ fontWeight: "800", color: DARK }}>Kampaniya tapılmadı</Text>
        <Pressable style={styles.backFallbackBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={15} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>Geri qayıt</Text>
        </Pressable>
      </View>
    );
  }

  const isCompleted = campaign.status === "completed";
  const paidDons = campaign.donations || [];
  const openerDon = paidDons.find((d) => d.isOpener);
  const otherDons = paidDons.filter((d) => !d.isOpener);
  const displayDons = showAll ? otherDons : otherDons.slice(0, 10);
  const percent = campaign.percent || 0;
  const circ = 2 * Math.PI * RING_R;
  const dash = (percent / 100) * circ;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable style={[styles.headerBackBtn, { top: insets.top }]} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { paddingTop: insets.top + 18 }]} numberOfLines={1}>
          Açılış Detalları
        </Text>
        {!isCompleted && (
          <Pressable style={[styles.headerDonateBtn, { marginTop: insets.top + 8 }]} onPress={() => setDonateOpen(true)}>
            <Heart size={13} color="#fff" />
            <Text style={styles.headerDonateText}>İanə et</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20, gap: 10 }}>
        <View style={styles.mainCard}>
          <View style={styles.topRow}>
            {campaign.animal?.image ? (
              <Image source={{ uri: campaign.animal.image }} style={[styles.mainImg, { width: imgWidth, flex: undefined }]} resizeMode="cover" />
            ) : (
              <View style={[styles.mainImg, { width: imgWidth, flex: undefined, backgroundColor: "#f5f2ff" }]} />
            )}

            <View style={[styles.statusPanel, { width: ringWidth, flex: undefined }]}>
              {isCompleted ? (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <View style={styles.completedBadgeIcon}>
                    <CheckCircle2 size={20} color="#059669" />
                  </View>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Tamamlandı</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: "center", gap: 6 }}>
                  <Text style={styles.ringLabel}>Tamamlanma</Text>
                  <View style={styles.ringWrap}>
                    <Svg width={RING_SIZE} height={RING_SIZE}>
                      <Defs>
                        <LinearGradient id="detailRingGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          <Stop offset="0%" stopColor="#4513ad" />
                          <Stop offset="65%" stopColor="#5d28cf" />
                          <Stop offset="100%" stopColor="#7b4cea" />
                        </LinearGradient>
                      </Defs>
                      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke="#e6dcff" strokeWidth={9} fill="none" />
                      <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_R}
                        stroke="url(#detailRingGrad)"
                        strokeWidth={11}
                        fill="none"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeLinecap="round"
                        rotation={90}
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                      />
                    </Svg>
                    <Text style={styles.ringPercentText}>{percent}%</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Davam edir</Text>
                  </View>
                </View>
              )}

              <Pressable style={styles.shareBtn} onPress={handleShare}>
                <Share2 size={12} color={PURPLE_MID} />
                <Text style={styles.shareBtnText}>Paylaş</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingTop: 10 }}>
            <Users size={13} color="#5b22c7" />
            <Text style={styles.statValueBold}>{campaign.participantCount} nəfər iştirak edir</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.animalNameBig}>{campaign.animal?.nameAz || "Qurban"}</Text>
              {!!campaign.animal?.weightRange && (
                <>
                  <Text style={styles.statLabel}>Diri çəki</Text>
                  <Text style={styles.statValue}>{campaign.animal.weightRange}</Text>
                </>
              )}
              <Text style={styles.statLabel}>Açılış tarixi</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <CalendarDays size={12} color="#6840c6" />
                <Text style={styles.statValue}>{fmtDate(campaign.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Ümumi məbləğ</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Coins size={13} color="#5b22c7" />
                <Text style={styles.statValueBold}>{campaign.totalAmount} AZN</Text>
              </View>
              <Text style={styles.statLabel}>Toplanan məbləğ</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Coins size={13} color="#5b22c7" />
                <Text style={styles.statValueBold}>{campaign.collectedAmount} AZN</Text>
              </View>
              <Text style={styles.statLabel}>Qalan məbləğ</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Coins size={13} color="#5b22c7" />
                <Text style={styles.statValueBold}>{Number((campaign.remainingAmount || 0).toFixed(2))} AZN</Text>
              </View>
            </View>
          </View>
        </View>

        {!!campaign.adminNote && (
          <View style={styles.adminNoteBox}>
            <View style={styles.adminNoteIcon}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#b45309" }}>!</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminNoteLabel}>Admin qeydi</Text>
              <Text style={styles.adminNoteText}>{campaign.adminNote}</Text>
            </View>
          </View>
        )}

        {!!openerDon && (
          <View>
            <View style={styles.openerTag}>
              <Text style={styles.openerTagText}>Açan şəxs</Text>
            </View>
            <View style={styles.openerCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={[styles.donorAvatar, { width: 40, height: 40, borderRadius: 20, backgroundColor: avatarColor(openerDon.isAnonymous ? null : openerDon.name).bg }]}>
                  <Text style={[styles.donorAvatarText, { fontSize: 13, color: avatarColor(openerDon.isAnonymous ? null : openerDon.name).text }]}>
                    {openerDon.isAnonymous ? "AN" : initials(openerDon.name)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.openerName} numberOfLines={1}>{openerDon.isAnonymous ? "Anonim" : openerDon.name}</Text>
                  <Text style={styles.openerSub}>Açılış edən şəxs</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.openerAmount}>{openerDon.amount} AZN <Text style={styles.openerPercent}>({Math.round(openerDon.percent)}%)</Text></Text>
                <Text style={styles.openerDate}>{fmtDate(openerDon.paidAt)}</Text>
              </View>
            </View>
          </View>
        )}

        {otherDons.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Digər ödəniş edənlər ({otherDons.length} nəfər)</Text>
            <View style={styles.donorsCard}>
              {displayDons.map((d, i) => <DonorRow key={d._id || i} d={d} i={i} />)}
              {otherDons.length > 10 && (
                <Pressable style={styles.showMoreBtn} onPress={() => setShowAll((v) => !v)}>
                  <Text style={styles.showMoreText}>{showAll ? "Daha az göstər" : "Daha çoxunu göstər"}</Text>
                  <ChevronDown size={14} color={PURPLE_MID} style={showAll ? { transform: [{ rotate: "180deg" }] } : null} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {otherDons.length === 0 && !openerDon && (
          <View style={styles.emptyDonors}>
            <Text style={styles.emptyDonorsText}>Hələ ödəniş edən yoxdur.</Text>
          </View>
        )}
      </ScrollView>

      <DonateModal
        visible={donateOpen}
        campaign={campaign}
        onClose={() => setDonateOpen(false)}
        onSuccess={handleDonateSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfaff" },

  header: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: "rgba(255,255,255,0.9)", borderBottomWidth: 1, borderBottomColor: "#ede9fe" },
  headerBackBtn: {
    position: "absolute",
    left: 0,
    zIndex: 10,
    width: 56,
    height: 56,
    borderBottomRightRadius: 56,
    backgroundColor: PURPLE_MID,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "900", color: DARK, paddingLeft: 90 },
  headerDonateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: PURPLE_MID, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 4 },
  headerDonateText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  backFallbackBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: PURPLE_MID, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginTop: 4 },

  mainCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e7e1f0", overflow: "hidden" },
  topRow: { flexDirection: "row" },
  mainImg: { flex: 3, height: 170 },
  statsRow: { flexDirection: "row", padding: 12, gap: 12, borderTopWidth: 1, borderTopColor: "#e7e1f0" },
  statCol: { flex: 1 },
  animalNameBig: { fontSize: 15, fontWeight: "900", color: DARK, marginBottom: 6 },
  statLabel: { fontSize: 9.5, fontWeight: "800", color: "#8b7dac" },
  statValue: { fontSize: 12, fontWeight: "900", color: DARK, marginBottom: 6 },
  statValueBold: { fontSize: 12.5, fontWeight: "900", color: DARK },

  statusPanel: { flex: 2, borderLeftWidth: 1, borderLeftColor: "#e7e1f0", padding: 12, alignItems: "center", justifyContent: "center", gap: 10 },
  ringLabel: { fontSize: 10, fontWeight: "800", color: "#6e5b9b" },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringPercentText: { position: "absolute", fontSize: 20, fontWeight: "900", color: PURPLE_MID },
  pendingBadge: { backgroundColor: "#fffbeb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeText: { fontSize: 11, fontWeight: "900", color: "#b45309" },
  completedBadgeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center" },
  completedBadge: { backgroundColor: "#ecfdf5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  completedBadgeText: { fontSize: 11, fontWeight: "900", color: "#047857" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#d9cff0", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  shareBtnText: { fontSize: 11, fontWeight: "800", color: PURPLE_MID },

  adminNoteBox: { flexDirection: "row", gap: 10, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 14, padding: 12 },
  adminNoteIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center" },
  adminNoteLabel: { fontSize: 11, fontWeight: "900", color: "#b45309", marginBottom: 2 },
  adminNoteText: { fontSize: 12.5, color: "#92400e", lineHeight: 18 },

  openerTag: { alignSelf: "flex-start", backgroundColor: PURPLE_MID, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  openerTagText: { color: "#fff", fontSize: 10.5, fontWeight: "900" },
  openerCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f5f0ff", borderWidth: 1, borderColor: "#e1d8ee", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderTopRightRadius: 12, padding: 12 },
  openerName: { fontSize: 13, fontWeight: "900", color: DARK },
  openerSub: { fontSize: 11, fontWeight: "700", color: "#6f6290", marginTop: 1 },
  openerAmount: { fontSize: 15, fontWeight: "900", color: "#24124f" },
  openerPercent: { fontSize: 11.5, fontWeight: "700", color: "#5b22c7" },
  openerDate: { fontSize: 10, fontWeight: "700", color: "#4f4075", marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: "900", color: DARK, marginBottom: 6 },
  donorsCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e7e1f0", overflow: "hidden" },
  donorRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ebff" },
  donorIdx: { fontSize: 11, fontWeight: "900", color: DARK, width: 14 },
  donorAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  donorAvatarText: { fontSize: 9.5, fontWeight: "800" },
  donorName: { fontSize: 12, fontWeight: "700", color: DARK },
  donorTime: { fontSize: 10, color: "#4f4075", marginTop: 1 },
  donorAmount: { fontSize: 12.5, fontWeight: "900", color: DARK },
  donorPercent: { fontSize: 10.5, fontWeight: "700", color: "#5b22c7", marginTop: 1 },
  showMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  showMoreText: { fontSize: 12.5, fontWeight: "900", color: PURPLE_MID },

  emptyDonors: { borderWidth: 1, borderStyle: "dashed", borderColor: "#d8cdec", borderRadius: 16, paddingVertical: 30, alignItems: "center" },
  emptyDonorsText: { fontSize: 12.5, color: "#77689c" },
});
