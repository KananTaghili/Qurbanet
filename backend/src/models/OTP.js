const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL: MongoDB özü siler expiresAt keçdikdən sonra
    },
  },
  {
    timestamps: true,
  },
);

// Eyni telefona aid bütün köhnə OTP-ləri tapmaq üçün indeks
otpSchema.index({ phone: 1 });

module.exports = mongoose.model("OTP", otpSchema);
