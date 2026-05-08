import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Colors } from "../theme/colors";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

const DELIVERY_WINDOWS = [
  "09:00-12:00",
  "12:00-15:00",
  "15:00-18:00",
  "18:00-21:00",
];

const QURBAN_PART_OPTIONS = [
  { key: "head", label: "1 baş göndərilsin" },
  { key: "feet", label: "2 ayaqları göndərilsin" },
];

const ANIMAL_ASSETS = {
  quzu: require("../assets/qoyun.jpg"),
  qoyun: require("../assets/qoyun.jpg"),
  qoc: require("../assets/qoc.jpg"),
  dana: require("../assets/dana.jpg"),
  deve: require("../assets/deve.jpg"),
};

const WEIGHT_OPTIONS_BY_ANIMAL = {
  quzu: [
    { key: "20_25", labelAz: "20-25 kq", price: 240 },
    { key: "25_30", labelAz: "25-30 kq", price: 280 },
    { key: "30_40", labelAz: "30-40 kq", price: 340 },
  ],
  qoyun: [
    { key: "35_40", labelAz: "35-40 kq", price: 230 },
    { key: "40_45", labelAz: "40-45 kq", price: 280 },
    { key: "45_50", labelAz: "45-50 kq", price: 320 },
  ],
  qoc: [
    { key: "35_40", labelAz: "35-40 kq", price: 250 },
    { key: "40_45", labelAz: "40-45 kq", price: 300 },
    { key: "45_50", labelAz: "45-50 kq", price: 340 },
  ],
  keci: [
    { key: "25_30", labelAz: "25-30 kq", price: 220 },
    { key: "30_35", labelAz: "30-35 kq", price: 260 },
    { key: "35_40", labelAz: "35-40 kq", price: 300 },
  ],
  dana: [
    { key: "180_220", labelAz: "180-220 kq", price: 3200 },
    { key: "220_260", labelAz: "220-260 kq", price: 3600 },
    { key: "260_300", labelAz: "260-300 kq", price: 4000 },
  ],
  deve: [
    { key: "300_350", labelAz: "300-350 kq", price: 4200 },
    { key: "350_400", labelAz: "350-400 kq", price: 4700 },
    { key: "400_450", labelAz: "400-450 kq", price: 5200 },
  ],
};

