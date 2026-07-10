const mongoose = require("mongoose");

const meatOrderItemSchema = new mongoose.Schema({
  animalKey: { type: String, required: true, trim: true },
  animalNameAz: { type: String, trim: true },
  partKey: { type: String, required: true, trim: true },
  partNameAz: { type: String, trim: true },
  cutId: { type: mongoose.Schema.Types.ObjectId, required: true },
  cutNameAz: { type: String, required: true, trim: true },
  pricePerKg: { type: Number, required: true, min: 0 },
  quantityKg: { type: Number, required: true, min: 0.5 },
  lineTotal: { type: Number, required: true, min: 0 },
});

const deliveryLocationSchema = new mongoose.Schema({
  countryCode: { type: String, trim: true, default: "AZE" },
  countryNameAz: { type: String, trim: true, default: "Azərbaycan" },
  cityKey: { type: String, trim: true, default: "baku" },
  cityNameAz: { type: String, trim: true, default: "Bakı" },
  address: { type: String, trim: true, required: true },
  coordinates: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
});

const contactInfoSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, maxlength: 100 },
  lastName: { type: String, trim: true, maxlength: 100 },
  mobile: {
    type: String,
    trim: true,
    match: [
      /^\+994(10|20|40|41|44|50|51|55|60|70|77|99)\d{7}$/,
      "Düzgün Azərbaycan telefon nömrəsi daxil edin",
    ],
  },
});

const MEAT_ORDER_STATUS = [
  "awaiting_payment",
  "placed",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

const meatOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, unique: true },
    items: {
      type: [meatOrderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: "Sifarişdə ən azı 1 məhsul olmalıdır.",
      },
      required: true,
    },
    itemsTotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    deliveryLocation: { type: deliveryLocationSchema, required: true },
    contactInfo: contactInfoSchema,
    payment: {
      method: { type: String, enum: ["epoint"], default: "epoint" },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      paidAt: Date,
      transactionId: String,
      epointOrderId: String,
    },
    status: { type: String, enum: MEAT_ORDER_STATUS, default: "awaiting_payment" },
    statusHistory: [
      {
        status: { type: String, enum: MEAT_ORDER_STATUS, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],
    userNote: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

meatOrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const prefix = `MET-${year}-`;
    const last = await mongoose
      .model("MeatOrder")
      .findOne({ orderNumber: { $regex: `^${prefix}` } })
      .sort({ orderNumber: -1 })
      .select("orderNumber")
      .lean();
    let nextNum = 1;
    if (last?.orderNumber) {
      const parsed = parseInt(last.orderNumber.slice(prefix.length), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    this.orderNumber = `${prefix}${String(nextNum).padStart(5, "0")}`;
  }
  next();
});

meatOrderSchema.index({ user: 1, createdAt: -1 });
meatOrderSchema.index({ status: 1 });

module.exports = mongoose.model("MeatOrder", meatOrderSchema);
module.exports.MEAT_ORDER_STATUS = MEAT_ORDER_STATUS;
