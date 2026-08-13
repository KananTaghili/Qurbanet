import { useState } from "react";
import { View, Text, TextInput, Image, Pressable, StyleSheet, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg from "react-native-svg";
import { X, Search, Check, UtensilsCrossed } from "lucide-react-native";
import { scale, scaleFont } from "../../lib/scale";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/i18n";
import { BodyShape, VIEWBOX, ANIMAL_COLOR } from "./AnimalBodyMap";

const BRAND = "#4B0F0F";

// Yemək kartının künc nişanı üçün — heyvan bədən xəritəsindəki (AnimalBodyMap)
// eyni vektor siluetlərdən istifadə olunur, foto deyil.
const FOOD_ANIMAL_BADGE_KEYS = ["qoyun", "dana"];

function AnimalBadgeIcon({ animalKey, size }) {
  return (
    <Svg viewBox={VIEWBOX} width={size} height={size}>
      <BodyShape animalKey={animalKey} color={ANIMAL_COLOR} />
    </Svg>
  );
}

export default function MeatFoodFilterModal({ foods, foodAnimalMap, initialSelectedIds, onApply, onClose }) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialSelectedIds || []);

  const q = query.trim().toLowerCase();
  const filtered = q ? foods.filter((f) => f.nameAz?.toLowerCase().includes(q)) : foods;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(lang, "foodFilter_title")}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X size={18} color="#a8a29e" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Search size={15} color="#a8a29e" style={{ marginRight: scale(7) }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(lang, "foodFilter_searchPlaceholder")}
          placeholderTextColor="#a8a29e"
          style={styles.searchInput}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t(lang, "foodFilter_empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(f) => f._id}
          numColumns={2}
          contentContainerStyle={{ padding: scale(14), gap: scale(10) }}
          columnWrapperStyle={{ gap: scale(10), justifyContent: "flex-start" }}
          renderItem={({ item: f }) => {
            const isSel = selected.includes(f._id);
            const animalKeys = [...(foodAnimalMap?.[f._id] || [])].filter(
              (k) => FOOD_ANIMAL_BADGE_KEYS.includes(k),
            );
            return (
              <Pressable style={[styles.foodTile, isSel && styles.foodTileSelected]} onPress={() => toggle(f._id)}>
                {f.imageUrl ? (
                  <Image source={{ uri: f.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={styles.foodTileFallback}>
                    <UtensilsCrossed size={28} color="rgba(75,15,15,0.4)" />
                  </View>
                )}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.foodTileGradient}
                />
                {/* Bu yeməyin hansı heyvan(lar)a aid olduğunu göstərən künc
                    nişanları — istifadəçi qoyun səhifəsindəykən dana yeməyi
                    seçəndə "niyə heç nə çıxmır" çaşqınlığının qarşısını alır. */}
                {animalKeys.length > 0 && (
                  <View style={styles.foodTileBadgeRow}>
                    {animalKeys.map((k) => (
                      <AnimalBadgeIcon key={k} animalKey={k} size={scale(38)} />
                    ))}
                  </View>
                )}
                {isSel && (
                  <View style={styles.foodTileCheckWrap}>
                    <View style={styles.foodTileCheck}>
                      <Check size={18} strokeWidth={3} color={BRAND} />
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
          <Text style={[styles.clearBtnText, selected.length === 0 && { opacity: 0.4 }]}>{t(lang, "foodFilter_clear")}</Text>
        </Pressable>
        <Pressable style={styles.applyBtn} onPress={() => onApply(selected)}>
          <Text style={styles.applyBtnText}>{t(lang, "foodFilter_apply")}{selected.length > 0 ? ` (${selected.length})` : ""}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: scale(18), paddingVertical: scale(15), borderBottomWidth: 1, borderBottomColor: "#f0ede8",
  },
  title: { fontSize: scaleFont(16), fontWeight: "800", color: "#292524" },
  closeBtn: { width: scale(32), height: scale(32), borderRadius: scale(9), alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f4" },

  searchWrap: {
    flexDirection: "row", alignItems: "center", margin: scale(16), marginBottom: 0,
    height: scale(42), borderRadius: scale(12), borderWidth: 1, borderColor: "#eee", paddingHorizontal: scale(12), backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: scaleFont(14.5), fontWeight: "500", color: "#292524", padding: 0 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: scaleFont(14), color: "#a8a29e", fontWeight: "600" },

  foodTile: {
    width: "48%", aspectRatio: 1, borderRadius: scale(14), overflow: "hidden",
    borderWidth: 2, borderColor: "#eee", backgroundColor: "#F1E5E5",
  },
  foodTileSelected: { borderColor: BRAND },
  foodTileFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  foodTileGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "42%" },
  foodTileBadgeRow: { position: "absolute", top: scale(6), right: scale(6), flexDirection: "row", gap: scale(4) },
  foodTileCheckWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(75,15,15,0.25)", alignItems: "center", justifyContent: "center" },
  foodTileCheck: { width: scale(30), height: scale(30), borderRadius: scale(15), backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  foodTileName: {
    position: "absolute", left: scale(9), right: scale(9), bottom: scale(8),
    fontSize: scaleFont(14), fontWeight: "800", color: "#fff",
  },

  footer: {
    flexDirection: "row", alignItems: "center", gap: scale(10),
    paddingHorizontal: scale(16), paddingVertical: scale(14), borderTopWidth: 1, borderTopColor: "#f0ede8",
  },
  clearBtn: { paddingVertical: scale(11), paddingHorizontal: scale(16), borderRadius: scale(12) },
  clearBtnText: { fontSize: scaleFont(14), fontWeight: "700", color: "#57534e" },
  applyBtn: { marginLeft: "auto", backgroundColor: BRAND, paddingVertical: scale(12), paddingHorizontal: scale(22), borderRadius: scale(14) },
  applyBtnText: { fontSize: scaleFont(14.5), fontWeight: "800", color: "#fff" },
});
