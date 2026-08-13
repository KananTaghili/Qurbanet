import { useEffect, useRef } from "react";
import { Animated } from "react-native";

// Shared slide-in/fade-in animation driver for the app's side menus.
export default function useSideMenuSlide(visible, width) {
  const slide = useRef(new Animated.Value(-width)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : -width,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return { slide, fade };
}
