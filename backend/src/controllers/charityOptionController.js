const CharityOption = require("../models/CharityOption");
const { success, error } = require("../utils/response");
const { uploadBuffer } = require("../utils/gridfs");

const getBaseUrl = (req) =>
  process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

const fileIdToUrl = (fileId, req) => {
  if (!fileId) return null;
  return `${getBaseUrl(req)}/api/files/${fileId}`;
};

const ensureDefaultCharityOptions = async () => {
  const existingCount = await CharityOption.countDocuments({});
  if (existingCount > 0) return;

  const defaults = [
    {
      key: "qocalar_evi",
      nameAz: "Qocalar Evi",
      icon: "👵",
      description: "Yaşlı insanlar üçün qurbani ət",
      minDonationAmount: 0,
      sortOrder: 1,
      isActive: true,
    },
    {
      key: "usaqlar_evi",
      nameAz: "Uşaqlar Evi",
      icon: "🏫",
      description: "Evsiz uşaqlar üçün qurbani ət",
      minDonationAmount: 0,
      sortOrder: 2,
      isActive: true,
    },
    {
      key: "ehtiyac_sahibleri",
      nameAz: "Ehtiyac Sahibleri",
      icon: "🤲",
      description: "Ehtiyac sahiblərə qurbani ət",
      minDonationAmount: 0,
      sortOrder: 3,
      isActive: true,
    },
  ];

  await CharityOption.insertMany(defaults);
};

const uploadMediaToGridFS = async (req, target) => {
  if (req.files?.image?.[0]) {
    const f = req.files.image[0];
    target.imageFileId = await uploadBuffer(f.buffer, f.originalname, f.mimetype);
    target.imageUrl = null;
  }
  if (req.files?.video?.[0]) {
    const f = req.files.video[0];
    target.videoFileId = await uploadBuffer(f.buffer, f.originalname, f.mimetype);
    target.videoUrl = null;
  }
};

const withFixedUrls = (charityOption, req) => {
  const obj = charityOption.toObject ? charityOption.toObject() : { ...charityOption };
  if (obj.imageFileId) obj.imageUrl = fileIdToUrl(obj.imageFileId, req);
  if (obj.videoFileId) obj.videoUrl = fileIdToUrl(obj.videoFileId, req);
  return obj;
};

const listCharityOptions = async (req, res) => {
  try {
    await ensureDefaultCharityOptions();
    const options = await CharityOption.find({}).sort({ sortOrder: 1, createdAt: 1 });
    return success(res, { charityOptions: options.map((o) => withFixedUrls(o, req)) });
  } catch (err) {
    console.error("Xeyriyyə seçimləri yüklənmədi:", err);
    return error(res, "Xeyriyyə seçimləri yüklənmədi.", 500);
  }
};

const createCharityOption = async (req, res) => {
  try {
    const { key, nameAz, nameEn, nameRu, nameAr, icon, description, content, minDonationAmount, sortOrder, isActive } = req.body;

    if (!key || !nameAz) return error(res, "Açar və ad tələb olunur.", 400);

    const exists = await CharityOption.findOne({ key });
    if (exists) return error(res, "Bu açar artıq mövcuddur.", 409);

    const payload = {
      key: key.toLowerCase().trim(),
      nameAz: nameAz.trim(),
      nameEn: (nameEn || "").trim(),
      nameRu: (nameRu || "").trim(),
      nameAr: (nameAr || "").trim(),
      icon: icon || "🤲",
      description: description ? description.trim() : "",
      content: content ? content.trim() : "",
      minDonationAmount: typeof minDonationAmount === "number" && minDonationAmount >= 0 ? minDonationAmount : 0,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      isActive: isActive !== false,
    };

    await uploadMediaToGridFS(req, payload);

    const option = await CharityOption.create(payload);

    const { getIo } = require("../socket");
    try { getIo().emit("charity_options_updated", {}); } catch (_) {}

    return success(res, { charityOption: withFixedUrls(option, req) }, "Xeyriyyə seçimi yaradıldı.", 201);
  } catch (err) {
    console.error("Xeyriyyə seçimi yaradılmadı:", err);
    return error(res, "Xeyriyyə seçimi yaradılmadı.", 500);
  }
};

const updateCharityOption = async (req, res) => {
  try {
    const option = await CharityOption.findById(req.params.charityId);
    if (!option) return error(res, "Xeyriyyə seçimi tapılmadı.", 404);

    const { nameAz, nameEn, nameRu, nameAr, icon, description, content, minDonationAmount, sortOrder, isActive } = req.body;

    if (nameAz) option.nameAz = nameAz.trim();
    if (nameEn !== undefined) option.nameEn = (nameEn || "").trim();
    if (nameRu !== undefined) option.nameRu = (nameRu || "").trim();
    if (nameAr !== undefined) option.nameAr = (nameAr || "").trim();
    if (icon) option.icon = icon;
    if (description !== undefined) option.description = description.trim();
    if (content !== undefined) option.content = content.trim();
    if (typeof minDonationAmount === "number" && minDonationAmount >= 0) option.minDonationAmount = minDonationAmount;
    if (typeof sortOrder === "number") option.sortOrder = sortOrder;
    if (typeof isActive === "boolean") option.isActive = isActive;

    await uploadMediaToGridFS(req, option);

    await option.save();

    const { getIo } = require("../socket");
    try { getIo().emit("charity_options_updated", {}); } catch (_) {}

    return success(res, { charityOption: withFixedUrls(option, req) }, "Xeyriyyə seçimi yeniləndi.");
  } catch (err) {
    console.error("Xeyriyyə seçimi yenilənmədi:", err);
    return error(res, "Xeyriyyə seçimi yenilənmədi.", 500);
  }
};

const deleteCharityOption = async (req, res) => {
  try {
    const option = await CharityOption.findById(req.params.charityId);
    if (!option) return error(res, "Xeyriyyə seçimi tapılmadı.", 404);

    await CharityOption.deleteOne({ _id: option._id });

    const { getIo } = require("../socket");
    try { getIo().emit("charity_options_updated", {}); } catch (_) {}

    return success(res, {}, "Xeyriyyə seçimi silindi.");
  } catch (err) {
    console.error("Xeyriyyə seçimi silinmədi:", err);
    return error(res, "Xeyriyyə seçimi silinmədi.", 500);
  }
};

module.exports = {
  listCharityOptions,
  createCharityOption,
  updateCharityOption,
  deleteCharityOption,
};
