import { useEffect, useRef, useState } from "react";
import { Modal, View, Animated, Pressable, StyleSheet, Dimensions } from "react-native";
import { scale } from "../../lib/scale";

// Web-dəki MobileGrowModal.js-in RN portu: dairəvi düymədən "böyüyərək"
// açılan, bağlananda eyni nöqtəyə "kiçilərək" yox olan panel.
// anchor — { x, y } düymənin ekrandakı MƏRKƏZ koordinatları (measure() ilə).
export default function MobileGrowModal({ open, anchor, onClose, children, panelHeight }) {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const { width: screenW, height: screenH } = Dimensions.get("window");

  useEffect(() => {
    if (open) {
      setVisible(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else if (visible) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!visible) return null;

  const centerX = screenW / 2;
  const centerY = screenH / 2;
  const ax = anchor?.x ?? centerX;
  const ay = anchor?.y ?? centerY;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [ax - centerX, 0] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [ay - centerY, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] });
  const borderRadius = progress.interpolate({ inputRange: [0, 1], outputRange: [999, 22] });
  const opacity = progress;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.panel,
            panelHeight ? { height: panelHeight } : null,
            { opacity, borderRadius, transform: [{ translateX }, { translateY }, { scale }] },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: scale(12) },
  panel: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
});
