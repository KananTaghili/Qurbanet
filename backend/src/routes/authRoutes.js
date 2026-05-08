const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/auth");

// ─── Validasiya qaydaları ─────────────────────────────────────────────────
const phoneValidation = [
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Telefon nömrəsi tələb olunur.")
    .isLength({ min: 9, max: 16 })
    .withMessage("Telefon nömrəsi uzunluğu yanlışdır."),
];

const otpValidation = [
  body("phone").trim().notEmpty().withMessage("Telefon nömrəsi tələb olunur."),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("OTP kodu tələb olunur.")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP kodu 6 rəqəmli olmalıdır.")
    .isNumeric()
    .withMessage("OTP kodu yalnız rəqəmlərdən ibarət olmalıdır."),
];

// POST /api/auth/send-otp
router.post("/send-otp", phoneValidation, authController.sendOTP);

// POST /api/auth/verify-otp
router.post("/verify-otp", otpValidation, authController.verifyOTP);

// POST /api/auth/guest
router.post("/guest", authController.guestLogin);

// GET /api/auth/profile (qorunan)
router.get("/profile", authenticate, authController.getProfile);

// PUT /api/auth/profile (qorunan)
router.put("/profile", authenticate, authController.updateProfile);

module.exports = router;
