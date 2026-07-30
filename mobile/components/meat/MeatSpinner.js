import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const BRAND = "#4B0F0F";

// Veb-dəki "w-8 h-8 border-4 border-[#4B0F0F] border-t-transparent
// rounded-full animate-spin" yükləmə göstəricisinin RN portu — RN-in öz
// platforma-spesifik ActivityIndicator-u (iOS-da nöqtəli, Android-da fərqli)
// əvəzinə, web-lə eyni görünən (BRAND rəngli, üst tərəfi şəffaf, dövr edən)
// həlqə.
export default function MeatSpinner({ size = 32, color = BRAND }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotate]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(3, size / 8),
        borderColor: color,
        borderTopColor: "transparent",
        transform: [{ rotate: spin }],
      }}
    />
  );
}
