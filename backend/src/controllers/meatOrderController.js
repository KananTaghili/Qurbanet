const MeatAnimal = require("../models/MeatAnimal");
const MeatInternalOrgan = require("../models/MeatInternalOrgan");
const MeatGroundProduct = require("../models/MeatGroundProduct");
const MeatOrder = require("../models/MeatOrder");
const AppSettings = require("../models/AppSettings");
const { MEAT_DELIVERY_FEE } = require("../config/constants");
const { success, error } = require("../utils/response");
const { getIo } = require("../socket");

// Səbətdəki sətir "daxili orqan" / "çəkilmiş ət" sentinel partKey-lərindən
// hansı kataloqa (MeatAnimal kəsimi, MeatInternalOrgan, MeatGroundProduct)
// aid olduğunu müəyyən edir — web tərəfi (products/page.js) bu sentinel-ləri
// istifadə edir, geriyə uyğunluq üçün burada da eyni sabitlərdir.
const ORGAN_PART_KEY = "daxili-orqan";
const GROUND_PART_KEY = "cekilmis-et";
const getItemType = (partKey) => {
  if (partKey === ORGAN_PART_KEY) return "organ";
  if (partKey === GROUND_PART_KEY) return "ground";
  return "cut";
};

// Seçilmiş çatdırılma şəhərinə görə admin tənzimləmələrindən qiyməti tapır —
// (hər şəhərin öz qiyməti var) şəhər/ölkə tapılmasa/deaktivdirsə köhnə sabit
// qiymətə (MEAT_DELIVERY_FEE) düşür.
const getBaseUrl = (req) => process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
const fileIdToUrl = (fileId, req) => (fileId ? `${getBaseUrl(req)}/api/files/${fileId}` : null);

// Sifariş itemləri yalnız cutId saxlayır (foto saxlanmır) — qəbz görünüşü
// üçün cutId-ni itemType-a uyğun kataloqdakı (kəsim/orqan/çəkilmiş ət) şəklə
// uyğunlaşdırır. Kataloqdan silinmiş/deaktiv edilmiş məhsullar üçün null qaytarır.
const attachCutImages = async (orders, req) => {
  const animals = await MeatAnimal.find({}).select("bodyParts.cuts._id bodyParts.cuts.imageFileId").lean();
  const imageByCutId = new Map();
  for (const animal of animals) {
    for (const part of animal.bodyParts || []) {
      for (const cut of part.cuts || []) {
        imageByCutId.set(String(cut._id), cut.imageFileId);
      }
    }
  }
  const [organs, groundProducts] = await Promise.all([
    MeatInternalOrgan.find({}).select("_id imageFileId").lean(),
    MeatGroundProduct.find({}).select("_id imageFileId").lean(),
  ]);
  for (const o of organs) imageByCutId.set(`organ:${o._id}`, o.imageFileId);
  for (const p of groundProducts) imageByCutId.set(`ground:${p._id}`, p.imageFileId);

  for (const order of orders) {
    for (const item of order.items || []) {
      const key =
        item.itemType === "organ" || item.itemType === "ground"
          ? `${item.itemType}:${item.cutId}`
          : String(item.cutId);
      item.imageUrl = fileIdToUrl(imageByCutId.get(key), req);
    }
  }
  return orders;
};

const resolveDeliveryFee = async (countryCode, cityKey) => {
  if (!countryCode || !cityKey) return MEAT_DELIVERY_FEE;
  const settings = await AppSettings.findOne({ singleton: "global" })
    .select("deliveryCountries")
    .lean();
  const country = (settings?.deliveryCountries || []).find(
    (c) => c.code === countryCode && c.enabled,
  );
  const city = (country?.cities || []).find((c) => c.key === cityKey && c.enabled);
  return city && city.deliveryPrice != null ? city.deliveryPrice : MEAT_DELIVERY_FEE;
};

