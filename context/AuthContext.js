'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken) {
      setToken(storedToken);
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setIsLoading(false);
    } else {
      createGuest();
    }
  }, []);

  const createGuest = async () => {
    try {
      const phone = '+994' + Math.floor(500000000 + Math.random() * 499999999);
      const res = await api.post('/auth/guest', { phone });
      if (res.data.success) {
        const { token: t, user: u } = res.data.data;
        localStorage.setItem('token', t);
        localStorage.setItem('user', JSON.stringify(u));
        setToken(t);
        setUser(u);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await createGuest();
  };

  const updateUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const isGuest = !user?.name || user?.isGuest;
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isGuest, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
