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
import { Bell, CheckCheck, Package, HeartHandshake, Newspaper, X } from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const TABS = [
  { key: "all", label: "Hamısı" },
  { key: "qurban", label: "Qurban" },
  { key: "charity", label: "Xeyriyyə" },
];

const MODULE_ICON = { qurban: Knife, charity: HeartHandshake, meat: Package, news: Newspaper };
const MODULE_COLOR = { qurban: "#1c5e20", charity: "#5b21b6", meat: "#f97316", news: "#2563eb" };

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "İndicə";
  if (m < 60) return `${m} dəq.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy} gün`;
  return new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function NotificationItem({ n, accentColor }) {
  const Icon = MODULE_ICON[n.module] || Bell;
  const moduleColor = MODULE_COLOR[n.module] || accentColor;
  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: moduleColor + "18" }]}>
        <Icon size={13} color={moduleColor} weight="bold" />
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
        <Text style={[styles.itemTime, { color: moduleColor + "99" }]}>{timeAgo(n.createdAt)}</Text>
      </View>
      {!n.read && <View style={[styles.unreadDot, { backgroundColor: moduleColor }]} />}
    </View>
  );
}

function NotificationPanel({ visible, onClose, accentColor }) {
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
      <Animated.View style={[styles.panel, { top: 60, opacity: fade }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Bildirişlər</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {hasUnread && (
              <Pressable
                onPress={handleMarkAll}
                disabled={marking}
                style={[styles.markAllBtn, { backgroundColor: accentColor + "14" }]}
              >
                <CheckCheck size={12} color={accentColor} />
                <Text style={[styles.markAllText, { color: accentColor }]}>Hamısını oxu</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={13} color="#94a3b8" />
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

        <View style={{ maxHeight: 360 }}>
          {initialLoad ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={accentColor} />
            </View>
          ) : (
            <Animated.View style={{ opacity: contentFade }}>
              {nots.length === 0 ? (
                <View style={styles.centerBox}>
                  <Bell size={28} color="#e2e8f0" />
                  <Text style={styles.emptyText}>Bildiriş yoxdur</Text>
                </View>
              ) : (
                <FlatList
                  data={nots}
                  keyExtractor={(n) => n._id}
                  renderItem={({ item }) => <NotificationItem n={item} accentColor={accentColor} />}
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
        <Bell size={18} color={iconColor} />
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
  bellBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  panel: {
    position: "absolute",
    right: 12,
    width: 300,
    maxWidth: "88%",
    borderRadius: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  panelTitle: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  markAllText: { fontSize: 11, fontWeight: "700" },
  closeBtn: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },

  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabLabel: { fontSize: 11, fontWeight: "700" },
  tabIndicator: { marginTop: 6, height: 2.5, width: "60%", borderRadius: 2 },

  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },

  item: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  itemIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 1 },
  itemTitle: { fontSize: 12 },
  itemBody: { fontSize: 11, color: "#94a3b8", marginTop: 2, lineHeight: 15 },
  itemTime: { fontSize: 10, marginTop: 3 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 5 },
  separator: { height: 1, backgroundColor: "#f8fafc" },
});
