import React, { useMemo, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";

// ─── Weight options per animal (same as QuantityScreen) ───────────────────────
const WEIGHT_OPTIONS = {
  qoyun: [
    { key: "35_40", label: "35-40 kq", price: 230 },
    { key: "40_45", label: "40-45 kq", price: 280 },
    { key: "45_50", label: "45-50 kq", price: 320 },
  ],
  dana: [
    { key: "180_220", label: "180-220 kq", price: 3200 },
    { key: "220_260", label: "220-260 kq", price: 3600 },
    { key: "260_300", label: "260-300 kq", price: 4000 },
  ],
};

const CHARITY_ANIMALS = [
  { key: "qoyun", label: "Qoyun", image: require("../assets/qoyun.jpg") },
  { key: "dana", label: "Dana", image: require("../assets/dana.jpg") },
];

// ─── Per-target configuration ─────────────────────────────────────────────────
const TARGET_CONFIG = {
  usaqlar_evi: {
    accentColor: "#1B5E20",
    surfaceColor: "#E8F5E9",
    modes: ["qurban"],
    qurbanMin: 200,
    giftMin: 200,
    giftLabel: "Hədiyyə",
    cashMin: null,
    cashLabel: null,
    cashStep: 50,
    heroDesc: "Qurban ver və uşaqlar üçün dəstək ol. Minimum 200 ₼.",
  },
  qocalar_evi: {
    accentColor: "#6A1B9A",
    surfaceColor: "#F3E5F5",
    modes: ["qurban"],
    qurbanMin: 200,
    giftMin: null,
    giftLabel: null,
    cashMin: 190,
    cashLabel: "Maddi yardım",
    cashStep: 50,
    heroDesc: "Qurban ver və yaşlılara dəstək ol. Minimum 200 ₼.",
  },
  ehtiyac_sahibleri: {
    accentColor: "#1565C0",
    surfaceColor: "#E3F2FD",
    modes: ["qurban"],
    qurbanMin: 50,
    giftMin: 50,
    giftLabel: "Hədiyyə",
    cashMin: 70,
    cashLabel: "Maddi yardım",
    cashStep: 50,
    heroDesc: "Qurban ver və ehtiyac sahiblərinə dəstək ol. Minimum 50 ₼.",
  },
};

const TARGET_ICONS = {
  usaqlar_evi: "home",
  qocalar_evi: "home-heart",
  ehtiyac_sahibleri: "handshake",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NeedSupportDetailScreen({ route, navigation }) {
  const target = route?.params?.target ?? "usaqlar_evi";
  const label = route?.params?.label ?? "Xeyriyyə";
  const config = TARGET_CONFIG[target] ?? TARGET_CONFIG.usaqlar_evi;
  const isCompact = target === "ehtiyac_sahibleri";

  const hasQurban = config.modes.includes("qurban");
  const hasGift = config.modes.includes("gift");
  const hasCash = config.modes.includes("cash");

  // Qurban state
  const [quantities, setQuantities] = useState({ qoyun: 0, dana: 0 });
  const [weights, setWeights] = useState({ qoyun: null, dana: null });

  // Gift amount state – initialise at minimum
  const [giftAmount, setGiftAmount] = useState(hasGift ? 0 : 0);
  const [cashAmount, setCashAmount] = useState(hasCash ? 0 : 0);

  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: config.accentColor,
      },
      headerTintColor: Colors.white,
    });
  }, [navigation, config.accentColor]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const qurbanTotal = useMemo(
    () =>
      CHARITY_ANIMALS.reduce((sum, a) => {
        const qty = quantities[a.key];
        const wKey = weights[a.key];
        if (qty > 0 && wKey) {
          const opt = WEIGHT_OPTIONS[a.key].find((o) => o.key === wKey);
          if (opt) return sum + qty * opt.price;
        }
        return sum;
      }, 0),
    [quantities, weights],
  );

  const totalAmount =
    (hasQurban ? qurbanTotal : 0) +
    (hasGift ? giftAmount : 0) +
    (hasCash ? cashAmount : 0);

  const qurbanAnySelected = CHARITY_ANIMALS.some((a) => quantities[a.key] > 0);
  const qurbanAllWeighted = CHARITY_ANIMALS.every(
    (a) => quantities[a.key] === 0 || weights[a.key] !== null,
  );
  const qurbanValid =
    qurbanAnySelected &&
    qurbanAllWeighted &&
    qurbanTotal >= (config.qurbanMin ?? 0);
  const giftSelected = giftAmount > 0;
  const giftValid = !giftSelected || giftAmount >= (config.giftMin ?? 0);
  const cashSelected = cashAmount > 0;
  const cashValid = !cashSelected || cashAmount >= (config.cashMin ?? 0);

  const hasAnySelection =
    (hasQurban && qurbanAnySelected) ||
    (hasGift && giftSelected) ||
    (hasCash && cashSelected);
  const canPay =
    hasAnySelection &&
    (!hasQurban || !qurbanAnySelected || qurbanValid) &&
    (!hasGift || giftValid) &&
    (!hasCash || cashValid);

  // Summary rows for payment screen
  const summaryRows = useMemo(() => {
    const rows = [];
    if (hasQurban) {
      CHARITY_ANIMALS.forEach((a) => {
        const qty = quantities[a.key];
        const wKey = weights[a.key];
        if (qty > 0 && wKey) {
          const opt = WEIGHT_OPTIONS[a.key].find((o) => o.key === wKey);
          if (opt) {
            rows.push({
              label: `Qurban - ${a.label} × ${qty}  (${opt.label})`,
              value: qty * opt.price,
            });
          }
        }
      });
    }
    if (hasGift && giftAmount > 0) {
      rows.push({ label: config.giftLabel || "Hədiyyə", value: giftAmount });
    }
    if (hasCash && cashAmount > 0) {
      rows.push({
        label: config.cashLabel || "Maddi yardım",
        value: cashAmount,
      });
    }
    return rows;
  }, [
    quantities,
    weights,
    giftAmount,
    cashAmount,
    hasQurban,
    hasGift,
    hasCash,
    config.giftLabel,
    config.cashLabel,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const changeQty = (animalKey, delta) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[animalKey] ?? 0) + delta);
      if (next === 0) setWeights((w) => ({ ...w, [animalKey]: null }));
      return { ...prev, [animalKey]: next };
    });
  };

  const changeGiftAmount = (delta) => {
    const step = config.cashStep ?? 50;
    const min = config.giftMin ?? 0;
    setGiftAmount((prev) => {
      if (delta > 0) {
        return prev <= 0 ? min : prev + step;
      }
      if (prev <= 0) return 0;
      if (prev <= min) return 0;
      return Math.max(0, prev - step);
    });
  };

  const changeCashAmount = (delta) => {
    const step = config.cashStep ?? 50;
    const min = config.cashMin ?? 0;
    setCashAmount((prev) => {
      if (delta > 0) {
        return prev <= 0 ? min : prev + step;
      }
      if (prev <= 0) return 0;
      if (prev <= min) return 0;
      return Math.max(0, prev - step);
    });
  };

  const handleOpenPayment = () => {
    navigation.navigate("CharityPayment", {
      label,
      accentColor: config.accentColor,
      summaryRows,
      totalAmount,
      charityType: target,
      modeKey: [hasQurban && "qurban", hasGift && "gift", hasCash && "cash"]
        .filter(Boolean)
        .join(","),
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View
          style={[
            styles.heroCard,
            isCompact && styles.heroCardCompact,
            {
              borderColor: config.accentColor + "33",
              backgroundColor: config.surfaceColor,
            },
          ]}
        >
          <View
            style={[
              styles.heroIconWrap,
              isCompact && styles.heroIconWrapCompact,
              { backgroundColor: config.accentColor + "22" },
            ]}
          >
            <MaterialCommunityIcons
              name={TARGET_ICONS[target] || "hand-heart-outline"}
              size={34}
              color={config.accentColor}
            />
            {target === "usaqlar_evi" ? (
              <View
                style={{
                  position: "absolute",
                  alignSelf: "center",
                  top: 16, // Evin mərkəzinə görə tənzimləmə
                  backgroundColor: "#1B5E20", // Arxa fon üçün yaşıl rəng
                  width: 20,
                  height: 20,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="flower"
                  size={18}
                  color="#FFFFFF" // Yaşılın üzərində ağ gül
                />
              </View>
            ) : null}
          </View>
          <Text style={[styles.heroTitle, { color: config.accentColor }]}>
            {label}
          </Text>
          <Text style={[styles.heroDesc, isCompact && styles.heroDescCompact]}>
            {config.heroDesc}
          </Text>
        </View>

        {/* ── QURBAN SECTION ── */}
        {hasQurban && (
          <View style={[styles.section, isCompact && styles.sectionCompact]}>
            <View
              style={[
                styles.sectionHeader,
                isCompact && styles.sectionHeaderCompact,
              ]}
            >
              <MaterialCommunityIcons
                name="cow"
                size={18}
                color={config.accentColor}
              />
              <Text
                style={[styles.sectionTitle, { color: config.accentColor }]}
              >
                Qurban ver
              </Text>
            </View>

            {CHARITY_ANIMALS.map((animal) => {
              const qty = quantities[animal.key];
              const selectedWeight = weights[animal.key];
              return (
                <View
                  key={animal.key}
                  style={[
                    styles.animalCard,
                    isCompact && styles.animalCardCompact,
                  ]}
                >
                  {/* Row: image + label + counter */}
                  <View
                    style={[
                      styles.animalRow,
                      isCompact && styles.animalRowCompact,
                    ]}
                  >
                    <View style={styles.animalLeft}>
                      <Image
                        source={animal.image}
                        style={[
                          styles.animalImage,
                          isCompact && styles.animalImageCompact,
                        ]}
                        resizeMode={animal.key === "dana" ? "contain" : "cover"}
                      />
                      <Text style={styles.animalLabel}>{animal.label}</Text>
                    </View>

                    {/* +/- counter */}
                    <View style={styles.counter}>
                      <TouchableOpacity
                        style={[
                          styles.counterBtn,
                          qty === 0 && styles.counterBtnDisabled,
                        ]}
                        onPress={() => changeQty(animal.key, -1)}
                        disabled={qty === 0}
                      >
                        <MaterialCommunityIcons
                          name="minus"
                          size={16}
                          color={
                            qty === 0
                              ? Colors.textSecondary
                              : config.accentColor
                          }
                        />
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.counterValue,
                          qty > 0 && { color: config.accentColor },
                        ]}
                      >
                        {qty}
                      </Text>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => changeQty(animal.key, 1)}
                      >
                        <MaterialCommunityIcons
                          name="plus"
                          size={16}
                          color={config.accentColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Weight range selector – visible only when qty > 0 */}
                  {qty > 0 && (
                    <View style={styles.weightSection}>
                      <Text style={styles.weightPrompt}>
                        Çəki aralığını seçin:
                      </Text>
                      <View style={styles.weightChips}>
                        {WEIGHT_OPTIONS[animal.key].map((opt) => {
                          const active = selectedWeight === opt.key;
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              style={[
                                styles.weightChip,
                                active && {
                                  backgroundColor: config.accentColor,
                                  borderColor: config.accentColor,
                                },
                              ]}
                              onPress={() =>
                                setWeights((prev) => ({
                                  ...prev,
                                  [animal.key]: opt.key,
                                }))
                              }
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.weightChipRange,
                                  active && { color: Colors.white },
                                ]}
                              >
                                {opt.label}
                              </Text>
                              <Text
                                style={[
                                  styles.weightChipPrice,
                                  active && { color: "rgba(255,255,255,0.85)" },
                                ]}
                              >
                                {opt.price} ₼
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {!selectedWeight && (
                        <View style={styles.weightWarning}>
                          <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={14}
                            color="#E65100"
                          />
                          <Text style={styles.weightWarningText}>
                            Çəki aralığı seçilməyib
                          </Text>
                        </View>
                      )}

                      {/* Xarakterli məlumat qutusu */}
                      <View
                        style={[
                          styles.infoBoxCharity,
                          {
                            borderColor: config.accentColor + "40",
                            backgroundColor: config.accentColor + "08",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={16}
                          color={config.accentColor}
                          style={{ marginTop: 1 }}
                        />
                        <Text style={styles.infoBoxCharityText}>
                          Yuxarıda göstərilmiş qiymətlərə qurbanlığın kəsilməsi,
                          bişirilməsi və{" "}
                          <Text style={{ fontWeight: "700" }}>
                            {target === "ehtiyac_sahibleri"
                              ? "ehtiyac sahiblərinə"
                              : `${label.toLowerCase()}nə`}
                          </Text>{" "}
                          çatdırılması daxildir.
                          {"\n\n"}
                          <Text style={{ fontWeight: "700" }}>Qeyd:</Text>{" "}
                          Qurbanlıqdan artıq qalan hissələr ehtiyac sahiblərinə
                          veriləcək.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Qurban subtotal */}
            {qurbanTotal > 0 && (
              <View
                style={[
                  styles.subtotalRow,
                  { backgroundColor: config.surfaceColor },
                ]}
              >
                <Text style={styles.subtotalLabel}>Qurban cəmi:</Text>
                <Text
                  style={[styles.subtotalValue, { color: config.accentColor }]}
                >
                  {qurbanTotal} ₼
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── GIFT MONEY SECTION ── */}
        {hasGift && (
          <View style={[styles.section, isCompact && styles.sectionCompact]}>
            <View
              style={[
                styles.sectionHeader,
                isCompact && styles.sectionHeaderCompact,
              ]}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={18}
                color={config.accentColor}
              />
              <Text
                style={[styles.sectionTitle, { color: config.accentColor }]}
              >
                {config.giftLabel || "Hədiyyə"}
              </Text>
            </View>

            <View
              style={[styles.cashCard, isCompact && styles.cashCardCompact]}
            >
              {/* Minus */}
              <TouchableOpacity
                style={[
                  styles.cashCircleBtn,
                  giftAmount <= 0 && styles.cashCircleBtnDisabled,
                ]}
                onPress={() => changeGiftAmount(-1)}
                disabled={giftAmount <= 0}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={22}
                  color={
                    giftAmount <= 0 ? Colors.textSecondary : config.accentColor
                  }
                />
              </TouchableOpacity>

              {/* Amount display */}
              <View style={styles.cashAmountWrap}>
                <Text
                  style={[
                    styles.cashAmount,
                    isCompact && styles.cashAmountCompact,
                    { color: config.accentColor },
                  ]}
                >
                  {giftAmount} ₼
                </Text>
                <Text style={styles.cashStepHint}>
                  hər +/- {config.cashStep ?? 50} ₼
                </Text>
              </View>

              {/* Plus */}
              <TouchableOpacity
                style={styles.cashCircleBtn}
                onPress={() => changeGiftAmount(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={config.accentColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── CASH MONEY SECTION ── */}
        {hasCash && (
          <View style={[styles.section, isCompact && styles.sectionCompact]}>
            <View
              style={[
                styles.sectionHeader,
                isCompact && styles.sectionHeaderCompact,
              ]}
            >
              <MaterialCommunityIcons
                name="currency-usd"
                size={18}
                color={config.accentColor}
              />
              <Text
                style={[styles.sectionTitle, { color: config.accentColor }]}
              >
                {config.cashLabel || "Maddi yardım"}
              </Text>
            </View>

            <View
              style={[styles.cashCard, isCompact && styles.cashCardCompact]}
            >
              <TouchableOpacity
                style={[
                  styles.cashCircleBtn,
                  cashAmount <= 0 && styles.cashCircleBtnDisabled,
                ]}
                onPress={() => changeCashAmount(-1)}
                disabled={cashAmount <= 0}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={22}
                  color={
                    cashAmount <= 0 ? Colors.textSecondary : config.accentColor
                  }
                />
              </TouchableOpacity>

              <View style={styles.cashAmountWrap}>
                <Text
                  style={[
                    styles.cashAmount,
                    isCompact && styles.cashAmountCompact,
                    { color: config.accentColor },
                  ]}
                >
                  {cashAmount} ₼
                </Text>
                <Text style={styles.cashStepHint}>
                  hər +/- {config.cashStep ?? 50} ₼
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cashCircleBtn}
                onPress={() => changeCashAmount(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={config.accentColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: isCompact ? 0 : 16 }} />
      </ScrollView>

      {/* ── STICKY BOTTOM BAR ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.actionRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Yekun Qiymət</Text>
            <Text style={[styles.totalValue, { color: config.accentColor }]}>
              {totalAmount} ₼
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.payBtn,
              { backgroundColor: config.accentColor },
              !canPay && styles.payBtnDisabled,
            ]}
            disabled={!canPay}
            onPress={handleOpenPayment}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>Ödə</Text>
            <MaterialCommunityIcons
              name="chevron-double-right"
              size={22}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 10,
    gap: 14,
  },
  scrollContentCompact: {
    padding: 12,
    paddingBottom: 2,
    gap: 8,
  },

  // ── Hero ──
  heroCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  heroCardCompact: {
    padding: 12,
    borderRadius: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroIconWrapCompact: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginBottom: 6,
  },
  heroUsaqFlowerWrap: {
    position: "absolute",
    top: 14,
    width: 18,
    height: 18,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B5E20",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  heroDescCompact: {
    fontSize: 12,
    lineHeight: 16,
  },

  // ── Section ──
  section: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sectionCompact: {
    borderRadius: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sectionHeaderCompact: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 7,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  minBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  minBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Animal card ──
  animalCard: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  animalCardCompact: {
    marginHorizontal: 8,
    marginBottom: 6,
    borderRadius: 12,
  },
  animalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  animalRowCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  animalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  animalImage: {
    width: 70,
    height: 55,
    borderRadius: 14,
  },
  animalImageCompact: {
    width: 62,
    height: 46,
    borderRadius: 10,
  },

  animalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterValue: {
    minWidth: 26,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  // ── Weight chips ──
  weightSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  weightPrompt: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: 8,
  },
  weightChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weightChip: {
    flex: 1,
    minWidth: "28%",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  weightChipRange: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  weightChipPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  weightWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  weightWarningText: {
    fontSize: 11,
    color: "#E65100",
    fontWeight: "600",
  },

  // ── Subtotal row ──
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 2,
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: "900",
  },

  // ── Cash card ──
  cashCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  cashCardCompact: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  cashCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cashCircleBtnDisabled: {
    opacity: 0.35,
  },
  cashAmountWrap: {
    alignItems: "center",
  },
  cashAmount: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },
  cashAmountCompact: {
    fontSize: 28,
  },
  cashStepHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },

  // ── Bottom bar ──
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  totalCard: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 1,
    letterSpacing: -0.5,
  },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  payBtnDisabled: {
    opacity: 0.4,
  },
  payBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  infoBoxCharity: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  infoBoxCharityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});
