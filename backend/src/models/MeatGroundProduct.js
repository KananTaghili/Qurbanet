const mongoose = require("mongoose");

// Çəkilmiş ət (məs. Yağlı Çəkilmiş Ət, Çəkilmiş Ət) — kəsimlərdən fərqli olaraq
// klo ilə (stok + addım) satılır, admin bir neçə fərqli forma əlavə edə bilər.
const meatGroundProductSchema = new mongoose.Schema(
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
    pricePerKg: { type: Number, required: true, min: 0 },
    stockKg: { type: Number, required: true, min: 0, default: 0 },
    suitableFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

meatGroundProductSchema.index({ isActive: 1, animalKey: 1, sortOrder: 1 });

module.exports = mongoose.model("MeatGroundProduct", meatGroundProductSchema);
