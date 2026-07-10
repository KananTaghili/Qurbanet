import { View, Text, Pressable, StyleSheet } from "react-native";
import { HeartHandshake, Beef, ArrowRight } from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import PageShell from "../components/PageShell";

const cards = [
  { title: "Qurbanlıq Sifarişi", text: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Etibarlı və şəffaf xidmət.", Icon: Knife, color: "#0b6c24" },
  { title: "Kollektiv Qurban", text: "Birlikdə qurban kəsdirək, ehtiyacı olanlara pay göndərək. Şəffaf və etibarlı xeyriyyə platforması.", Icon: HeartHandshake, color: "#6820a3" },
  { title: "Ət Satışı", text: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.", Icon: Beef, color: "#f97316" },
];

function ServiceDetailCard({ item, index }) {
  const Icon = item.Icon;
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { borderColor: item.color }]}>
          <Icon size={22} color={item.color} weight="bold" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.index}>0{index + 1} / Xidmət</Text>
          <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
        </View>
      </View>
      <Text style={styles.text}>{item.text}</Text>
      <Pressable style={styles.linkRow}>
        <Text style={[styles.linkText, { color: item.color }]}>Ətraflı bax</Text>
        <ArrowRight size={14} color={item.color} />
      </Pressable>
    </View>
  );
}

export default function ServicesScreen() {
  return (
    <PageShell label="Xidmətlər" title="Üç əsas xidmət — qurbanlıq, kollektiv qurban və təzə ət satışı.">
      {cards.map((item, index) => (
        <ServiceDetailCard key={item.title} item={item} index={index} />
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead9cf",
    backgroundColor: "#fff8f1",
    padding: 14,
    marginTop: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  index: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", color: "#a3a3a3" },
  title: { marginTop: 2, fontSize: 15, fontWeight: "900" },
  text: { marginTop: 10, fontSize: 13, lineHeight: 19, color: "#404040" },
  linkRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  linkText: { fontSize: 13, fontWeight: "900" },
});
