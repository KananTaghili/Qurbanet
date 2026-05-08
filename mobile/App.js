import React from "react";
import { StatusBar } from "expo-status-bar";
import { registerRootComponent } from "expo";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#1B5E20" />
      <AppNavigator />
    </AuthProvider>
  );
}

registerRootComponent(App);
export default App;
