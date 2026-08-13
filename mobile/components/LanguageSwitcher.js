import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";
import { scale, scaleFont } from "../lib/scale";

// Compact AZ / RU / EN pill switcher. Designed to sit on the dark side-menu
// panels used across the app (Home/Meat/Qurban/Collective side menus all
// share this via SideMenuAccount) — neutral translucent-white styling so it
// reads correctly regardless of the panel's brand color. Hidden entirely
// when the backend only has one language enabled (multiLanguageEnabled).
export default function LanguageSwitcher() {
  const { lang, setLang, availableLanguages, multiLanguageEnabled, isReady } = useLanguage();

  if (!isReady || !multiLanguageEnabled) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t(lang, "languageLabel")}</Text>
      <View style={styles.pillRow}>
        {availableLanguages.map((l) => {
          const active = l.code === lang;
          return (
            <Pressable
              key={l.code}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setLang(l.code)}
              hitSlop={4}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  label: {
    fontSize: scaleFont(13),
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pillRow: {
    flexDirection: "row",
    gap: scale(4),
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: scale(10),
    padding: scale(3),
  },
  pill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  pillActive: { backgroundColor: "rgba(255,255,255,0.92)" },
  pillText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "rgba(255,255,255,0.75)" },
  pillTextActive: { color: "#1a0a08" },
});
