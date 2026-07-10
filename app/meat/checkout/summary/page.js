"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, User as UserIcon } from "lucide-react";
import { useMeatCart } from "../../../../context/MeatCartContext";
import { useDeliveryLocation } from "../../../../context/DeliveryLocationContext";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../lib/api";

const MEAT_DELIVERY_FEE = 5;
const AZ_OPERATORS = ["50", "51", "55", "60", "70", "77", "99", "10", "20", "40", "41", "44"];

const formatMobile = (raw) => {
  const d = raw.replace(/\D/g, "").replace(/^994/, "").slice(0, 9);
  return d;
};
const isValidMobile = (d) => d.length === 9 && AZ_OPERATORS.includes(d.slice(0, 2));

export default function MeatCheckoutSummaryPage() {
  const router = useRouter();
  const { items, itemsTotal, clearCart } = useMeatCart();
  const { location } = useDeliveryLocation();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(user?.name || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [mobile, setMobile] = useState(user?.phone ? formatMobile(user.phone) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (!orderPlaced && (items.length === 0 || !location)) router.replace("/meat");
  }, [items.length, location, orderPlaced]);

  if (!orderPlaced && (items.length === 0 || !location)) return null;

  const total = itemsTotal + MEAT_DELIVERY_FEE;
  const mobileValid = isValidMobile(mobile);

  const handleConfirm = async () => {
    if (!firstName.trim() || !lastName.trim() || !mobileValid) {
      setError("Zəhmət olmasa ad, soyad və düzgün mobil nömrə daxil edin.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/meat/orders", {
        items: items.map((i) => ({
          animalKey: i.animalKey,
          partKey: i.partKey,
          cutId: i.cutId,
          quantityKg: i.quantityKg,
        })),
        deliveryLocation: location,
        contactInfo: { firstName, lastName, mobile: `+994${mobile}` },
      });
      if (res.data.success) {
        const order = res.data.data.order;
        sessionStorage.setItem("meatbox_pending_order", JSON.stringify({ orderId: order._id, totalPrice: order.totalPrice }));
        setOrderPlaced(true);
        clearCart();
        router.push("/meat/checkout/payment");
        return;
      }
      setError(res.data.message || "Sifariş yaradıla bilmədi.");
    } catch (err) {
      setError(err.response?.data?.message || "Sifariş yaradıla bilmədi.");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto space-y-3">
      <h1 className="text-[16px] font-extrabold text-[#292524]">Sifariş xülasəsi</h1>

      <div className="rounded-2xl border border-[#f0ede8] bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fff7ed] text-[11px] font-extrabold uppercase tracking-wide text-[#c2410c]">
          Məhsullar
        </div>
        <div className="divide-y divide-[#f0ede8]">
          {items.map((it) => (
            <div key={it.lineId} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#292524]">{it.cutNameAz}</p>
                <p className="text-[11px] text-[#a8a29e]">
                  {it.animalNameAz} · {it.partNameAz} · {it.quantityKg} kq × {it.pricePerKg} AZN
                </p>
              </div>
              <span className="text-[13px] font-extrabold text-[#f97316] shrink-0">
                {(it.pricePerKg * it.quantityKg).toFixed(2)} AZN
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0ede8] bg-white p-4 flex items-start gap-3">
        <MapPin size={16} className="text-[#f97316] mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#a8a29e]">Çatdırılma yeri</p>
          <p className="text-[13px] font-semibold text-[#292524]">{location.address}</p>
          <p className="text-[11px] text-[#a8a29e]">{location.cityNameAz}, {location.countryNameAz}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0ede8] bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserIcon size={16} className="text-[#f97316]" />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#a8a29e]">Əlaqə məlumatları</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ad"
            className="rounded-xl border border-[#e7e5e4] px-3 py-2.5 text-[13px] outline-none focus:border-[#f97316]"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Soyad"
            className="rounded-xl border border-[#e7e5e4] px-3 py-2.5 text-[13px] outline-none focus:border-[#f97316]"
          />
        </div>
        <div className="flex items-center rounded-xl border border-[#e7e5e4] px-3 py-2.5 focus-within:border-[#f97316]">
          <span className="text-[13px] font-bold text-[#a8a29e] mr-1.5">+994</span>
          <input
            value={mobile}
            onChange={(e) => setMobile(formatMobile(e.target.value))}
            placeholder="501234567"
            className="flex-1 text-[13px] outline-none min-w-0"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0ede8] bg-white p-4 space-y-1.5">
        <div className="flex justify-between text-[12px] text-[#78716c]">
          <span>Məhsullar</span>
          <span>{itemsTotal.toFixed(2)} AZN</span>
        </div>
        <div className="flex justify-between text-[12px] text-[#78716c]">
          <span>Çatdırılma</span>
          <span>{MEAT_DELIVERY_FEE.toFixed(2)} AZN</span>
        </div>
        <div className="flex justify-between text-[16px] font-extrabold text-[#292524] pt-1">
          <span>Cəmi</span>
          <span>{total.toFixed(2)} AZN</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-[12px] font-semibold px-3 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-[#f97316] text-white text-[14px] font-extrabold active:scale-[.98] transition-all disabled:opacity-60"
      >
        {submitting ? "Göndərilir..." : `Sifarişi təsdiqlə · ${total.toFixed(2)} AZN`}
      </button>
    </div>
  );
}
