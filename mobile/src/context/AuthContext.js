import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // App açılanda token yoxla
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, storedGuestPhone] =
        await AsyncStorage.multiGet(["token", "user", "guest_phone"]);

      if (storedToken[1] && storedUser[1]) {
        setToken(storedToken[1]);
        setUser(JSON.parse(storedUser[1]));
        return;
      }

      let guestPhone = storedGuestPhone[1];
      if (!guestPhone) {
        const suffix = String(Math.floor(Math.random() * 10000000)).padStart(
          7,
          "0",
        );
        guestPhone = `+99499${suffix}`;
        await AsyncStorage.setItem("guest_phone", guestPhone);
      }

      const guestRes = await api.post("/auth/guest", { phone: guestPhone });
      if (guestRes.data?.success) {
        const guestToken = guestRes.data.data?.token;
        const guestUser = guestRes.data.data?.user;

        if (guestToken && guestUser) {
          await AsyncStorage.multiSet([
            ["token", guestToken],
            ["user", JSON.stringify(guestUser)],
          ]);
          setToken(guestToken);
          setUser(guestUser);
        }
      }
    } catch (err) {
      console.error("Auth yükləmə xətası:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken, userData) => {
    await AsyncStorage.multiSet([
      ["token", newToken],
      ["user", JSON.stringify(userData)],
    ]);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setToken(null);
    setUser(null);
    await loadStoredAuth();
  };

  const updateUser = async (updatedUser) => {
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isGuest: !user?.name || user?.name === "",
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth AuthProvider içində istifadə edilməlidir.");
  return context;
};
