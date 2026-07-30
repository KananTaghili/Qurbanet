const mongoose = require("mongoose");
const Food = require("../models/Food");
const MeatGroundProduct = require("../models/MeatGroundProduct");
const MeatInternalOrgan = require("../models/MeatInternalOrgan");
const { uploadBuffer, deleteFile } = require("../utils/gridfs");
const { success, error } = require("../utils/response");

const toBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return true;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
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
  if (!Array.isArray(arr)) return [];
  return arr.filter((id) => mongoose.isValidObjectId(id));
};

const getBaseUrl = (req) => process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
const fileIdToUrl = (fileId, req) => (fileId ? `${getBaseUrl(req)}/api/files/${fileId}` : null);

const withImageUrl = (doc, req) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.imageUrl = fileIdToUrl(obj.imageFileId, req);
  if (Array.isArray(obj.suitableFoods)) {
    obj.suitableFoods = obj.suitableFoods.map((f) =>
      f && f._id ? { ...(f.toObject ? f.toObject() : f), imageUrl: fileIdToUrl(f.imageFileId, req) } : f,
    );
  }
  return obj;
};

const uploadImageIfPresent = async (req, payload) => {
  if (req.file) {
    payload.imageFileId = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
  }
};

const replaceImageIfPresent = async (req, doc) => {
  if (!req.file) return;
  const fileId = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
  if (doc.imageFileId) {
    try {
      await deleteFile(doc.imageFileId);
    } catch (_) {}
  }
  doc.imageFileId = fileId;
};

/* ═══════════════════════ Food (Yeməklər) ═══════════════════════ */

const listFoods = async (req, res) => {
  try {
    const foods = await Food.find().sort({ sortOrder: 1, createdAt: 1 });
    return success(res, { foods: foods.map((f) => withImageUrl(f, req)) });
  } catch (err) {
    console.error("[MeatCatalog] listFoods xətası:", err.message);
    return error(res, "Yeməklər yüklənə bilmədi.", 500);
  }
};

const createFood = async (req, res) => {
  try {
    const { nameAz, nameEn, nameRu } = req.body;
    if (!nameAz?.trim()) return error(res, "Ad tələb olunur.", 400);
    const payload = { nameAz: nameAz.trim(), nameEn: (nameEn || "").trim(), nameRu: (nameRu || "").trim() };
    await uploadImageIfPresent(req, payload);
    const food = await Food.create(payload);
    return success(res, { food: withImageUrl(food, req) }, "Yemək əlavə edildi.", 201);
  } catch (err) {
    console.error("[MeatCatalog] createFood xətası:", err.message);
    return error(res, "Yemək əlavə edilmədi.", 500);
  }
};

const updateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.foodId);
    if (!food) return error(res, "Yemək tapılmadı.", 404);
    const { nameAz, nameEn, nameRu, isActive, sortOrder } = req.body;
    if (nameAz !== undefined) food.nameAz = nameAz.trim();
    if (nameEn !== undefined) food.nameEn = nameEn.trim();
    if (nameRu !== undefined) food.nameRu = nameRu.trim();
    if (isActive !== undefined) food.isActive = toBool(isActive);
    if (sortOrder !== undefined) food.sortOrder = Number(sortOrder) || 0;
    await replaceImageIfPresent(req, food);
    await food.save();
    return success(res, { food: withImageUrl(food, req) }, "Yemək yeniləndi.");
  } catch (err) {
    console.error("[MeatCatalog] updateFood xətası:", err.message);
    return error(res, "Yemək yenilənmədi.", 500);
  }
};

const deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.foodId);
    if (!food) return error(res, "Yemək tapılmadı.", 404);
    if (food.imageFileId) {
      try {
        await deleteFile(food.imageFileId);
      } catch (_) {}
    }
    await Food.deleteOne({ _id: food._id });
    return success(res, {}, "Yemək silindi.");
  } catch (err) {
    console.error("[MeatCatalog] deleteFood xətası:", err.message);
    return error(res, "Yemək silinmədi.", 500);
  }
};

/* ═══════════════════ Ground meat (Çəkilmiş Ət) ═══════════════════ */

