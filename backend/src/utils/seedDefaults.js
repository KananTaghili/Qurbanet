const CharityOption = require("../models/CharityOption");
const DeliveryOption = require("../models/DeliveryOption");

const DEFAULT_CHARITY_OPTIONS = [
  {
    key: "usaqlar_evi",
    nameAz: "Uşaqlar evi",
    icon: "🏠",
    description: "Uşaqlar sevindirmə bölməsinə keç.",
    content:
      "Qurbanınız ehtiyac içindəki uşaqlar üçün paylanaçaq. Hər il yüzlərlə uşağa çatdırılır.",
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "qocalar_evi",
    nameAz: "Qocalar evi",
    icon: "🏡",
    description: "Yaşlılar üçün ayrılmış dəstək proqramı ilə davam edir.",
    content:
      "Qurbanınız qocalar evinə göndərilir. Hər birinə xüsusi diqqət və sevgi ilə çatdırılır.",
    sortOrder: 2,
    isActive: true,
  },
  {
    key: "ehtiyac_sahibleri",
    nameAz: "Ehtiyac sahibləri",
    icon: "🤝",
    description: "Birbaşa ehtiyaclı ailələr üçün yardım bölməsi.",
    content:
      "Qurbanınız birbaşa ehtiyaclı ailəərə paylanır. Hər il minlərlə ailə bu proqramdan faydalanır.",
    sortOrder: 3,
    isActive: true,
  },
];

async function seedCharityOptions() {
  try {
    for (const opt of DEFAULT_CHARITY_OPTIONS) {
      const exists = await CharityOption.findOne({ key: opt.key });
      if (!exists) {
        await CharityOption.create(opt);
        console.log(`✅ Xeyriyyə seçimi yaradıldı: ${opt.nameAz}`);
      }
    }
  } catch (err) {
    console.error("Seed xətası (CharityOption):", err.message);
  }
}

const DEFAULT_DELIVERY_OPTIONS = [
  {
    key: "catdirilsin",
    labelAz: "Sizə çatdırılsın",
    icon: "🚗",
    basePrice: 10,
    description: "Ünvanınıza çatdırılma xidməti",
    isActive: true,
  },
  {
    key: "ehtiyac_sahibleri",
    labelAz: "Ehtiyac sahiblərinə",
    icon: "🤲",
    basePrice: 0,
    description: "Məzlum və ehtiyac sahiblərinə paylanma",
    isActive: true,
  },
  {
    key: "usaqlar_evi",
    labelAz: "Uşaqlar evinə",
    icon: "🏠",
    basePrice: 0,
    description: "Uşaqlar evinə çatdırılma",
    isActive: true,
  },
  {
    key: "qocalar_evi",
    labelAz: "Qocalar evinə",
    icon: "🏡",
    basePrice: 0,
    description: "Qocalar evinə çatdırılma",
    isActive: true,
  },
];

async function seedDeliveryOptions() {
  try {
    for (const opt of DEFAULT_DELIVERY_OPTIONS) {
      const exists = await DeliveryOption.findOne({ key: opt.key });
      if (!exists) {
        await DeliveryOption.create(opt);
        console.log(`✅ Çatdırılma seçimi yaradıldı: ${opt.labelAz}`);
      }
    }
  } catch (err) {
    console.error("Seed xətası (DeliveryOption):", err.message);
  }
}

module.exports = { seedCharityOptions, seedDeliveryOptions };
