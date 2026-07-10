const MeatAnimal = require("../models/MeatAnimal");
const { success, error } = require("../utils/response");

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
            .sort((x, y) => (x.sortOrder || 0) - (y.sortOrder || 0)),
        })),
    }));

    return success(res, { animals: shaped });
  } catch (err) {
    console.error("[Meat] getAnimals xətası:", err.message);
    return error(res, "Heyvanlar yüklənə bilmədi.", 500);
  }
};

module.exports = { getAnimals };
