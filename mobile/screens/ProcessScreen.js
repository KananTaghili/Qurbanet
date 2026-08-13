import { View, Text, StyleSheet } from "react-native";
import PageShell, { shellStyles } from "../components/PageShell";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

function stepsList(lang) {
  return [
    { title: t(lang, "process_step1Title"), text: t(lang, "process_step1Text") },
    { title: t(lang, "process_step2Title"), text: t(lang, "process_step2Text") },
    { title: t(lang, "process_step3Title"), text: t(lang, "process_step3Text") },
    { title: t(lang, "process_step4Title"), text: t(lang, "process_step4Text") },
  ];
}

export default function ProcessScreen() {
  const { lang } = useLanguage();
  const steps = stepsList(lang);
  return (
    <PageShell label={t(lang, "process_label")} title={t(lang, "process_title")}>
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
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#e10d0d",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#fff", fontWeight: "900", fontSize: scaleFont(14) },
});
