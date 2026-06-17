const CharityOrder = require("../models/CharityOrder");
const { success, error } = require("../utils/response");

const VALID_STATUSES = ["placed", "confirmed", "slaughtering", "preparing", "delivering", "completed", "cancelled"];

// POST /api/charity-orders
exports.createCharityOrder = async (req, res) => {
  try {
    const { label, charityType, modeKey, summaryRows, totalAmount, paymentMethod,
      charityAnimalId, animalName, animalEmoji, animalType,
      selectedPriceKey, selectedPriceLabel, charityOrgId, charityOrgName } = req.body;

    if (!label || !summaryRows || !totalAmount)
      return error(res, "Zəruuri sahələr çatışmır", 400);

    const charityOrder = new CharityOrder({
      user: req.userId, label,
      charityType: charityType || "",
      summaryRows, totalAmount,
      paymentMethod: paymentMethod || "epoint",
      charityAnimalId: charityAnimalId || undefined,
      animalName: animalName || "", animalEmoji: animalEmoji || "🐑",
      animalType: animalType || "",
      selectedPriceKey: selectedPriceKey || "", selectedPriceLabel: selectedPriceLabel || "",
      charityOrgId: charityOrgId || undefined, charityOrgName: charityOrgName || "",
      status: "placed",
      statusHistory: [{ status: "placed", changedAt: new Date(), note: "Xeyriyyə sifarişi yaradıldı" }],
    });

    await charityOrder.save();
    return success(res, { _id: charityOrder._id, orderNumber: charityOrder.orderNumber, status: charityOrder.status }, "Xeyriyyə ödənişi yaradıldı", 201);
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/charity-orders
exports.getCharityOrders = async (req, res) => {
  try {
    const orders = await CharityOrder.find({ user: req.userId }).sort({ createdAt: -1 }).select("-__v");
    return success(res, orders, "Xeyriyyə ödənişləri");
  } catch {
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/charity-orders/:orderId
exports.getCharityOrderById = async (req, res) => {
  try {
    const order = await CharityOrder.findById(req.params.orderId);
    if (!order) return error(res, "Tapılmadı", 404);
    if (order.user.toString() !== req.userId.toString()) return error(res, "İcazə yoxdur", 403);
    return success(res, order);
  } catch {
    return error(res, "Xəta baş verdi", 500);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/charity-orders
exports.listAdminCharityOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, charityType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (charityType) filter.charityType = charityType;

    const total = await CharityOrder.countDocuments(filter);
    const orders = await CharityOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .populate("user", "name phone");

    return success(res, { orders, pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/admin/charity-orders/:orderId
exports.getAdminCharityOrderById = async (req, res) => {
  try {
    const order = await CharityOrder.findById(req.params.orderId).populate("user", "name phone");
    if (!order) return error(res, "Tapılmadı", 404);
    return success(res, order);
  } catch {
    return error(res, "Xəta baş verdi", 500);
  }
};

// PUT /api/admin/charity-orders/:orderId/status
exports.updateCharityOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, adminNote } = req.body;

    if (!status || !VALID_STATUSES.includes(status))
      return error(res, "Düzgün status göndərin", 400);

    const order = await CharityOrder.findById(orderId);
    if (!order) return error(res, "Tapılmadı", 404);

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date(), note: note || "" });
    if (adminNote !== undefined) order.adminNote = adminNote;

    await order.save();
    _emit(order);
    return success(res, order, "Status yeniləndi");
  } catch {
    return error(res, "Xəta baş verdi", 500);
  }
};

// POST /api/admin/charity-orders/:orderId/media
exports.addCharityOrderMedia = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await CharityOrder.findById(orderId);
    if (!order) return error(res, "Tapılmadı", 404);
    if (!req.files || req.files.length === 0) return error(res, "Fayl seçilməyib", 400);

    const path = require("path");
    const { uploadBuffer } = require("../utils/gridfs");
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const stage = ["slaughter", "delivery"].includes(req.body.stage) ? req.body.stage : "slaughter";

    const newMedia = await Promise.all(
      req.files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
        const mediaType = videoExts.includes(ext) ? "video" : "photo";
        const fileId = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
        return {
          type: mediaType,
          stage,
          filename: file.originalname,
          fileId,
          url: `${baseUrl}/api/files/${fileId}`,
          uploadedAt: new Date(),
        };
      })
    );

    order.media.push(...newMedia);
    await order.save();
    _emit(order);
    return success(res, { media: order.media }, `${req.files.length} media faylı yükləndi`);
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// DELETE /api/admin/charity-orders/:orderId/media/:mediaIndex
exports.deleteCharityOrderMedia = async (req, res) => {
  try {
    const { orderId, mediaIndex } = req.params;
    const order = await CharityOrder.findById(orderId);
    if (!order) return error(res, "Tapılmadı", 404);

    const idx = Number(mediaIndex);
    const item = order.media[idx];
    if (!item) return error(res, "Media tapılmadı", 404);

    if (item.fileId) {
      const { deleteFile } = require("../utils/gridfs");
      await deleteFile(item.fileId).catch(() => {});
    }

    order.media.splice(idx, 1);
    await order.save();
    _emit(order);
    return success(res, order, "Media silindi");
  } catch {
    return error(res, "Xəta baş verdi", 500);
  }
};

function _emit(order) {
  try {
    const { getIo } = require("../socket");
    getIo().to(`user:${order.user}`).emit("charity_order:updated", { orderId: order._id.toString() });
  } catch (_) {}
}
