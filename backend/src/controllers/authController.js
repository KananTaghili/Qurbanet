const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const OTP = require("../models/OTP");
const User = require("../models/User");
const { generateOTP, sendSMS, sendWhatsApp, sendEmail } = require("../utils/sms");
const { normalizeAzPhone } = require("../utils/phone");
const { success, error } = require("../utils/response");

const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const makeToken = (user) =>
  jwt.sign(
    { userId: user._id, phone: user.phone, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

const userPayload = (user) => ({
  id: user._id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  lastName: user.lastName,
  isVerified: user.isVerified,
});

// ─── OTP Göndər ─────────────────────────────────────────────────────────────
//
// Body:
//   { phone, channel: "sms"|"email", deliveryEmail? }  — AZ istifadəçi
//   { email }                                           — Xarici istifadəçi
//
// channel="email" + AZ phone → OTP həm phone-a, həm deliveryEmail-ə göndərilir.
// channel="sms"  + AZ phone → OTP SMS ilə göndərilir.
// Yalnız email → OTP email-ə göndərilir (xarici istifadəçi).
// ─────────────────────────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail, channel = "sms", deliveryEmail } = req.body;

    // ── Email (xarici istifadəçi) ──
    if (!rawPhone && rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return error(res, "Düzgün email ünvanı daxil edin.", 400);

      await OTP.deleteMany({ email });
      const code = generateOTP();
      await OTP.create({ email, code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) });
      await sendEmail(email, code, "en");

      return success(res, { method: "email", email }, `Doğrulama kodu ${email} ünvanına göndərildi.`);
    }

    // ── Telefon (AZ istifadəçi) ──
    if (rawPhone) {
      const phone = normalizeAzPhone(rawPhone.trim());
      if (!phone) return error(res, "Düzgün Azərbaycan telefon nömrəsi daxil edin (+994XXXXXXXXX).", 400);

      await OTP.deleteMany({ phone });
      const code = generateOTP();
      await OTP.create({ phone, code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) });

      if (channel === "email") {
        const dEmail = (deliveryEmail || "").trim().toLowerCase();
        if (!isValidEmail(dEmail)) return error(res, "Email kanalı üçün düzgün email ünvanı daxil edin.", 400);
        await sendEmail(dEmail, code, "az");
        return success(res, { method: "email", phone, deliveryEmail: dEmail }, `Doğrulama kodu ${dEmail} ünvanına göndərildi.`);
      }

      if (channel === "whatsapp") {
        await sendWhatsApp(phone, code);
        return success(res, { method: "whatsapp", phone }, `Doğrulama kodu WhatsApp ilə göndərildi.`);
      }

      // Default: SMS
      await sendSMS(phone, code);
      return success(res, { method: "sms", phone }, `Doğrulama kodu ${phone} nömrəsinə SMS ilə göndərildi.`);
    }

    return error(res, "Telefon nömrəsi və ya email ünvanı tələb olunur.", 400);
  } catch (err) {
    console.error("sendOTP xətası:", err);
    return error(res, "Doğrulama kodu göndərərkən xəta baş verdi.", 500);
  }
};

