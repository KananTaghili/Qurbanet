"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Package, Heart, Beef, Newspaper, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../lib/api";

// ── CSS ───────────────────────────────────────────────────────────────────────
const NB_CSS = `
  @keyframes nb-bell-ring {
    0%   { transform: rotate(0)     scale(1);    }
    8%   { transform: rotate(0)     scale(1.18); }
    20%  { transform: rotate(20deg) scale(1.10); }
    32%  { transform: rotate(-17deg)scale(1.06); }
    44%  { transform: rotate(13deg) scale(1.03); }
    56%  { transform: rotate(-9deg) scale(1.01); }
    68%  { transform: rotate(5deg); }
    80%  { transform: rotate(-2deg);}
    100% { transform: rotate(0); }
  }
  @keyframes nb-badge-pop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.4); }
    80%  { transform: scale(0.85); }
    100% { transform: scale(1); }
  }
  @keyframes nb-panel-in {
    from { opacity: 0; transform: scale(0.93) translateY(-10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes nb-list-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .nb-ring     { animation: nb-bell-ring 0.74s cubic-bezier(.36,1.1,.54,1) both; transform-origin: top center; }
  .nb-badge-in { animation: nb-badge-pop 0.38s cubic-bezier(.34,1.56,.64,1) both; }
  .nb-panel-in { animation: nb-panel-in  0.22s cubic-bezier(.25,.8,.25,1)   both; transform-origin: top right; }
  .nb-list-in  { animation: nb-list-in   0.2s  cubic-bezier(.25,.8,.25,1)   both; }
  .nb-scroll::-webkit-scrollbar              { width: 4px; }
  .nb-scroll::-webkit-scrollbar-track        { background: transparent; }
  .nb-scroll::-webkit-scrollbar-thumb        { background: var(--nb-accent, #888); border-radius: 99px; }
  .nb-scroll { scrollbar-width: thin; scrollbar-color: var(--nb-accent, #888) transparent; }
  /* APK: bildiriş paneli mərkəzdə, simmetrik kənarlarla */
  html.cap-native .nb-panel {
    left: 0 !important;
    right: 0 !important;
    width: min(420px, calc(100vw - 16px)) !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
`;
let _injected = false;
function useNbCss() {
  useEffect(() => {
    if (_injected || typeof document === "undefined") return;
    const el = document.createElement("style");
    el.textContent = NB_CSS;
    document.head.appendChild(el);
    _injected = true;
  }, []);
}

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)  return "İndicə";
  if (m < 60) return `${m} dəq.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy} gün`;
  return new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}
function navPath(n) {
  const d = n.data || {};
  if (d.orderId)    return `/my-orders/detail?id=${d.orderId}`;
  if (d.campaignId) return `/charity-order/detail?id=${d.campaignId}`;
  return n.module === "charity" ? "/charity" : "/my-orders";
}

const MODULE_TABS = [
  { key: "all",     label: "Hamısı"   },
  { key: "qurban",  label: "Qurban"   },
  { key: "charity", label: "Xeyriyyə" },
];
const TAB_IDX = { all: 0, qurban: 1, charity: 2 };
const MODULE_ICON = {
  qurban:  <Beef      size={13} />,
  charity: <Heart     size={13} />,
  meat:    <Package   size={13} />,
  news:    <Newspaper size={13} />,
};

