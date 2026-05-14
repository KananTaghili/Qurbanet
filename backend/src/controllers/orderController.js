const Order = require("../models/Order");
const Category = require("../models/Category");
const DeliveryOption = require("../models/DeliveryOption");
const CharityOption = require("../models/CharityOption");
const {
  ANIMALS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  WEIGHT_OPTIONS_BY_ANIMAL,
  MEAT_FORM_OPTIONS,
  DELIVERY_TIME_WINDOWS,
  QURBAN_PART_FEES_BY_ANIMAL,
  QURBAN_PART_PROCESSING_FEES_BY_ANIMAL,
  DELIVERY_FEE,
  CUT_STYLE_LABELS,
  CUT_STYLE_FEES_BY_ANIMAL,
} = require("../config/constants");
const { success, error } = require("../utils/response");

const normalizeType = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const fixMediaUrl = (url, req) => {
  if (!url) return url;
  const base = getBaseUrl(req);

  if (/^https?:\/\//i.test(url)) {
    return url.replace(/https?:\/\/[^/]+/i, base);
  }

  if (url.startsWith("/")) {
    return `${base}${url}`;
  }

  return `${base}/${url}`;
};

const getAnimalEmoji = (animalType, emoji) => {
  const normalizedType = normalizeType(animalType);
  if (normalizedType === "quzu") return "🐑";
  if (normalizedType === "qoc") return "🐏";
  if (normalizedType === "keci") return "🐐";
  return emoji || ANIMALS[normalizedType]?.emoji || "🐑";
};

const ensureDefaultCategories = async () => {
  // Seed defaults only when collection is empty.
  // Otherwise deletions in admin would keep coming back.
  const existingCount = await Category.countDocuments({});
  if (existingCount > 0) return;

  const existingCategories = await Category.find({}).select("type").lean();
  const existingTypes = new Set(
    existingCategories.map((item) => normalizeType(item.type)),
  );

  const missingDefaults = Object.values(ANIMALS)
    .filter((animal) => !existingTypes.has(normalizeType(animal.type)))
    .map((animal) => ({
      type: normalizeType(animal.type),
      nameAz: animal.nameAz,
      emoji: animal.emoji || "🐑",
      description: animal.description,
      imageUrl: "",
      videoUrl: "",
      pricePerShare: animal.pricePerShare,
      totalShares: animal.totalShares || 1,
      isActive: true,
    }));

  if (missingDefaults.length) {
    await Category.insertMany(missingDefaults);
  }
};

const upsertAutoConfirm = async (order) => {
  if (
    order.status === ORDER_STATUS.PLACED &&
    order.autoConfirmAt &&
    order.autoConfirmAt <= new Date()
  ) {
    order.status = ORDER_STATUS.CONFIRMED;
    order.confirmedAt = new Date();
    order.statusHistory.push({
      status: ORDER_STATUS.CONFIRMED,
      note: "1 saat ərzində admin təsdiqləmədiyi üçün sistem avtomatik təsdiqlədi.",
    });
    await order.save();
  }
  return order;
};

const upsertAutoConfirmForUser = async (userId) => {
  const dueOrders = await Order.find({
    user: userId,
    status: ORDER_STATUS.PLACED,
    autoConfirmAt: { $lte: new Date() },
  });

  if (!dueOrders.length) return;

  await Promise.all(dueOrders.map((order) => upsertAutoConfirm(order)));
};

const buildTimeline = (order) => [
  {
    key: "placed",
    label: "Sifariş verildi",
    done:
      order.statusHistory.some((s) => s.status === ORDER_STATUS.PLACED) ||
      !!order.createdAt,
  },
  {
    key: "confirmed",
    label: "Sifariş təsdiqləndi",
    done: order.statusHistory.some((s) => s.status === ORDER_STATUS.CONFIRMED),
    notificationText: "Sifarişinizi insan gördü",
  },
  {
    key: "slaughtering",
    label: "Kəsilir",
    done: order.statusHistory.some(
      (s) => s.status === ORDER_STATUS.SLAUGHTERING,
    ),
  },
  {
    key: "preparing",
    label: "Hazırlanır",
    done: order.statusHistory.some((s) => s.status === ORDER_STATUS.PREPARING),
  },
  {
    key: "delivering",
    label: "Çatdırılır",
    done: order.statusHistory.some((s) => s.status === ORDER_STATUS.DELIVERING),
  },
  {
    key: "completed",
    label: "Tamamlandı",
    done: order.status === ORDER_STATUS.COMPLETED,
  },
];

