import { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MeatCartContext = createContext(null);
const STORAGE_KEY = "meatbox_meat_cart";

const makeLineId = (animalKey, partKey, cutId) => `${animalKey}__${partKey}__${cutId}`;

export function MeatCartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch {
            /* ignore */
          }
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const persist = (next) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    setItems(next);
  };

  // cut: { animalKey, animalNameAz, partKey, partNameAz, cutId, cutNameAz, imageUrl, pricePerKg, stockKg, stepKg, minKg, soldByWeight }
  const addToCart = (cut, quantityKg) => {
    const lineId = makeLineId(cut.animalKey, cut.partKey, cut.cutId);
    const existing = itemsRef.current.find((i) => i.lineId === lineId);
    const cap = cut.stockKg;
    if (existing) {
      const nextQty = Math.min(existing.quantityKg + quantityKg, cap);
      persist(itemsRef.current.map((i) => (i.lineId === lineId ? { ...i, quantityKg: nextQty, stockKg: cap } : i)));
    } else {
      persist([
        ...itemsRef.current,
        {
          lineId,
          animalKey: cut.animalKey,
          animalNameAz: cut.animalNameAz,
          partKey: cut.partKey,
          partNameAz: cut.partNameAz,
          cutId: cut.cutId,
          cutNameAz: cut.cutNameAz,
          imageUrl: cut.imageUrl,
          pricePerKg: cut.pricePerKg,
          stockKg: cap,
          stepKg: cut.stepKg || 0.5,
          minKg: cut.minKg || 0.5,
          quantityKg: Math.min(quantityKg, cap),
          soldByWeight: cut.soldByWeight !== false,
        },
      ]);
    }
  };

  const updateQuantity = (lineId, quantityKg) => {
    persist(
      itemsRef.current
        .map((i) =>
          i.lineId === lineId
            ? { ...i, quantityKg: Math.round(Math.max(0, Math.min(quantityKg, i.stockKg)) * 1000) / 1000 }
            : i,
        )
        .filter((i) => i.quantityKg > 0),
    );
  };

  const removeItem = (lineId) => persist(itemsRef.current.filter((i) => i.lineId !== lineId));
  const clearCart = () => persist([]);

  const itemsTotal = items.reduce((s, i) => s + i.pricePerKg * i.quantityKg, 0);
  const itemCount = items.reduce((s, i) => s + i.quantityKg, 0);

  // Sifariş göndərilərkən (POST /meat/orders) həmin sətirlərin stoku elə bu
  // sifarişin özü tərəfindən kilidlənir — checkout ekranı bunu öz "başqa
  // müştəri alıb" bildirişi kimi yozmamalıdır (bax web-dəki MeatCartContext).
  const pendingLineIdsRef = useRef(new Set());
  const markOrderPending = (lineIds) => {
    lineIds.forEach((id) => pendingLineIdsRef.current.add(id));
  };
  const clearOrderPending = (lineIds) => {
    lineIds.forEach((id) => pendingLineIdsRef.current.delete(id));
  };

  // Checkout zamanı server bəzi sətirlərin artıq stokda qalmadığını
  // bildirsə, onları səbətdən silir (web-dəki removeUnavailableItems ilə eyni).
  const removeUnavailableItems = (unavailableItems) => {
    if (!Array.isArray(unavailableItems) || unavailableItems.length === 0) return;
    const ids = new Set(unavailableItems.map((u) => makeLineId(u.animalKey, u.partKey, u.cutId)));
    persist(itemsRef.current.filter((i) => !ids.has(i.lineId)));
  };

  return (
    <MeatCartContext.Provider
      value={{
        items,
        isLoaded,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        itemsTotal,
        itemCount,
        markOrderPending,
        clearOrderPending,
        removeUnavailableItems,
      }}
    >
      {children}
    </MeatCartContext.Provider>
  );
}

export const useMeatCart = () => useContext(MeatCartContext);
