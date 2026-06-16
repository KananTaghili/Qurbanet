'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext(null);

const STORAGE_KEY = 'qurbanet_order';

export function OrderProvider({ children }) {
  const [order, setOrderState] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setOrderState(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setIsLoaded(true);
  }, []);

  const setOrder = (data) => {
    const next = data ? { ...data } : null;
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    setOrderState(next);
  };

  const updateOrder = (patch) => {
    setOrder({ ...(order || {}), ...patch });
  };

  const clearOrder = () => setOrder(null);

  return (
    <OrderContext.Provider value={{ order, setOrder, updateOrder, clearOrder, isLoaded }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => useContext(OrderContext);
