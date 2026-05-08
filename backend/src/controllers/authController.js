const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const OTP = require("../models/OTP");
const User = require("../models/User");
const { generateOTP, sendSMS } = require("../utils/sms");
const { normalizeAzPhone } = require("../utils/phone");
const { success, error } = require("../utils/response");

const OTP_MAX_ATTEMPTS = 5;

const generateGuestPhone = () => {
  const suffix = String(Math.floor(Math.random() * 10000000)).padStart(7, "0");
  return `+99499${suffix}`;
};

// ─── OTP Göndər ─────────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const rawPhone = req.body.phone;
    const phone = normalizeAzPhone(rawPhone);

    if (!phone) {
      return error(
        res,
        "Düzgün Azərbaycan telefon nömrəsi daxil edin. (+994XXXXXXXXXX)",
        400,
      );
    }

    // Mövcud OTP-ni sil
    await OTP.deleteMany({ phone });

    // Yeni OTP yarat
    const code = generateOTP();
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000,
    );

    await OTP.create({ phone, code, expiresAt });

    // SMS göndər
    await sendSMS(phone, code);

    return success(
      res,
      { phone },
      `Doğrulama kodu ${phone} nömrəsinə göndərildi.`,
    );
  } catch (err) {
    console.error("sendOTP xətası:", err);
    return error(res, "SMS göndərərkən xəta baş verdi.", 500);
  }
};

// ─── OTP Yoxla ──────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const rawPhone = req.body.phone;
    const code = req.body.code;

    const phone = normalizeAzPhone(rawPhone);
    if (!phone) {
      return error(res, "Düzgün telefon nömrəsi daxil edin.", 400);
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return error(res, "OTP kodu 6 rəqəmli olmalıdır.", 400);
    }

    const otpRecord = await OTP.findOne({ phone });

    if (!otpRecord) {
      return error(res, "OTP kodu tapılmadı. Yenidən göndərin.", 400);
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteMany({ phone });
      return error(res, "OTP kodunun vaxtı keçib. Yenidən göndərin.", 400);
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await OTP.deleteMany({ phone });
      return error(res, "Çox sayda yanlış cəhd. Yenidən kod göndərin.", 400);
    }

    if (otpRecord.code !== code) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const remaining = OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return error(res, `Yanlış kod. ${remaining} cəhdiniz qalıb.`, 400);
    }

    // OTP düzgündür - sil
    await OTP.deleteMany({ phone });

    // İstifadəçini tap ya yarat
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, isVerified: true });
    } else {
      user.isVerified = true;
      await user.save();
    }

    if (user.isBlocked) {
      return error(res, "Hesabınız bloklanıb. Dəstəklə əlaqə saxlayın.", 403);
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    return success(
      res,
      {
        token,
        needsName: !user.name,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          lastName: user.lastName,
          isVerified: user.isVerified,
        },
      },
      "Uğurla daxil oldunuz.",
    );
  } catch (err) {
    console.error("verifyOTP xətası:", err);
    return error(res, "Doğrulama zamanı xəta baş verdi.", 500);
  }
};

// ─── Qonaq giriş ────────────────────────────────────────────────────────────
const guestLogin = async (req, res) => {
  try {
    const requestedPhone =
      typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    const normalizedPhone = requestedPhone
      ? normalizeAzPhone(requestedPhone)
      : null;

    const phone = normalizedPhone || generateGuestPhone();

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        name: "Qonaq",
        isVerified: true,
      });
    }

    if (user.isBlocked) {
      return error(res, "Hesabınız bloklanıb. Dəstəklə əlaqə saxlayın.", 403);
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    return success(
      res,
      {
        token,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          lastName: user.lastName,
          isVerified: user.isVerified,
        },
      },
      "Qonaq olaraq daxil oldunuz.",
    );
  } catch (err) {
    console.error("guestLogin xətası:", err);
    return error(res, "Qonaq girişi zamanı xəta baş verdi.", 500);
  }
};

// ─── Profil al ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) return error(res, "İstifadəçi tapılmadı.", 404);
    return success(res, { user });
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ─── Profil yenilə ──────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, lastName } = req.body;
    if (!name || name.trim().length < 2) {
      return error(res, "Ad ən az 2 simvol olmalıdır.", 400);
    }

    if (lastName && lastName.trim().length < 2) {
      return error(res, "Soyad ən az 2 simvol olmalıdır.", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name: name.trim(),
        lastName: String(lastName || "").trim() || undefined,
      },
      { new: true, select: "-__v" },
    );
    return success(res, { user }, "Profil yeniləndi.");
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

module.exports = { sendOTP, verifyOTP, guestLogin, getProfile, updateProfile };
