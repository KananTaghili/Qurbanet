import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

const AuthContext = createContext(null);

const parseStoredUser = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken) {
          setToken(storedToken);
          setUser(parseStoredUser(storedUser));
          setIsLoading(false);
        } else {
          await createGuest();
        }
      } catch {
        setIsLoading(false);
      }
    })();
  }, []);

  const createGuest = async () => {
    try {
      const res = await api.post("/auth/guest");
      if (res.data.success) {
        const { token: t, user: u } = res.data.data;
        await AsyncStorage.setItem("token", t);
        await AsyncStorage.setItem("user", JSON.stringify(u));
        setToken(t);
        setUser(u);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken, newUser) => {
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    await createGuest();
  };

  const updateUser = async (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    await AsyncStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  const isGuest = !user?.name || user?.isGuest;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isGuest, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
