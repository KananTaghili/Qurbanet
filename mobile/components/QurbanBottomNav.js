import { View, Text, Pressable, StyleSheet } from "react-native";
import { Beef, ClipboardList, HelpCircle, BookOpen } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#1c5e20";

const NAV = [
  { label: "Əsas", Icon: Beef, screen: "Qurban" },
  { label: "Sifarişlərim", Icon: ClipboardList, screen: "MyOrders" },
  { label: "Necə işləyir", Icon: HelpCircle, screen: "HowItWorksQurban" },
  { label: "Əhkamlar", Icon: BookOpen, screen: "QurbanRules" },
];

export default function QurbanBottomNav({ active }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 6 }]}>
      {NAV.map(({ label, Icon, screen }) => {
        const isActive = screen === active;
        return (
          <Pressable
            key={label}
            style={styles.bottomNavItem}
            onPress={() => screen && screen !== active && navigation.navigate(screen)}
          >
            <View style={[styles.bottomNavIcon, isActive && { backgroundColor: "#e8f5e9" }]}>
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.7} color={isActive ? BRAND : "#a1a1aa"} />
            </View>
            <Text style={[styles.bottomNavLabel, isActive && { color: BRAND, fontWeight: "700" }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 6,
  },
  bottomNavItem: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 2 },
  bottomNavIcon: { width: 42, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bottomNavLabel: { fontSize: 10, fontWeight: "500", color: "#a1a1aa" },
});
