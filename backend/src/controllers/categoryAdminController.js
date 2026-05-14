const fs = require("fs");
const path = require("path");
const Category = require("../models/Category");
const { ANIMALS } = require("../config/constants");
const { success, error } = require("../utils/response");

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

const toBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return true;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
};

const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

// Replace stored host with actual request host so mobile/admin always get correct URLs
const fixMediaUrl = (url, req) => {
  if (!url) return url;
  const baseUrl = getBaseUrl(req);
  return url.replace(/https?:\/\/[^/]+/, baseUrl);
};

const getAnimalEmoji = (animalType, emoji) => {
  if (normalizeType(animalType) === "quzu") return "🐑";
  if (normalizeType(animalType) === "qoc") return "🐏";
  if (normalizeType(animalType) === "keci") return "🐐";
  return emoji || "🐑";
};

const parseCategoryPayload = (body) => {
  const payload = {
    type: normalizeType(body.type || body.nameAz),
    nameAz: (body.nameAz || "").trim(),
    description: (body.description || "").trim(),
    emoji: getAnimalEmoji(
      body.type || body.nameAz,
      (body.emoji || "🐑").trim(),
    ),
    weightRange: (body.weightRange || "").trim(),
    imageUrl: (body.imageUrl || "").trim(),
    videoUrl: (body.videoUrl || "").trim(),
    pricePerShare: Number(body.pricePerShare),
    totalShares: Number(body.totalShares || 1),
    isActive: toBool(body.isActive),
    // Yeni sahələr:
    weightOptions: parseArray(body.weightOptions),
    hasHeadOption: toBool(body.hasHeadOption ?? true),
    headFee: Number(body.headFee || 0),
    headProcessingFee: Number(body.headProcessingFee || 0),
    hasFeetOption: toBool(body.hasFeetOption ?? true),
    feetFee: Number(body.feetFee || 0),
    feetProcessingFee: Number(body.feetProcessingFee || 0),
    cutStyleOptions: parseArray(body.cutStyleOptions),
  };

  if (!payload.nameAz) {
    return { valid: false, message: "Kateqoriya adı tələb olunur." };
  }
  if (!Number.isFinite(payload.pricePerShare) || payload.pricePerShare <= 0) {
    return { valid: false, message: "Qiymət düzgün daxil edilməyib." };
  }
  if (!Number.isFinite(payload.totalShares) || payload.totalShares < 1) {
    return { valid: false, message: "Hissə sayı ən az 1 olmalıdır." };
  }

  return { valid: true, payload };
};

const applyUploadedMedia = (req, payload) => {
  // Store relative path — host gets resolved dynamically in list endpoints
  if (req.files?.image?.[0]) {
    payload.imageUrl = `/uploads/categories/${req.files.image[0].filename}`;
  }
  if (req.files?.video?.[0]) {
    payload.videoUrl = `/uploads/categories/${req.files.video[0].filename}`;
  }
};

const cleanupFiles = (req) => {
  if (!req.files) return;
  Object.values(req.files)
    .flat()
    .forEach((f) => {
      if (f?.path) fs.unlink(f.path, () => {});
    });
};

const ensureDefaultCategories = async () => {
  // Seed defaults only when collection is empty.
  // Otherwise admin deletions would get re-created on every list call.
  const existingCount = await Category.countDocuments({});
  if (existingCount > 0) return;

  const existingCategories = await Category.find({}).select("type").lean();
  const existingTypes = new Set(
    existingCategories.map((item) => normalizeType(item.type)),
  );

  const missingDefaults = Object.values(ANIMALS)
    .filter((animal) => !existingTypes.has(normalizeType(animal.type)))
    .map((animal) => ({
      type: normalizeType(animal.type),
      nameAz: animal.nameAz,
      emoji: animal.emoji || "🐑",
      description: animal.description,
      imageUrl: "",
      videoUrl: "",
      pricePerShare: animal.pricePerShare,
      totalShares: animal.totalShares || 1,
      isActive: true,
    }));

  if (missingDefaults.length) {
    await Category.insertMany(missingDefaults);
  }
};

