import { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Settings, LogOut } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

export default function HeaderUserMenu({ initials, accentColor = "#CC0000" }) {
  const navigation = useNavigation();
  const { logout } = useAuth();
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
        <View style={[styles.menu, { top: 60 }]}>
          <Pressable style={styles.item} onPress={goSettings}>
            <Settings size={15} color="#374151" />
            <Text style={styles.itemText}>Parametrlər</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={handleLogout}>
            <LogOut size={15} color="#f20b32" />
            <Text style={[styles.itemText, { color: "#f20b32" }]}>Çıxış et</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  menu: {
    position: "absolute",
    right: 12,
    minWidth: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9 },
  itemText: { fontSize: 13, fontWeight: "600", color: "#374151" },
});
