import { View, Text } from "react-native";
import { CircleCheckBig } from "lucide-react-native";
import PageShell, { shellStyles } from "../components/PageShell";

const infoItems = [
  {
    title: "Etibarlı",
    text: "Kəsimdən çatdırılmaya qədər olan hər bir mərhələdə tam şəffaflığa zəmanət veririk. İstər gündəlik ət satışı, istərsə də şəffaf Kollektiv Qurban layihələrimiz vasitəsilə xeyriyyə və ibadətlərinizin tam arxayınlıqla, doğru ünvana çatdırılmasını təmin edirik.",
  },
  {
    title: "Halal",
    text: "Bütün proseslərimiz İslami qaydalara, halal kəsim standartlarına və ciddi sanitariya-gigiyena normalarına tam uyğun şəkildə, peşəkar qəssablar tərəfindən icra olunur.",
  },
  {
    title: "Sürətli",
    text: "Sifarişləriniz xüsusi soyuq zəncir (soyuduculu) nəqliyyat sistemimizlə, təravətini və qida dəyərini itirmədən, ən qısa zamanda birbaşa qapınıza çatdırılır.",
  },
];

export default function AboutScreen() {
  return (
    <PageShell label="Haqqımızda" title="MEATBOX — təbiiliyi, dürüstlüyü və rəqəmsal rahatlığı bir araya gətirən platforma.">
      <View style={shellStyles.infoCard}>
        <Text style={{ fontSize: 13, lineHeight: 20, color: "#262626" }}>
          MEATBOX — təbiiliyi, dürüstlüyü və rəqəmsal rahatlığı bir araya gətirən müasir ət və qurbanlıq sifarişi platformasıdır. Bizim məqsədimiz, Azərbaycanın zəngin təbiətində bəslənən ən sağlam heyvanları seçərək, yüksək gigiyenik şəraitdə süfrənizə çatdırmaqdır.
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 20, color: "#262626", marginTop: 14 }}>
          İnnovativ texnologiyamız və sahəsində mütəxəssis komandamızla həm ailənizin sağlamlığını qorumaq, həm də rəqəmsal dünyanın rahatlığını sizə yaşatmaq üçün xidmətinizdəyik!
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
