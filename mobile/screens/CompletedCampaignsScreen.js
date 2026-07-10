import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Share, Alert, StyleSheet, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import { Menu, User, CheckCircle, Users, Video, Copy, X } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import CollectiveSideMenu from "../components/CollectiveSideMenu";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import CollectiveBottomNav from "../components/CollectiveBottomNav";
import api from "../lib/api";

const PURPLE = "#301586";
const PURPLE_MID = "#4b14bd";
const DARK = "#33245f";
const AZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${AZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function mapCompleted(c) {
  const video = (c.media || []).find((m) => m.type === "video");
  return {
    id: c._id,
    type: c.animal?.nameAz || "Qurban",
    collectedAmount: c.collectedAmount,
    totalAmount: c.totalAmount,
    date: fmtDate(c.completedAt),
    organizer: c.opener?.isAnonymous ? "Anonim" : ([c.opener?.name].filter(Boolean).join(" ") || "—"),
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

function VideoModal({ item, onClose }) {
  if (!item) return null;
  const media = item.media?.length ? item.media : item.videoUrl ? [{ type: "video", url: item.videoUrl }] : [];
  return (
    <View style={styles.videoOverlay}>
      <View style={styles.videoHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.videoTitle} numberOfLines={1}>{item.type} — Kəsim Videosu</Text>
          <Text style={styles.videoSub}>{item.date} tarixində tamamlanmış qurbanlıq</Text>
        </View>
        <Pressable style={styles.videoCloseBtn} onPress={onClose}>
          <X size={16} color={PURPLE_MID} />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {media.map((m, i) =>
          m.type === "video" ? (
            <View key={i} style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" }}>
              <GalleryVideo uri={m.url} />
            </View>
          ) : (
            <Image key={i} source={{ uri: m.url }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
          )
        )}
        {!!item.adminNote && (
          <View style={styles.videoNoteBox}>
            <Text style={styles.videoNoteLabel}>Admin Qeydi</Text>
            <Text style={styles.videoNoteText}>{item.adminNote}</Text>
          </View>
        )}
        {media.length === 0 && !item.adminNote && (
          <View style={{ padding: 30, alignItems: "center" }}>
            <Text style={{ color: "#8778a8" }}>Məzmun yoxdur</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CompletedCard({ item, onOpen, onVideo, onShare }) {
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
            <CheckCircle size={11} color="#fff" />
            <Text style={styles.completedBadgeText}>Tamamlandı</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 12, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            <Text style={styles.statChipLabel}>Tarix</Text>
            <Text style={styles.statChipValue}>{item.date}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>İştirakçı</Text>
            <Text style={styles.statChipValue}>{item.participants} nəfər</Text>
          </View>
          <View style={[styles.statChip, styles.statChipGreen]}>
            <Text style={[styles.statChipLabel, { color: "#059669" }]}>Məbləğ</Text>
            <Text style={[styles.statChipValue, { color: "#047857" }]}>{item.totalAmount} AZN</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable style={styles.actionBtnPurple} onPress={() => onOpen(item)}>
            <Users size={12} color="#fff" />
            <Text style={styles.actionBtnText}>İştirakçılar</Text>
          </Pressable>
          {(item.videoUrl || item.media?.length > 0 || item.adminNote) && (
            <Pressable style={styles.actionBtnGreen} onPress={() => onVideo(item)}>
              <Video size={12} color="#fff" />
              <Text style={styles.actionBtnText}>{item.videoUrl || item.media?.length ? "Video" : "Qeyd"}</Text>
            </Pressable>
          )}
          <Pressable style={styles.actionBtnOutline} onPress={() => onShare(item)}>
            <Copy size={11} color={PURPLE_MID} />
            <Text style={styles.actionBtnOutlineText}>Paylaş</Text>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoTarget, setVideoTarget] = useState(null);

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    api.get("/campaigns/completed")
      .then((res) => setOrders((res.data?.data?.campaigns || []).map(mapCompleted)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = (item) => navigation.navigate("CampaignDetail", { campaignId: item.id });
  const handleShare = (item) => {
    Share.share({ message: `MeatBox Kollektiv Qurban — ${item.type} açılışı tamamlandı!` }).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Tamamlanmış</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={PURPLE} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={18} color="#fff" />
              <Text style={styles.loginText}>Daxil ol</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

      <CollectiveSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <CheckCircle size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.statLabel}>Ümumi tamamlanmış açılış sayı</Text>
            <Text style={styles.statValue}>{orders.length}</Text>
          </View>
        </View>

        <View style={{ marginTop: 12, marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Tamamlanmış Açılışlar</Text>
          <Text style={styles.sectionSub}>Açılışlar tamamlanma vaxtına görə sıralanıb</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: 30 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Hələ tamamlanmış açılış yoxdur.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {orders.map((item) => (
              <CompletedCard key={item.id} item={item} onOpen={handleOpen} onVideo={setVideoTarget} onShare={handleShare} />
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
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  menuBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 5 },
  loginText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  statCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e7e1f0", padding: 14 },
  statIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 11, fontWeight: "800", color: DARK },
  statValue: { fontSize: 22, fontWeight: "900", color: "#24124f", marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: DARK },
  sectionSub: { fontSize: 11.5, color: "#8778a8", marginTop: 2 },

  emptyBox: { borderWidth: 1, borderStyle: "dashed", borderColor: "#d8cdec", borderRadius: 16, paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 13, color: "#77689c" },

  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#ece6f5", overflow: "hidden" },
  coverWrap: { width: "100%", height: 150, backgroundColor: "#f5f2ff", position: "relative" },
  coverImg: { width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(20,8,60,0.35)" },
  coverBottomRow: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 10 },
  coverTitle: { fontSize: 19, fontWeight: "900", color: "#fff", flex: 1 },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10b981", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  completedBadgeText: { fontSize: 9.5, fontWeight: "800", color: "#fff" },

  openerAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#f3e8ff", alignItems: "center", justifyContent: "center" },
  openerAvatarText: { fontSize: 10, fontWeight: "800", color: "#6d28d9" },
  openerName: { flex: 1, fontSize: 12, fontWeight: "700", color: DARK },
  percentBadge: { backgroundColor: "#f1ecff", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  percentBadgeText: { fontSize: 10, fontWeight: "800", color: "#5622c6" },

  statsRow: { flexDirection: "row", gap: 6 },
  statChip: { flex: 1, backgroundColor: "#f8f6ff", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
  statChipGreen: { backgroundColor: "#ecfdf5" },
  statChipLabel: { fontSize: 9, fontWeight: "700", color: "#8778a8" },
  statChipValue: { fontSize: 11, fontWeight: "800", color: DARK, marginTop: 2 },

  actionBtnPurple: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 32, borderRadius: 10, backgroundColor: PURPLE_MID },
  actionBtnGreen: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 32, borderRadius: 10, backgroundColor: "#059669" },
  actionBtnText: { fontSize: 10.5, fontWeight: "800", color: "#fff" },
  actionBtnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 32, borderRadius: 10, borderWidth: 1, borderColor: "#d9cff0", paddingHorizontal: 12 },
  actionBtnOutlineText: { fontSize: 10.5, fontWeight: "800", color: PURPLE_MID },

  videoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 200 },
  videoHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: "#e7e1f0", backgroundColor: "#f5f3ff" },
  videoTitle: { fontSize: 14, fontWeight: "900", color: DARK },
  videoSub: { fontSize: 10.5, color: "#8778a8", marginTop: 2 },
  videoCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
  videoNoteBox: { margin: 16, backgroundColor: "#fffbeb", borderRadius: 14, padding: 14 },
  videoNoteLabel: { fontSize: 11, fontWeight: "900", color: "#b45309", marginBottom: 4 },
  videoNoteText: { fontSize: 13, color: "#92400e", lineHeight: 19 },
});
