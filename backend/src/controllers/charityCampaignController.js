const CharityCampaign = require("../models/CharityCampaign");
const Category = require("../models/Category");
const AppSettings = require("../models/AppSettings");
const { createPayment, getTransactionStatus, getAzPaymentErrorMessage } = require("../utils/epoint");
const { success, error } = require("../utils/response");
const { parsePagination } = require("../utils/pagination");

const BACKEND_URL  = () => process.env.BACKEND_URL  || "http://localhost:4000";
const FRONTEND_URL = () => process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Yardımçılar ─────────────────────────────────────────────────────────────

// Kateqoriya üçün xeyriyyə standartını (1 dənə çəki+qiymət) çıxarır.
// Çəki aralığı və qiymət qurbanlıqla EYNİ yerdən (Category.weightOptions) idarə olunur.
const getStandardOption = (cat) => {
  const opts = (cat.weightOptions || []).filter((w) => w.isActive !== false && (w.price || 0) > 0);
  if (opts.length) {
    // Admin xeyriyyə üçün konkret çəki seçibsə onu götür, yoxsa birincini
    const chosen = (cat.charityWeightKey && opts.find((w) => w.key === cat.charityWeightKey)) || opts[0];
    return { labelAz: chosen.labelAz || chosen.label || "", price: chosen.price };
  }
  // weightOptions yoxdursa — weightRange + pricePerShare-dən düzəlt
  if (cat.weightRange && (cat.pricePerShare || 0) > 0) {
    return { labelAz: cat.weightRange, price: cat.pricePerShare };
  }
  return null;
};

