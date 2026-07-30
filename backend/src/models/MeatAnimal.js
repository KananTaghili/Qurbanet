const mongoose = require("mongoose");

const meatCutSchema = new mongoose.Schema({
  nameAz: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true, default: "" },
  nameRu: { type: String, trim: true, default: "" },
  nameAr: { type: String, trim: true, default: "" },
  pricePerKg: { type: Number, required: true, min: 0 },
  // true = çəki ilə satış (müştəri 0.5/1/1.5 kq addımlarla ala bilər, stockKg/stepKg/minKg istifadə olunur)
  // false = tam hissə satışı (sabit weightKg, müştəri hamısını birdən alır)
  soldByWeight: { type: Boolean, default: false },
  // Köhnə klo+addım satış sahələri — hazırkı ictimai Ət Satışı səhifəsi bunlardan istifadə edir,
  // "tam hissə" admin formasında artıq göstərilmir amma geriyə uyğunluq üçün saxlanılır.
  stockKg: { type: Number, required: true, min: 0, default: 0 },
  stepKg: { type: Number, default: 1, min: 0.5 },
  minKg: { type: Number, default: 1, min: 0.5 },
  // Tam hissə satışı: sabit çəki (kq) × pricePerKg = total (admin formasında hesablanır).
  weightKg: { type: Number, default: 0, min: 0 },
  imageFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  suitableFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const bodyPartSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  nameAz: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true, default: "" },
  nameRu: { type: String, trim: true, default: "" },
  nameAr: { type: String, trim: true, default: "" },
  sortOrder: { type: Number, default: 0 },
  cuts: { type: [meatCutSchema], default: [] },
});

const meatAnimalSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: ["qoyun", "qoc", "dana", "deve", "keci"],
    },
    nameAz: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true, default: "" },
    nameRu: { type: String, trim: true, default: "" },
    nameAr: { type: String, trim: true, default: "" },
    emoji: { type: String, default: "🐑" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    bodyParts: { type: [bodyPartSchema], default: [] },
  },
  { timestamps: true },
);

meatAnimalSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("MeatAnimal", meatAnimalSchema);
