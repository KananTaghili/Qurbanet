"use client";
import { createContext, useContext, useState, useEffect } from "react";

const MeatCartContext = createContext(null);

const STORAGE_KEY = "meatbox_cart";

const makeLineId = (animalKey, partKey, cutId) => `${animalKey}__${partKey}__${cutId}`;

export function MeatCartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    setIsLoaded(true);
  }, []);

  const persist = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
  };

  // cut: { animalKey, animalNameAz, partKey, partNameAz, cutId, cutNameAz, pricePerKg, stockKg, stepKg, minKg }
  const addToCart = (cut, quantityKg) => {
    const lineId = makeLineId(cut.animalKey, cut.partKey, cut.cutId);
    const existing = items.find((i) => i.lineId === lineId);
    const cap = cut.stockKg;
    if (existing) {
      const nextQty = Math.min(existing.quantityKg + quantityKg, cap);
      persist(items.map((i) => (i.lineId === lineId ? { ...i, quantityKg: nextQty, stockKg: cap } : i)));
    } else {
      persist([
        ...items,
        {
          lineId,
          animalKey: cut.animalKey,
          animalNameAz: cut.animalNameAz,
          partKey: cut.partKey,
          partNameAz: cut.partNameAz,
          cutId: cut.cutId,
          cutNameAz: cut.cutNameAz,
          pricePerKg: cut.pricePerKg,
          stockKg: cap,
          stepKg: cut.stepKg || 1,
          minKg: cut.minKg || 1,
          quantityKg: Math.min(quantityKg, cap),
        },
      ]);
    }
  };

  const updateQuantity = (lineId, quantityKg) => {
    persist(
      items
        .map((i) => (i.lineId === lineId ? { ...i, quantityKg: Math.max(0, Math.min(quantityKg, i.stockKg)) } : i))
        .filter((i) => i.quantityKg > 0),
    );
  };

  const removeItem = (lineId) => persist(items.filter((i) => i.lineId !== lineId));

  const clearCart = () => persist([]);

  const itemsTotal = items.reduce((s, i) => s + i.pricePerKg * i.quantityKg, 0);
  const itemCount = items.reduce((s, i) => s + i.quantityKg, 0);

  return (
    <MeatCartContext.Provider
      value={{ items, isLoaded, addToCart, updateQuantity, removeItem, clearCart, itemsTotal, itemCount }}
    >
      {children}
    </MeatCartContext.Provider>
  );
}

export const useMeatCart = () => useContext(MeatCartContext);
