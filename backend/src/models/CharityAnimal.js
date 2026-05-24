const mongoose = require("mongoose");

const priceOptionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    labelAz: { type: String, required: true, trim: true },
    labelEn: { type: String, trim: true, default: "" },
    labelRu: { type: String, trim: true, default: "" },
    labelAr: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const charityAnimalSchema = new mongoose.Schema(
  {
    nameAz: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true, default: "" },
    nameRu: { type: String, trim: true, default: "" },
    nameAr: { type: String, trim: true, default: "" },
    emoji: { type: String, default: "🐑" },
    animalType: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    imageUrl: { type: String, default: "" },
    content: { type: String, trim: true, default: "" },
    priceOptions: {
      type: [priceOptionSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: "Ən azı 1 qiymət seçimi lazımdır.",
      },
      default: [],
    },
    charityTargets: {
      type: [String],
      default: ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"],
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

charityAnimalSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("CharityAnimal", charityAnimalSchema);