const buildCuttingProcessNotes = (order) => {
  const notes = order.processNotes || [];
  return [
    {
      key: "order_day",
      title: "1. Sifariş günü",
      completed: notes.some((n) => n.stage === "order_day"),
    },
    {
      key: "slaughter_day",
      title: "2. Kəsim günü",
      completed: notes.some((n) => n.stage === "slaughter_day"),
    },
    {
      key: "slaughter_moment",
      title: "3. Kəsim anı",
      description: "Kəsdirənin adı çəkilir və video çəkilir.",
      completed: notes.some((n) => n.stage === "slaughter_moment"),
    },
    {
      key: "post_slaughter",
      title: "4. Kəsimdən sonra",
      description: "Çəkilmiş video WhatsApp və ya App ilə göndərilir.",
      completed: notes.some((n) => n.stage === "post_slaughter"),
    },
  ];
};

const getQurbanPartFees = (animalType) => {
  return QURBAN_PART_FEES_BY_ANIMAL[animalType] || { head: 0, feet: 0 };
};

const getQurbanPartProcessingFees = (animalType) => {
  return (
    QURBAN_PART_PROCESSING_FEES_BY_ANIMAL[animalType] || { head: 0, feet: 0 }
  );
};

const getCutStyleFees = (animalType) => {
  return (
    CUT_STYLE_FEES_BY_ANIMAL[animalType] ||
    CUT_STYLE_FEES_BY_ANIMAL.qoyun || {
      tam_cemdek: 0,
      kababliq: 0,
      qazan_yemekleri: 0,
      kababliq_qazan: 0,
    }
  );
};

const CUT_STYLE_KEYS = Object.keys(CUT_STYLE_LABELS);

