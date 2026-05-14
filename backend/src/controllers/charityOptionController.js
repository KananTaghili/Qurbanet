const CharityOption = require("../models/CharityOption");
const { success, error } = require("../utils/response");
const fs = require("fs");
const path = require("path");

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const fixMediaUrl = (url, req) => {
  if (!url) return url;
  const baseUrl = getBaseUrl(req);
  return url.replace(/https?:\/\/[^/]+/, baseUrl);
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

const applyUploadedMedia = (req, payload) => {
  if (req.files?.image?.[0]) {
    payload.imageUrl = `/uploads/charity-options/${req.files.image[0].filename}`;
  }
  if (req.files?.video?.[0]) {
    payload.videoUrl = `/uploads/charity-options/${req.files.video[0].filename}`;
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

const withFixedUrls = (charityOption, req) => {
  const obj = charityOption.toObject
    ? charityOption.toObject()
    : { ...charityOption };
  obj.imageUrl = fixMediaUrl(obj.imageUrl, req);
  obj.videoUrl = fixMediaUrl(obj.videoUrl, req);
  return obj;
};

const listCharityOptions = async (req, res) => {
  try {
    await ensureDefaultCharityOptions();
    const options = await CharityOption.find({}).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    return success(res, {
      charityOptions: options.map((o) => withFixedUrls(o, req)),
    });
  } catch (err) {
    console.error("Xeyriyyə seçimləri yüklənmədi:", err);
    return error(res, "Xeyriyyə seçimləri yüklənmədi.", 500);
  }
};

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
      cleanupFiles(req);
      return error(res, "Açar və ad tələb olunur.", 400);
    }

    const exists = await CharityOption.findOne({ key });
    if (exists) {
      cleanupFiles(req);
      return error(res, "Bu açar artıq mövcuddur.", 409);
    }

    const payload = {
      key: key.toLowerCase().trim(),
      nameAz: nameAz.trim(),
      icon: icon || "🤲",
      description: description ? description.trim() : "",
      content: content ? content.trim() : "",
      minDonationAmount:
        typeof minDonationAmount === "number" && minDonationAmount >= 0
          ? minDonationAmount
          : 0,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      isActive: isActive !== false,
    };

    applyUploadedMedia(req, payload);

    const option = await CharityOption.create(payload);

    const { getIo } = require("../socket");
    try {
      getIo().emit("charity_options_updated", {});
    } catch (_) {}

    return success(
      res,
      { charityOption: withFixedUrls(option, req) },
      "Xeyriyyə seçimi yaradıldı.",
      201,
    );
  } catch (err) {
    cleanupFiles(req);
    console.error("Xeyriyyə seçimi yaradılmadı:", err);
    return error(res, "Xeyriyyə seçimi yaradılmadı.", 500);
  }
};

const updateCharityOption = async (req, res) => {
  try {
    const {
      nameAz,
      icon,
      description,
      content,
      minDonationAmount,
      sortOrder,
      isActive,
    } = req.body;

    const option = await CharityOption.findById(req.params.charityId);
    if (!option) {
      cleanupFiles(req);
      return error(res, "Xeyriyyə seçimi tapılmadı.", 404);
    }

    if (nameAz) option.nameAz = nameAz.trim();
    if (icon) option.icon = icon;
    if (description !== undefined) option.description = description.trim();
    if (content !== undefined) option.content = content.trim();
    if (typeof minDonationAmount === "number" && minDonationAmount >= 0) {
      option.minDonationAmount = minDonationAmount;
    }
    if (typeof sortOrder === "number") option.sortOrder = sortOrder;
    if (typeof isActive === "boolean") option.isActive = isActive;

    applyUploadedMedia(req, option.toObject());
    if (req.files?.image?.[0]) {
      option.imageUrl = `/uploads/charity-options/${req.files.image[0].filename}`;
    }
    if (req.files?.video?.[0]) {
      option.videoUrl = `/uploads/charity-options/${req.files.video[0].filename}`;
    }

    await option.save();

    const { getIo } = require("../socket");
    try {
      getIo().emit("charity_options_updated", {});
    } catch (_) {}

    return success(
      res,
      { charityOption: withFixedUrls(option, req) },
      "Xeyriyyə seçimi yeniləndi.",
    );
  } catch (err) {
    cleanupFiles(req);
    console.error("Xeyriyyə seçimi yenilənmədi:", err);
    return error(res, "Xeyriyyə seçimi yenilənmədi.", 500);
  }
};

const deleteCharityOption = async (req, res) => {
  try {
    const option = await CharityOption.findById(req.params.charityId);
    if (!option) {
      return error(res, "Xeyriyyə seçimi tapılmadı.", 404);
    }

    await CharityOption.deleteOne({ _id: option._id });

    const { getIo } = require("../socket");
    try {
      getIo().emit("charity_options_updated", {});
    } catch (_) {}

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
