import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

export default function OrderStepHeader({ currentStep }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang } = useLanguage();
  const STEPS = [t(lang, "step1"), t(lang, "step2"), t(lang, "step3")];

  return (
    <View style={styles.root}>
      <Pressable style={[styles.backBtn, { top: insets.top }]} onPress={() => navigation.goBack()}>
        <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
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
                <Text style={[styles.stepLabel, active && { color: BRAND }, done && { color: "#4c8a50" }]}>
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
  root: { paddingBottom: scale(10), borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  backBtn: {
    position: "absolute",
    left: 0,
    zIndex: 10,
    width: scale(60),
    height: scale(60),
    borderBottomRightRadius: scale(60),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsRow: { flexDirection: "row", alignItems: "flex-start", paddingLeft: scale(94), paddingRight: scale(6) },
  stepItemWrap: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  stepCol: { alignItems: "center", gap: scale(5), width: scale(68) },
  circle: { width: scale(32), height: scale(32), borderRadius: scale(16), alignItems: "center", justifyContent: "center", backgroundColor: "#f0f0f0", borderWidth: 1.5, borderColor: "#e5e7eb" },
  circleActive: { shadowColor: BRAND, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  circleText: { fontSize: scaleFont(14), fontWeight: "800", color: "#9ca3af" },
  stepLabel: { fontSize: scaleFont(12.5), fontWeight: "700", color: "#9ca3af", textAlign: "center" },
  connector: { flex: 1, height: scale(2), marginTop: scale(15), marginHorizontal: scale(4), backgroundColor: "#e5e7eb", borderRadius: scale(1) },
});
