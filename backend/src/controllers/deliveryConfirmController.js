const Order = require("../models/Order");
const { ORDER_STATUS, ORDER_STATUS_LABELS } = require("../config/constants");
const { success, error } = require("../utils/response");

const lookupDeliveryOrder = async (req, res) => {
  try {
    const code = String(req.query.code || "").trim().toUpperCase();
    if (!code || code.length < 4) {
      return error(res, "Kod daxil edin.", 400);
    }

    const order = await Order.findOne({ deliveryConfirmCode: code }).select("-__v");
    if (!order) {
      return error(res, "Bu kodla sifariş tapılmadı.", 404);
    }

    return success(res, {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        deliveryConfirmCode: order.deliveryConfirmCode,
        animalNameAz: order.animalNameAz,
        animalType: order.animalType,
        quantity: order.quantity,
        orderMode: order.orderMode,
        sharedPortion: order.sharedPortion,
        totalPrice: order.totalPrice,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        distribution: order.distribution,
        deliveryProof: order.deliveryProof,
        contactInfo: order.contactInfo,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("lookupDeliveryOrder xətası:", err);
    return error(res, "Axtarış zamanı xəta baş verdi.", 500);
  }
};

const confirmDelivery = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) return error(res, "Kod tələb olunur.", 400);

    const order = await Order.findOne({ deliveryConfirmCode: code });
    if (!order) return error(res, "Bu kodla sifariş tapılmadı.", 404);

    if (order.status === ORDER_STATUS.COMPLETED) {
      return error(res, "Bu sifariş artıq tamamlanmışdır.", 400);
    }
    if (order.status === ORDER_STATUS.CANCELLED) {
      return error(res, "Ləğv edilmiş sifarişi təsdiq etmək olmaz.", 400);
    }

    order.deliveryProof = order.deliveryProof || {};
    order.deliveryProof.handoverCode = code;
    order.deliveryProof.handoverCodeVerifiedAt = new Date();
    order.deliveryProof.handoverCodeVerifiedBy = "Admin";

    order.status = ORDER_STATUS.COMPLETED;
    order.statusHistory.push({
      status: ORDER_STATUS.COMPLETED,
      note: "Çatdırılma kodu ilə təsdiqləndi.",
    });

    await order.save();

    const { getIo } = require("../socket");
    try {
      getIo().to(`user:${order.user}`).emit("order:updated", { orderId: order._id.toString() });
    } catch (_) {}

    return success(
      res,
      {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
          deliveryProof: order.deliveryProof,
        },
      },
      "Çatdırılma təsdiqləndi. Sifariş tamamlandı.",
    );
  } catch (err) {
    console.error("confirmDelivery xətası:", err);
    return error(res, "Təsdiq zamanı xəta baş verdi.", 500);
  }
};

module.exports = { lookupDeliveryOrder, confirmDelivery };
