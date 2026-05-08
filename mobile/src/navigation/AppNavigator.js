import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

// Screens
import HomeScreen from "../screens/HomeScreen";
import QuantityScreen from "../screens/QuantityScreen";
import DistributionScreen from "../screens/DistributionScreen";
import ContactInfoScreen from "../screens/ContactInfoScreen";
import DeliveryLocationPickerScreen from "../screens/DeliveryLocationPickerScreen";
import OrderSummaryScreen from "../screens/OrderSummaryScreen";
import PaymentScreen from "../screens/PaymentScreen";
import ConfirmationScreen from "../screens/ConfirmationScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import KnowledgeScreen from "../screens/KnowledgeScreen";
import OrphanDonationScreen from "../screens/OrphanDonationScreen";
import HowItWorksScreen from "../screens/HowItWorksScreen";
import NeedSupportScreen from "../screens/NeedSupportScreen";
import QurbanRulesScreen from "../screens/QurbanRulesScreen";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: "700", fontSize: 18 },
  headerBackTitleVisible: false,
  animation: "slide_from_right",
};

function MainStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Quantity"
        component={QuantityScreen}
        options={{ title: "Miqdar seçin" }}
      />
      <Stack.Screen
        name="Distribution"
        component={DistributionScreen}
        options={{ title: "Ət paylaması" }}
      />
      <Stack.Screen
        name="ContactInfo"
        component={ContactInfoScreen}
        options={{ title: "Əlaqə məlumatları", animation: "fade_from_bottom" }}
      />
      <Stack.Screen
        name="DeliveryLocationPicker"
        component={DeliveryLocationPickerScreen}
        options={{ title: "Xəritədə konum seç" }}
      />
      <Stack.Screen
        name="OrderSummary"
        component={OrderSummaryScreen}
        options={{ title: "Sifariş xülasəsi" }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: "Ödəniş", headerLeft: () => null }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: "Sifarişlərim" }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Sifariş detayı" }}
      />
      <Stack.Screen
        name="Knowledge"
        component={KnowledgeScreen}
        options={{ title: "Məlumatlandırıcı bölmə", animation: "fade" }}
      />
      <Stack.Screen
        name="HowItWorks"
        component={HowItWorksScreen}
        options={{ title: "Necə İşləyirik?", animation: "fade" }}
      />
      <Stack.Screen
        name="NeedSupport"
        component={NeedSupportScreen}
        options={{ title: "Ehdiyaclıları Sevindir", animation: "fade" }}
      />
      <Stack.Screen
        name="QurbanRules"
        component={QurbanRulesScreen}
        options={{ title: "Qurbanın Əhkamları", animation: "fade" }}
      />
      <Stack.Screen
        name="OrphanDonation"
        component={OrphanDonationScreen}
        options={{ title: "Yetimləri Sevindir", headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.primary,
        }}
      >
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}