const formatOrder = (order, req) => {
  const animalInfo = ANIMALS[order.animalType] || {};
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    animalType: order.animalType,
    animalNameAz: order.animalNameAz || animalInfo.nameAz || order.animalType,
    animalEmoji: getAnimalEmoji(
      order.animalType,
      order.animalEmoji || animalInfo.emoji,
    ),
    animalImageUrl: req
      ? fixMediaUrl(order.animalImageUrl, req)
      : order.animalImageUrl,
    quantity: order.quantity,
    orderMode: order.orderMode || "tek",
    sharedPortion: order.sharedPortion,
    lambSelection: order.lambSelection,
    qurbanParts: order.qurbanParts,
    cutStyle: order.cutStyle,
    pricePerUnit: order.pricePerUnit,
    deliveryFee: order.deliveryFee ?? 0,
    totalPrice: order.totalPrice,
    distribution: order.distribution,
    payment: order.payment,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
    statusTimeline: buildTimeline(order),
    media: (order.media || []).map((item) => ({
      ...item,
      url: req ? fixMediaUrl(item.url, req) : item.url,
    })),
    processNotes: (order.processNotes || []).map((item) => ({
      ...item,
      videoUrl: req ? fixMediaUrl(item.videoUrl, req) : item.videoUrl,
    })),
    processChecklist: buildCuttingProcessNotes(order),
    deliveryProof: order.deliveryProof,
    adminNote: order.adminNote,
    estimatedDate: order.estimatedDate,
    slaughterDate: order.slaughterDate,
    deliveryDate: order.deliveryDate,
    deliveryWindow: order.deliveryWindow,
    slaughterTimingHours: order.slaughterTimingHours,
    contactInfo: order.contactInfo,
    orphanDelight: order.orphanDelight,
    review: order.review,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const getAnimals = async (req, res) => {
  try {
    await ensureDefaultCategories();

    // Fetch all data in parallel
    const [animals, deliveryOptions, charityOptions] = await Promise.all([
      Category.find({ isActive: true }).sort({ createdAt: 1 }).select("-__v"),
      DeliveryOption.find({ isActive: true })
        .populate("categorySpecificPrices.categoryId", "nameAz type")
        .sort({ key: 1 }),
      CharityOption.find({ isActive: true }).sort({
        sortOrder: 1,
        createdAt: 1,
      }),
    ]);

    const fixed = animals.map((a) => {
      const obj = a.toObject();
      obj.emoji = getAnimalEmoji(obj.type, obj.emoji);
      obj.imageUrl = fixMediaUrl(obj.imageUrl, req);
      obj.videoUrl = fixMediaUrl(obj.videoUrl, req);

      // Admin panelindən gələn qiymətləri tənzimləyirik
      obj.weightOptions = obj.weightOptions?.length
        ? obj.weightOptions
        : WEIGHT_OPTIONS_BY_ANIMAL[obj.type] || [];
      obj.qurbanPartFees = {
        head: obj.headFee ?? getQurbanPartFees(obj.type).head,
        feet: obj.feetFee ?? getQurbanPartFees(obj.type).feet,
      };
      obj.qurbanPartProcessingFees = {
        head:
          obj.headProcessingFee ?? getQurbanPartProcessingFees(obj.type).head,
        feet:
          obj.feetProcessingFee ?? getQurbanPartProcessingFees(obj.type).feet,
      };
      obj.cutStyleOptions = obj.cutStyleOptions || [];

      return obj;
    });

    const fixedCharityOptions = charityOptions.map((c) => {
      const obj = c.toObject();
      obj.imageUrl = fixMediaUrl(obj.imageUrl, req);
      obj.videoUrl = fixMediaUrl(obj.videoUrl, req);
      return obj;
    });

    return success(res, {
      animals: fixed,
      deliveryOptions: deliveryOptions,
      charityOptions: fixedCharityOptions,
      deliveryWindows: DELIVERY_TIME_WINDOWS,
    });
  } catch (err) {
    console.error("getAnimals xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      animalType,
      quantity,
      distribution,
      orderMode,
      sharedPortion,
      qurbanParts,
      cutStyle,
      slaughterDate,
      deliveryDate,
      deliveryWindow,
      slaughterTimingHours,
      contactInfo,
      orphanDelight,
      paymentMethod,
      userNote,
    } = req.body;

    const normalizedType = normalizeType(animalType);
    const animal = await Category.findOne({
      type: normalizedType,
      isActive: true,
    }).select("-__v");

    if (!animal) return error(res, "Yanlış heyvan növü.", 400);

    const normalizedMode = orderMode === "serikli" ? "serikli" : "tek";
    const isLargeAnimal = ["dana", "deve"].includes(normalizedType);

    let qty;
    let normalizedSharedPortion;
    let shareCount = 0;

    if (normalizedMode === "serikli") {
      if (!isLargeAnimal) {
        return error(
          res,
          "Şərikli sifariş yalnız dana və dəvə kateqoriyalarında mümkündür.",
          400,
        );
      }

      normalizedSharedPortion = Number(sharedPortion);
      const validStep = Math.round(normalizedSharedPortion * 10) / 10;
      const hasValidStep =
        Math.abs(validStep - normalizedSharedPortion) < 0.000001;

      if (
        Number.isNaN(normalizedSharedPortion) ||
        normalizedSharedPortion < 0.1 ||
        normalizedSharedPortion > 0.6 ||
        !hasValidStep
      ) {
        return error(
          res,
          "Şərikli hissə 0.1 ilə 0.6 arasında və 0.1 addımla olmalıdır.",
          400,
        );
      }

      shareCount = Math.round(normalizedSharedPortion * 10);
      qty = normalizedSharedPortion;
    } else {
      qty = parseInt(quantity, 10);
      if (Number.isNaN(qty) || qty < 1) {
        return error(res, "Miqdar ən az 1 olmalıdır.", 400);
      }
    }

    if (!distribution || !distribution.type) {
      return error(res, "Çatdırılma növü seçilməlidir.", 400);
    }

    const validDistributions = [
      "catdirilsin",
      "ozun_gotur",
      "usaqlar_evi",
      "qocalar_evi",
      "ehtiyac_sahibleri",
      "ozum",
      "mekan",
    ];

    if (!validDistributions.includes(distribution.type)) {
      return error(res, "Yanlış çatdırılma növü.", 400);
    }

    const requiresAddress = ["catdirilsin", "mekan"].includes(
      distribution.type,
    );
    if (requiresAddress) {
      if (!distribution.location || distribution.location.trim().length < 3) {
        return error(res, "Çatdırılma ünvanı daxil edilməlidir.", 400);
      }
      const lat = Number(distribution.coordinates?.lat);
      const lng = Number(distribution.coordinates?.lng);
      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return error(
          res,
          "Çatdırılma üçün xəritə üzərindən düzgün konum seçilməlidir.",
          400,
        );
      }
    }

    const selectedTiming = Number(slaughterTimingHours) === 48 ? 48 : 24;

    const parsedSlaughterDate = slaughterDate
      ? new Date(slaughterDate)
      : new Date();
    if (Number.isNaN(parsedSlaughterDate.getTime())) {
      return error(res, "Kəsim günü düzgün formatda deyil.", 400);
    }

    const parsedDeliveryDate = deliveryDate
      ? new Date(deliveryDate)
      : parsedSlaughterDate;
    if (Number.isNaN(parsedDeliveryDate.getTime())) {
      return error(res, "Çatdırılma günü düzgün formatda deyil.", 400);
    }

    if (!DELIVERY_TIME_WINDOWS.includes(deliveryWindow)) {
      return error(res, "Çatdırılma saat intervalı düzgün deyil.", 400);
    }

    const userMobile = String(
      contactInfo?.mobile || req.phone || req.user?.phone || "",
    ).trim();
    const firstName = String(contactInfo?.firstName || "").trim();
    const lastName = String(contactInfo?.lastName || "").trim();

    if (!firstName || !lastName || !userMobile) {
      return error(
        res,
        "Əlaqə məlumatları (ad, soyad, mobil) tələb olunur.",
        400,
      );
    }

    const normalizedPaymentMethod =
      paymentMethod === "cash_on_delivery" ? "cash_on_delivery" : "bank_card";

    const toCount = (value) => Math.max(0, Number(value) || 0);
    const hasCountFields =
      qurbanParts?.headTotalCount != null ||
      qurbanParts?.feetTotalCount != null;

    const legacyHeadReady = Boolean(qurbanParts?.headReady);
    const legacyFeetReady = Boolean(qurbanParts?.feetReady);

    const headTotalCount = hasCountFields
      ? toCount(qurbanParts?.headTotalCount)
      : Boolean(qurbanParts?.head)
        ? 1
        : 0;
    const headFreeCount = hasCountFields
      ? toCount(qurbanParts?.headFreeCount)
      : headTotalCount - (legacyHeadReady ? 1 : 0);
    const headCharityCount = hasCountFields
      ? toCount(qurbanParts?.headCharityCount)
      : 0;
    const headTorchedCount = hasCountFields
      ? toCount(qurbanParts?.headTorchedCount)
      : 0;
    const headReadyCount = hasCountFields
      ? toCount(qurbanParts?.headReadyCount)
      : legacyHeadReady
        ? 1
        : 0;

    const feetTotalCount = hasCountFields
      ? toCount(qurbanParts?.feetTotalCount)
      : Boolean(qurbanParts?.feet)
        ? 4
        : 0;
    const feetFreeCount = hasCountFields
      ? toCount(qurbanParts?.feetFreeCount)
      : feetTotalCount - (legacyFeetReady ? 1 : 0);
    const feetCharityCount = hasCountFields
      ? toCount(qurbanParts?.feetCharityCount)
      : 0;
    const feetTorchedCount = hasCountFields
      ? toCount(qurbanParts?.feetTorchedCount)
      : 0;
    const feetReadyCount = hasCountFields
      ? toCount(qurbanParts?.feetReadyCount)
      : legacyFeetReady
        ? 1
        : 0;

    // Detect if user has charity parts
    const hasCharityParts = headCharityCount > 0 || feetCharityCount > 0;
    // Detect if user is taking some meat for themselves (from other parts like free, ready, torched)
    const hasOwnParts =
      headFreeCount +
        headReadyCount +
        headTorchedCount +
        feetFreeCount +
        feetReadyCount +
        feetTorchedCount >
      0;

    const finalQurbanParts = {
      head: headTotalCount > 0,
      headTotalCount,
      headFreeCount,
      headCharityCount,
      headTorchedCount,
      headReadyCount,
      headReady: headReadyCount > 0,
      headProcess:
        headReadyCount > 0
          ? "utulun"
          : headCharityCount > 0
            ? "sedeqe"
            : headTorchedCount > 0
              ? "utulun"
              : "none",
      feet: feetTotalCount > 0,
      feetTotalCount,
      feetFreeCount,
      feetCharityCount,
      feetTorchedCount,
      feetReadyCount,
      feetReady: feetReadyCount > 0,
      feetProcess:
        feetReadyCount > 0
          ? "utulun"
          : feetCharityCount > 0
            ? "sedeqe"
            : feetTorchedCount > 0
              ? "utulun"
              : "none",
      confirmed: headTotalCount > 0 || feetTotalCount > 0,
      headFee: 0,
      feetFee: 0,
      extraCharge: 0,
    };

    const partFees = getQurbanPartFees(normalizedType);
    const processingFees = getQurbanPartProcessingFees(normalizedType);

    const headFeeTotal = Number(
      (
        headTorchedCount * Number(partFees.head || 0) +
        (headReadyCount + headCharityCount) *
          (Number(partFees.head || 0) + Number(processingFees.head || 0))
      ).toFixed(2),
    );
    const feetFeeTotal = Number(
      (
        feetTorchedCount * Number(partFees.feet || 0) +
        (feetReadyCount + feetCharityCount) *
          (Number(partFees.feet || 0) + Number(processingFees.feet || 0))
      ).toFixed(2),
    );
    const qurbanPartsExtraCharge = Number(
      (headFeeTotal + feetFeeTotal).toFixed(2),
    );

    finalQurbanParts.headFee = headFeeTotal;
    finalQurbanParts.feetFee = feetFeeTotal;
    finalQurbanParts.extraCharge = qurbanPartsExtraCharge;

    const categoryCutStyles = animal.cutStyleOptions || [];
    const validCutStyleKeys = categoryCutStyles.map((c) => c.key);

    const fallbackCutStyleKey = Object.prototype.hasOwnProperty.call(
      validCutStyleKeys, // Massivdə dəyər yoxlamaq üçün 'includes' istifadə edilməlidir
      cutStyle?.key,
    )
      ? cutStyle.key
      : validCutStyleKeys[0] || "tam_cemdek";

    const expectedCutStyleCount =
      normalizedMode === "serikli" ? 1 : Math.max(1, qty);

    const allocationMap = validCutStyleKeys.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    if (validCutStyleKeys.length > 0) {
      const incomingAllocations = Array.isArray(cutStyle?.allocations)
        ? cutStyle.allocations
        : [];
      incomingAllocations.forEach((item) => {
        const key = item?.key;
        if (!validCutStyleKeys.includes(key)) return;
        const count = Math.max(0, Number(item?.count) || 0);
        allocationMap[key] += count;
      });

      let allocationTotal = validCutStyleKeys.reduce(
        (sum, key) => sum + allocationMap[key],
        0,
      );

      if (allocationTotal < expectedCutStyleCount) {
        allocationMap[fallbackCutStyleKey] +=
          expectedCutStyleCount - allocationTotal;
        allocationTotal = expectedCutStyleCount;
      }
    }

    const finalCutStyleAllocations = categoryCutStyles.map((style) => {
      const count = Math.max(0, Number(allocationMap[style.key] || 0));
      const unitFee = Number(style.fee || 0);
      return {
        key: style.key,
        labelAz: style.labelAz,
        count,
        unitFee,
        extraFee: Number((count * unitFee).toFixed(2)),
      };
    });

    const selectedCutStyleKey =
      finalCutStyleAllocations.slice().sort((a, b) => b.count - a.count)[0]
        ?.key || fallbackCutStyleKey;

    const cutStyleExtraCharge = Number(
      finalCutStyleAllocations
        .reduce((sum, item) => sum + item.extraFee, 0)
        .toFixed(2),
    );

    const finalCutStyle = {
      key: selectedCutStyleKey,
      labelAz:
        categoryCutStyles.find((s) => s.key === selectedCutStyleKey)?.labelAz ||
        "Naməlum",
      extraFee: cutStyleExtraCharge,
      allocations: finalCutStyleAllocations,
    };

    let finalPricePerUnit;
    let finalTotalPrice;
    let normalizedLambSelection;
    const availableWeightOptions =
      WEIGHT_OPTIONS_BY_ANIMAL[normalizedType] || [];
    const selectedWeight = availableWeightOptions.find(
      (item) => item.key === lambSelection?.weightCategoryKey,
    );

    if (availableWeightOptions.length && !selectedWeight) {
      return error(res, "Bu heyvan üçün çəki kateqoriyası seçilməlidir.", 400);
    }

    const totalShares = Math.max(1, Number(animal.totalShares) || 1);
    if (selectedWeight) {
      if (normalizedMode === "serikli") {
        finalPricePerUnit = Number(
          (selectedWeight.price / totalShares).toFixed(2),
        );
        finalTotalPrice = Number((finalPricePerUnit * shareCount).toFixed(2));
      } else {
        finalPricePerUnit = Number(selectedWeight.price.toFixed(2));
        finalTotalPrice = Number((finalPricePerUnit * qty).toFixed(2));
      }
    } else {
      finalPricePerUnit = Number(
        (animal.pricePerShare / totalShares).toFixed(2),
      );
      finalTotalPrice =
        normalizedMode === "serikli"
          ? Number((finalPricePerUnit * shareCount).toFixed(2))
          : Number((animal.pricePerShare * qty).toFixed(2));
    }

    const finalOrphanDelight = {
      enabled: Boolean(orphanDelight?.enabled),
      target: orphanDelight?.target,
      extraAmount: Number(orphanDelight?.extraAmount || 0),
      note: String(orphanDelight?.note || "").trim(),
    };

    const orphanExtraCharge = finalOrphanDelight.enabled
      ? finalOrphanDelight.extraAmount
      : 0;

    if (finalOrphanDelight.enabled) {
      const validTargets = ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];
      if (!validTargets.includes(finalOrphanDelight.target)) {
        return error(res, "Yetimləri sevindir hədəfi düzgün deyil.", 400);
      }
      if (
        Number.isNaN(finalOrphanDelight.extraAmount) ||
        finalOrphanDelight.extraAmount <= 0
      ) {
        return error(
          res,
          "Yetimləri sevindir üçün əlavə ödəniş daxil edin.",
          400,
        );
      }
    }

    const deliveryFeeCharge = (() => {
      if (distribution.type === "ozun_gotur") {
        // User picks it up themselves - no delivery fee
        return 0;
      }
      if (
        distribution.type === "catdirilsin" &&
        hasCharityParts &&
        hasOwnParts
      ) {
        // User wants delivery AND has both own meat AND charity meat
        // Need TWO delivery fees (one for user delivery, one for charity delivery)
        return DELIVERY_FEE * 2;
      }
      // All other cases: one delivery fee
      return DELIVERY_FEE;
    })();

    const order = await Order.create({
      user: req.userId,
      animalType: animal.type,
      animalNameAz: animal.nameAz,
      animalEmoji: getAnimalEmoji(animal.type, animal.emoji),
      animalImageUrl: animal.imageUrl,
      quantity: qty,
      orderMode: normalizedMode,
      sharedPortion:
        normalizedMode === "serikli" ? normalizedSharedPortion : undefined,
      lambSelection: normalizedLambSelection,
      qurbanParts: finalQurbanParts,
      cutStyle: finalCutStyle,
      pricePerUnit: finalPricePerUnit,
      deliveryFee: deliveryFeeCharge,
      totalPrice: Number(
        (
          finalTotalPrice +
          qurbanPartsExtraCharge +
          cutStyleExtraCharge +
          orphanExtraCharge +
          deliveryFeeCharge
        ).toFixed(2),
      ),
      distribution: {
        type: distribution.type,
        location: requiresAddress ? distribution.location.trim() : undefined,
        coordinates: requiresAddress
          ? {
              lat: Number(distribution.coordinates.lat),
              lng: Number(distribution.coordinates.lng),
            }
          : undefined,
      },
      payment: {
        method: normalizedPaymentMethod,
        status: "pending",
      },
      status: ORDER_STATUS.PLACED,
      statusHistory: [
        { status: ORDER_STATUS.PLACED, note: "Sifariş yaradıldı." },
      ],
      contactInfo: {
        firstName,
        lastName,
        mobile: userMobile,
      },
      orphanDelight: finalOrphanDelight,
      userNote: userNote ? String(userNote).trim().slice(0, 300) : undefined,
      slaughterDate: parsedSlaughterDate,
      deliveryDate: parsedDeliveryDate,
      deliveryWindow,
      slaughterTimingHours: selectedTiming,
      estimatedDate: new Date(
        parsedSlaughterDate.getTime() + selectedTiming * 60 * 60 * 1000,
      ),
      autoConfirmAt: new Date(Date.now() + 60 * 60 * 1000),
      processNotes: [
        { stage: "order_day", note: "Sifariş günü qeydi yaradıldı." },
      ],
    });

    const { getIo } = require("../socket");
    try {
      getIo().emit("new_order", { order: formatOrder(order, req) });
    } catch (_) {}

    return success(
      res,
      { order: formatOrder(order, req) },
      "Sifariş yaradıldı. Ödəniş mərhələsinə keçin.",
      201,
    );
  } catch (err) {
    console.error("createOrder xətası:", err);
    return error(res, "Sifariş yaradılarkən xəta baş verdi.", 500);
  }
};

