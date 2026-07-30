import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MeatCartProvider } from "./context/MeatCartContext";
import { MeatDeliveryLocationProvider } from "./context/MeatDeliveryLocationContext";
import SplashScreen from "./components/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import AboutScreen from "./screens/AboutScreen";
import ServicesScreen from "./screens/ServicesScreen";
import ProcessScreen from "./screens/ProcessScreen";
import ContactScreen from "./screens/ContactScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import OtpScreen from "./screens/OtpScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import QurbanScreen from "./screens/QurbanScreen";
import MeatHomeScreen from "./screens/MeatHomeScreen";
import MeatHowItWorksScreen from "./screens/MeatHowItWorksScreen";
import MeatProductsScreen from "./screens/MeatProductsScreen";
import MeatCartScreen from "./screens/MeatCartScreen";
import MeatMyOrdersScreen from "./screens/MeatMyOrdersScreen";
import MeatOrderDetailScreen from "./screens/MeatOrderDetailScreen";
import MeatCheckoutSummaryScreen from "./screens/MeatCheckoutSummaryScreen";
import MeatCheckoutPaymentScreen from "./screens/MeatCheckoutPaymentScreen";
import SettingsScreen from "./screens/SettingsScreen";
import OrderQuantityScreen from "./screens/OrderQuantityScreen";
import OrderDistributionScreen from "./screens/OrderDistributionScreen";
import OrderSummaryScreen from "./screens/OrderSummaryScreen";
import OrderPaymentScreen from "./screens/OrderPaymentScreen";
import OrderConfirmationScreen from "./screens/OrderConfirmationScreen";
import HowItWorksQurbanScreen from "./screens/HowItWorksQurbanScreen";
import QurbanRulesScreen from "./screens/QurbanRulesScreen";
import MyOrdersScreen from "./screens/MyOrdersScreen";
import OrderDetailScreen from "./screens/OrderDetailScreen";
import CollectiveQurbanScreen from "./screens/CollectiveQurbanScreen";
import HowItWorksCollectiveScreen from "./screens/HowItWorksCollectiveScreen";
import TermsCollectiveScreen from "./screens/TermsCollectiveScreen";
import CollectiveConfirmationScreen from "./screens/CollectiveConfirmationScreen";
import CampaignDetailScreen from "./screens/CampaignDetailScreen";
import CompletedCampaignsScreen from "./screens/CompletedCampaignsScreen";
import MyDonationsScreen from "./screens/MyDonationsScreen";

const Stack = createNativeStackNavigator();

function AppShell() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setButtonStyleAsync("dark").catch(() => {});
  }, []);

  // Veb-də tətbiqə "girərkən" heç bir brendli splash/gecikmə yoxdur — məzmun
  // hazır olan kimi dərhal görünür. Əvvəllər burada süni MIN_SPLASH_MS (2.5san)
  // gecikməsi ilə tam-ekran animasiyalı splash göstərilirdi; indi yalnız
  // auth vəziyyəti HƏQİQƏTƏN yüklənərkən (adətən ani) minimal spinner görünür.
  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Process" component={ProcessScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Qurban" component={QurbanScreen} />
        <Stack.Screen name="MeatHome" component={MeatHomeScreen} />
        <Stack.Screen name="MeatHowItWorks" component={MeatHowItWorksScreen} />
        <Stack.Screen name="MeatProducts" component={MeatProductsScreen} />
        <Stack.Screen name="MeatCart" component={MeatCartScreen} />
        <Stack.Screen name="MeatMyOrders" component={MeatMyOrdersScreen} />
        <Stack.Screen name="MeatOrderDetail" component={MeatOrderDetailScreen} />
        <Stack.Screen name="MeatCheckoutSummary" component={MeatCheckoutSummaryScreen} />
        <Stack.Screen name="MeatCheckoutPayment" component={MeatCheckoutPaymentScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="OrderQuantity" component={OrderQuantityScreen} />
        <Stack.Screen
          name="OrderDistribution"
          component={OrderDistributionScreen}
        />
        <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
        <Stack.Screen name="OrderPayment" component={OrderPaymentScreen} />
        <Stack.Screen
          name="OrderConfirmation"
          component={OrderConfirmationScreen}
        />
        <Stack.Screen
          name="HowItWorksQurban"
          component={HowItWorksQurbanScreen}
        />
        <Stack.Screen name="QurbanRules" component={QurbanRulesScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen
          name="CollectiveQurban"
          component={CollectiveQurbanScreen}
        />
        <Stack.Screen
          name="HowItWorksCollective"
          component={HowItWorksCollectiveScreen}
        />
        <Stack.Screen
          name="TermsCollective"
          component={TermsCollectiveScreen}
        />
        <Stack.Screen
          name="CollectiveConfirmation"
          component={CollectiveConfirmationScreen}
        />
        <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
        <Stack.Screen
          name="CompletedCampaigns"
          component={CompletedCampaignsScreen}
        />
        <Stack.Screen name="MyDonations" component={MyDonationsScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MeatCartProvider>
          <MeatDeliveryLocationProvider>
            <AppShell />
          </MeatDeliveryLocationProvider>
        </MeatCartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
