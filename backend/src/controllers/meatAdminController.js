const MeatAnimal = require("../models/MeatAnimal");
const MeatOrder = require("../models/MeatOrder");
const { success, error } = require("../utils/response");

// GET /api/admin/meat-animals — bütün heyvanlar (aktiv/deaktiv, bütün kəsimlər)
const listAnimals = async (req, res) => {
  try {
    const animals = await MeatAnimal.find().sort({ sortOrder: 1 }).lean();
    return success(res, { animals });
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
    return success(res, { animal }, "Heyvanın statusu yeniləndi.");
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

// POST /api/admin/meat-animals/:animalId/parts/:partKey/cuts — yeni ət kəsimi əlavə et
const createCut = async (req, res) => {
  try {
    const { animalId, partKey } = req.params;
    const { nameAz, nameEn, nameRu, nameAr, pricePerKg, stockKg, stepKg, minKg } = req.body;
    if (!nameAz || pricePerKg == null) {
      return error(res, "Ad və qiymət tələb olunur.", 400);
    }
    const animal = await MeatAnimal.findById(animalId);
    if (!animal) return error(res, "Heyvan tapılmadı.", 404);
    const part = findPart(animal, partKey);

    part.cuts.push({
      nameAz,
      nameEn: nameEn || "",
      nameRu: nameRu || "",
      nameAr: nameAr || "",
      pricePerKg: Number(pricePerKg),
      stockKg: Number(stockKg) || 0,
      stepKg: Number(stepKg) || 1,
      minKg: Number(minKg) || 1,
      isActive: true,
      sortOrder: part.cuts.length,
    });
    await animal.save();
    return success(res, { animal }, "Ət kəsimi əlavə edildi.");
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
    const numFields = ["pricePerKg", "stockKg", "stepKg", "minKg"];
    for (const f of numFields) {
      if (req.body[f] !== undefined) cut[f] = Number(req.body[f]);
    }

    await animal.save();
    return success(res, { animal }, "Ət kəsimi yeniləndi.");
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
    cut.deleteOne();
    await animal.save();
    return success(res, { animal }, "Ət kəsimi silindi.");
  } catch (err) {
    console.error("[MeatAdmin] deleteCut xətası:", err.message);
    return error(res, err.message || "Ət kəsimi silinə bilmədi.", err.statusCode || 500);
  }
};

// GET /api/admin/meat-orders — bütün Ət Satışı sifarişləri
const listMeatOrders = async (req, res) => {
  try {
    const orders = await MeatOrder.find()
      .sort({ createdAt: -1 })
      .populate("user", "name lastName mobile phone")
      .lean();
    return success(res, { orders });
  } catch (err) {
    console.error("[MeatAdmin] listMeatOrders xətası:", err.message);
    return error(res, "Sifarişlər yüklənə bilmədi.", 500);
  }
};

// PUT /api/admin/meat-orders/:orderId/status
const updateMeatOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
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

module.exports = {
  listAnimals,
  toggleAnimalActive,
  createCut,
  updateCut,
  deleteCut,
  listMeatOrders,
  updateMeatOrderStatus,
};
