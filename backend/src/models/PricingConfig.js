const mongoose = require("mongoose");

const rangeSchema = new mongoose.Schema({
  label:   { type: String, required: true }, // "10-15kq"
  minKg:   { type: Number, required: true },
  maxKg:   { type: Number, required: true },
  // A — Qurbanlıq
  pricePerKg: { type: Number, default: 0 },
  xeyr:       { type: Number, default: 0 },
  qessab:     { type: Number, default: 0 },
  admin:      { type: Number, default: 0 },
  // B — Çatdırılma
  deliveryFee:  { type: Number, default: 0 },
  deliveryXeyr: { type: Number, default: 0 },
  // C — Doğrama
  kababliqFee:  { type: Number, default: 0 },
  qazanFee:     { type: Number, default: 0 },
  cuttingXeyr:  { type: Number, default: 0 },
  // D — Baş & Ayaq
  headTorch:            { type: Number, default: 0 },
  feetTorch:            { type: Number, default: 0 },
  headTorchCut:         { type: Number, default: 0 },
  feetTorchCut:         { type: Number, default: 0 },
  headTorchCutSadaqa:   { type: Number, default: 0 },
  feetTorchCutSadaqa:   { type: Number, default: 0 },
  headFeetXeyr:         { type: Number, default: 0 },
}, { _id: false });

const pricingConfigSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    unique: true,
  },
  vatRate: { type: Number, default: 1.18 },
  ranges:  { type: [rangeSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("PricingConfig", pricingConfigSchema);
