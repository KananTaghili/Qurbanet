const CharityOption = require("../models/CharityOption");
const DeliveryOption = require("../models/DeliveryOption");
const MeatAnimal = require("../models/MeatAnimal");

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

// ─── Ət Satışı: heyvan bədən hissələri + başlanğıc ət kəsimləri ─────────────
// Hissə açarları (key) veb tərəfindəki bədən xəritəsi (SVG) bölgələri ilə
// birə-bir uyğun olmalıdır — admin panelindən silinməməli, yalnız içindəki
// "cuts" (ət kəsimləri) idarə olunur.
const PART_LABELS = {
  bas: "Baş",
  boyun: "Boyun",
  kurek: "Kürək",
  dos: "Döş",
  qaburga: "Qabırğa",
  bel: "Bel",
  boyur: "Böyür",
  but: "But",
  incik: "İncik",
  quyruq: "Quyruq",
  horguc: "Hörgüc",
  on_incik: "Ön incik",
  sagri: "Sağrı",
  qarin_alti: "Qarın altı",
  arxa_incik: "Arxa incik",
};

const cut = (nameAz, pricePerKg, stockKg, extra = {}) => ({
  nameAz,
  pricePerKg,
  stockKg,
  stepKg: 0.5,
  minKg: 0.5,
  isActive: true,
  ...extra,
});

const partsFor = (keys, cutsByPart) =>
  keys.map((key, i) => ({
    key,
    nameAz: PART_LABELS[key],
    sortOrder: i,
    cuts: cutsByPart[key] || [],
  }));

// Qoyun/Qoç/Keçi — 10 bölgə
const QUAD_PART_KEYS = ["bas", "boyun", "kurek", "dos", "qaburga", "bel", "boyur", "but", "incik", "quyruq"];
// Dana — 13 bölgə (ən böyük heyvan, ən çox alt-kəsim)
const DANA_PART_KEYS = ["bas", "boyun", "kurek", "dos", "on_incik", "qaburga", "qarin_alti", "bel", "boyur", "sagri", "arxa_incik", "but", "quyruq"];
// Dəvə — 12 bölgə
const DEVE_PART_KEYS = ["bas", "boyun", "kurek", "dos", "on_incik", "horguc", "qaburga", "bel", "boyur", "arxa_incik", "but", "quyruq"];

