import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Share, StyleSheet, Platform } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { VideoView, useVideoPlayer } from "expo-video";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Menu, User, Wallet, Flag, Users, Video, Share2, X } from "lucide-react-native";
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

const CAMPAIGN_STATUS_MAP = { collecting: "Davam edir", completed: "Tamamlandı", cancelled: "Ləğv olundu" };
const STATUS_CFG = {
  "Tamamlandı": { label: "Tamamlanıb", bg: "#ecfdf5", color: "#047857", ring: "#2f8b58", track: "#dff4e9" },
  "Davam edir": { label: "Açılış davam edir", bg: "#fffbeb", color: "#b45309", ring: "#5a19c9", track: "#eee4ff" },
  "Ləğv olundu": { label: "Ləğv olundu", bg: "#fff1f2", color: "#e11d48", ring: "#fb4c61", track: "#ffe0e5" },
};
const TABS = [
  { key: "all", label: "Hamısı" },
  { key: "opener", label: "Açdığım" },
  { key: "donor", label: "İştirak" },
];
const STATUS_OPTIONS = ["Hamısı", "Davam edir", "Tamamlandı", "Ləğv olundu"];

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${AZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function mapMyCampaign(c) {
  const video = (c.media || []).find((m) => m.type === "video");
  return {
    id: c._id,
    type: c.animal?.nameAz || "Qurban",
    amount: c.myPaidAmount ?? 0,
    collectedAmount: c.collectedAmount,
    totalAmount: c.totalAmount,
    progressPercent: c.percent || 0,
    startDate: fmtDate(c.createdAt),
    status: CAMPAIGN_STATUS_MAP[c.status] || "Davam edir",
    createdAtRaw: c.createdAt || null,
    organizer: c.iAmOpener ? "Siz açmısınız" : "Siz iştirak etmisiniz",
    img: c.animal?.image || null,
    videoUrl: video?.url || null,
    media: c.media || [],
    weightRange: c.animal?.weightRange || "",
    iAmOpener: !!c.iAmOpener,
  };
}

function CircularProgress({ percent, status }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const cfg = STATUS_CFG[status] || STATUS_CFG["Davam edir"];
  if (status === "Ləğv olundu") {
    return (
      <View style={{ alignItems: "center", gap: 4 }}>
        <View style={styles.cancelRing}>
          <X size={18} color="#e11d48" />
        </View>
        <Text style={styles.cancelRingLabel}>Ləğv olundu</Text>
      </View>
    );
  }
  const progress = (Math.min(percent, 100) / 100) * c;
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      <View style={{ width: 60, height: 60, alignItems: "center", justifyContent: "center" }}>
        <Svg width={60} height={60} style={{ position: "absolute" }}>
          <Circle cx={30} cy={30} r={r} stroke={cfg.track} strokeWidth={6} fill="none" />
          <Circle
            cx={30} cy={30} r={r} stroke={cfg.ring} strokeWidth={6} fill="none"
            strokeDasharray={`${progress} ${c - progress}`}
            strokeLinecap="round"
            rotation={-90}
            origin="30, 30"
          />
        </Svg>
        <Text style={{ fontSize: 13, fontWeight: "800", color: cfg.ring }}>{percent}%</Text>
      </View>
      <Text style={styles.ringSmallLabel}>Tamamlanma</Text>
    </View>
  );
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
        <Text style={styles.videoTitle} numberOfLines={1}>{item.type} — Kəsim Videosu</Text>
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
      </ScrollView>
    </View>
  );
}

