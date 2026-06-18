const Category = require("../models/Category");
const CharityCampaign = require("../models/CharityCampaign");
const { uploadBuffer, deleteFile } = require("../utils/gridfs");
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

const getBaseUrl = (req) =>
  process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

const fileIdToUrl = (fileId, req) => {
  if (!fileId) return null;
  return `${getBaseUrl(req)}/api/files/${fileId}`;
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
    nameEn: (body.nameEn || "").trim(),
    nameRu: (body.nameRu || "").trim(),
    nameAr: (body.nameAr || "").trim(),
    description: (body.description || "").trim(),
    emoji: getAnimalEmoji(
      body.type || body.nameAz,
      (body.emoji || "🐑").trim(),
    ),
    weightRange: (body.weightRange || "").trim(),
    charityEnabled:   toBool(body.charityEnabled ?? false),
    charityWeightKey: (body.charityWeightKey || "").trim(),
    imageUrl:     (body.imageUrl     || "").trim(),
    imageHomeUrl: (body.imageHomeUrl || "").trim(),
    videoUrl:     (body.videoUrl     || "").trim(),
    imageFileId:     body.imageFileId     || undefined,
    imageHomeFileId: body.imageHomeFileId || undefined,
    videoFileId:     body.videoFileId     || undefined,
    pricePerShare: Number(body.pricePerShare) || 0,
    totalShares: Number(body.totalShares || 1),
    isActive: toBool(body.isActive),
    weightOptions: parseArray(body.weightOptions),
    hasHeadOption: toBool(body.hasHeadOption ?? true),
    headOptions: parseArray(body.headOptions),
    hasFeetOption: toBool(body.hasFeetOption ?? true),
    feetOptions: parseArray(body.feetOptions),
    cutStyleOptions: parseArray(body.cutStyleOptions),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    serikliEnabled: toBool(body.serikliEnabled ?? false),
    hasPortionSplit: toBool(body.hasPortionSplit ?? true),
    maxPortionSplit:
      body.maxPortionSplit !== undefined &&
      body.maxPortionSplit !== "" &&
      body.maxPortionSplit !== null
        ? Number(body.maxPortionSplit)
        : null,
    deliveryFee: Number(body.deliveryFee) >= 0 ? Number(body.deliveryFee) : 0,
    maxQuantity: Number.isFinite(Number(body.maxQuantity)) && Number(body.maxQuantity) >= 1
      ? Number(body.maxQuantity)
      : 1,
  };

  if (!payload.nameAz) {
    return { valid: false, message: "Kateqoriya adı tələb olunur." };
  }
  if (!Number.isFinite(payload.totalShares) || payload.totalShares < 1) {
    return { valid: false, message: "Hissə sayı ən az 1 olmalıdır." };
  }

  return { valid: true, payload };
};

const uploadMediaToGridFS = async (req, payload) => {
  if (req.files?.image?.[0]) {
    const f = req.files.image[0];
    const fileId = await uploadBuffer(f.buffer, f.originalname, f.mimetype);
    payload.imageFileId = fileId;
    payload.imageUrl = null;
  }
  if (req.files?.imageHome?.[0]) {
    const f = req.files.imageHome[0];
    const fileId = await uploadBuffer(f.buffer, f.originalname, f.mimetype);
    payload.imageHomeFileId = fileId;
    payload.imageHomeUrl = null;
  }
  if (req.files?.video?.[0]) {
    const f = req.files.video[0];
    const fileId = await uploadBuffer(f.buffer, f.originalname, f.mimetype);
    payload.videoFileId = fileId;
    payload.videoUrl = null;
  }
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
  if (obj.imageFileId)     obj.imageUrl     = fileIdToUrl(obj.imageFileId,     req);
  if (obj.imageHomeFileId) obj.imageHomeUrl  = fileIdToUrl(obj.imageHomeFileId, req);
  if (obj.videoFileId)     obj.videoUrl      = fileIdToUrl(obj.videoFileId,     req);
  return obj;
};

const listCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find({}).sort({ sortOrder: 1, createdAt: 1 });
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
    try { await uploadMediaToGridFS(req, input); } catch (mediaErr) {
      console.error("[CATEGORY CREATE] Media yükləmə xətası (keçilir):", mediaErr.message);
    }
    const parsed = parseCategoryPayload(input);
    if (!parsed.valid) return error(res, parsed.message, 400);

    const exists = await Category.findOne({ type: parsed.payload.type });
    if (exists) {
      parsed.payload.type = `${parsed.payload.type}_${Date.now()}`;
    }

    const category = await Category.create(parsed.payload);
    const { getIo } = require("../socket");
    try { getIo().emit("category_updated", {}); } catch (_) {}
    return success(res, { category: withFixedUrls(category, req) }, "Kateqoriya yaradıldı.", 201);
  } catch (err) {
    console.error("[CATEGORY CREATE] Xəta:", err.message, err.errors || "");
    const detail = process.env.NODE_ENV !== "production" ? ` (${err.message})` : "";
    return error(res, `Kateqoriya yaradılmadı.${detail}`, 500);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return error(res, "Kateqoriya tapılmadı.", 404);

    const bodyKeys = Object.keys(req.body || {});
    const isToggleOnly =
      !req.files && bodyKeys.length === 1 && bodyKeys[0] === "isActive";

    // Fast path for Active/Passive toggles to avoid accidental type rewrites.
    if (isToggleOnly) {
      const activating = toBool(req.body.isActive);
      if (activating && (!category.pricePerShare || category.pricePerShare <= 0)) {
        return error(res, "Qiymət 0 olduğu üçün kateqoriya aktiv edilə bilməz.", 400);
      }
      category.isActive = activating;
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

    if (!req.body?.type) {
      input.type = category.type;
    }

    try { await uploadMediaToGridFS(req, input); } catch (mediaErr) {
      console.error("[CATEGORY UPDATE] Media yükləmə xətası (keçilir):", mediaErr.message);
    }

    const parsed = parseCategoryPayload(input);
    if (!parsed.valid) return error(res, parsed.message, 400);

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

    // Sync image URLs to all campaigns that reference this animal
    try {
      const fixedCat = withFixedUrls(category, req);
      const newImage     = fixedCat.imageUrl    || "";
      const newImageHome = fixedCat.imageHomeUrl || newImage;
      await CharityCampaign.updateMany(
        { "animal.id": category._id },
        { $set: { "animal.image": newImage, "animal.imageHome": newImageHome } },
      );
    } catch (syncErr) {
      console.error("[CATEGORY UPDATE] Kampaniya şəkli sinxronizasiyası uğursuz:", syncErr.message);
    }

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
    console.error("[CATEGORY UPDATE] Xəta:", err.message, err.errors || "");
    const detail = process.env.NODE_ENV !== "production" ? ` (${err.message})` : "";
    return error(res, `Kateqoriya yenilənmədi.${detail}`, 500);
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
