/**
 * appConfigController.js
 *
 * Admin tərəfindən idarə olunan tənzimləmələr:
 *  - Xeyriyyə seçimləri (CharityOption)
 *  - Çatdırılma seçimləri (DeliveryOption)
 *
 * Mobil tətbiq bu endpointlərdən real-time məlumat alır.
 */

const CharityOption = require("../models/CharityOption");
const DeliveryOption = require("../models/DeliveryOption");
const { success, error } = require("../utils/response");

// ═══════════════════════════════════════════════════════════════════
//  XEYRİYYƏ SEÇİMLƏRİ
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/app-config/charity-options
 * Mobil: aktiv xeyriyyə seçimlərini gətirir
 */
const getCharityOptions = async (req, res) => {
  try {
    const options = await CharityOption.find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("-__v");
    return success(res, { charityOptions: options });
  } catch (err) {
    console.error("getCharityOptions xətası:", err);
    return error(res, "Xeyriyyə seçimləri yüklənmədi.", 500);
  }
};

/**
 * GET /api/app-config/charity-options/all  (Admin üçün)
 * Bütün xeyriyyə seçimlərini gətirir (aktiv + passiv)
 */
const getAllCharityOptions = async (req, res) => {
  try {
    const options = await CharityOption.find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("-__v");
    return success(res, { charityOptions: options });
  } catch (err) {
    console.error("getAllCharityOptions xətası:", err);
    return error(res, "Xeyriyyə seçimləri yüklənmədi.", 500);
  }
};

/**
 * POST /api/app-config/charity-options  (Admin)
 */
const createCharityOption = async (req, res) => {
  try {
    const {
      key,
      nameAz,
      icon,
      description,
      content,
      minDonationAmount,
      sortOrder,
      isActive,
    } = req.body;

    if (!key || !nameAz) {
      return error(res, "key və nameAz tələb olunur.", 400);
    }

    const exists = await CharityOption.findOne({
      key: key.toLowerCase().trim(),
    });
    if (exists) {
      return error(res, "Bu açar artıq mövcuddur.", 409);
    }

    const option = await CharityOption.create({
      key: key.toLowerCase().trim(),
      nameAz: nameAz.trim(),
      icon: icon || "🤲",
      description: description || "",
      content: content || "",
      minDonationAmount: Number(minDonationAmount) || 0,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
    });

    _emitSocket("charity_options_updated");
    return success(
      res,
      { charityOption: option },
      "Xeyriyyə seçimi yaradıldı.",
      201,
    );
  } catch (err) {
    console.error("createCharityOption xətası:", err);
    return error(res, "Xeyriyyə seçimi yaradılmadı.", 500);
  }
};

/**
 * PUT /api/app-config/charity-options/:optionId  (Admin)
 */
const updateCharityOption = async (req, res) => {
  try {
    const option = await CharityOption.findById(req.params.optionId);
    if (!option) return error(res, "Seçim tapılmadı.", 404);

    const fields = [
      "nameAz",
      "icon",
      "description",
      "content",
      "minDonationAmount",
      "sortOrder",
      "isActive",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) option[f] = req.body[f];
    });

    await option.save();
    _emitSocket("charity_options_updated");
    return success(
      res,
      { charityOption: option },
      "Xeyriyyə seçimi yeniləndi.",
    );
  } catch (err) {
    console.error("updateCharityOption xətası:", err);
    return error(res, "Xeyriyyə seçimi yenilənmədi.", 500);
  }
};

/**
 * DELETE /api/app-config/charity-options/:optionId  (Admin)
 */
