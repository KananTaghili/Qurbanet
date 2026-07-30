import { View, Text, StyleSheet } from "react-native";
import { ShoppingCart, Package, Truck, Star, XCircle } from "lucide-react-native";

// Web-dəki components/meat/OrderPipeline.js portu — Ət Satışı sifarişləri
// üçün pipeline addımları (awaiting_payment gizlədilib, bax
// [[project-unpaid-orders-hidden]] — bura heç vaxt çatmır).
export const BRAND = "#4B0F0F";
export const TINT = "#F1E5E5";

export const PIPELINE_STEPS = [
  { label: "Sifariş verildi", Icon: ShoppingCart },
  { label: "Hazırlanır", Icon: Package },
  { label: "Çatdırılır", Icon: Truck },
  { label: "Tamamlandı", Icon: Star },
];

export const STATUS_STEP = {
  awaiting_payment: 0,
  placed: 0,
  preparing: 1,
  delivering: 2,
  completed: 3,
  cancelled: -1,
};

const STEP_STATUS_KEYS = ["placed", "preparing", "delivering", "completed"];

const AZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyun", "İyul", "Avq", "Sen", "Okt", "Noy", "Dek"];

// Hermes-də (Android) tam ICU olmadan toLocaleString("az-AZ") gözlənilməz
// nəticə verə bilər — ona görə tarixi əl ilə formatlayırıq (digər Ət Satışı
// ekranlarında olduğu kimi).
function fmtDateTime(ds) {
  const d = new Date(ds);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

export function CancelledBadge() {
  return (
    <View style={styles.cancelledBadge}>
      <XCircle size={20} color="#DC2626" />
      <Text style={styles.cancelledText}>Ləğv edildi</Text>
    </View>
  );
}

// Şaquli status xətti — sifariş detayında "Sifariş statusu" kartı üçün.
export function PipelineVertical({ step, statusHistory = [] }) {
  if (step < 0) return <CancelledBadge />;

  const timeByStatus = {};
  for (const h of statusHistory) timeByStatus[h.status] = h.at;

  return (
    <View>
      {PIPELINE_STEPS.map(({ label, Icon }, i) => {
        const done = i <= step;
        const isLast = i === PIPELINE_STEPS.length - 1;
        const at = timeByStatus[STEP_STATUS_KEYS[i]];
        return (
          <View key={i} style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ alignItems: "center" }}>
              <View
                style={[
                  styles.vCircle,
                  { backgroundColor: done ? BRAND : "#f1ede8", borderColor: done ? BRAND : "#d6d3d1" },
                ]}
              >
                <Icon size={17} color={done ? "#fff" : "#a8a29e"} />
              </View>
              {!isLast && (
                <View style={[styles.vConnector, { backgroundColor: done && i < step ? BRAND : "#e5e7eb" }]} />
              )}
            </View>
            <View style={{ paddingBottom: isLast ? 0 : 20 }}>
              <Text style={[styles.vLabel, { color: done ? "#292524" : "#a8a29e" }]}>{label}</Text>
              {at && <Text style={styles.vTime}>{fmtDateTime(at)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Üfüqi pipeline — sifariş kartında (siyahı) kompakt görünüş üçün.
export default function Pipeline({ step }) {
  if (step < 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {PIPELINE_STEPS.map(({ label, Icon }, i) => {
        const done = i <= step;
        const isLast = i === PIPELINE_STEPS.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
              <View style={[styles.hLine, { backgroundColor: i === 0 ? "transparent" : done ? BRAND : "#e5e7eb" }]} />
              <View style={[styles.hCircle, { backgroundColor: done ? BRAND : "#f1ede8", borderColor: done ? BRAND : "#d6d3d1" }]}>
                <Icon size={16} color={done ? "#fff" : "#a8a29e"} />
              </View>
              <View style={[styles.hLine, { backgroundColor: isLast ? "transparent" : done && i < step ? BRAND : "#e5e7eb" }]} />
            </View>
            <Text style={[styles.hLabel, { color: done ? BRAND : "#a8a29e" }]} numberOfLines={2}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelledText: { fontSize: 15, fontWeight: "800", color: "#991B1B" },

  vCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  vConnector: { width: 2, flex: 1, marginVertical: 2, minHeight: 24 },
  vLabel: { fontSize: 16, fontWeight: "700" },
  vTime: { fontSize: 13, color: "#a8a29e", marginTop: 3 },

  hLine: { flex: 1, height: 2 },
  hCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  hLabel: { fontSize: 11.5, fontWeight: "700", marginTop: 6, textAlign: "center", lineHeight: 14 },
});
