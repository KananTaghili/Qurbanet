import { useCallback } from "react";
import { View, ScrollView, Platform, StyleSheet } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import OrderStepHeader from "../components/OrderStepHeader";
import OrderContactForm from "../components/OrderContactForm";
import { scale } from "../lib/scale";

const BRAND = "#1c5e20";

export default function OrderContactScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const orderData = route.params || {};

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OrderStepHeader currentStep={2} />

      <ScrollView
        contentContainerStyle={{ padding: scale(12), paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <OrderContactForm
          accentColor={BRAND}
          onSuccess={() => navigation.replace("OrderSummary", orderData)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f5f2" },
});
