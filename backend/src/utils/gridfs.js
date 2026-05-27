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

// Supports HTTP Range requests (required by Safari/iOS for video playback)
const streamToResponse = async (fileId, res, req) => {
  const bucket = getBucket();
  const objId = new mongoose.Types.ObjectId(fileId);

  const files = await bucket.find({ _id: objId }).toArray();
  if (!files.length) {
    if (!res.headersSent)
      res.status(404).json({ success: false, message: "Fayl tapılmadı." });
    return;
  }

  const file = files[0];
  const totalSize = file.length;
  const contentType = file.contentType || "application/octet-stream";
  const rangeHeader = req?.headers?.range;

  res.set("Accept-Ranges", "bytes");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!match) {
      res.set("Content-Range", `bytes */${totalSize}`);
      return res.status(416).end();
    }
    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

    if (start > end || end >= totalSize) {
      res.set("Content-Range", `bytes */${totalSize}`);
      return res.status(416).end();
    }

    const chunkSize = end - start + 1;
    res.status(206).set({
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Content-Length": chunkSize,
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    });

    const downloadStream = bucket.openDownloadStream(objId, { start, end: end + 1 });
    downloadStream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    downloadStream.pipe(res);
  } else {
    res.set({
      "Content-Type": contentType,
      "Content-Length": totalSize,
      "Cache-Control": "private, max-age=3600",
    });

    const downloadStream = bucket.openDownloadStream(objId);
    downloadStream.on("error", () => {
      if (!res.headersSent)
        res.status(404).json({ success: false, message: "Fayl tapılmadı." });
    });
    downloadStream.pipe(res);
  }
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
