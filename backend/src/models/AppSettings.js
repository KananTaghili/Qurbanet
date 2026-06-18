const mongoose = require("mongoose");

const timeWindowSchema = new mongoose.Schema({
  key: { type: String, trim: true, required: true },
  label: { type: String, trim: true, required: true },
  isActive: { type: Boolean, default: true },
});

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
    // ─── Xeyriyyə kampaniyası tənzimləmələri ───────────────────────────────
    campaignMinOpenPercent:  { type: Number, default: 30, min: 0.01, max: 100 },
    campaignMinDonation:     { type: Number, default: 10, min: 0.01 },
    campaignAllowAnonymous:  { type: Boolean, default: true },
    campaignAllowGuest:      { type: Boolean, default: true },
    campaignGuestNameRequired:  { type: Boolean, default: false },
    campaignGuestPhoneRequired: { type: Boolean, default: false },
    campaignOnePerAnimal:       { type: Boolean, default: true },  // heyvan başına açılış limiti aktiv?
    campaignMaxPerAnimal:       { type: Number,  default: 1, min: 1 },  // hər heyvandan maksimum neçə aktiv açılış

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
