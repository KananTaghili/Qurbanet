const MeatAnimal = require("../models/MeatAnimal");
const MeatOrder = require("../models/MeatOrder");
const { MEAT_ORDER_STATUS } = require("../models/MeatOrder");
const Food = require("../models/Food");
const User = require("../models/User");
const { uploadBuffer, deleteFile } = require("../utils/gridfs");
const { success, error } = require("../utils/response");
const { notify } = require("../utils/notify");
const { getIo } = require("../socket");
const { parsePagination } = require("../utils/pagination");
const { attachCutImages } = require("./meatOrderController");

// Admin "Hazır" seçimlə göndərə biləcəyi statik şablonlar — mətnlər (AZ) və
// tərcümələr notificationI18n.js-də eyni key ilə saxlanılır (meat_<key>).
const BROADCAST_PRESETS = {
  new_parts: {
    type: "meat_new_parts",
    title: "Yeni hissələr əlavə olundu",
    body: "Yeni heyvan kəsildi və paketlənib satışa hazır şəkildə müştərilərini gözləyir!",
  },
  restock: {
    type: "meat_restock",
    title: "Stok yeniləndi",
    body: "Sevimli ət məhsullarınız yenidən stokdadır! Məhdud miqdarda olduğu üçün tez sifariş edin.",
  },
  discount: {
    type: "meat_discount",
    title: "Endirim fürsəti",
    body: "Ət Satışında xüsusi endirimlər başladı! İndi sifariş verin.",
  },
};

// Admin tərəfindən kataloqda edilən dəyişiklik (yeni/redaktə/sil/aktiv-deaktiv)
// müştəri tərəfini canlı yeniləmək üçün yayımlanır — dəqiq sahə fərqi yoxdur,
// sadəcə bu heyvanın məlumatını yenidən yükləməyi bildirir.
const emitCatalogUpdated = (animalKey) => {
  try {
    getIo().emit("meat_catalog_updated", { animalKey });
  } catch (_) {}
};

const getBaseUrl = (req) => process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
const fileIdToUrl = (fileId, req) => (fileId ? `${getBaseUrl(req)}/api/files/${fileId}` : null);

// Kəsimlərə foto URL-i və hesablanmış total qiyməti (tam hissə: çəki × kq qiyməti) əlavə edir,
// suitableFoods ID-lərini yüngül {_id,nameAz,imageUrl} obyektlərinə çevirir.
const shapeAnimal = (animal, req, foodMap) => {
  const obj = animal.toObject ? animal.toObject() : animal;
  obj.bodyParts = (obj.bodyParts || []).map((part) => ({
    ...part,
    cuts: (part.cuts || []).map((cut) => ({
      ...cut,
      imageUrl: fileIdToUrl(cut.imageFileId, req),
      totalPrice: Math.round((cut.weightKg || 0) * (cut.pricePerKg || 0) * 100) / 100,
      suitableFoods: (cut.suitableFoods || [])
        .map((id) => foodMap.get(String(id)))
        .filter(Boolean),
    })),
  }));
  return obj;
};

const buildFoodMap = async (req) => {
  const foods = await Food.find().select("nameAz imageFileId").lean();
  return new Map(
    foods.map((f) => [String(f._id), { _id: f._id, nameAz: f.nameAz, imageUrl: fileIdToUrl(f.imageFileId, req) }]),
  );
};

// GET /api/admin/meat-animals — bütün heyvanlar (aktiv/deaktiv, bütün kəsimlər)
const listAnimals = async (req, res) => {
  try {
    const animals = await MeatAnimal.find().sort({ sortOrder: 1 }).lean();
    const foodMap = await buildFoodMap(req);
    return success(res, { animals: animals.map((a) => shapeAnimal(a, req, foodMap)) });
  } catch (err) {
    console.error("[MeatAdmin] listAnimals xətası:", err.message);
    return error(res, "Heyvanlar yüklənə bilmədi.", 500);
  }
};

// PATCH /api/admin/meat-animals/:animalId/active — heyvanı aktiv/deaktiv et
const toggleAnimalActive = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { isActive } = req.body;
    const animal = await MeatAnimal.findById(animalId);
    if (!animal) return error(res, "Heyvan tapılmadı.", 404);
    animal.isActive = !!isActive;
    await animal.save();
    return respondWithAnimal(animal, req, res, "Heyvanın statusu yeniləndi.");
  } catch (err) {
    console.error("[MeatAdmin] toggleAnimalActive xətası:", err.message);
    return error(res, "Status yenilənə bilmədi.", 500);
  }
};

const findPart = (animal, partKey) => {
  const part = animal.bodyParts.find((p) => p.key === partKey);
  if (!part) throw Object.assign(new Error("Bədən hissəsi tapılmadı."), { statusCode: 404 });
  return part;
};

