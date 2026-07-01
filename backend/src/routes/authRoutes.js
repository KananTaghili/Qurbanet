const express = require("express");
const { body, oneOf } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/auth");

const otpCodeValidation = body("code")
  .trim()
  .notEmpty().withMessage("OTP kodu tələb olunur.")
  .isLength({ min: 4, max: 4 }).withMessage("OTP kodu 4 rəqəmli olmalıdır.")
  .isNumeric().withMessage("OTP kodu yalnız rəqəmlərdən ibarət olmalıdır.");

// POST /api/auth/send-otp — phone (AZ) və ya email
router.post("/send-otp", authController.sendOTP);

// POST /api/auth/verify-otp — phone və ya email + code + password
router.post("/verify-otp", [otpCodeValidation], authController.verifyOTP);

// POST /api/auth/login-password — mövcud istifadəçi üçün sürətli giriş
router.post("/login-password", [
  body("password").notEmpty().withMessage("Şifrə tələb olunur."),
], authController.loginWithPassword);

// POST /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword);

// POST /api/auth/verify-forgot-otp — OTP-ni yoxla (şifrəni dəyişmədən)
router.post("/verify-forgot-otp", [otpCodeValidation], authController.verifyForgotOtp);

// POST /api/auth/reset-password
router.post("/reset-password", [
  otpCodeValidation,
  body("newPassword").notEmpty().withMessage("Yeni şifrə tələb olunur.")
    .isLength({ min: 6 }).withMessage("Şifrə ən az 6 simvol olmalıdır."),
], authController.resetPassword);

// POST /api/auth/guest
router.post("/guest", authController.guestLogin);

// GET /api/auth/profile
router.get("/profile", authenticate, authController.getProfile);

// PUT /api/auth/profile
router.put("/profile", authenticate, authController.updateProfile);

module.exports = router;
