const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const adminController = require("../controllers/adminController");
const categoryAdminController = require("../controllers/categoryAdminController");
const deliveryOptionController = require("../controllers/deliveryOptionController");
const charityOptionController = require("../controllers/charityOptionController");
const charityAnimalController = require("../controllers/charityAnimalController");
const charityOrderController  = require("../controllers/charityOrderController");
const appSettingsController = require("../controllers/appSettingsController");
const cashPaymentController = require("../controllers/cashPaymentController");
const deliveryConfirmController = require("../controllers/deliveryConfirmController");
const pricingConfigController = require("../controllers/pricingConfigController");
const adminAuth = require("../middleware/adminAuth");

// ─── Multer konfiqurasiyası (memory — fayllar GridFS-ə göndərilir) ───────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Yalnız şəkil (jpg, png, webp) və video (mp4, mov) faylları qəbul edilir.",
      ),
      false,
    );
  }
};

const memStorage = multer.memoryStorage();

const upload = multer({
  storage: memStorage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const categoryUpload = multer({
  storage: memStorage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const charityOptionUpload = multer({
  storage: memStorage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

// ─── Public: Admin Login + Şifrə sıfırlama ──────────────────────────────
router.post("/login", adminController.adminLogin);
router.post("/forgot-password", adminController.adminForgotPassword);
router.post("/reset-password", adminController.adminResetPassword);

// ─── Qorunan admin route-lar ─────────────────────────────────────────────
router.use(adminAuth);

// GET /api/admin/stats
router.get("/stats", adminController.getStats);

// GET /api/admin/orders
router.get("/orders", adminController.getAllOrders);

// GET /api/admin/shared-orders  (qrupsuz, ödənilmiş)
router.get("/shared-orders", adminController.getSharedOrders);

// GET /api/admin/shared-groups
router.get("/shared-groups", adminController.getSharedGroups);
// POST /api/admin/shared-groups
router.post("/shared-groups", adminController.createSharedGroup);
// POST /api/admin/shared-groups/:groupId/orders
router.post("/shared-groups/:groupId/orders", adminController.addOrderToGroup);
// DELETE /api/admin/shared-groups/:groupId/orders/:orderId
router.delete("/shared-groups/:groupId/orders/:orderId", adminController.removeOrderFromGroup);
// POST /api/admin/shared-groups/:groupId/confirm
router.post("/shared-groups/:groupId/confirm", adminController.confirmSharedGroup);
// DELETE /api/admin/shared-groups/:groupId
router.delete("/shared-groups/:groupId", adminController.deleteSharedGroup);

// GET /api/admin/orders/:orderId
router.get("/orders/:orderId", adminController.getOrderById);

// PUT /api/admin/orders/:orderId/status
router.put("/orders/:orderId/status", adminController.updateOrderStatus);

// POST /api/admin/orders/:orderId/media
router.post(
  "/orders/:orderId/media",
  upload.array("files", 10),
  adminController.uploadMedia,
);

// DELETE /api/admin/orders/:orderId/media/:filename
router.delete("/orders/:orderId/media/:filename", adminController.deleteMedia);

// GET /api/admin/categories
router.get("/categories", categoryAdminController.listCategories);

// POST /api/admin/categories
router.post(
  "/categories",
  categoryUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  categoryAdminController.createCategory,
);

// PUT /api/admin/categories/:categoryId
router.put(
  "/categories/:categoryId",
  categoryUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  categoryAdminController.updateCategory,
);

// DELETE /api/admin/categories/:categoryId
router.delete(
  "/categories/:categoryId",
  categoryAdminController.deleteCategory,
);

// ─── Pricing Config ───────────────────────────────────────────────────────
router.get("/pricing",                    pricingConfigController.list);
router.get("/pricing/:categoryId",        pricingConfigController.getByCategory);
router.put("/pricing/:categoryId",        pricingConfigController.upsert);

// ─── App Settings ─────────────────────────────────────────────────────────
// GET /api/admin/settings
router.get("/settings", appSettingsController.getSettings);
// PUT /api/admin/settings
router.put("/settings", appSettingsController.updateSettings);
// GET /api/admin/storage-stats
router.get("/storage-stats", appSettingsController.getStorageStats);

// ─── Delivery Options ──────────────────────────────────────────────────────
// GET /api/admin/delivery-options
router.get("/delivery-options", deliveryOptionController.listDeliveryOptions);

// POST /api/admin/delivery-options
router.post("/delivery-options", deliveryOptionController.createDeliveryOption);

// PUT /api/admin/delivery-options/:optionId
router.put(
  "/delivery-options/:optionId",
  deliveryOptionController.updateDeliveryOption,
);

// POST /api/admin/delivery-options/:optionId/category-price
router.post(
  "/delivery-options/:optionId/category-price",
  deliveryOptionController.setCategorySpecificPrice,
);

// DELETE /api/admin/delivery-options/:optionId/category-price/:categoryId
router.delete(
  "/delivery-options/:optionId/category-price/:categoryId",
  deliveryOptionController.removeCategorySpecificPrice,
);

// ─── Charity Options ───────────────────────────────────────────────────────
// GET /api/admin/charity-options
router.get("/charity-options", charityOptionController.listCharityOptions);

// POST /api/admin/charity-options
router.post(
  "/charity-options",
  charityOptionUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  charityOptionController.createCharityOption,
);

// PUT /api/admin/charity-options/:charityId
router.put(
  "/charity-options/:charityId",
  charityOptionUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  charityOptionController.updateCharityOption,
);

// DELETE /api/admin/charity-options/:charityId
router.delete(
  "/charity-options/:charityId",
  charityOptionController.deleteCharityOption,
);

// ─── Cash Payments ────────────────────────────────────────────────────────────
// GET /api/admin/cash-payments/lookup?code=CODE
router.get("/cash-payments/lookup", cashPaymentController.lookupCashOrder);
// POST /api/admin/cash-payments/confirm
router.post("/cash-payments/confirm", cashPaymentController.confirmCashPayment);

// ─── Delivery Confirmation ───────────────────────────────────────────────────
// GET /api/admin/delivery-confirm/lookup?code=CODE
router.get("/delivery-confirm/lookup", deliveryConfirmController.lookupDeliveryOrder);
// POST /api/admin/delivery-confirm/confirm
router.post("/delivery-confirm/confirm", deliveryConfirmController.confirmDelivery);

// ─── Charity Animals ───────────────────────────────────────────────────────────
// GET /api/admin/charity-animals
router.get("/charity-animals", charityAnimalController.listCharityAnimals);

// POST /api/admin/charity-animals
router.post("/charity-animals", charityAnimalController.createCharityAnimal);

// PUT /api/admin/charity-animals/:animalId
router.put("/charity-animals/:animalId", charityAnimalController.updateCharityAnimal);

// DELETE /api/admin/charity-animals/:animalId
router.delete("/charity-animals/:animalId", charityAnimalController.deleteCharityAnimal);

// ─── Charity Orders ────────────────────────────────────────────────────────────
router.get("/charity-orders",                              charityOrderController.listAdminCharityOrders);
router.get("/charity-orders/:orderId",                     charityOrderController.getAdminCharityOrderById);
router.put("/charity-orders/:orderId/status",              charityOrderController.updateCharityOrderStatus);
router.post("/charity-orders/:orderId/media",              upload.array("files", 10), charityOrderController.addCharityOrderMedia);
router.delete("/charity-orders/:orderId/media/:mediaIndex", charityOrderController.deleteCharityOrderMedia);

module.exports = router;
