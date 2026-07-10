"use client";
import { Minus, Plus, Trash2, ShoppingBag, MapPin, ChevronRight, Beef } from "lucide-react";
import { useMeatCart } from "../../context/MeatCartContext";
import { useDeliveryLocation } from "../../context/DeliveryLocationContext";

const MEAT_DELIVERY_FEE = 5;

export default function MeatCartPanel({ onOpenDeliveryModal, onCheckout, fillHeight = true }) {
  const { items, updateQuantity, removeItem, itemsTotal } = useMeatCart();
  const { location } = useDeliveryLocation();

  const total = itemsTotal + (items.length ? MEAT_DELIVERY_FEE : 0);

  return (
    <div className={`flex flex-col ${fillHeight ? "h-[calc(100%-10px)] flex-1" : "mb-6"} bg-white rounded-2xl border border-[#f0ede8] overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[#f0ede8] bg-[#fff7ed]">
        <ShoppingBag size={14} className="text-[#f97316]" />
        <span className="text-[12px] font-extrabold text-[#292524]">Səbətim</span>
        {items.length > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-[#f97316] text-white rounded-full h-4 min-w-4 px-1 grid place-items-center">
            {items.length}
          </span>
        )}
      </div>

      <div className={`${fillHeight ? "flex-1 min-h-0" : "max-h-[50vh]"} overflow-y-auto p-3 space-y-2`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <ShoppingBag size={26} className="text-[#e7e5e4]" />
            <p className="text-[12px] text-[#a8a29e]">Səbətiniz boşdur</p>
          </div>
        ) : (
          items.map((it) => (
            <div key={it.lineId} className="flex gap-2 rounded-xl border border-[#f0ede8] p-1.5">
              <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-[#ffedd5] to-[#fed7aa] grid place-items-center shrink-0">
                <Beef size={20} className="text-[#f97316]/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-bold text-[#292524] truncate leading-tight">{it.cutNameAz}</p>
                    <p className="text-[10px] text-[#a8a29e] truncate leading-tight">
                      {it.animalNameAz} · {it.partNameAz}
                    </p>
                  </div>
                  <button onClick={() => removeItem(it.lineId)} className="shrink-0 text-[#d6d3d1] hover:text-[#dc2626]">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(it.lineId, it.quantityKg - it.stepKg)}
                      className="h-5 w-5 grid place-items-center rounded-md bg-[#f5f5f4] text-[#57534e]"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-[10.5px] font-bold w-8 text-center">{it.quantityKg} kq</span>
                    <button
                      onClick={() => updateQuantity(it.lineId, it.quantityKg + it.stepKg)}
                      disabled={it.quantityKg >= it.stockKg}
                      className="h-5 w-5 grid place-items-center rounded-md bg-[#f5f5f4] text-[#57534e] disabled:opacity-40"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <span className="text-[11.5px] font-extrabold text-[#f97316]">
                    {(it.pricePerKg * it.quantityKg).toFixed(2)} AZN
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Çatdırılma yeri */}
      <button
        onClick={onOpenDeliveryModal}
        className="flex items-center gap-2 px-4 py-1.5 border-t border-[#f0ede8] hover:bg-[#fafaf9] transition-colors text-left"
      >
        <MapPin size={13} className="text-[#f97316] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#a8a29e]">Çatdırılma yeri</p>
          <p className="text-[11px] font-semibold text-[#292524] leading-snug line-clamp-2">
            {location ? location.address : "Ünvan seçilməyib — seçmək üçün toxunun"}
          </p>
        </div>
        <ChevronRight size={14} className="text-[#d6d3d1] shrink-0" />
      </button>

      {/* Cəmi + ödə */}
      <div className="p-2 border-t border-[#f0ede8] space-y-0.5">
        <div className="flex justify-between text-[11px] text-[#78716c]">
          <span>Məhsullar</span>
          <span>{itemsTotal.toFixed(2)} AZN</span>
        </div>
        <div className="flex justify-between text-[11px] text-[#78716c]">
          <span>Çatdırılma</span>
          <span>{items.length ? `${MEAT_DELIVERY_FEE.toFixed(2)} AZN` : "—"}</span>
        </div>
        <div className="flex justify-between text-[13px] font-extrabold text-[#292524] pt-0.5">
          <span>Cəmi</span>
          <span>{total.toFixed(2)} AZN</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0 || !location}
          className="w-full mt-1 h-9 rounded-xl bg-[#f97316] text-white text-[13px] font-extrabold active:scale-[.98] transition-all disabled:bg-[#e7e5e4] disabled:text-[#a8a29e]"
        >
          Ödə · {total.toFixed(2)} AZN
        </button>
      </div>
    </div>
  );
}
