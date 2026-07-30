import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import OrderAnimalMap from "./OrderAnimalMap";
import { groupByAnimal } from "./OrderReceipt";
import { PART_DISPLAY } from "./AnimalBodyMap";
import { BRAND, TINT } from "./MeatOrderPipeline";

// Heyvanın PART_DISPLAY konfiqurasiyası yoxdursa (məs. keçi/dəvə), sadəcə hər
// hissəyə sırayla nömrə verib item-lərdən adını götürür. Web-dəki
// components/meat/OrderAnimalPicker.js-in portu.
function getPurchasedParts(group) {
  const purchasedPartKeys = new Set(group.items.map((it) => it.partKey));
  const config = PART_DISPLAY[group.animalKey];
  if (config) {
    return config.order
      .filter((key) => purchasedPartKeys.has(key))
      .map((key) => ({ key, badge: config.badges[key], name: config.names?.[key] || key }));
  }
  return [...purchasedPartKeys].map((key, i) => ({
    key,
    badge: String(i + 1),
    name: group.items.find((it) => it.partKey === key)?.partNameAz || key,
  }));
}

const PARTS_PAGE_SIZE = 4;
const SWIPE_THRESHOLD = 40;

function useSwipe(onNext, onPrev) {
  const start = useRef(null);
  return {
    onTouchStart: (e) => {
      const t = e.nativeEvent.touches[0];
      start.current = { x: t.pageX, y: t.pageY };
    },
    onTouchEnd: (e) => {
      if (!start.current) return;
      const t = e.nativeEvent.changedTouches[0];
      const dx = t.pageX - start.current.x;
      const dy = t.pageY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) onNext();
        else onPrev();
      }
    },
  };
}

export default function OrderAnimalPicker({ items, onPartsCountChange, onAnimalsCountChange }) {
  const groups = groupByAnimal(items || []);
  const [activeAnimalKey, setActiveAnimalKey] = useState(groups[0]?.animalKey);
  const [partsPage, setPartsPage] = useState(0);

  useEffect(() => {
    setPartsPage(0);
  }, [activeAnimalKey]);

  const group = groups.find((g) => g.animalKey === activeAnimalKey) || groups[0];
  const purchasedParts = group ? getPurchasedParts(group) : [];

  useEffect(() => {
    onPartsCountChange?.(purchasedParts.length);
  }, [purchasedParts.length]);

  useEffect(() => {
    onAnimalsCountChange?.(groups.length);
  }, [groups.length]);

  if (!group) return null;

  const purchasedPartKeys = new Set(group.items.map((it) => it.partKey));
  const partsTotalPages = Math.ceil(purchasedParts.length / PARTS_PAGE_SIZE);
  const pagedParts = purchasedParts.slice(partsPage * PARTS_PAGE_SIZE, partsPage * PARTS_PAGE_SIZE + PARTS_PAGE_SIZE);

  const animalSwipe = useSwipe(
    () => {
      if (groups.length < 2) return;
      const idx = groups.findIndex((g) => g.animalKey === activeAnimalKey);
      setActiveAnimalKey(groups[(idx + 1) % groups.length].animalKey);
    },
    () => {
      if (groups.length < 2) return;
      const idx = groups.findIndex((g) => g.animalKey === activeAnimalKey);
      setActiveAnimalKey(groups[(idx - 1 + groups.length) % groups.length].animalKey);
    },
  );

  const partsSwipe = useSwipe(
    () => setPartsPage((p) => (p + 1) % partsTotalPages),
    () => setPartsPage((p) => (p - 1 + partsTotalPages) % partsTotalPages),
  );

  return (
    <View>
      {groups.length > 1 && (
        <View style={styles.animalTabs}>
          {groups.map((g) => {
            const active = g.animalKey === activeAnimalKey;
            return (
              <Pressable
                key={g.animalKey}
                style={[styles.animalTab, active && { backgroundColor: BRAND }]}
                onPress={() => setActiveAnimalKey(g.animalKey)}
              >
                <Text style={[styles.animalTabText, { color: active ? "#fff" : "#78716C" }]}>
                  {g.animalNameAz}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View {...animalSwipe} style={styles.mapWrap} collapsable={false}>
        <OrderAnimalMap
          animalKey={group.animalKey}
          purchasedPartKeys={purchasedPartKeys}
          showLabels
          style={{ flex: 1 }}
        />
      </View>

      {purchasedParts.length > 1 && (
        <View style={styles.partsRow}>
          {partsTotalPages > 1 && (
            <Pressable
              onPress={() => setPartsPage((p) => (p - 1 + partsTotalPages) % partsTotalPages)}
              style={[styles.arrowBtn, styles.arrowLeft]}
            >
              <ChevronLeft size={20} color={BRAND} />
            </Pressable>
          )}

          <View
            {...partsSwipe}
            collapsable={false}
            style={[styles.partsGrid, partsTotalPages > 1 && { marginHorizontal: 30 }]}
          >
            {pagedParts.map((p) => (
              <View key={p.key} style={styles.partChip}>
                <View style={styles.partBadge}>
                  <Text style={styles.partBadgeText}>{p.badge}</Text>
                </View>
                <Text style={styles.partChipText} numberOfLines={2}>
                  {p.name}
                </Text>
              </View>
            ))}
            {partsTotalPages > 1 &&
              Array.from({ length: PARTS_PAGE_SIZE - pagedParts.length }).map((_, i) => (
                <View key={`ph-${i}`} style={[styles.partChip, { opacity: 0 }]} />
              ))}
          </View>

          {partsTotalPages > 1 && (
            <Pressable
              onPress={() => setPartsPage((p) => (p + 1) % partsTotalPages)}
              style={[styles.arrowBtn, styles.arrowRight]}
            >
              <ChevronRight size={18} color={BRAND} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  animalTabs: {
    flexDirection: "row",
    gap: 4,
    padding: 3,
    borderRadius: 10,
    backgroundColor: "#F1EDE6",
    marginBottom: 14,
  },
  animalTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  animalTabText: { fontSize: 15.5, fontWeight: "700" },

  mapWrap: { width: "100%", height: 220 },

  partsRow: { marginTop: 20, flexDirection: "row", alignItems: "center" },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0ede8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: { left: -6 },
  arrowRight: { right: -6 },
  partsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  partChip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 13,
    paddingRight: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: TINT,
  },
  partBadge: {
    position: "absolute",
    top: -9,
    left: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
    borderWidth: 2,
    borderColor: "#fff",
  },
  partBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  partChipText: { flex: 1, fontSize: 14.5, fontWeight: "600", color: BRAND },
});
