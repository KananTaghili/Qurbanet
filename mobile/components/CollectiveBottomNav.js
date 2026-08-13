import { View, Text, Pressable, StyleSheet } from "react-native";
import { Home as HomeIcon, List, CheckCircle, HelpCircle, FileText } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE = "#4b14bd";

export default function CollectiveBottomNav({ active }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang } = useLanguage();

  const NAV = [
    { label: t(lang, "navMain"), Icon: HomeIcon, screen: "CollectiveQurban" },
    { label: t(lang, "navDonations"), Icon: List, screen: "MyDonations" },
    { label: t(lang, "navCompleted"), Icon: CheckCircle, screen: "CompletedCampaigns" },
    { label: t(lang, "navHowItWorksShort"), Icon: HelpCircle, screen: "HowItWorksCollective" },
    { label: t(lang, "navTermsShort"), Icon: FileText, screen: "TermsCollective" },
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
            <View style={[styles.bottomNavIcon, isActive && { backgroundColor: "#ede9fe" }]}>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.7} color={isActive ? PURPLE : "#a1a1aa"} />
            </View>
            <Text style={[styles.bottomNavLabel, isActive && { color: PURPLE, fontWeight: "700" }]} numberOfLines={2}>
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
  bottomNavItem: { flex: 1, alignItems: "center", gap: scale(3), paddingVertical: scale(2) },
  bottomNavIcon: { width: scale(42), height: scale(30), borderRadius: scale(10), alignItems: "center", justifyContent: "center" },
  bottomNavLabel: { fontSize: scaleFont(10.5), fontWeight: "600", color: "#a1a1aa", textAlign: "center", lineHeight: moderateScale(13) },
});
