import { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing, StyleSheet } from "react-native";
import { scale, scaleFont } from "../lib/scale";

function Dot({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return <Animated.View style={[styles.dot, { transform: [{ scale }], opacity }]} />;
}

export default function SplashScreen() {
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.6, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();

    Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start();
    Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    Animated.timing(fade1, { toValue: 1, duration: 450, delay: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    Animated.timing(fade2, { toValue: 1, duration: 400, delay: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    Animated.timing(fade3, { toValue: 1, duration: 400, delay: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.glow,
          { transform: [{ scale: glowScale }], opacity: glowOpacity },
        ]}
      />

      <View style={styles.center}>
        <Animated.View style={{ opacity: iconOpacity, transform: [{ scale: iconScale }] }}>
          <Image source={require("../assets/images/app-icon.png")} style={styles.icon} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={[styles.wordmarkRow, { opacity: fade1, transform: [{ translateY: fade1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <Text style={styles.wordmark}>MEAT</Text>
          <Text style={[styles.wordmark, { color: "#dc2626" }]}>BOX</Text>
        </Animated.View>

        <Animated.View style={[styles.divider, { opacity: fade2 }]} />

        <Animated.Text style={[styles.slogan, { opacity: fade3, transform: [{ translateY: fade3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          ETİBARLI  ·  HALAL  ·  SÜRƏTLİ
        </Animated.Text>
      </View>

      <Animated.View style={[styles.dotsRow, { opacity: fade3 }]}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: scale(320),
    height: scale(320),
    borderRadius: scale(160),
    backgroundColor: "rgba(220,38,38,0.18)",
  },
  center: { alignItems: "center" },
  icon: { width: scale(130), height: scale(130), borderRadius: scale(28) },
  wordmarkRow: { flexDirection: "row", marginTop: scale(20) },
  wordmark: { fontSize: scaleFont(44), fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
  divider: { marginTop: scale(12), width: scale(36), height: scale(2), borderRadius: scale(2), backgroundColor: "#dc2626" },
  slogan: {
    marginTop: scale(10),
    fontSize: scaleFont(12),
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.7)",
  },
  dotsRow: {
    position: "absolute",
    bottom: scale(48),
    flexDirection: "row",
    gap: scale(8),
  },
  dot: { width: scale(7), height: scale(7), borderRadius: scale(3.5), backgroundColor: "#dc2626" },
});
