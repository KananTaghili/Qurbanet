const Order = require("../models/Order");
const { ORDER_STATUS, ORDER_STATUS_LABELS } = require("../config/constants");
const { success, error } = require("../utils/response");

const lookupCashOrder = async (req, res) => {
  try {
    const code = String(req.query.code || "").trim().toUpperCase();
    if (!code || code.length < 4) {
      return error(res, "Kod daxil edin.", 400);
    }

    const order = await Order.findOne({ cashPickupCode: code }).select("-__v");
    if (!order) {
      return error(res, "Bu kodla sifariş tapılmadı.", 404);
    }

    return success(res, {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        cashPickupCode: order.cashPickupCode,
        animalNameAz: order.animalNameAz,
        animalType: order.animalType,
        quantity: order.quantity,
        orderMode: order.orderMode,
        sharedPortion: order.sharedPortion,
        totalPrice: order.totalPrice,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        payment: order.payment,
        contactInfo: order.contactInfo,
        distribution: order.distribution,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("lookupCashOrder xətası:", err);
    return error(res, "Axtarış zamanı xəta baş verdi.", 500);
  }
};

const confirmCashPayment = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) return error(res, "Kod tələb olunur.", 400);

    const order = await Order.findOne({ cashPickupCode: code });
    if (!order) return error(res, "Bu kodla sifariş tapılmadı.", 404);

    if (order.payment?.status === "paid") {
      return error(res, "Bu sifariş artıq ödənilmişdir.", 400);
    }
    if (order.status === ORDER_STATUS.CANCELLED) {
      return error(res, "Ləğv edilmiş sifarişi təsdiq etmək olmaz.", 400);
    }

    order.payment.status = "paid";
    order.payment.paidAt = new Date();
    order.status = ORDER_STATUS.CONFIRMED;
    order.confirmedAt = new Date();
    order.statusHistory.push({
      status: ORDER_STATUS.CONFIRMED,
      note: "Yerində ödəmə təsdiqləndi.",
    });

    await order.save();

    const { getIo } = require("../socket");
    try {
      getIo().emit("order_updated", { orderId: order._id, status: order.status });
    } catch (_) {}

    return success(res, {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        payment: order.payment,
      },
    }, "Ödəniş təsdiqləndi. Sifariş statusu yeniləndi.");
  } catch (err) {
    console.error("confirmCashPayment xətası:", err);
    return error(res, "Təsdiq zamanı xəta baş verdi.", 500);
  }
};

module.exports = { lookupCashOrder, confirmCashPayment };
