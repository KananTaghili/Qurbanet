"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock } from "lucide-react";
import api from "../../../../lib/api";
import { openPayment } from "../../../../lib/nativePay";

export default function MeatCheckoutPaymentPage() {
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem("meatbox_pending_order") || "null");
    } catch {
      /* ignore */
    }
    if (!saved?.orderId) {
      router.replace("/meat");
      return;
    }
    setPending(saved);

    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "fail") {
      setError(params.get("message") || "Ödəniş uğursuz oldu. Yenidən cəhd edin.");
      window.history.replaceState(null, "", "/meat/checkout/payment");
    }
  }, []);

  if (!pending) return null;

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/meat/orders/${pending.orderId}/epoint/start`);
      if (res.data.success) {
        await openPayment(res.data.data.redirect_url, (dest) => {
          if (!dest) return;
          if (dest.startsWith("/meat/checkout/payment")) {
            let msg = "";
            try {
              msg = new URLSearchParams(dest.split("?")[1] || "").get("message") || "";
            } catch (_) {}
            setError(msg || "Ödəniş uğursuz oldu.");
          } else {
            router.push(dest);
          }
        });
        setLoading(false);
        return;
      }
      setError(res.data.message || "Ödəniş başladıla bilmədi.");
    } catch (err) {
      setError(err.response?.data?.message || "Ödəniş başladıla bilmədi.");
    }
    setLoading(false);
  };

  return (
    <div className="p-3 md:p-4 max-w-md mx-auto space-y-3">
      <div className="rounded-2xl bg-[#f97316] px-6 py-6 text-white text-center">
        <p className="text-[11px] font-semibold opacity-80 uppercase tracking-wider mb-1">Ödəniləcək məbləğ</p>
        <p className="text-4xl font-extrabold tracking-tight">{pending.totalPrice} AZN</p>
      </div>

      <div className="rounded-2xl border border-[#f0ede8] bg-white p-4 flex items-center gap-3">
        <CreditCard size={18} className="text-[#f97316]" />
        <div>
          <p className="text-[13px] font-bold text-[#292524]">Bank kartı ilə ödəniş</p>
          <p className="text-[11px] text-[#a8a29e]">Visa, MasterCard — Epoint təhlükəsiz ödəniş sistemi</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
        <Lock size={13} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700">Kart məlumatlarınız Epoint tərəfindən şifrələnərək qorunur.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-[12px] font-semibold px-3 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#f97316] text-white text-[14px] font-extrabold active:scale-[.98] transition-all disabled:opacity-60"
      >
        {loading ? "Yönləndirilir..." : `${pending.totalPrice} AZN ödə`}
      </button>
    </div>
  );
}
