const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../config/constants");

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["photo", "video"],
    required: true,
  },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const processNoteSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: [
      "order_day",
      "slaughter_day",
      "slaughter_moment",
      "post_slaughter",
      "delivery_handover",
    ],
    required: true,
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, "Qeyd 500 simvoldan çox ola bilməz"],
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const distributionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "catdirilsin",
      "ozun_gotur",
      "usaqlar_evi",
      "qocalar_evi",
      "ehtiyac_sahibleri",
      "ozum",
      "mekan",
    ],
    required: true,
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, "Məkan 200 simvoldan çox ola bilməz"],
  },
  coordinates: {
    lat: {
      type: Number,
      min: [-90, "Latitude düzgün deyil"],
      max: [90, "Latitude düzgün deyil"],
    },
    lng: {
      type: Number,
      min: [-180, "Longitude düzgün deyil"],
      max: [180, "Longitude düzgün deyil"],
    },
  },
});

const contactInfoSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    maxlength: [100, "Ad 100 simvoldan çox ola bilməz"],
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [100, "Soyad 100 simvoldan çox ola bilməz"],
  },
  mobile: {
    type: String,
    trim: true,
    match: [
      /^\+994(50|51|55|60|70|77|99)\d{7}$/,
      "Düzgün Azərbaycan telefon nömrəsi daxil edin",
    ],
  },
});

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5 },
  comment: {
    type: String,
    trim: true,
    maxlength: [700, "Rəy 700 simvoldan çox ola bilməz"],
  },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
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
    animalType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    animalNameAz: {
      type: String,
      trim: true,
    },
    animalEmoji: {
      type: String,
      trim: true,
    },
    animalImageUrl: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.1, "Miqdar ən az 0.1 olmalıdır"],
    },
    orderMode: {
      type: String,
      enum: ["tek", "serikli"],
      default: "tek",
    },
    sharedPortion: {
      type: Number,
      min: [0.1, "Hissə ən az 0.1 ola bilər"],
      max: [0.6, "Hissə ən çox 0.6 ola bilər"],
    },
    lambSelection: {
      weightCategoryKey: {
        type: String,
        trim: true,
      },
      weightCategoryLabel: {
        type: String,
        trim: true,
      },
      meatFormKey: {
        type: String,
        trim: true,
      },
      meatFormLabel: {
        type: String,
        trim: true,
      },
      meatFormExtraFee: {
        type: Number,
        default: 0,
      },
    },
    qurbanParts: {
      head: { type: Boolean, default: false },
      feet: { type: Boolean, default: false },
      confirmed: { type: Boolean, default: false },
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    distribution: {
      type: distributionSchema,
      required: true,
    },
    payment: {
      method: {
        type: String,
        enum: ["bank_card", "cash_on_delivery"],
        default: "bank_card",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      paidAt: Date,
      transactionId: String,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(ORDER_STATUS),
          required: true,
        },
        at: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],
    media: [mediaSchema],
    processNotes: [processNoteSchema],
    deliveryProof: {
      handoverVideoUrl: { type: String, trim: true },
      handoverCode: { type: String, trim: true },
      handoverCodeVerifiedAt: Date,
      handoverCodeVerifiedBy: { type: String, trim: true },
    },
    orphanDelight: {
      enabled: { type: Boolean, default: false },
      target: {
        type: String,
        enum: ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"],
      },
      extraAmount: { type: Number, min: 0, default: 0 },
      note: { type: String, trim: true, maxlength: 300 },
    },
    contactInfo: contactInfoSchema,
    review: reviewSchema,
    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, "Qeyd 500 simvoldan çox ola bilməz"],
    },
    estimatedDate: Date,
    slaughterDate: Date,
    deliveryDate: Date,
    deliveryWindow: {
      type: String,
      trim: true,
    },
    slaughterTimingHours: {
      type: Number,
      enum: [24, 48],
      default: 24,
    },
    autoConfirmAt: Date,
    confirmedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Sifariş nömrəsi avtomatik yarat
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Order").countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `QRB-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ autoConfirmAt: 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);
