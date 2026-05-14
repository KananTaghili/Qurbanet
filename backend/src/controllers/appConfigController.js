const Category = require("../models/Category");
const DeliveryOption = require("../models/DeliveryOption");
const CharityOption = require("../models/CharityOption");
const { success, error } = require("../utils/response");

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const fixMediaUrl = (url, req) => {
  if (!url) return url;
  const baseUrl = getBaseUrl(req);
  return url.replace(/https?:\/\/[^/]+/, baseUrl);
};

const withFixedCategoryUrls = (category, req) => {
  const obj = category.toObject ? category.toObject() : { ...category };
  obj.imageUrl = fixMediaUrl(obj.imageUrl, req);
  obj.videoUrl = fixMediaUrl(obj.videoUrl, req);
  return obj;
};

const withFixedCharityUrls = (charityOption, req) => {
  const obj = charityOption.toObject
    ? charityOption.toObject()
    : { ...charityOption };
  obj.imageUrl = fixMediaUrl(obj.imageUrl, req);
  obj.videoUrl = fixMediaUrl(obj.videoUrl, req);
  return obj;
};

const withFixedDeliveryUrls = (deliveryOption, req) => {
  const obj = deliveryOption.toObject
    ? deliveryOption.toObject()
    : { ...deliveryOption };
  return obj;
};

/**
 * GET /api/app-config
 * Fetch all configuration data needed by mobile app
 * Includes: Categories, Delivery Options, Charity Options
 */
const getAppConfig = async (req, res) => {
  try {
    // Fetch all data in parallel
    const [categories, deliveryOptions, charityOptions] = await Promise.all([
      Category.find({ isActive: true }).sort({ createdAt: 1 }),
      DeliveryOption.find({ isActive: true })
        .populate("categorySpecificPrices.categoryId", "nameAz type")
        .sort({ key: 1 }),
      CharityOption.find({ isActive: true }).sort({
        sortOrder: 1,
        createdAt: 1,
      }),
    ]);

    return success(res, {
      categories: categories.map((c) => withFixedCategoryUrls(c, req)),
      deliveryOptions: deliveryOptions.map((d) =>
        withFixedDeliveryUrls(d, req),
      ),
      charityOptions: charityOptions.map((c) => withFixedCharityUrls(c, req)),
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("App config yüklənmədi:", err);
    return error(res, "Konfiqurasiya yüklənmədi.", 500);
  }
};

/**
 * GET /api/app-config/categories
 * Fetch only categories with pricing information
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      createdAt: 1,
    });

    return success(res, {
      categories: categories.map((c) => withFixedCategoryUrls(c, req)),
    });
  } catch (err) {
    console.error("Kateqoriyalar yüklənmədi:", err);
    return error(res, "Kateqoriyalar yüklənmədi.", 500);
  }
};

/**
 * GET /api/app-config/delivery-options
 * Fetch only delivery options
 */
const getDeliveryOptions = async (req, res) => {
  try {
    const deliveryOptions = await DeliveryOption.find({ isActive: true })
      .populate("categorySpecificPrices.categoryId", "nameAz type")
      .sort({ key: 1 });

    return success(res, {
      deliveryOptions: deliveryOptions.map((d) =>
        withFixedDeliveryUrls(d, req),
      ),
    });
  } catch (err) {
    console.error("Çatdırma seçimləri yüklənmədi:", err);
    return error(res, "Çatdırma seçimləri yüklənmədi.", 500);
  }
};

/**
 * GET /api/app-config/charity-options
 * Fetch only charity options
 */
const getCharityOptions = async (req, res) => {
  try {
    const charityOptions = await CharityOption.find({
      isActive: true,
    }).sort({ sortOrder: 1, createdAt: 1 });

    return success(res, {
      charityOptions: charityOptions.map((c) => withFixedCharityUrls(c, req)),
    });
  } catch (err) {
    console.error("Xeyriyyə seçimləri yüklənmədi:", err);
    return error(res, "Xeyriyyə seçimləri yüklənmədi.", 500);
  }
};

module.exports = {
  getAppConfig,
  getCategories,
  getDeliveryOptions,
  getCharityOptions,
};
