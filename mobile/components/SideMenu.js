import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Modal, Image } from "react-native";
import { X, Info, LayoutGrid, HelpCircle, Phone, User, LogOut } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { label: "Haqqımızda", Icon: Info, screen: "About" },
  { label: "Xidmətlər", Icon: LayoutGrid, screen: "Services" },
  { label: "Necə işləyir?", Icon: HelpCircle, screen: "Process" },
  { label: "Əlaqə", Icon: Phone, screen: "Contact" },
];

const WIDTH = 260;

export default function SideMenu({ visible, onClose }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user, logout } = useAuth();
  const slide = useRef(new Animated.Value(-WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const goTo = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : -WIDTH,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
        <View style={[styles.panelHeader, { paddingTop: insets.top }]}>
          <Image
            source={require("../assets/images/qurban-logo.png")}
            style={styles.panelLogo}
            resizeMode="contain"
          />
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View style={styles.nav}>
          {NAV.map(({ label, Icon, screen }) => (
            <Pressable key={label} style={styles.navItem} onPress={() => goTo(screen)}>
              <Icon size={18} color="rgba(255,255,255,0.75)" />
              <Text style={styles.navLabel}>{label}</Text>
            </Pressable>
          ))}
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
                <Text style={styles.avatarText}>{[user?.name, user?.lastName].filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?"}</Text>
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
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: WIDTH,
    backgroundColor: "#1a0a08",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  panelLogo: { width: 145, height: 183 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  nav: { paddingHorizontal: 12, paddingTop: 12, gap: 2 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
  },
  navLabel: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#CC0000",
    borderRadius: 12,
    paddingVertical: 11,
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#CC0000", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  userName: { flex: 1, color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 13 },
});
