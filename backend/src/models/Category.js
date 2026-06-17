const mongoose = require("mongoose");

const weightOptionSchema = new mongoose.Schema({
  key:     { type: String, trim: true, required: true },
  labelAz: { type: String, trim: true, required: true },
  labelEn: { type: String, trim: true, default: "" },
  labelRu: { type: String, trim: true, default: "" },
  labelAr: { type: String, trim: true, default: "" },
  price:   { type: Number, default: 0, min: 0 },
});

const cutStyleOptionSchema = new mongoose.Schema({
  key:     { type: String, trim: true, required: true },
  labelAz: { type: String, trim: true, required: true },
  labelEn: { type: String, trim: true, default: "" },
  labelRu: { type: String, trim: true, default: "" },
  labelAr: { type: String, trim: true, default: "" },
  fee:     { type: Number, default: 0, min: 0 },
});

const partOptionSchema = new mongoose.Schema({
  key:     { type: String, trim: true, required: true },
  labelAz: { type: String, trim: true, required: true },
  labelEn: { type: String, trim: true, default: "" },
  labelRu: { type: String, trim: true, default: "" },
  labelAr: { type: String, trim: true, default: "" },
  fee:     { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
});

const categorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    nameAz: { type: String, required: true, trim: true, maxlength: [100, "Kateqoriya adı 100 simvoldan çox ola bilməz"] },
    nameEn: { type: String, trim: true, default: "" },
    nameRu: { type: String, trim: true, default: "" },
    nameAr: { type: String, trim: true, default: "" },
    description: {
      type: String,
      trim: true,
      maxlength: [400, "Açıqlama 400 simvoldan çox ola bilməz"],
    },
    emoji: {
      type: String,
      trim: true,
      maxlength: [10, "Emoji dəyəri çox uzundur"],
      default: "🐑",
    },
    weightRange: {
      type: String,
      trim: true,
      maxlength: [30, "Çəki aralığı çox uzundur"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    videoFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    stockCount: {
      type: Number,
      default: undefined,
    },
    pricePerShare: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalShares: {
      type: Number,
      required: true,
      min: [1, "Hissə sayı ən az 1 olmalıdır"],
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    serikliEnabled: {
      type: Boolean,
      default: false,
    },

    hasPortionSplit: {
      type: Boolean,
      default: true,
    },
    maxPortionSplit: {
      type: Number,
      default: null,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Baş seçimi ─────────────────────────────────────────────────────────
    hasHeadOption: {
      type: Boolean,
      default: true,
    },
    headOptions: {
      type: [partOptionSchema],
      default: [
        { key: "free", labelAz: "Təmizlənməmiş (Xam)", fee: 0, isActive: true },
        { key: "torched", labelAz: "Ütülmüş", fee: 5, isActive: true },
        { key: "ready", labelAz: "Təmizlənmiş və doğranmış", fee: 8, isActive: true },
        { key: "charity", labelAz: "Ehtiyac sahiblərinə sədəqə", fee: 0, isActive: true },
      ],
    },

    // ─── Ayaq seçimi ────────────────────────────────────────────────────────
    hasFeetOption: {
      type: Boolean,
      default: true,
    },
    feetOptions: {
      type: [partOptionSchema],
      default: [
        { key: "free", labelAz: "Təmizlənməmiş (Xam)", fee: 0, isActive: true },
        { key: "torched", labelAz: "Ütülmüş", fee: 6, isActive: true },
        { key: "ready", labelAz: "Təmizlənmiş və doğranmış", fee: 9, isActive: true },
        { key: "charity", labelAz: "Ehtiyac sahiblərinə sədəqə", fee: 0, isActive: true },
      ],
    },

    // ─── Çəki seçimləri (quzu kimi heyvanlar üçün) ──────────────────────────
    weightOptions: {
      type: [weightOptionSchema],
      default: [],
    },

    // ─── Doğrama üsulları ────────────────────────────────────────────────────
    cutStyleOptions: {
      type: [cutStyleOptionSchema],
      default: [{ key: "tam_cemdek", labelAz: "Tam cəmdək", fee: 0 }],
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("Category", categorySchema);
