import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  UIManager,
  findNodeHandle,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FontAwesome6 } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DELIVERY_WINDOWS = ["12:00-15:00", "15:00-18:00", "18:00-21:00"];

const WEEKDAY_LABELS = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

const CUT_STYLE_UNASSIGNED_KEY = "unassigned";

const getPartBucketOptions = (partKey) => [
  { key: "free", label: "Təmizlənməmiş (Xam)" },
  { key: "torched", label: "Ütülmüş" },
  { key: "ready", label: "Təmizlənmiş və doğranmış" },
  { key: "charity", label: "Ehtiyac sahiblərinə sədəqə" },
];

const formatDateLabel = (date) =>
  date.toLocaleDateString("az-AZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const getInitialSlaughterDate = () => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const createPartAllocation = (headTotalCount, feetTotalCount) => ({
  headTotalCount,
  headUnassignedCount: headTotalCount,
  headFreeCount: 0,
  headTorchedCount: 0,
  headCharityCount: 0,
  headReadyCount: 0,
  feetTotalCount,
  feetUnassignedCount: feetTotalCount,
  feetFreeCount: 0,
  feetTorchedCount: 0,
  feetCharityCount: 0,
  feetReadyCount: 0,
});

const normalizePartAllocation = (
  allocation,
  headTotalCount,
  feetTotalCount,
) => {
  const normalizePart = (prefix, totalCount) => {
    const total = Math.max(0, Number(totalCount) || 0);
    const next = {
      free: Math.max(0, Number(allocation[`${prefix}FreeCount`]) || 0),
      torched: Math.max(0, Number(allocation[`${prefix}TorchedCount`]) || 0),
      ready: Math.max(0, Number(allocation[`${prefix}ReadyCount`]) || 0),
      charity: Math.max(0, Number(allocation[`${prefix}CharityCount`]) || 0),
    };

    let sum = next.free + next.torched + next.ready + next.charity;
    if (sum > total) {
      let overflow = sum - total;
      const reduceOrder = ["charity", "ready", "torched", "free"];
      for (const key of reduceOrder) {
        if (overflow <= 0) break;
        const removable = Math.min(next[key], overflow);
        next[key] -= removable;
        overflow -= removable;
      }
      sum = next.free + next.torched + next.ready + next.charity;
    }

    const unassigned = Math.max(0, total - sum);
    return {
      total,
      unassigned,
      ...next,
    };
  };

  const head = normalizePart("head", headTotalCount);
  const feet = normalizePart("feet", feetTotalCount);

  return {
    headTotalCount: head.total,
    headUnassignedCount: head.unassigned,
    headFreeCount: head.free,
    headTorchedCount: head.torched,
    headCharityCount: head.charity,
    headReadyCount: head.ready,
    feetTotalCount: feet.total,
    feetUnassignedCount: feet.unassigned,
    feetFreeCount: feet.free,
    feetTorchedCount: feet.torched,
    feetCharityCount: feet.charity,
    feetReadyCount: feet.ready,
  };
};

const createCutStyleAllocation = (totalCount, styles = []) => {
  const normalizedTotal = Math.max(1, Number(totalCount) || 1);
  const initial = styles.reduce((acc, item) => {
    acc[item.key] = 0;
    return acc;
  }, {});
  initial[CUT_STYLE_UNASSIGNED_KEY] = normalizedTotal;
  return initial;
};

const normalizeCutStyleAllocation = (allocation, totalCount, styles = []) => {
  const normalizedTotal = Math.max(1, Number(totalCount) || 1);
  const next = styles.reduce((acc, item) => {
    acc[item.key] = Math.max(0, Number(allocation?.[item.key]) || 0);
    return acc;
  }, {});
  next[CUT_STYLE_UNASSIGNED_KEY] = Math.max(
    0,
    Number(allocation?.[CUT_STYLE_UNASSIGNED_KEY]) || 0,
  );

  let sum = styles.reduce((acc, item) => acc + next[item.key], 0);
  sum += next[CUT_STYLE_UNASSIGNED_KEY];
  if (sum < normalizedTotal) {
    next[CUT_STYLE_UNASSIGNED_KEY] += normalizedTotal - sum;
  } else if (sum > normalizedTotal) {
    let overflow = sum - normalizedTotal;
    const defaultKey = styles[0]?.key || "tam_cemdek";
    const stealOrder = [
      ...styles.map((item) => item.key).filter((key) => key !== defaultKey),
      CUT_STYLE_UNASSIGNED_KEY,
      defaultKey,
    ];

    for (const key of stealOrder) {
      if (overflow <= 0) break;
      const removable = Math.min(next[key], overflow);
      next[key] -= removable;
      overflow -= removable;
    }
  }

  return next;
};

const getMaxSplitByAnimal = ({
  animalTypeKey,
  orderMode,
  shareCount,
  quantity,
}) => {
  const qty = Math.max(1, quantity || 1);
  if (["qoyun", "qoc"].includes(animalTypeKey)) return 3 * qty;
  if (animalTypeKey === "dana") {
    if (orderMode === "serikli") return Math.max(1, shareCount * 3);
    return 10 * qty;
  }
  if (animalTypeKey === "deve") {
    if (orderMode === "serikli") return Math.max(1, shareCount * 3);
    return 20 * qty;
  }
  return 3 * qty;
};

