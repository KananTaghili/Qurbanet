const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Order = require("../models/Order");
const Category = require("../models/Category");
const User = require("../models/User");
const {
  ANIMALS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
} = require("../config/constants");
const { success, error } = require("../utils/response");

const AUTO_CONFIRM_MESSAGE =
  "1 saat ərzində admin təsdiqləmədiyi üçün sistem avtomatik təsdiqlədi.";

const normalizeType = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

const getAnimalEmoji = (animalType, emoji) => {
  const normalizedType = normalizeType(animalType);
  if (normalizedType === "quzu") return "🐑";
  if (normalizedType === "qoc") return "🐏";
  if (normalizedType === "keci") return "🐐";
  return emoji || ANIMALS[normalizedType]?.emoji || "🐑";
};

const maybeAutoConfirm = async (order) => {
  if (
    order.status === ORDER_STATUS.PLACED &&
    order.autoConfirmAt &&
    order.autoConfirmAt <= new Date()
  ) {
    order.status = ORDER_STATUS.CONFIRMED;
    order.confirmedAt = new Date();
    order.statusHistory.push({
      status: ORDER_STATUS.CONFIRMED,
      note: AUTO_CONFIRM_MESSAGE,
    });
    await order.save();
  }
};

// ─── Admin Login ─────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return error(res, "Yanlış istifadəçi adı və ya şifrə.", 401);
    }

    const token = jwt.sign(
      { role: "admin", username },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "12h" },
    );

    return success(res, { token }, "Admin girişi uğurlu.");
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ─── Bütün sifarişlər ────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, orderMode } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (orderMode) filter.orderMode = orderMode;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "phone name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      Order.countDocuments(filter),
    ]);

    await Promise.all(orders.map((order) => maybeAutoConfirm(order)));

    return success(res, {
      orders: orders.map(formatAdminOrder),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getAllOrders xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const getSharedOrders = async (req, res) => {
  try {
    const { animalType } = req.query;
    const filter = {
      orderMode: "serikli",
      "payment.status": "paid",
    };

    if (animalType) {
      filter.animalType = animalType.toString().trim().toLowerCase();
    }

    const orders = await Order.find(filter)
      .populate("user", "phone name")
      .sort({ sharedPortion: 1, createdAt: 1 })
      .select("-__v");

    await Promise.all(orders.map((order) => maybeAutoConfirm(order)));

    const animalTypes = await Order.distinct("animalType", {
      orderMode: "serikli",
      "payment.status": "paid",
    });

    return success(res, {
      orders: orders.map(formatAdminOrder),
      animalTypes,
    });
  } catch (err) {
    console.error("getSharedOrders xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

// ─── Sifariş detayı ──────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "phone name createdAt")
      .select("-__v");

    if (!order) return error(res, "Sifariş tapılmadı.", 404);

    await maybeAutoConfirm(order);

    return success(res, { order: formatAdminOrder(order) });
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ─── Sifariş statusunu yenilə ────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const {
      status,
      adminNote,
      processNote,
      processStage,
      deliveryCode,
      deliveryVideoUrl,
      verifiedBy,
    } = req.body;
    const validStatuses = Object.values(ORDER_STATUS);

    if (!validStatuses.includes(status)) {
      return error(res, "Yanlış status dəyəri.", 400);
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return error(res, "Sifariş tapılmadı.", 404);

    const oldStatus = order.status;

    order.status = status;
    if (adminNote !== undefined) order.adminNote = adminNote;

    if (status === ORDER_STATUS.CONFIRMED && !order.confirmedAt) {
      order.confirmedAt = new Date();
    }

    if (oldStatus !== status) {
      order.statusHistory.push({
        status,
        note: processNote || adminNote || "Status yeniləndi",
      });
    }

    if (processStage) {
      order.processNotes.push({
        stage: processStage,
        note: String(processNote || "").trim(),
        videoUrl: String(deliveryVideoUrl || "").trim() || undefined,
      });
    }

    if (deliveryVideoUrl) {
      order.deliveryProof.handoverVideoUrl = deliveryVideoUrl;
    }

    const isSelfDelivery = ["catdirilsin", "mekan"].includes(
      order.distribution?.type,
    );
    if (isSelfDelivery && status === ORDER_STATUS.COMPLETED) {
      if (!deliveryCode || String(deliveryCode).trim().length < 4) {
        return error(
          res,
          "Şəxsə təhvil üçün minimum 4 simvolluq kod təsdiqi tələb olunur.",
          400,
        );
      }
      order.deliveryProof.handoverCode = String(deliveryCode).trim();
      order.deliveryProof.handoverCodeVerifiedAt = new Date();
      order.deliveryProof.handoverCodeVerifiedBy = String(
        verifiedBy || "Courier",
      ).trim();
    }

    if (
      ["usaqlar_evi", "qocalar_evi"].includes(order.distribution?.type) &&
      status === ORDER_STATUS.COMPLETED &&
      !order.deliveryProof?.handoverVideoUrl
    ) {
      return error(
        res,
        "Uşaqlar evi və qocalar evi təhvili üçün video linki əlavə olunmalıdır.",
        400,
      );
    }

    await order.save();

    return success(
      res,
      { order: formatAdminOrder(order) },
      "Sifariş yeniləndi.",
    );
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ─── Media yüklə ─────────────────────────────────────────────────────────────
const uploadMedia = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      // Yüklənmiş faylları sil
      if (req.files) req.files.forEach((f) => fs.unlink(f.path, () => {}));
      return error(res, "Sifariş tapılmadı.", 404);
    }

    if (!req.files || req.files.length === 0) {
      return error(res, "Fayl seçilməyib.", 400);
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const newMedia = req.files.map((file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
      const mediaType = videoExts.includes(ext) ? "video" : "photo";

      return {
        type: mediaType,
        filename: file.filename,
        url: `${baseUrl}/uploads/orders/${order._id}/${file.filename}`,
      };
    });

    order.media.push(...newMedia);
    await order.save();

    return success(
      res,
      { media: order.media },
      `${req.files.length} media faylı yükləndi.`,
    );
  } catch (err) {
    console.error("uploadMedia xətası:", err);
    return error(res, "Media yüklənərkən xəta baş verdi.", 500);
  }
};

// ─── Media sil ───────────────────────────────────────────────────────────────
const deleteMedia = async (req, res) => {
  try {
    const { orderId, filename } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return error(res, "Sifariş tapılmadı.", 404);

    const mediaItem = order.media.find((m) => m.filename === filename);
    if (!mediaItem) return error(res, "Media tapılmadı.", 404);

    // Faylı disk-dən sil
    const filePath = path.join(
      __dirname,
      "../../uploads/orders",
      orderId,
      filename,
    );
    fs.unlink(filePath, () => {}); // Xəta olsa da davam et

    order.media = order.media.filter((m) => m.filename !== filename);
    await order.save();

    return success(res, {}, "Media silindi.");
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ─── Statistika ──────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalOrders, totalUsers, statusStats, animalStatsRaw, categories] =
      await Promise.all([
        Order.countDocuments(),
        User.countDocuments(),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Order.aggregate([
          {
            $group: {
              _id: "$animalType",
              count: { $sum: 1 },
              revenue: { $sum: "$totalPrice" },
            },
          },
        ]),
        Category.find({}).select("type nameAz imageUrl"),
      ]);

    const totalRevenue = await Order.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const categoryMap = categories.reduce((acc, item) => {
      acc[item.type] = {
        nameAz: item.nameAz,
        imageUrl: item.imageUrl,
      };
      return acc;
    }, {});

    const animalStats = animalStatsRaw.map((item) => ({
      ...item,
      nameAz:
        categoryMap[item._id]?.nameAz || ANIMALS[item._id]?.nameAz || item._id,
      imageUrl: categoryMap[item._id]?.imageUrl || "",
    }));

    return success(res, {
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusStats: statusStats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      animalStats,
    });
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ─── Yardımçı ────────────────────────────────────────────────────────────────
const formatAdminOrder = (order) => {
  const animalInfo = ANIMALS[order.animalType] || {};
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    user: order.user,
    animalType: order.animalType,
    animalNameAz: order.animalNameAz || animalInfo.nameAz || order.animalType,
    animalEmoji: getAnimalEmoji(
      order.animalType,
      order.animalEmoji || animalInfo.emoji,
    ),
    animalImageUrl: order.animalImageUrl,
    quantity: order.quantity,
    orderMode: order.orderMode || "tek",
    sharedPortion: order.sharedPortion,
    pricePerUnit: order.pricePerUnit,
    totalPrice: order.totalPrice,
    distribution: order.distribution,
    payment: order.payment,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
    statusHistory: order.statusHistory,
    media: order.media,
    processNotes: order.processNotes,
    deliveryProof: order.deliveryProof,
    adminNote: order.adminNote,
    estimatedDate: order.estimatedDate,
    slaughterDate: order.slaughterDate,
    deliveryDate: order.deliveryDate,
    deliveryWindow: order.deliveryWindow,
    slaughterTimingHours: order.slaughterTimingHours,
    contactInfo: order.contactInfo,
    orphanDelight: order.orphanDelight,
    review: order.review,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

module.exports = {
  adminLogin,
  getAllOrders,
  getSharedOrders,
  getOrderById,
  updateOrderStatus,
  uploadMedia,
  deleteMedia,
  getStats,
};
