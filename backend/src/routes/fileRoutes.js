const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { streamToResponse } = require("../utils/gridfs");
const Order = require("../models/Order");

const router = express.Router();

// Cache: "fileId:userId" → boolean access result, cleared every 10 min
const accessCache = new Map();
// Cache: fileId → boolean (is this file attached to an order?), cleared every 10 min
const orderMediaCache = new Map();
setInterval(() => { accessCache.clear(); orderMediaCache.clear(); }, 10 * 60 * 1000);

async function isOrderMediaFile(objId, fileId) {
  if (orderMediaCache.has(fileId)) return orderMediaCache.get(fileId);
  const match = await Order.exists({
    $or: [
      { "media.fileId": objId },
      { "processNotes.videoFileId": objId },
    ],
  });
  const result = !!match;
  orderMediaCache.set(fileId, result);
  return result;
}

// GET /api/files/:fileId
// Public files (category images, etc.) are served without auth.
// Order media requires a valid JWT — admin can access any, user only their own orders.
router.get("/:fileId", async (req, res) => {
  const { fileId } = req.params;
  if (!fileId || !/^[a-f\d]{24}$/i.test(fileId)) {
    return res.status(400).json({ success: false, message: "Yanlış fayl ID." });
  }

  const objId = new mongoose.Types.ObjectId(fileId);
  const token =
    req.query.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  // No token — allow only if the file is NOT attached to any order (public asset)
  if (!token) {
    const orderMedia = await isOrderMediaFile(objId, fileId);
    if (!orderMedia) {
      await streamToResponse(fileId, res, req);
      return;
    }
    return res.status(401).json({ success: false, message: "Giriş tələb olunur." });
  }

  // Token provided — try admin first
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role === "admin") {
      await streamToResponse(fileId, res, req);
      return;
    }
  } catch (_) { /* not admin */ }

  // Try user JWT
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Sessiyanın müddəti bitib. Yenidən giriş edin."
        : "Yanlış token. Giriş edin.";
    return res.status(401).json({ success: false, message: msg });
  }

  // Check ownership with cache
  const cacheKey = `${fileId}:${userId}`;
  let hasAccess = accessCache.get(cacheKey);

  if (hasAccess === undefined) {
    try {
      const match = await Order.exists({
        user: userId,
        $or: [
          { "media.fileId": objId },
          { "processNotes.videoFileId": objId },
        ],
      });
      hasAccess = !!match;
      accessCache.set(cacheKey, hasAccess);
    } catch {
      return res.status(500).json({ success: false, message: "Server xətası." });
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ success: false, message: "Bu fayla giriş icazəniz yoxdur." });
  }

  await streamToResponse(fileId, res, req);
});

module.exports = router;
