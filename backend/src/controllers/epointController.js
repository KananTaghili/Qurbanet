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

// Epoint redirect URL-lərinə data/signature əlavə ETMİR — ona görə öz
// orderId-mizi query-də ötürürük. Bu yalnız axtarış açarıdır: "ödənildi"
// qərarı heç vaxt query-yə yox, Epoint get-status cavabına əsaslanır.
const callbackUrls = (type, mongoOrderId) => {
  const qs = `type=${type}&orderId=${mongoOrderId}`;
  return {
    successUrl: `${BACKEND_URL()}/api/epoint/callback/success?${qs}`,
    errorUrl: `${BACKEND_URL()}/api/epoint/callback/error?${qs}`,
  };
};

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

const findOrderByType = (type, id) =>
  type === "charity" ? CharityOrder.findById(id) : Order.findById(id);

// Sifarişi "ödənildi" et (idempotent — artıq ödənilibsə heç nə dəyişmir)
const applyPaid = async (type, order, transaction) => {
  if (!order) return;

  if (type === "charity") {
    if (order.paymentStatus === "paid") return;
    order.paymentStatus = "paid";
    order.paidAt = new Date();
    if (transaction) order.transactionId = transaction;
    await order.save();
    console.log(`[EPoint] Xeyriyyə sifarişi ödənildi: ${order._id}`);
    return;
  }

  if (order.payment?.status === "paid") return;
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
  console.log(`[EPoint] Sifariş ödənildi: ${order._id}`);
};

// Sifarişi "uğursuz" et (ödənilmiş sifarişə toxunmur)
const applyFailed = async (type, order) => {
  if (!order) return;
  if (type === "charity") {
    if (order.paymentStatus === "paid") return;
    order.paymentStatus = "failed";
    await order.save();
    return;
  }
  if (order.payment?.status === "paid") return;
  order.payment.status = "failed";
  await order.save();
};

// Epoint-dən sifarişin real statusunu soruş (transaction ID və ya order_id ilə)
const fetchEpointStatus = async (type, order) => {
  const transactionId =
    type === "charity" ? order.transactionId : order.payment?.transactionId;
  const epointOrderId =
    type === "charity" ? order.epointOrderId : order.payment?.epointOrderId;

  if (!transactionId && !epointOrderId) return null;
  const lookup = transactionId
    ? { transaction: transactionId }
    : { order_id: epointOrderId };
  return getTransactionStatus(lookup);
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
    const { successUrl, errorUrl } = callbackUrls("order", order._id);

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
    const { successUrl, errorUrl } = callbackUrls("charity", order._id);

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
// GET /api/epoint/callback/success?type=order|charity|campaign&orderId=<mongoId>
// Status query-yə əsasən YOX, Epoint get-status API-dən təsdiqlənir.
const handleSuccessCallback = async (req, res) => {
  const { type = "order", orderId, donationId } = req.query;

  // ─── Xeyriyyə kampaniyası ─────────────────────────────────────────────────
  if (type === "campaign") {
    try {
      const { handleCampaignSuccess } = require("./charityCampaignController");
      const result = await handleCampaignSuccess(orderId, donationId);
      return res.redirect(result.redirectUrl);
    } catch (err) {
      console.error("[EPoint] campaign callback xətası:", err.message);
      const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${FRONTEND}/charity?payment=fail&message=${encodeURIComponent("Ödəniş yoxlanıla bilmədi")}`);
    }
  }

  try {
    const order = orderId ? await findOrderByType(type, orderId) : null;
    if (!order) {
      console.warn(`[EPoint] callback/success: sifariş tapılmadı (${type}/${orderId})`);
      return res.redirect(frontendFailUrl(type, "Sifariş tapılmadı."));
    }

    const ep = await fetchEpointStatus(type, order);
    if (!ep) {
      return res.redirect(frontendFailUrl(type, "Ödəniş başladılmayıb."));
    }

    if (ep.status === "success") {
      await applyPaid(type, order, ep.transaction);
      console.log(`[EPoint] callback/success: təsdiqləndi (${type}/${orderId})`);
      return res.redirect(frontendSuccessUrl(type));
    }

    const userMessage = getAzPaymentErrorMessage(ep.code, ep.message);
    await applyFailed(type, order);
    console.log(`[EPoint] callback/success: status=${ep.status} (${type}/${orderId})`);
    return res.redirect(frontendFailUrl(type, userMessage));
  } catch (err) {
    console.error("[EPoint] callback/success xətası:", err.message);
    return res.redirect(
      frontendFailUrl(type, "Ödəniş yoxlanıla bilmədi. Sifarişlərim bölməsini yoxlayın."),
    );
  }
};

// ─── Browser redirect: uğursuz / ləğv edilmiş ödəniş ────────────────────────
// GET /api/epoint/callback/error?type=order|charity|campaign&orderId=<mongoId>
const handleErrorCallback = async (req, res) => {
  const { type = "order", orderId, donationId } = req.query;

  if (type === "campaign") {
    try {
      const { handleCampaignError } = require("./charityCampaignController");
      const url = await handleCampaignError(orderId, donationId);
      return res.redirect(url);
    } catch (_) {}
    const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${FRONTEND}/charity?payment=fail&message=${encodeURIComponent("Ödəniş uğursuz oldu")}`);
  }

  let userMessage = "Ödəniş uğursuz oldu. Yenidən cəhd edin.";

  try {
    const order = orderId ? await findOrderByType(type, orderId) : null;
    if (order) {
      // Bank xətasının səbəbini get-status-dan götür (kart kodu və s.)
      const ep = await fetchEpointStatus(type, order);
      if (ep && ep.status === "success") {
        // Nadirən error redirect-inə düşsə belə ödəniş uğurlu ola bilər
        await applyPaid(type, order, ep.transaction);
        return res.redirect(frontendSuccessUrl(type));
      }
      if (ep) userMessage = getAzPaymentErrorMessage(ep.code, ep.message);
      await applyFailed(type, order);
      console.log(`[EPoint] callback/error: status=${ep?.status} (${type}/${orderId})`);
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
    const { type, realId } = parseEpointOrderId(rawOrderId);
    if (!realId) return res.status(200).send("OK");

    const order = await findOrderByType(type, realId);

    if (payload.status === "success") {
      await applyPaid(type, order, payload.transaction);
    } else {
      await applyFailed(type, order);
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
