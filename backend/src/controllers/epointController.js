const Order = require("../models/Order");
const CharityOrder = require("../models/CharityOrder");
const { ORDER_STATUS } = require("../config/constants");
const {
  createPayment,
  createPreAuth,
  completePreAuth,
  getTransactionStatus,
  reverseTransaction,
  registerCard,
  executePayWithCard,
  createWidget,
  verifySignature,
  decodeData,
  getAzPaymentErrorMessage,
} = require("../utils/epoint");
const { success, error } = require("../utils/response");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// In-memory transaction store (mirrors Qurbanet-Service pattern)
const txStore = new Map();

// ─── Helper ────────────────────────────────────────────────────────────────
// epointOrderId format:
//   Regular order:  "<mongoId>_<timestamp>"
//   Charity order:  "chr_<mongoId>_<timestamp>"
const parseEpointOrderId = (raw) => {
  if (!raw) return { type: null, realId: null };
  if (raw.startsWith("chr_")) {
    const parts = raw.split("_");
    return { type: "charity", realId: parts[1] };
  }
  return { type: "order", realId: raw.split("_")[0] };
};

// ─── Regular Order: Start ──────────────────────────────────────────────────
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

    const successUrl = `${BACKEND_URL}/api/epoint/return?orderId=${orderId}&status=success`;
    const errorUrl   = `${BACKEND_URL}/api/epoint/return?orderId=${orderId}&status=fail`;

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

    txStore.set(result.transaction, {
      transaction:   result.transaction,
      orderId:       epointOrderId,
      amount:        String(order.totalPrice),
      currency:      "AZN",
      createdAt:     new Date().toISOString(),
      paymentStatus: "pending",
      mongoOrderId:  String(orderId),
    });

    return success(res, { redirect_url: result.redirect_url });
  } catch (err) {
    console.error("[EPoint] startPayment xətası:", err.message);
    return error(res, err.message || "Ödəniş başladıla bilmədi.", 500);
  }
};

// ─── Regular Order: Verify ─────────────────────────────────────────────────
// POST /api/orders/:orderId/epoint/verify
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Sifariş tapılmadı.", 404);

    if (order.payment?.status === "paid") {
      return success(res, { order });
    }

    const epointOrderId = order.payment?.epointOrderId;
    if (!epointOrderId) return error(res, "Ödəniş başladılmayıb.", 400);

    const lookup = order.payment?.transactionId
      ? { transaction: order.payment.transactionId }
      : { order_id: epointOrderId };

    const ep = await getTransactionStatus(lookup);

    const bankCode = ep.code || ep.bank_code || ep.bank_response_code ||
      ep.rc || ep.response_code || ep.bank_rc || ep.error_code;

    const userMessage = ep.status !== "success"
      ? getAzPaymentErrorMessage(bankCode, ep.message)
      : null;

    console.log(`[EPoint] verifyPayment: status=${ep.status} code=${ep.code} userMessage=${userMessage}`);

    if (ep.status === "success") {
      order.payment.status = "paid";
      order.payment.paidAt = new Date();
      if (ep.transaction) order.payment.transactionId = ep.transaction;
      if (order.status === ORDER_STATUS.AWAITING_PAYMENT) {
        order.status = ORDER_STATUS.PLACED;
        order.statusHistory.push({ status: ORDER_STATUS.PLACED, note: "Ödəniş tamamlandı." });
      }
      await order.save();

      const stored = txStore.get(order.payment.transactionId);
      if (stored) {
        stored.paymentStatus = "success";
        stored.verifiedAt = new Date().toISOString();
      }

      console.log(`[EPoint] verifyPayment: ödənildi: ${orderId}`);
    }

    return success(res, { order, epointStatus: ep.status, userMessage });
  } catch (err) {
    console.error("[EPoint] verifyPayment xətası:", err.message);
    return error(res, "Ödəniş yoxlanıla bilmədi.", 500);
  }
};

