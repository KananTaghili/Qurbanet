const CharityAnimal = require("../models/CharityAnimal");

// ─── Admin: bütün heyvanları siyahıla ────────────────────────────────────────
exports.listCharityAnimals = async (req, res) => {
  try {
    const animals = await CharityAnimal.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { charityAnimals: animals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Public (mobil): yalnız aktiv heyvanlar, charityType ilə filter ──────────
exports.getPublicCharityAnimals = async (req, res) => {
  try {
    const { charityType } = req.query;
    const filter = { isActive: true };
    if (charityType) filter.charityTargets = charityType;
    const animals = await CharityAnimal.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { charityAnimals: animals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: yeni xeyriyyə heyvanı yarat ──────────────────────────────────────
exports.createCharityAnimal = async (req, res) => {
  try {
    const { nameAz, nameEn, nameRu, nameAr, emoji, animalType, description, content, priceOptions, charityTargets, sortOrder, isActive } =
      req.body;

    if (!nameAz?.trim()) {
      return res.status(400).json({ success: false, message: "Ad (nameAz) tələb olunur." });
    }

    const priceOpts = Array.isArray(priceOptions) ? priceOptions : [];
    if (priceOpts.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Ən azı 1 qiymət seçimi lazımdır." });
    }

    const targets = Array.isArray(charityTargets) && charityTargets.length > 0
      ? charityTargets
      : ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];

    const animal = await CharityAnimal.create({
      nameAz: nameAz.trim(),
      nameEn: (nameEn || "").trim(),
      nameRu: (nameRu || "").trim(),
      nameAr: (nameAr || "").trim(),
      emoji: emoji || "🐑",
      animalType: animalType?.trim() || "",
      description: description?.trim() || "",
      content: content?.trim() || "",
      priceOptions: priceOpts,
      charityTargets: targets,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
    });

    res.status(201).json({ success: true, data: animal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: xeyriyyə heyvanını yenilə ────────────────────────────────────────
exports.updateCharityAnimal = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { nameAz, nameEn, nameRu, nameAr, emoji, animalType, description, content, priceOptions, charityTargets, sortOrder, isActive } =
      req.body;

    const update = {};
    if (nameAz !== undefined) update.nameAz = String(nameAz).trim();
    if (nameEn !== undefined) update.nameEn = (nameEn || "").trim();
    if (nameRu !== undefined) update.nameRu = (nameRu || "").trim();
    if (nameAr !== undefined) update.nameAr = (nameAr || "").trim();
    if (emoji !== undefined) update.emoji = emoji;
    if (animalType !== undefined) update.animalType = String(animalType).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (content !== undefined) update.content = String(content).trim();
    if (priceOptions !== undefined) {
      if (!Array.isArray(priceOptions) || priceOptions.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Ən azı 1 qiymət seçimi lazımdır." });
      }
      update.priceOptions = priceOptions;
    }
    if (charityTargets !== undefined) update.charityTargets = Array.isArray(charityTargets) ? charityTargets : [];
    if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const animal = await CharityAnimal.findByIdAndUpdate(animalId, update, {
      new: true,
      runValidators: true,
    });
    if (!animal) {
      return res.status(404).json({ success: false, message: "Tapılmadı" });
    }

    res.json({ success: true, data: animal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: xeyriyyə heyvanını sil ───────────────────────────────────────────
exports.deleteCharityAnimal = async (req, res) => {
  try {
    const { animalId } = req.params;
    await CharityAnimal.findByIdAndDelete(animalId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
