const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    nameAz: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Kateqoriya adı 100 simvoldan çox ola bilməz"],
    },
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
    stockCount: {
      type: Number,
      default: undefined,
    },
    pricePerShare: {
      type: Number,
      required: true,
      min: [1, "Qiymət ən az 1 olmalıdır"],
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
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ isActive: 1, nameAz: 1 });

module.exports = mongoose.model("Category", categorySchema);
