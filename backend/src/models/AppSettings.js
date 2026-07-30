const mongoose = require("mongoose");

const timeWindowSchema = new mongoose.Schema({
  key: { type: String, trim: true, required: true },
  label: { type: String, trim: true, required: true },
  isActive: { type: Boolean, default: true },
});

const deliveryCitySchema = new mongoose.Schema(
  {
    key: { type: String, trim: true, required: true },
    nameAz: { type: String, trim: true, required: true },
    enabled: { type: Boolean, default: false },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    // Ət Satışı — bu şəhərə çatdırılma qiyməti (AZN) — hər şəhər üçün ayrıca
    deliveryPrice: { type: Number, default: 5, min: 0 },
  },
  { _id: false },
);

const deliveryCountrySchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, required: true },
    nameAz: { type: String, trim: true, required: true },
    flagCode: { type: String, trim: true, default: "az" },
    enabled: { type: Boolean, default: false },
    cities: { type: [deliveryCitySchema], default: [] },
  },
  { _id: false },
);

const appSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "global", unique: true },
    deliveryFee: {
      type: Number,
      default: 10,
      min: 0,
    },
    charityWeightInfoText: {
      type: String,
      default:
        "Yuxarıda göstərilmiş qiymətlərə qurbanlığın kəsilməsi, bişirilməsi və uşaqlar evinə çatdırılması daxildir.\nQeyd: Qurbanlıqdan artıq qalan hissələr ehtiyac sahiblərinə veriləcək.",
      maxlength: 600,
    },
    timeWindows: {
      type: [timeWindowSchema],
      default: [
        { key: "12_15", label: "12:00-15:00", isActive: true },
        { key: "15_18", label: "15:00-18:00", isActive: true },
        { key: "18_21", label: "18:00-21:00", isActive: true },
      ],
    },
    storageQuotaGB: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminPasswordHash: {
      type: String,
      select: false,
    },
    cashPickupLocation: {
      address: {
        type: String,
        default: "20 Yanvar metro stansiyası yaxınlığı, Bakı",
        maxlength: 300,
      },
      lat: { type: Number, default: 40.3875 },
      lng: { type: Number, default: 49.8278 },
    },
    meatPickupLocation: {
      address: { type: String, default: "20 Yanvar metro stansiyası yaxınlığı, Bakı", maxlength: 300 },
      lat: { type: Number, default: 40.3875 },
      lng: { type: Number, default: 49.8278 },
    },
    cashPaymentEnabled: {
      type: Boolean,
      default: true,
    },
    charityPageEnabled: {
      type: Boolean,
      default: true,
    },
    // Ət Satışı — çatdırılma zamanı ölkə seçimi açıq/bağlı (hazırda yalnız Azərbaycan aktivdir)
    meatCountrySelectionEnabled: {
      type: Boolean,
      default: false,
    },
    // Ət Satışı — çatdırılma üçün ölkə/şəhər siyahısı
    deliveryCountries: {
      type: [deliveryCountrySchema],
      default: [
        {
          code: "AZE",
          nameAz: "Azərbaycan",
          flagCode: "az",
          enabled: true,
          cities: [
            { key: "baku", nameAz: "Bakı", enabled: true, lat: 40.4093, lng: 49.8671 },
            { key: "sumqayit", nameAz: "Sumqayıt", enabled: true, lat: 40.5891, lng: 49.6686 },
            { key: "ganja", nameAz: "Gəncə", enabled: false, lat: 40.6828, lng: 46.3606 },
          ],
        },
        {
          code: "TUR",
          nameAz: "Türkiyə",
          flagCode: "tr",
          enabled: false,
          cities: [],
        },
        {
          code: "UZB",
          nameAz: "Özbəkistan",
          flagCode: "uz",
          enabled: true,
          cities: [
            { key: "tashkent", nameAz: "Daşkənd", enabled: true, lat: 41.2995, lng: 69.2401 },
            { key: "samarkand", nameAz: "Səmərqənd", enabled: false, lat: 39.6542, lng: 66.9597 },
          ],
        },
        { code: "RUS", nameAz: "Rusiya", flagCode: "ru", enabled: false, cities: [] },
        { code: "GEO", nameAz: "Gürcüstan", flagCode: "ge", enabled: false, cities: [] },
      ],
    },
    singleAnimalMode: {
      type: Boolean,
      default: false,
    },
    maxSlaughterDays: {
      type: Number,
      default: 14,
      min: 1,
    },
    quickDateTodayEnabled: {
      type: Boolean,
      default: true,
    },
    quickDateTomorrowEnabled: {
      type: Boolean,
      default: true,
    },
    multiLanguageEnabled: {
      type: Boolean,
      default: true,
    },
    enabledLanguages: {
      type: [String],
      default: ['az', 'en', 'ru'],
    },
    // ─── Xeyriyyə kampaniyası tənzimləmələri ───────────────────────────────
    campaignMinOpenPercent:  { type: Number, default: 30, min: 0.01, max: 100 },
    campaignMinDonation:     { type: Number, default: 10, min: 0.01 },
    campaignAllowAnonymous:  { type: Boolean, default: true },
    campaignAllowGuest:      { type: Boolean, default: true },
    campaignGuestNameRequired:  { type: Boolean, default: false },
    campaignGuestPhoneRequired: { type: Boolean, default: false },
    campaignOnePerAnimal:          { type: Boolean, default: true },
    campaignMaxPerAnimal:          { type: Number,  default: 1, min: 1 },
    // Kampaniya demək olar tamamlandıqda (X% keçəndə) aşağı minimum tətbiq olunur
    campaignNearlyFullPercent:     { type: Number, default: 90, min: 0.01, max: 100 },
    campaignNearlyFullMinDonation: { type: Number, default: 1,  min: 0.01 },

    allowedAdminEmails: {
      type: [String],
      default: ["nbiyevmuhammd1@gmail.com"],
    },
    adminCredentials: {
      type: [
        {
          email: { type: String, required: true },
          passwordHash: { type: String, required: true, select: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AppSettings", appSettingsSchema);