const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body || {};

    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    if (order.status === ORDER_STATUS.CANCELLED) {
      return error(res, "Ləğv edilmiş sifariş ödənilə bilməz.", 400);
    }

    const selectedMethod =
      paymentMethod === "cash_on_delivery" ? "cash_on_delivery" : "bank_card";

    if (selectedMethod === "bank_card") {
      order.payment.status = "paid";
      order.payment.paidAt = new Date();
      order.payment.transactionId = `TXN-${Date.now()}`;
    } else {
      order.payment.status = "pending";
      order.payment.transactionId = undefined;
      order.payment.paidAt = undefined;
    }

    order.payment.method = selectedMethod;
    order.status = ORDER_STATUS.PLACED;

    if (!order.statusHistory.some((s) => s.status === ORDER_STATUS.PLACED)) {
      order.statusHistory.push({
        status: ORDER_STATUS.PLACED,
        note: "Ödəniş seçimi tamamlandı.",
      });
    }

    order.autoConfirmAt = new Date(Date.now() + 60 * 60 * 1000);
    await order.save();

    const { getIo } = require("../socket");
    try {
      getIo().emit("order_updated", { order: formatOrder(order, req) });
    } catch (_) {}

    return success(
      res,
      { order: formatOrder(order, req) },
      selectedMethod === "bank_card"
        ? "Ödəniş uğurla tamamlandı. Sifarişiniz təsdiqə göndərildi."
        : "Yerində ödəniş seçildi. Kəsim ödənişdən sonra olacaq.",
    );
  } catch (err) {
    console.error("processPayment xətası:", err);
    return error(res, "Ödəniş zamanı xəta baş verdi.", 500);
  }
};