// Səbətdəki hər item üçün cari qiymət/stok təsdiqi + xətt cəmi hesabla.
// Kataloqdan silinmiş/deaktiv olan kimi "gerçək" natamamlıq (yanlış id və s.)
// dərhal xəta atır (bu, client bug-ıdır) — amma sadəcə stokda qalmayan/başqası
// tərəfindən alınmış itemlər `unavailable` siyahısına yığılır ki, checkout bunları
// sifarişi tam saxtalamadan səbətdən silmək üçün frontend-ə strukturlaşdırılmış
// şəkildə qaytara bilsin.
const resolveItems = async (rawItems) => {
  const resolved = [];
  const unavailable = [];
  const animalNameCache = new Map();
  const getAnimalName = async (animalKey) => {
    if (!animalNameCache.has(animalKey)) {
      const a = await MeatAnimal.findOne({ key: animalKey }).select("nameAz").lean();
      animalNameCache.set(animalKey, a?.nameAz || "");
    }
    return animalNameCache.get(animalKey);
  };

  for (const it of rawItems) {
    const { animalKey, partKey, cutId, quantityKg } = it;
    const qty = Number(quantityKg);
    if (!animalKey || !partKey || !cutId || !qty || qty <= 0) {
      throw Object.assign(new Error("Səbət məlumatları natamamdır."), { statusCode: 400 });
    }

    const itemType = getItemType(partKey);

    if (itemType === "organ") {
      const organ = await MeatInternalOrgan.findById(cutId).lean();
      if (!organ || !organ.isActive) {
        unavailable.push({ animalKey, partKey, cutId, name: organ?.nameAz || "Daxili orqan", reason: "sold_out" });
        continue;
      }
      resolved.push({
        animalKey,
        animalNameAz: await getAnimalName(animalKey),
        partKey,
        partNameAz: "Daxili orqan",
        cutId: organ._id,
        cutNameAz: organ.nameAz,
        pricePerKg: organ.pricePerKg,
        quantityKg: qty,
        lineTotal: Math.round(organ.pricePerKg * qty * 100) / 100,
        soldByWeight: false,
        itemType,
      });
      continue;
    }

    if (itemType === "ground") {
      const product = await MeatGroundProduct.findById(cutId).lean();
      if (!product || !product.isActive) {
        unavailable.push({ animalKey, partKey, cutId, name: product?.nameAz || "Çəkilmiş ət", reason: "sold_out" });
        continue;
      }
      if (product.stockKg < qty) {
        unavailable.push({ animalKey, partKey, cutId, name: product.nameAz, reason: "insufficient_stock" });
        continue;
      }
      resolved.push({
        animalKey,
        animalNameAz: await getAnimalName(animalKey),
        partKey,
        partNameAz: "Çəkilmiş ət",
        cutId: product._id,
        cutNameAz: product.nameAz,
        pricePerKg: product.pricePerKg,
        quantityKg: qty,
        lineTotal: Math.round(product.pricePerKg * qty * 100) / 100,
        soldByWeight: true,
        itemType,
      });
      continue;
    }

    const animal = await MeatAnimal.findOne({ key: animalKey, isActive: true }).lean();
    if (!animal) throw Object.assign(new Error("Heyvan tapılmadı və ya deaktivdir."), { statusCode: 400 });
    const part = (animal.bodyParts || []).find((p) => p.key === partKey);
    if (!part) throw Object.assign(new Error("Bədən hissəsi tapılmadı."), { statusCode: 400 });
    const cut = (part.cuts || []).find((c) => String(c._id) === String(cutId));
    if (!cut) throw Object.assign(new Error("Ət kəsimi tapılmadı."), { statusCode: 400 });
    if (!cut.isActive) {
      unavailable.push({ animalKey, partKey, cutId, name: cut.nameAz, reason: "sold_out" });
      continue;
    }

    // Tam hissə satışında (soldByWeight: false) stockKg sahəsi istifadə olunmur —
    // "stok" isActive-dir: satılan kimi decrementStock() onu deaktiv edir və
    // bundan sonra heç kim həmin kəsimi görə/sifariş verə bilməz.
    const soldByWeight = cut.soldByWeight !== false;
    if (soldByWeight && cut.stockKg < qty) {
      unavailable.push({ animalKey, partKey, cutId, name: cut.nameAz, reason: "insufficient_stock" });
      continue;
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
      soldByWeight,
      itemType,
    });
  }

  if (unavailable.length > 0) {
    const names = unavailable.map((u) => `"${u.name}"`).join(", ");
    throw Object.assign(new Error(`${names} artıq stokda yoxdur — səbətdən silindi.`), {
      statusCode: 409,
      unavailableItems: unavailable,
    });
  }

  return resolved;
};

// Əvvəllər tətbiq olunmuş dəyişiklikləri geri qaytarır (decrementStock içində
// hər hansı bir item uğursuz olarsa, ya da ödəniş uğursuz/tərk edilmiş sifarişin
// kilidini buraxarkən çağırılır).
const rollbackApplied = async (applied) => {
  for (const a of applied) {
    if (a.itemType === "organ") {
      await MeatInternalOrgan.updateOne({ _id: a.cutId }, { $set: { isActive: true } });
    } else if (a.itemType === "ground") {
      await MeatGroundProduct.updateOne({ _id: a.cutId }, { $inc: { stockKg: a.quantityKg } });
    } else if (a.soldByWeight) {
      await MeatAnimal.updateOne(
        { key: a.animalKey },
        { $inc: { "bodyParts.$[part].cuts.$[cut].stockKg": a.quantityKg } },
        { arrayFilters: [{ "part.key": a.partKey }, { "cut._id": a.cutId }] },
      );
    } else {
      await MeatAnimal.updateOne(
        { key: a.animalKey },
        { $set: { "bodyParts.$[part].cuts.$[cut].isActive": true } },
        { arrayFilters: [{ "part.key": a.partKey }, { "cut._id": a.cutId }] },
      );
    }
  }
};

