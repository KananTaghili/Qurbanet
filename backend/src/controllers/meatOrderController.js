const MeatAnimal = require("../models/MeatAnimal");
const MeatOrder = require("../models/MeatOrder");
const { MEAT_DELIVERY_FEE } = require("../config/constants");
const { success, error } = require("../utils/response");

// Səbətdəki hər item üçün cari qiymət/stok təsdiqi + xətt cəmi hesabla
const resolveItems = async (rawItems) => {
  const resolved = [];
  for (const it of rawItems) {
    const { animalKey, partKey, cutId, quantityKg } = it;
    const qty = Number(quantityKg);
    if (!animalKey || !partKey || !cutId || !qty || qty <= 0) {
      throw Object.assign(new Error("Səbət məlumatları natamamdır."), { statusCode: 400 });
    }
    const animal = await MeatAnimal.findOne({ key: animalKey, isActive: true }).lean();
    if (!animal) throw Object.assign(new Error("Heyvan tapılmadı və ya deaktivdir."), { statusCode: 400 });
    const part = (animal.bodyParts || []).find((p) => p.key === partKey);
    if (!part) throw Object.assign(new Error("Bədən hissəsi tapılmadı."), { statusCode: 400 });
    const cut = (part.cuts || []).find((c) => String(c._id) === String(cutId));
    if (!cut || !cut.isActive) throw Object.assign(new Error(`"${cut?.nameAz || "Məhsul"}" artıq mövcud deyil.`), { statusCode: 400 });
    if (cut.stockKg < qty) {
      throw Object.assign(new Error(`"${cut.nameAz}" üçün stokda kifayət qədər məhsul yoxdur (mövcud: ${cut.stockKg} kq).`), { statusCode: 400 });
    }

    resolved.push({
      animalKey,
      animalNameAz: animal.nameAz,
      partKey,
      partNameAz: part.nameAz,
      cutId: cut._id,
      cutNameAz: cut.nameAz,
      pricePerKg: cut.pricePerKg,
      quantityKg: qty,
      lineTotal: Math.round(cut.pricePerKg * qty * 100) / 100,
    });
  }
  return resolved;
};

// Stoku azalt; hər hansı biri uğursuz olarsa əvvəlkiləri geri qaytar
const decrementStock = async (items) => {
  const applied = [];
  for (const it of items) {
    const result = await MeatAnimal.updateOne(
      { key: it.animalKey },
      { $inc: { "bodyParts.$[part].cuts.$[cut].stockKg": -it.quantityKg } },
      {
        arrayFilters: [
          { "part.key": it.partKey },
          { "cut._id": it.cutId, "cut.stockKg": { $gte: it.quantityKg } },
        ],
      },
    );
    if (result.modifiedCount === 0) {
      for (const a of applied) {
        await MeatAnimal.updateOne(
          { key: a.animalKey },
          { $inc: { "bodyParts.$[part].cuts.$[cut].stockKg": a.quantityKg } },
          { arrayFilters: [{ "part.key": a.partKey }, { "cut._id": a.cutId }] },
        );
      }
      throw Object.assign(new Error(`"${it.cutNameAz}" üçün stok kifayət deyil.`), { statusCode: 409 });
    }
    applied.push(it);
  }
};

// POST /api/meat — yeni sifariş yarat
const createMeatOrder = async (req, res) => {
  try {
    const { items, deliveryLocation, contactInfo, userNote } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return error(res, "Səbət boşdur.", 400);
    }
    if (!deliveryLocation?.address || !deliveryLocation?.coordinates?.lat || !deliveryLocation?.coordinates?.lng) {
      return error(res, "Çatdırılma ünvanı seçilməyib.", 400);
    }

    const resolved = await resolveItems(items);
    await decrementStock(resolved);

    const itemsTotal = Math.round(resolved.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
    const deliveryFee = MEAT_DELIVERY_FEE;
    const totalPrice = Math.round((itemsTotal + deliveryFee) * 100) / 100;

    const order = await MeatOrder.create({
      user: req.userId,
      items: resolved,
      itemsTotal,
      deliveryFee,
      totalPrice,
      deliveryLocation,
      contactInfo,
      userNote,
      status: "awaiting_payment",
      statusHistory: [{ status: "awaiting_payment", note: "Sifariş yaradıldı." }],
    });

    return success(res, { order }, "Sifariş yaradıldı.", 201);
  } catch (err) {
    console.error("[MeatOrder] createMeatOrder xətası:", err.message);
    return error(res, err.message || "Sifariş yaradıla bilmədi.", err.statusCode || 500);
  }
};

// GET /api/meat/orders/my
const getMyMeatOrders = async (req, res) => {
  try {
    const orders = await MeatOrder.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
    return success(res, { orders });
  } catch (err) {
    console.error("[MeatOrder] getMyMeatOrders xətası:", err.message);
    return error(res, "Sifarişlər yüklənə bilmədi.", 500);
  }
};

// GET /api/meat/orders/:orderId
const getMeatOrderById = async (req, res) => {
  try {
    const order = await MeatOrder.findOne({ _id: req.params.orderId, user: req.userId }).lean();
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    return success(res, { order });
  } catch (err) {
    console.error("[MeatOrder] getMeatOrderById xətası:", err.message);
    return error(res, "Sifariş yüklənə bilmədi.", 500);
  }
};

module.exports = { createMeatOrder, getMyMeatOrders, getMeatOrderById };
