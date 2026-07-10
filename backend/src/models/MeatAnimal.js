const mongoose = require("mongoose");

const meatCutSchema = new mongoose.Schema({
  nameAz: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true, default: "" },
  nameRu: { type: String, trim: true, default: "" },
  nameAr: { type: String, trim: true, default: "" },
  pricePerKg: { type: Number, required: true, min: 0 },
  stockKg: { type: Number, required: true, min: 0, default: 0 },
  stepKg: { type: Number, default: 1, min: 0.5 },
  minKg: { type: Number, default: 1, min: 0.5 },
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
