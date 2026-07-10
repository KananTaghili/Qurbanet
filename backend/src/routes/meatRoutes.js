const express = require("express");
const router = express.Router();
const meatController = require("../controllers/meatController");
const meatOrderController = require("../controllers/meatOrderController");
const epointController = require("../controllers/epointController");
const authenticate = require("../middleware/auth");

// GET /api/meat/animals — Ət Satışı üçün aktiv heyvanlar + hissələr + kəsimlər
router.get("/animals", meatController.getAnimals);

// GET /api/meat/orders/my — Öz Ət Satışı sifarişlərim
router.get("/orders/my", authenticate, meatOrderController.getMyMeatOrders);

// GET /api/meat/orders/:orderId — Sifariş detayı
router.get("/orders/:orderId", authenticate, meatOrderController.getMeatOrderById);

// POST /api/meat/orders — Sifariş yarat (səbət + çatdırılma ünvanı)
router.post("/orders", authenticate, meatOrderController.createMeatOrder);

// POST /api/meat/orders/:orderId/epoint/start — EPoint ödənişi başlat
router.post("/orders/:orderId/epoint/start", authenticate, epointController.startMeatOrderPayment);

module.exports = router;
