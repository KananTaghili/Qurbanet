const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Hansı modula aiddir (bildiriş tablarına uyğun)
    module: { type: String, enum: ["qurban", "charity", "meat", "news"], required: true },
    // Konkret hadisə tipi (məs. campaign_completed, order_status, media_added ...)
    type:   { type: String, required: true },
    title:  { type: String, required: true },
    body:   { type: String, default: "" },
    read:   { type: Boolean, default: false },
    // Əlaqəli obyektə keçid üçün məlumat: { campaignId, orderId, status, ... }
    data:   { type: Object, default: {} },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, module: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
