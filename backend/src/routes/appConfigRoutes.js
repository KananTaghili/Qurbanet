/**
 * appConfigRoutes.js
 *
 * Public (Mobil):
 *   GET /api/app-config/charity-options        → aktiv xeyriyyə seçimləri
 *   GET /api/app-config/delivery-options       → aktiv çatdırılma seçimləri
 *
 * Admin (qorunan):
 *   GET  /api/app-config/charity-options/all
 *   POST /api/app-config/charity-options
 *   PUT  /api/app-config/charity-options/:optionId
 *   DEL  /api/app-config/charity-options/:optionId
 *
 *   GET  /api/app-config/delivery-options/all
 *   PUT  /api/app-config/delivery-options/:key
 *   POST /api/app-config/delivery-options/:key/category-price
 *   DEL  /api/app-config/delivery-options/:key/category-price/:categoryId
 */

const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const ctrl = require("../controllers/appConfigController");
const appSettingsController = require("../controllers/appSettingsController");
const charityAnimalController = require("../controllers/charityAnimalController");

// ─── PUBLIC (Mobil tətbiq üçün) ──────────────────────────────────────────────
router.get("/charity-options", ctrl.getCharityOptions);
router.get("/delivery-options", ctrl.getDeliveryOptions);
router.get("/settings", appSettingsController.getPublicSettings);
router.get("/charity-animals/stats", charityAnimalController.getCharityAnimalStats);
router.get("/charity-animals", charityAnimalController.getPublicCharityAnimals);

// ─── ADMIN (qorunan) ─────────────────────────────────────────────────────────
router.use(adminAuth);

// Xeyriyyə seçimləri
router.get("/charity-options/all", ctrl.getAllCharityOptions);
router.post("/charity-options", ctrl.createCharityOption);
router.put("/charity-options/:optionId", ctrl.updateCharityOption);
router.delete("/charity-options/:optionId", ctrl.deleteCharityOption);

// Çatdırılma seçimləri
router.get("/delivery-options/all", ctrl.getAllDeliveryOptions);
router.put("/delivery-options/:key", ctrl.updateDeliveryOption);
router.post("/delivery-options/:key/category-price", ctrl.setCategoryDeliveryPrice);
router.delete(
  "/delivery-options/:key/category-price/:categoryId",
  ctrl.removeCategoryDeliveryPrice,
);
router.post("/delivery-options/:key/category-minimum", ctrl.setCategoryMinimum);
router.delete(
  "/delivery-options/:key/category-minimum/:categoryId",
  ctrl.removeCategoryMinimum,
);

module.exports = router;