const categoryImageUrl = (cat) => {
  if (cat.imageFileId) return `${BACKEND_URL()}/api/files/${cat.imageFileId}`;
  if (cat.imageUrl) {
    if (/^https?:\/\//.test(cat.imageUrl)) return cat.imageUrl;
    return `${BACKEND_URL()}${cat.imageUrl.startsWith("/") ? "" : "/"}${cat.imageUrl}`;
  }
  return "";
};

const categoryImageHomeUrl = (cat) => {
  if (cat.imageHomeFileId) return `${BACKEND_URL()}/api/files/${cat.imageHomeFileId}`;
  if (cat.imageHomeUrl) {
    if (/^https?:\/\//.test(cat.imageHomeUrl)) return cat.imageHomeUrl;
    return `${BACKEND_URL()}${cat.imageHomeUrl.startsWith("/") ? "" : "/"}${cat.imageHomeUrl}`;
  }
  return categoryImageUrl(cat);
};

// Aktiv + qiyməti təyin olunmuş kateqoriyalar (hər birinin aktiv açılış sayı ilə)
const getCampaignAnimals = async () => {
  const [cats, countMap] = await Promise.all([
    Category.find({ isActive: true, charityEnabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    getActiveCountByAnimal(),
  ]);
  return cats
    .map((cat) => {
      const std = getStandardOption(cat);
      if (!std) return null;
      return {
        _id:         cat._id,
        nameAz:      cat.nameAz,
        emoji:       cat.emoji || "🐑",
        image:       categoryImageUrl(cat),
        imageHome:   categoryImageHomeUrl(cat),
        weightRange: (std.labelAz || "").split(" — ")[0].trim(),
        price:       std.price,
        activeCount: countMap[String(cat._id)] || 0,
      };
    })
    .filter(Boolean);
};

const getCampaignSettings = async () => {
  const s = await AppSettings.findOne({ singleton: "global" });
  return {
    minOpenPercent:      s?.campaignMinOpenPercent  ?? 30,
    minDonation:            s?.campaignMinDonation             ?? 10,
    allowAnonymous:      s?.campaignAllowAnonymous  !== false,
    allowGuest:          s?.campaignAllowGuest      !== false,
    guestNameRequired:   s?.campaignGuestNameRequired  === true,
    guestPhoneRequired:  s?.campaignGuestPhoneRequired === true,
    nearlyFullPercent:      s?.campaignNearlyFullPercent     ?? 90,
    nearlyFullMinDonation:  s?.campaignNearlyFullMinDonation ?? 1,
    onePerAnimal:           s?.campaignOnePerAnimal          !== false,
    maxPerAnimal:           s?.campaignMaxPerAnimal          ?? 1,
  };
};

// Heyvan (Category) başına aktiv (ödənişi başlamış) açılışların sayı
const getActiveCountByAnimal = async () => {
  const rows = await CharityCampaign.aggregate([
    { $match: { status: "collecting", collectedAmount: { $gt: 0 } } },
    { $group: { _id: "$animal.id", count: { $sum: 1 } } },
  ]);
  const map = {};
  rows.forEach((r) => { map[String(r._id)] = r.count; });
  return map;
};

const recalcCollected = (campaign) => {
  campaign.collectedAmount = campaign.donations
    .filter((d) => d.paymentStatus === "paid")
    .reduce((sum, d) => sum + d.amount, 0);
};

const checkCompletion = (campaign) => {
  if (campaign.status !== "collecting") return;
  // Yalnız tam məbləğ yığılanda tamamlanır
  if (campaign.totalAmount - campaign.collectedAmount <= 0) {
    campaign.status      = "completed";
    campaign.completedAt = new Date();
  }
};

const publicCampaign = (c) => {
  const paidDonations = c.donations.filter((d) => d.paymentStatus === "paid");
  return {
    _id:              c._id,
    campaignNumber:   c.campaignNumber,
    animal:           c.animal,
    totalAmount:      c.totalAmount,
    collectedAmount:  c.collectedAmount,
    remainingAmount:  Math.round(Math.max(0, c.totalAmount - c.collectedAmount) * 100) / 100,
    percent:          Math.min(100, Math.round((c.collectedAmount / c.totalAmount) * 100)),
    participantCount: paidDonations.length,
    status:           c.status,
    completedAt:      c.completedAt,
    createdAt:        c.createdAt,
    opener: {
      name:        c.opener.isAnonymous ? null : c.opener.name,
      isAnonymous: c.opener.isAnonymous,
    },
    donations: paidDonations.map((d) => ({
      _id:         d._id,
      name:        d.isAnonymous ? null : d.name,
      isAnonymous: d.isAnonymous,
      isOpener:    d.isOpener,
      amount:      d.amount,
      percent:     Math.round((d.amount / c.totalAmount) * 100 * 100) / 100,
      note:        d.isAnonymous ? null : d.note,
      paidAt:      d.paidAt,
    })),
    media: c.status === "completed" ? c.media : [],
  };
};

// ─── İstifadəçi endpointləri ─────────────────────────────────────────────────

// GET /api/campaigns  →  aktiv kampaniyalar (yalnız ödənişi başlamış)
exports.getCampaigns = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    // collectedAmount > 0 → açan ən azı ilkin ödənişi edib (ödənilməmiş "kabus" kampaniyalar gizlənir)
    const filter = { status: "collecting", collectedAmount: { $gt: 0 } };
    const total  = await CharityCampaign.countDocuments(filter);
    const items  = await CharityCampaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return success(res, {
      campaigns:  items.map(publicCampaign),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/campaigns/completed  →  tamamlanmış kampaniyalar
exports.getCompletedCampaigns = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const filter = { status: "completed" };
    const total  = await CharityCampaign.countDocuments(filter);
    const items  = await CharityCampaign.find(filter)
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return success(res, {
      campaigns:  items.map(publicCampaign),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/campaigns/:id
exports.getCampaignById = async (req, res) => {
  try {
    const c = await CharityCampaign.findById(req.params.id);
    if (!c) return error(res, "Kampaniya tapılmadı", 404);

    // Public görünən: tamamlanmış VƏ ya ödənişi başlamış aktiv kampaniyalar
    const isPublic =
      c.status === "completed" ||
      (c.status === "collecting" && c.collectedAmount > 0);

    if (!isPublic) {
      // Ləğv edilmiş / ödənilməmiş — yalnız iştirakçı (açan və ya ianəçi) görə bilər
      const uid  = req.userId;
      const mine = uid && c.donations.some(
        (d) => d.userId && String(d.userId) === String(uid),
      );
      if (!mine) return error(res, "Kampaniya tapılmadı", 404);
    }

    return success(res, publicCampaign(c));
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/campaigns/settings  →  public tənzimləmələr + heyvanlar (qurbanlıqla eyni mənbə)
exports.getCampaignSettings = async (req, res) => {
  try {
    const settings = await getCampaignSettings();
    const animals  = await getCampaignAnimals();
    return success(res, { settings, animals });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// GET /api/campaigns/my  →  istifadəçinin kampaniyaları (auth lazım)
exports.getUserCampaigns = async (req, res) => {
  try {
    const userId = req.userId;
    const items  = await CharityCampaign.find({
      "donations.userId": userId,
    }).sort({ createdAt: -1 });

    const isMinePaid = (d) => d.userId && String(d.userId) === String(userId) && d.paymentStatus === "paid";

    // Yalnız istifadəçinin ən azı bir ödənilmiş ianəsi olan kampaniyalar
    const paidItems = items.filter((c) => c.donations.some(isMinePaid));

    const result = paidItems.map((c) => ({
      ...publicCampaign(c),
      iAmOpener: c.donations.some((d) => isMinePaid(d) && d.isOpener),
      myPaidAmount: c.donations.filter(isMinePaid).reduce((s, d) => s + d.amount, 0),
    }));

    return success(res, { campaigns: result });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

// POST /api/campaigns  →  yeni kampaniya aç (opener ödənişi yaradır)
exports.createCampaign = async (req, res) => {
  try {
    const settings = await getCampaignSettings();
    const { animalId, openerName, openerPhone, isAnonymous, amount, note } = req.body;

    if (!animalId || !amount) return error(res, "Heyvan və məbləğ tələb olunur", 400);

    const animal = await Category.findById(animalId);
    if (!animal || !animal.isActive) return error(res, "Heyvan tapılmadı", 404);

    const std = getStandardOption(animal);
    if (!std) return error(res, "Heyvanın qiyməti təyin edilməyib", 400);

    const totalAmount  = std.price;
    const minOpening   = Math.min(
      Math.ceil(Math.round(totalAmount * 100) * settings.minOpenPercent / 100) / 100,
      totalAmount
    );
    const parsedAmount = Number(amount);

    if (parsedAmount < minOpening)
      return error(res, `Minimum açılış məbləği ${minOpening} AZN-dir`, 400);
    if (parsedAmount > totalAmount)
      return error(res, "Ödəniş məbləği heyvanın qiymətindən çox ola bilməz", 400);

    // Qeydiyyatsız istifadəçi icazəsi
    const userId = req.userId || null;
    if (!settings.allowGuest && !userId)
      return error(res, "Kampaniya açmaq üçün qeydiyyat tələb olunur", 403);

    // Hər heyvandan ümumilikdə maksimum N aktiv açılış ola bilər (istifadəçidən asılı deyil)
    if (settings.onePerAnimal) {
      const activeCount = await CharityCampaign.countDocuments({
        "animal.id":     animal._id,
        status:          "collecting",
        collectedAmount: { $gt: 0 },
      });
      if (activeCount >= settings.maxPerAnimal) {
        const msg = settings.maxPerAnimal === 1
          ? "Bu heyvan üçün artıq aktiv açılış var"
          : `Bu heyvan üçün aktiv açılış limiti (${settings.maxPerAnimal}) dolub`;
        return error(res, msg, 400);
      }
    }

    // Anonim yalnız admin icazə veribsə (həm qeydiyyatlı, həm qeydiyyatsız)
    const anon = Boolean(isAnonymous) && settings.allowAnonymous;

    // Qeydiyyatsız istifadəçi üçün admin tələb edən sahələr (anonim deyilsə)
    if (!userId && !anon) {
      if (settings.guestNameRequired  && !String(openerName  || "").trim())
        return error(res, "Ad Soyad tələb olunur", 400);
      if (settings.guestPhoneRequired && !String(openerPhone || "").trim())
        return error(res, "Telefon nömrəsi tələb olunur", 400);
    }

    const campaign = new CharityCampaign({
      status: "pending_payment",
      animal: {
        id:          animal._id,
        nameAz:      animal.nameAz,
        emoji:       animal.emoji || "🐑",
        image:       categoryImageUrl(animal),
        imageHome:   categoryImageHomeUrl(animal),
        weightRange: (std.labelAz || "").split(" — ")[0].trim(),
        price:       totalAmount,
      },
      totalAmount,
      opener: {
        userId:      userId || undefined,
        name:        anon ? "" : (openerName  || ""),
        phone:       anon ? "" : (openerPhone || ""),
        isAnonymous: anon,
        note:        note || "",
      },
    });

    campaign.donations.push({
      userId:      userId || undefined,
      name:        anon ? "" : (openerName  || ""),
      phone:       anon ? "" : (openerPhone || ""),
      isAnonymous: anon,
      isOpener:    true,
      amount:      parsedAmount,
      note:        note || "",
      paymentStatus: "pending",
    });

    await campaign.save();

    const donationId = campaign.donations[0]._id;
    return success(
      res,
      { campaignId: campaign._id, donationId, campaignNumber: campaign.campaignNumber },
      "Kampaniya yaradıldı",
      201,
    );
  } catch (err_) {
    console.error(err_);
    return error(res, err_.message || "Xəta baş verdi", 500);
  }
};

// POST /api/campaigns/:id/donate  →  kampaniyaya ianə əlavə et
exports.addDonation = async (req, res) => {
  try {
    const settings = await getCampaignSettings();
    const campaign  = await CharityCampaign.findById(req.params.id);
    if (!campaign) return error(res, "Kampaniya tapılmadı", 404);
    if (campaign.status !== "collecting")
      return error(res, "Bu kampaniya artıq aktiv deyil", 400);

    const { donorName, donorPhone, isAnonymous, amount, note } = req.body;
    const parsedAmount = Number(amount);

    const remaining      = Math.round((campaign.totalAmount - campaign.collectedAmount) * 100) / 100;
    const completionPct  = campaign.totalAmount > 0
      ? (campaign.collectedAmount / campaign.totalAmount) * 100 : 0;
    const isNearlyFull   = completionPct >= settings.nearlyFullPercent;
    const baseMin        = isNearlyFull ? settings.nearlyFullMinDonation : settings.minDonation;
    const effectiveMin   = Math.min(baseMin, remaining);

    if (parsedAmount < effectiveMin)
      return error(res, `Minimum ianə məbləği ${effectiveMin} AZN-dir`, 400);
    if (parsedAmount > remaining)
      return error(res, `Maksimum ianə məbləği ${remaining} AZN-dir`, 400);

    const userId = req.userId || null;
    if (!settings.allowGuest && !userId)
      return error(res, "İanə etmək üçün qeydiyyat tələb olunur", 403);

    // Anonim yalnız admin icazə veribsə (həm qeydiyyatlı, həm qeydiyyatsız)
    const anon = Boolean(isAnonymous) && settings.allowAnonymous;

    // Qeydiyyatsız istifadəçi üçün admin tələb edən sahələr (anonim deyilsə)
    if (!userId && !anon) {
      if (settings.guestNameRequired  && !String(donorName  || "").trim())
        return error(res, "Ad Soyad tələb olunur", 400);
      if (settings.guestPhoneRequired && !String(donorPhone || "").trim())
        return error(res, "Telefon nömrəsi tələb olunur", 400);
    }

    campaign.donations.push({
      userId:      userId || undefined,
      name:        anon ? "" : (donorName  || ""),
      phone:       anon ? "" : (donorPhone || ""),
      isAnonymous: anon,
      isOpener:    false,
      amount:      parsedAmount,
      note:        note || "",
      paymentStatus: "pending",
    });

    await campaign.save();
    const donation = campaign.donations[campaign.donations.length - 1];

    return success(res, { donationId: donation._id }, "İanə əlavə edildi", 201);
  } catch (err_) {
    console.error(err_);
    return error(res, err_.message || "Xəta baş verdi", 500);
  }
};

// POST /api/campaigns/:id/epoint/start  →  ödənişi başlat
exports.startCampaignPayment = async (req, res) => {
  try {
    const { donationId } = req.body;
    const campaign = await CharityCampaign.findById(req.params.id);
    if (!campaign) return error(res, "Kampaniya tapılmadı", 404);

    const donation = campaign.donations.id(donationId);
    if (!donation) return error(res, "İanə tapılmadı", 404);
    if (donation.paymentStatus === "paid") return error(res, "Bu ödəniş artıq tamamlanıb", 400);

    const qs = `type=campaign&orderId=${campaign._id}&donationId=${donation._id}`;
    const successUrl = `${BACKEND_URL()}/api/epoint/callback/success?${qs}`;
    const errorUrl   = `${BACKEND_URL()}/api/epoint/callback/error?${qs}`;

    const epointOrderId = `xcmp_${campaign._id}_${donation._id}_${Date.now()}`;

    const result = await createPayment({
      orderId:     epointOrderId,
      amount:      donation.amount,
      description: `Xeyriyyə ${campaign.campaignNumber} — ${campaign.animal.nameAz}`,
      successUrl,
      errorUrl,
    });

    donation.epointOrderId = epointOrderId;
    donation.transactionId = result.transaction;
    donation.paymentStatus = "pending";
    await campaign.save();

    return success(res, { redirect_url: result.redirect_url });
  } catch (err_) {
    console.error("[Campaign] startCampaignPayment xətası:", err_.message);
    return error(res, err_.message || "Ödəniş başladıla bilmədi", 500);
  }
};

// ─── Epoint callback (epointController tərəfindən çağırılır) ─────────────────

exports.handleCampaignSuccess = async (campaignId, donationId) => {
  const campaign = await CharityCampaign.findById(campaignId);
  if (!campaign) return { ok: false, redirectUrl: `${FRONTEND_URL()}/charity-campaigns?payment=fail&message=Kampaniya+tapılmadı` };

  const donation = campaign.donations.id(donationId);
  if (!donation) return { ok: false, redirectUrl: `${FRONTEND_URL()}/charity-campaigns?payment=fail&message=İanə+tapılmadı` };

  if (donation.paymentStatus === "paid") {
    const role = donation.isOpener ? "opener" : "donor";
    return { ok: true, redirectUrl: `${FRONTEND_URL()}/charity-campaigns/confirmation?campaignId=${campaign._id}&role=${role}` };
  }

  // get-status ilə yoxla
  const ep = await getTransactionStatus({ transaction: donation.transactionId });

  if (ep?.status === "success") {
    donation.paymentStatus = "paid";
    donation.paidAt        = new Date();
    // İlk uğurlu ödəniş → kampaniya aktiv olur
    if (campaign.status === "pending_payment") campaign.status = "collecting";
    recalcCollected(campaign);
    checkCompletion(campaign);
    await campaign.save();

    const role = donation.isOpener ? "opener" : "donor";
    return { ok: true, redirectUrl: `${FRONTEND_URL()}/charity-campaigns/confirmation?campaignId=${campaign._id}&role=${role}` };
  }

  const msg = getAzPaymentErrorMessage(ep?.code, ep?.message) || "Ödəniş təsdiqlənmədi";
  donation.paymentStatus = "failed";
  await campaign.save();

  const page = "xeyriyye";
  return {
    ok:          false,
    redirectUrl: `${FRONTEND_URL()}/${page}?payment=fail&message=${encodeURIComponent(msg)}`,
  };
};

exports.handleCampaignError = async (campaignId, donationId) => {
  try {
    const campaign = await CharityCampaign.findById(campaignId);
    if (!campaign) return `${FRONTEND_URL()}/charity-campaigns?payment=fail&message=${encodeURIComponent("Kampaniya tapılmadı")}`;

    const donation = campaign.donations.id(donationId);

    if (donation && donation.paymentStatus !== "paid") {
      // Yoxla — bəzən error redirect-i gəlsə belə ödəniş uğurlu ola bilər
      const ep = await getTransactionStatus({ transaction: donation.transactionId }).catch(() => null);
      if (ep?.status === "success") {
        donation.paymentStatus = "paid";
        donation.paidAt        = new Date();
        if (campaign.status === "pending_payment") campaign.status = "collecting";
        recalcCollected(campaign);
        checkCompletion(campaign);
        await campaign.save();
        const role = donation.isOpener ? "opener" : "donor";
        return `${FRONTEND_URL()}/charity-campaigns/confirmation?campaignId=${campaign._id}&role=${role}`;
      }
      donation.paymentStatus = "failed";
      await campaign.save();
    }
  } catch (_) {}
  return `${FRONTEND_URL()}/charity-campaigns?payment=fail&message=${encodeURIComponent("Ödəniş uğursuz oldu")}`;
};

// ─── Admin endpointləri ───────────────────────────────────────────────────────

exports.adminListCampaigns = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const total = await CharityCampaign.countDocuments(filter);
    const items = await CharityCampaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return success(res, {
      campaigns:  items.map(publicCampaign),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

exports.adminGetCampaign = async (req, res) => {
  try {
    const c = await CharityCampaign.findById(req.params.id);
    if (!c) return error(res, "Tapılmadı", 404);
    // Admin bütün məlumatları görür
    return success(res, c);
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ["collecting", "completed", "cancelled"];
    if (!allowed.includes(status)) return error(res, "Düzgün status göndərin", 400);

    const c = await CharityCampaign.findById(req.params.id);
    if (!c) return error(res, "Tapılmadı", 404);

    c.status = status;
    if (status === "completed" && !c.completedAt) c.completedAt = new Date();
    if (adminNote !== undefined) c.adminNote = adminNote;
    await c.save();
    return success(res, c, "Status yeniləndi");
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

exports.adminAddMedia = async (req, res) => {
  try {
    const c = await CharityCampaign.findById(req.params.id);
    if (!c) return error(res, "Tapılmadı", 404);
    if (!req.files || req.files.length === 0) return error(res, "Fayl seçilməyib", 400);

    const path           = require("path");
    const { uploadBuffer } = require("../utils/gridfs");
    const baseUrl        = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const videoExts      = [".mp4", ".mov", ".avi", ".mkv", ".webm"];

    const newMedia = await Promise.all(
      req.files.map(async (file) => {
        const ext       = path.extname(file.originalname).toLowerCase();
        const mediaType = videoExts.includes(ext) ? "video" : "photo";
        const fileId    = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
        return {
          type:       mediaType,
          filename:   file.originalname,
          fileId,
          url:        `${baseUrl}/api/files/${fileId}`,
          uploadedAt: new Date(),
        };
      }),
    );

    c.media.push(...newMedia);
    await c.save();
    return success(res, { media: c.media }, `${req.files.length} media faylı yükləndi`);
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};

exports.adminDeleteMedia = async (req, res) => {
  try {
    const c = await CharityCampaign.findById(req.params.id);
    if (!c) return error(res, "Tapılmadı", 404);

    const idx  = Number(req.params.mediaIndex);
    const item = c.media[idx];
    if (!item) return error(res, "Media tapılmadı", 404);

    if (item.fileId) {
      const { deleteFile } = require("../utils/gridfs");
      await deleteFile(item.fileId).catch(() => {});
    }

    c.media.splice(idx, 1);
    await c.save();
    return success(res, c, "Media silindi");
  } catch (err_) {
    console.error(err_);
    return error(res, "Xəta baş verdi", 500);
  }
};