const withFixedUrls = (category, req) => {
  const obj = category.toObject ? category.toObject() : { ...category };
  obj.emoji = getAnimalEmoji(obj.type, obj.emoji);
  obj.imageUrl = fixMediaUrl(obj.imageUrl, req);
  obj.videoUrl = fixMediaUrl(obj.videoUrl, req);
  return obj;
};

const listCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find({}).sort({ createdAt: 1 });
    return success(res, {
      categories: categories.map((c) => withFixedUrls(c, req)),
    });
  } catch (err) {
    return error(res, "Kateqoriyalar yüklənmədi.", 500);
  }
};

const createCategory = async (req, res) => {
  try {
    const input = { ...req.body };
    applyUploadedMedia(req, input);
    const parsed = parseCategoryPayload(input);
    if (!parsed.valid) {
      cleanupFiles(req);
      return error(res, parsed.message, 400);
    }

    const exists = await Category.findOne({ type: parsed.payload.type });
    if (exists) {
      // Append a timestamp suffix to avoid collision
      parsed.payload.type = `${parsed.payload.type}_${Date.now()}`;
    }

    const category = await Category.create(parsed.payload);
    const { getIo } = require("../socket");
    try {
      getIo().emit("category_updated", {});
    } catch (_) {}
    return success(
      res,
      { category: withFixedUrls(category, req) },
      "Kateqoriya yaradıldı.",
      201,
    );
  } catch (err) {
    cleanupFiles(req);
    return error(res, "Kateqoriya yaradılmadı.", 500);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      cleanupFiles(req);
      return error(res, "Kateqoriya tapılmadı.", 404);
    }

    const bodyKeys = Object.keys(req.body || {});
    const isToggleOnly =
      !req.files && bodyKeys.length === 1 && bodyKeys[0] === "isActive";

    // Fast path for Active/Passive toggles to avoid accidental type rewrites.
    if (isToggleOnly) {
      category.isActive = toBool(req.body.isActive);
      await category.save();

      const { getIo } = require("../socket");
      try {
        getIo().emit("category_updated", {});
      } catch (_) {}

      return success(
        res,
        { category: withFixedUrls(category, req) },
        "Kateqoriya statusu yeniləndi.",
      );
    }

    const input = {
      ...category.toObject(),
      ...req.body,
    };

    // Keep canonical type stable unless an explicit type is sent.
    if (!req.body?.type) {
      input.type = category.type;
    }

    applyUploadedMedia(req, input);

    const parsed = parseCategoryPayload(input);
    if (!parsed.valid) {
      cleanupFiles(req);
      return error(res, parsed.message, 400);
    }

    // Allow same type for this doc, but check conflict with others
    const conflict = await Category.findOne({
      type: parsed.payload.type,
      _id: { $ne: category._id },
    });
    if (conflict) {
      parsed.payload.type = `${parsed.payload.type}_${Date.now()}`;
    }

    Object.assign(category, parsed.payload);
    await category.save();

    const { getIo } = require("../socket");
    try {
      getIo().emit("category_updated", {});
    } catch (_) {}

    return success(
      res,
      { category: withFixedUrls(category, req) },
      "Kateqoriya yeniləndi.",
    );
  } catch (err) {
    cleanupFiles(req);
    return error(res, "Kateqoriya yenilənmədi.", 500);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return error(res, "Kateqoriya tapılmadı.", 404);

    await Category.deleteOne({ _id: category._id });
    const { getIo } = require("../socket");
    try {
      getIo().emit("category_updated", {});
    } catch (_) {}
    return success(res, {}, "Kateqoriya silindi.");
  } catch (err) {
    return error(res, "Kateqoriya silinmədi.", 500);
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