const listGroundProducts = async (req, res) => {
  try {
    const items = await MeatGroundProduct.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .populate("suitableFoods", "nameAz imageFileId");
    return success(res, { products: items.map((i) => withImageUrl(i, req)) });
  } catch (err) {
    console.error("[MeatCatalog] listGroundProducts xətası:", err.message);
    return error(res, "Çəkilmiş ət siyahısı yüklənə bilmədi.", 500);
  }
};

const createGroundProduct = async (req, res) => {
  try {
    const { nameAz, nameEn, nameRu, animalKey, pricePerKg, stockKg, suitableFoods } = req.body;
    if (!nameAz?.trim() || !animalKey || pricePerKg == null) {
      return error(res, "Ad, heyvan və qiymət tələb olunur.", 400);
    }
    const payload = {
      nameAz: nameAz.trim(),
      nameEn: (nameEn || "").trim(),
      nameRu: (nameRu || "").trim(),
      animalKey,
      pricePerKg: Number(pricePerKg) || 0,
      stockKg: Number(stockKg) || 0,
      suitableFoods: parseFoodIds(suitableFoods),
    };
    await uploadImageIfPresent(req, payload);
    let product = await MeatGroundProduct.create(payload);
    product = await product.populate("suitableFoods", "nameAz imageFileId");
    return success(res, { product: withImageUrl(product, req) }, "Çəkilmiş ət əlavə edildi.", 201);
  } catch (err) {
    console.error("[MeatCatalog] createGroundProduct xətası:", err.message);
    return error(res, "Çəkilmiş ət əlavə edilmədi.", 500);
  }
};

const updateGroundProduct = async (req, res) => {
  try {
    const product = await MeatGroundProduct.findById(req.params.productId);
    if (!product) return error(res, "Çəkilmiş ət tapılmadı.", 404);
    const { nameAz, nameEn, nameRu, animalKey, pricePerKg, stockKg, suitableFoods, isActive, sortOrder } = req.body;
    if (nameAz !== undefined) product.nameAz = nameAz.trim();
    if (nameEn !== undefined) product.nameEn = nameEn.trim();
    if (nameRu !== undefined) product.nameRu = nameRu.trim();
    if (animalKey !== undefined) product.animalKey = animalKey;
    if (pricePerKg !== undefined) product.pricePerKg = Number(pricePerKg) || 0;
    if (stockKg !== undefined) product.stockKg = Number(stockKg) || 0;
    if (suitableFoods !== undefined) product.suitableFoods = parseFoodIds(suitableFoods);
    if (isActive !== undefined) product.isActive = toBool(isActive);
    if (sortOrder !== undefined) product.sortOrder = Number(sortOrder) || 0;
    await replaceImageIfPresent(req, product);
    await product.save();
    await product.populate("suitableFoods", "nameAz imageFileId");
    return success(res, { product: withImageUrl(product, req) }, "Çəkilmiş ət yeniləndi.");
  } catch (err) {
    console.error("[MeatCatalog] updateGroundProduct xətası:", err.message);
    return error(res, "Çəkilmiş ət yenilənmədi.", 500);
  }
};

const deleteGroundProduct = async (req, res) => {
  try {
    const product = await MeatGroundProduct.findById(req.params.productId);
    if (!product) return error(res, "Çəkilmiş ət tapılmadı.", 404);
    if (product.imageFileId) {
      try {
        await deleteFile(product.imageFileId);
      } catch (_) {}
    }
    await MeatGroundProduct.deleteOne({ _id: product._id });
    return success(res, {}, "Çəkilmiş ət silindi.");
  } catch (err) {
    console.error("[MeatCatalog] deleteGroundProduct xətası:", err.message);
    return error(res, "Çəkilmiş ət silinmədi.", 500);
  }
};

/* ═══════════════════ Internal organs (Daxili Orqanlar) ═══════════════════ */

const withTotalPrice = (obj) => {
  obj.totalPrice = Math.round((obj.weightKg || 0) * (obj.pricePerKg || 0) * 100) / 100;
  return obj;
};

