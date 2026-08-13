import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import {
  Beef,
  ShoppingCart,
  ClipboardList,
  HelpCircle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";

export default function MeatBottomNav({ active }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang } = useLanguage();

  const NAV = [
    { label: t(lang, "navProducts"), Icon: Beef, screen: "MeatHome" },
    { label: t(lang, "navCart"), Icon: ShoppingCart, screen: "MeatCart" },
    { label: t(lang, "myOrders"), Icon: ClipboardList, screen: "MeatMyOrders" },
    { label: t(lang, "navHowItWorksShort"), Icon: HelpCircle, screen: "MeatHowItWorks" },
  ];

  const handlePress = (screen) => {
    if (!screen) {
      Alert.alert(t(lang, "comingSoonTitle"), t(lang, "comingSoonBody"));
      return;
    }
    // "active" sadəcə vizual etiketdir (məs. MeatProducts ekranında da
    // "Məhsullar" işıqlanır) — cari faktiki ekranla üst-üstə düşməyə bilər,
    // ona görə həmişə naviqasiya edirik (eyni ekrana keçid zərərsizdir).
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 6 }]}>
      {NAV.map(({ label, Icon, screen }) => {
        const isActive = screen === active;
        return (
          <Pressable
            key={label}
            style={styles.bottomNavItem}
            onPress={() => handlePress(screen)}
          >
            <View
              style={[
                styles.bottomNavIcon,
                isActive && { backgroundColor: "#F1E5E5" },
              ]}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.4 : 1.7}
                color={isActive ? BRAND : "#a1a1aa"}
              />
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                isActive && { color: BRAND, fontWeight: "700" },
              ]}
              numberOfLines={2}
            >
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
    paddingTop: scale(8),
  },
  bottomNavItem: { flex: 1, alignItems: "center", gap: scale(4), paddingVertical: scale(3), paddingHorizontal: scale(2) },
  bottomNavIcon: {
    width: scale(50),
    height: scale(36),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavLabel: { fontSize: scaleFont(12), fontWeight: "600", color: "#a1a1aa", textAlign: "center", lineHeight: moderateScale(14.5) },
});
