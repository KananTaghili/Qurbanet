const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name:          { type: String, trim: true, default: "" },
    phone:         { type: String, trim: true, default: "" },
    isAnonymous:   { type: Boolean, default: false },
    isOpener:      { type: Boolean, default: false },
    amount:        { type: Number, required: true, min: 0 },
    note:          { type: String, trim: true, default: "", maxlength: 500 },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentMethod: { type: String, enum: ["epoint"], default: "epoint" },
    transactionId: { type: String },
    epointOrderId: { type: String },
    paidAt:        { type: Date },
  },
  { timestamps: true },
);

const charityCampaignSchema = new mongoose.Schema(
  {
    campaignNumber: { type: String, unique: true },

    animal: {
      id:          { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      nameAz:      { type: String, required: true },
      emoji:       { type: String, default: "🐑" },
      image:       { type: String, default: "" },
      imageHome:   { type: String, default: "" },
      weightRange: { type: String, default: "" },
      price:       { type: Number, required: true, min: 0 },
    },

    totalAmount:     { type: Number, required: true, min: 0 },
    collectedAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending_payment", "collecting", "completed", "delivered", "cancelled"],
      default: "pending_payment",
    },

    opener: {
      userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name:        { type: String, trim: true, default: "" },
      phone:       { type: String, trim: true, default: "" },
      isAnonymous: { type: Boolean, default: false },
      note:        { type: String, trim: true, default: "" },
    },

    donations: [donationSchema],

    media: [
      {
        type:       { type: String, enum: ["photo", "video"], default: "photo" },
        url:        { type: String },
        filename:   { type: String },
        fileId:     { type: mongoose.Schema.Types.ObjectId },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    adminNote:   { type: String, trim: true, maxlength: 1000 },
    completedAt: { type: Date },
    deliveredAt: { type: Date },  // ehtiyac sahiblərinə çatdırıldığı tarix
  },
  { timestamps: true },
);

charityCampaignSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("CharityCampaign").countDocuments();
    const year = new Date().getFullYear();
    this.campaignNumber = `XYR-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

charityCampaignSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("CharityCampaign", charityCampaignSchema);