const parseFoodIds = (val) => {
  let arr = val;
  if (typeof val === "string") {
    try {
      arr = JSON.parse(val);
    } catch (_) {
      arr = val ? [val] : [];
    }
  }
  return Array.isArray(arr) ? arr.filter(Boolean) : [];
};

const respondWithAnimal = async (animal, req, res, message) => {
  const foodMap = await buildFoodMap(req);
  emitCatalogUpdated(animal.key);
  return success(res, { animal: shapeAnimal(animal.toObject(), req, foodMap) }, message);
};

// POST /api/admin/meat-animals/:animalId/parts/:partKey/cuts — yeni ət kəsimi əlavə et
const createCut = async (req, res) => {
  try {
    const { animalId, partKey } = req.params;
    const { nameAz, nameEn, nameRu, nameAr, pricePerKg, weightKg, stockKg, stepKg, minKg, soldByWeight, suitableFoods } = req.body;
    if (!nameAz || pricePerKg == null) {
      return error(res, "Ad və qiymət tələb olunur.", 400);
    }
    const animal = await MeatAnimal.findById(animalId);
    if (!animal) return error(res, "Heyvan tapılmadı.", 404);
    const part = findPart(animal, partKey);

    let imageFileId;
    if (req.file) {
      imageFileId = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    part.cuts.push({
      nameAz,
      nameEn: nameEn || "",
      nameRu: nameRu || "",
      nameAr: nameAr || "",
      pricePerKg: Number(pricePerKg),
      weightKg: Number(weightKg) || 0,
      // Çəkiylə satışda "stok" bu sahədir — doldurulmasa kəsim 0 stokda
      // yaranır və ictimai səhifədə heç görünmür (bax: getCutStockMeasure).
      stockKg: Number(stockKg) || 0,
      stepKg: stepKg != null && stepKg !== "" ? Number(stepKg) : undefined,
      minKg: minKg != null && minKg !== "" ? Number(minKg) : undefined,
      soldByWeight: soldByWeight === "true" || soldByWeight === true,
      imageFileId,
      suitableFoods: parseFoodIds(suitableFoods),
      isActive: true,
      sortOrder: part.cuts.length,
    });
    await animal.save();
    return respondWithAnimal(animal, req, res, "Ət kəsimi əlavə edildi.");
  } catch (err) {
    console.error("[MeatAdmin] createCut xətası:", err.message);
    return error(res, err.message || "Ət kəsimi əlavə edilə bilmədi.", err.statusCode || 500);
  }
};

// PUT /api/admin/meat-animals/:animalId/parts/:partKey/cuts/:cutId — ət kəsimini yenilə
const updateCut = async (req, res) => {
  try {
    const { animalId, partKey, cutId } = req.params;
    const animal = await MeatAnimal.findById(animalId);
    if (!animal) return error(res, "Heyvan tapılmadı.", 404);
    const part = findPart(animal, partKey);
    const cut = part.cuts.id(cutId);
    if (!cut) return error(res, "Ət kəsimi tapılmadı.", 404);

    const fields = ["nameAz", "nameEn", "nameRu", "nameAr", "isActive"];
    for (const f of fields) {
      if (req.body[f] !== undefined) cut[f] = req.body[f];
    }
    const numFields = ["pricePerKg", "weightKg", "stockKg", "stepKg", "minKg"];
    for (const f of numFields) {
      if (req.body[f] !== undefined) cut[f] = Number(req.body[f]);
    }
    if (req.body.soldByWeight !== undefined) {
      cut.soldByWeight = req.body.soldByWeight === "true" || req.body.soldByWeight === true;
    }
    if (req.body.suitableFoods !== undefined) {
      cut.suitableFoods = parseFoodIds(req.body.suitableFoods);
    }
    if (req.file) {
      const oldFileId = cut.imageFileId;
      cut.imageFileId = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      if (oldFileId) {
        try {
          await deleteFile(oldFileId);
        } catch (_) {}
      }
    }

    await animal.save();
    return respondWithAnimal(animal, req, res, "Ət kəsimi yeniləndi.");
  } catch (err) {
    console.error("[MeatAdmin] updateCut xətası:", err.message);
    return error(res, err.message || "Ət kəsimi yenilənə bilmədi.", err.statusCode || 500);
  }
};

// DELETE /api/admin/meat-animals/:animalId/parts/:partKey/cuts/:cutId
const deleteCut = async (req, res) => {
  try {
    const { animalId, partKey, cutId } = req.params;
    const animal = await MeatAnimal.findById(animalId);
    if (!animal) return error(res, "Heyvan tapılmadı.", 404);
    const part = findPart(animal, partKey);
    const cut = part.cuts.id(cutId);
    if (!cut) return error(res, "Ət kəsimi tapılmadı.", 404);
    if (cut.imageFileId) {
      try {
        await deleteFile(cut.imageFileId);
      } catch (_) {}
    }
    cut.deleteOne();
    await animal.save();
    return respondWithAnimal(animal, req, res, "Ət kəsimi silindi.");
  } catch (err) {
    console.error("[MeatAdmin] deleteCut xətası:", err.message);
    return error(res, err.message || "Ət kəsimi silinə bilmədi.", err.statusCode || 500);
  }
};

// GET /api/admin/meat-orders — Ət Satışı sifarişlərinin siyahısı (səhifələnmiş)
// Defolt olaraq hələ ödənişi təsdiqlənməmiş (awaiting_payment) sifarişlər
// gizlədilir — admin bunları yalnız ?status=awaiting_payment ilə açıq şəkildə görə bilər.
const listMeatOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit } = parsePagination(req.query);

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "awaiting_payment" };
    }

    const skip = (page - 1) * limit;

    const [orders, total, statusAgg] = await Promise.all([
      MeatOrder.find(filter)
        .populate("user", "name lastName phone email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MeatOrder.countDocuments(filter),
      MeatOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const statusCounts = {};
    let overallTotal = 0;
    for (const s of statusAgg) {
      statusCounts[s._id] = s.count;
      if (s._id !== "awaiting_payment") overallTotal += s.count;
    }

    return success(res, {
      orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      statusCounts,
      overallTotal,
    });
  } catch (err) {
    console.error("[MeatAdmin] listMeatOrders xətası:", err.message);
    return error(res, "Sifarişlər yüklənə bilmədi.", 500);
  }
};

// GET /api/admin/meat-orders/:orderId — sifariş detayı
const getMeatOrderById = async (req, res) => {
  try {
    const order = await MeatOrder.findById(req.params.orderId)
      .populate("user", "name lastName phone email createdAt")
      .lean();
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    await attachCutImages([order], req);
    return success(res, { order });
  } catch (err) {
    console.error("[MeatAdmin] getMeatOrderById xətası:", err.message);
    return error(res, "Sifariş yüklənə bilmədi.", 500);
  }
};

// PUT /api/admin/meat-orders/:orderId/status
const updateMeatOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!MEAT_ORDER_STATUS.includes(status)) {
      return error(res, "Yanlış status dəyəri.", 400);
    }
    const order = await MeatOrder.findById(req.params.orderId);
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    order.status = status;
    order.statusHistory.push({ status, note });
    await order.save();
    return success(res, { order }, "Sifarişin statusu yeniləndi.");
  } catch (err) {
    console.error("[MeatAdmin] updateMeatOrderStatus xətası:", err.message);
    return error(res, "Status yenilənə bilmədi.", 500);
  }
};

