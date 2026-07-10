"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";
import api from "../../../lib/api";

const STATUS_LABELS = {
  awaiting_payment: "Ödəniş gözlənilir",
  placed: "Sifariş verildi",
  preparing: "Hazırlanır",
  delivering: "Çatdırılır",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};

const STATUS_COLORS = {
  awaiting_payment: "#a8a29e",
  placed: "#2563eb",
  preparing: "#d97706",
  delivering: "#7c3aed",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

export default function MeatOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/meat/orders/my")
      .then((res) => setOrders(res.data?.data?.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#ffedd5]">
          <ClipboardList className="h-8 w-8 text-[#f97316]" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Hələ sifarişiniz yoxdur</h1>
        <p className="max-w-sm text-sm text-text-secondary">Ət Satışından sifariş verdikdən sonra burada görünəcək.</p>
        <button
          onClick={() => router.push("/meat")}
          className="h-10 px-5 rounded-xl bg-[#f97316] text-white text-[13px] font-extrabold"
        >
          Alış-verişə başla
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto space-y-2.5">
      {orders.map((o) => (
        <div key={o._id} className="rounded-2xl border border-[#f0ede8] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-extrabold text-[#292524]">#{o.orderNumber}</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: STATUS_COLORS[o.status], background: `${STATUS_COLORS[o.status]}18` }}
            >
              {STATUS_LABELS[o.status] || o.status}
            </span>
          </div>
          <p className="text-[11px] text-[#a8a29e] mb-2">
            {o.items.length} məhsul · {new Date(o.createdAt).toLocaleDateString("az-AZ")}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#292524]">{o.totalPrice} AZN</span>
            <ChevronRight size={16} className="text-[#d6d3d1]" />
          </div>
        </div>
      ))}
    </div>
  );
}
