const express = require("express");
const router = express.Router();
const appConfigController = require("../controllers/appConfigController");

// ─── Public API Endpoints (No Authentication Required) ──────────────────────

// GET /api/app-config
// Fetch all configuration data needed by mobile app
router.get("/", appConfigController.getAppConfig);

// GET /api/app-config/categories
// Fetch only categories
router.get("/categories", appConfigController.getCategories);

// GET /api/app-config/delivery-options
// Fetch only delivery options
router.get("/delivery-options", appConfigController.getDeliveryOptions);

// GET /api/app-config/charity-options
// Fetch only charity options
router.get("/charity-options", appConfigController.getCharityOptions);

module.exports = router;
