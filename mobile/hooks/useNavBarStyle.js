import { useCallback } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";

export default function useNavBarStyle(buttonStyle, backgroundColor) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync(buttonStyle).catch(() => {});
      NavigationBar.setBackgroundColorAsync(backgroundColor).catch(() => {});
    }, [buttonStyle, backgroundColor])
  );
}
