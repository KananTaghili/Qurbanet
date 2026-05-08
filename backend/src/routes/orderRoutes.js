const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticate = require("../middleware/auth");

// Bütün order route-ları qorunur
router.use(authenticate);

// GET /api/orders/animals - Heyvanların siyahısı
router.get("/animals", orderController.getAnimals);

// GET /api/orders/my - Öz sifarişlərim
router.get("/my", orderController.getMyOrders);

// GET /api/orders/knowledge - Məlumatlandırıcı bölmə
router.get("/knowledge", orderController.getKnowledgeContent);

// GET /api/orders/:orderId - Sifariş detayı
router.get("/:orderId", orderController.getOrderById);

// POST /api/orders - Sifariş yarat
router.post("/", orderController.createOrder);

// POST /api/orders/:orderId/pay - Ödəniş et (mock)
router.post("/:orderId/pay", orderController.processPayment);

// POST /api/orders/:orderId/review - Rəy yaz
router.post("/:orderId/review", orderController.submitOrderReview);

module.exports = router;
