const mongoose = require("mongoose");

const sharedGroupSchema = new mongoose.Schema(
  {
    groupNumber: { type: Number },
    animalType: { type: String, required: true, trim: true, lowercase: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    filledCapacity: { type: Number, default: 0 }, // sum of sharedPortion (0.0 - 1.0)
    totalShares: { type: Number, default: null }, // animal's total shares (e.g. 7 for dana)
    status: {
      type: String,
      enum: ["forming", "confirmed"],
      default: "forming",
    },
    confirmedAt: Date,
  },
  { timestamps: true },
);

sharedGroupSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("SharedGroup").countDocuments();
    this.groupNumber = count + 1;
  }
  next();
});

module.exports = mongoose.model("SharedGroup", sharedGroupSchema);
