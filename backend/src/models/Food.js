const mongoose = require("mongoose");

// Et Satışı məhsullarında "hansı yeməklərə uyğundur" seçimi üçün istifadə olunan etiket siyahısı.
const foodSchema = new mongoose.Schema(
  {
    nameAz: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true, default: "" },
    nameRu: { type: String, trim: true, default: "" },
    imageFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

foodSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("Food", foodSchema);
