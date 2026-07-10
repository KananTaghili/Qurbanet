import { View, Text, StyleSheet } from "react-native";
import PageShell, { shellStyles } from "../components/PageShell";

const steps = [
  { title: "Xidməti seçin", text: "Qurbanlıq sifarişi, Kollektiv Qurban və ya Ət Satışı xidmətlərindən birini seçin." },
  { title: "Sifarişi təsdiqləyin", text: "MeatBox komandası sifarişinizi qəbul edib, prosesi addım-addım idarə edir." },
  { title: "Video hesabat alın", text: "Kəsim prosesini real vaxt rejimində video ilə izləyin və arxayın olun." },
  { title: "Çatdırılmanı qəbul edin", text: "Soyuq zəncir nəqliyyatla ətiniz və ya payınız ən qısa zamanda çatdırılır." },
];

export default function ProcessScreen() {
  return (
    <PageShell label="Necə işləyir?" title="Sifarişdən çatdırılmaya qədər proses sadə və şəffafdır.">
      {steps.map((step, i) => (
        <View key={step.title} style={shellStyles.infoCard}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={shellStyles.infoTitle}>{step.title}</Text>
          <Text style={shellStyles.infoText}>{step.text}</Text>
        </View>
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e10d0d",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
