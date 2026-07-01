const express = require("express");
const router = express.Router();
const {
  handleResult,
  handleSuccessCallback,
  handleErrorCallback,
} = require("../controllers/epointController");

// ─── Server-to-server callback ────────────────────────────────────────────
// POST /api/epoint/result          — merchant panel-də result_url olaraq qeyd et
// POST /api/epoint/callback/result — alternativ yol (köhnə konfiqurasiya üçün)
router.post("/result", handleResult);
router.post("/callback/result", handleResult);

// ─── Browser redirect callback-ləri ───────────────────────────────────────
// Epoint ödənişdən sonra istifadəçini bu ünvanlara yönləndirir (data + signature ilə)
router.get("/callback/success", handleSuccessCallback);
router.get("/callback/error", handleErrorCallback);

module.exports = router;
