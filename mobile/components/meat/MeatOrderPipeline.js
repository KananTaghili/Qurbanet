import { View, Text, StyleSheet } from "react-native";
import { ShoppingCart, Package, Truck, Star, XCircle } from "lucide-react-native";
import { scale, moderateScale, scaleFont } from "../../lib/scale";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/i18n";

// Web-dəki components/meat/OrderPipeline.js portu — Ət Satışı sifarişləri
// üçün pipeline addımları (awaiting_payment gizlədilib, bax
// [[project-unpaid-orders-hidden]] — bura heç vaxt çatmır).
export const BRAND = "#4B0F0F";
export const TINT = "#F1E5E5";

// labelKey resolves via t(lang, ...) at render time so the pipeline updates
// live when the user switches language — the exported array itself only
// carries icons (some screens import PIPELINE_STEPS just for `.Icon`).
export const PIPELINE_STEPS = [
  { labelKey: "pipeline_placed", Icon: ShoppingCart },
  { labelKey: "pipeline_preparing", Icon: Package },
  { labelKey: "pipeline_delivering", Icon: Truck },
  { labelKey: "pipeline_completed", Icon: Star },
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

const DATE_LOCALE = { az: "az-AZ", ru: "ru-RU", en: "en-US" };

// Hermes-də (Android) tam ICU olmadan toLocaleString("az-AZ") gözlənilməz
// nəticə verə bilər — ona görə tarixi əl ilə formatlayırıq (digər Ət Satışı
// ekranlarında olduğu kimi).
function fmtDateTime(ds, lang) {
  const d = new Date(ds);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const monthsShort = t(lang, "months_short");
  return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

export function CancelledBadge() {
  const { lang } = useLanguage();
  return (
    <View style={styles.cancelledBadge}>
      <XCircle size={20} color="#DC2626" />
      <Text style={styles.cancelledText}>{t(lang, "orders_cancelled")}</Text>
    </View>
  );
}

// Şaquli status xətti — sifariş detayında "Sifariş statusu" kartı üçün.
export function PipelineVertical({ step, statusHistory = [] }) {
  const { lang } = useLanguage();
  if (step < 0) return <CancelledBadge />;

  const timeByStatus = {};
  for (const h of statusHistory) timeByStatus[h.status] = h.at;

  return (
    <View>
      {PIPELINE_STEPS.map(({ labelKey, Icon }, i) => {
        const done = i <= step;
        const isLast = i === PIPELINE_STEPS.length - 1;
        const at = timeByStatus[STEP_STATUS_KEYS[i]];
        return (
          <View key={i} style={{ flexDirection: "row", gap: scale(12) }}>
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
              <Text style={[styles.vLabel, { color: done ? "#292524" : "#a8a29e" }]}>{t(lang, labelKey)}</Text>
              {at && <Text style={styles.vTime}>{fmtDateTime(at, lang)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Üfüqi pipeline — sifariş kartında (siyahı) kompakt görünüş üçün.
export default function Pipeline({ step }) {
  const { lang } = useLanguage();
  if (step < 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {PIPELINE_STEPS.map(({ labelKey, Icon }, i) => {
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
              {t(lang, labelKey)}
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
    gap: scale(8),
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  cancelledText: { fontSize: scaleFont(15), fontWeight: "800", color: "#991B1B" },

  vCircle: { width: scale(36), height: scale(36), borderRadius: scale(18), borderWidth: 2, alignItems: "center", justifyContent: "center" },
  vConnector: { width: scale(2), flex: 1, marginVertical: scale(2), minHeight: scale(24) },
  vLabel: { fontSize: scaleFont(16), fontWeight: "700" },
  vTime: { fontSize: scaleFont(13), color: "#a8a29e", marginTop: scale(3) },

  hLine: { flex: 1, height: scale(2) },
  hCircle: { width: scale(34), height: scale(34), borderRadius: scale(17), borderWidth: 2, alignItems: "center", justifyContent: "center" },
  hLabel: { fontSize: scaleFont(11.5), fontWeight: "700", marginTop: scale(6), textAlign: "center", lineHeight: moderateScale(14) },
});
