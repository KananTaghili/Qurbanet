import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { Bell, CheckCheck, Beef, HeartHandshake, Newspaper, X } from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";

const MODULE_ICON = { qurban: Knife, charity: HeartHandshake, meat: Beef, news: Newspaper };
const MODULE_COLOR = { qurban: "#1c5e20", charity: "#5b21b6", meat: "#f97316", news: "#2563eb" };
const DATE_LOCALE = { az: "az-AZ", ru: "ru-RU", en: "en-US" };

function timeAgo(d, lang) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return t(lang, "notif_justNow");
  if (m < 60) return `${m} ${t(lang, "notif_minShort")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${t(lang, "notif_hourShort")}`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy} ${t(lang, "notif_dayShort")}`;
  return new Date(d).toLocaleDateString(DATE_LOCALE[lang] || "az-AZ", { day: "numeric", month: "short" });
}

function NotificationItem({ n, accentColor, lang }) {
  const Icon = MODULE_ICON[n.module] || Bell;
  const moduleColor = MODULE_COLOR[n.module] || accentColor;
  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: moduleColor + "18" }]}>
        <Icon size={18} color={moduleColor} weight="bold" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.itemTitle, { fontWeight: n.read ? "500" : "700", color: n.read ? "#64748b" : "#1e293b" }]}
          numberOfLines={1}
        >
          {n.title}
        </Text>
        {n.body ? (
          <Text style={styles.itemBody} numberOfLines={2}>{n.body}</Text>
        ) : null}
        <Text style={[styles.itemTime, { color: moduleColor + "99" }]}>{timeAgo(n.createdAt, lang)}</Text>
      </View>
      {!n.read && <View style={[styles.unreadDot, { backgroundColor: moduleColor }]} />}
    </View>
  );
}

function NotificationPanel({ visible, onClose, accentColor }) {
  const { lang } = useLanguage();
  const TABS = [
    { key: "all", label: t(lang, "allLabel") },
    { key: "qurban", label: t(lang, "notif_tabQurban") },
    { key: "charity", label: t(lang, "charity") },
    { key: "meat", label: t(lang, "notif_tabMeat") },
  ];
  const [tab, setTab] = useState("all");
  const [nots, setNots] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [marking, setMarking] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  const fetchList = useCallback(async (module) => {
    try {
      const params = { limit: 30, page: 1 };
      if (module && module !== "all") params.module = module;
      const res = await api.get("/notifications", { params });
      if (res.data?.success) setNots(res.data.data.notifications || []);
    } catch {
      // keep previous list
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    fetchList(tab);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [visible]);

  const changeTab = (key) => {
    if (key === tab) return;
    setTab(key);
    Animated.timing(contentFade, { toValue: 0, duration: 120, useNativeDriver: true }).start(async () => {
      await fetchList(key);
      Animated.timing(contentFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      const body = tab !== "all" ? { module: tab } : {};
      await api.patch("/notifications/read-all", body);
      await fetchList(tab);
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  };

  const hasUnread = nots.some((n) => !n.read);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.panel, { top: scale(60), opacity: fade }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{t(lang, "notif_title")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
            {hasUnread && (
              <Pressable
                onPress={handleMarkAll}
                disabled={marking}
                style={[styles.markAllBtn, { backgroundColor: accentColor + "14" }]}
              >
                <CheckCheck size={16} color={accentColor} />
                <Text style={[styles.markAllText, { color: accentColor }]}>{t(lang, "notif_markAll")}</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={17} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        <View style={styles.tabRow}>
          {TABS.map(({ key, label }) => (
            <Pressable key={key} style={styles.tabBtn} onPress={() => changeTab(key)}>
              <Text style={[styles.tabLabel, { color: tab === key ? accentColor : "#94a3b8" }]}>{label}</Text>
              {tab === key && <View style={[styles.tabIndicator, { backgroundColor: accentColor }]} />}
            </Pressable>
          ))}
        </View>

        <View style={{ maxHeight: scale(360) }}>
          {initialLoad ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={accentColor} />
            </View>
          ) : (
            <Animated.View style={{ opacity: contentFade }}>
              {nots.length === 0 ? (
                <View style={styles.centerBox}>
                  <Bell size={36} color="#e2e8f0" />
                  <Text style={styles.emptyText}>{t(lang, "notif_empty")}</Text>
                </View>
              ) : (
                <FlatList
                  data={nots}
                  keyExtractor={(n) => n._id}
                  renderItem={({ item }) => <NotificationItem n={item} accentColor={accentColor} lang={lang} />}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

export default function NotificationBell({ accentColor = "#1c5e20", iconColor = "#ffffff" }) {
  const { isGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isGuest) return;
    api
      .get("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data?.data?.total ?? 0))
      .catch(() => {});
  }, [isGuest, open]);

  if (isGuest) return null;

  return (
    <>
      <Pressable style={styles.bellBtn} onPress={() => setOpen(true)}>
        <Bell size={23} color={iconColor} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        )}
      </Pressable>

      <NotificationPanel visible={open} onClose={() => setOpen(false)} accentColor={accentColor} />
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: { width: scale(41), height: scale(41), alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: scale(-1),
    right: scale(-1),
    minWidth: scale(17),
    height: scale(17),
    borderRadius: scale(9),
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(3),
  },
  badgeText: { color: "#fff", fontSize: scaleFont(10), fontWeight: "900" },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  panel: {
    position: "absolute",
    right: scale(12),
    width: scale(352),
    maxWidth: "92%",
    borderRadius: scale(16),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(15),
    paddingVertical: scale(13),
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  panelTitle: { fontSize: scaleFont(17), fontWeight: "700", color: "#1e293b" },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: scale(5), borderRadius: scale(8), paddingHorizontal: scale(10), paddingVertical: scale(7) },
  markAllText: { fontSize: scaleFont(14), fontWeight: "700" },
  closeBtn: { width: scale(28), height: scale(28), borderRadius: scale(14), alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },

  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: scale(13) },
  tabLabel: { fontSize: scaleFont(14), fontWeight: "700" },
  tabIndicator: { marginTop: scale(6), height: scale(3), width: "60%", borderRadius: scale(2) },

  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: scale(40), gap: scale(8) },
  emptyText: { fontSize: scaleFont(15), color: "#94a3b8", fontWeight: "500" },

  item: { flexDirection: "row", alignItems: "flex-start", gap: scale(12), paddingHorizontal: scale(16), paddingVertical: scale(13) },
  itemIcon: { width: scale(33), height: scale(33), borderRadius: scale(16.5), alignItems: "center", justifyContent: "center", marginTop: scale(1) },
  itemTitle: { fontSize: scaleFont(15) },
  itemBody: { fontSize: scaleFont(14), color: "#94a3b8", marginTop: scale(2), lineHeight: moderateScale(18.5) },
  itemTime: { fontSize: scaleFont(13), marginTop: scale(3) },
  unreadDot: { width: scale(9), height: scale(9), borderRadius: scale(4.5), marginTop: scale(5) },
  separator: { height: scale(1), backgroundColor: "#f8fafc" },
});