const formatDateLabel = (date) =>
  date.toLocaleDateString("az-AZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function QuantityScreen({ navigation, route }) {
  const { animal } = route.params;
  const animalTypeKey = (animal?.type || "").toLowerCase();
  const effectiveWeightOptions =
    animal.weightOptions?.length > 0
      ? animal.weightOptions
      : WEIGHT_OPTIONS_BY_ANIMAL[animalTypeKey] || [];

  useCategoryActiveGuard({
    animalType: animal?.type,
    navigation,
    enabled: !!animal?.type,
  });

  const isLargeAnimal = ["dana", "deve"].includes(animalTypeKey);
  const isLamb = animalTypeKey === "quzu";
  const hasWeightOptions = effectiveWeightOptions.length > 0;

  const [orderMode, setOrderMode] = useState("tek");
  const [quantity, setQuantity] = useState(1);
  const [sharedPortion, setSharedPortion] = useState(0.1);
  const [slaughterTimingHours, setSlaughterTimingHours] = useState(24);
  const [slaughterOffset, setSlaughterOffset] = useState(1);
  const [deliveryWindow, setDeliveryWindow] = useState(DELIVERY_WINDOWS[0]);
  const [lambWeightKey, setLambWeightKey] = useState(
    effectiveWeightOptions[0]?.key || "",
  );
  const [meatFormKey, setMeatFormKey] = useState(
    animal.meatFormOptions?.[0]?.key || "tam_cemdek",
  );
  const [qurbanParts, setQurbanParts] = useState({
    head: false,
    feet: false,
  });

  const maxQty = 99;
  const totalShares = Math.max(1, Number(animal.totalShares) || 1);
  const shareCount = Math.round(sharedPortion * 10);

  const selectedWeight = hasWeightOptions
    ? effectiveWeightOptions.find((item) => item.key === lambWeightKey)
    : null;
  const selectedMeatForm = isLamb
    ? animal.meatFormOptions?.find((item) => item.key === meatFormKey)
    : null;

  const baseUnitPrice = animal.pricePerShare / totalShares;
  const weightedUnitPrice = hasWeightOptions
    ? Number(
        (
          Number(selectedWeight?.price || animal.pricePerShare) +
          Number(isLamb ? selectedMeatForm?.extraFee || 0 : 0)
        ).toFixed(2),
      )
    : baseUnitPrice;

  const totalPrice = useMemo(() => {
    if (hasWeightOptions) {
      if (orderMode === "serikli") {
        return Number(
          ((weightedUnitPrice / totalShares) * shareCount).toFixed(2),
        );
      }
      return Number((weightedUnitPrice * quantity).toFixed(2));
    }
    if (orderMode === "serikli")
      return Number((baseUnitPrice * shareCount).toFixed(2));
    return Number((animal.pricePerShare * quantity).toFixed(2));
  }, [
    animal.pricePerShare,
    baseUnitPrice,
    hasWeightOptions,
    orderMode,
    quantity,
    shareCount,
    totalShares,
    weightedUnitPrice,
  ]);

  const canContinue = true;

  const slaughterDate = new Date();
  slaughterDate.setHours(9, 0, 0, 0);
  slaughterDate.setDate(slaughterDate.getDate() + slaughterOffset);

  const deliveryDate = new Date(slaughterDate);

  const handleContinue = () => {
    navigation.navigate("Distribution", {
      animal,
      quantity: orderMode === "serikli" ? sharedPortion : quantity,
      orderMode,
      sharedPortion: orderMode === "serikli" ? sharedPortion : undefined,
      lambSelection: hasWeightOptions
        ? {
            weightCategoryKey: lambWeightKey,
            ...(isLamb ? { meatFormKey } : {}),
          }
        : undefined,
      slaughterTimingHours,
      slaughterDate: slaughterDate.toISOString(),
      deliveryDate: deliveryDate.toISOString(),
      deliveryWindow,
      qurbanParts: {
        head: qurbanParts.head,
        feet: qurbanParts.feet,
      },
      totalPrice,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OrderStepHeader currentStep={1} />

      <View style={styles.animalCard}>
        <View style={styles.animalRow}>
          <View style={styles.animalMediaCol}>
            <Image
              source={
                animal.imageUrl
                  ? { uri: animal.imageUrl }
                  : ANIMAL_ASSETS[(animal.type || "").toLowerCase()] ||
                    ANIMAL_ASSETS.qoyun
              }
              style={styles.animalImage}
            />
            <Text style={styles.animalName}>{animal.nameAz}</Text>
          </View>

          <View style={styles.quantityPanel}>
            <Text style={styles.quantityTitle}>
              {orderMode === "serikli" ? "Hissə seçin" : "Miqdarı seçin"}
            </Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  orderMode === "serikli"
                    ? setSharedPortion((p) =>
                        Number(Math.max(0.1, p - 0.1).toFixed(1)),
                      )
                    : setQuantity((q) => Math.max(1, q - 1))
                }
              >
                <Text style={styles.counterBtnText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.counterValue}>
                {orderMode === "serikli"
                  ? `${shareCount}/${totalShares}`
                  : `${quantity}`}
              </Text>

              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  orderMode === "serikli"
                    ? setSharedPortion((p) =>
                        Number(Math.min(0.6, p + 0.1).toFixed(1)),
                      )
                    : setQuantity((q) => Math.min(maxQty, q + 1))
                }
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {isLargeAnimal ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sifariş növü</Text>
          <View style={styles.row}>
            <Chip
              active={orderMode === "tek"}
              onPress={() => setOrderMode("tek")}
              label="Tam heyvan"
            />
            <Chip
              active={orderMode === "serikli"}
              onPress={() => setOrderMode("serikli")}
              label="Şərikli"
            />
          </View>
        </View>
      ) : null}

      {hasWeightOptions ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Uyğun çəki kateqoriyası seçin</Text>
          <View style={styles.weightGrid}>
            {effectiveWeightOptions.map((item) => (
              <View key={item.key} style={styles.weightCell}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    styles.optionCompact,
                    lambWeightKey === item.key && styles.optionActive,
                  ]}
                  onPress={() => setLambWeightKey(item.key)}
                >
                  <Text style={styles.optionText}>{item.labelAz}</Text>
                  <Text style={styles.optionPrice}>{item.price} ₼</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {isLamb ? (
            <>
              <Text style={[styles.cardTitle, { marginTop: 14 }]}>
                Hazır əti hansı formada alacaqsınız?
              </Text>
              {animal.meatFormOptions?.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.option,
                    meatFormKey === item.key && styles.optionActive,
                  ]}
                  onPress={() => setMeatFormKey(item.key)}
                >
                  <Text style={styles.optionText}>{item.labelAz}</Text>
                  <Text style={styles.optionPrice}>
                    {item.extraFee > 0
                      ? `+${item.extraFee} ₼`
                      : "Əlavə ödənişsiz"}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hissə seçimi</Text>
        <Text style={styles.subTitleNoMargin}>
          Qurbanlığın hansı hissələri göndərilsin?
        </Text>

        <View style={styles.partsGrid}>
          {QURBAN_PART_OPTIONS.map((item) => (
            <View key={item.key} style={styles.partCell}>
              <CheckOption
                label={item.label}
                checked={qurbanParts[item.key]}
                onPress={() =>
                  setQurbanParts((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kəsim vaxtı</Text>
        <View style={styles.row}>
          <Chip
            label="1 gün sonra"
            active={slaughterTimingHours === 24}
            onPress={() => setSlaughterTimingHours(24)}
          />
          <Chip
            label="48 saat sonra"
            active={slaughterTimingHours === 48}
            onPress={() => setSlaughterTimingHours(48)}
          />
        </View>

        <Text style={styles.subTitle}>Kəsim günü (default: Sabah)</Text>
        <View style={styles.rowWrap}>
          {[1, 2, 3, 4, 5].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            return (
              <Chip
                key={String(offset)}
                label={formatDateLabel(d)}
                active={slaughterOffset === offset}
                onPress={() => setSlaughterOffset(offset)}
              />
            );
          })}
        </View>

        <Text style={styles.subTitle}>
          Çatdırılma saatı (3 saatlıq interval)
        </Text>
        <View style={styles.rowWrap}>
          {DELIVERY_WINDOWS.map((item) => (
            <Chip
              key={item}
              label={item}
              active={deliveryWindow === item}
              onPress={() => setDeliveryWindow(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Cəmi məbləğ</Text>
          <Text style={styles.totalValue}>{totalPrice} ₼</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonInline,
            !canContinue && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Növbəti: Çatdırılma seç</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CheckOption({ label, checked, onPress, bold = false }) {
  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
        <Text style={[styles.checkMark, checked && styles.checkMarkActive]}>
          {checked ? "✓" : ""}
        </Text>
      </View>
      <Text style={[styles.checkLabel, bold && styles.checkLabelBold]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  animalCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  animalRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  animalMediaCol: {
    width: 92,
    alignItems: "center",
  },
  animalImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  animalName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  quantityPanel: {
    flex: 1,
    marginLeft: 8,
  },
  quantityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { color: Colors.white, fontSize: 24, fontWeight: "700" },
  counterValue: { fontSize: 34, fontWeight: "800", color: Colors.primary },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: Colors.primary },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  optionCompact: {
    marginBottom: 0,
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  optionText: { color: Colors.textPrimary, fontWeight: "600" },
  optionPrice: { color: Colors.primary, fontWeight: "700" },
  actionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 12,
  },
  totalCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    justifyContent: "center",
    flex: 1,
  },
  totalLabel: { color: Colors.white, fontSize: 15, fontWeight: "600" },
  totalValue: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 16,
  },
  buttonInline: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  subTitleNoMargin: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: 8,
  },
  weightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  weightCell: {
    width: "48.5%",
  },
  partsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  partCell: {
    width: "48.5%",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  checkMark: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  checkMarkActive: {
    color: Colors.primary,
  },
  checkLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  checkLabelBold: {
    fontWeight: "700",
  },
});
