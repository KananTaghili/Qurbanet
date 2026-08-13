import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useNavBarStyle from "../hooks/useNavBarStyle";
import { scale, moderateScale, scaleFont } from "../lib/scale";

export default function PageShell({ label, title, children }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  useNavBarStyle("dark", "#fbf7f2");
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.card}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.heading}>{title}</Text>
          {children}
        </View>
      </ScrollView>

      <Pressable style={[styles.backBtn, { top: insets.top }]} onPress={() => navigation.goBack()}>
        <ArrowLeft size={32} color="#fff" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export const shellStyles = StyleSheet.create({
  infoCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#ead9cf",
    backgroundColor: "#fff8f1",
    padding: scale(12),
    marginTop: scale(12),
  },
  infoTitle: { marginTop: scale(8), fontSize: scaleFont(14), fontWeight: "900", color: "#171717" },
  infoText: { marginTop: scale(4), fontSize: scaleFont(12), lineHeight: moderateScale(18), color: "#525252" },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbf7f2" },
  scrollContent: { padding: scale(16), paddingBottom: scale(32) },
  card: {
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#ead9cf",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: scale(16),
  },
  label: {
    marginLeft: scale(58),
    fontSize: scaleFont(11),
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#e10d0d",
  },
  heading: {
    marginTop: scale(8),
    fontSize: scaleFont(20),
    fontWeight: "900",
    lineHeight: moderateScale(26),
    color: "#1d0c08",
  },
  backBtn: {
    position: "absolute",
    top: 0,
    left: 0,
    width: scale(72),
    height: scale(72),
    borderBottomRightRadius: scale(72),
    backgroundColor: "#f20b32",
    alignItems: "center",
    justifyContent: "center",
  },
});
