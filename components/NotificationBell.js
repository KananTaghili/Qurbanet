"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Package, Heart, Beef, Newspaper, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return "İndicə";
  if (min < 60) return `${min} dəq.`;
  const h = Math.floor(min / 60);
  if (h  < 24)  return `${h} saat`;
  const d = Math.floor(h / 24);
  if (d  < 7)   return `${d} gün`;
  return new Date(dateStr).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function navPath(n) {
  const d = n.data || {};
  if (d.orderId)    return `/my-orders/${d.orderId}`;
  if (d.campaignId) return `/charity-order/${d.campaignId}`;
  if (n.module === "charity") return "/charity";
  return "/my-orders";
}

const MODULE_TABS = [
  { key: "all",     label: "Hamısı"    },
  { key: "qurban",  label: "Qurban"    },
  { key: "charity", label: "Xeyriyyə" },
];

const MODULE_ICON = {
  qurban:  <Beef    size={13} />,
  charity: <Heart   size={13} />,
  meat:    <Package size={13} />,
  news:    <Newspaper size={13} />,
};

// ── NotificationPanel ─────────────────────────────────────────────────────────

function NotificationPanel({ accentColor, ringColor, onClose }) {
  const router = useRouter();
  const { markRead, markAllRead, fetchUnread } = useNotifications();

  const [tab,           setTab]           = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [marking,       setMarking]       = useState(false);

  const fetchList = useCallback(async (module) => {
    setLoading(true);
    try {
      const params = { limit: 30, page: 1 };
      if (module && module !== "all") params.module = module;
      const res = await api.get("/notifications", { params });
      if (res.data?.success) setNotifications(res.data.data.notifications || []);
    } catch (_) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(tab); }, [tab, fetchList]);

  const handleClick = async (n) => {
    onClose();
    if (!n.read) await markRead(n._id);
    router.push(navPath(n));
  };

  const handleMarkAll = async () => {
    setMarking(true);
    await markAllRead(tab === "all" ? null : tab);
    await fetchList(tab);
    setMarking(false);
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div
      className="absolute right-0 z-[9999] flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
      style={{ top: "calc(100% + 10px)", width: 340, maxHeight: 480 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <span className="text-[13px] font-bold text-slate-800">Bildirişlər</span>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAll}
              disabled={marking}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              <CheckCheck size={12} />
              Hamısını oxu
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-3 pt-1">
        {MODULE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2 text-[11px] font-semibold transition-colors"
            style={{
              color:       tab === key ? accentColor : "#94a3b8",
              borderBottom: tab === key ? `2px solid ${accentColor}` : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 360 }}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell size={28} className="text-slate-200" />
            <p className="text-[12px] text-slate-400 font-medium">Bildiriş yoxdur</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <li key={n._id}>
                <button
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50"
                >
                  {/* Module icon */}
                  <div
                    className="mt-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-full"
                    style={{ background: `${accentColor}18`, color: accentColor }}
                  >
                    {MODULE_ICON[n.module] || <Bell size={13} />}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] leading-snug truncate"
                      style={{ fontWeight: n.read ? 500 : 700, color: n.read ? "#64748b" : "#1e293b" }}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: accentColor + "99" }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div
                      className="mt-1.5 w-2 h-2 shrink-0 rounded-full"
                      style={{ background: accentColor }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── NotificationBell (exported) ───────────────────────────────────────────────

export default function NotificationBell({
  accentColor = "#1c5e20",
  ringColor   = "#1c5e20",
  iconColor   = "#ffffff",
  hoverClass  = "hover:bg-white/10",
}) {
  const { isGuest } = useAuth();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (isGuest) return null;

  const badge = unreadCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${hoverClass} transition-colors relative`}
        aria-label="Bildirişlər"
      >
        <Bell size={16} style={{ color: iconColor }} />
        {badge && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[9px] font-black px-1"
            style={{ background: "#ef4444", boxShadow: `0 0 0 2px ${ringColor}` }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          accentColor={accentColor}
          ringColor={ringColor}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
