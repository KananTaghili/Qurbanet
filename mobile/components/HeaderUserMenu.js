import { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Settings, LogOut } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import { scale, scaleFont } from "../lib/scale";

export default function HeaderUserMenu({ initials, accentColor = "#CC0000" }) {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const goSettings = () => {
    setOpen(false);
    navigation.navigate("Settings");
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <>
      <Pressable style={[styles.avatar, { backgroundColor: accentColor }]} onPress={() => setOpen(true)}>
        <Text style={styles.avatarText}>{initials}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.menu, { top: scale(60) }]}>
          <Pressable style={styles.item} onPress={goSettings}>
            <Settings size={21} color="#374151" />
            <Text style={styles.itemText}>{t(lang, "settings")}</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={handleLogout}>
            <LogOut size={21} color="#f20b32" />
            <Text style={[styles.itemText, { color: "#f20b32" }]}>{t(lang, "logoutFull")}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(5),
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: scaleFont(16) },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  menu: {
    position: "absolute",
    right: scale(12),
    minWidth: scale(215),
    backgroundColor: "#fff",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: scale(8),
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: { flexDirection: "row", alignItems: "center", gap: scale(12), paddingHorizontal: scale(14), paddingVertical: scale(13), borderRadius: scale(9) },
  itemText: { fontSize: scaleFont(17.5), fontWeight: "600", color: "#374151" },
});
