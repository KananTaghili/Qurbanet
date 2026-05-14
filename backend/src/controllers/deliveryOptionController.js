const DeliveryOption = require("../models/DeliveryOption");
const Category = require("../models/Category");
const { success, error } = require("../utils/response");

const ensureDefaultDeliveryOptions = async () => {
  const existingCount = await DeliveryOption.countDocuments({});
  if (existingCount > 0) return;

  const defaults = [
    {
      key: "catdirilsin",
      labelAz: "Sizə çatdırılsın",
      icon: "🚚",
      basePrice: 12,
      description: "Sifariş sizin müəyyən etdiyiniz yerə çatdırılacaq",
      isActive: true,
    },
    {
      key: "ozun_gotur",
      labelAz: "Özünüz götürün",
      icon: "🏠",
      basePrice: 0,
      description: "Siz şəxsən sifariş götürə bilərsiniz",
      isActive: true,
    },
    {
      key: "usaqlar_evi",
      labelAz: "Uşaqlar evinə göndər",
      icon: "🏫",
      basePrice: 0,
      description: "Ət ehtiyac sahibi uşaqlar evində bölüşdürülecek",
      isActive: true,
    },
    {
      key: "qocalar_evi",
      labelAz: "Qocalar evinə göndər",
      icon: "👵",
      basePrice: 0,
      description: "Ət ehtiyac sahibi qocalar evində bölüşdürülecek",
      isActive: true,
    },
    {
      key: "ehtiyac_sahibleri",
      labelAz: "Ehtiyac sahiblərinə göndər",
      icon: "🤲",
      basePrice: 20,
      description: "Ət ehtiyac sahiblərə birbaşa çatdırılacaq",
      isActive: true,
    },
  ];

  await DeliveryOption.insertMany(defaults);
};

const listDeliveryOptions = async (req, res) => {
  try {
    await ensureDefaultDeliveryOptions();
    const options = await DeliveryOption.find({ isActive: true })
      .populate("categorySpecificPrices.categoryId", "nameAz type")
      .sort({ key: 1 });

    return success(res, { deliveryOptions: options });
  } catch (err) {
    console.error("Çatdırma seçimləri yüklənmədi:", err);
    return error(res, "Çatdırma seçimləri yüklənmədi.", 500);
  }
};

const createDeliveryOption = async (req, res) => {
  try {
    const { key, labelAz, icon, basePrice, description, isActive } = req.body;

    if (!key || !labelAz) {
      return error(res, "Açar və ad tələb olunur.", 400);
    }

    if (typeof basePrice !== "number" || basePrice < 0) {
      return error(res, "Qiymət düzgün daxil edilməyib.", 400);
    }

    const exists = await DeliveryOption.findOne({ key });
    if (exists) {
      return error(res, "Bu açar artıq mövcuddur.", 409);
    }

    const option = await DeliveryOption.create({
      key: key.toLowerCase().trim(),
      labelAz: labelAz.trim(),
      icon: icon || "🏠",
      basePrice,
      description: description || "",
      isActive: isActive !== false,
    });

    const { getIo } = require("../socket");
    try {
      getIo().emit("delivery_options_updated", {});
    } catch (_) {}

    return success(
      res,
      { deliveryOption: option },
      "Çatdırma seçimi yaradıldı.",
      201,
    );
  } catch (err) {
    console.error("Çatdırma seçimi yaradılmadı:", err);
    return error(res, "Çatdırma seçimi yaradılmadı.", 500);
  }
};

const updateDeliveryOption = async (req, res) => {
  try {
    const { optionId } = req.params;
    const { labelAz, icon, basePrice, description, isActive } = req.body;

    const option = await DeliveryOption.findById(optionId);
    if (!option) {
      return error(res, "Çatdırma seçimi tapılmadı.", 404);
    }

    if (labelAz) option.labelAz = labelAz.trim();
    if (icon) option.icon = icon;
    if (typeof basePrice === "number" && basePrice >= 0) {
      option.basePrice = basePrice;
    }
    if (description) option.description = description.trim();
    if (typeof isActive === "boolean") option.isActive = isActive;

    await option.save();

    const { getIo } = require("../socket");
    try {
      getIo().emit("delivery_options_updated", {});
    } catch (_) {}

    return success(
      res,
      { deliveryOption: option },
      "Çatdırma seçimi yeniləndi.",
    );
  } catch (err) {
    console.error("Çatdırma seçimi yenilənmədi:", err);
    return error(res, "Çatdırma seçimi yenilənmədi.", 500);
  }
};

const setCategorySpecificPrice = async (req, res) => {
  try {
    const { optionId } = req.params;
    const { categoryId, price } = req.body;

    if (!categoryId || typeof price !== "number" || price < 0) {
      return error(res, "Kateqoriya və qiymət tələb olunur.", 400);
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return error(res, "Kateqoriya tapılmadı.", 404);
    }

    const option = await DeliveryOption.findById(optionId);
    if (!option) {
      return error(res, "Çatdırma seçimi tapılmadı.", 404);
    }

    const existing = option.categorySpecificPrices.findIndex(
      (p) => p.categoryId.toString() === categoryId,
    );

    if (existing >= 0) {
      option.categorySpecificPrices[existing].price = price;
    } else {
      option.categorySpecificPrices.push({ categoryId, price });
    }

    await option.save();
    await option.populate("categorySpecificPrices.categoryId", "nameAz type");

    const { getIo } = require("../socket");
    try {
      getIo().emit("delivery_options_updated", {});
    } catch (_) {}

    return success(res, { deliveryOption: option });
  } catch (err) {
    console.error("Kateqoriya spesifik qiymət ayarlanmadı:", err);
    return error(res, "Kateqoriya spesifik qiymət ayarlanmadı.", 500);
  }
};

const removeCategorySpecificPrice = async (req, res) => {
  try {
    const { optionId, categoryId } = req.params;

    const option = await DeliveryOption.findById(optionId);
    if (!option) {
      return error(res, "Çatdırma seçimi tapılmadı.", 404);
    }

    option.categorySpecificPrices = option.categorySpecificPrices.filter(
      (p) => p.categoryId.toString() !== categoryId,
    );

    await option.save();
    await option.populate("categorySpecificPrices.categoryId", "nameAz type");

    const { getIo } = require("../socket");
    try {
      getIo().emit("delivery_options_updated", {});
    } catch (_) {}

    return success(res, { deliveryOption: option });
  } catch (err) {
    console.error("Kateqoriya spesifik qiymət silindi:", err);
    return error(res, "Kateqoriya spesifik qiymət silinmədi.", 500);
  }
};

module.exports = {
  listDeliveryOptions,
  createDeliveryOption,
  updateDeliveryOption,
  setCategorySpecificPrice,
  removeCategorySpecificPrice,
};
