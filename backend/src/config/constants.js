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
    nameAz: "Dana (İnek)",
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
  PLACED: "placed",
  CONFIRMED: "confirmed",
  SLAUGHTERING: "slaughtering",
  PREPARING: "preparing",
  DELIVERING: "delivering",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ORDER_STATUS_LABELS = {
  placed: "Sifariş verildi",
  confirmed: "Sifariş təsdiqləndi",
  slaughtering: "Kəsilir",
  preparing: "Hazırlanır",
  delivering: "Çatdırılır",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};

const DELIVERY_TIME_WINDOWS = [
  "09:00-12:00",
  "12:00-15:00",
  "15:00-18:00",
  "18:00-21:00",
];

module.exports = {
  ANIMALS,
  LAMB_WEIGHT_OPTIONS,
  WEIGHT_OPTIONS_BY_ANIMAL,
  MEAT_FORM_OPTIONS,
  DISTRIBUTION_TYPES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  DELIVERY_TIME_WINDOWS,
};
