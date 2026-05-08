const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Telefon nömrəsi tələb olunur"],
      unique: true,
      trim: true,
      match: [
        /^\+994(50|51|55|60|70|77|99)\d{7}$/,
        "Düzgün Azərbaycan telefon nömrəsi daxil edin",
      ],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Ad 100 simvoldan çox ola bilməz"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [100, "Soyad 100 simvoldan çox ola bilməz"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