// ─── OTP Yoxla ───────────────────────────────────────────────────────────────
//
// Body: { phone OR email, code (4 rəqəm), password }
// OTP doğrulandıqdan sonra istifadəçi yaradılır/yenilənir.
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail, code, password } = req.body;

    if (!code || !/^\d{4}$/.test(code)) {
      return error(res, "OTP kodu 4 rəqəmli olmalıdır.", 400);
    }

    if (!password || password.length < 6) {
      return error(res, "Şifrə ən az 6 simvol olmalıdır.", 400);
    }

    // ── Identifier müəyyən et ──
    let otpQuery;
    let identifierType; // "phone" | "email"
    let identifier;

    if (rawPhone) {
      const phone = normalizeAzPhone(rawPhone.trim());
      if (!phone) return error(res, "Düzgün telefon nömrəsi daxil edin.", 400);
      otpQuery = { phone };
      identifierType = "phone";
      identifier = phone;
    } else if (rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return error(res, "Düzgün email ünvanı daxil edin.", 400);
      otpQuery = { email };
      identifierType = "email";
      identifier = email;
    } else {
      return error(res, "Telefon nömrəsi və ya email tələb olunur.", 400);
    }

    // ── OTP yoxla ──
    const otpRecord = await OTP.findOne(otpQuery);
    if (!otpRecord) return error(res, "OTP kodu tapılmadı. Yenidən göndərin.", 400);

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteMany(otpQuery);
      return error(res, "OTP kodunun vaxtı keçib. Yenidən göndərin.", 400);
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await OTP.deleteMany(otpQuery);
      return error(res, "Çox sayda yanlış cəhd. Yenidən kod göndərin.", 400);
    }

    if (otpRecord.code !== code) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const remaining = OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return error(res, `Yanlış kod. ${remaining} cəhdiniz qalıb.`, 400);
    }

    await OTP.deleteMany(otpQuery);

    // ── İstifadəçini tap və ya yarat ──
    const userQuery = identifierType === "phone" ? { phone: identifier } : { email: identifier };
    let user = await User.findOne(userQuery).select("+password");

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      // Yeni qeydiyyat
      user = await User.create({
        ...(identifierType === "phone" ? { phone: identifier } : { email: identifier }),
        password: hashedPassword,
        isVerified: true,
      });
    } else {
      // Mövcud istifadəçi — şifrəni yenilə (OTP ilə doğrulandığı üçün icazə var)
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
    }

    if (user.isBlocked) return error(res, "Hesabınız bloklanıb. Dəstəklə əlaqə saxlayın.", 403);

    const token = makeToken(user);

    return success(
      res,
      { token, needsName: !user.name, user: userPayload(user) },
      user.name ? "Uğurla daxil oldunuz." : "Qeydiyyat tamamlandı. Adınızı daxil edin.",
    );
  } catch (err) {
    console.error("verifyOTP xətası:", err);
    return error(res, "Doğrulama zamanı xəta baş verdi.", 500);
  }
};

