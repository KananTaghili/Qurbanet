import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import {
  Beef,
  ShoppingCart,
  ClipboardList,
  HelpCircle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#4B0F0F";

const NAV = [
  { label: "Məhsullar", Icon: Beef, screen: "MeatHome" },
  { label: "Səbətim", Icon: ShoppingCart, screen: "MeatCart" },
  { label: "Sifarişlərim", Icon: ClipboardList, screen: "MeatMyOrders" },
  { label: "Necə işləyir", Icon: HelpCircle, screen: "MeatHowItWorks" },
];

export default function MeatBottomNav({ active }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handlePress = (screen) => {
    if (!screen) {
      Alert.alert("Tezliklə", "Bu bölmə hələ hazırlanır.");
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
    paddingTop: 8,
  },
  bottomNavItem: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 3, paddingHorizontal: 2 },
  bottomNavIcon: {
    width: 50,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavLabel: { fontSize: 12, fontWeight: "600", color: "#a1a1aa", textAlign: "center", lineHeight: 14.5 },
});
