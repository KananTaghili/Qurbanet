const express = require("express");
const rateLimit = require("express-rate-limit");
const router  = express.Router();
const ctrl    = require("../controllers/charityCampaignController");
const { authenticate, optionalAuth } = require("../middleware/auth");

// Qeydiyyatsız (guest) yaza bilən və/və ya Epoint (xarici) çağıran route-lar üçün sərt limit
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 15,                  // IP başına 15 yazma əməliyyatı
  message: { success: false, message: "Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.get("/settings",   ctrl.getCampaignSettings);
router.get("/completed",  ctrl.getCompletedCampaigns);
router.get("/my",         authenticate, ctrl.getUserCampaigns);
router.get("/:id",        optionalAuth, ctrl.getCampaignById);
router.get("/",           ctrl.getCampaigns);

// Qeydiyyat olmadan da icazə var (optionalAuth userId-ni set edir, amma tələb etmir)
// writeLimiter — spam/abuse və Epoint sui-istifadəsinin qarşısını alır
router.post("/",                  writeLimiter, optionalAuth, ctrl.createCampaign);
router.post("/:id/donate",        writeLimiter, optionalAuth, ctrl.addDonation);
router.post("/:id/epoint/start",  writeLimiter, optionalAuth, ctrl.startCampaignPayment);

module.exports = router;
