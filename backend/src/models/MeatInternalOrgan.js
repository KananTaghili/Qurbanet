const mongoose = require("mongoose");

// Daxili orqanlar — tam hissə (kəsimlər kimi) satılır: sabit çəki × klo qiyməti = total.
const meatInternalOrganSchema = new mongoose.Schema(
  {
    nameAz: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true, default: "" },
    nameRu: { type: String, trim: true, default: "" },
    nameAr: { type: String, trim: true, default: "" },
    animalKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["qoyun", "qoc", "dana", "deve", "keci"],
    },
    imageFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    weightKg: { type: Number, required: true, min: 0 },
    pricePerKg: { type: Number, required: true, min: 0 },
    suitableFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

meatInternalOrganSchema.index({ isActive: 1, animalKey: 1, sortOrder: 1 });

module.exports = mongoose.model("MeatInternalOrgan", meatInternalOrganSchema);
