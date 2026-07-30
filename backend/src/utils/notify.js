const Notification = require("../models/Notification");

/**
 * İstifadəçi(lər)ə in-app bildiriş yaradır.
 *
 * @param {string|ObjectId|Array} userIds  - bir və ya bir neçə istifadəçi (null/undefined avtomatik atılır)
 * @param {Object} payload
 * @param {"qurban"|"charity"|"meat"|"news"} payload.module
 * @param {string} payload.type   - hadisə tipi
 * @param {string} payload.title
 * @param {string} [payload.body]
 * @param {Object} [payload.data] - { campaignId, orderId, status, ... }
 *
 * Qeyd: Push notification HƏLƏ yoxdur. Gələcəkdə əlavə ediləndə yeganə yer
 * aşağıdakı "FUTURE: push" blokudur — başqa heç bir kodu dəyişmək lazım olmayacaq.
 */
async function notify(userIds, { module, type, title, body = "", data = {} }) {
  const ids = [...new Set(
    (Array.isArray(userIds) ? userIds : [userIds])
      .filter(Boolean)
      .map((x) => String(x)),
  )];
  if (!ids.length) return [];

  const docs = ids.map((u) => ({ user: u, module, type, title, body, data }));
  let created = [];
  try {
    created = await Notification.insertMany(docs);
  } catch (err) {
    console.error("[notify] insert xətası:", err.message);
    return [];
  }

  // Canlı badge yenilənməsi + toast bildirişi üçün hər istifadəçinin socket otağına
  // öz sənədini göndəririk (badge sayğacını yeniləmək üçün, həm də ekranda anında
  // banner göstərmək üçün title/body kifayətdir — əlavə sorğu lazım deyil).
  try {
    const { getIo } = require("../socket");
    const io = getIo();
    created.forEach((n) => {
      io.to(`user:${n.user}`).emit("notification_new", {
        _id: n._id,
        module: n.module,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        createdAt: n.createdAt,
      });
    });
  } catch (_) {}

  // FUTURE: push notification — buraya əlavə olunacaq (FCM/APNs və s.)
  // for (const n of created) { await sendPush(n.user, n.title, n.body, n.data); }

  return created;
}

module.exports = { notify };
