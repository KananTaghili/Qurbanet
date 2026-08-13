import { View, Image, StyleSheet } from "react-native";

export default function IconPattern({
  Icon,
  source,
  size = 16,
  color = "#fff",
  opacity = 0.16,
  spacingX = 52,
  spacingY = 44,
  rows = 3,
  cols = 10,
  aspectRatio = 1.5,
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {Array.from({ length: rows }).map((_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            marginLeft: row % 2 === 0 ? -spacingX / 2 : 0,
            height: spacingY,
          }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <View key={col} style={{ width: spacingX, alignItems: "center", justifyContent: "center" }}>
              {source ? (
                <Image
                  source={source}
                  tintColor={color}
                  style={{ width: size, height: size / aspectRatio, opacity }}
                  resizeMode="contain"
                />
              ) : (
                <Icon size={size} color={color} strokeWidth={1.5} opacity={opacity} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
