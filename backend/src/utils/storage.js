const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../../uploads/orders");

const getDirSizeBytes = (dirPath) => {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirSizeBytes(fullPath);
      } else {
        try {
          total += fs.statSync(fullPath).size;
        } catch (_) {}
      }
    }
  } catch (_) {}
  return total;
};

const getAllMediaFiles = () => {
  if (!fs.existsSync(UPLOADS_DIR)) return [];
  const results = [];
  try {
    const orderDirs = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
    for (const entry of orderDirs) {
      if (!entry.isDirectory()) continue;
      const orderDir = path.join(UPLOADS_DIR, entry.name);
      try {
        const files = fs.readdirSync(orderDir, { withFileTypes: true });
        for (const file of files) {
          if (!file.isFile()) continue;
          const filePath = path.join(orderDir, file.name);
          try {
            const stat = fs.statSync(filePath);
            results.push({
              filePath,
              orderId: entry.name,
              filename: file.name,
              mtime: stat.mtimeMs,
              size: stat.size,
            });
          } catch (_) {}
        }
      } catch (_) {}
    }
  } catch (_) {}
  return results;
};

const enforceStorageQuota = async (quotaGB) => {
  if (!quotaGB || quotaGB <= 0) return;

  const quotaBytes = quotaGB * 1024 * 1024 * 1024;
  let totalBytes = getDirSizeBytes(UPLOADS_DIR);
  if (totalBytes <= quotaBytes) return;

  // Lazımlı olduqda yalnız import et — dairəvi asılılıqdan qaçmaq üçün
  const Order = require("../models/Order");

  const files = getAllMediaFiles().sort((a, b) => a.mtime - b.mtime);

  for (const file of files) {
    if (totalBytes <= quotaBytes) break;
    try {
      fs.unlinkSync(file.filePath);
      totalBytes -= file.size;
    } catch (_) {}
    try {
      await Order.updateOne(
        { _id: file.orderId },
        { $pull: { media: { filename: file.filename } } },
      );
    } catch (_) {}
  }
};

module.exports = { getDirSizeBytes, getAllMediaFiles, enforceStorageQuota, UPLOADS_DIR };
