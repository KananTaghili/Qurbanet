import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { Phone, Mail, MapPin, Clock } from "lucide-react-native";
import PageShell, { shellStyles } from "../components/PageShell";

const contacts = [
  { icon: Phone, title: "Telefon", text: "+994 10 399 02 22", url: "https://wa.me/994103990222", note: "WhatsApp ilə yazın" },
  { icon: Mail, title: "Email", text: "info@meatbox.az", url: "mailto:info@meatbox.az" },
  { icon: MapPin, title: "Ünvan", text: "Bakı, Azərbaycan" },
  { icon: Clock, title: "İş saatları", text: "Hər gün 09:00–20:00" },
];

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
  return (
    <PageShell label="Əlaqə" title="Sualınız var? MeatBox komandası ilə əlaqə saxlayın.">
      {contacts.map((c) => (
        <InfoCard key={c.title} {...c} />
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#171717" },
  text: { marginTop: 6, fontSize: 13, lineHeight: 19, color: "#404040" },
  note: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "#16a34a" },
});
