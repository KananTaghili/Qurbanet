import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Share, Alert, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import { ArrowLeft, User, CheckCircle, Users, Video, Copy, X } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE = "#301586";
const PURPLE_MID = "#4b14bd";
const DARK = "#33245f";

function fmtDate(d, lang) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${t(lang, "months_short")[dt.getMonth()]} ${dt.getFullYear()}`;
}

function mapCompleted(c, lang) {
  const video = (c.media || []).find((m) => m.type === "video");
  return {
    id: c._id,
    type: c.animal?.nameAz || t(lang, "donations_animalFallback"),
    collectedAmount: c.collectedAmount,
    totalAmount: c.totalAmount,
    date: fmtDate(c.completedAt, lang),
    organizer: c.opener?.isAnonymous ? t(lang, "completed_anonymousOrganizer") : ([c.opener?.name].filter(Boolean).join(" ") || "—"),
    participants: c.participantCount || 0,
    img: c.animal?.image || null,
    videoUrl: video?.url || null,
    media: c.media || [],
    adminNote: c.adminNote || null,
    donations: c.donations || [],
  };
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

function VideoModal({ item, onClose }) {
  const { lang } = useLanguage();
  if (!item) return null;
  const media = item.media?.length ? item.media : item.videoUrl ? [{ type: "video", url: item.videoUrl }] : [];
  const videoItem = media.find((m) => m.type === "video");
  const photos = media.filter((m) => m.type === "photo");

  return (
    <View style={styles.videoOverlay}>
      <View style={styles.videoHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.videoTitle} numberOfLines={1}>{item.type} {t(lang, "completed_mediaTitleSuffix")}</Text>
          <Text style={styles.videoSub}>{t(lang, "completed_completedOnTemplate").replace("{date}", item.date)}</Text>
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

        {!!item.adminNote && (
          <View style={styles.videoNoteBox}>
            <Text style={styles.videoNoteLabel}>{t(lang, "completed_adminNoteLabel")}</Text>
            <Text style={styles.videoNoteText}>{item.adminNote}</Text>
          </View>
        )}

        {media.length === 0 && !item.adminNote && (
          <View style={{ paddingVertical: scale(30), alignItems: "center" }}>
            <Text style={{ color: "#8778a8" }}>{t(lang, "completed_noContent")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CompletedCard({ item, onOpen, onVideo, onShare, lang }) {
  const openerDon = item.donations.find((d) => d.isOpener);
  const paidPct = openerDon ? Math.round(openerDon.percent || 0) : 0;
  const displayAmt = openerDon ? openerDon.amount : item.collectedAmount;
  const initials = (item.organizer || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.coverWrap}>
        {item.img ? (
          <Image source={{ uri: item.img }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={[styles.coverImg, { backgroundColor: "#f5f2ff" }]} />
        )}
        <View style={styles.coverOverlay} />
        <View style={styles.coverBottomRow}>
          <Text style={styles.coverTitle} numberOfLines={1}>{item.type}</Text>
          <View style={styles.completedBadge}>
            <CheckCircle size={13} color="#fff" />
            <Text style={styles.completedBadgeText}>{t(lang, "orderStatus_completed")}</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: scale(12), gap: scale(10) }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
          <View style={styles.openerAvatar}>
            <Text style={styles.openerAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.openerName} numberOfLines={1}>{item.organizer}</Text>
          <View style={styles.percentBadge}>
            <Text style={styles.percentBadgeText}>{paidPct}% · {displayAmt} AZN</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>{t(lang, "completed_dateLabel")}</Text>
            <Text style={styles.statChipValue}>{item.date}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>{t(lang, "completed_participantsLabel")}</Text>
            <Text style={styles.statChipValue}>{item.participants} {t(lang, "completed_personSuffix")}</Text>
          </View>
          <View style={[styles.statChip, styles.statChipGreen]}>
            <Text style={[styles.statChipLabel, { color: "#059669" }]}>{t(lang, "completed_amountLabel")}</Text>
            <Text style={[styles.statChipValue, { color: "#047857" }]}>{item.totalAmount} AZN</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: scale(6) }}>
          <Pressable style={styles.actionBtnPurple} onPress={() => onOpen(item)}>
            <Users size={14} color="#fff" />
            <Text style={styles.actionBtnText}>{t(lang, "completed_participantsBtn")}</Text>
          </Pressable>
          {(item.videoUrl || item.media?.length > 0 || item.adminNote) && (
            <Pressable style={styles.actionBtnGreen} onPress={() => onVideo(item)}>
              <Video size={14} color="#fff" />
              <Text style={styles.actionBtnText}>{item.videoUrl || item.media?.length ? t(lang, "myOrders_videoLabel") : t(lang, "completed_noteBtn")}</Text>
            </Pressable>
          )}
          <Pressable style={styles.actionBtnOutline} onPress={() => onShare(item)}>
            <Copy size={13} color={PURPLE_MID} />
            <Text style={styles.actionBtnOutlineText}>{t(lang, "completed_shareBtn")}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function CompletedCampaignsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const { lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoTarget, setVideoTarget] = useState(null);

  const initials = getInitials(user);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    api.get("/campaigns/completed")
      .then((res) => setOrders((res.data?.data?.campaigns || []).map((c) => mapCompleted(c, lang))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lang]);

  const handleOpen = (item) => navigation.navigate("CampaignDetail", { campaignId: item.id });
  const handleShare = (item) => {
    Share.share({ message: t(lang, "completed_shareMessageTemplate").replace("{type}", item.type) }).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "completed_headerTitle")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={PURPLE} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={22} color="#fff" />
              <Text style={styles.loginText}>{t(lang, "login")}</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

<ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: scale(20) }}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <CheckCircle size={26} color="#fff" />
          </View>
          <View>
            <Text style={styles.statLabel}>{t(lang, "completed_statLabel")}</Text>
            <Text style={styles.statValue}>{orders.length}</Text>
          </View>
        </View>

        <View style={{ marginTop: scale(12), marginBottom: scale(8) }}>
          <Text style={styles.sectionTitle}>{t(lang, "completed_sectionTitle")}</Text>
          <Text style={styles.sectionSub}>{t(lang, "completed_sectionSub")}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: scale(30) }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t(lang, "completed_emptyText")}</Text>
          </View>
        ) : (
          <View style={{ gap: scale(10) }}>
            {orders.map((item) => (
              <CompletedCard key={item.id} item={item} onOpen={handleOpen} onVideo={setVideoTarget} onShare={handleShare} lang={lang} />
            ))}
          </View>
        )}
      </ScrollView>

      <CollectiveBottomNav active="CompletedCampaigns" />

      {videoTarget && <VideoModal item={videoTarget} onClose={() => setVideoTarget(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfaff" },

  header: {
    backgroundColor: PURPLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(10), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  statCard: { flexDirection: "row", alignItems: "center", gap: scale(14), backgroundColor: "#fff", borderRadius: scale(14), borderWidth: 1, borderColor: "#e7e1f0", padding: scale(16) },
  statIcon: { width: scale(52), height: scale(52), borderRadius: scale(26), backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: scaleFont(13.5), fontWeight: "800", color: DARK },
  statValue: { fontSize: scaleFont(26), fontWeight: "900", color: "#24124f", marginTop: scale(2) },

  sectionTitle: { fontSize: scaleFont(19.5), fontWeight: "900", color: DARK },
  sectionSub: { fontSize: scaleFont(14), color: "#8778a8", marginTop: scale(2) },

  emptyBox: { borderWidth: 1, borderStyle: "dashed", borderColor: "#d8cdec", borderRadius: scale(16), paddingVertical: scale(40), alignItems: "center" },
  emptyText: { fontSize: scaleFont(15.5), color: "#77689c" },

  card: { backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#ece6f5", overflow: "hidden" },
  coverWrap: { width: "100%", height: scale(150), backgroundColor: "#f5f2ff", position: "relative" },
  coverImg: { width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(20,8,60,0.35)" },
  coverBottomRow: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: scale(12), paddingBottom: scale(10) },
  coverTitle: { fontSize: scaleFont(23), fontWeight: "900", color: "#fff", flex: 1 },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: scale(4), backgroundColor: "#10b981", borderRadius: scale(999), paddingHorizontal: scale(11), paddingVertical: scale(5) },
  completedBadgeText: { fontSize: scaleFont(12), fontWeight: "800", color: "#fff" },

  openerAvatar: { width: scale(30), height: scale(30), borderRadius: scale(15), backgroundColor: "#f3e8ff", alignItems: "center", justifyContent: "center" },
  openerAvatarText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#6d28d9" },
  openerName: { flex: 1, fontSize: scaleFont(15), fontWeight: "700", color: DARK },
  percentBadge: { backgroundColor: "#f1ecff", borderRadius: scale(999), paddingHorizontal: scale(10), paddingVertical: scale(5) },
  percentBadgeText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#5622c6" },

  statsRow: { flexDirection: "row", gap: scale(6) },
  statChip: { flex: 1, backgroundColor: "#f8f6ff", borderRadius: scale(10), paddingHorizontal: scale(8), paddingVertical: scale(9) },
  statChipGreen: { backgroundColor: "#ecfdf5" },
  statChipLabel: { fontSize: scaleFont(11.5), fontWeight: "700", color: "#8778a8" },
  statChipValue: { fontSize: scaleFont(13.5), fontWeight: "800", color: DARK, marginTop: scale(2) },

  actionBtnPurple: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), height: scale(39), borderRadius: scale(10), backgroundColor: PURPLE_MID },
  actionBtnGreen: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), height: scale(39), borderRadius: scale(10), backgroundColor: "#059669" },
  actionBtnText: { fontSize: scaleFont(13), fontWeight: "800", color: "#fff" },
  actionBtnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), height: scale(39), borderRadius: scale(10), borderWidth: 1, borderColor: "#d9cff0", paddingHorizontal: scale(14) },
  actionBtnOutlineText: { fontSize: scaleFont(13), fontWeight: "800", color: PURPLE_MID },

  videoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 200 },
  videoHeader: { flexDirection: "row", alignItems: "center", gap: scale(10), paddingHorizontal: scale(16), paddingVertical: scale(40), borderBottomWidth: 1, borderBottomColor: "#e7e1f0", backgroundColor: "#f5f3ff" },
  videoTitle: { fontSize: scaleFont(17.5), fontWeight: "900", color: DARK },
  videoSub: { fontSize: scaleFont(13), color: "#8778a8", marginTop: scale(2) },
  videoCloseBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
  videoNoteBox: { backgroundColor: "#fffbeb", borderRadius: scale(14), padding: scale(16) },
  videoNoteLabel: { fontSize: scaleFont(13.5), fontWeight: "900", color: "#b45309", marginBottom: scale(4) },
  videoNoteText: { fontSize: scaleFont(15.5), color: "#92400e", lineHeight: moderateScale(21) },

  mediaSectionTitle: { fontSize: scaleFont(14.5), fontWeight: "800", color: DARK, marginBottom: scale(8) },
  videoCard: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: scale(14), overflow: "hidden" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  photoThumb: { width: "48%", aspectRatio: 1, borderRadius: scale(12), backgroundColor: "#f5f2ff", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  photoThumbError: { backgroundColor: "#f5f2ff", alignItems: "center", justifyContent: "center" },
  photoThumbErrorText: { fontSize: scaleFont(12), fontWeight: "700", color: "#a78bfa" },
});
