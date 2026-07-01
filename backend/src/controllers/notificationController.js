const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { success, error } = require("../utils/response");
const { parsePagination } = require("../utils/pagination");
const { localizeNotification, normalizeLang } = require("../utils/notificationI18n");

// İstifadəçinin dilini müəyyən et: query.lang → saxlanılmış user.language → "az".
// query.lang gəlibsə, gələcək push üçün user.language-i də yeniləyir.
const resolveLang = async (req) => {
  if (req.query.lang) {
    const lang = normalizeLang(req.query.lang);
    User.updateOne({ _id: req.userId }, { language: lang }).catch(() => {});
    return lang;
  }
  const u = await User.findById(req.userId).select("language");
  return normalizeLang(u?.language);
};

// GET /api/notifications?module=&status=&search=&page=&limit=
// module: all | qurban | charity | meat | news
// status: all | read | unread
exports.list = async (req, res) => {
  try {
    const userId = req.userId;
    const { page, limit } = parsePagination(req.query);
    const { module, status, search } = req.query;

    const filter = { user: userId };
    if (module && module !== "all") filter.module = module;
    if (status === "read")   filter.read = true;
    if (status === "unread") filter.read = false;
    if (search && search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { body: rx }];
    }

    const [items, total, unreadTotal, lang] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, read: false }),
      resolveLang(req),
    ]);

    return success(res, {
      notifications: items.map((n) => localizeNotification(n, lang)),
      unreadTotal,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/notifications/unread-count  →  qırmızı nişan + tab sayğacları
exports.unreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const [total, rows] = await Promise.all([
      Notification.countDocuments({ user: userId, read: false }),
      Notification.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(userId)), read: false } },
        { $group: { _id: "$module", count: { $sum: 1 } } },
      ]),
    ]);
    const byModule = {};
    rows.forEach((r) => { byModule[r._id] = r.count; });
    return success(res, { total, byModule });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// PATCH /api/notifications/:id/read  →  bir bildirişi oxundu et (açılanda)
exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true },
    );
    if (!n) return error(res, "Bildiriş tapılmadı", 404);
    return success(res, n, "Oxundu");
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// PATCH /api/notifications/read-all  →  hamısını (və ya seçilmiş modulu) oxundu et
// body: { module?: "qurban"|"charity"|... }
exports.markAllRead = async (req, res) => {
  try {
    const filter = { user: req.userId, read: false };
    const { module } = req.body || {};
    if (module && module !== "all") filter.module = module;
    const r = await Notification.updateMany(filter, { read: true });
    return success(res, { modified: r.modifiedCount ?? r.nModified ?? 0 }, "Hamısı oxundu");
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};
