const CharityOrder = require("../models/CharityOrder");
const { success, error } = require("../utils/response");

// POST /api/charity-orders - Create new charity order
exports.createCharityOrder = async (req, res) => {
  try {
    const { label, charityType, summaryRows, totalAmount, paymentMethod } =
      req.body;

    if (!label || !charityType || !summaryRows || !totalAmount) {
      return error(res, "Zəruuri sahələr çatışmır", 400);
    }

    const charityOrder = new CharityOrder({
      user: req.userId,
      label,
      charityType,
      summaryRows,
      totalAmount,
      paymentMethod: paymentMethod || "bank_card",
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          changedAt: new Date(),
          note: "Xeyriyyə ödənişi yaradıldı",
        },
      ],
    });

    await charityOrder.save();

    return success(
      res,
      {
        _id: charityOrder._id,
        orderNumber: charityOrder.orderNumber,
        status: charityOrder.status,
      },
      "Xeyriyyə ödənişi yaradıldı",
      201,
    );
  } catch (error_) {
    console.error("Xeyriyyə ödənişi yaratma xətası:", error_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/charity-orders - Get user's charity orders
exports.getCharityOrders = async (req, res) => {
  try {
    const orders = await CharityOrder.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    return success(res, orders, "Xeyriyyə ödənişləri");
  } catch (error_) {
    console.error("Xeyriyyə ödənişləri almada xəta:", error_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/charity-orders/:orderId - Get charity order details
exports.getCharityOrderById = async (req, res) => {
  try {
    const order = await CharityOrder.findById(req.params.orderId);

    if (!order) {
      return error(res, "Xeyriyyə ödənişi tapılmadı", 404);
    }

    if (order.user.toString() !== req.userId.toString()) {
      return error(res, "Rüşeysiz girişi", 403);
    }

    return success(res, order, "Xeyriyyə ödənişi");
  } catch (error_) {
    console.error("Xeyriyyə ödənişini almada xəta:", error_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// Admin: Update charity order status
exports.updateCharityOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (
      !status ||
      !["pending", "confirmed", "completed", "cancelled"].includes(status)
    ) {
      return error(res, "Düzgün status göndərin", 400);
    }

    const order = await CharityOrder.findById(orderId);
    if (!order) {
      return error(res, "Xeyriyyə ödənişi tapılmadı", 404);
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note,
    });

    await order.save();

    return success(res, order, "Status yeniləndi");
  } catch (error_) {
    console.error("Status yeniləmə xətası:", error_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// Admin: Upload video to charity order
exports.uploadCharityOrderVideo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { videoUrl, filename } = req.body;

    if (!videoUrl) {
      return error(res, "Video URL göndərin", 400);
    }

    const order = await CharityOrder.findById(orderId);
    if (!order) {
      return error(res, "Xeyriyyə ödənişi tapılmadı", 404);
    }

    order.video = {
      filename: filename || "video.mp4",
      url: videoUrl,
      uploadedAt: new Date(),
      uploadedBy: req.adminUsername, // Store admin username instead of user ID
    };

    await order.save();

    return success(res, order, "Video yükləndi");
  } catch (error_) {
    console.error("Video yükləmə xətası:", error_);
    return error(res, "Xəta baş verdi", 500);
  }
};