// ─── Charity Order: Start ──────────────────────────────────────────────────
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

    const successUrl = `${BACKEND_URL}/api/epoint/return?type=charity&orderId=${orderId}&status=success`;
    const errorUrl   = `${BACKEND_URL}/api/epoint/return?type=charity&orderId=${orderId}&status=fail`;

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

    txStore.set(result.transaction, {
      transaction:   result.transaction,
      orderId:       epointOrderId,
      amount:        String(order.totalAmount),
      currency:      "AZN",
      createdAt:     new Date().toISOString(),
      paymentStatus: "pending",
      mongoOrderId:  String(orderId),
      orderType:     "charity",
    });

    return success(res, { redirect_url: result.redirect_url });
  } catch (err) {
    console.error("[EPoint] startCharityPayment xətası:", err.message);
    return error(res, err.message || "Ödəniş başladıla bilmədi.", 500);
  }
};

// ─── Charity Order: Verify ─────────────────────────────────────────────────
// POST /api/charity-orders/:orderId/epoint/verify
const verifyCharityPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await CharityOrder.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Xeyriyyə sifarişi tapılmadı.", 404);

    if (order.paymentStatus === "paid") {
      return success(res, { order });
    }

    const epointOrderId = order.epointOrderId;
    if (!epointOrderId) return error(res, "Ödəniş başladılmayıb.", 400);

    const lookup = order.transactionId
      ? { transaction: order.transactionId }
      : { order_id: epointOrderId };

    const ep = await getTransactionStatus(lookup);

    const bankCode = ep.code || ep.bank_code || ep.bank_response_code ||
      ep.rc || ep.response_code || ep.bank_rc || ep.error_code;

    const userMessage = ep.status !== "success"
      ? getAzPaymentErrorMessage(bankCode, ep.message)
      : null;

    console.log(`[EPoint] verifyCharityPayment: status=${ep.status} code=${ep.code} userMessage=${userMessage}`);

    if (ep.status === "success") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      if (ep.transaction) order.transactionId = ep.transaction;
      await order.save();
      console.log(`[EPoint] verifyCharityPayment: ödənildi: ${orderId}`);
    }

    return success(res, { order, epointStatus: ep.status, userMessage });
  } catch (err) {
    console.error("[EPoint] verifyCharityPayment xətası:", err.message);
    return error(res, "Ödəniş yoxlanıla bilmədi.", 500);
  }
};

// ─── Server-to-Server Callback ─────────────────────────────────────────────
// POST /api/epoint/result  — merchant panel-də result_url olaraq qeyd et
// POST /api/epoint/callback/result — Qurbanet-Service uyğun alternativ yol
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

    const status      = payload.status;
    const rawOrderId  = payload.orderId || payload.order_id;
    const transaction = payload.transaction;
    const { rrn, card_mask, card_name, operation_code, code } = payload;

    // Update in-memory store
    const stored = txStore.get(transaction);
    if (stored) {
      stored.paymentStatus  = status;
      stored.verifiedAt     = new Date().toISOString();
      stored.code           = code           || stored.code           || null;
      stored.cardMask       = card_mask      || stored.cardMask       || null;
      stored.cardName       = card_name      || stored.cardName       || null;
      stored.rrn            = rrn            || stored.rrn            || null;
      stored.operationCode  = operation_code || stored.operationCode  || null;
    }

    const { type, realId } = parseEpointOrderId(rawOrderId);

    if (status === "success" && realId) {
      if (type === "charity") {
        const order = await CharityOrder.findById(realId);
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.paidAt = new Date();
          if (transaction) order.transactionId = transaction;
          await order.save();
          console.log(`[EPoint] Xeyriyyə sifarişi ödənildi (callback): ${realId}`);
        }
      } else {
        const order = await Order.findById(realId);
        if (order && order.payment?.status !== "paid") {
          order.payment.status = "paid";
          order.payment.paidAt = new Date();
          if (transaction) order.payment.transactionId = transaction;
          if (order.status === ORDER_STATUS.AWAITING_PAYMENT) {
            order.status = ORDER_STATUS.PLACED;
            order.statusHistory.push({ status: ORDER_STATUS.PLACED, note: "Ödəniş tamamlandı." });
          }
          await order.save();
          console.log(`[EPoint] Sifariş ödənildi (callback): ${realId}`);
        }
      }
    } else {
      console.log(`[EPoint] Ödəniş uğursuz: order=${rawOrderId}, status=${status}`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("[EPoint] handleResult xətası:", err.message);
    res.status(500).send("Server Error");
  }
};

