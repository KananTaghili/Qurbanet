import { View, Text, Pressable, StyleSheet } from "react-native";
import { User, LogOut } from "lucide-react-native";
import { getInitials } from "../lib/format";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { scale, scaleFont } from "../lib/scale";

// Shared "login button" / "user row" footer content for the app's side menus.
// Only the brand accent color varies per menu — everything else is identical.
// The language switcher lives here (rather than duplicated in every side
// menu) so every side menu in the app — Home/Meat/Qurban/Collective — gets
// it automatically, satisfying the "globally reachable" requirement in one
// place.
export default function SideMenuAccount({
  isGuest,
  user,
  onLogin,
  onLogout,
  loginColor,
  avatarColor,
}) {
  const { lang } = useLanguage();

  if (isGuest) {
    return (
      <View>
        <LanguageSwitcher />
        <Pressable style={[styles.loginBtn, { backgroundColor: loginColor }]} onPress={onLogin}>
          <User size={17} color="#fff" />
          <Text style={styles.loginText}>{t(lang, "login")}</Text>
        </Pressable>
      </View>
    );
  }

  const initials = getInitials(user);

  return (
    <View>
      <LanguageSwitcher />
      <View style={styles.userRow}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
          {[user?.name, user?.lastName].filter(Boolean).join(" ")}
        </Text>
        <Pressable onPress={onLogout}>
          <LogOut size={18} color="rgba(255,150,150,0.85)" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(9),
    borderRadius: scale(12),
    paddingVertical: scale(13),
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: scaleFont(15.5) },
  userRow: { flexDirection: "row", alignItems: "center", gap: scale(11) },
  avatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: scaleFont(14.5) },
  userName: { flex: 1, color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: scaleFont(14.5) },
});
