import { View, Text, Pressable, StyleSheet } from "react-native";
import { HeartHandshake, Beef, ArrowRight } from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import PageShell from "../components/PageShell";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

function cardsList(lang) {
  return [
    { title: t(lang, "services_card1Title"), text: t(lang, "services_card1Text"), Icon: Knife, color: "#0b6c24" },
    { title: t(lang, "services_card2Title"), text: t(lang, "services_card2Text"), Icon: HeartHandshake, color: "#6820a3" },
    { title: t(lang, "services_card3Title"), text: t(lang, "services_card3Text"), Icon: Beef, color: "#f97316" },
  ];
}

function ServiceDetailCard({ item, index, lang }) {
  const Icon = item.Icon;
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { borderColor: item.color }]}>
          <Icon size={22} color={item.color} weight="bold" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.index}>0{index + 1} / {t(lang, "services_indexSuffix")}</Text>
          <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
        </View>
      </View>
      <Text style={styles.text}>{item.text}</Text>
      <Pressable style={styles.linkRow}>
        <Text style={[styles.linkText, { color: item.color }]}>{t(lang, "services_viewMore")}</Text>
        <ArrowRight size={14} color={item.color} />
      </Pressable>
    </View>
  );
}

export default function ServicesScreen() {
  const { lang } = useLanguage();
  return (
    <PageShell label={t(lang, "services_label")} title={t(lang, "services_title")}>
      {cardsList(lang).map((item, index) => (
        <ServiceDetailCard key={item.title} item={item} index={index} lang={lang} />
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#ead9cf",
    backgroundColor: "#fff8f1",
    padding: scale(14),
    marginTop: scale(12),
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: scale(12) },
  iconWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    borderWidth: 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  index: { fontSize: scaleFont(10), fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", color: "#a3a3a3" },
  title: { marginTop: scale(2), fontSize: scaleFont(15), fontWeight: "900" },
  text: { marginTop: scale(10), fontSize: scaleFont(13), lineHeight: moderateScale(19), color: "#404040" },
  linkRow: { marginTop: scale(10), flexDirection: "row", alignItems: "center", gap: scale(6) },
  linkText: { fontSize: scaleFont(13), fontWeight: "900" },
});
