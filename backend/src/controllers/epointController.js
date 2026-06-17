const Order = require("../models/Order");
const CharityOrder = require("../models/CharityOrder");
const { ORDER_STATUS } = require("../config/constants");
const {
  createPayment,
  getTransactionStatus,
  verifySignature,
  decodeData,
  getAzPaymentErrorMessage,
} = require("../utils/epoint");
const { success, error } = require("../utils/response");

const BACKEND_URL = () => process.env.BACKEND_URL || "http://localhost:4000";
const FRONTEND_URL = () => process.env.FRONTEND_URL || "https://qurbanet.az";

// ─── Helper-lər ─────────────────────────────────────────────────────────────
// epointOrderId format:
//   Adi sifariş:      "<mongoId>_<timestamp>"
//   Xeyriyyə sifarişi: "chr_<mongoId>_<timestamp>"
const parseEpointOrderId = (raw) => {
  if (!raw) return { type: null, realId: null };
  if (raw.startsWith("chr_")) {
    const parts = raw.split("_");
    return { type: "charity", realId: parts[1] };
  }
  return { type: "order", realId: raw.split("_")[0] };
};

// Ödənişdən sonra Epoint istifadəçini bu backend ünvanlarına qaytarır.
// Epoint redirect URL-ə öz data + signature parametrlərini əlavə edir.
const callbackUrls = () => ({
  successUrl: `${BACKEND_URL()}/api/epoint/callback/success`,
  errorUrl: `${BACKEND_URL()}/api/epoint/callback/error`,
});

const frontendFailUrl = (type, message) => {
  const page = type === "charity" ? "/charity/payment" : "/order/payment";
  const params = new URLSearchParams({ payment: "fail" });
  if (message) params.set("message", message);
  return `${FRONTEND_URL()}${page}?${params.toString()}`;
};

const frontendSuccessUrl = (type) =>
  type === "charity"
    ? `${FRONTEND_URL()}/charity/confirmation`
    : `${FRONTEND_URL()}/order/confirmation?payment=success`;

// Sifarişi "ödənildi" et (idempotent — artıq ödənilibsə heç nə dəyişmir)
const markOrderPaid = async (rawOrderId, transaction) => {
  const { type, realId } = parseEpointOrderId(rawOrderId);
  if (!realId) return { type: null };

  if (type === "charity") {
    const order = await CharityOrder.findById(realId);
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      if (transaction) order.transactionId = transaction;
      await order.save();
      console.log(`[EPoint] Xeyriyyə sifarişi ödənildi: ${realId}`);
    }
    return { type, order };
  }

  const order = await Order.findById(realId);
  if (order && order.payment?.status !== "paid") {
    order.payment.status = "paid";
    order.payment.paidAt = new Date();
    if (transaction) order.payment.transactionId = transaction;
    if (order.status === ORDER_STATUS.AWAITING_PAYMENT) {
      order.status = ORDER_STATUS.PLACED;
      order.statusHistory.push({
        status: ORDER_STATUS.PLACED,
        note: "Ödəniş tamamlandı.",
      });
    }
    await order.save();
    const { getIo } = require("../socket");
    try {
      getIo().emit("new_order", { order });
    } catch (_) {}
    console.log(`[EPoint] Sifariş ödənildi: ${realId}`);
  }
  return { type, order };
};

// Sifarişi "uğursuz" et (ödənilmiş sifarişə toxunmur)
const markOrderFailed = async (rawOrderId) => {
  const { type, realId } = parseEpointOrderId(rawOrderId);
  if (!realId) return { type: null };

  if (type === "charity") {
    const order = await CharityOrder.findById(realId);
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "failed";
      await order.save();
    }
    return { type };
  }

  const order = await Order.findById(realId);
  if (order && order.payment?.status !== "paid") {
    order.payment.status = "failed";
    await order.save();
  }
  return { type };
};

// ─── Adi sifariş: ödənişi başlat ────────────────────────────────────────────
// POST /api/orders/:orderId/epoint/start
const startPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    if (order.payment?.status === "paid") {
      return error(res, "Bu sifariş artıq ödənilib.", 400);
    }

    const epointOrderId = `${order._id}_${Date.now()}`;
    const { successUrl, errorUrl } = callbackUrls();

    const result = await createPayment({
      orderId: epointOrderId,
      amount: order.totalPrice,
      description: `QurbanEt #${order.orderNumber || orderId}`,
      successUrl,
      errorUrl,
    });

    order.payment.method = "epoint";
    order.payment.status = "pending";
    order.payment.epointOrderId = epointOrderId;
    order.payment.transactionId = result.transaction;
    await order.save();

    return success(res, { redirect_url: result.redirect_url });
  } catch (err) {
    console.error("[EPoint] startPayment xətası:", err.message);
    return error(res, err.message || "Ödəniş başladıla bilmədi.", 500);
  }
};