// Ödəniş heç vaxt təsdiqlənməmiş (uğursuz olmuş və ya sadəcə tərk edilmiş)
// sifarişlərin kilidlədiyi stoku geri buraxır. `filter` ilə ya konkret istifadəçi
// (retry zamanı dərhal), ya da qlobal köhnəlmə müddəti (arxa fon təmizliyi) üzrə işləyir.
// stockReleased bayrağı ilə idempotentdir — eyni sifarişin stoku iki dəfə artırılmır.
const releaseStaleMeatOrders = async ({ userId, olderThanMinutes } = {}) => {
  const query = {
    status: "awaiting_payment",
    "payment.status": { $ne: "paid" },
    stockReleased: { $ne: true },
  };
  if (userId) query.user = userId;
  if (olderThanMinutes) {
    query.createdAt = { $lte: new Date(Date.now() - olderThanMinutes * 60 * 1000) };
  }

  const staleOrders = await MeatOrder.find(query);
  const releasedItems = [];
  for (const order of staleOrders) {
    try {
      await rollbackApplied(order.items);
      releasedItems.push(...order.items);
      order.payment.status = "failed";
      order.status = "cancelled";
      order.stockReleased = true;
      order.statusHistory.push({ status: "cancelled", note: "Ödəniş tamamlanmadı — stok sərbəst buraxıldı." });
      await order.save();
    } catch (err) {
      console.error("[MeatOrder] releaseStaleMeatOrders xətası:", order._id, err.message);
    }
  }
  // Sərbəst buraxılan stok da decrementStock qədər canlı yayımlanmalıdır —
  // əks halda kataloq/səbətlər "stokda yoxdur" göstərməyə davam edər, halbuki
  // ödəniş uğursuz olduğu üçün stok artıq geri qaytarılıb.
  if (releasedItems.length) await emitStockUpdates(releasedItems);
};

// Stoku kilidlə: kq üzrə satılanlarda stockKg azaldılır, tam hissədə isə
// kəsim atomik şəkildə deaktiv edilir (bir dəfə satılan kimi başqa heç kim
// onu görə/ala bilməz). Hər hansı biri uğursuz olarsa əvvəlkilər geri qaytarılır.
const decrementStock = async (items) => {
  const applied = [];
  for (const it of items) {
    if (it.itemType === "organ") {
      // Daxili orqan həmişə tam hissə satılır — bir dəfə satılan kimi
      // atomik şəkildə deaktiv edilir, başqa heç kim ala bilməz.
      const result = await MeatInternalOrgan.updateOne(
        { _id: it.cutId, isActive: true },
        { $set: { isActive: false } },
      );
      if (result.modifiedCount === 0) {
        await rollbackApplied(applied);
        throw Object.assign(new Error(`"${it.cutNameAz}" artıq başqa müştəri tərəfindən alınıb.`), { statusCode: 409 });
      }
    } else if (it.itemType === "ground") {
      const result = await MeatGroundProduct.updateOne(
        { _id: it.cutId, stockKg: { $gte: it.quantityKg } },
        { $inc: { stockKg: -it.quantityKg } },
      );
      if (result.modifiedCount === 0) {
        await rollbackApplied(applied);
        throw Object.assign(new Error(`"${it.cutNameAz}" üçün stok kifayət deyil.`), { statusCode: 409 });
      }
    } else if (it.soldByWeight) {
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
        await rollbackApplied(applied);
        throw Object.assign(new Error(`"${it.cutNameAz}" üçün stok kifayət deyil.`), { statusCode: 409 });
      }
    } else {
      // Yalnız hələ aktiv olan (hələ satılmamış) kəsimi kilidləyirik — eyni anda
      // iki müştəri eyni tam hissəni sifariş etsə, yalnız biri uğurlu olur.
      const result = await MeatAnimal.updateOne(
        { key: it.animalKey },
        { $set: { "bodyParts.$[part].cuts.$[cut].isActive": false } },
        {
          arrayFilters: [
            { "part.key": it.partKey },
            { "cut._id": it.cutId, "cut.isActive": true },
          ],
        },
      );
      if (result.modifiedCount === 0) {
        await rollbackApplied(applied);
        throw Object.assign(new Error(`"${it.cutNameAz}" artıq başqa müştəri tərəfindən alınıb.`), { statusCode: 409 });
      }
    }
    applied.push(it);
  }
  return applied;
};

