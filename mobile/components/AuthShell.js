import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useNavBarStyle from "../hooks/useNavBarStyle";

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
    left: 14,
    zIndex: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: 28, flexGrow: 1 },
  brand: { alignItems: "center", marginBottom: 24 },
  brandIcon: { width: 78, height: 78, borderRadius: 18 },
  wordmark: { flexDirection: "row", marginTop: 12 },
  wordmarkText: { fontSize: 26, fontWeight: "900", color: "#111827", letterSpacing: 0.5 },
  sloganRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  sloganItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  sloganText: { fontSize: 9, fontWeight: "700", letterSpacing: 1, color: "#9ca3af" },
  sloganDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#d1d5db" },
});
