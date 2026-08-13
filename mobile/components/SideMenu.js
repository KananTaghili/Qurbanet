import { View, Text, Pressable, StyleSheet, Animated, Modal, Image } from "react-native";
import { ChevronLeft, Info, LayoutGrid, HelpCircle, Phone } from "lucide-react-native";
import IconPattern from "./IconPattern";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import useSideMenuSlide from "./useSideMenuSlide";
import SideMenuAccount from "./SideMenuAccount";
import { scale, scaleFont } from "../lib/scale";

const WIDTH = 260;

export default function SideMenu({ visible, onClose }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user, logout } = useAuth();
  const { lang } = useLanguage();
  const { slide, fade } = useSideMenuSlide(visible, WIDTH);

  const NAV = [
    { label: t(lang, "sideMenu_about"), Icon: Info, screen: "About" },
    { label: t(lang, "sideMenu_services"), Icon: LayoutGrid, screen: "Services" },
    { label: t(lang, "sideMenu_howItWorks"), Icon: HelpCircle, screen: "Process" },
    { label: t(lang, "sideMenu_contact"), Icon: Phone, screen: "Contact" },
  ];

  const goTo = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
        <IconPattern
          source={require("../assets/images/meatbox-bg-icon.png")}
          size={40}
          opacity={0.28}
          rows={18}
          cols={5}
          spacingX={58}
          spacingY={58}
        />
        <View style={[styles.panelHeader, { paddingTop: insets.top }]}>
          <Image
            source={require("../assets/images/qurban-logo.png")}
            style={styles.panelLogo}
            resizeMode="contain"
          />
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <ChevronLeft size={20} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={styles.nav}>
          {NAV.map(({ label, Icon, screen }) => (
            <Pressable key={label} style={styles.navItem} onPress={() => goTo(screen)}>
              <Icon size={21} color="rgba(255,255,255,0.75)" />
              <Text style={styles.navLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <SideMenuAccount
            isGuest={isGuest}
            user={user}
            onLogin={() => goTo("Login")}
            onLogout={() => { onClose(); logout(); }}
            loginColor="#CC0000"
            avatarColor="#CC0000"
          />
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
    backgroundColor: "#2e1914",
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingBottom: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  panelLogo: { width: scale(155), height: scale(195) },
  closeBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  nav: { paddingHorizontal: scale(12), paddingTop: scale(12), gap: scale(2) },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(13),
    paddingHorizontal: scale(13),
    paddingVertical: scale(14),
    borderRadius: scale(12),
  },
  navLabel: { fontSize: scaleFont(15.5), fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(16),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
});
