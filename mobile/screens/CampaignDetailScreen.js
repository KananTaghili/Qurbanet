import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Share, StyleSheet, Platform, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { VideoView, useVideoPlayer } from "expo-video";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { ArrowLeft, Heart, CalendarDays, Coins, Users, CheckCircle2, Share2, ChevronDown, Video, X } from "lucide-react-native";
import api from "../lib/api";
import DonateModal from "../components/DonateModal";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE_MID = "#4b14bd";
const DARK = "#33245f";
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
function fmtDate(d, lang) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${t(lang, "months_short")[dt.getMonth()]} ${dt.getFullYear()}`;
}
function fmtDonTime(d, lang) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${fmtDate(d, lang)}  •  ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
}

function GalleryVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView style={{ width: "100%", height: "100%" }} player={player} allowsFullscreen contentFit="contain" />;
}

function PhotoThumb({ uri }) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState("loading");
  return (
    <View style={styles.photoThumb}>
      {status !== "error" && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
      {status === "loading" && (
        <ActivityIndicator size="small" color={PURPLE_MID} style={StyleSheet.absoluteFill} />
      )}
      {status === "error" && (
        <View style={[StyleSheet.absoluteFill, styles.photoThumbError]}>
          <Text style={styles.photoThumbErrorText}>{t(lang, "completed_loadFailedLabel")}</Text>
        </View>
      )}
    </View>
  );
}

function VideoModal({ campaign, onClose }) {
  const { lang } = useLanguage();
  if (!campaign) return null;
  const media = campaign.media || [];
  const videoItem = media.find((m) => m.type === "video");
  const photos = media.filter((m) => m.type === "photo");

  return (
    <View style={styles.videoOverlay}>
      <View style={styles.videoHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.videoTitle} numberOfLines={1}>{campaign.animal?.nameAz || t(lang, "donations_animalFallback")} {t(lang, "completed_mediaTitleSuffix")}</Text>
          <Text style={styles.videoSub}>{t(lang, "completed_completedOnTemplate").replace("{date}", fmtDate(campaign.completedAt, lang))}</Text>
        </View>
        <Pressable style={styles.videoCloseBtn} onPress={onClose}>
          <X size={18} color={PURPLE_MID} />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(14), gap: scale(18) }}>
        {!!videoItem && (
          <View>
            <Text style={styles.mediaSectionTitle}>{t(lang, "completed_slaughterVideoTitle")}</Text>
            <View style={styles.videoCard}>
              <GalleryVideo uri={videoItem.url} />
            </View>
          </View>
        )}

        {photos.length > 0 && (
          <View>
            <Text style={styles.mediaSectionTitle}>{t(lang, "completed_photosTitleTemplate").replace("{count}", photos.length)}</Text>
            <View style={styles.photoGrid}>
              {photos.map((m, i) => <PhotoThumb key={i} uri={m.url} />)}
            </View>
          </View>
        )}

        {!!campaign.adminNote && (
          <View style={styles.videoNoteBox}>
            <Text style={styles.videoNoteLabel}>{t(lang, "completed_adminNoteLabel")}</Text>
            <Text style={styles.videoNoteText}>{campaign.adminNote}</Text>
          </View>
        )}

        {media.length === 0 && !campaign.adminNote && (
          <View style={{ paddingVertical: scale(30), alignItems: "center" }}>
            <Text style={{ color: "#8778a8" }}>{t(lang, "completed_noContent")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DonorRow({ d, i, lang }) {
  const c = avatarColor(d.isAnonymous ? null : d.name);
  return (
    <View style={styles.donorRow}>
      <Text style={styles.donorIdx}>{i + 1}</Text>
      <View style={[styles.donorAvatar, { backgroundColor: c.bg }]}>
        <Text style={[styles.donorAvatarText, { color: c.text }]}>{d.isAnonymous ? "AN" : initials(d.name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.donorName} numberOfLines={1}>{d.isAnonymous ? t(lang, "collective_anonymous") : d.name}</Text>
        <Text style={styles.donorTime}>{fmtDonTime(d.paidAt, lang)}</Text>
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
  const { lang } = useLanguage();

  const cardWidth = screenWidth - 24;
  const imgWidth = Math.round((cardWidth * 3) / 5) + 10;
  const ringWidth = cardWidth - imgWidth;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

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
    Share.share({ message: t(lang, "detail_shareMessageTemplate").replace("{type}", campaign?.animal?.nameAz || t(lang, "donations_animalFallback")) }).catch(() => {});
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
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", gap: scale(10) }]}>
        <StatusBar style="dark" />
        <Text style={{ fontSize: scaleFont(32) }}>⚠️</Text>
        <Text style={{ fontWeight: "800", color: DARK }}>{t(lang, "detail_notFoundTitle")}</Text>
        <Pressable style={styles.backFallbackBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={15} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: scaleFont(13) }}>{t(lang, "detail_goBackBtn")}</Text>
        </Pressable>
      </View>
    );
  }

  const isCompleted = campaign.status === "completed";
  const video = (campaign.media || []).find((m) => m.type === "video");
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
          <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { paddingTop: insets.top + 18 }]} numberOfLines={1}>
          {t(lang, "detail_headerTitle")}
        </Text>
        {!isCompleted && (
          <Pressable style={[styles.headerDonateBtn, { marginTop: insets.top + 8 }]} onPress={() => setDonateOpen(true)}>
            <Heart size={15} color="#fff" />
            <Text style={styles.headerDonateText}>{t(lang, "detail_donateBtn")}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: insets.bottom + 20, gap: scale(10) }}>
        <View style={styles.mainCard}>
          <View style={styles.topRow}>
            {campaign.animal?.image ? (
              <Image source={{ uri: campaign.animal.image }} style={[styles.mainImg, { width: imgWidth, flex: undefined }]} resizeMode="cover" />
            ) : (
              <View style={[styles.mainImg, { width: imgWidth, flex: undefined, backgroundColor: "#f5f2ff" }]} />
            )}

            <View style={[styles.statusPanel, { width: ringWidth, flex: undefined }]}>
              {isCompleted ? (
                <View style={{ alignItems: "center", gap: scale(8) }}>
                  <View style={styles.completedBadgeIcon}>
                    <CheckCircle2 size={22} color="#059669" />
                  </View>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>{t(lang, "orderStatus_completed")}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: "center", gap: scale(6) }}>
                  <Text style={styles.ringLabel}>{t(lang, "detail_completionLabel")}</Text>
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
                    <Text style={styles.pendingBadgeText}>{t(lang, "donations_statusCollecting")}</Text>
                  </View>
                </View>
              )}

              <Pressable style={styles.shareBtn} onPress={handleShare}>
                <Share2 size={14} color={PURPLE_MID} />
                <Text style={styles.shareBtnText}>{t(lang, "completed_shareBtn")}</Text>
              </Pressable>

              {isCompleted && (!!video || !!campaign.adminNote) && (
                <Pressable style={styles.videoOpenBtn} onPress={() => setVideoOpen(true)}>
                  <Video size={12} color="#fff" />
                  <Text style={styles.videoOpenBtnText}>{video ? t(lang, "detail_slaughterVideoBtn") : t(lang, "completed_noteBtn")}</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), paddingHorizontal: scale(12), paddingTop: scale(10) }}>
            <Users size={15} color="#5b22c7" />
            <Text style={styles.statValueBold}>{t(lang, "detail_participantsCountTemplate").replace("{count}", campaign.participantCount)}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.animalNameBig}>{campaign.animal?.nameAz || t(lang, "donations_animalFallback")}</Text>
              {!!campaign.animal?.weightRange && (
                <>
                  <Text style={styles.statLabel}>{t(lang, "detail_liveWeightLabel")}</Text>
                  <Text style={styles.statValue}>{campaign.animal.weightRange}</Text>
                </>
              )}
              <Text style={styles.statLabel}>{t(lang, "detail_openDateLabel")}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4) }}>
                <CalendarDays size={14} color="#6840c6" />
                <Text style={styles.statValue}>{fmtDate(campaign.createdAt, lang)}</Text>
              </View>
            </View>

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t(lang, "detail_totalAmountLabel")}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4), marginBottom: isCompleted ? 0 : scale(6) }}>
                <Coins size={15} color="#5b22c7" />
                <Text style={styles.statValueBold}>{campaign.totalAmount} AZN</Text>
              </View>
              {!isCompleted && (
                <>
                  <Text style={styles.statLabel}>{t(lang, "detail_collectedAmountLabel")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4), marginBottom: scale(6) }}>
                    <Coins size={15} color="#5b22c7" />
                    <Text style={styles.statValueBold}>{campaign.collectedAmount} AZN</Text>
                  </View>
                  <Text style={styles.statLabel}>{t(lang, "detail_remainingAmountLabel")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4) }}>
                    <Coins size={15} color="#5b22c7" />
                    <Text style={styles.statValueBold}>{Number((campaign.remainingAmount || 0).toFixed(2))} AZN</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {!!campaign.adminNote && (
          <View style={styles.adminNoteBox}>
            <View style={styles.adminNoteIcon}>
              <Text style={{ fontSize: scaleFont(13), fontWeight: "900", color: "#b45309" }}>!</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminNoteLabel}>{t(lang, "detail_adminNoteLabel")}</Text>
              <Text style={styles.adminNoteText}>{campaign.adminNote}</Text>
            </View>
          </View>
        )}

        {!!openerDon && (
          <View>
            <View style={styles.openerTag}>
              <Text style={styles.openerTagText}>{t(lang, "detail_openerTag")}</Text>
            </View>
            <View style={styles.openerCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1 }}>
                <View style={[styles.donorAvatar, { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: avatarColor(openerDon.isAnonymous ? null : openerDon.name).bg }]}>
                  <Text style={[styles.donorAvatarText, { fontSize: scaleFont(13), color: avatarColor(openerDon.isAnonymous ? null : openerDon.name).text }]}>
                    {openerDon.isAnonymous ? "AN" : initials(openerDon.name)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.openerName} numberOfLines={1}>{openerDon.isAnonymous ? t(lang, "collective_anonymous") : openerDon.name}</Text>
                  <Text style={styles.openerSub}>{t(lang, "detail_openerSub")}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.openerAmount}>{openerDon.amount} AZN <Text style={styles.openerPercent}>({Math.round(openerDon.percent)}%)</Text></Text>
                <Text style={styles.openerDate}>{fmtDate(openerDon.paidAt, lang)}</Text>
              </View>
            </View>
          </View>
        )}

        {otherDons.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t(lang, "detail_otherDonorsTitleTemplate").replace("{count}", otherDons.length)}</Text>
            <View style={styles.donorsCard}>
              {displayDons.map((d, i) => <DonorRow key={d._id || i} d={d} i={i} lang={lang} />)}
              {otherDons.length > 10 && (
                <Pressable style={styles.showMoreBtn} onPress={() => setShowAll((v) => !v)}>
                  <Text style={styles.showMoreText}>{showAll ? t(lang, "detail_showLess") : t(lang, "detail_showMore")}</Text>
                  <ChevronDown size={16} color={PURPLE_MID} style={showAll ? { transform: [{ rotate: "180deg" }] } : null} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {otherDons.length === 0 && !openerDon && (
          <View style={styles.emptyDonors}>
            <Text style={styles.emptyDonorsText}>{t(lang, "detail_noDonorsYet")}</Text>
          </View>
        )}
      </ScrollView>

      <DonateModal
        visible={donateOpen}
        campaign={campaign}
        onClose={() => setDonateOpen(false)}
        onSuccess={handleDonateSuccess}
      />

      {videoOpen && <VideoModal campaign={campaign} onClose={() => setVideoOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfaff" },

  header: { flexDirection: "row", alignItems: "flex-start", gap: scale(8), paddingHorizontal: scale(12), paddingBottom: scale(10), backgroundColor: "rgba(255,255,255,0.9)", borderBottomWidth: 1, borderBottomColor: "#ede9fe" },
  headerBackBtn: {
    position: "absolute",
    left: 0,
    zIndex: 10,
    width: scale(56),
    height: scale(56),
    borderBottomRightRadius: scale(56),
    backgroundColor: PURPLE_MID,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: scaleFont(18.5), fontWeight: "900", color: DARK, paddingLeft: scale(90) },
  headerDonateBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: PURPLE_MID, borderRadius: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(10), marginRight: scale(4) },
  headerDonateText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "800" },
  backFallbackBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: PURPLE_MID, borderRadius: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(9), marginTop: scale(4) },

  mainCard: { backgroundColor: "#fff", borderRadius: scale(14), borderWidth: 1, borderColor: "#e7e1f0", overflow: "hidden" },
  topRow: { flexDirection: "row" },
  mainImg: { flex: 3, height: scale(170) },
  statsRow: { flexDirection: "row", padding: scale(12), gap: scale(12), borderTopWidth: 1, borderTopColor: "#e7e1f0" },
  statCol: { flex: 1 },
  animalNameBig: { fontSize: scaleFont(18.5), fontWeight: "900", color: DARK, marginBottom: scale(7) },
  statLabel: { fontSize: scaleFont(12), fontWeight: "800", color: "#8b7dac" },
  statValue: { fontSize: scaleFont(15), fontWeight: "900", color: DARK, marginBottom: scale(7) },
  statValueBold: { fontSize: scaleFont(15.5), fontWeight: "900", color: DARK },

  statusPanel: { flex: 2, borderLeftWidth: 1, borderLeftColor: "#e7e1f0", padding: scale(12), alignItems: "center", justifyContent: "center", gap: scale(10) },
  ringLabel: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#6e5b9b" },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringPercentText: { position: "absolute", fontSize: scaleFont(24), fontWeight: "900", color: PURPLE_MID },
  pendingBadge: { backgroundColor: "#fffbeb", borderRadius: scale(8), paddingHorizontal: scale(12), paddingVertical: scale(6) },
  pendingBadgeText: { fontSize: scaleFont(13.5), fontWeight: "900", color: "#b45309" },
  completedBadgeIcon: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center" },
  completedBadge: { backgroundColor: "#ecfdf5", borderRadius: scale(999), paddingHorizontal: scale(12), paddingVertical: scale(5) },
  completedBadgeText: { fontSize: scaleFont(13.5), fontWeight: "900", color: "#047857" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), borderWidth: 1, borderColor: "#d9cff0", borderRadius: scale(8), paddingHorizontal: scale(16), paddingVertical: scale(9) },
  shareBtnText: { fontSize: scaleFont(13.5), fontWeight: "800", color: PURPLE_MID },
  videoOpenBtn: { flexDirection: "row", alignItems: "center", gap: scale(5), backgroundColor: "#1d4ed8", borderRadius: scale(8), paddingHorizontal: scale(10), paddingVertical: scale(8) },
  videoOpenBtnText: { fontSize: scaleFont(11.5), fontWeight: "800", color: "#fff" },

  adminNoteBox: { flexDirection: "row", gap: scale(10), backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: scale(14), padding: scale(13) },
  adminNoteIcon: { width: scale(30), height: scale(30), borderRadius: scale(15), backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center" },
  adminNoteLabel: { fontSize: scaleFont(13.5), fontWeight: "900", color: "#b45309", marginBottom: scale(2) },
  adminNoteText: { fontSize: scaleFont(15), color: "#92400e", lineHeight: moderateScale(20) },

  openerTag: { alignSelf: "flex-start", backgroundColor: PURPLE_MID, borderTopLeftRadius: scale(8), borderTopRightRadius: scale(8), paddingHorizontal: scale(12), paddingVertical: scale(7) },
  openerTagText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "900" },
  openerCard: { flexDirection: "row", alignItems: "center", gap: scale(8), backgroundColor: "#f5f0ff", borderWidth: 1, borderColor: "#e1d8ee", borderBottomLeftRadius: scale(12), borderBottomRightRadius: scale(12), borderTopRightRadius: scale(12), padding: scale(13) },
  openerName: { fontSize: scaleFont(16), fontWeight: "900", color: DARK },
  openerSub: { fontSize: scaleFont(13.5), fontWeight: "700", color: "#6f6290", marginTop: scale(1) },
  openerAmount: { fontSize: scaleFont(18), fontWeight: "900", color: "#24124f" },
  openerPercent: { fontSize: scaleFont(14), fontWeight: "700", color: "#5b22c7" },
  openerDate: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#4f4075", marginTop: scale(2) },

  sectionTitle: { fontSize: scaleFont(16), fontWeight: "900", color: DARK, marginBottom: scale(7) },
  donorsCard: { backgroundColor: "#fff", borderRadius: scale(14), borderWidth: 1, borderColor: "#e7e1f0", overflow: "hidden" },
  donorRow: { flexDirection: "row", alignItems: "center", gap: scale(8), paddingHorizontal: scale(12), paddingVertical: scale(12), borderBottomWidth: 1, borderBottomColor: "#f0ebff" },
  donorIdx: { fontSize: scaleFont(13.5), fontWeight: "900", color: DARK, width: scale(18) },
  donorAvatar: { width: scale(32), height: scale(32), borderRadius: scale(16), alignItems: "center", justifyContent: "center" },
  donorAvatarText: { fontSize: scaleFont(12), fontWeight: "800" },
  donorName: { fontSize: scaleFont(15), fontWeight: "700", color: DARK },
  donorTime: { fontSize: scaleFont(12.5), color: "#4f4075", marginTop: scale(1) },
  donorAmount: { fontSize: scaleFont(15.5), fontWeight: "900", color: DARK },
  donorPercent: { fontSize: scaleFont(13), fontWeight: "700", color: "#5b22c7", marginTop: scale(1) },
  showMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), paddingVertical: scale(14) },
  showMoreText: { fontSize: scaleFont(15.5), fontWeight: "900", color: PURPLE_MID },

  emptyDonors: { borderWidth: 1, borderStyle: "dashed", borderColor: "#d8cdec", borderRadius: scale(16), paddingVertical: scale(30), alignItems: "center" },
  emptyDonorsText: { fontSize: scaleFont(15.5), color: "#77689c" },

  videoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 200 },
  videoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: scale(10), paddingHorizontal: scale(16), paddingVertical: scale(40), borderBottomWidth: 1, borderBottomColor: "#e7e1f0", backgroundColor: "#f5f3ff" },
  videoTitle: { flex: 1, fontSize: scaleFont(17.5), fontWeight: "900", color: DARK },
  videoSub: { fontSize: scaleFont(13), color: "#8778a8", marginTop: scale(2) },
  videoCloseBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },

  mediaSectionTitle: { fontSize: scaleFont(14.5), fontWeight: "800", color: DARK, marginBottom: scale(8) },
  videoCard: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: scale(14), overflow: "hidden" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  photoThumb: { width: "48%", aspectRatio: 1, borderRadius: scale(12), backgroundColor: "#f5f2ff", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  photoThumbError: { backgroundColor: "#f5f2ff", alignItems: "center", justifyContent: "center" },
  photoThumbErrorText: { fontSize: scaleFont(12), fontWeight: "700", color: "#a78bfa" },
  videoNoteBox: { backgroundColor: "#fffbeb", borderRadius: scale(14), padding: scale(16) },
  videoNoteLabel: { fontSize: scaleFont(13.5), fontWeight: "900", color: "#b45309", marginBottom: scale(4) },
  videoNoteText: { fontSize: scaleFont(15.5), color: "#92400e", lineHeight: moderateScale(21) },
});
