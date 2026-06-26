"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Package, Heart, Beef, Newspaper, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../lib/api";

// ── CSS (injected once) ───────────────────────────────────────────────────────
const NB_STYLES = `
  @keyframes nb-bell-ring {
    0%   { transform: rotate(0deg)   scale(1);    }
    8%   { transform: rotate(0deg)   scale(1.18); }
    18%  { transform: rotate(20deg)  scale(1.12); }
    30%  { transform: rotate(-18deg) scale(1.08); }
    42%  { transform: rotate(14deg)  scale(1.05); }
    54%  { transform: rotate(-10deg) scale(1.03); }
    66%  { transform: rotate(6deg)   scale(1.01); }
    78%  { transform: rotate(-3deg)  scale(1);    }
    90%  { transform: rotate(1deg)   scale(1);    }
    100% { transform: rotate(0deg)   scale(1);    }
  }
  @keyframes nb-badge-pop {
    0%   { transform: scale(0)   opacity(0); }
    55%  { transform: scale(1.35); }
    75%  { transform: scale(0.88); }
    90%  { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  @keyframes nb-panel-in {
    from { opacity: 0; transform: scale(0.93) translateY(-10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes nb-tab-slide {
    from { opacity: 0; transform: translateX(var(--nb-from, 12px)); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .nb-ring     { animation: nb-bell-ring 0.72s cubic-bezier(.36,1.1,.54,1) both; transform-origin: top center; }
  .nb-panel-in { animation: nb-panel-in  0.2s  cubic-bezier(.25,.8,.25,1)  both; transform-origin: top right; }
  .nb-tab-in   { animation: nb-tab-slide 0.19s cubic-bezier(.25,.8,.25,1)  both; }
  .nb-badge-in { animation: nb-badge-pop 0.38s cubic-bezier(.34,1.56,.64,1) both; }
`;

let _nbStyleInjected = false;
function useNbStyles() {
  useEffect(() => {
    if (_nbStyleInjected) return;
    const el = document.createElement("style");
    el.textContent = NB_STYLES;
    document.head.appendChild(el);
    _nbStyleInjected = true;
  }, []);
}

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── NotificationPanel ─────────────────────────────────────────────────────────

function NotificationPanel({ accentColor, ringColor, onClose }) {
  const router = useRouter();
  const { markRead, markAllRead } = useNotifications();

  const [tab,           setTab]     = useState("all");
  const [tabDir,        setTabDir]  = useState(1);   // +1 = right, -1 = left
  const prevTabRef                  = useRef("all");
  const [notifications, setNots]    = useState([]);
  const [loading,       setLoading] = useState(true);
  const [marking,       setMarking] = useState(false);

  const fetchList = useCallback(async (module) => {
    setLoading(true);
    try {
      const params = { limit: 30, page: 1 };
      if (module && module !== "all") params.module = module;
      const res = await api.get("/notifications", { params });
      if (res.data?.success) setNots(res.data.data.notifications || []);
    } catch (_) { setNots([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(tab); }, [tab, fetchList]);

  const changeTab = (key) => {
    const dir = TAB_IDX[key] >= TAB_IDX[prevTabRef.current] ? 1 : -1;
    setTabDir(dir);
    prevTabRef.current = key;
    setTab(key);
  };

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
      className="nb-panel-in absolute right-0 z-[9999] flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
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
      <div className="flex border-b border-slate-100 px-3 pt-1 gap-1">
        {MODULE_TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => changeTab(key)}
              className="flex-1 relative py-2 text-[11px] font-semibold transition-colors duration-200"
              style={{ color: active ? accentColor : "#94a3b8" }}
            >
              {label}
              {/* Animated underline indicator */}
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-250"
                style={{
                  background:   active ? accentColor : "transparent",
                  transform:    active ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "center",
                  transition: "transform 0.22s cubic-bezier(.4,0,.2,1), background 0.15s",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Content — key = tab so it remounts and re-animates on every tab change */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 360 }}>
        <div
          key={tab}
          className="nb-tab-in"
          style={{ "--nb-from": `${tabDir * 14}px` }}
        >
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
  useNbStyles();

  const { isGuest } = useAuth();
  const { unreadCount } = useNotifications();

  const [open,    setOpen]    = useState(false);
  const [ringing, setRinging] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0); // changes to retrigger badge pop

  const ref         = useRef(null);
  const prevCount   = useRef(unreadCount);
  const ringTimer   = useRef(null);

  // Bell ring + badge pop when a new notification arrives
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      // Retrigger ring animation
      setRinging(false);
      clearTimeout(ringTimer.current);
      // small delay so class removal flushes first
      ringTimer.current = setTimeout(() => {
        setRinging(true);
        setBadgeKey(k => k + 1);
        ringTimer.current = setTimeout(() => setRinging(false), 750);
      }, 20);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => () => clearTimeout(ringTimer.current), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (isGuest) return null;

  const hasBadge = unreadCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${hoverClass} transition-colors relative`}
        aria-label="Bildirişlər"
      >
        <Bell
          size={16}
          style={{ color: iconColor }}
          className={ringing ? "nb-ring" : ""}
        />
        {hasBadge && (
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
