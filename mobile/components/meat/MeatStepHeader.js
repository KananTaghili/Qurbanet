import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Qurbanlıq axınındakı OrderStepHeader.js ilə 100% eyni struktur/ölçü —
// yalnız rəng (bordo) və addım adları (Ət Satışı) fərqlidir.
const STEPS = ["Məhsullar", "Ödəniş xülasəsi", "Ödəniş"];
const BRAND = "#4B0F0F";

export default function MeatStepHeader({ currentStep, backTo = "MeatHome" }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Pressable style={[styles.backBtn, { top: insets.top }]} onPress={() => navigation.navigate(backTo)}>
        <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <View style={[styles.stepsRow, { paddingTop: insets.top + 8 }]}>
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const done = idx < currentStep;
          const active = idx === currentStep;
          return (
            <View key={label} style={styles.stepItemWrap}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.circle,
                    (done || active) && { backgroundColor: BRAND },
                    active && styles.circleActive,
                  ]}
                >
                  <Text style={[styles.circleText, (done || active) && { color: "#fff" }]}>
                    {done ? "✓" : idx}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, active && { color: BRAND }, done && { color: "#8a5a5a" }]} numberOfLines={2}>
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.connector, done && { backgroundColor: BRAND }]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  backBtn: {
    position: "absolute",
    left: 0,
    zIndex: 10,
    width: 60,
    height: 60,
    borderBottomRightRadius: 60,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsRow: { flexDirection: "row", alignItems: "flex-start", paddingLeft: 74, paddingRight: 4 },
  stepItemWrap: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  stepCol: { alignItems: "center", gap: 5, width: 78 },
  circle: { width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#f0f0f0", borderWidth: 1.5, borderColor: "#e5e7eb" },
  circleActive: { shadowColor: BRAND, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  circleText: { fontSize: 14, fontWeight: "800", color: "#9ca3af" },
  stepLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textAlign: "center" },
  connector: { flex: 1, height: 6, marginTop: 13, marginHorizontal: 2, backgroundColor: "#e5e7eb", borderRadius: 3 },
});
