const express = require("express");
const router = express.Router();
const charityOrderController = require("../controllers/charityOrderController");
const authenticate = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// All routes require authentication
router.use(authenticate);

// POST /api/charity-orders - Create new charity order
router.post("/", charityOrderController.createCharityOrder);

// GET /api/charity-orders - Get user's charity orders (must come before :orderId)
router.get("/", charityOrderController.getCharityOrders);

// GET /api/charity-orders/:orderId - Get charity order details
router.get("/:orderId", charityOrderController.getCharityOrderById);

// Admin routes
// PUT /api/charity-orders/:orderId/status - Update order status
router.put(
  "/:orderId/status",
  adminAuth,
  charityOrderController.updateCharityOrderStatus,
);

// POST /api/charity-orders/:orderId/video - Upload video
router.post(
  "/:orderId/video",
  adminAuth,
  charityOrderController.uploadCharityOrderVideo,
);

module.exports = router;
