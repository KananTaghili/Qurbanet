import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Share, StyleSheet, Platform, Modal } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { VideoView, useVideoPlayer } from "expo-video";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { ArrowLeft, User, Wallet, Flag, Users, Video, Share2, X, ChevronDown, ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react-native";
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

const STATUS_CFG = {
  completed: { bg: "#ecfdf5", color: "#047857", ring: "#2f8b58", track: "#dff4e9" },
  collecting: { bg: "#fffbeb", color: "#b45309", ring: "#5a19c9", track: "#eee4ff" },
  cancelled: { bg: "#fff1f2", color: "#e11d48", ring: "#fb4c61", track: "#ffe0e5" },
};
function tabs(lang) {
  return [
    { key: "all", label: t(lang, "donations_tabAll") },
    { key: "opener", label: t(lang, "donations_tabOpener") },
    { key: "donor", label: t(lang, "donations_tabDonor") },
  ];
}
const STATUS_OPTIONS = ["all", "collecting", "completed", "cancelled"];
const STATUS_META = {
  all: { Icon: ClipboardList },
  collecting: { Icon: Clock },
  completed: { Icon: CheckCircle2 },
  cancelled: { Icon: XCircle },
};
function statusLabel(lang, status) {
  return {
    all: t(lang, "donations_statusAll"),
    collecting: t(lang, "donations_statusCollecting"),
    completed: t(lang, "donations_statusCompleted"),
    cancelled: t(lang, "donations_statusCancelled"),
  }[status];
}
function cardStatusLabel(lang, status) {
  return {
    completed: t(lang, "donations_cardStatusCompleted"),
    collecting: t(lang, "donations_cardStatusCollecting"),
    cancelled: t(lang, "donations_statusCancelled"),
  }[status];
}

function fmtDate(d, lang) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${t(lang, "months_short")[dt.getMonth()]} ${dt.getFullYear()}`;
}

function mapMyCampaign(c, lang) {
  const video = (c.media || []).find((m) => m.type === "video");
  return {
    id: c._id,
    type: c.animal?.nameAz || t(lang, "donations_animalFallback"),
    amount: c.myPaidAmount ?? 0,
    collectedAmount: c.collectedAmount,
    totalAmount: c.totalAmount,
    progressPercent: c.percent || 0,
    startDate: fmtDate(c.createdAt, lang),
    status: c.status || "collecting",
    createdAtRaw: c.createdAt || null,
    organizer: c.iAmOpener ? t(lang, "donations_openedBySelf") : t(lang, "donations_participatedBySelf"),
    img: c.animal?.image || null,
    videoUrl: video?.url || null,
    media: c.media || [],
    weightRange: c.animal?.weightRange || "",
    iAmOpener: !!c.iAmOpener,
  };
}

function CircularProgress({ percent, status, lang }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const cfg = STATUS_CFG[status] || STATUS_CFG.collecting;
  if (status === "cancelled") {
    return (
      <View style={{ alignItems: "center", gap: scale(4) }}>
        <View style={styles.cancelRing}>
          <X size={20} color="#e11d48" />
        </View>
        <Text style={styles.cancelRingLabel}>{t(lang, "donations_statusCancelled")}</Text>
      </View>
    );
  }
  const progress = (Math.min(percent, 100) / 100) * c;
  return (
    <View style={{ alignItems: "center", gap: scale(3) }}>
      <View style={{ width: scale(60), height: scale(60), alignItems: "center", justifyContent: "center" }}>
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
        <Text style={{ fontSize: scaleFont(13), fontWeight: "800", color: cfg.ring }}>{percent}%</Text>
      </View>
      <Text style={styles.ringSmallLabel}>{t(lang, "donations_completionLabel")}</Text>
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
  const { lang } = useLanguage();
  if (!item) return null;
  const media = item.media?.length ? item.media : item.videoUrl ? [{ type: "video", url: item.videoUrl }] : [];
  return (
    <View style={styles.videoOverlay}>
      <View style={styles.videoHeader}>
        <Text style={styles.videoTitle} numberOfLines={1}>{item.type} {t(lang, "donations_videoModalTitleSuffix")}</Text>
        <Pressable style={styles.videoCloseBtn} onPress={onClose}>
          <X size={18} color={PURPLE_MID} />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {media.map((m, i) =>
          m.type === "video" ? (
            <View key={i} style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" }}>
              <GalleryVideo uri={m.url} />
            </View>
          ) : (
            <Image key={i} source={{ uri: m.url }} style={{ width: "100%", height: scale(220) }} resizeMode="cover" />
          )
        )}
      </ScrollView>
    </View>
  );
}

// Statusa görə çoxlu pill əvəzinə tək düymə — basılanda altında bütün
// seçimləri sadalayan üzən panel açılır (bax MeatMyOrdersScreen-dəki eyni patern).
function StatusFilter({ value, onChange, counts, lang }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState(null);
  const CurrentIcon = STATUS_META[value].Icon;

  const openDropdown = () => {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <>
      <Pressable ref={btnRef} style={[styles.filterBtn, open && styles.filterBtnOpen]} onPress={openDropdown}>
        <CurrentIcon size={17} color={PURPLE_MID} strokeWidth={2.2} />
        <Text style={styles.filterBtnText}>{statusLabel(lang, value)}</Text>
        <View style={styles.filterBtnCount}>
          <Text style={styles.filterBtnCountText}>{counts[value] ?? 0}</Text>
        </View>
        <ChevronDown size={17} color={PURPLE_MID} strokeWidth={2.5} style={{ opacity: 0.6, transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        {layout && (
          <View style={[styles.dropdown, { top: layout.y + layout.height + 8, left: layout.x, minWidth: Math.max(210, layout.width) }]}>
            {STATUS_OPTIONS.map((s, i) => {
              const meta = STATUS_META[s];
              const active = s === value;
              return (
                <Pressable
                  key={s}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive, i !== STATUS_OPTIONS.length - 1 && styles.dropdownItemSep]}
                  onPress={() => { onChange(s); setOpen(false); }}
                >
                  <View style={[styles.dropdownIconWrap, active && { backgroundColor: "#fff" }]}>
                    <meta.Icon size={16} color={active ? PURPLE_MID : "#6b7280"} />
                  </View>
                  <Text style={[styles.dropdownLabel, active && { color: PURPLE_MID }]}>{statusLabel(lang, s)}</Text>
                  <View style={[styles.dropdownCount, active && { backgroundColor: "#fff" }]}>
                    <Text style={[styles.dropdownCountText, active && { color: PURPLE_MID }]}>{counts[s] ?? 0}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

function DonationCard({ item, onOpen, onVideo, onShare, lang }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.collecting;
  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardImgWrap}>
          {item.img ? <Image source={{ uri: item.img }} style={styles.cardImg} resizeMode="cover" /> : null}
        </View>
        <View style={styles.cardRingWrap}>
          <CircularProgress percent={item.progressPercent} status={item.status} lang={lang} />
        </View>
      </View>

      <View style={{ padding: scale(12), gap: scale(6) }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
          <Text style={styles.cardTitle}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cardStatusLabel(lang, item.status)}</Text>
          </View>
        </View>
        <Text style={styles.organizerText} numberOfLines={1}>{item.organizer}</Text>
        {!!item.weightRange && (
          <Text style={styles.weightText}>{t(lang, "donations_liveWeightLabel")} <Text style={{ fontWeight: "800", color: "#5b22c7" }}>{item.weightRange}</Text></Text>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statCellLabel}>{t(lang, "donations_yourDonationLabel")}</Text>
            <Text style={styles.statCellValue}>{item.amount} AZN</Text>
          </View>
          {item.status !== "completed" && (
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>{t(lang, "donations_collectedLabel")}</Text>
              <Text style={styles.statCellValue}>{item.collectedAmount} AZN</Text>
            </View>
          )}
          <View style={styles.statCell}>
            <Text style={styles.statCellLabel}>{t(lang, "donations_totalLabel")}</Text>
            <Text style={styles.statCellValue}>{item.totalAmount} AZN</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: scale(6), marginTop: scale(4) }}>
          <Pressable style={styles.actionBtnPurple} onPress={() => onOpen(item)}>
            <Users size={14} color="#fff" />
            <Text style={styles.actionBtnText}>{t(lang, "donations_viewParticipantsBtn")}</Text>
          </Pressable>
          {item.status === "completed" && item.videoUrl && (
            <Pressable style={styles.actionBtnBlue} onPress={() => onVideo(item)}>
              <Video size={14} color="#fff" />
              <Text style={styles.actionBtnText}>{t(lang, "myOrders_videoLabel")}</Text>
            </Pressable>
          )}
          {item.status !== "cancelled" && (
            <Pressable style={styles.actionBtnOutline} onPress={() => onShare(item)}>
              <Share2 size={13} color={PURPLE_MID} />
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
  const { lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [videoTarget, setVideoTarget] = useState(null);

  const initials = getInitials(user);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (isGuest) navigation.replace("Register");
    }, [isGuest, navigation])
  );

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    api.get("/campaigns/my")
      .then((res) => setOrders((res.data?.data?.campaigns || []).map((c) => mapMyCampaign(c, lang))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isGuest, lang]);

  const handleOpen = (item) => navigation.navigate("CampaignDetail", { campaignId: item.id });
  const handleShare = (item) => {
    Share.share({ message: t(lang, "donations_shareMessageTemplate").replace("{type}", item.type) }).catch(() => {});
  };

  if (isGuest) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
              <ArrowLeft size={20} color="#fff" />
              <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "navDonations")}</Text>
          </View>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
            <User size={22} color="#fff" />
            <Text style={styles.loginText}>{t(lang, "login")}</Text>
          </Pressable>
        </View>

        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <Users size={32} color={PURPLE_MID} />
          </View>
          <Text style={styles.guestTitle}>{t(lang, "donations_guestTitle")}</Text>
          <Text style={styles.guestSub}>{t(lang, "donations_guestSub")}</Text>
          <Pressable style={styles.guestRegisterBtn} onPress={() => navigation.navigate("Register")}>
            <Text style={styles.guestRegisterText}>{t(lang, "login_registerCta")}</Text>
          </Pressable>
          <Pressable style={styles.guestLoginBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.guestLoginText}>{t(lang, "login")}</Text>
          </Pressable>
        </View>

        <CollectiveBottomNav active="MyDonations" />
      </View>
    );
  }

  const totalPaid = orders.reduce((s, o) => s + o.amount, 0);
  const STATUS_PRIORITY = { collecting: 0, cancelled: 1, completed: 2 };
  const tabFiltered = orders.filter(
    (item) =>
      activeTab === "all" ||
      (activeTab === "opener" && item.iAmOpener === true) ||
      (activeTab === "donor" && item.iAmOpener === false)
  );
  const statusCounts = {
    all: tabFiltered.length,
    collecting: tabFiltered.filter((o) => o.status === "collecting").length,
    completed: tabFiltered.filter((o) => o.status === "completed").length,
    cancelled: tabFiltered.filter((o) => o.status === "cancelled").length,
  };
  const filtered = tabFiltered
    .filter((item) => statusFilter === "all" || item.status === statusFilter)
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
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "navDonations")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={PURPLE} iconColor="#fff" />
          <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
        </View>
      </View>

<ScrollView contentContainerStyle={{ padding: scale(12), paddingBottom: scale(20) }}>
        <View style={styles.statsRow}>
          <View style={styles.statTop}>
            <View style={styles.statTopIcon}>
              <Wallet size={17} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.statTopLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{t(lang, "donations_totalDonationLabel")}</Text>
              <Text style={styles.statTopValue}>{totalPaid.toFixed(2)} AZN</Text>
            </View>
          </View>
          <View style={styles.statTop}>
            <View style={styles.statTopIcon}>
              <Flag size={17} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.statTopLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{t(lang, "donations_totalCountLabel")}</Text>
              <Text style={styles.statTopValue}>{orders.length}</Text>
            </View>
          </View>
          <View style={styles.statTop}>
            <View style={styles.statTopIcon}>
              <Users size={17} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.statTopLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{t(lang, "donations_completedCountLabel")}</Text>
              <Text style={styles.statTopValue}>{orders.filter((o) => o.status === "completed").length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {tabs(lang).map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.key && { color: "#fff" }]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: scale(10), marginBottom: scale(6), alignItems: "flex-start" }}>
          <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={statusCounts} lang={lang} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PURPLE_MID} style={{ marginTop: scale(30) }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {orders.length === 0 ? t(lang, "donations_emptyNone") : t(lang, "donations_emptyFiltered")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: scale(10), marginTop: scale(4) }}>
            {filtered.map((item) => (
              <DonationCard key={item.id} item={item} onOpen={handleOpen} onVideo={setVideoTarget} onShare={handleShare} lang={lang} />
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
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(10), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: scale(30), gap: scale(8) },
  guestIcon: { width: scale(72), height: scale(72), borderRadius: scale(20), backgroundColor: "#ede9fe", alignItems: "center", justifyContent: "center", marginBottom: scale(8) },
  guestTitle: { fontSize: scaleFont(20), fontWeight: "900", color: DARK },
  guestSub: { fontSize: scaleFont(14.5), color: "#77689c", textAlign: "center", lineHeight: moderateScale(20), marginBottom: scale(10) },
  guestRegisterBtn: { width: "100%", maxWidth: scale(220), backgroundColor: PURPLE_MID, borderRadius: scale(12), paddingVertical: scale(13), alignItems: "center" },
  guestRegisterText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "800" },
  guestLoginBtn: { width: "100%", maxWidth: scale(220), borderWidth: 1, borderColor: "#d9cff0", backgroundColor: "#fff", borderRadius: scale(12), paddingVertical: scale(13), alignItems: "center", marginTop: scale(8) },
  guestLoginText: { color: PURPLE_MID, fontSize: scaleFont(15), fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: scale(6) },
  statTop: { flex: 1, flexDirection: "row", alignItems: "center", gap: scale(6), backgroundColor: "#fff", borderRadius: scale(14), borderWidth: 1, borderColor: "#e7e1f0", paddingVertical: scale(11), paddingHorizontal: scale(9) },
  statTopIcon: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: PURPLE_MID, alignItems: "center", justifyContent: "center" },
  statTopLabel: { fontSize: scaleFont(11), fontWeight: "700", color: "#8778a8" },
  statTopValue: { fontSize: scaleFont(16), fontWeight: "900", color: "#24124f", marginTop: scale(2) },

  tabRow: { flexDirection: "row", gap: scale(4), backgroundColor: "#fff", borderRadius: scale(12), borderWidth: 1, borderColor: "#e7e1f0", padding: scale(4), marginTop: scale(12) },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: scale(11), borderRadius: scale(9) },
  tabBtnActive: { backgroundColor: PURPLE_MID },
  tabBtnText: { fontSize: scaleFont(14), fontWeight: "700", color: "#4c3b77" },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e7e1f0",
    borderRadius: scale(13),
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
  },
  filterBtnOpen: { borderColor: PURPLE_MID },
  filterBtnText: { fontSize: scaleFont(14.5), fontWeight: "800", color: PURPLE_MID },
  filterBtnCount: { backgroundColor: "#f3effe", borderRadius: scale(8), paddingHorizontal: scale(8), paddingVertical: scale(2) },
  filterBtnCountText: { fontSize: scaleFont(12.5), fontWeight: "900", color: PURPLE_MID },

  dropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: "#e7e1f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: scale(10), paddingHorizontal: scale(14), paddingVertical: scale(13) },
  dropdownItemActive: { backgroundColor: "#f3effe" },
  dropdownItemSep: { borderBottomWidth: 1, borderBottomColor: "#f0ecf7" },
  dropdownIconWrap: { width: scale(30), height: scale(30), borderRadius: scale(9), backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  dropdownLabel: { flex: 1, fontSize: scaleFont(14.5), fontWeight: "700", color: "#374151" },
  dropdownCount: { backgroundColor: "#f3f4f6", borderRadius: scale(8), paddingHorizontal: scale(8), paddingVertical: scale(2) },
  dropdownCountText: { fontSize: scaleFont(12.5), fontWeight: "900", color: "#6b7280" },

  emptyBox: { borderWidth: 1, borderStyle: "dashed", borderColor: "#d8cdec", borderRadius: scale(16), paddingVertical: scale(40), alignItems: "center", marginTop: scale(10) },
  emptyText: { fontSize: scaleFont(15.5), color: "#77689c", textAlign: "center", paddingHorizontal: scale(20) },

  card: { backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#ece6f5", overflow: "hidden" },
  cardTopRow: { flexDirection: "row", height: scale(124) },
  cardImgWrap: { flex: 2, backgroundColor: "#f5f2ff" },
  cardImg: { width: "100%", height: "100%" },
  cardRingWrap: { flex: 1, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "#eee8f6" },
  ringSmallLabel: { fontSize: scaleFont(10.5), fontWeight: "700", color: "#4d3678" },
  cancelRing: { width: scale(54), height: scale(54), borderRadius: scale(27), borderWidth: 5, borderColor: "#fecdd3", alignItems: "center", justifyContent: "center" },
  cancelRingLabel: { fontSize: scaleFont(11.5), fontWeight: "700", color: "#e11d48" },

  cardTitle: { fontSize: scaleFont(17.5), fontWeight: "800", color: DARK },
  statusBadge: { borderRadius: scale(6), paddingHorizontal: scale(9), paddingVertical: scale(4) },
  statusBadgeText: { fontSize: scaleFont(12), fontWeight: "700" },
  organizerText: { fontSize: scaleFont(13), color: "#77689c" },
  weightText: { fontSize: scaleFont(13), color: "#8778a8" },

  statsGrid: { flexDirection: "row", gap: scale(10), marginTop: scale(4) },
  statCell: { flex: 1 },
  statCellLabel: { fontSize: scaleFont(11.5), color: "#8778a8" },
  statCellValue: { fontSize: scaleFont(14.5), fontWeight: "800", color: DARK, marginTop: scale(1) },

  actionBtnPurple: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), height: scale(37), borderRadius: scale(8), backgroundColor: PURPLE_MID },
  actionBtnBlue: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), height: scale(37), borderRadius: scale(8), backgroundColor: "#1d4ed8" },
  actionBtnText: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#fff" },
  actionBtnOutline: { width: scale(41), height: scale(37), alignItems: "center", justifyContent: "center", borderRadius: scale(8), borderWidth: 1, borderColor: "#bcaee4" },

  videoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", zIndex: 200 },
  videoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: scale(10), paddingHorizontal: scale(16), paddingVertical: scale(40), borderBottomWidth: 1, borderBottomColor: "#e7e1f0", backgroundColor: "#f5f3ff" },
  videoTitle: { flex: 1, fontSize: scaleFont(17.5), fontWeight: "900", color: DARK },
  videoCloseBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
});
