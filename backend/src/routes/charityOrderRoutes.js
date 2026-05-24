const express = require("express");
const router = express.Router();
const charityOrderController = require("../controllers/charityOrderController");
const epointController = require("../controllers/epointController");
const authenticate = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// POST /api/charity-orders - Create new charity order
router.post("/", charityOrderController.createCharityOrder);

// GET /api/charity-orders - Get user's charity orders (must come before :orderId)
router.get("/", charityOrderController.getCharityOrders);

// GET /api/charity-orders/:orderId - Get charity order details
router.get("/:orderId", charityOrderController.getCharityOrderById);

// POST /api/charity-orders/:orderId/epoint/start
router.post("/:orderId/epoint/start", epointController.startCharityPayment);

// POST /api/charity-orders/:orderId/epoint/verify
router.post("/:orderId/epoint/verify", epointController.verifyCharityPayment);

module.exports = router;
