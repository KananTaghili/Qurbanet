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
    const { timeWindows, charityWeightInfoText, deliveryFee, cashPickupLocation, meatPickupLocation, storageQuotaGB, cashPaymentEnabled, charityPageEnabled, meatCountrySelectionEnabled, deliveryCountries, singleAnimalMode, maxSlaughterDays, multiLanguageEnabled, enabledLanguages, quickDateTodayEnabled, quickDateTomorrowEnabled,
      campaignMinOpenPercent, campaignMinDonation, campaignAllowAnonymous, campaignAllowGuest, campaignGuestNameRequired, campaignGuestPhoneRequired, campaignOnePerAnimal, campaignMaxPerAnimal,
      campaignNearlyFullPercent, campaignNearlyFullMinDonation } = req.body;

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

    if (meatCountrySelectionEnabled !== undefined) {
      settings.meatCountrySelectionEnabled = Boolean(meatCountrySelectionEnabled);
    }

    if (Array.isArray(deliveryCountries)) {
      settings.deliveryCountries = deliveryCountries
        .filter((c) => c && c.code && String(c.code).trim() && c.nameAz && String(c.nameAz).trim())
        .map((c) => ({
          code: String(c.code).trim().toUpperCase().slice(0, 10),
          nameAz: String(c.nameAz).trim().slice(0, 60),
          flagCode: String(c.flagCode || "az").trim().toLowerCase().slice(0, 5),
          enabled: Boolean(c.enabled),
          cities: Array.isArray(c.cities)
            ? c.cities
                .filter((ci) => ci && ci.key && String(ci.key).trim() && ci.nameAz && String(ci.nameAz).trim())
                .map((ci) => ({
                  key: String(ci.key).trim().slice(0, 40),
                  nameAz: String(ci.nameAz).trim().slice(0, 60),
                  enabled: Boolean(ci.enabled),
                  lat: Number(ci.lat) || 0,
                  lng: Number(ci.lng) || 0,
                  deliveryPrice:
                    Number.isFinite(Number(ci.deliveryPrice)) && Number(ci.deliveryPrice) >= 0
                      ? Number(ci.deliveryPrice)
                      : 5,
                }))
            : [],
        }));
      settings.markModified("deliveryCountries");
    }

    if (singleAnimalMode !== undefined) {
      settings.singleAnimalMode = Boolean(singleAnimalMode);
    }

    if (maxSlaughterDays !== undefined) {
      const days = Number(maxSlaughterDays);
      if (!Number.isNaN(days) && days >= 1) settings.maxSlaughterDays = Math.floor(days);
    }

    if (Array.isArray(enabledLanguages)) {
      const valid = enabledLanguages.filter(l => ['az', 'en', 'ru'].includes(l));
      if (!valid.includes('az')) valid.unshift('az');
      settings.enabledLanguages = valid;
      settings.markModified('enabledLanguages');
      settings.multiLanguageEnabled = valid.length > 1;
    } else if (multiLanguageEnabled !== undefined) {
      settings.multiLanguageEnabled = Boolean(multiLanguageEnabled);
    }

    if (Array.isArray(enabledLanguages)) {
      const valid = enabledLanguages.filter(l => ['az', 'en', 'ru'].includes(l));
      if (!valid.includes('az')) valid.unshift('az');
      settings.enabledLanguages = valid;
      settings.markModified('enabledLanguages');
      settings.multiLanguageEnabled = valid.length > 1;
    }

    if (quickDateTodayEnabled !== undefined) {
      settings.quickDateTodayEnabled = Boolean(quickDateTodayEnabled);
    }

    if (quickDateTomorrowEnabled !== undefined) {
      settings.quickDateTomorrowEnabled = Boolean(quickDateTomorrowEnabled);
    }

    if (campaignMinOpenPercent !== undefined) {
      const v = Number(campaignMinOpenPercent);
      if (!Number.isNaN(v) && v >= 0.01 && v <= 100) settings.campaignMinOpenPercent = v;
    }
    if (campaignMinDonation !== undefined) {
      const v = Number(campaignMinDonation);
      if (!Number.isNaN(v) && v >= 0.01) settings.campaignMinDonation = v;
    }
    if (campaignNearlyFullPercent !== undefined) {
      const v = Number(campaignNearlyFullPercent);
      if (!Number.isNaN(v) && v >= 0.01 && v <= 100) settings.campaignNearlyFullPercent = v;
    }
    if (campaignNearlyFullMinDonation !== undefined) {
      const v = Number(campaignNearlyFullMinDonation);
      if (!Number.isNaN(v) && v >= 0.01) settings.campaignNearlyFullMinDonation = v;
    }
    if (campaignAllowAnonymous  !== undefined) settings.campaignAllowAnonymous  = Boolean(campaignAllowAnonymous);
    if (campaignAllowGuest      !== undefined) settings.campaignAllowGuest      = Boolean(campaignAllowGuest);
    if (campaignGuestNameRequired  !== undefined) settings.campaignGuestNameRequired  = Boolean(campaignGuestNameRequired);
    if (campaignGuestPhoneRequired !== undefined) settings.campaignGuestPhoneRequired = Boolean(campaignGuestPhoneRequired);
    if (campaignOnePerAnimal       !== undefined) settings.campaignOnePerAnimal       = Boolean(campaignOnePerAnimal);
    if (campaignMaxPerAnimal       !== undefined) {
      const v = Number(campaignMaxPerAnimal);
      if (!Number.isNaN(v) && v >= 1) settings.campaignMaxPerAnimal = Math.floor(v);
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
      meatCountrySelectionEnabled: settings.meatCountrySelectionEnabled === true,
      deliveryCountries: (settings.deliveryCountries?.toObject ? settings.deliveryCountries.toObject() : settings.deliveryCountries) || [],
      singleAnimalMode: settings.singleAnimalMode === true,
      maxSlaughterDays: settings.maxSlaughterDays ?? 14,
      multiLanguageEnabled: settings.multiLanguageEnabled !== false,
      enabledLanguages: (settings.enabledLanguages && settings.enabledLanguages.length > 0)
        ? settings.enabledLanguages.toObject ? settings.enabledLanguages.toObject() : [...settings.enabledLanguages]
        : ['az', 'en', 'ru'],
      quickDateTodayEnabled: settings.quickDateTodayEnabled !== false,
      quickDateTomorrowEnabled: settings.quickDateTomorrowEnabled !== false,
      campaignMinOpenPercent:  settings.campaignMinOpenPercent  ?? 30,
      campaignMinDonation:     settings.campaignMinDonation     ?? 10,
      campaignAllowAnonymous:  settings.campaignAllowAnonymous  !== false,
      campaignAllowGuest:      settings.campaignAllowGuest      !== false,
      campaignGuestNameRequired:  settings.campaignGuestNameRequired  === true,
      campaignGuestPhoneRequired: settings.campaignGuestPhoneRequired === true,
      campaignOnePerAnimal:       settings.campaignOnePerAnimal       !== false,
      campaignMaxPerAnimal:       settings.campaignMaxPerAnimal       ?? 1,
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