// ── Panel ─────────────────────────────────────────────────────────────────────
function NotificationPanel({ accentColor, ringColor, onClose }) {
  const router = useRouter();
  const { markRead, markAllRead } = useNotifications();

  const [tab,          setTab]    = useState("all");
  const [indicatorPct, setInd]    = useState(0);
  const [scrollable,   setScrollable] = useState(false);
  const [listKey,      setListKey] = useState(0); // retriggers list animation
  const [nots,         setNots]   = useState([]);
  const [initialLoad,  setInitial] = useState(true); // spinner only on first open
  const [marking,      setMarking] = useState(false);

  const fetchList = useCallback(async (module) => {
    try {
      const params = { limit: 30, page: 1 };
      if (module && module !== "all") params.module = module;
      const res = await api.get("/notifications", { params });
      if (res.data?.success) {
        setNots(res.data.data.notifications || []);
        setListKey(k => k + 1); // animate new list in
      }
    } catch { /* keep previous list */ }
    finally { setInitial(false); }
  }, []);

  // Initial fetch
  useEffect(() => { fetchList("all"); }, [fetchList]);

  // Delay scroll until panel open animation finishes (220ms)
  useEffect(() => { const t = setTimeout(() => setScrollable(true), 260); return () => clearTimeout(t); }, []);

  const changeTab = (key) => {
    if (key === tab) return;
    setInd(TAB_IDX[key] * 33.333);
    setTab(key);
    fetchList(key);
  };

  const handleClick = async (n) => {
    onClose();
    if (!n.read) markRead(n._id);
    router.push(navPath(n));
  };

  const handleMarkAll = async () => {
    setMarking(true);
    await markAllRead(tab === "all" ? null : tab);
    await fetchList(tab);
    setMarking(false);
  };

  const hasUnread = nots.some(n => !n.read);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="nb-panel nb-panel-in fixed z-[9999] flex flex-col rounded-2xl border border-black/10 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
      style={{ top: 66, right: 8, width: 'min(340px, calc(100vw - 16px))', maxHeight: 480 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
        <span className="text-[13px] font-bold text-slate-800">Bildirişlər</span>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAll}
              disabled={marking}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
              style={{ background: `${accentColor}14`, color: accentColor }}
            >
              <CheckCheck size={12} /> Hamısını oxu
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

      {/* Tabs — liquid indicator */}
      <div className="relative flex shrink-0" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div
          className="pointer-events-none absolute bottom-0 h-[2.5px] rounded-full"
          style={{
            background: accentColor,
            width: "33.333%",
            left: `${indicatorPct}%`,
            transition: "left 0.24s cubic-bezier(.4,0,.2,1)",
          }}
        />
        {MODULE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeTab(key)}
            className="flex-1 py-2.5 text-[11px] font-semibold transition-colors duration-150"
            style={{ color: tab === key ? accentColor : "#94a3b8" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content — scrollbar only when content actually overflows */}
      <div className="nb-scroll" style={{ overflowY: scrollable ? "auto" : "hidden", minHeight: 0, "--nb-accent": accentColor }}>
        {initialLoad ? (
          /* First-time spinner — only shown once */
          <div className="flex items-center justify-center py-14">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
            />
          </div>
        ) : nots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14">
            <Bell size={28} className="text-slate-200" />
            <p className="text-[12px] text-slate-400 font-medium">Bildiriş yoxdur</p>
          </div>
        ) : (
          /* key=listKey → remounts list on every successful fetch → animation replays */
          <ul key={listKey} className="nb-list-in divide-y divide-slate-50">
            {nots.map(n => (
              <li key={n._id}>
                <div
                  className="w-full text-left px-4 py-3 flex items-start gap-3"
                  style={{ cursor: "default" }}
                >
                  <div
                    className="mt-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-full"
                    style={{ background: `${accentColor}18`, color: accentColor }}
                  >
                    {MODULE_ICON[n.module] || <Bell size={13} />}
                  </div>
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
                  {!n.read && (
                    <div className="mt-1.5 w-2 h-2 shrink-0 rounded-full" style={{ background: accentColor }} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── NotificationBell ──────────────────────────────────────────────────────────
export default function NotificationBell({
  accentColor = "#1c5e20",
  ringColor   = "#1c5e20",
  iconColor   = "#ffffff",
  hoverClass  = "hover:bg-white/10",
}) {
  useNbCss();
  const { isGuest }     = useAuth();
  const { unreadCount } = useNotifications();

  const [open,     setOpen]    = useState(false);
  const [ringing,  setRinging] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);

  const ref       = useRef(null);
  const prevCount = useRef(unreadCount);
  const ringTimer = useRef(null);

  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setRinging(false);
      clearTimeout(ringTimer.current);
      ringTimer.current = setTimeout(() => {
        setRinging(true);
        setBadgeKey(k => k + 1);
        ringTimer.current = setTimeout(() => setRinging(false), 760);
      }, 16);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => () => clearTimeout(ringTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest(".nb-panel")) return; // panel portal-dadır
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (isGuest) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${hoverClass} transition-colors relative`}
        aria-label="Bildirişlər"
      >
        <Bell size={16} style={{ color: iconColor }} className={ringing ? "nb-ring" : ""} />
        {unreadCount > 0 && (
          <span
            key={badgeKey}
            className="nb-badge-in absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[9px] font-black px-1"
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