// ─── Xeyriyyə sifarişi: ödənişi başlat ──────────────────────────────────────
// POST /api/charity-orders/:orderId/epoint/start
const startCharityPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await CharityOrder.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Xeyriyyə sifarişi tapılmadı.", 404);
    if (order.paymentStatus === "paid") {
      return error(res, "Bu sifariş artıq ödənilib.", 400);
    }

    const epointOrderId = `chr_${order._id}_${Date.now()}`;
    const { successUrl, errorUrl } = callbackUrls();

    const result = await createPayment({
      orderId: epointOrderId,
      amount: order.totalAmount,
      description: `Xeyriyyə #${order.orderNumber || orderId}`,
      successUrl,
      errorUrl,
    });

    order.paymentMethod = "epoint";
    order.paymentStatus = "pending";
    order.epointOrderId = epointOrderId;
    order.transactionId = result.transaction;
    await order.save();

    return success(res, { redirect_url: result.redirect_url });
  } catch (err) {
    console.error("[EPoint] startCharityPayment xətası:", err.message);
    return error(res, err.message || "Ödəniş başladıla bilmədi.", 500);
  }
};

// ─── Browser redirect: uğurlu ödəniş ────────────────────────────────────────
// GET /api/epoint/callback/success?data=...&signature=...
// İmza yoxlanılır, status Epoint API-dən təsdiqlənir, sonra frontend-ə yönləndirilir.
const handleSuccessCallback = async (req, res) => {
  const { data, signature } = req.query;

  if (!data || !signature || !verifySignature(data, signature)) {
    console.warn("[EPoint] callback/success: etibarsız imza");
    return res.redirect(frontendFailUrl("order", "Ödəniş təsdiqlənə bilmədi."));
  }

  const payload = decodeData(data);
  const rawOrderId = payload.order_id || payload.orderId;
  const { type } = parseEpointOrderId(rawOrderId);

  try {
    // Yekun statusu redirect parametrlərinə yox, Epoint API-yə əsasən təyin et
    const ep = await getTransactionStatus({ transaction: payload.transaction });

    if (ep.status === "success") {
      await markOrderPaid(rawOrderId, payload.transaction);
      console.log(`[EPoint] callback/success: tx=${payload.transaction} order=${rawOrderId}`);
      return res.redirect(frontendSuccessUrl(type));
    }

    const bankCode = ep.code || payload.code;
    const userMessage = getAzPaymentErrorMessage(bankCode, ep.message);
    await markOrderFailed(rawOrderId);
    console.log(`[EPoint] callback/success: status=${ep.status} tx=${payload.transaction}`);
    return res.redirect(frontendFailUrl(type, userMessage));
  } catch (err) {
    console.error("[EPoint] callback/success xətası:", err.message);
    return res.redirect(frontendFailUrl(type, "Ödəniş yoxlanıla bilmədi. Sifarişlərim bölməsini yoxlayın."));
  }
};

// ─── Browser redirect: uğursuz / ləğv edilmiş ödəniş ────────────────────────
// GET /api/epoint/callback/error?data=...&signature=...
const handleErrorCallback = async (req, res) => {
  const { data, signature } = req.query;

  let type = "order";
  let userMessage = "Ödəniş uğursuz oldu. Yenidən cəhd edin.";

  try {
    if (data && signature && verifySignature(data, signature)) {
      const payload = decodeData(data);
      const rawOrderId = payload.order_id || payload.orderId;
      ({ type } = parseEpointOrderId(rawOrderId));
      userMessage = getAzPaymentErrorMessage(payload.code, payload.message);
      await markOrderFailed(rawOrderId);
      console.log(`[EPoint] callback/error: tx=${payload.transaction} order=${rawOrderId} code=${payload.code}`);
    } else {
      console.warn("[EPoint] callback/error: data/signature yoxdur və ya etibarsızdır");
    }
  } catch (err) {
    console.error("[EPoint] callback/error xətası:", err.message);
  }

  return res.redirect(frontendFailUrl(type, userMessage));
};

// ─── Server-to-server callback ──────────────────────────────────────────────
// POST /api/epoint/result — merchant panel-də result_url olaraq qeyd et.
// Brauzer bağlansa belə ödənişin DB-yə düşməsini təmin edir.
const handleResult = async (req, res) => {
  try {
    const { data, signature } = req.body;
    if (!data || !signature) {
      console.warn("[EPoint] handleResult: data və ya signature yoxdur");
      return res.status(400).send("Bad Request");
    }

    if (!verifySignature(data, signature)) {
      console.warn("[EPoint] handleResult: imza doğrulanmadı");
      return res.status(400).send("Invalid signature");
    }

    const payload = decodeData(data);
    console.log("[EPoint] handleResult payload:", JSON.stringify(payload));

    const rawOrderId = payload.order_id || payload.orderId;

    if (payload.status === "success") {
      await markOrderPaid(rawOrderId, payload.transaction);
    } else {
      await markOrderFailed(rawOrderId);
      console.log(`[EPoint] Ödəniş uğursuz (callback): order=${rawOrderId}, status=${payload.status}`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("[EPoint] handleResult xətası:", err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  startPayment,
  startCharityPayment,
  handleSuccessCallback,
  handleErrorCallback,
  handleResult,
};
