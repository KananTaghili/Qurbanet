"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import api from "../../../../lib/api";

export default function MeatCheckoutConfirmationPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem("meatbox_pending_order") || "null");
    } catch {
      /* ignore */
    }
    if (saved?.orderId) {
      api
        .get(`/meat/orders/${saved.orderId}`)
        .then((res) => setOrder(res.data?.data?.order))
        .catch(() => {});
      sessionStorage.removeItem("meatbox_pending_order");
    }
  }, []);

  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#dcfce7]">
        <CheckCircle2 className="h-9 w-9 text-[#16a34a]" />
      </div>
      <h1 className="text-lg font-bold text-[#292524]">Ödəniş uğurla tamamlandı!</h1>
      <p className="max-w-sm text-sm text-[#78716c]">
        {order?.orderNumber
          ? `Sifarişiniz #${order.orderNumber} qəbul edildi. Tezliklə hazırlanıb ünvanınıza çatdırılacaq.`
          : "Sifarişiniz qəbul edildi. Tezliklə hazırlanıb ünvanınıza çatdırılacaq."}
      </p>
      <button
        onClick={() => router.push("/meat/orders")}
        className="mt-2 h-11 px-6 rounded-xl bg-[#f97316] text-white text-[14px] font-extrabold active:scale-[.98] transition-all"
      >
        Sifarişlərimə keç
      </button>
    </div>
  );
}
