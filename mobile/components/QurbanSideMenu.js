import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Modal, Image } from "react-native";
import { X, ArrowLeft, Feather, Beef, ClipboardList, HelpCircle, BookOpen, LogOut, User } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { label: "Əsas", Icon: Beef, screen: "Qurban" },
  { label: "Sifarişlərim", Icon: ClipboardList, screen: "MyOrders" },
  { label: "Necə işləyir", Icon: HelpCircle, screen: "HowItWorksQurban" },
  { label: "Qurbanın Əhkamları", Icon: BookOpen, screen: "QurbanRules" },
];

const WIDTH = 260;
const GREEN = "#1c5e20";

export default function QurbanSideMenu({ visible, onClose }) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isGuest, user, logout } = useAuth();
  const slide = useRef(new Animated.Value(-WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const goTo = (screen) => {
    onClose();
    if (screen) navigation.navigate(screen);
  };

  const goHome = () => {
    onClose();
    navigation.navigate("Home");
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: visible ? 0 : -WIDTH, duration: 260, useNativeDriver: true }),
      Animated.timing(fade, { toValue: visible ? 1 : 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const initials = [user?.name, user?.lastName].filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
        <Pressable style={styles.backBar} onPress={goHome}>
          <ArrowLeft size={13} color="#fff" strokeWidth={2.5} />
          <Text style={styles.backBarText}>MeatBox Xidmətlərinə Keç</Text>
        </Pressable>

        <View style={styles.panelHeader}>
          <Pressable onPress={goHome}>
            <Image source={require("../assets/images/qurban-logo.png")} style={styles.panelLogo} resizeMode="contain" />
          </Pressable>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View style={styles.nav}>
          {NAV.map(({ label, Icon, screen }) => {
            const active = screen === route.name;
            return (
              <Pressable
                key={label}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => goTo(screen)}
              >
                <Icon size={18} color={active ? "#fff" : "rgba(255,255,255,0.75)"} />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tagline}>
          <Feather size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.taglineText}>
            Qurban ətindən yeyin, ehtiyacı olanlara paylayın və saxlayın.
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: 14 }]}>
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => goTo("Login")}>
              <User size={15} color="#fff" />
              <Text style={styles.loginText}>Daxil ol</Text>
            </Pressable>
          ) : (
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {[user?.name, user?.lastName].filter(Boolean).join(" ")}
              </Text>
              <Pressable onPress={() => { onClose(); logout(); }}>
                <LogOut size={16} color="rgba(255,150,150,0.85)" />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  panel: { position: "absolute", top: 0, left: 0, bottom: 0, width: WIDTH, backgroundColor: GREEN },
  backBar: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#e02020",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backBarText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  panelLogo: { width: 130, height: 164 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  nav: { flex: 1, paddingHorizontal: 12, paddingTop: 12, gap: 2 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 13, borderRadius: 12 },
  navItemActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  navLabel: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  navLabelActive: { color: "#fff", fontWeight: "700" },
  tagline: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  taglineText: { flex: 1, color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600", fontStyle: "italic", lineHeight: 15 },
  footer: { paddingHorizontal: 16, paddingTop: 12 },
  loginBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2e7d32", borderRadius: 12, paddingVertical: 11 },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  userName: { flex: 1, color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 13 },
});