// ─── Browser Redirect (success / fail page) ───────────────────────────────
// GET /api/epoint/return?type=order|charity&orderId=xxx&status=success|fail
const handleReturn = async (req, res) => {
  try {
    const { orderId, status, type = "order" } = req.query;
    console.log("[EPoint] handleReturn ALL params:", JSON.stringify(req.query));
    const isPaid = status === "success";

    if (isPaid && orderId) {
      if (type === "charity") {
        const order = await CharityOrder.findById(orderId);
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.paidAt = new Date();
          await order.save();
          console.log(`[EPoint] Xeyriyyə sifarişi ödənildi (browser return): ${orderId}`);
        }
      } else {
        const order = await Order.findById(orderId);
        if (order && order.payment?.status !== "paid") {
          order.payment.status = "paid";
          order.payment.paidAt = new Date();
          if (order.status === ORDER_STATUS.AWAITING_PAYMENT) {
            order.status = ORDER_STATUS.PLACED;
            order.statusHistory.push({ status: ORDER_STATUS.PLACED, note: "Ödəniş tamamlandı." });
          }
          await order.save();
          console.log(`[EPoint] Sifariş ödənildi (browser return): ${orderId}`);
        }
      }
    }

    const titleAz   = isPaid ? "Ödəniş uğurlu" : "Ödəniş uğursuz";
    const headingAz = isPaid ? "Ödəniş uğurlu tamamlandı!" : "Ödəniş uğursuz oldu";
    const bodyAz    = isPaid
      ? "Sifarişiniz qəbul edildi. Tətbiqə qayıdın."
      : "Ödəniş zamanı xəta baş verdi. Tətbiqdən yenidən cəhd edin.";
    const iconColor = isPaid ? "#1B5E20" : "#C62828";

    res.send(`<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${titleAz}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#f4f6f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border-radius:24px;padding:44px 28px;text-align:center;max-width:380px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.10)}
    .icon{font-size:72px;line-height:1;margin-bottom:20px}
    h1{font-size:22px;font-weight:800;color:${iconColor};margin-bottom:10px}
    p{font-size:14px;color:#555;line-height:1.65}
    .note{margin-top:22px;font-size:13px;color:#888;background:#f8f8f8;border-radius:12px;padding:14px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isPaid ? "✅" : "❌"}</div>
    <h1>${headingAz}</h1>
    <p>${bodyAz}</p>
    <div class="note">${isPaid ? "Sifariş statusunuzu tətbiqdən izləyə bilərsiniz." : "Brauzeri bağlayıb tətbiqdən yenidən cəhd edin."}</div>
  </div>
  <script>
    (function() {
      var msg = JSON.stringify({
        type: 'EPOINT_RESULT',
        orderType: '${type}',
        status: '${isPaid ? "success" : "fail"}',
        orderId: '${orderId || ""}'
      });
      try { if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(msg); } } catch(e) {}
      try { window.parent.postMessage(JSON.parse(msg), '*'); } catch(e) {}
    })();
  </script>
</body>
</html>`);
  } catch (err) {
    console.error("[EPoint] handleReturn xətası:", err);
    res.status(500).send("Xəta baş verdi");
  }
};

// ─── Regular Order: Widget (Google Pay / Apple Pay) ───────────────────────
// POST /api/orders/:orderId/epoint/widget
const startWidgetPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Sifariş tapılmadı.", 404);
    if (order.payment?.status === "paid") {
      return error(res, "Bu sifariş artıq ödənilib.", 400);
    }

    const epointOrderId = `${order._id}_${Date.now()}`;

    const result = await createWidget({
      orderId: epointOrderId,
      amount: order.totalPrice,
      description: `QurbanEt #${order.orderNumber || orderId}`,
    });

    order.payment.method = "epoint";
    order.payment.status = "pending";
    order.payment.epointOrderId = epointOrderId;
    await order.save();

    return success(res, { widget_url: result.widget_url });
  } catch (err) {
    console.error("[EPoint] startWidgetPayment xətası:", err.message);
    return error(res, err.message || "Google Pay başladıla bilmədi.", 500);
  }
};

