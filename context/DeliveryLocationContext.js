"use client";
import { createContext, useContext, useState, useEffect } from "react";

const DeliveryLocationContext = createContext(null);

const STORAGE_KEY = "meatbox_delivery";

export function DeliveryLocationProvider({ children }) {
  const [location, setLocationState] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLocationState(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    setIsLoaded(true);
  }, []);

  const setLocation = (loc) => {
    if (loc) localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    else localStorage.removeItem(STORAGE_KEY);
    setLocationState(loc);
  };

  const clearLocation = () => setLocation(null);

  return (
    <DeliveryLocationContext.Provider value={{ location, setLocation, clearLocation, isLoaded }}>
      {children}
    </DeliveryLocationContext.Provider>
  );
}

export const useDeliveryLocation = () => useContext(DeliveryLocationContext);
