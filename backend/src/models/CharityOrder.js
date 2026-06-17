const mongoose = require("mongoose");

const CHARITY_STATUSES = ["pending", "placed", "confirmed", "slaughtering", "preparing", "delivering", "completed", "cancelled"];

const charityOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, unique: true },
    charityType:  { type: String, trim: true },
    charityAnimalId: { type: mongoose.Schema.Types.ObjectId, ref: "CharityAnimal" },
    animalName:       { type: String, trim: true },
    animalEmoji:      { type: String, default: "🐑" },
    animalType:       { type: String, trim: true },
    selectedPriceKey:   { type: String, trim: true },
    selectedPriceLabel: { type: String, trim: true },
    charityOrgId:   { type: mongoose.Schema.Types.ObjectId, ref: "CharityOption" },
    charityOrgName: { type: String, trim: true },
    label:       { type: String, trim: true, required: true },
    summaryRows: [{ label: String, value: mongoose.Schema.Types.Mixed }],
    totalAmount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: CHARITY_STATUSES, default: "placed" },
    statusHistory: [
      {
        status:    { type: String, enum: CHARITY_STATUSES },
        changedAt: { type: Date, default: Date.now },
        note:      String,
      },
    ],

    paymentMethod: { type: String, enum: ["bank_card", "epoint", "cash"], default: "epoint" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paidAt:        { type: Date },
    epointOrderId: { type: String },
    transactionId: { type: String },

    media: [
      {
        url:        { type: String },
        filename:   { type: String },
        fileId:     { type: mongoose.Schema.Types.ObjectId },
        type:       { type: String, enum: ["photo", "video"], default: "photo" },
        stage:      { type: String, enum: ["slaughter", "delivery"], default: "slaughter" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    adminNote: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

charityOrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("CharityOrder").countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `CHR-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

charityOrderSchema.index({ user: 1, createdAt: -1 });
charityOrderSchema.index({ status: 1 });
charityOrderSchema.index({ charityAnimalId: 1 });

module.exports = mongoose.model("CharityOrder", charityOrderSchema);
