import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import OrderAnimalMap from "./OrderAnimalMap";
import OrderCutAvatarStack from "./OrderCutAvatarStack";

// items-i heyvana görə qruplaşdırır (ilk gördüyü sıra ilə) — bir sifarişdə
// həm qoyun, həm dana ola bilər. Web-dəki components/meat/OrderReceipt.js-dəki
// groupByAnimal ilə eynidir.
export function groupByAnimal(items) {
  const groups = new Map();
  for (const it of items) {
    if (!groups.has(it.animalKey)) {
      groups.set(it.animalKey, { animalKey: it.animalKey, animalNameAz: it.animalNameAz, items: [] });
    }
    groups.get(it.animalKey).items.push(it);
  }
  return [...groups.values()];
}

// Sifariş kartında (siyahı) göstərilən statik, klik olunmayan kompakt xülasə —
// heyvan başına bədən xəritəsi + alınmış kəsimlərin avatar-stack-i. 2+ heyvan
// olanda (Qoyun + Dana kimi) sətir enli olub üfüqi scroll olur — web-dəki
// kimi, RN-in öz scrollbar-ı (sürüşdürmə anında yox olan) əvəzinə, sağda da
// məzmun olduğunu bildirən HƏMİŞƏ görünən öz cızdığımız irəliləyiş zolağı var.
export default function OrderReceipt({ items }) {
  const animalGroups = groupByAnimal(items || []);
  const [track, setTrack] = useState({ canScroll: false, ratio: 1, progress: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const updateTrack = (scrollX, cw = containerWidth, sw = contentWidth) => {
    const canScroll = sw > cw + 1;
    const ratio = cw > 0 ? Math.min(1, cw / sw) : 1;
    const progress = canScroll ? scrollX / (sw - cw) : 0;
    setTrack({ canScroll, ratio, progress: Math.max(0, Math.min(1, progress)) });
  };

  return (
    <View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setContainerWidth(w);
          updateTrack(0, w, contentWidth);
        }}
        onContentSizeChange={(w) => {
          setContentWidth(w);
          updateTrack(0, containerWidth, w);
        }}
        onScroll={(e) => updateTrack(e.nativeEvent.contentOffset.x)}
      >
        {animalGroups.map((group, idx) => {
          const purchasedPartKeys = new Set(group.items.map((it) => it.partKey));
          const totalKg = group.items.reduce((s, it) => s + (Number(it.quantityKg) || 0), 0);
          const cutAvatars = group.items.map((it) => ({
            nameAz: it.cutNameAz,
            imageUrl: it.imageUrl,
          }));

          return (
            <View key={group.animalKey} style={[styles.group, idx > 0 && styles.groupSep]}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.animalNameAz}</Text>
                <Text style={styles.groupSub}>
                  {group.items.length} kəsim · {totalKg} kq
                </Text>
              </View>
              <View style={styles.groupBody}>
                <OrderAnimalMap
                  animalKey={group.animalKey}
                  purchasedPartKeys={purchasedPartKeys}
                  style={styles.map}
                />
                <OrderCutAvatarStack items={cutAvatars} size={42} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {track.canScroll && (
        <View style={styles.scrollTrack}>
          <View
            style={[
              styles.scrollThumb,
              { width: `${track.ratio * 100}%`, left: `${track.progress * (100 - track.ratio * 100)}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(240,237,232,0.8)",
    backgroundColor: "#FBF8F4",
  },
  scrollContent: { flexDirection: "row" },
  group: { paddingHorizontal: 15, paddingVertical: 13 },
  groupSep: { borderLeftWidth: 1, borderLeftColor: "#EDE6DD" },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
  groupTitle: { fontSize: 15.5, fontWeight: "700", color: "#292524" },
  groupSub: { fontSize: 14, fontWeight: "600", color: "#A8A29E" },
  groupBody: { flexDirection: "row", alignItems: "center", gap: 13 },
  map: { width: 145, height: 98 },

  scrollTrack: {
    height: 4,
    marginTop: 6,
    marginHorizontal: 2,
    borderRadius: 999,
    backgroundColor: "#EDE6DD",
    overflow: "hidden",
  },
  scrollThumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "rgba(75,15,15,0.45)",
  },
});