export default function QuantityScreen({ navigation, route }) {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  const remainingAnchorRefs = useRef({
    cutStyle: null,
    head: null,
    feet: null,
  });
  const insets = useSafeAreaInsets();
  const { animal } = route.params;
  const animalTypeKey = (animal?.type || "").toLowerCase();
  const effectiveWeightOptions =
    animal.weightOptions?.length > 0 ? animal.weightOptions : [];

  useCategoryActiveGuard({
    animalType: animal?.type,
    navigation,
    enabled: !!animal?.type,
  });

  const isLargeAnimal = ["dana", "deve"].includes(animalTypeKey);
  const hasWeightOptions = effectiveWeightOptions.length > 0;

  const [orderMode, setOrderMode] = useState(
    animal.totalShares > 1 ? "serikli" : "tek",
  );
  const [quantity, setQuantity] = useState(1);
  const [sharedPortion, setSharedPortion] = useState(0.1);
  const [slaughterDateValue, setSlaughterDateValue] = useState(
    getInitialSlaughterDate,
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = getInitialSlaughterDate();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [deliveryWindow, setDeliveryWindow] = useState(DELIVERY_WINDOWS[0]);
  const [lambWeightKey, setLambWeightKey] = useState(
    effectiveWeightOptions[0]?.key || "",
  );
  const effectiveCutStyles = animal.cutStyleOptions || [];

  const [cutStyleAllocation, setCutStyleAllocation] = useState(() =>
    createCutStyleAllocation(1, effectiveCutStyles),
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [selfShareCount, setSelfShareCount] = useState(null);
  const [note, setNote] = useState("");
  const [qurbanParts, setQurbanParts] = useState(() =>
    createPartAllocation(
      animal.hasHeadOption !== false ? 1 : 0,
      animal.hasFeetOption !== false ? 4 : 0,
    ),
  );

  const maxQty = 99;
  const totalShares = Math.max(1, Number(animal.totalShares) || 1);
  const shareCount = Math.round(sharedPortion * 10);

  const selectedWeight = hasWeightOptions
    ? effectiveWeightOptions.find((item) => item.key === lambWeightKey)
    : null;
  const qurbanPartFees = animal.qurbanPartFees || { head: 0, feet: 0 };
  const qurbanPartProcessingFees = animal.qurbanPartProcessingFees || {
    head: 0,
    feet: 0,
  };

  const qurbanAnimalCount = orderMode === "serikli" ? 1 : Math.max(1, quantity);
  const headTotalCount = animal.hasHeadOption !== false ? qurbanAnimalCount : 0;
  const feetTotalCount =
    animal.hasFeetOption !== false ? qurbanAnimalCount * 4 : 0;

  const normalizedCutStyleAllocation = useMemo(
    () =>
      normalizeCutStyleAllocation(
        cutStyleAllocation,
        qurbanAnimalCount,
        effectiveCutStyles,
      ),
    [cutStyleAllocation, qurbanAnimalCount, effectiveCutStyles],
  );

  const selectedCutStyle = useMemo(() => {
    const entries = effectiveCutStyles
      .map((item) => ({
        key: item.key,
        count: normalizedCutStyleAllocation[item.key] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    const dominantKey =
      entries[0]?.count > 0
        ? entries[0].key
        : effectiveCutStyles[0]?.key || "tam_cemdek";
    return (
      effectiveCutStyles.find((item) => item.key === dominantKey) ||
      effectiveCutStyles[0]
    );
  }, [normalizedCutStyleAllocation, effectiveCutStyles]);

  const cutStyleBreakdown = useMemo(
    () =>
      effectiveCutStyles.map((item) => ({
        key: item.key,
        label: item.labelAz,
        count: normalizedCutStyleAllocation[item.key] || 0,
        unitFee: Number(item.fee || 0),
      })),
    [effectiveCutStyles, normalizedCutStyleAllocation],
  );
  const cutStyleUnassignedCount =
    normalizedCutStyleAllocation[CUT_STYLE_UNASSIGNED_KEY] || 0;

  const maxSplitCount = useMemo(
    () =>
      getMaxSplitByAnimal({
        animalTypeKey,
        orderMode,
        shareCount,
        quantity,
      }),
    [animalTypeKey, orderMode, shareCount, quantity],
  );

  useEffect(() => {
    setSelfShareCount((prev) => {
      if (prev == null) return maxSplitCount;
      return Math.min(prev, maxSplitCount);
    });
  }, [maxSplitCount]);

  useEffect(() => {
    if (isLargeAnimal) return;
    setQurbanParts((prev) =>
      normalizePartAllocation(prev, headTotalCount, feetTotalCount),
    );
  }, [headTotalCount, feetTotalCount, isLargeAnimal]);

  useEffect(() => {
    if (isLargeAnimal) {
      setCutStyleAllocation(createCutStyleAllocation(0, []));
      return;
    }
    setCutStyleAllocation((prev) =>
      normalizeCutStyleAllocation(prev, qurbanAnimalCount, effectiveCutStyles),
    );
  }, [qurbanAnimalCount, isLargeAnimal, effectiveCutStyles]);

  const safeSelfShareCount =
    selfShareCount == null ? maxSplitCount : selfShareCount;
  const charityShareCount = Math.max(0, maxSplitCount - safeSelfShareCount);

  const baseUnitPrice = animal.pricePerShare / totalShares;
  const weightedUnitPrice = hasWeightOptions
    ? Number(Number(selectedWeight?.price || animal.pricePerShare).toFixed(2))
    : baseUnitPrice;

  const totalPrice = useMemo(() => {
    let baseTotal;
    if (hasWeightOptions) {
      if (orderMode === "serikli") {
        baseTotal = Number(
          (
            (Number(selectedWeight?.price || animal.pricePerShare) /
              totalShares) *
            shareCount
          ).toFixed(2),
        );
      } else {
        baseTotal = Number(
          (
            Number(selectedWeight?.price || animal.pricePerShare) * quantity
          ).toFixed(2),
        );
      }
    } else if (orderMode === "serikli") {
      baseTotal = Number((baseUnitPrice * shareCount).toFixed(2));
    } else {
      baseTotal = Number((animal.pricePerShare * quantity).toFixed(2));
    }

    const qurbanPartsExtra = isLargeAnimal
      ? 0
      : Number(
          (
            qurbanParts.headTorchedCount * Number(qurbanPartFees.head || 0) +
            (qurbanParts.headReadyCount + qurbanParts.headCharityCount) *
              (Number(qurbanPartFees.head || 0) +
                Number(qurbanPartProcessingFees.head || 0)) +
            qurbanParts.feetTorchedCount * Number(qurbanPartFees.feet || 0) +
            (qurbanParts.feetReadyCount + qurbanParts.feetCharityCount) *
              (Number(qurbanPartFees.feet || 0) +
                Number(qurbanPartProcessingFees.feet || 0))
          ).toFixed(2),
        );

    const cutStyleExtra = Number(
      cutStyleBreakdown
        .reduce((acc, item) => acc + item.count * item.unitFee, 0)
        .toFixed(2),
    );

    return Number((baseTotal + qurbanPartsExtra + cutStyleExtra).toFixed(2));
  }, [
    animal.pricePerShare,
    baseUnitPrice,
    hasWeightOptions,
    orderMode,
    cutStyleBreakdown,
    qurbanPartFees.feet,
    qurbanPartFees.head,
    qurbanPartProcessingFees.feet,
    qurbanPartProcessingFees.head,
    qurbanParts.feetReadyCount,
    qurbanParts.feetCharityCount,
    qurbanParts.feetTorchedCount,
    qurbanParts.headReadyCount,
    qurbanParts.headCharityCount,
    qurbanParts.headTorchedCount,
    quantity,
    shareCount,
    totalShares,
    weightedUnitPrice,
    isLargeAnimal,
  ]);

  const getPartCounts = (partKey) => {
    if (partKey === "head") {
      return {
        total: qurbanParts.headTotalCount,
        unassigned: qurbanParts.headUnassignedCount,
        free: qurbanParts.headFreeCount,
        torched: qurbanParts.headTorchedCount,
        charity: qurbanParts.headCharityCount,
        ready: qurbanParts.headReadyCount,
      };
    }

    return {
      total: qurbanParts.feetTotalCount,
      unassigned: qurbanParts.feetUnassignedCount,
      free: qurbanParts.feetFreeCount,
      torched: qurbanParts.feetTorchedCount,
      charity: qurbanParts.feetCharityCount,
      ready: qurbanParts.feetReadyCount,
    };
  };

  const getPartCountKeys = (partKey) => {
    if (partKey === "head") {
      return {
        total: "headTotalCount",
        unassigned: "headUnassignedCount",
        free: "headFreeCount",
        torched: "headTorchedCount",
        charity: "headCharityCount",
        ready: "headReadyCount",
      };
    }

    return {
      total: "feetTotalCount",
      unassigned: "feetUnassignedCount",
      free: "feetFreeCount",
      torched: "feetTorchedCount",
      charity: "feetCharityCount",
      ready: "feetReadyCount",
    };
  };

  const changePartBucketCount = (partKey, bucketKey, delta) => {
    setQurbanParts((prev) => {
      const keys = getPartCountKeys(partKey);
      if (bucketKey === keys.unassigned) return prev;

      const currentValue = prev[bucketKey];
      const unassignedCount = prev[keys.unassigned];
      const currentTotal = prev[keys.total];

      if (delta > 0) {
        if (unassignedCount <= 0) return prev;
        return {
          ...prev,
          [bucketKey]: currentValue + 1,
          [keys.unassigned]: unassignedCount - 1,
        };
      }

      if (currentValue <= 0) return prev;

      return {
        ...prev,
        [bucketKey]: currentValue - 1,
        [keys.unassigned]: Math.min(currentTotal, unassignedCount + 1),
      };
    });
  };

  const canContinue = isLargeAnimal
    ? safeSelfShareCount >= 0
    : cutStyleBreakdown.reduce((acc, item) => acc + item.count, 0) +
        cutStyleUnassignedCount ===
        qurbanAnimalCount && safeSelfShareCount >= 0;

  const changeCutStyleCount = (styleKey, delta) => {
    setCutStyleAllocation((prev) => {
      const current = normalizeCutStyleAllocation(
        prev,
        qurbanAnimalCount,
        effectiveCutStyles,
      );

      if (delta > 0) {
        if (current[CUT_STYLE_UNASSIGNED_KEY] <= 0) return current;
        return {
          ...current,
          [styleKey]: current[styleKey] + 1,
          [CUT_STYLE_UNASSIGNED_KEY]: current[CUT_STYLE_UNASSIGNED_KEY] - 1,
        };
      }

      if (current[styleKey] <= 0) return current;
      return {
        ...current,
        [styleKey]: current[styleKey] - 1,
        [CUT_STYLE_UNASSIGNED_KEY]: current[CUT_STYLE_UNASSIGNED_KEY] + 1,
      };
    });
  };

  const slaughterTimingHours = 24;
  const minSlaughterDate = useMemo(getInitialSlaughterDate, []);

  const shiftSlaughterDate = (days) => {
    setSlaughterDateValue((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      next.setHours(9, 0, 0, 0);
      if (next < minSlaughterDate) return minSlaughterDate;
      return next;
    });
  };

  const openCalendar = () => {
    setCalendarMonth(
      new Date(
        slaughterDateValue.getFullYear(),
        slaughterDateValue.getMonth(),
        1,
      ),
    );
    setCalendarVisible(true);
  };

  const canGoPrevMonth =
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0) >=
    minSlaughterDate;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);
    gridStart.setHours(9, 0, 0, 0);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      date.setHours(9, 0, 0, 0);

      const inCurrentMonth = date.getMonth() === calendarMonth.getMonth();
      const disabled = date < minSlaughterDate;
      const selected = isSameDay(date, slaughterDateValue);

      return {
        key: date.toISOString().slice(0, 10),
        date,
        day: date.getDate(),
        inCurrentMonth,
        disabled,
        selected,
      };
    });
  }, [calendarMonth, minSlaughterDate, slaughterDateValue]);

  const pickCalendarDate = (date) => {
    if (date < minSlaughterDate) return;
    const next = new Date(date);
    next.setHours(9, 0, 0, 0);
    setSlaughterDateValue(next);
    setCalendarVisible(false);
  };

  const slaughterDate = new Date(slaughterDateValue);
  slaughterDate.setHours(9, 0, 0, 0);

  const deliveryDate = new Date(slaughterDate);

  const focusFirstRemainingSection = () => {
    const targetKey =
      cutStyleUnassignedCount > 0
        ? "cutStyle"
        : qurbanParts.headUnassignedCount > 0
          ? "head"
          : qurbanParts.feetUnassignedCount > 0
            ? "feet"
            : null;

    if (!targetKey) return;

    const scrollNode = findNodeHandle(scrollViewRef.current);
    const anchorNode = findNodeHandle(remainingAnchorRefs.current[targetKey]);
    if (!scrollNode || !anchorNode) return;

    UIManager.measureLayout(
      anchorNode,
      scrollNode,
      () => {},
      (_x, y) => {
        const targetY = Math.max(0, Number(y || 0) - 24);
        scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      },
    );
  };

  const handleContinue = async () => {
    setSubmitAttempted(true);

    if (isLargeAnimal) {
      const draftParams = {
        animal,
        quantity: orderMode === "serikli" ? sharedPortion : quantity,
        orderMode,
        sharedPortion: orderMode === "serikli" ? sharedPortion : undefined,
        lambSelection: hasWeightOptions
          ? {
              weightCategoryKey: lambWeightKey,
            }
          : undefined,
        slaughterTimingHours,
        slaughterDate: slaughterDate.toISOString(),
        deliveryDate: deliveryDate.toISOString(),
        deliveryWindow,
        qurbanParts: {
          head: false,
          headTotalCount: 0,
          headUnassignedCount: 0,
          headFreeCount: 0,
          headTorchedCount: 0,
          headCharityCount: 0,
          headReadyCount: 0,
          feet: false,
          feetTotalCount: 0,
          feetUnassignedCount: 0,
          feetFreeCount: 0,
          feetTorchedCount: 0,
          feetCharityCount: 0,
          feetReadyCount: 0,
        },
        cutStyle: {
          key: selectedCutStyle.key,
          labelAz: selectedCutStyle.label,
          allocations: cutStyleBreakdown.map((item) => ({
            key: item.key,
            labelAz: item.label,
            count: item.count,
            unitFee: item.unitFee,
            extraFee: Number((item.count * item.unitFee).toFixed(2)),
          })),
          extraFee: Number(
            cutStyleBreakdown
              .reduce((acc, item) => acc + item.count * item.unitFee, 0)
              .toFixed(2),
          ),
        },
        portionSplit: {
          totalParts: maxSplitCount,
          selfParts: safeSelfShareCount,
          charityParts: charityShareCount,
          selfRatio: Number((safeSelfShareCount / maxSplitCount).toFixed(2)),
          charityRatio: Number((charityShareCount / maxSplitCount).toFixed(2)),
        },
        totalPrice,
        note: note.trim() || undefined,
      };

      navigation.navigate("Distribution", draftParams);
      return;
    }

    const hasRemainingUnassigned =
      cutStyleUnassignedCount > 0 ||
      qurbanParts.headUnassignedCount > 0 ||
      qurbanParts.feetUnassignedCount > 0;

    if (hasRemainingUnassigned) {
      focusFirstRemainingSection();
      return;
    }

    const draftParams = {
      animal,
      quantity: orderMode === "serikli" ? sharedPortion : quantity,
      orderMode,
      sharedPortion: orderMode === "serikli" ? sharedPortion : undefined,
      lambSelection: hasWeightOptions
        ? {
            weightCategoryKey: lambWeightKey,
          }
        : undefined,
      slaughterTimingHours,
      slaughterDate: slaughterDate.toISOString(),
      deliveryDate: deliveryDate.toISOString(),
      deliveryWindow,
      qurbanParts: {
        head: qurbanParts.headTotalCount > 0,
        headTotalCount: qurbanParts.headTotalCount,
        headUnassignedCount: qurbanParts.headUnassignedCount,
        headFreeCount: qurbanParts.headFreeCount,
        headTorchedCount: qurbanParts.headTorchedCount,
        headCharityCount: qurbanParts.headCharityCount,
        headReadyCount: qurbanParts.headReadyCount,
        feet: qurbanParts.feetTotalCount > 0,
        feetTotalCount: qurbanParts.feetTotalCount,
        feetUnassignedCount: qurbanParts.feetUnassignedCount,
        feetFreeCount: qurbanParts.feetFreeCount,
        feetTorchedCount: qurbanParts.feetTorchedCount,
        feetCharityCount: qurbanParts.feetCharityCount,
        feetReadyCount: qurbanParts.feetReadyCount,
      },
      cutStyle: {
        key: selectedCutStyle.key,
        labelAz: selectedCutStyle.label,
        allocations: cutStyleBreakdown.map((item) => ({
          key: item.key,
          labelAz: item.label,
          count: item.count,
          unitFee: item.unitFee,
          extraFee: Number((item.count * item.unitFee).toFixed(2)),
        })),
        extraFee: Number(
          cutStyleBreakdown
            .reduce((acc, item) => acc + item.count * item.unitFee, 0)
            .toFixed(2),
        ),
      },
      portionSplit: {
        totalParts: maxSplitCount,
        selfParts: safeSelfShareCount,
        charityParts: charityShareCount,
        selfRatio: Number((safeSelfShareCount / maxSplitCount).toFixed(2)),
        charityRatio: Number((charityShareCount / maxSplitCount).toFixed(2)),
      },
      totalPrice,
      note: note.trim() || undefined,
    };

    if (safeSelfShareCount === 0) {
      // Check if user is taking any head/feet for themselves (free, torched, or ready buckets)
      const hasOwnHeadOrFeet =
        qurbanParts.headFreeCount +
          qurbanParts.headTorchedCount +
          qurbanParts.headReadyCount >
          0 ||
        qurbanParts.feetFreeCount +
          qurbanParts.feetTorchedCount +
          qurbanParts.feetReadyCount >
          0;

      if (hasOwnHeadOrFeet) {
        // User still needs to choose delivery for their own head/feet
        navigation.navigate("Distribution", draftParams);
      } else {
        const charityDraft = {
          ...draftParams,
          distribution: { type: "ehtiyac_sahibleri" },
        };
        const raw = await AsyncStorage.getItem("contact_info");
        if (raw) {
          const contactInfo = JSON.parse(raw);
          navigation.navigate("OrderSummary", {
            draft: { ...charityDraft, contactInfo },
          });
        } else {
          navigation.navigate("ContactInfo", {
            draft: charityDraft,
            initialContact: {
              firstName: user?.name || "",
              lastName: user?.lastName || "",
              mobile: user?.phone || "",
            },
          });
        }
      }
    } else {
      navigation.navigate("Distribution", draftParams);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.stickyTop, { paddingTop: 10 }]}>
        <OrderStepHeader currentStep={1} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.animalCard}>
          <View style={styles.animalRow}>
            <View
              style={[
                styles.animalMediaCol,
                animalTypeKey === "dana" && { width: 140 },
              ]}
            >
              <Image
                source={animal.imageUrl ? { uri: animal.imageUrl } : null}
                style={[
                  styles.animalImage,
                  animalTypeKey === "dana" && { width: 130, borderRadius: 10 },
                ]}
              />
              <Text style={styles.animalName}>{animal.nameAz}</Text>
            </View>

            <View
              style={[styles.quantityPanel, isLargeAnimal && { minWidth: 0 }]}
            >
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
                  <FontAwesome6 name="minus" size={24} color={Colors.white} />
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
                  <FontAwesome6 name="plus" size={24} color={Colors.white} />
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
          </View>
        ) : null}

        {!isLargeAnimal ? (
          <View style={styles.card}>
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.cardTitle}>Doğrama forması</Text>
              <View style={styles.summaryHeaderMetaRow}>
                <Text style={styles.partTotalText}>
                  Cəmi: {qurbanAnimalCount}
                </Text>
                <View
                  style={styles.unassignedBadge}
                  ref={(node) => {
                    remainingAnchorRefs.current.cutStyle = node;
                  }}
                >
                  <Text style={styles.unassignedBadgeText}>
                    Seçilməmiş: {cutStyleUnassignedCount}
                  </Text>
                </View>
              </View>
            </View>
            {submitAttempted && cutStyleUnassignedCount > 0 ? (
              <Text style={styles.remainingWarningText}>
                Qalıqları tamamla: doğrama bölgüsündə {cutStyleUnassignedCount}{" "}
                qalıb.
              </Text>
            ) : null}
            <Text style={[styles.subTitleNoMargin, { marginTop: 12 }]}>
              Bir neçə heyvan üçün fərqli doğrama forması seçə bilərsən.
            </Text>

            <View style={styles.partBucketsList}>
              {cutStyleBreakdown.map((item) => {
                const canIncrease = cutStyleUnassignedCount > 0;

                return (
                  <View key={item.key} style={styles.partBucketRow}>
                    <View style={styles.partBucketTextCol}>
                      <Text style={styles.partBucketLabel}>{item.label}</Text>
                      <Text style={styles.partBucketFee}>
                        {item.unitFee > 0
                          ? `+${item.unitFee} ₼ / heyvan`
                          : "Əlavə ödənişsiz"}
                      </Text>
                    </View>

                    <View style={styles.partBucketCounter}>
                      <TouchableOpacity
                        style={styles.partBucketBtn}
                        onPress={() => changeCutStyleCount(item.key, -1)}
                        disabled={item.count <= 0}
                        activeOpacity={0.85}
                      >
                        <FontAwesome6
                          name="minus"
                          size={15}
                          color={Colors.white}
                        />
                      </TouchableOpacity>

                      <Text style={styles.partBucketCount}>{item.count}</Text>

                      <TouchableOpacity
                        style={styles.partBucketBtn}
                        onPress={() => changeCutStyleCount(item.key, 1)}
                        disabled={!canIncrease}
                        activeOpacity={0.85}
                      >
                        <FontAwesome6
                          name="plus"
                          size={15}
                          color={Colors.white}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {animal.hasHeadOption !== false || animal.hasFeetOption !== false ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Qurbanın Əlavə Hissələri</Text>
            <Text style={styles.subTitleNoMargin}>
              Baş və ayaqların ümumi sayı quantity-ə görə avtomatik hesablanır.
            </Text>

            <View style={styles.partsGrid}>
              {["head", "feet"].map((partKey) => {
                if (partKey === "head" && animal.hasHeadOption === false)
                  return null;
                if (partKey === "feet" && animal.hasFeetOption === false)
                  return null;

                const partCounts = getPartCounts(partKey);
                const partLabel = partKey === "head" ? "Baş" : "Ayaqlar";
                const unitLabel = partKey === "head" ? "baş" : "ayaq";
                const baseFee = Number(qurbanPartFees[partKey] || 0) || 0;
                const processingFee =
                  Number(qurbanPartProcessingFees[partKey] || 0) || 0;

                return (
                  <View key={partKey} style={styles.partCellFull}>
                    <View style={styles.summaryHeaderRow}>
                      <Text style={styles.partGroupTitle}>{partLabel}</Text>
                      <View style={styles.summaryHeaderMetaRow}>
                        <Text style={styles.partTotalText}>
                          Cəmi: {partCounts.total} {unitLabel}
                        </Text>
                        <View
                          style={styles.unassignedBadge}
                          ref={(node) => {
                            remainingAnchorRefs.current[partKey] = node;
                          }}
                        >
                          <Text style={styles.unassignedBadgeText}>
                            Qalıq: {partCounts.unassigned}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {submitAttempted && partCounts.unassigned > 0 ? (
                      <Text style={styles.remainingWarningText}>
                        Qalıqları tamamla: {partLabel.toLowerCase()} üçün{" "}
                        {partCounts.unassigned} qalıb.
                      </Text>
                    ) : null}

                    <View style={styles.partBucketsList}>
                      {getPartBucketOptions(partKey).map((bucket) => {
                        const bucketCount = partCounts[bucket.key];
                        const canIncrement = partCounts.unassigned > 0;
                        const bucketCountKey =
                          getPartCountKeys(partKey)[bucket.key];

                        const bucketFee =
                          bucket.key === "free"
                            ? 0
                            : bucket.key === "torched"
                              ? baseFee
                              : baseFee + processingFee; // ready + charity

                        return (
                          <View key={bucket.key} style={styles.partBucketRow}>
                            <View style={styles.partBucketTextCol}>
                              <Text style={styles.partBucketLabel}>
                                {bucket.label}
                              </Text>
                              <Text style={styles.partBucketFee}>
                                {bucketFee === 0 ? "Pulsuz" : `+${bucketFee} ₼`}
                              </Text>
                            </View>

                            <View style={styles.partBucketCounter}>
                              <TouchableOpacity
                                style={styles.partBucketBtn}
                                onPress={() =>
                                  changePartBucketCount(
                                    partKey,
                                    bucketCountKey,
                                    -1,
                                  )
                                }
                                disabled={bucketCount <= 0}
                                activeOpacity={0.85}
                              >
                                <FontAwesome6
                                  name="minus"
                                  size={15}
                                  color={Colors.white}
                                />
                              </TouchableOpacity>

                              <Text style={styles.partBucketCount}>
                                {bucketCount}
                              </Text>

                              <TouchableOpacity
                                style={styles.partBucketBtn}
                                onPress={() =>
                                  changePartBucketCount(
                                    partKey,
                                    bucketCountKey,
                                    1,
                                  )
                                }
                                disabled={!canIncrement}
                                activeOpacity={0.85}
                              >
                                <FontAwesome6
                                  name="plus"
                                  size={15}
                                  color={Colors.white}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paylanma bölgüsü</Text>
          <Text style={styles.subTitleNoMargin}>
            Heyvanın sənə düşən hissəsini maksimum {maxSplitCount} yerə bölə
            bilərsən.
          </Text>

          <View style={styles.splitStatsRow}>
            <View style={styles.splitStatCard}>
              <Text style={styles.splitStatLabel}>Sənə</Text>
              <Text style={styles.splitStatValue}>
                {safeSelfShareCount}/{maxSplitCount}
              </Text>
            </View>
            <View style={styles.splitStatCard}>
              <Text style={styles.splitStatLabel}>Ehtiyac sahiblərinə</Text>
              <Text style={styles.splitStatValue}>
                {charityShareCount}/{maxSplitCount}
              </Text>
            </View>
          </View>

          <View style={styles.splitActionsContainer}>
            <View style={styles.splitActionGroup}>
              <Text style={styles.splitActionGroupLabel}>Sənə</Text>
              <TouchableOpacity
                style={[
                  styles.splitActionBtn,
                  safeSelfShareCount >= maxSplitCount &&
                    styles.splitActionBtnDisabled,
                ]}
                onPress={() =>
                  setSelfShareCount((prev) => {
                    const currentValue = prev == null ? maxSplitCount : prev;
                    return Math.min(maxSplitCount, currentValue + 1);
                  })
                }
                disabled={safeSelfShareCount >= maxSplitCount}
                activeOpacity={0.85}
              >
                <View style={styles.splitActionBtnContent}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={styles.splitActionBtnText}>Sənəni artır</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.splitActionGroup}>
              <Text style={styles.splitActionGroupLabel}>
                Ehtiyac sahiblərinə
              </Text>
              <TouchableOpacity
                style={[
                  styles.splitActionBtn,
                  safeSelfShareCount <= 0 && styles.splitActionBtnDisabled,
                ]}
                onPress={() =>
                  setSelfShareCount((prev) => {
                    const currentValue = prev == null ? maxSplitCount : prev;
                    return Math.max(0, currentValue - 1);
                  })
                }
                disabled={safeSelfShareCount <= 0}
                activeOpacity={0.85}
              >
                <View style={styles.splitActionBtnContent}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={styles.splitActionBtnText}>Əlavə et</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.splitHint}>
            Baş və ayaqların ümumi sayı quantity-ə görə avtomatik hesablanır.
          </Text>

          {(animalTypeKey === "dana" || animalTypeKey === "deve") &&
          orderMode === "serikli" ? (
            <Text style={styles.splitHint}>
              Şərikli sifarişdə limit sənə düşən paya görə hesablanır.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kəsim vaxtı</Text>

          <Text style={styles.subTitleNoMargin}>Kəsim tarixi</Text>
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity
              style={[
                styles.dateShiftBtn,
                isSameDay(slaughterDate, minSlaughterDate) &&
                  styles.dateShiftBtnDisabled,
              ]}
              onPress={() => shiftSlaughterDate(-1)}
              disabled={isSameDay(slaughterDate, minSlaughterDate)}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateDisplayCard}
              onPress={openCalendar}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={17}
                color={Colors.primary}
              />
              <Text style={styles.dateDisplayText}>
                {slaughterDate.toLocaleDateString("az-AZ", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateShiftBtn}
              onPress={() => shiftSlaughterDate(1)}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>

          {safeSelfShareCount > 0 ? (
            <>
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
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Qeyd</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Əlavə qeyd yazın (istəyə bağlı)..."
            placeholderTextColor={Colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <Modal visible={calendarVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCalendarVisible(false)}>
          <View style={styles.calendarOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.calendarSheet}>
                <View style={styles.calendarHeaderRow}>
                  <TouchableOpacity
                    style={[
                      styles.calendarMonthBtn,
                      !canGoPrevMonth && styles.calendarMonthBtnDisabled,
                    ]}
                    onPress={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    disabled={!canGoPrevMonth}
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>

                  <Text style={styles.calendarTitle}>
                    {calendarMonth.toLocaleDateString("az-AZ", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>

                  <TouchableOpacity
                    style={styles.calendarMonthBtn}
                    onPress={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekRow}>
                  {WEEKDAY_LABELS.map((label) => (
                    <Text key={label} style={styles.calendarWeekLabel}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.calendarDayCell,
                        !item.inCurrentMonth && styles.calendarDayCellMuted,
                        item.selected && styles.calendarDayCellActive,
                        item.disabled && styles.calendarDayCellDisabled,
                      ]}
                      onPress={() => pickCalendarDate(item.date)}
                      disabled={item.disabled}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          !item.inCurrentMonth && styles.calendarDayTextMuted,
                          item.selected && styles.calendarDayTextActive,
                          item.disabled && styles.calendarDayTextDisabled,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View
        style={[styles.stickyBottom, { paddingBottom: insets.bottom + 10 }]}
      >
        <View style={styles.actionRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Yekun Məbləğ</Text>
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
            <View style={styles.buttonContentRow}>
              <Text style={styles.buttonText}>
                {(() => {
                  // If safeSelfShareCount === 0, check if they're taking any head/feet
                  if (safeSelfShareCount === 0) {
                    const hasHeadOrFeetToTake =
                      qurbanParts.headFreeCount +
                        qurbanParts.headTorchedCount +
                        qurbanParts.headReadyCount >
                        0 ||
                      qurbanParts.feetFreeCount +
                        qurbanParts.feetTorchedCount +
                        qurbanParts.feetReadyCount >
                        0;
                    return hasHeadOrFeetToTake ? "Çatdırıma" : "Ödə";
                  }
                  return "Çatdırıma";
                })()}
              </Text>
              <MaterialCommunityIcons
                name="chevron-double-right"
                size={28}
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stickyTop: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 3,
  },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingTop: 12 },
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginBottom: 0,
  },
  stickyBottom: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 3,
  },
  totalCard: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 4,
    paddingVertical: 6,
    justifyContent: "center",
    flex: 1,
  },
  totalLabel: { color: Colors.primary, fontSize: 15, fontWeight: "600" },
  totalValue: {
    color: Colors.primary,
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
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonInline: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    paddingLeft: 7,
  },
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
  partGroupTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 0,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  summaryHeaderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  unassignedBadge: {
    backgroundColor: "#E6F9EE",
    borderWidth: 1,
    borderColor: "#30B566",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unassignedBadgeText: {
    color: "#128A43",
    fontSize: 15,
    fontWeight: "800",
    includeFontPadding: false,
  },
  remainingWarningText: {
    marginTop: 4,
    marginBottom: 6,
    color: "#C62828",
    fontSize: 13,
    fontWeight: "700",
  },
  partTotalText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 0,
    includeFontPadding: false,
  },
  partCellFull: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.background,
  },
  partBucketsList: {
    gap: 10,
  },
  partBucketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  partBucketTextCol: {
    flex: 1,
  },
  partBucketLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  partBucketFee: {
    marginTop: 2,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  partBucketCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  partBucketBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  partBucketCount: {
    minWidth: 28,
    textAlign: "center",
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  cutStyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  cutStyleCell: {
    width: "48.5%",
  },
  cutStyleOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
  },
  cutStyleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  cutStyleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: 10,
  },
  cutStyleDotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  cutStyleText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  cutStyleFeeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  cutStyleTextActive: {
    color: Colors.primary,
  },
  splitStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  splitStatCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  splitStatLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  splitStatValue: {
    color: Colors.primary,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 2,
  },
  splitActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  splitActionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  splitActionGroup: {
    flex: 1,
    gap: 8,
  },
  splitActionGroupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  splitActionBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 44,
  },
  splitActionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitActionBtnDisabled: {
    opacity: 0.45,
  },
  splitActionBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  splitHint: {
    marginTop: 9,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  dateSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    marginBottom: 10,
  },
  dateShiftBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateShiftBtnDisabled: {
    opacity: 0.45,
  },
  dateDisplayCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateDisplayText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  calendarSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarMonthBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  calendarMonthBtnDisabled: {
    opacity: 0.4,
  },
  calendarTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  calendarWeekLabel: {
    width: "14.285%",
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: "14.285%",
    aspectRatio: 1,
    padding: 0,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayCellMuted: {
    opacity: 0.65,
  },
  calendarDayCellDisabled: {
    opacity: 0.3,
  },
  calendarDayCellActive: {
    backgroundColor: Colors.primary,
    margin: 3,
    borderRadius: 999,
  },
  calendarDayText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
    includeFontPadding: false,
  },
  calendarDayTextMuted: {
    color: Colors.textSecondary,
  },
  calendarDayTextDisabled: {
    color: Colors.textDisabled,
  },
  calendarDayTextActive: {
    color: Colors.white,
  },
  radioRow: {
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
  radioRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  radioFeeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
});
