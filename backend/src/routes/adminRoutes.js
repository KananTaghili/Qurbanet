const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
const adminController = require("../controllers/adminController");
const categoryAdminController = require("../controllers/categoryAdminController");
const deliveryOptionController = require("../controllers/deliveryOptionController");
const charityOptionController = require("../controllers/charityOptionController");
const adminAuth = require("../middleware/adminAuth");

// ─── Multer konfiqurasiyası ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(
      __dirname,
      "../../uploads/orders",
      req.params.orderId,
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/categories");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const categoryUpload = multer({
  storage: categoryStorage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const charityOptionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/charity-options");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const charityOptionUpload = multer({
  storage: charityOptionStorage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

// ─── Public: Admin Login ─────────────────────────────────────────────────
router.post("/login", adminController.adminLogin);

// ─── Qorunan admin route-lar ─────────────────────────────────────────────
router.use(adminAuth);

// GET /api/admin/stats
router.get("/stats", adminController.getStats);

// GET /api/admin/orders
router.get("/orders", adminController.getAllOrders);

// GET /api/admin/shared-orders
router.get("/shared-orders", adminController.getSharedOrders);

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

module.exports = router;
