const mongoose = require("mongoose");

const charityOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    charityType: {
      type: String,
      enum: ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"],
      required: true,
    },
    label: {
      type: String,
      trim: true,
      required: true,
    },
    summaryRows: [
      {
        label: String,
        value: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "completed", "cancelled"],
        },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["bank_card", "cash"],
      default: "bank_card",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "paid",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    video: {
      filename: String,
      url: String,
      uploadedAt: Date,
      uploadedBy: String, // Store admin username
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Charity order nömrəsi avtomatik yarat
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
charityOrderSchema.index({ charityType: 1 });

module.exports = mongoose.model("CharityOrder", charityOrderSchema);
