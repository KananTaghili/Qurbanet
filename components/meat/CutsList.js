"use client";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Beef } from "lucide-react";
import { useMeatCart } from "../../context/MeatCartContext";

function CutCard({ animal, part, cut }) {
  const { items, addToCart } = useMeatCart();
  const lineId = `${animal.key}__${part.key}__${cut._id}`;
  const inCartQty = items.find((i) => i.lineId === lineId)?.quantityKg || 0;
  const remaining = Math.max(0, cut.stockKg - inCartQty);
  const step = cut.stepKg || 1;
  const min = Math.min(cut.minKg || 1, remaining || cut.minKg || 1);
  const [qty, setQty] = useState(min);

  const clamp = (v) => Math.max(step, Math.min(v, remaining));
  const dec = () => setQty((q) => Math.max(step, q - step));
  const inc = () => setQty((q) => clamp(q + step));

  const outOfStock = remaining <= 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart(
      {
        animalKey: animal.key,
        animalNameAz: animal.nameAz,
        partKey: part.key,
        partNameAz: part.nameAz,
        cutId: cut._id,
        cutNameAz: cut.nameAz,
        pricePerKg: cut.pricePerKg,
        stockKg: cut.stockKg,
        stepKg: step,
        minKg: cut.minKg,
      },
      qty,
    );
    setQty(min);
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#f0ede8] bg-white p-2.5 gap-2">
      {/* Foto yeri — ad və qiymət fotonun üzərində */}
      <div className="relative aspect-[3/2] w-full rounded-lg bg-gradient-to-br from-[#ffedd5] to-[#fed7aa] overflow-hidden">
        <div className="absolute inset-0 grid place-items-center">
          <Beef size={26} className="text-[#f97316]/40" />
        </div>
        <p className="absolute top-1.5 right-2 text-[12px] font-extrabold text-[#c2410c] drop-shadow-sm">
          {cut.pricePerKg} AZN
        </p>
        <p className="absolute bottom-1.5 left-2 right-2 text-[12px] font-bold text-[#292524] leading-tight line-clamp-1 drop-shadow-sm">
          {cut.nameAz}
        </p>
      </div>

      <div className="flex items-center justify-between gap-1.5">
          {!outOfStock ? (
            <div className="flex items-center gap-1">
              <button
                onClick={dec}
                className="h-6 w-6 grid place-items-center rounded-md bg-[#f5f5f4] text-[#57534e] hover:bg-[#e7e5e4]"
              >
                <Minus size={11} />
              </button>
              <span className="text-[11px] font-bold w-10 text-center whitespace-nowrap">{qty} kq</span>
              <button
                onClick={inc}
                className="h-6 w-6 grid place-items-center rounded-md bg-[#f5f5f4] text-[#57534e] hover:bg-[#e7e5e4]"
              >
                <Plus size={11} />
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-[#dc2626]">Yoxdur</span>
          )}

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="h-6 px-2.5 rounded-lg bg-[#f97316] text-white text-[11px] font-bold flex items-center gap-1 disabled:bg-[#e7e5e4] disabled:text-[#a8a29e] active:scale-95 transition-all"
          >
            <ShoppingCart size={13} /> Səbətə at
          </button>
      </div>
    </div>
  );
}

export default function CutsList({ animal, part }) {
  if (!part) return null;
  const cuts = part.cuts || [];
  return (
    <div className="rounded-2xl border border-[#f0ede8] bg-[#fafaf9] p-3">
      {cuts.length === 0 ? (
        <p className="text-[12px] text-[#a8a29e] py-4 text-center">Bu hissə üçün hələ məhsul əlavə olunmayıb.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cuts.map((cut) => (
            <CutCard key={cut._id} animal={animal} part={part} cut={cut} />
          ))}
        </div>
      )}
    </div>
  );
}
