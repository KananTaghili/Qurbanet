const mongoose = require("mongoose");

const charityOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    nameAz: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Ad 100 simvoldan çox ola bilməz"],
    },
    icon: {
      type: String,
      trim: true,
      default: "🤲",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Açıqlama 500 simvoldan çox ola bilməz"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, "Məzmun çox uzundur"],
    },
    minDonationAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum hədiə məbləği mənfi ola bilməz"],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

charityOptionSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("CharityOption", charityOptionSchema);
