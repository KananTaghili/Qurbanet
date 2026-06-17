const mongoose = require("mongoose");

const deliveryOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: [
        "catdirilsin",
        "ozun_gotur",
        "usaqlar_evi",
        "qocalar_evi",
        "ehtiyac_sahibleri",
      ],
    },
    labelAz: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "🏠",
    },
    basePrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Qiymət mənfi ola bilməz"],
    },
    categorySpecificPrices: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Qiymət mənfi ola bilməz"],
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    categoryMinimums: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        minShares: {
          type: Number,
          required: true,
          min: [0, "Minimum mənfi ola bilməz"],
          default: 0,
        },
      },
    ],
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      name: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  },
);

deliveryOptionSchema.index({ isActive: 1, key: 1 });

module.exports = mongoose.model("DeliveryOption", deliveryOptionSchema);
