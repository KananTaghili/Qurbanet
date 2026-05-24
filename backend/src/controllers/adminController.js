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
const { getDirSizeBytes, enforceStorageQuota, UPLOADS_DIR } = require("../utils/storage");
const AppSettings = require("../models/AppSettings");
const SharedGroup = require("../models/SharedGroup");
const OTP = require("../models/OTP");
const { generateOTP, sendSMS } = require("../utils/sms");

const AUTO_CONFIRM_MESSAGE =
  "1 saat ərzində admin təsdiqləmədiyi üçün sistem avtomatik təsdiqlədi.";

const DELIVERY_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateUniqueDeliveryCode = async () => {
  let code;
  let exists;
  do {
    code = Array.from({ length: 6 }, () =>
      DELIVERY_CODE_CHARS[Math.floor(Math.random() * DELIVERY_CODE_CHARS.length)],
    ).join("");
    exists = await Order.findOne({ deliveryConfirmCode: code });
  } while (exists);
  return code;
};

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

    if (username !== process.env.ADMIN_USERNAME) {
      return error(res, "Yanlış istifadəçi adı və ya şifrə.", 401);
    }

    // DB-də saxlanmış hash varsa onu yoxla, yoxdursa .env şifrəsinə bax
    const settings = await AppSettings.findOne({ singleton: "global" }).select("+adminPasswordHash");
    let passwordValid = false;
    if (settings?.adminPasswordHash) {
      passwordValid = await bcrypt.compare(password, settings.adminPasswordHash);
    } else {
      passwordValid = password === process.env.ADMIN_PASSWORD;
    }

    if (!passwordValid) {
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

// ─── Admin Şifrəni Unutdum — OTP göndər ─────────────────────────────────────
const adminForgotPassword = async (req, res) => {
  try {
    const { username } = req.body;
    const adminPhone = process.env.ADMIN_PHONE;

    if (!adminPhone) {
      return error(res, "ADMIN_PHONE mühit dəyişəni konfiqurasiya edilməyib.", 500);
    }

    if (username !== process.env.ADMIN_USERNAME) {
      return success(res, {}, "Əgər məlumatlar düzgündürsə, telefona kod göndəriləcək.");
    }

    await OTP.deleteMany({ phone: adminPhone });
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.create({ phone: adminPhone, code, expiresAt });
    await sendSMS(adminPhone, code);

    const masked = adminPhone.slice(0, -4).replace(/\d/g, "*") + adminPhone.slice(-4);
    return success(res, { maskedPhone: masked }, "OTP kodu telefonunuza göndərildi.");
  } catch (err) {
    console.error("adminForgotPassword xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

// ─── Admin Şifrəni Sıfırla — OTP yoxla + yeni şifrə ────────────────────────
const adminResetPassword = async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    const adminPhone = process.env.ADMIN_PHONE;

    if (!adminPhone) {
      return error(res, "ADMIN_PHONE mühit dəyişəni konfiqurasiya edilməyib.", 500);
    }
    if (!code || !newPassword) {
      return error(res, "OTP kodu və yeni şifrə tələb olunur.", 400);
    }
    if (newPassword.length < 6) {
      return error(res, "Şifrə ən az 6 simvol olmalıdır.", 400);
    }
    if (!/^\d{6}$/.test(code)) {
      return error(res, "OTP kodu 6 rəqəmli olmalıdır.", 400);
    }

    const otpRecord = await OTP.findOne({ phone: adminPhone });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      await OTP.deleteMany({ phone: adminPhone });
      return error(res, "OTP kodu etibarsızdır. Yenidən göndərin.", 400);
    }
    if (otpRecord.code !== code) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return error(res, "Yanlış OTP kodu.", 400);
    }

    await OTP.deleteMany({ phone: adminPhone });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await AppSettings.findOneAndUpdate(
      { singleton: "global" },
      { adminPasswordHash: hashedPassword },
      { upsert: true, new: true },
    );

    return success(res, {}, "Admin şifrəsi uğurla yeniləndi.");
  } catch (err) {
    console.error("adminResetPassword xətası:", err);
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
    const { animalType, paymentStatus, grouped } = req.query;

    const filter = {
      orderMode: "serikli",
      status: { $ne: ORDER_STATUS.CANCELLED },
    };

    if (animalType) {
      filter.animalType = animalType.toString().trim().toLowerCase();
    }
    if (paymentStatus === "paid") {
      filter["payment.status"] = "paid";
    }
    // grouped=false → yalnız qrupsuz sifarişlər (default)
    if (grouped !== "true") {
      filter.sharedGroup = null;
    }

    const orders = await Order.find(filter)
      .populate("user", "phone email name")
      .sort({ animalType: 1, sharedPortion: 1, createdAt: 1 })
      .select("-__v");

    const animalTypes = await Order.distinct("animalType", {
      orderMode: "serikli",
      status: { $ne: ORDER_STATUS.CANCELLED },
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
        at: new Date(),
      });
    }

    if (processStage) {
      order.processNotes.push({
        stage: processStage,
        note: String(processNote || "").trim(),
        videoUrl: String(deliveryVideoUrl || "").trim() || undefined,
      });
    }

    // Çatdırılır statusuna keçəndə catdirilsin sifarişi üçün unikal kod yarat
    if (
      status === ORDER_STATUS.DELIVERING &&
      order.distribution?.type === "catdirilsin" &&
      !order.deliveryConfirmCode
    ) {
      order.deliveryConfirmCode = await generateUniqueDeliveryCode();
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

    try {
      const { getIo } = require("../socket");
      getIo().to(`user:${order.user}`).emit("order:updated", { orderId: order._id.toString() });
    } catch (_) {}

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
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    if (!req.files || req.files.length === 0) return error(res, "Fayl seçilməyib.", 400);

    const { uploadBuffer: gfsUpload } = require("../utils/gridfs");
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const stage = ["slaughter", "delivery"].includes(req.body.stage) ? req.body.stage : "general";

    const newMedia = await Promise.all(
      req.files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
        const mediaType = videoExts.includes(ext) ? "video" : "photo";
        const fileId = await gfsUpload(file.buffer, file.originalname, file.mimetype);
        return {
          type: mediaType,
          stage,
          filename: file.originalname,
          fileId,
          url: `${baseUrl}/api/files/${fileId}`,
        };
      })
    );

    order.media.push(...newMedia);
    await order.save();

    try {
      const { getIo } = require("../socket");
      getIo().to(`user:${order.user}`).emit("order:updated", { orderId: order._id.toString() });
    } catch (_) {}

    return success(res, { media: order.media }, `${req.files.length} media faylı yükləndi.`);
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

    if (mediaItem.fileId) {
      const { deleteFile } = require("../utils/gridfs");
      await deleteFile(mediaItem.fileId).catch(() => {});
    }

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
        Category.find({}).select("type nameAz imageUrl imageFileId"),
      ]);

    const totalRevenue = await Order.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const categoryMap = categories.reduce((acc, item) => {
      acc[item.type] = {
        nameAz: item.nameAz,
        imageUrl: item.imageFileId
          ? `${backendUrl}/api/files/${item.imageFileId}`
          : item.imageUrl || "",
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
    cashPickupCode: order.cashPickupCode,
    deliveryConfirmCode: order.deliveryConfirmCode,
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

// ─── Şərikli Qruplar ─────────────────────────────────────────────────────────

const getSharedGroups = async (req, res) => {
  try {
    const { animalType } = req.query;
    const filter = {};
    if (animalType) filter.animalType = animalType.toString().trim().toLowerCase();

    const groups = await SharedGroup.find(filter)
      .populate({
        path: "orders",
        populate: { path: "user", select: "phone name" },
        select: "-__v",
      })
      .sort({ createdAt: -1 });

    return success(res, {
      groups: groups.map((g) => ({
        id: g._id,
        groupNumber: g.groupNumber,
        animalType: g.animalType,
        filledCapacity: g.filledCapacity,
        status: g.status,
        confirmedAt: g.confirmedAt,
        createdAt: g.createdAt,
        orders: g.orders.map(formatAdminOrder),
      })),
    });
  } catch (err) {
    console.error("getSharedGroups xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const createSharedGroup = async (req, res) => {
  try {
    const { orderIds, animalType } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return error(res, "Ən az bir sifariş seçilməlidir.", 400);
    }

    const orders = await Order.find({
      _id: { $in: orderIds },
      orderMode: "serikli",
      "payment.status": "paid",
      sharedGroup: null,
      status: { $ne: ORDER_STATUS.CANCELLED },
    });

    if (orders.length !== orderIds.length) {
      return error(res, "Seçilmiş sifarişlər etibarlı deyil (ödənilməmiş, artıq qrupda və ya ləğv edilmiş ola bilər).", 400);
    }

    const resolvedType = animalType || orders[0].animalType;
    const allSameType = orders.every((o) => o.animalType === resolvedType);
    if (!allSameType) {
      return error(res, "Bütün sifarişlər eyni heyvan növündən olmalıdır.", 400);
    }

    const filledCapacity = parseFloat(
      orders.reduce((s, o) => s + (o.sharedPortion || 0), 0).toFixed(6),
    );

    if (filledCapacity > 1.0001) {
      return error(res, "Seçilmiş hissələrin cəmi 1-dən çox ola bilməz (7/7-dən artıq).", 400);
    }

    const group = await SharedGroup.create({
      animalType: resolvedType,
      orders: orders.map((o) => o._id),
      filledCapacity,
    });

    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) } },
      { $set: { sharedGroup: group._id } },
    );

    const populated = await SharedGroup.findById(group._id).populate({
      path: "orders",
      populate: { path: "user", select: "phone name" },
      select: "-__v",
    });

    return success(
      res,
      {
        group: {
          id: populated._id,
          groupNumber: populated.groupNumber,
          animalType: populated.animalType,
          filledCapacity: populated.filledCapacity,
          status: populated.status,
          createdAt: populated.createdAt,
          orders: populated.orders.map(formatAdminOrder),
        },
      },
      "Qrup yaradıldı.",
      201,
    );
  } catch (err) {
    console.error("createSharedGroup xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const addOrderToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { orderId } = req.body;

    const group = await SharedGroup.findById(groupId);
    if (!group) return error(res, "Qrup tapılmadı.", 404);
    if (group.status === "confirmed") return error(res, "Təsdiqlənmiş qrupa sifariş əlavə edilə bilməz.", 400);

    const order = await Order.findOne({
      _id: orderId,
      orderMode: "serikli",
      "payment.status": "paid",
      sharedGroup: null,
      status: { $ne: ORDER_STATUS.CANCELLED },
      animalType: group.animalType,
    });
    if (!order) return error(res, "Sifariş tapılmadı və ya bu qrupa uyğun deyil.", 404);

    const newCapacity = parseFloat((group.filledCapacity + (order.sharedPortion || 0)).toFixed(6));
    if (newCapacity > 1.0001) {
      return error(res, "Bu sifarişi əlavə etmək qrup həcmini aşacaq (7/7-dən çox).", 400);
    }

    group.orders.push(order._id);
    group.filledCapacity = newCapacity;
    await group.save();

    order.sharedGroup = group._id;
    await order.save();

    const populated = await SharedGroup.findById(group._id).populate({
      path: "orders",
      populate: { path: "user", select: "phone name" },
      select: "-__v",
    });

    return success(res, {
      group: {
        id: populated._id,
        groupNumber: populated.groupNumber,
        animalType: populated.animalType,
        filledCapacity: populated.filledCapacity,
        status: populated.status,
        createdAt: populated.createdAt,
        orders: populated.orders.map(formatAdminOrder),
      },
    }, "Sifariş qrupa əlavə edildi.");
  } catch (err) {
    console.error("addOrderToGroup xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const removeOrderFromGroup = async (req, res) => {
  try {
    const { groupId, orderId } = req.params;

    const group = await SharedGroup.findById(groupId);
    if (!group) return error(res, "Qrup tapılmadı.", 404);
    if (group.status === "confirmed") return error(res, "Təsdiqlənmiş qrupdan sifariş çıxarıla bilməz.", 400);

    const order = await Order.findOne({ _id: orderId, sharedGroup: groupId });
    if (!order) return error(res, "Sifariş bu qrupda tapılmadı.", 404);

    group.orders = group.orders.filter((id) => id.toString() !== orderId);
    group.filledCapacity = parseFloat(
      (group.filledCapacity - (order.sharedPortion || 0)).toFixed(6),
    );
    if (group.filledCapacity < 0) group.filledCapacity = 0;
    await group.save();

    order.sharedGroup = null;
    await order.save();

    if (group.orders.length === 0) {
      await SharedGroup.findByIdAndDelete(groupId);
      return success(res, { deleted: true }, "Sifariş çıxarıldı, boş qrup silindi.");
    }

    const populated = await SharedGroup.findById(group._id).populate({
      path: "orders",
      populate: { path: "user", select: "phone name" },
      select: "-__v",
    });

    return success(res, {
      group: {
        id: populated._id,
        groupNumber: populated.groupNumber,
        animalType: populated.animalType,
        filledCapacity: populated.filledCapacity,
        status: populated.status,
        createdAt: populated.createdAt,
        orders: populated.orders.map(formatAdminOrder),
      },
    }, "Sifariş qrupdan çıxarıldı.");
  } catch (err) {
    console.error("removeOrderFromGroup xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const confirmSharedGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await SharedGroup.findById(groupId).populate("orders");
    if (!group) return error(res, "Qrup tapılmadı.", 404);
    if (group.status === "confirmed") return error(res, "Qrup artıq təsdiqlənib.", 400);
    if (group.filledCapacity < 0.9999) {
      return error(res, `Qrup hələ tam deyil (${Math.round(group.filledCapacity * 10)}/10). Yalnız tam (7/7 = 10/10) qrupllar təsdiqlənə bilər.`, 400);
    }

    group.status = "confirmed";
    group.confirmedAt = new Date();
    await group.save();

    const now = new Date();
    await Order.updateMany(
      { _id: { $in: group.orders.map((o) => o._id) } },
      {
        $set: {
          status: ORDER_STATUS.CONFIRMED,
          confirmedAt: now,
        },
        $push: {
          statusHistory: {
            status: ORDER_STATUS.CONFIRMED,
            at: now,
            note: `Şərikli qrup #${group.groupNumber} admin tərəfindən təsdiqləndi.`,
          },
        },
      },
    );

    return success(res, { groupId, confirmedAt: now }, `Qrup #${group.groupNumber} təsdiqləndi. ${group.orders.length} sifariş təsdiqləndi.`);
  } catch (err) {
    console.error("confirmSharedGroup xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

const deleteSharedGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await SharedGroup.findById(groupId);
    if (!group) return error(res, "Qrup tapılmadı.", 404);
    if (group.status === "confirmed") return error(res, "Təsdiqlənmiş qrup silinə bilməz.", 400);

    await Order.updateMany(
      { sharedGroup: groupId },
      { $set: { sharedGroup: null } },
    );

    await SharedGroup.findByIdAndDelete(groupId);

    return success(res, {}, "Qrup silindi, sifarişlər azad edildi.");
  } catch (err) {
    console.error("deleteSharedGroup xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

module.exports = {
  adminLogin,
  adminForgotPassword,
  adminResetPassword,
  getAllOrders,
  getSharedOrders,
  getOrderById,
  updateOrderStatus,
  uploadMedia,
  deleteMedia,
  getStats,
  getSharedGroups,
  createSharedGroup,
  addOrderToGroup,
  removeOrderFromGroup,
  confirmSharedGroup,
  deleteSharedGroup,
};
