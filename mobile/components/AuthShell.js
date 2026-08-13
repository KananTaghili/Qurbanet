import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useNavBarStyle from "../hooks/useNavBarStyle";
import { scale, scaleFont } from "../lib/scale";

export default function AuthShell({ onBack, children }) {
  const insets = useSafeAreaInsets();
  useNavBarStyle("dark", "#ffffff");
  return (
    <View style={styles.root}>
      <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={onBack}>
        <ArrowLeft size={18} color="#374151" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image source={require("../assets/images/app-icon.png")} style={styles.brandIcon} resizeMode="contain" />
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText}>MEAT</Text>
            <Text style={[styles.wordmarkText, { color: "#e10d0d" }]}>BOX</Text>
          </View>
          <View style={styles.sloganRow}>
            {["ETİBARLI", "HALAL", "SÜRƏTLİ"].map((t, i) => (
              <View key={t} style={styles.sloganItem}>
                <Text style={styles.sloganText}>{t}</Text>
                {i < 2 && <View style={styles.sloganDot} />}
              </View>
            ))}
          </View>
        </View>

        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  backBtn: {
    position: "absolute",
    left: scale(14),
    zIndex: 5,
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: scale(28), flexGrow: 1 },
  brand: { alignItems: "center", marginBottom: scale(24) },
  brandIcon: { width: scale(78), height: scale(78), borderRadius: scale(18) },
  wordmark: { flexDirection: "row", marginTop: scale(12) },
  wordmarkText: { fontSize: scaleFont(26), fontWeight: "900", color: "#111827", letterSpacing: 0.5 },
  sloganRow: { flexDirection: "row", alignItems: "center", gap: scale(6), marginTop: scale(6) },
  sloganItem: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  sloganText: { fontSize: scaleFont(9), fontWeight: "700", letterSpacing: 1, color: "#9ca3af" },
  sloganDot: { width: scale(3), height: scale(3), borderRadius: scale(1.5), backgroundColor: "#d1d5db" },
});
