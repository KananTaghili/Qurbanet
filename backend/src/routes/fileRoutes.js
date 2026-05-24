const express = require("express");
const { streamToResponse } = require("../utils/gridfs");

const router = express.Router();

// GET /api/files/:fileId  — public, caches 1 year
router.get("/:fileId", (req, res) => {
  const { fileId } = req.params;
  if (!fileId || !/^[a-f\d]{24}$/i.test(fileId)) {
    return res.status(400).json({ success: false, message: "Yanlış fayl ID." });
  }
  streamToResponse(fileId, res);
});

module.exports = router;
