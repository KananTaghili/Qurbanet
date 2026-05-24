const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const epointController = require("../controllers/epointController");
const authenticate = require("../middleware/auth");

// ─── Sifariş Əməliyyatları ───────────────────────────────────
// GET /api/orders/animals - Heyvanların siyahısı
router.get("/animals", orderController.getAnimals);

// GET /api/orders/my - Öz sifarişlərim
router.get("/my", authenticate, orderController.getMyOrders);

// GET /api/orders/knowledge - Məlumatlandırıcı bölmə
router.get("/knowledge", orderController.getKnowledgeContent);

// GET /api/orders/:orderId - Sifariş detayı
router.get("/:orderId", authenticate, orderController.getOrderById);

// ─── Sifariş Yaradılması ────────────────────────────────────
// POST /api/orders - Sifariş yarat
router.post("/", authenticate, orderController.createOrder);

// POST /api/orders/quantity - Miqdar ilə doğrama üsulu seçin
router.post("/quantity", orderController.validateQuantityWithGrindingMethod);

// ─── Ödəniş və Rəy ──────────────────────────────────────────
// POST /api/orders/:orderId/pay - Nağd ödəniş seçimi
router.post("/:orderId/pay", authenticate, orderController.processPayment);

// POST /api/orders/:orderId/epoint/start - EPoint ödənişi başlat
router.post("/:orderId/epoint/start", authenticate, epointController.startPayment);

// POST /api/orders/:orderId/epoint/verify - EPoint-dən birbaşa status yoxla
router.post("/:orderId/epoint/verify", authenticate, epointController.verifyPayment);

// POST /api/orders/:orderId/review - Rəy yaz
router.post(
  "/:orderId/review",
  authenticate,
  orderController.submitOrderReview,
);

module.exports = router;