// ─── Charity Order: Widget (Google Pay / Apple Pay) ───────────────────────
// POST /api/charity-orders/:orderId/epoint/widget
const startCharityWidgetPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await CharityOrder.findOne({ _id: orderId, user: req.userId });
    if (!order) return error(res, "Xeyriyyə sifarişi tapılmadı.", 404);
    if (order.paymentStatus === "paid") {
      return error(res, "Bu sifariş artıq ödənilib.", 400);
    }

    const epointOrderId = `chr_${order._id}_${Date.now()}`;

    const result = await createWidget({
      orderId: epointOrderId,
      amount: order.totalAmount,
      description: `Xeyriyyə #${order.orderNumber || orderId}`,
    });

    order.paymentMethod = "epoint";
    order.paymentStatus = "pending";
    order.epointOrderId = epointOrderId;
    await order.save();

    return success(res, { widget_url: result.widget_url });
  } catch (err) {
    console.error("[EPoint] startCharityWidgetPayment xətası:", err.message);
    return error(res, err.message || "Google Pay başladıla bilmədi.", 500);
  }
};

// ─── Standalone: Create Transaction (no MongoDB) ─────────────────────────
// POST /api/epoint/create-transaction
const createTransactionHandler = async (req, res) => {
  const { amount, currency, description, orderId, successRedirectUrl, errorRedirectUrl } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Yanlış məbləğ" });
  }

  const resolvedOrderId = orderId || `ORD-${Date.now()}`;

  try {
    const result = await createPayment({
      amount: String(amount), currency, orderId: resolvedOrderId, description,
      successUrl: successRedirectUrl,
      errorUrl:   errorRedirectUrl,
    });

    txStore.set(result.transaction, {
      transaction:   result.transaction,
      orderId:       resolvedOrderId,
      amount:        String(amount),
      currency:      currency || "AZN",
      description:   description || "",
      createdAt:     new Date().toISOString(),
      paymentStatus: "new",
    });

    console.log(`[create-transaction] tx=${result.transaction} order=${resolvedOrderId} amount=${amount}`);
    return res.json({ transaction: result.transaction, redirectUrl: result.redirect_url });
  } catch (err) {
    console.error("[create-transaction]", err.message);
    return res.status(502).json({ error: "Əməliyyat yaradıla bilmədi" });
  }
};

// ─── Standalone: Create Pre-Auth ─────────────────────────────────────────
// POST /api/epoint/create-preauth
const createPreAuthHandler = async (req, res) => {
  const { amount, currency, description, orderId, successRedirectUrl, errorRedirectUrl } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Yanlış məbləğ" });
  }

  const resolvedOrderId = orderId || `PREAUTH-${Date.now()}`;

  try {
    const result = await createPreAuth({
      amount: String(amount), currency, orderId: resolvedOrderId, description,
      successUrl: successRedirectUrl,
      errorUrl:   errorRedirectUrl,
    });

    if (result.status !== "success") {
      return res.status(502).json({ error: "Epoint preauth sorğusunu rədd etdi", details: result });
    }

    txStore.set(result.transaction, {
      transaction:   result.transaction,
      orderId:       resolvedOrderId,
      amount:        String(amount),
      currency:      currency || "AZN",
      description:   description || "",
      createdAt:     new Date().toISOString(),
      paymentStatus: "new",
      operationCode: "preauth",
    });

    console.log(`[create-preauth] tx=${result.transaction} order=${resolvedOrderId} amount=${amount}`);
    return res.json({ transaction: result.transaction, redirectUrl: result.redirect_url });
  } catch (err) {
    console.error("[create-preauth]", err.message);
    return res.status(502).json({ error: "Preauth yaradıla bilmədi" });
  }
};

// ─── Standalone: Complete Pre-Auth ───────────────────────────────────────
// POST /api/epoint/preauth-complete/:id
const completePreAuthHandler = async (req, res) => {
  const { id: transaction } = req.params;
  const local  = txStore.get(transaction);
  const amount = req.body.amount ?? local?.amount;

  if (!amount) {
    return res.status(400).json({ error: "Məbləğ tələb olunur" });
  }

  try {
    const result = await completePreAuth(transaction, String(amount));

    if (local) {
      local.paymentStatus = result.status === "success" ? "success" : "error";
      local.verifiedAt    = new Date().toISOString();
    }

    console.log(`[preauth-complete] tx=${transaction} status=${result.status}`);
    return res.json({ status: result.status, details: result });
  } catch (err) {
    console.error("[preauth-complete]", err.message);
    return res.status(502).json({ error: "Preauth tamamlana bilmədi" });
  }
};

