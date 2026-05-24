const mongoose = require("mongoose");
const { Readable } = require("stream");

const BUCKET_NAME = "uploads";

const getBucket = () => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB bağlantısı yoxdur");
  const GridFSBucket = mongoose.mongo.GridFSBucket;
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
};

const uploadBuffer = (buffer, filename, contentType) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const readable = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      chunkSizeBytes: 255 * 1024,
    });
    readable.pipe(uploadStream);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });

const streamToResponse = (fileId, res) => {
  const bucket = getBucket();
  const objId = new mongoose.Types.ObjectId(fileId);
  const downloadStream = bucket.openDownloadStream(objId);

  downloadStream.on("file", (file) => {
    if (file.contentType) res.set("Content-Type", file.contentType);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
  });

  downloadStream.on("error", () => {
    if (!res.headersSent) res.status(404).json({ success: false, message: "Fayl tapılmadı." });
  });

  downloadStream.pipe(res);
};

const deleteFile = (fileId) => {
  try {
    const bucket = getBucket();
    const objId = new mongoose.Types.ObjectId(fileId);
    return bucket.delete(objId);
  } catch (_) {
    return Promise.resolve();
  }
};

module.exports = { uploadBuffer, streamToResponse, deleteFile };