const listOrgans = async (req, res) => {
  try {
    const items = await MeatInternalOrgan.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .populate("suitableFoods", "nameAz imageFileId");
    return success(res, { organs: items.map((i) => withTotalPrice(withImageUrl(i, req))) });
  } catch (err) {
    console.error("[MeatCatalog] listOrgans xətası:", err.message);
    return error(res, "Daxili orqanlar yüklənə bilmədi.", 500);
  }
};

const createOrgan = async (req, res) => {
  try {
    const { nameAz, nameEn, nameRu, animalKey, weightKg, pricePerKg, suitableFoods } = req.body;
    if (!nameAz?.trim() || !animalKey || weightKg == null || pricePerKg == null) {
      return error(res, "Ad, heyvan, çəki və qiymət tələb olunur.", 400);
    }
    const payload = {
      nameAz: nameAz.trim(),
      nameEn: (nameEn || "").trim(),
      nameRu: (nameRu || "").trim(),
      animalKey,
      weightKg: Number(weightKg) || 0,
      pricePerKg: Number(pricePerKg) || 0,
      suitableFoods: parseFoodIds(suitableFoods),
    };
    await uploadImageIfPresent(req, payload);
    let organ = await MeatInternalOrgan.create(payload);
    organ = await organ.populate("suitableFoods", "nameAz imageFileId");
    return success(res, { organ: withTotalPrice(withImageUrl(organ, req)) }, "Daxili orqan əlavə edildi.", 201);
  } catch (err) {
    console.error("[MeatCatalog] createOrgan xətası:", err.message);
    return error(res, "Daxili orqan əlavə edilmədi.", 500);
  }
};

const updateOrgan = async (req, res) => {
  try {
    const organ = await MeatInternalOrgan.findById(req.params.organId);
    if (!organ) return error(res, "Daxili orqan tapılmadı.", 404);
    const { nameAz, nameEn, nameRu, animalKey, weightKg, pricePerKg, suitableFoods, isActive, sortOrder } = req.body;
    if (nameAz !== undefined) organ.nameAz = nameAz.trim();
    if (nameEn !== undefined) organ.nameEn = nameEn.trim();
    if (nameRu !== undefined) organ.nameRu = nameRu.trim();
    if (animalKey !== undefined) organ.animalKey = animalKey;
    if (weightKg !== undefined) organ.weightKg = Number(weightKg) || 0;
    if (pricePerKg !== undefined) organ.pricePerKg = Number(pricePerKg) || 0;
    if (suitableFoods !== undefined) organ.suitableFoods = parseFoodIds(suitableFoods);
    if (isActive !== undefined) organ.isActive = toBool(isActive);
    if (sortOrder !== undefined) organ.sortOrder = Number(sortOrder) || 0;
    await replaceImageIfPresent(req, organ);
    await organ.save();
    await organ.populate("suitableFoods", "nameAz imageFileId");
    return success(res, { organ: withTotalPrice(withImageUrl(organ, req)) }, "Daxili orqan yeniləndi.");
  } catch (err) {
    console.error("[MeatCatalog] updateOrgan xətası:", err.message);
    return error(res, "Daxili orqan yenilənmədi.", 500);
  }
};

const deleteOrgan = async (req, res) => {
  try {
    const organ = await MeatInternalOrgan.findById(req.params.organId);
    if (!organ) return error(res, "Daxili orqan tapılmadı.", 404);
    if (organ.imageFileId) {
      try {
        await deleteFile(organ.imageFileId);
      } catch (_) {}
    }
    await MeatInternalOrgan.deleteOne({ _id: organ._id });
    return success(res, {}, "Daxili orqan silindi.");
  } catch (err) {
    console.error("[MeatCatalog] deleteOrgan xətası:", err.message);
    return error(res, "Daxili orqan silinmədi.", 500);
  }
};

module.exports = {
  listFoods,
  createFood,
  updateFood,
  deleteFood,
  listGroundProducts,
  createGroundProduct,
  updateGroundProduct,
  deleteGroundProduct,
  listOrgans,
  createOrgan,
  updateOrgan,
  deleteOrgan,
};