// Sifariş uğurla yaradıldıqdan sonra kilidlənmiş kəsimlərin yeni vəziyyətini
// bütün qoşulu müştərilərə canlı yayımlayır (diaqram/kartlar dərhal yenilənsin deyə).
const emitStockUpdates = async (items) => {
  try {
    const io = getIo();
    const cutItems = items.filter((i) => i.itemType !== "organ" && i.itemType !== "ground");
    const organItems = items.filter((i) => i.itemType === "organ");
    const groundItems = items.filter((i) => i.itemType === "ground");

    if (cutItems.length) {
      const animalKeys = [...new Set(cutItems.map((i) => i.animalKey))];
      const animals = await MeatAnimal.find({ key: { $in: animalKeys } }).lean();
      for (const it of cutItems) {
        const animal = animals.find((a) => a.key === it.animalKey);
        const part = animal?.bodyParts?.find((p) => p.key === it.partKey);
        const cut = part?.cuts?.find((c) => String(c._id) === String(it.cutId));
        if (!cut) continue;
        io.emit("meat_stock_updated", {
          itemType: "cut",
          animalKey: it.animalKey,
          partKey: it.partKey,
          cutId: String(it.cutId),
          soldByWeight: it.soldByWeight,
          stockKg: cut.stockKg,
          isActive: cut.isActive,
        });
      }
    }

    if (organItems.length) {
      const organs = await MeatInternalOrgan.find({ _id: { $in: organItems.map((i) => i.cutId) } }).lean();
      for (const it of organItems) {
        const organ = organs.find((o) => String(o._id) === String(it.cutId));
        if (!organ) continue;
        io.emit("meat_stock_updated", {
          itemType: "organ",
          animalKey: it.animalKey,
          partKey: it.partKey,
          cutId: String(it.cutId),
          soldByWeight: false,
          stockKg: organ.weightKg,
          isActive: organ.isActive,
        });
      }
    }

    if (groundItems.length) {
      const products = await MeatGroundProduct.find({ _id: { $in: groundItems.map((i) => i.cutId) } }).lean();
      for (const it of groundItems) {
        const product = products.find((p) => String(p._id) === String(it.cutId));
        if (!product) continue;
        io.emit("meat_stock_updated", {
          itemType: "ground",
          animalKey: it.animalKey,
          partKey: it.partKey,
          cutId: String(it.cutId),
          soldByWeight: true,
          stockKg: product.stockKg,
          isActive: product.isActive,
        });
      }
    }
  } catch (err) {
    console.error("[MeatOrder] emitStockUpdates xətası:", err.message);
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

    // İstifadəçinin ödənişi tamamlanmamış əvvəlki cəhdləri (bağlanmış Epoint
    // tabı, şəbəkə xətası və s.) varsa, yeni sifariş yaratmazdan öncə onların
    // kilidlədiyi stoku sərbəst burax — əks halda tam hissə kəsimləri (TT3 kimi)
    // heç vaxt ödənilməmiş cəhd üzündən həmişəlik "mövcud deyil" qalır.
    await releaseStaleMeatOrders({ userId: req.userId });

    const resolved = await resolveItems(items);
    const applied = await decrementStock(resolved);

    const itemsTotal = Math.round(resolved.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
    const deliveryFee = await resolveDeliveryFee(deliveryLocation?.countryCode, deliveryLocation?.cityKey);
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

    await emitStockUpdates(applied);

    return success(res, { order }, "Sifariş yaradıldı.", 201);
  } catch (err) {
    console.error("[MeatOrder] createMeatOrder xətası:", err.message);
    return error(res, err.message || "Sifariş yaradıla bilmədi.", err.statusCode || 500, err.unavailableItems || null);
  }
};

// GET /api/meat/orders/my
const getMyMeatOrders = async (req, res) => {
  try {
    const orders = await MeatOrder.find({
      user: req.userId,
      $nor: [
        // Epoint ödənişi təsdiqlənmədən tərk edilmiş sifarişlər gizlədilir
        { "payment.method": "epoint", "payment.status": "failed",  status: "awaiting_payment" },
        { "payment.method": "epoint", "payment.status": "pending", status: "awaiting_payment" },
        // releaseStaleMeatOrders() tərəfindən ləğv edilmiş (ödənişi heç vaxt
        // təsdiqlənməmiş) sifarişlər — bunlar da "awaiting_payment" kimi gizli qalmalıdır
        { "payment.method": "epoint", "payment.status": "failed", stockReleased: true },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();
    await attachCutImages(orders, req);
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
    await attachCutImages([order], req);
    return success(res, { order });
  } catch (err) {
    console.error("[MeatOrder] getMeatOrderById xətası:", err.message);
    return error(res, "Sifariş yüklənə bilmədi.", 500);
  }
};

module.exports = { createMeatOrder, getMyMeatOrders, getMeatOrderById, releaseStaleMeatOrders, attachCutImages };