const getMyOrders = async (req, res) => {
  try {
    await upsertAutoConfirmForUser(req.userId);
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    return success(res, {
      orders: orders.map((order) => formatOrder(order, req)),
      total: orders.length,
    });
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.userId,
    });

    if (!order) return error(res, "Sifariş tapılmadı.", 404);

    await upsertAutoConfirm(order);
    return success(res, { order: formatOrder(order, req) });
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

const submitOrderReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Sifariş tapılmadı.", 404);

    if (order.status !== ORDER_STATUS.COMPLETED) {
      return error(
        res,
        "Rəy yalnız tamamlanmış sifarişlər üçün mümkündür.",
        400,
      );
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return error(res, "Rəy balı 1-5 arası olmalıdır.", 400);
    }

    order.review = {
      rating: parsedRating,
      comment: String(comment || "").trim(),
      createdAt: new Date(),
    };
    await order.save();

    return success(
      res,
      { order: formatOrder(order, req) },
      "Rəyiniz göndərildi.",
    );
  } catch (err) {
    console.error("submitOrderReview xətası:", err);
    return error(res, "Rəy göndərilərkən xəta baş verdi.", 500);
  }
};

const getKnowledgeContent = async (req, res) => {
  return success(res, {
    info: {
      qurbanEhkami: [
        "Qurban ibadəti niyyət və halallıqla yerinə yetirilir.",
        "Kəsim vaxtı və paylama prosesində şəffaflıq təmin olunur.",
        "Kəsim qeydləri və videolar tətbiq üzərindən paylaşılır.",
      ],
      qurbanTipleri: Object.values(ANIMALS).map((item) => ({
        type: item.type,
        nameAz: item.nameAz,
        description: item.description,
      })),
      yetimleriSevindir: {
        title: "Yetimləri Sevindir",
        description:
          "Uşaqlar evi, qocalar evi və ehtiyac sahiblərinə əlavə ödənişlə yemək-içmək dəstəyi göndərilə bilər.",
      },
    },
  });
};

module.exports = {
  getAnimals,
  createOrder,
  processPayment,
  getMyOrders,
  getOrderById,
  submitOrderReview,
  getKnowledgeContent,
};