const deleteCharityOption = async (req, res) => {
  try {
    const option = await CharityOption.findById(req.params.optionId);
    if (!option) return error(res, "Seçim tapılmadı.", 404);

    await CharityOption.deleteOne({ _id: option._id });
    _emitSocket("charity_options_updated");
    return success(res, {}, "Xeyriyyə seçimi silindi.");
  } catch (err) {
    return error(res, "Silinmədi.", 500);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  ÇATDIRILMA SEÇİMLƏRİ
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/app-config/delivery-options
 * Mobil: aktiv çatdırılma seçimlərini gətirir
 */
const getDeliveryOptions = async (req, res) => {
  try {
    const options = await DeliveryOption.find({})
      .sort({ key: 1 })
      .populate("categorySpecificPrices.categoryId", "nameAz type")
      .populate("applicableCategories", "_id nameAz type")
      .populate("categoryMinimums.categoryId", "_id nameAz type")
      .select("-__v");
    return success(res, { deliveryOptions: options });
  } catch (err) {
    console.error("getDeliveryOptions xətası:", err);
    return error(res, "Çatdırılma seçimləri yüklənmədi.", 500);
  }
};

/**
 * GET /api/app-config/delivery-options/all  (Admin)
 */
const getAllDeliveryOptions = async (req, res) => {
  try {
    const options = await DeliveryOption.find({})
      .sort({ key: 1 })
      .populate("categorySpecificPrices.categoryId", "nameAz type")
      .populate("applicableCategories", "_id nameAz type")
      .populate("categoryMinimums.categoryId", "_id nameAz type")
      .select("-__v");
    return success(res, { deliveryOptions: options });
  } catch (err) {
    console.error("getAllDeliveryOptions xətası:", err);
    return error(res, "Çatdırılma seçimləri yüklənmədi.", 500);
  }
};

/**
 * PUT /api/app-config/delivery-options/:key  (Admin)
 * Çatdırılma seçiminin qiymətini və statusunu yenilə
 */
const updateDeliveryOption = async (req, res) => {
  try {
    const { key } = req.params;
    const { basePrice, labelAz, icon, isActive, description, location } =
      req.body;

    let option = await DeliveryOption.findOne({ key });
    if (!option) return error(res, "Çatdırılma seçimi tapılmadı.", 404);

    if (basePrice !== undefined) option.basePrice = Number(basePrice);
    if (labelAz !== undefined) option.labelAz = labelAz;
    if (icon !== undefined) option.icon = icon;
    if (isActive !== undefined) option.isActive = isActive;
    if (description !== undefined) option.description = description;
    if (location !== undefined) {
      option.location = {
        latitude: location.latitude ? Number(location.latitude) : undefined,
        longitude: location.longitude ? Number(location.longitude) : undefined,
        name: location.name || undefined,
      };
    }
    if (req.body.applicableCategories !== undefined) {
      option.applicableCategories = Array.isArray(req.body.applicableCategories)
        ? req.body.applicableCategories
        : [];
    }
    if (req.body.categoryMinimums !== undefined) {
      option.categoryMinimums = Array.isArray(req.body.categoryMinimums)
        ? req.body.categoryMinimums
        : [];
    }

    await option.save();
    _emitSocket("delivery_options_updated");
    return success(
      res,
      { deliveryOption: option },
      "Çatdırılma seçimi yeniləndi.",
    );
  } catch (err) {
    console.error("updateDeliveryOption xətası:", err);
    return error(res, "Çatdırılma seçimi yenilənmədi.", 500);
  }
};

/**
 * POST /api/app-config/delivery-options/:key/category-price  (Admin)
 * Xüsusi kateqoriya üçün çatdırılma qiyməti təyin et
 */
const setCategoryDeliveryPrice = async (req, res) => {
  try {
    const { key } = req.params;
    const { categoryId, price } = req.body;

    if (!categoryId || price === undefined) {
      return error(res, "categoryId və price tələb olunur.", 400);
    }

    const option = await DeliveryOption.findOne({ key });
    if (!option) return error(res, "Çatdırılma seçimi tapılmadı.", 404);

    const existing = option.categorySpecificPrices.find(
      (p) => p.categoryId.toString() === categoryId,
    );

    if (existing) {
      existing.price = Number(price);
    } else {
      option.categorySpecificPrices.push({ categoryId, price: Number(price) });
    }

    await option.save();
    _emitSocket("delivery_options_updated");
    return success(
      res,
      { deliveryOption: option },
      "Kateqoriya qiyməti təyin edildi.",
    );
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

/**
 * POST /api/app-config/delivery-options/:key/category-minimum  (Admin)
 * Xeyiriyyə seçimi üçün kateqoriyaya görə minimum pay təyin et
 */
const setCategoryMinimum = async (req, res) => {
  try {
    const { key } = req.params;
    const { categoryId, minShares } = req.body;

    if (!categoryId || minShares === undefined) {
      return error(res, "categoryId və minShares tələb olunur.", 400);
    }

    const option = await DeliveryOption.findOne({ key });
    if (!option) return error(res, "Çatdırılma seçimi tapılmadı.", 404);

    const existing = option.categoryMinimums.find(
      (m) => m.categoryId.toString() === categoryId,
    );

    if (existing) {
      existing.minShares = Number(minShares);
    } else {
      option.categoryMinimums.push({
        categoryId,
        minShares: Number(minShares),
      });
    }

    await option.save();
    _emitSocket("delivery_options_updated");
    return success(
      res,
      { deliveryOption: option },
      "Minimum pay təyin edildi.",
    );
  } catch (err) {
    console.error("setCategoryMinimum xətası:", err);
    return error(res, "Server xətası.", 500);
  }
};

/**
 * DELETE /api/app-config/delivery-options/:key/category-minimum/:categoryId  (Admin)
 */
const removeCategoryMinimum = async (req, res) => {
  try {
    const { key, categoryId } = req.params;

    const option = await DeliveryOption.findOne({ key });
    if (!option) return error(res, "Çatdırılma seçimi tapılmadı.", 404);

    option.categoryMinimums = option.categoryMinimums.filter(
      (m) => m.categoryId.toString() !== categoryId,
    );

    await option.save();
    _emitSocket("delivery_options_updated");
    return success(res, {}, "Minimum pay silindi.");
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

/**
 * DELETE /api/app-config/delivery-options/:key/category-price/:categoryId  (Admin)
 */
const removeCategoryDeliveryPrice = async (req, res) => {
  try {
    const { key, categoryId } = req.params;

    const option = await DeliveryOption.findOne({ key });
    if (!option) return error(res, "Çatdırılma seçimi tapılmadı.", 404);

    option.categorySpecificPrices = option.categorySpecificPrices.filter(
      (p) => p.categoryId.toString() !== categoryId,
    );

    await option.save();
    _emitSocket("delivery_options_updated");
    return success(res, {}, "Kateqoriya qiyməti silindi.");
  } catch (err) {
    return error(res, "Server xətası.", 500);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

const _emitSocket = (event) => {
  try {
    const { getIo } = require("../socket");
    getIo().emit(event, {});
  } catch (_) {}
};

module.exports = {
  // Charity
  getCharityOptions,
  getAllCharityOptions,
  createCharityOption,
  updateCharityOption,
  deleteCharityOption,
  // Delivery
  getDeliveryOptions,
  getAllDeliveryOptions,
  updateDeliveryOption,
  setCategoryDeliveryPrice,
  removeCategoryDeliveryPrice,
  setCategoryMinimum,
  removeCategoryMinimum,
};
