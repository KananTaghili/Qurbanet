import { View, Text, Image, StyleSheet } from "react-native";
import { Beef } from "lucide-react-native";

const PER_ROW = 5;

// Alınmış məhsulların dairəvi fotolarını soldan sağa üst-üstə düşən şəkildə
// göstərir (avatar-stack). Web-dəki components/meat/OrderCutAvatarStack.js portu.
export default function OrderCutAvatarStack({ items, size = 32 }) {
  if (!items || items.length === 0) return null;

  const rows = [];
  for (let i = 0; i < items.length; i += PER_ROW) {
    rows.push(items.slice(i, i + PER_ROW));
  }

  return (
    <View style={{ gap: 6 }}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", alignItems: "center" }}>
          {row.map((it, idx) => (
            <View
              key={idx}
              style={[
                styles.avatar,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  marginLeft: idx === 0 ? 0 : -size * 0.32,
                  zIndex: row.length - idx,
                },
              ]}
            >
              {it.imageUrl ? (
                <Image source={{ uri: it.imageUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Beef size={size * 0.5} color="rgba(75,15,15,0.6)" />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#F1E5E5",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarImg: { width: "100%", height: "100%" },
});