const DEFAULT_MEAT_ANIMALS = [
  {
    key: "qoyun",
    nameAz: "Qoyun",
    emoji: "🐑",
    sortOrder: 1,
    bodyParts: partsFor(QUAD_PART_KEYS, {
      bas: [cut("Baş əti", 9, 25), cut("Dil", 22, 8), cut("Beyin", 18, 6)],
      boyun: [cut("Boyun əti (sümüklü)", 13, 30), cut("Boyun filesi", 17, 15)],
      kurek: [cut("Kürək əti (sümüksüz)", 16, 30), cut("Kürək sümüklü", 13, 25)],
      dos: [cut("Döş əti", 12, 28)],
      qaburga: [cut("Qabırğa əti", 14, 30), cut("Qırma (qazan üçün)", 12, 30)],
      bel: [cut("Bel filesi (Qarın üstü)", 19, 20), cut("Bel sümüklü (Qaburğa yanı)", 15, 25)],
      boyur: [cut("Böyür əti", 11, 20), cut("Qarın pərdəsi", 9, 15)],
      but: [cut("But filesi (sümüksüz)", 18, 30), cut("But sümüklü", 15, 30)],
      incik: [cut("İncik (zoğal əti)", 13, 15)],
      quyruq: [cut("Quyruq yağı", 20, 12)],
    }),
  },
  {
    key: "qoc",
    nameAz: "Qoç",
    emoji: "🐏",
    sortOrder: 2,
    bodyParts: partsFor(QUAD_PART_KEYS, {
      bas: [cut("Baş əti", 10, 20), cut("Dil", 23, 6), cut("Beyin", 19, 5)],
      boyun: [cut("Boyun əti (sümüklü)", 14, 25), cut("Boyun filesi", 18, 12)],
      kurek: [cut("Kürək əti (sümüksüz)", 17, 25), cut("Kürək sümüklü", 14, 20)],
      dos: [cut("Döş əti", 13, 22)],
      qaburga: [cut("Qabırğa əti", 15, 25), cut("Qırma (qazan üçün)", 13, 25)],
      bel: [cut("Bel filesi (Qarın üstü)", 20, 16), cut("Bel sümüklü (Qaburğa yanı)", 16, 20)],
      boyur: [cut("Böyür əti", 12, 16), cut("Qarın pərdəsi", 10, 12)],
      but: [cut("But filesi (sümüksüz)", 19, 25), cut("But sümüklü", 16, 25)],
      incik: [cut("İncik (zoğal əti)", 14, 12)],
      quyruq: [cut("Quyruq yağı", 21, 10)],
    }),
  },
  {
    key: "keci",
    nameAz: "Keçi",
    emoji: "🐐",
    sortOrder: 3,
    bodyParts: partsFor(QUAD_PART_KEYS, {
      bas: [cut("Baş əti", 8, 20), cut("Dil", 20, 6), cut("Beyin", 16, 5)],
      boyun: [cut("Boyun əti (sümüklü)", 11, 22), cut("Boyun filesi", 15, 12)],
      kurek: [cut("Kürək əti (sümüksüz)", 14, 22), cut("Kürək sümüklü", 11, 18)],
      dos: [cut("Döş əti", 10, 20)],
      qaburga: [cut("Qabırğa əti", 12, 22), cut("Qırma (qazan üçün)", 10, 22)],
      bel: [cut("Bel filesi", 16, 14), cut("Bel sümüklü", 13, 18)],
      boyur: [cut("Böyür əti", 9, 14), cut("Qarın pərdəsi", 8, 10)],
      but: [cut("But filesi (sümüksüz)", 15, 22), cut("But sümüklü", 12, 22)],
      incik: [cut("İncik (zoğal əti)", 11, 10)],
      quyruq: [cut("Quyruq yağı", 14, 6)],
    }),
  },
  {
    key: "dana",
    nameAz: "Dana",
    emoji: "🐄",
    sortOrder: 4,
    bodyParts: partsFor(DANA_PART_KEYS, {
      bas: [cut("Baş əti", 11, 20), cut("Dil", 26, 8), cut("Beyin", 21, 6)],
      boyun: [cut("Boyun əti (sümüklü)", 15, 40), cut("Boyun filesi", 19, 20)],
      kurek: [cut("Kürək əti (sümüksüz)", 20, 45), cut("Kürək sümüklü", 16, 35)],
      dos: [cut("Döş əti", 14, 40)],
      on_incik: [cut("Ön incik", 15, 20)],
      qaburga: [cut("Qabırğa əti", 17, 45), cut("Qırma (qazan üçün)", 15, 45)],
      qarin_alti: [cut("Qarın altı əti", 13, 25)],
      bel: [cut("Antrikot (Bel filesi)", 26, 25), cut("Bonfile", 32, 15), cut("Bel sümüklü", 18, 30)],
      boyur: [cut("Böyür əti", 14, 25), cut("Qarın pərdəsi", 12, 20)],
      sagri: [cut("Sağrı filesi", 24, 20), cut("Sağrı sümüklü", 17, 20)],
      arxa_incik: [cut("Arxa incik", 15, 20)],
      but: [cut("But filesi (sümüksüz)", 23, 45), cut("But sümüklü", 18, 40)],
      quyruq: [cut("Quyruq (şorba üçün)", 16, 15)],
    }),
  },
  {
    key: "deve",
    nameAz: "Dəvə",
    emoji: "🐪",
    sortOrder: 5,
    bodyParts: partsFor(DEVE_PART_KEYS, {
      bas: [cut("Baş əti", 13, 15), cut("Dil", 28, 5)],
      boyun: [cut("Boyun əti", 18, 30), cut("Boyun filesi", 22, 15)],
      kurek: [cut("Kürək əti (sümüksüz)", 23, 35), cut("Kürək sümüklü", 19, 25)],
      dos: [cut("Döş əti", 17, 30)],
      on_incik: [cut("Ön incik", 18, 15)],
      horguc: [cut("Hörgüc yağı", 30, 10)],
      qaburga: [cut("Qabırğa əti", 20, 35), cut("Qırma (qazan üçün)", 18, 35)],
      bel: [cut("Bel filesi", 29, 18), cut("Bel sümüklü", 21, 22)],
      boyur: [cut("Böyür əti", 16, 20)],
      arxa_incik: [cut("Arxa incik", 18, 15)],
      but: [cut("But filesi (sümüksüz)", 26, 35), cut("But sümüklü", 21, 30)],
      quyruq: [cut("Quyruq yağı", 24, 8)],
    }),
  },
];

async function seedMeatAnimals() {
  try {
    for (const animal of DEFAULT_MEAT_ANIMALS) {
      const exists = await MeatAnimal.findOne({ key: animal.key });
      if (!exists) {
        await MeatAnimal.create(animal);
        console.log(`✅ Ət Satışı heyvanı yaradıldı: ${animal.nameAz}`);
      }
    }
  } catch (err) {
    console.error("Seed xətası (MeatAnimal):", err.message);
  }
}

module.exports = { seedCharityOptions, seedDeliveryOptions, seedMeatAnimals };
