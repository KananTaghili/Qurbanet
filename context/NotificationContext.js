"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../lib/api";

const NotificationContext = createContext(null);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "https://api.qurbanet.az/api").replace(/\/api$/, "");

export function NotificationProvider({ children }) {
  const { token, isGuest } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [byModule, setByModule]       = useState({});
  const socketRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    if (isGuest || !token) return;
    try {
      const res = await api.get("/notifications/unread-count");
      if (res.data?.success) {
        setUnreadCount(res.data.data.total ?? 0);
        setByModule(res.data.data.byModule ?? {});
      }
    } catch (_) {}
  }, [token, isGuest]);

  useEffect(() => {
    if (isGuest || !token) {
      setUnreadCount(0);
      setByModule({});
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 6,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("notification_new", fetchUnread);

    fetchUnread();

    return () => {
      socket.off("notification_new", fetchUnread);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isGuest, fetchUnread]);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await fetchUnread();
    } catch (_) {}
  }, [fetchUnread]);

  const markAllRead = useCallback(async (module) => {
    try {
      const body = module && module !== "all" ? { module } : {};
      await api.patch("/notifications/read-all", body);
      await fetchUnread();
    } catch (_) {}
  }, [fetchUnread]);

  return (
    <NotificationContext.Provider value={{ unreadCount, byModule, fetchUnread, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
