const AppSettings = require("../models/AppSettings");
const { success, error } = require("../utils/response");
const { getDirSizeBytes, UPLOADS_DIR } = require("../utils/storage");

const MEAT_DEFAULT = {
  address: "20 Yanvar metro stansiyası yaxınlığı, Bakı",
  lat: 40.3875,
  lng: 49.8278,
};

const getOrCreateSettings = async () => {
  let settings = await AppSettings.findOne({ singleton: "global" });
  if (!settings) {
    settings = await AppSettings.create({ singleton: "global" });
  }
  if (!settings.meatPickupLocation?.address) {
    settings.meatPickupLocation = MEAT_DEFAULT;
    await settings.save();
  }
  return settings;
};

const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return success(res, { settings });
  } catch (err) {
    console.error("getSettings xətası:", err);
    return error(res, "Tənzimləmələr yüklənmədi.", 500);
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const { timeWindows, charityWeightInfoText, deliveryFee, cashPickupLocation, meatPickupLocation, storageQuotaGB, cashPaymentEnabled, charityPageEnabled } = req.body;

    if (Array.isArray(timeWindows)) {
      const valid = timeWindows.filter(
        (w) => w.key && w.label && w.key.trim() && w.label.trim(),
      );
      settings.timeWindows = valid.map((w) => ({
        key: w.key.trim(),
        label: w.label.trim(),
        isActive: w.isActive !== false,
      }));
    }

    if (charityWeightInfoText !== undefined) {
      settings.charityWeightInfoText = String(charityWeightInfoText).slice(0, 600);
    }

    if (deliveryFee !== undefined) {
      const fee = Number(deliveryFee);
      if (!Number.isNaN(fee) && fee >= 0) settings.deliveryFee = fee;
    }

    if (storageQuotaGB !== undefined) {
      const gb = Number(storageQuotaGB);
      if (!Number.isNaN(gb) && gb >= 0) settings.storageQuotaGB = gb;
    }

    if (cashPickupLocation !== undefined) {
      const addr = String(cashPickupLocation.address || "").trim().slice(0, 300);
      const lat = Number(cashPickupLocation.lat);
      const lng = Number(cashPickupLocation.lng);
      if (addr) {
        settings.cashPickupLocation = {
          address: addr,
          lat: Number.isNaN(lat) ? settings.cashPickupLocation?.lat : lat,
          lng: Number.isNaN(lng) ? settings.cashPickupLocation?.lng : lng,
        };
      }
    }

    if (cashPaymentEnabled !== undefined) {
      settings.cashPaymentEnabled = Boolean(cashPaymentEnabled);
    }

    if (charityPageEnabled !== undefined) {
      settings.charityPageEnabled = Boolean(charityPageEnabled);
    }

    if (meatPickupLocation !== undefined) {
      const addr = String(meatPickupLocation.address || "").trim().slice(0, 300);
      const lat = Number(meatPickupLocation.lat);
      const lng = Number(meatPickupLocation.lng);
      settings.meatPickupLocation = {
        address: addr,
        lat: Number.isNaN(lat) ? (settings.meatPickupLocation?.lat ?? 40.4093) : lat,
        lng: Number.isNaN(lng) ? (settings.meatPickupLocation?.lng ?? 49.8671) : lng,
      };
    }

    await settings.save();

    try {
      const { getIo } = require("../socket");
      getIo().emit("app_settings_updated", {});
    } catch (_) {}

    return success(res, { settings }, "Tənzimləmələr yeniləndi.");
  } catch (err) {
    console.error("updateSettings xətası:", err);
    return error(res, "Tənzimləmələr yenilənmədi.", 500);
  }
};

const getPublicSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const activeWindows = (settings.timeWindows || [])
      .filter((w) => w.isActive)
      .map((w) => w.label);
    return success(res, {
      timeWindows: activeWindows,
      charityWeightInfoText: settings.charityWeightInfoText || "",
      deliveryFee: settings.deliveryFee ?? 10,
      cashPaymentEnabled: settings.cashPaymentEnabled !== false,
      charityPageEnabled: settings.charityPageEnabled !== false,
      cashPickupLocation: settings.cashPickupLocation || {
        address: "20 Yanvar metro stansiyası yaxınlığı, Bakı",
        lat: 40.3875,
        lng: 49.8278,
      },
      meatPickupLocation: settings.meatPickupLocation || { address: "", lat: 40.4093, lng: 49.8671 },
    });
  } catch (err) {
    console.error("getPublicSettings xətası:", err);
    return error(res, "Tənzimləmələr yüklənmədi.", 500);
  }
};

const getStorageStats = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const usedBytes = getDirSizeBytes(UPLOADS_DIR);
    const usedGB = usedBytes / (1024 * 1024 * 1024);
    const quotaGB = settings.storageQuotaGB || 0;
    return success(res, {
      usedBytes,
      usedGB: Math.round(usedGB * 100) / 100,
      quotaGB,
      usedPercent: quotaGB > 0 ? Math.min(100, Math.round((usedGB / quotaGB) * 100)) : null,
    });
  } catch (err) {
    console.error("getStorageStats xətası:", err);
    return error(res, "Saxlama statistikası yüklənmədi.", 500);
  }
};

module.exports = { getSettings, updateSettings, getPublicSettings, getStorageStats };
