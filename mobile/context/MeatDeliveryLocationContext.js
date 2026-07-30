import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

const MeatDeliveryLocationContext = createContext(null);
const STORAGE_KEY = "meatbox_meat_delivery";
const FALLBACK_DELIVERY_PRICE = 5;

export function MeatDeliveryLocationProvider({ children }) {
  const [location, setLocationState] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          try {
            setLocationState(JSON.parse(saved));
          } catch {
            /* ignore */
          }
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setLocation = useCallback((loc) => {
    if (loc) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc)).catch(() => {});
    else AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setLocationState(loc);
  }, []);

  const clearLocation = useCallback(() => setLocation(null), [setLocation]);

  useEffect(() => {
    api
      .get("/app-config/settings")
      .then((res) => {
        const remote = res.data?.data?.deliveryCountries;
        if (Array.isArray(remote)) setCountries(remote);
      })
      .catch(() => {});
  }, []);

  const deliveryPrice = useMemo(() => {
    if (!location?.countryCode || !location?.cityKey) return FALLBACK_DELIVERY_PRICE;
    const country = countries.find((c) => c.code === location.countryCode && c.enabled);
    const city = (country?.cities || []).find((c) => c.key === location.cityKey && c.enabled);
    return city?.deliveryPrice != null ? Number(city.deliveryPrice) : FALLBACK_DELIVERY_PRICE;
  }, [countries, location]);

  return (
    <MeatDeliveryLocationContext.Provider value={{ location, setLocation, clearLocation, isLoaded, countries, deliveryPrice }}>
      {children}
    </MeatDeliveryLocationContext.Provider>
  );
}

export const useMeatDeliveryLocation = () => useContext(MeatDeliveryLocationContext);
