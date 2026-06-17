const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../config/constants");

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["photo", "video"],
    required: true,
  },
  stage: {
    type: String,
    enum: ["slaughter", "delivery", "general"],
    default: "general",
  },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
  videoFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
  phones: [{ type: String, trim: true }],
  note: { type: String, trim: true, maxlength: [300, "Qeyd 300 simvoldan çox ola bilməz"] },
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
      /^\+994(10|20|40|41|44|50|51|55|60|70|77|99)\d{7}$/,
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
      min: [0, "Miqdar mənfi ola bilməz"],
    },
    orderMode: {
      type: String,
      enum: ["tek", "serikli"],
      default: "tek",
    },
    sharedPortion: {
      type: Number,
      min: [0, "Hissə mənfi ola bilməz"],
      max: [1, "Hissə 1-dən çox ola bilməz"],
    },
    shareCount: {
      type: Number,
    },
    totalShares: {
      type: Number,
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
      headTotalCount: { type: Number, default: 0 },
      headFreeCount: { type: Number, default: 0 },
      headCharityCount: { type: Number, default: 0 },
      headReadyCount: { type: Number, default: 0 },
      headProcess: {
        type: String,
        enum: ["none", "utulun", "dogransin", "sedeqe"],
        default: "none",
      },
      headReady: { type: Boolean, default: false },
      feet: { type: Boolean, default: false },
      feetTotalCount: { type: Number, default: 0 },
      feetFreeCount: { type: Number, default: 0 },
      feetCharityCount: { type: Number, default: 0 },
      feetReadyCount: { type: Number, default: 0 },
      feetProcess: {
        type: String,
        enum: ["none", "utulun", "dogransin", "sedeqe"],
        default: "none",
      },
      feetReady: { type: Boolean, default: false },
      confirmed: { type: Boolean, default: false },
      headFee: { type: Number, default: 0 },
      feetFee: { type: Number, default: 0 },
      extraCharge: { type: Number, default: 0 },
    },
    cutStyle: {
      key: { type: String, trim: true, default: "tam_cemdek" },
      labelAz: { type: String, trim: true, default: "Tam cəmdək" },
      extraFee: { type: Number, default: 0 },
      allocations: [
        {
          key: { type: String, trim: true },
          labelAz: { type: String, trim: true },
          count: { type: Number, default: 0 },
          unitFee: { type: Number, default: 0 },
          extraFee: { type: Number, default: 0 },
        },
      ],
    },
    grindingMethod: {
      key: {
        type: String,
        enum: ["none", "utulun", "dogransin", "sedeqe"],
        default: "none",
      },
      labelAz: {
        type: String,
        trim: true,
        default: "Heç biri",
      },
      fee: {
        type: Number,
        default: 0,
        min: [0, "Doğrama haqqı 0-dan az ola bilməz"],
      },
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
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
        enum: ["bank_card", "cash_on_delivery", "epoint"],
        default: "bank_card",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      paidAt: Date,
      transactionId: String,
      epointOrderId: String,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.AWAITING_PAYMENT,
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
    selfPickup: {
      type: Boolean,
      default: false,
    },
    distSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    userNote: {
      type: String,
      trim: true,
      maxlength: [300, "İstifadəçi qeydi 300 simvoldan çox ola bilməz"],
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
    cashPickupCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    deliveryConfirmCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    autoConfirmAt: Date,
    confirmedAt: Date,
    sharedGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SharedGroup",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Sifariş nömrəsi avtomatik yarat
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const prefix = `QRB-${year}-`;
    const last = await mongoose.model("Order")
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

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ autoConfirmAt: 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);
