/**
 * Heyvan konfiqurasiyası (qiymətlər AZN ilə)
 */
const ANIMALS = {
  quzu: {
    type: "quzu",
    nameAz: "Quzu",
    emoji: "🐑",
    pricePerShare: 240,
    totalShares: 1,
    description: "Quzu üçün çəki və hazır ət forması seçə bilərsiniz.",
    minQuantity: 1,
    maxQuantity: 20,
  },
  dana: {
    type: "dana",
    nameAz: "Dana",
    emoji: "🐄",
    pricePerShare: 3200,
    totalShares: 7,
    description: "Dana 7 hissəyə bölünür.",
    minQuantity: 1,
    maxQuantity: 7,
  },
  deve: {
    type: "deve",
    nameAz: "Dəvə",
    emoji: "🐪",
    pricePerShare: 4200,
    totalShares: 7,
    description: "Dəvə 7 hissəyə bölünür.",
    minQuantity: 1,
    maxQuantity: 7,
  },
  qoc: {
    type: "qoc",
    nameAz: "Qoç",
    emoji: "🐏",
    pricePerShare: 260,
    totalShares: 1,
    description: "Qoç tam bir qurbanlıqdır.",
    minQuantity: 1,
    maxQuantity: 20,
  },
  keci: {
    type: "keci",
    nameAz: "Keçi",
    emoji: "🐐",
    pricePerShare: 250,
    totalShares: 1,
    description: "Keçi tam bir qurbanlıqdır.",
    minQuantity: 1,
    maxQuantity: 20,
  },
  qoyun: {
    type: "qoyun",
    nameAz: "Qoyun",
    emoji: "🐑",
    pricePerShare: 230,
    totalShares: 1,
    description: "Qoyun tam bir qurbanlıqdır.",
    minQuantity: 1,
    maxQuantity: 20,
  },
};

const LAMB_WEIGHT_OPTIONS = [
  { key: "20_25", labelAz: "20-25 kq", price: 240 },
  { key: "25_30", labelAz: "25-30 kq", price: 280 },
  { key: "30_40", labelAz: "30-40 kq", price: 340 },
];

const WEIGHT_OPTIONS_BY_ANIMAL = {
  quzu: LAMB_WEIGHT_OPTIONS,
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

const MEAT_FORM_OPTIONS = {
  tam_cemdek: {
    key: "tam_cemdek",
    labelAz: "1. Tam cəmdək",
    extraFee: 0,
  },
  dogranmis: {
    key: "dogranmis",
    labelAz: "2. Tam Doğranmış (Əlavə ödənişlə)",
    extraFee: 20,
  },
};

const DISTRIBUTION_TYPES = {
  catdirilsin: { key: "catdirilsin", labelAz: "Sizə çatdırılsın", icon: "🚚" },
  ozun_gotur: { key: "ozun_gotur", labelAz: "Özünüz götürün", icon: "🏠" },
  usaqlar_evi: {
    key: "usaqlar_evi",
    labelAz: "Uşaqlar evinə göndər",
    icon: "🏫",
  },
  qocalar_evi: {
    key: "qocalar_evi",
    labelAz: "Qocalar evinə göndər",
    icon: "👵",
  },
  ehtiyac_sahibleri: {
    key: "ehtiyac_sahibleri",
    labelAz: "Ehtiyac sahiblərinə göndər",
    icon: "🤲",
  },
};

const ORDER_STATUS = {
  AWAITING_PAYMENT: "awaiting_payment",
  PLACED: "placed",
  CONFIRMED: "confirmed",
  SLAUGHTERING: "slaughtering",
  PREPARING: "preparing",
  DELIVERING: "delivering",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ORDER_STATUS_LABELS = {
  awaiting_payment: "Ödəniş gözlənilir",
  placed: "Sifariş verildi",
  confirmed: "Sifariş təsdiqləndi",
  slaughtering: "Kəsilir",
  preparing: "Hazırlanır",
  delivering: "Çatdırılır",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};

const DELIVERY_TIME_WINDOWS = ["12:00-15:00", "15:00-18:00", "18:00-21:00"];

const QURBAN_PART_FEES_BY_ANIMAL = {
  quzu: { head: 5, feet: 6 },
  qoyun: { head: 6, feet: 7 },
  qoc: { head: 8, feet: 9 },
  keci: { head: 6, feet: 7 },
  dana: { head: 15, feet: 18 },
  deve: { head: 20, feet: 24 },
};

// Doğrama pulu (ütülmüş və doğranmış üçün əlavə pul)
const QURBAN_PART_PROCESSING_FEES_BY_ANIMAL = {
  quzu: { head: 3, feet: 3 },
  qoyun: { head: 4, feet: 4 },
  qoc: { head: 5, feet: 5 },
  keci: { head: 4, feet: 4 },
  dana: { head: 8, feet: 8 },
  deve: { head: 10, feet: 10 },
};

// Çatdırılma pulu (özünüz götürsəniz pulsuz)
const DELIVERY_FEE = 10;

const CUT_STYLE_LABELS = {
  tam_cemdek: "Tam cəmdək",
  kababliq: "Kabablıq",
  qazan_yemekleri: "Qazan yeməkləri üçün",
  kababliq_qazan: "Kabablıq + qazan yeməkləri üçün",
};

const CUT_STYLE_FEES_BY_ANIMAL = {
  quzu: {
    tam_cemdek: 0,
    kababliq: 10,
    qazan_yemekleri: 8,
    kababliq_qazan: 14,
  },
  qoyun: {
    tam_cemdek: 0,
    kababliq: 12,
    qazan_yemekleri: 10,
    kababliq_qazan: 16,
  },
  qoc: {
    tam_cemdek: 0,
    kababliq: 14,
    qazan_yemekleri: 12,
    kababliq_qazan: 18,
  },
  keci: {
    tam_cemdek: 0,
    kababliq: 11,
    qazan_yemekleri: 9,
    kababliq_qazan: 15,
  },
  dana: {
    tam_cemdek: 0,
    kababliq: 35,
    qazan_yemekleri: 30,
    kababliq_qazan: 50,
  },
  deve: {
    tam_cemdek: 0,
    kababliq: 40,
    qazan_yemekleri: 36,
    kababliq_qazan: 58,
  },
};

// ─── Doğrama Üsülləri (Grinding/Chopping Methods) ───────────────────────────
const GRINDING_METHOD_OPTIONS = {
  none: {
    key: "none",
    labelAz: "Heç biri",
    fee: 0,
    description: "Doğrama aparılmayacaq",
  },
  utulun: {
    key: "utulun",
    labelAz: "Ütülünmüş",
    fee: 0,
    description: "Döş ütüldükdən sonra",
  },
  dogransin: {
    key: "dogransin",
    labelAz: "Doğranmış",
    fee: 15,
    description: "Tam doğranmış",
  },
  sedeqe: {
    key: "sedeqe",
    labelAz: "Sədəqə üçün doğranmış",
    fee: 10,
    description: "Sədəqə məqsədi ilə doğranmış",
  },
};

module.exports = {
  ANIMALS,
  LAMB_WEIGHT_OPTIONS,
  WEIGHT_OPTIONS_BY_ANIMAL,
  MEAT_FORM_OPTIONS,
  DISTRIBUTION_TYPES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  DELIVERY_TIME_WINDOWS,
  QURBAN_PART_FEES_BY_ANIMAL,
  QURBAN_PART_PROCESSING_FEES_BY_ANIMAL,
  DELIVERY_FEE,
  CUT_STYLE_LABELS,
  CUT_STYLE_FEES_BY_ANIMAL,
  GRINDING_METHOD_OPTIONS,
};
