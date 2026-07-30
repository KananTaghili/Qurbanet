const MeatAnimal = require("../models/MeatAnimal");
const Food = require("../models/Food");
const MeatInternalOrgan = require("../models/MeatInternalOrgan");
const MeatGroundProduct = require("../models/MeatGroundProduct");
const { success, error } = require("../utils/response");

const getBaseUrl = (req) => process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
const fileIdToUrl = (fileId, req) => (fileId ? `${getBaseUrl(req)}/api/files/${fileId}` : null);

// GET /api/meat/animals — aktiv heyvanlar, hər birinin aktiv hissə/kəsimləri ilə
const getAnimals = async (req, res) => {
  try {
    const animals = await MeatAnimal.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const shaped = animals.map((a) => ({
      ...a,
      bodyParts: (a.bodyParts || [])
        .slice()
        .sort((x, y) => (x.sortOrder || 0) - (y.sortOrder || 0))
        .map((p) => ({
          ...p,
          cuts: (p.cuts || [])
            .filter((c) => c.isActive)
            .sort((x, y) => (x.sortOrder || 0) - (y.sortOrder || 0))
            .map((c) => ({ ...c, imageUrl: fileIdToUrl(c.imageFileId, req) })),
        })),
    }));

    return success(res, { animals: shaped });
  } catch (err) {
    console.error("[Meat] getAnimals xətası:", err.message);
    return error(res, "Heyvanlar yüklənə bilmədi.", 500);
  }
};

// GET /api/meat/foods — aktiv yeməklər (Yeməklər üzrə axtarış üçün)
const getFoods = async (req, res) => {
  try {
    const foods = await Food.find({ isActive: true })
      .sort({ sortOrder: 1, nameAz: 1 })
      .lean();
    const shaped = foods.map((f) => ({ ...f, imageUrl: fileIdToUrl(f.imageFileId, req) }));
    return success(res, { foods: shaped });
  } catch (err) {
    console.error("[Meat] getFoods xətası:", err.message);
    return error(res, "Yeməklər yüklənə bilmədi.", 500);
  }
};

// GET /api/meat/organs — aktiv daxili orqanlar (heyvana görə seçilir, tam hissə satışı)
const getOrgans = async (req, res) => {
  try {
    const organs = await MeatInternalOrgan.find({ isActive: true })
      .sort({ sortOrder: 1, nameAz: 1 })
      .lean();
    const shaped = organs.map((o) => ({
      ...o,
      imageUrl: fileIdToUrl(o.imageFileId, req),
      totalPrice: Math.round((o.weightKg || 0) * (o.pricePerKg || 0) * 100) / 100,
    }));
    return success(res, { organs: shaped });
  } catch (err) {
    console.error("[Meat] getOrgans xətası:", err.message);
    return error(res, "Daxili orqanlar yüklənə bilmədi.", 500);
  }
};

// GET /api/meat/ground-products — aktiv çəkilmiş ət məhsulları (heyvandan asılı olmayan ümumi siyahı)
const getGroundProducts = async (req, res) => {
  try {
    const products = await MeatGroundProduct.find({ isActive: true })
      .sort({ sortOrder: 1, nameAz: 1 })
      .lean();
    const shaped = products.map((p) => ({ ...p, imageUrl: fileIdToUrl(p.imageFileId, req) }));
    return success(res, { products: shaped });
  } catch (err) {
    console.error("[Meat] getGroundProducts xətası:", err.message);
    return error(res, "Çəkilmiş ət məhsulları yüklənə bilmədi.", 500);
  }
};

module.exports = { getAnimals, getFoods, getOrgans, getGroundProducts };
