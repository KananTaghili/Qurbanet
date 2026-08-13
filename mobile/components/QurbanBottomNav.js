import { View, Text, Pressable, StyleSheet } from "react-native";
import { Beef, ClipboardList, HelpCircle, BookOpen } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

export default function QurbanBottomNav({ active }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang } = useLanguage();

  const NAV = [
    { label: t(lang, "navMain"), Icon: Beef, screen: "Qurban" },
    { label: t(lang, "myOrders"), Icon: ClipboardList, screen: "MyOrders" },
    { label: t(lang, "navHowItWorksShort"), Icon: HelpCircle, screen: "HowItWorksQurban" },
    { label: t(lang, "navRulesShort"), Icon: BookOpen, screen: "QurbanRules" },
  ];

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
    paddingTop: scale(6),
  },
  bottomNavItem: { flex: 1, alignItems: "center", gap: scale(3), paddingVertical: scale(2) },
  bottomNavIcon: { width: scale(42), height: scale(30), borderRadius: scale(10), alignItems: "center", justifyContent: "center" },
  bottomNavLabel: { fontSize: scaleFont(10), fontWeight: "500", color: "#a1a1aa" },
});
