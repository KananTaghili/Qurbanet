import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../theme/colors";

const HOW_IT_WORKS_PAGES = [
  {
    step: 1,
    title: "QURBANLIQ SECIMI",
    desc: "Müxtəlif bölgələrimizdən gətirilən qurbanlıq xüsusiyyətlərinə malik heyvanlar sifariş etdiyiniz heyvan tipi, çəkisi və s. seçimlərinizə uyğun olaraq seçilir.",
    image: require("../assets/qoyun.jpg"),
  },
  {
    step: 2,
    title: "KESIM",
    desc: "Heyvanlar baytarlıq-sanitariya tələblərinə ciddi şəkildə riayət olunan heyvan kəsim məntəqələrində, xüsusi təmiz geyimdə işçi heyəti tərəfindən kəsilir. Kəsim prosesi bütünlüklə şəriət qaydalarına uyğun həyata keçirilir. Kəsim zamanı sizin adınız səsləndirilməklə qısa video çəkilir və sizin proqram səhifənizə göndərilir.",
    image: require("../assets/qoc.jpg"),
  },
  {
    step: 3,
    title: "HAZIRLANMA",
    desc: "Hazırlanma mərhələsində kəsilmiş qurbanlıq ətinin həm dadlı həm də yumuşaq olması üçün bir müddət otaq tempraturunda asılı vəziyyətdə saxlanılır daha sonra saxlamağa uyğun tempraturlarda olan soyuducularda dinləndirilir. Soyuducuda dinləndirilmiş qurbanlıq heyvan əti sizin seçiminizə uyğun olaraq tam cəmdək vəya doğranmış şəkildə paketlərə doldurularaq çatdırılmağa hazır vəiyyətə gətirilir.",
    image: require("../assets/dana.jpg"),
  },
  {
    step: 4,
    title: "CATDIRILMA",
    desc: "Çatdırılma ət məhsullarının daşınması və çatdırılması tələblərinə uyğun olaraq tempratur, gigiyena və sanitar qaydalara əməl edilməklə çatdırılır. Çatdırılma sizin sifariş zamanı seçdiyiniz tarixdə həyata keçirilir.",
    image: require("../assets/deve.jpg"),
  },
];

export default function HowItWorksScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const item = HOW_IT_WORKS_PAGES[activeIndex];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < HOW_IT_WORKS_PAGES.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Necə İşləyirik?</Text>
      <Text style={styles.subTitle}>
        4 mərhələ üzrə sağ-sol keçid edə bilərsiniz.
      </Text>

      <View style={styles.sliderCard}>
        <Image
          source={item.image}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{item.step}/4</Text>
        </View>

        <Text style={styles.stepTitle}>{item.title}</Text>
        <Text style={styles.stepDesc}>{item.desc}</Text>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
          disabled={!canGoPrev}
          onPress={() => setActiveIndex((p) => Math.max(0, p - 1))}
        >
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          {HOW_IT_WORKS_PAGES.map((p, idx) => (
            <View
              key={p.step}
              style={[styles.dot, idx === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          disabled={!canGoNext}
          onPress={() =>
            setActiveIndex((p) =>
              Math.min(HOW_IT_WORKS_PAGES.length - 1, p + 1),
            )
          }
        >
          <Text style={styles.navBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  sliderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  heroImage: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },
  stepBadgeText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#cfd8dc",
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
});