// ─── Şifrə ilə sürətli giriş (token mövcuddursa avtomatik) ──────────────────
//
// Body: { phone OR email, password }
// ─────────────────────────────────────────────────────────────────────────────
const loginWithPassword = async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail, password } = req.body;

    if (!password) return error(res, "Şifrə tələb olunur.", 400);

    let userQuery;
    if (rawPhone) {
      const phone = normalizeAzPhone(rawPhone.trim());
      if (!phone) return error(res, "Düzgün telefon nömrəsi daxil edin.", 400);
      userQuery = { phone };
    } else if (rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return error(res, "Düzgün email ünvanı daxil edin.", 400);
      userQuery = { email };
    } else {
      return error(res, "Telefon nömrəsi və ya email tələb olunur.", 400);
    }

    const user = await User.findOne(userQuery).select("+password");
    if (!user) return error(res, "İstifadəçi tapılmadı. Qeydiyyatdan keçin.", 404);
    if (!user.password) return error(res, "Bu hesab üçün şifrə təyin edilməyib. OTP ilə daxil olun.", 401);
    if (user.isBlocked) return error(res, "Hesabınız bloklanıb.", 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, "Şifrə yanlışdır.", 401);

    const token = makeToken(user);

    return success(
      res,
      { token, needsName: !user.name, user: userPayload(user) },
      "Uğurla daxil oldunuz.",
    );
  } catch (err) {
    console.error("loginWithPassword xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

// ─── Şifrəni unutdum ─────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail } = req.body;

    let userQuery, otpQuery, sendFn;

    if (rawPhone) {
      const phone = normalizeAzPhone(rawPhone.trim());
      if (!phone) return error(res, "Düzgün telefon nömrəsi daxil edin.", 400);
      userQuery = { phone };
      otpQuery = { phone };
      sendFn = async (code) => sendSMS(phone, code);
    } else if (rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return error(res, "Düzgün email ünvanı daxil edin.", 400);
      userQuery = { email };
      otpQuery = { email };
      sendFn = async (code) => sendEmail(email, code, "en");
    } else {
      return error(res, "Telefon nömrəsi və ya email tələb olunur.", 400);
    }

    const user = await User.findOne(userQuery);
    if (user && !user.isBlocked) {
      await OTP.deleteMany(otpQuery);
      const code = generateOTP();
      await OTP.create({ ...otpQuery, code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) });
      await sendFn(code);
    }

    return success(res, {}, "Əgər bu ünvan qeydiyyatdadırsa, doğrulama kodu göndəriləcək.");
  } catch (err) {
    console.error("forgotPassword xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

// ─── Şifrəni sıfırla ─────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail, code, newPassword } = req.body;

    if (!code || !/^\d{4}$/.test(code)) return error(res, "OTP kodu 4 rəqəmli olmalıdır.", 400);
    if (!newPassword || newPassword.length < 6) return error(res, "Şifrə ən az 6 simvol olmalıdır.", 400);

    let otpQuery, userQuery;

    if (rawPhone) {
      const phone = normalizeAzPhone(rawPhone.trim());
      if (!phone) return error(res, "Düzgün telefon nömrəsi daxil edin.", 400);
      otpQuery = { phone };
      userQuery = { phone };
    } else if (rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return error(res, "Düzgün email ünvanı daxil edin.", 400);
      otpQuery = { email };
      userQuery = { email };
    } else {
      return error(res, "Telefon nömrəsi və ya email tələb olunur.", 400);
    }

    const otpRecord = await OTP.findOne(otpQuery);
    if (!otpRecord) return error(res, "OTP kodu tapılmadı. Yenidən göndərin.", 400);
    if (otpRecord.expiresAt < new Date()) { await OTP.deleteMany(otpQuery); return error(res, "OTP kodunun vaxtı keçib.", 400); }
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) { await OTP.deleteMany(otpQuery); return error(res, "Çox sayda yanlış cəhd.", 400); }
    if (otpRecord.code !== code) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return error(res, `Yanlış kod. ${OTP_MAX_ATTEMPTS - otpRecord.attempts - 1} cəhdiniz qalıb.`, 400);
    }

    await OTP.deleteMany(otpQuery);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let user = await User.findOne(userQuery);
    if (!user) {
      user = await User.create({ ...userQuery, password: hashedPassword, isVerified: true });
    } else {
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
    }

    if (user.isBlocked) return error(res, "Hesabınız bloklanıb.", 403);

    const token = makeToken(user);
    return success(res, { token, needsName: !user.name, user: userPayload(user) }, "Şifrə uğurla yeniləndi.");
  } catch (err) {
    console.error("resetPassword xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

// ─── Qonaq giriş ─────────────────────────────────────────────────────────────
const generateGuestPhone = () => {
  const suffix = String(Math.floor(Math.random() * 10000000)).padStart(7, "0");
  return `+99499${suffix}`;
};

const guestLogin = async (req, res) => {
  try {
    const requestedPhone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    const normalizedPhone = requestedPhone ? normalizeAzPhone(requestedPhone) : null;
    const phone = normalizedPhone || generateGuestPhone();

    let user = await User.findOne({ phone });
    if (!user) user = await User.create({ phone, name: "", isVerified: true });
    if (user.isBlocked) return error(res, "Hesabınız bloklanıb.", 403);

    const token = makeToken(user);
    return success(res, { token, user: userPayload(user) }, "Qonaq olaraq daxil oldunuz.");
  } catch (err) {
    return error(res, "Qonaq girişi zamanı xəta baş verdi.", 500);
  }
};

// ─── Profil ──────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) return error(res, "İstifadəçi tapılmadı.", 404);
    return success(res, { user });
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, lastName, password, currentPassword } = req.body;

    if (password) {
      if (!currentPassword) return error(res, "Şifrə dəyişmək üçün cari şifrənizi daxil edin.", 400);
      const user = await User.findById(req.userId).select("+password");
      if (!user) return error(res, "İstifadəçi tapılmadı.", 404);
      if (!user.password) return error(res, "Bu hesab üçün şifrə təyin edilməyib.", 400);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return error(res, "Cari şifrə yanlışdır.", 401);
    }

    if (!name || name.trim().length < 2) return error(res, "Ad ən az 2 simvol olmalıdır.", 400);
    if (lastName && lastName.trim().length < 2) return error(res, "Soyad ən az 2 simvol olmalıdır.", 400);
    if (password && password.length < 6) return error(res, "Şifrə ən az 6 simvol olmalıdır.", 400);

    const updateData = { name: name.trim(), lastName: String(lastName || "").trim() || undefined };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true, select: "-__v -password" });
    const token = makeToken(user);
    return success(res, { token, user }, "Profil yeniləndi.");
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  loginWithPassword,
  forgotPassword,
  resetPassword,
  guestLogin,
  getProfile,
  updateProfile,
};