// GET /api/admin/meat-notifications/presets — "Hazır" seçim üçün şablon siyahısı
const listNotificationPresets = async (req, res) => {
  const presets = Object.entries(BROADCAST_PRESETS).map(([key, p]) => ({
    key,
    title: p.title,
    body: p.body,
  }));
  return success(res, { presets });
};

// POST /api/admin/meat-notifications/broadcast — bütün müştərilərə bildiriş yayımla
// body: { mode: "manual"|"preset", presetKey?, title?, body? }
const broadcastNotification = async (req, res) => {
  try {
    const { mode, presetKey, title, body } = req.body;

    let payload;
    if (mode === "preset") {
      const preset = BROADCAST_PRESETS[presetKey];
      if (!preset) return error(res, "Hazır şablon tapılmadı.", 400);
      payload = { type: preset.type, title: preset.title, body: preset.body };
    } else {
      if (!title || !title.trim()) return error(res, "Bildiriş başlığı tələb olunur.", 400);
      payload = { type: "meat_custom", title: title.trim(), body: (body || "").trim() };
    }

    const users = await User.find({ isGuest: { $ne: true }, isBlocked: { $ne: true } })
      .select("_id")
      .lean();
    const userIds = users.map((u) => u._id);
    if (!userIds.length) return error(res, "Göndəriləcək istifadəçi tapılmadı.", 400);

    const created = await notify(userIds, { module: "meat", ...payload });
    return success(res, { sentCount: created.length }, "Bildiriş göndərildi.");
  } catch (err) {
    console.error("[MeatAdmin] broadcastNotification xətası:", err.message);
    return error(res, "Bildiriş göndərilə bilmədi.", 500);
  }
};

module.exports = {
  listAnimals,
  toggleAnimalActive,
  createCut,
  updateCut,
  deleteCut,
  listMeatOrders,
  getMeatOrderById,
  updateMeatOrderStatus,
  listNotificationPresets,
  broadcastNotification,
};
