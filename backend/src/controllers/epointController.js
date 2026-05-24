const Order = require("../models/Order");
const CharityOrder = require("../models/CharityOrder");
const { createPayment, getTransactionStatus, verifySignature, decodeData, getAzPaymentErrorMessage } = require("../utils/epoint");
const { success, error } = require("../utils/response");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// ─── Helper ────────────────────────────────────────────────────────────────
// epointOrderId format:
//   Regular order:  "<mongoId>_<timestamp>"
//   Charity order:  "chr_<mongoId>_<timestamp>"
const parseEpointOrderId = (raw) => {
  if (!raw) return { type: null, realId: null };
  if (raw.startsWith("chr_")) {
    const parts = raw.split("_"); // ["chr", "<mongoId>", "<timestamp>"]
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

    // EPoint eyni order_id-ni ikinci dəfə qəbul etmir — timestamp əlavə et
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

    // ep.code is the bank response code per EPoint API docs (page 8: "code — Bankın cavab kodu")
    // ep.bank_response is the bank's textual response — different field
    const bankCode = ep.code || ep.bank_code || ep.bank_response_code ||
      ep.rc || ep.response_code || ep.bank_rc || ep.error_code;

    const userMessage = ep.status !== "success"
      ? getAzPaymentErrorMessage(bankCode, ep.message)
      : null;

    console.log(`[EPoint] verifyPayment: status=${ep.status} code=${ep.code} bank_response=${ep.bank_response} userMessage=${userMessage}`);

    if (ep.status === "success") {
      order.payment.status = "paid";
      order.payment.paidAt = new Date();
      if (ep.transaction) order.payment.transactionId = ep.transaction;
      await order.save();
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

    console.log(`[EPoint] verifyCharityPayment: status=${ep.status} code=${ep.code} bank_response=${ep.bank_response} userMessage=${userMessage}`);

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
// POST /api/epoint/result  — Epoint merchant panel-də result_url olaraq qeyd et
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

    const status = payload.status;
    const rawOrderId = payload.orderId || payload.order_id;
    const transaction = payload.transaction;

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
    // Log all params EPoint sends — helps identify bank_code field name
    console.log("[EPoint] handleReturn ALL params:", JSON.stringify(req.query));
    const isPaid = status === "success";

    // Optimistically mark as paid (server callback is authoritative, but be fast for UX)
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
          await order.save();
          console.log(`[EPoint] Sifariş ödənildi (browser return): ${orderId}`);
        }
      }
    }

    const titleAz = isPaid ? "Ödəniş uğurlu" : "Ödəniş uğursuz";
    const headingAz = isPaid ? "Ödəniş uğurlu tamamlandı!" : "Ödəniş uğursuz oldu";
    const bodyAz = isPaid
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
      // React Native WebView
      try { if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(msg); } } catch(e) {}
      // Web iframe parent
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

module.exports = {
  startPayment,
  verifyPayment,
  startCharityPayment,
  verifyCharityPayment,
  handleResult,
  handleReturn,
};