// ─── Standalone: Get Transaction Status ──────────────────────────────────
// GET /api/epoint/transaction/:id
const getTransactionHandler = async (req, res) => {
  const { id: transaction } = req.params;

  try {
    const statusRes = await getTransactionStatus({ transaction });
    const stored    = txStore.get(transaction);

    if (stored && statusRes.status && statusRes.status !== "new") {
      stored.paymentStatus = statusRes.status;
      stored.verifiedAt    = new Date().toISOString();
      stored.cardMask      = statusRes.card_mask || stored.cardMask || null;
      stored.cardName      = statusRes.card_name || stored.cardName || null;
      stored.rrn           = statusRes.rrn        || stored.rrn       || null;
    }

    return res.json({ transaction: statusRes, local: stored || null });
  } catch (err) {
    console.error("[transaction/:id]", err.message);
    return res.status(502).json({ error: "Status alına bilmədi" });
  }
};

// ─── Standalone: List Transactions ───────────────────────────────────────
// GET /api/epoint/transactions
const getTransactionsHandler = (req, res) => {
  const transactions = Array.from(txStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return res.json({ transactions });
};

// ─── Standalone: Reverse Transaction ─────────────────────────────────────
// POST /api/epoint/reverse/:id
const reverseHandler = async (req, res) => {
  const { id: transaction } = req.params;
  const { currency, amount } = req.body;

  try {
    const result = await reverseTransaction(transaction, currency || "AZN", amount);
    const stored = txStore.get(transaction);

    if (stored && result.status === "success") {
      stored.paymentStatus = "returned";
    }

    console.log(`[reverse] tx=${transaction} status=${result.status}`);
    return res.json(result);
  } catch (err) {
    console.error("[reverse]", err.message);
    return res.status(502).json({ error: "Geri ödəniş icra edilə bilmədi" });
  }
};

// ─── Standalone: Card Registration ───────────────────────────────────────
// POST /api/epoint/card-registration
const registerCardHandler = async (req, res) => {
  const { description, successRedirectUrl, errorRedirectUrl } = req.body;
  try {
    const result = await registerCard({
      description,
      successUrl: successRedirectUrl,
      errorUrl:   errorRedirectUrl,
    });
    if (result.status !== "success") {
      return res.status(502).json({ error: "Kart qeydiyyatı uğursuz oldu", details: result });
    }
    return res.json({
      transaction: result.transaction,
      redirectUrl: result.redirect_url,
      card_id:     result.card_id,
    });
  } catch (err) {
    console.error("[card-registration]", err.message);
    return res.status(502).json({ error: "Kart qeydə alına bilmədi" });
  }
};

// ─── Standalone: Execute Pay with Card ───────────────────────────────────
// POST /api/epoint/execute-pay
const executePayHandler = async (req, res) => {
  const { cardId, orderId, amount, currency, description } = req.body;

  if (!cardId || !orderId || !amount) {
    return res.status(400).json({ error: "cardId, orderId və amount tələb olunur" });
  }

  try {
    const result = await executePayWithCard({ cardId, orderId, amount: String(amount), currency, description });

    txStore.set(result.transaction, {
      transaction:   result.transaction,
      orderId,
      amount:        String(amount),
      currency:      currency || "AZN",
      description:   description || "",
      createdAt:     new Date().toISOString(),
      paymentStatus: result.status === "success" ? "success" : "error",
      cardMask:      result.card_mask || null,
      cardName:      result.card_name || null,
      rrn:           result.rrn       || null,
    });

    console.log(`[execute-pay] tx=${result.transaction} status=${result.status}`);
    return res.json(result);
  } catch (err) {
    console.error("[execute-pay]", err.message);
    return res.status(502).json({ error: "Ödəniş icra edilə bilmədi" });
  }
};

module.exports = {
  // Order-specific
  startPayment,
  verifyPayment,
  startWidgetPayment,
  startCharityPayment,
  verifyCharityPayment,
  startCharityWidgetPayment,
  // Callbacks & redirects
  handleResult,
  handleReturn,
  // Standalone operations
  createTransactionHandler,
  createPreAuthHandler,
  completePreAuthHandler,
  getTransactionHandler,
  getTransactionsHandler,
  reverseHandler,
  registerCardHandler,
  executePayHandler,
  // Store (for admin / testing)
  txStore,
};
