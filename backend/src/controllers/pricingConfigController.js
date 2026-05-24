const PricingConfig = require("../models/PricingConfig");
const Category      = require("../models/Category");

// GET /api/admin/pricing  — all configs with category info
exports.list = async (req, res) => {
  try {
    const configs = await PricingConfig.find().populate("categoryId", "nameAz type");
    res.json({ success: true, data: { configs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/pricing/:categoryId
exports.getByCategory = async (req, res) => {
  try {
    const config = await PricingConfig.findOne({ categoryId: req.params.categoryId })
      .populate("categoryId", "nameAz type");
    res.json({ success: true, data: { config: config || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/pricing/:categoryId  — upsert
exports.upsert = async (req, res) => {
  try {
    const { vatRate, ranges } = req.body;

    // verify category exists
    const cat = await Category.findById(req.params.categoryId);
    if (!cat) return res.status(404).json({ success: false, message: "Kateqoriya tapılmadı" });

    const config = await PricingConfig.findOneAndUpdate(
      { categoryId: req.params.categoryId },
      { $set: { vatRate: vatRate ?? 1.18, ranges: ranges ?? [] } },
      { upsert: true, new: true, runValidators: true },
    ).populate("categoryId", "nameAz type");

    res.json({ success: true, data: { config } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
