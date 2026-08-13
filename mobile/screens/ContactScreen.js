import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { Phone, Mail, MapPin, Clock } from "lucide-react-native";
import PageShell, { shellStyles } from "../components/PageShell";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

function contactsList(lang) {
  return [
    { icon: Phone, title: t(lang, "contact_phoneTitle"), text: "+994 10 399 02 22", url: "https://wa.me/994103990222", note: t(lang, "contact_whatsappNote") },
    { icon: Mail, title: t(lang, "authForm_emailLabel"), text: "info@meatbox.az", url: "mailto:info@meatbox.az" },
    { icon: MapPin, title: t(lang, "contact_addressTitle"), text: t(lang, "contact_addressText") },
    { icon: Clock, title: t(lang, "contact_hoursTitle"), text: t(lang, "contact_hoursText") },
  ];
}

function InfoCard({ icon: Icon, title, text, url, note }) {
  const content = (
    <>
      <Icon size={26} color="#e10d0d" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {note && <Text style={styles.note}>{note}</Text>}
    </>
  );
  return url ? (
    <Pressable style={shellStyles.infoCard} onPress={() => Linking.openURL(url)}>
      {content}
    </Pressable>
  ) : (
    <View style={shellStyles.infoCard}>{content}</View>
  );
}

export default function ContactScreen() {
  const { lang } = useLanguage();
  return (
    <PageShell label={t(lang, "contact_label")} title={t(lang, "contact_title")}>
      {contactsList(lang).map((c) => (
        <InfoCard key={c.title} {...c} />
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: scale(10), fontSize: scaleFont(16), fontWeight: "900", color: "#171717" },
  text: { marginTop: scale(6), fontSize: scaleFont(13), lineHeight: moderateScale(19), color: "#404040" },
  note: { marginTop: scale(4), fontSize: scaleFont(11), fontWeight: "700", color: "#16a34a" },
});
