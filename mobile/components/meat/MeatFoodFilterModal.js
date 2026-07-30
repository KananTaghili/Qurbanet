import { useState } from "react";
import { View, Text, TextInput, Image, Pressable, StyleSheet, FlatList } from "react-native";
import { X, Search, Check, UtensilsCrossed } from "lucide-react-native";

const BRAND = "#4B0F0F";

export default function MeatFoodFilterModal({ foods, initialSelectedIds, onApply, onClose }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialSelectedIds || []);

  const q = query.trim().toLowerCase();
  const filtered = q ? foods.filter((f) => f.nameAz?.toLowerCase().includes(q)) : foods;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Yeməklərə görə filtrlə</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X size={16} color="#a8a29e" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Search size={13} color="#a8a29e" style={{ marginRight: 6 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Yemək adına görə axtar..."
          placeholderTextColor="#a8a29e"
          style={styles.searchInput}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Yemək tapılmadı.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(f) => f._id}
          numColumns={3}
          contentContainerStyle={{ padding: 14, gap: 8 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item: f }) => {
            const isSel = selected.includes(f._id);
            return (
              <Pressable style={[styles.foodTile, isSel && styles.foodTileSelected]} onPress={() => toggle(f._id)}>
                {f.imageUrl ? (
                  <Image source={{ uri: f.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={styles.foodTileFallback}>
                    <UtensilsCrossed size={20} color="rgba(75,15,15,0.4)" />
                  </View>
                )}
                <View style={styles.foodTileShade} />
                {isSel && (
                  <View style={styles.foodTileCheckWrap}>
                    <View style={styles.foodTileCheck}>
                      <Check size={14} strokeWidth={3} color={BRAND} />
                    </View>
                  </View>
                )}
                <Text style={styles.foodTileName} numberOfLines={2}>{f.nameAz}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          disabled={selected.length === 0}
          onPress={() => { setSelected([]); onApply([]); }}
          style={styles.clearBtn}
        >
          <Text style={[styles.clearBtnText, selected.length === 0 && { opacity: 0.4 }]}>Təmizlə</Text>
        </Pressable>
        <Pressable style={styles.applyBtn} onPress={() => onApply(selected)}>
          <Text style={styles.applyBtnText}>Filtrlə{selected.length > 0 ? ` (${selected.length})` : ""}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f0ede8",
  },
  title: { fontSize: 13.5, fontWeight: "800", color: "#292524" },
  closeBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f4" },

  searchWrap: {
    flexDirection: "row", alignItems: "center", margin: 14, marginBottom: 0,
    height: 34, borderRadius: 10, borderWidth: 1, borderColor: "#eee", paddingHorizontal: 10, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 12.5, fontWeight: "500", color: "#292524", padding: 0 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 12.5, color: "#a8a29e", fontWeight: "600" },

  foodTile: {
    flex: 1, aspectRatio: 1, borderRadius: 12, overflow: "hidden",
    borderWidth: 2, borderColor: "#eee", backgroundColor: "#F1E5E5",
  },
  foodTileSelected: { borderColor: BRAND },
  foodTileFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  foodTileShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  foodTileCheckWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(75,15,15,0.25)", alignItems: "center", justifyContent: "center" },
  foodTileCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  foodTileName: {
    position: "absolute", left: 6, right: 6, bottom: 5,
    fontSize: 10, fontWeight: "800", color: "#fff",
  },

  footer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f0ede8",
  },
  clearBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  clearBtnText: { fontSize: 12, fontWeight: "700", color: "#57534e" },
  applyBtn: { marginLeft: "auto", backgroundColor: BRAND, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  applyBtnText: { fontSize: 12.5, fontWeight: "800", color: "#fff" },
});
