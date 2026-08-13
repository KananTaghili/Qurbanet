import { View, Text } from "react-native";
import { CircleCheckBig } from "lucide-react-native";
import PageShell, { shellStyles } from "../components/PageShell";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

export default function AboutScreen() {
  const { lang } = useLanguage();
  const infoItems = [
    { title: t(lang, "about_trustTitle"), text: t(lang, "about_trustText") },
    { title: t(lang, "about_halalTitle"), text: t(lang, "about_halalText") },
    { title: t(lang, "about_fastTitle"), text: t(lang, "about_fastText") },
  ];

  return (
    <PageShell label={t(lang, "about_label")} title={t(lang, "about_title")}>
      <View style={shellStyles.infoCard}>
        <Text style={{ fontSize: scaleFont(13), lineHeight: moderateScale(20), color: "#262626" }}>
          {t(lang, "about_intro1")}
        </Text>
        <Text style={{ fontSize: scaleFont(13), lineHeight: moderateScale(20), color: "#262626", marginTop: scale(14) }}>
          {t(lang, "about_intro2")}
        </Text>
      </View>

      {infoItems.map((item) => (
        <View key={item.title} style={shellStyles.infoCard}>
          <CircleCheckBig size={22} color="#e10d0d" />
          <Text style={shellStyles.infoTitle}>{item.title}</Text>
          <Text style={shellStyles.infoText}>{item.text}</Text>
        </View>
      ))}
    </PageShell>
  );
}