function DonationCard({ item, onOpen, onVideo, onShare }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG["Davam edir"];
  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardImgWrap}>
          {item.img ? <Image source={{ uri: item.img }} style={styles.cardImg} resizeMode="cover" /> : null}
        </View>
        <View style={styles.cardRingWrap}>
          <CircularProgress percent={item.progressPercent} status={item.status} />
        </View>
      </View>

      <View style={{ padding: 12, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.cardTitle}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={styles.organizerText} numberOfLines={1}>{item.organizer}</Text>
        {!!item.weightRange && (
          <Text style={styles.weightText}>Diri çəki: <Text style={{ fontWeight: "800", color: "#5b22c7" }}>{item.weightRange}</Text></Text>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statCellLabel}>İanəniz</Text>
            <Text style={styles.statCellValue}>{item.amount} AZN</Text>
          </View>
          {item.status !== "Tamamlandı" && (
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>Toplanan</Text>
              <Text style={styles.statCellValue}>{item.collectedAmount} AZN</Text>
            </View>
          )}
          <View style={styles.statCell}>
            <Text style={styles.statCellLabel}>Ümumi</Text>
            <Text style={styles.statCellValue}>{item.totalAmount} AZN</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
          <Pressable style={styles.actionBtnPurple} onPress={() => onOpen(item)}>
            <Users size={12} color="#fff" />
            <Text style={styles.actionBtnText}>İştirakçılara bax</Text>
          </Pressable>
          {item.status === "Tamamlandı" && item.videoUrl && (
            <Pressable style={styles.actionBtnBlue} onPress={() => onVideo(item)}>
              <Video size={12} color="#fff" />
              <Text style={styles.actionBtnText}>Video</Text>
            </Pressable>
          )}
          {item.status !== "Ləğv olundu" && (
            <Pressable style={styles.actionBtnOutline} onPress={() => onShare(item)}>
              <Share2 size={11} color={PURPLE_MID} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MyDonationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("Hamısı");
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
    if (isGuest) {
      setLoading(false);
      return;
    }
    api.get("/campaigns/my")
      .then((res) => setOrders((res.data?.data?.campaigns || []).map(mapMyCampaign)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isGuest]);

  const handleOpen = (item) => navigation.navigate("CampaignDetail", { campaignId: item.id });
  const handleShare = (item) => {
    Share.share({ message: `MeatBox Kollektiv Qurban — ${item.type} açılışına qatıl!` }).catch(() => {});
  };

  if (isGuest) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
              <Menu size={20} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>İanələrim</Text>
          </View>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
            <User size={18} color="#fff" />
            <Text style={styles.loginText}>Daxil ol</Text>
          </Pressable>
        </View>
        <CollectiveSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <Users size={32} color={PURPLE_MID} />
          </View>
          <Text style={styles.guestTitle}>Giriş tələb olunur</Text>
          <Text style={styles.guestSub}>İanələrim səhifəsini görmək üçün qeydiyyatdan keçin və ya hesabınıza daxil olun.</Text>
          <Pressable style={styles.guestRegisterBtn} onPress={() => navigation.navigate("Register")}>
            <Text style={styles.guestRegisterText}>Qeydiyyatdan keç</Text>
          </Pressable>
          <Pressable style={styles.guestLoginBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.guestLoginText}>Daxil ol</Text>
          </Pressable>
        </View>

        <CollectiveBottomNav active="MyDonations" />
      </View>
    );
  }

  const totalPaid = orders.reduce((s, o) => s + o.amount, 0);
  const STATUS_PRIORITY = { "Davam edir": 0, "Ləğv olundu": 1, "Tamamlandı": 2 };
  const filtered = orders
    .filter((item) => {
      const tabMatch =
        activeTab === "all" ||
        (activeTab === "opener" && item.iAmOpener === true) ||
        (activeTab === "donor" && item.iAmOpener === false);
      return tabMatch && (statusFilter === "Hamısı" || item.status === statusFilter);
    })
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 1;
      const pb = STATUS_PRIORITY[b.status] ?? 1;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAtRaw || 0) - new Date(a.createdAtRaw || 0);
    });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>İanələrim</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={PURPLE} iconColor="#fff" />
          <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
        </View>
      </View>

      <CollectiveSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 20 }}>
        <View style={styles.statsRow}>
          <View style={styles.statTop}>
            <View style={styles.statTopIcon}>
              <Wallet size={20} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.statTopLabel} numberOfLines={1}>Cəmi ianə</Text>
              <Text style={styles.statTopValue}>{totalPaid.toFixed(2)} AZN</Text>
            </View>
          </View>
          <View style={styles.statTop}>
            <View style={styles.statTopIcon}>
              <Flag size={20} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.statTopLabel} numberOfLines={1}>Ümumi sayı</Text>
              <Text style={styles.statTopValue}>{orders.length}</Text>
            </View>
          </View>
          <View style={styles.statTop}>
            <View style={styles.statTopIcon}>
              <Users size={20} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.statTopLabel} numberOfLines={1}>Tamamlanmış</Text>
              <Text style={styles.statTopValue}>{orders.filter((o) => o.status === "Tamamlandı").length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabBtnText, activeTab === t.key && { color: "#fff" }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8, marginBottom: 6 }}>
          {STATUS_OPTIONS.map((s) => (
            <Pressable
              key={s}
              style={[styles.statusPill, statusFilter === s && styles.statusPillActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.statusPillText, statusFilter === s && { color: "#fff" }]}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: 30 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {orders.length === 0 ? "Hələ heç bir ianəniz yoxdur." : "Seçilmiş filterlərə uyğun ianə tapılmadı."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 4 }}>
            {filtered.map((item) => (
              <DonationCard key={item.id} item={item} onOpen={handleOpen} onVideo={setVideoTarget} onShare={handleShare} />
            ))}
          </View>
        )}
      </ScrollView>

      <CollectiveBottomNav active="MyDonations" />

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
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  loginText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 8 },
  guestIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#ede9fe", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  guestTitle: { fontSize: 18, fontWeight: "900", color: DARK },
  guestSub: { fontSize: 13, color: "#77689c", textAlign: "center", lineHeight: 19, marginBottom: 10 },
  guestRegisterBtn: { width: "100%", maxWidth: 220, backgroundColor: PURPLE_MID, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  guestRegisterText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  guestLoginBtn: { width: "100%", maxWidth: 220, borderWidth: 1, borderColor: "#d9cff0", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  guestLoginText: { color: PURPLE_MID, fontSize: 14, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 8 },
  statTop: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e7e1f0", padding: 10 },
  statTopIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  statTopLabel: { fontSize: 9.5, fontWeight: "700", color: "#8778a8" },
  statTopValue: { fontSize: 13, fontWeight: "900", color: "#24124f", marginTop: 2 },

  tabRow: { flexDirection: "row", gap: 4, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e7e1f0", padding: 4, marginTop: 12 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 9 },
  tabBtnActive: { backgroundColor: PURPLE_MID },
  tabBtnText: { fontSize: 11.5, fontWeight: "700", color: "#4c3b77" },

  statusPill: { borderWidth: 1, borderColor: "#e7e1f0", backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  statusPillActive: { backgroundColor: PURPLE_MID, borderColor: PURPLE_MID },
  statusPillText: { fontSize: 11, fontWeight: "700", color: "#4c3b77" },

  emptyBox: { borderWidth: 1, borderStyle: "dashed", borderColor: "#d8cdec", borderRadius: 16, paddingVertical: 40, alignItems: "center", marginTop: 10 },
  emptyText: { fontSize: 13, color: "#77689c", textAlign: "center", paddingHorizontal: 20 },

  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#ece6f5", overflow: "hidden" },
  cardTopRow: { flexDirection: "row", height: 120 },
  cardImgWrap: { flex: 2, backgroundColor: "#f5f2ff" },
  cardImg: { width: "100%", height: "100%" },
  cardRingWrap: { flex: 1, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "#eee8f6" },
  ringSmallLabel: { fontSize: 8, fontWeight: "700", color: "#4d3678" },
  cancelRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 5, borderColor: "#fecdd3", alignItems: "center", justifyContent: "center" },
  cancelRingLabel: { fontSize: 9, fontWeight: "700", color: "#e11d48" },

  cardTitle: { fontSize: 14, fontWeight: "800", color: DARK },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusBadgeText: { fontSize: 9.5, fontWeight: "700" },
  organizerText: { fontSize: 10.5, color: "#77689c" },
  weightText: { fontSize: 10.5, color: "#8778a8" },

  statsGrid: { flexDirection: "row", gap: 10, marginTop: 4 },
  statCell: { flex: 1 },
  statCellLabel: { fontSize: 9, color: "#8778a8" },
  statCellValue: { fontSize: 11.5, fontWeight: "800", color: DARK, marginTop: 1 },

  actionBtnPurple: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 30, borderRadius: 8, backgroundColor: PURPLE_MID },
  actionBtnBlue: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 30, borderRadius: 8, backgroundColor: "#1d4ed8" },
  actionBtnText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  actionBtnOutline: { width: 34, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#bcaee4" },

  videoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 200 },
  videoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 16, paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: "#e7e1f0", backgroundColor: "#f5f3ff" },
  videoTitle: { flex: 1, fontSize: 14, fontWeight: "900", color: DARK },
  videoCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
});
