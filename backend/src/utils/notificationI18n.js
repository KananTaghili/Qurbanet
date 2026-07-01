// Bildiriş mətnlərinin çoxdilli şablonları (backend tərəfdə lokallaşdırma).
// Backend bildirişi dil-neytral (type + data) saxlayır; oxunarkən istifadəçinin
// dilinə uyğun title/body burada qurulur. Gələcəkdə push da buradan istifadə edəcək.

const LANGS = ["az", "en", "ru"];
const DEFAULT_LANG = "az";

const ORDER_STATUS_LABEL = {
  az: { awaiting_payment: "Ödəniş gözlənilir", placed: "Sifariş verildi", confirmed: "Təsdiqləndi", slaughtering: "Kəsilir", preparing: "Hazırlanır", delivering: "Çatdırılır", completed: "Tamamlandı", cancelled: "Ləğv edildi" },
  en: { awaiting_payment: "Awaiting payment", placed: "Placed", confirmed: "Confirmed", slaughtering: "Slaughtering", preparing: "Preparing", delivering: "Delivering", completed: "Completed", cancelled: "Cancelled" },
  ru: { awaiting_payment: "Ожидает оплаты", placed: "Оформлен", confirmed: "Подтверждён", slaughtering: "Забой", preparing: "Готовится", delivering: "Доставляется", completed: "Завершён", cancelled: "Отменён" },
};

const fill = (tpl, data = {}) => tpl.replace(/\{(\w+)\}/g, (_, k) => (data[k] ?? ""));

const T = {
  order_paid: {
    az: { title: "Ödəniş qəbul edildi", body: "Qurbanlıq sifarişiniz #{orderNumber} üçün ödəniş uğurla tamamlandı." },
    en: { title: "Payment received",    body: "Payment for your order #{orderNumber} was completed successfully." },
    ru: { title: "Платёж получен",      body: "Оплата вашего заказа #{orderNumber} успешно завершена." },
  },
  order_status: {
    az: { title: "Sifariş statusu dəyişdi", body: 'Sifarişiniz #{orderNumber} "{statusLabel}" mərhələsinə keçdi.' },
    en: { title: "Order status changed",    body: 'Your order #{orderNumber} moved to "{statusLabel}".' },
    ru: { title: "Статус заказа изменён",   body: 'Ваш заказ #{orderNumber} перешёл в статус "{statusLabel}".' },
  },
  order_media: {
    az: { title: "Kəsim media yükləndi",  body: "Sifarişinizə #{orderNumber} kəsim şəkil/videosu əlavə olundu." },
    en: { title: "Slaughter media added", body: "Slaughter photo/video was added to your order #{orderNumber}." },
    ru: { title: "Добавлено медиа",       body: "К вашему заказу #{orderNumber} добавлено фото/видео забоя." },
  },
  campaign_completed: {
    az: { title: "Qurban tamamlandı",   body: "İştirak etdiyiniz {animalName} qurbanı (#{campaignNumber}) tamamlandı." },
    en: { title: "Sacrifice completed", body: "The {animalName} sacrifice (#{campaignNumber}) you joined is completed." },
    ru: { title: "Жертва завершена",    body: "Жертва {animalName} (#{campaignNumber}), в которой вы участвовали, завершена." },
  },
  campaign_delivered: {
    az: { title: "Ehtiyac sahiblərinə çatdırıldı", body: "İştirak etdiyiniz {animalName} qurbanı (#{campaignNumber}) ehtiyac sahiblərinə çatdırıldı." },
    en: { title: "Delivered to those in need",      body: "The {animalName} sacrifice (#{campaignNumber}) was delivered to those in need." },
    ru: { title: "Доставлено нуждающимся",          body: "Жертва {animalName} (#{campaignNumber}) доставлена нуждающимся." },
  },
  campaign_cancelled: {
    az: { title: "Açılış ləğv edildi", body: "İştirak etdiyiniz {animalName} qurbanı (#{campaignNumber}) ləğv edildi." },
    en: { title: "Campaign cancelled", body: "The {animalName} sacrifice (#{campaignNumber}) was cancelled." },
    ru: { title: "Кампания отменена",  body: "Жертва {animalName} (#{campaignNumber}) была отменена." },
  },
  campaign_collecting: {
    az: { title: "Açılış yenidən aktivdir", body: "{animalName} qurbanı (#{campaignNumber}) yenidən aktivdir." },
    en: { title: "Campaign reactivated",    body: "The {animalName} sacrifice (#{campaignNumber}) is active again." },
    ru: { title: "Кампания снова активна",  body: "Жертва {animalName} (#{campaignNumber}) снова активна." },
  },
  campaign_media: {
    az: { title: "Kəsim media yükləndi",  body: "İştirak etdiyiniz {animalName} qurbanına (#{campaignNumber}) yeni media əlavə olundu." },
    en: { title: "Slaughter media added", body: "New media was added to the {animalName} sacrifice (#{campaignNumber})." },
    ru: { title: "Добавлено медиа",       body: "К жертве {animalName} (#{campaignNumber}) добавлено новое медиа." },
  },
};

const normalizeLang = (lang) => (LANGS.includes(lang) ? lang : DEFAULT_LANG);

// Bir bildirişi istifadəçinin dilinə uyğun lokallaşdırır.
// Tanınmayan type üçün saxlanılmış (AZ) title/body fallback kimi qalır.
const localizeNotification = (n, lang) => {
  const L = normalizeLang(lang);
  const obj = typeof n.toObject === "function" ? n.toObject() : { ...n };
  const tpl = T[obj.type]?.[L];
  if (tpl) {
    const data = { ...(obj.data || {}) };
    if (data.status && !data.statusLabel) {
      data.statusLabel = ORDER_STATUS_LABEL[L]?.[data.status] || data.status;
    }
    obj.title = fill(tpl.title, data);
    obj.body  = fill(tpl.body, data);
  }
  return obj;
};

module.exports = { localizeNotification, normalizeLang, LANGS, DEFAULT_LANG };
