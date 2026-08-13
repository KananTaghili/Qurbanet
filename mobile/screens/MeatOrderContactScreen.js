import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MeatStepHeader from "../components/meat/MeatStepHeader";
import OrderContactForm from "../components/OrderContactForm";
import { scale } from "../lib/scale";

const BRAND = "#4B0F0F";

export default function MeatOrderContactScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MeatStepHeader currentStep={2} backTo="MeatProducts" />

      <ScrollView
        contentContainerStyle={{ padding: scale(14), paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <OrderContactForm
          accentColor={BRAND}
          onSuccess={() => navigation.replace("MeatCheckoutSummary")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
});
