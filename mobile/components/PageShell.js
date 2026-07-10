import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useNavBarStyle from "../hooks/useNavBarStyle";

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
        <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export const shellStyles = StyleSheet.create({
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead9cf",
    backgroundColor: "#fff8f1",
    padding: 12,
    marginTop: 12,
  },
  infoTitle: { marginTop: 8, fontSize: 14, fontWeight: "900", color: "#171717" },
  infoText: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#525252" },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbf7f2" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ead9cf",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
  },
  label: {
    marginLeft: 46,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#e10d0d",
  },
  heading: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    color: "#1d0c08",
  },
  backBtn: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 56,
    height: 56,
    borderBottomRightRadius: 56,
    backgroundColor: "#f20b32",
    alignItems: "center",
    justifyContent: "center",
  },
});
