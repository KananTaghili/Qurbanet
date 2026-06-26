"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  CheckCircle2,
  Package,
  Truck,
  Star,
  MapPin,
  ExternalLink,
  ImageIcon,
  X,
  Banknote,
  FileText,
  ShoppingBag,
  Download,
  Play,
  Clock,
} from "lucide-react";
import { RiKnifeLine } from "react-icons/ri";
import BackHeader from "../../../components/BackHeader";
import StatusBadge from "../../../components/StatusBadge";
import api from "../../../lib/api";
import { useSocket } from "../../../hooks/useSocket";
import { useAuth } from "../../../context/AuthContext";

const AZ_MONTHS = ["Yan","Fev","Mar","Apr","May","İyun","İyul","Avq","Sen","Okt","Noy","Dek"];
function fmtDate(ds) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const ANIMAL_IMAGES = {
  quzu: "/qoyun.jpg", qoyun: "/qoyun.jpg",
  qoc: "/qoc.jpg", dana: "/dana.jpg", deve: "/deve.jpg",
};
const STATUS_COLOR = {
  placed: "#F59E0B", pending_payment: "#F59E0B",
  confirmed: "#3B82F6", paid: "#3B82F6",
  slaughtering: "#EF4444", preparing: "#10B981",
  delivering: "#3B82F6", completed: "#22C55E",
  cancelled: "#9CA3AF",
};
const TIMELINE_STEPS = [
  { key: "placed",       label: "Sifariş verildi", shortLabel: "Verildi",   Icon: ClipboardList, stage: null },
  { key: "confirmed",    label: "Təsdiqləndi",     shortLabel: "Təsdiqləndi", Icon: CheckCircle,   stage: null },
  { key: "slaughtering", label: "Kəsilir",          shortLabel: "Kəsilir",    Icon: RiKnifeLine,   stage: "slaughter" },
  { key: "preparing",    label: "Hazırlanır",       shortLabel: "Hazırlanır", Icon: Package,       stage: null },
  { key: "delivering",   label: "Çatdırılır",       shortLabel: "Çatdırılır", Icon: Truck,         stage: "delivery" },
  { key: "completed",    label: "Tamamlandı",       shortLabel: "Tamamlandı", Icon: Star,          stage: null },
];
const STATUS_ORDER = ["placed","confirmed","slaughtering","preparing","delivering","completed"];
const DIST_LABELS = {
  catdirilsin: "Sizə çatdırılsın", ozun_gotur: "Özüm götürəcəm",
  ozum: "Özüm götürəcəm", usaqlar_evi: "Uşaqlar evi",
  qocalar_evi: "Qocalar evi", ehtiyac_sahibleri: "Ehtiyac sahibləri",
};
const CUT_LABELS = {
  tam_cemdek: "Tam cəmdək", kababliq: "Kabablıq",
  qazan_yemekleri: "Qazan yeməkləri", qiyma: "Qiyma",
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value, last }) {
  return (
    <div className={`flex justify-between items-start px-4 py-3 gap-3 ${!last ? "border-b border-border/50" : ""}`}>
      <span className="text-[11px] text-text-secondary font-medium shrink-0">{label}</span>
      <span className="text-[11px] font-bold text-text-primary text-right max-w-[60%]">{value || "—"}</span>
    </div>
  );
}

// ── StepMedia ─────────────────────────────────────────────────────────────────
function StepMedia({ items, onOpen, pending, token }) {
  if (!items || items.length === 0) {
    if (!pending) return null;
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-alt border border-border/60">
        <Clock size={13} className="text-text-muted flex-shrink-0" />
        <span className="text-xs text-text-muted font-medium">Video və şəkillər gözlənilir...</span>
      </div>
    );
  }
  let vc = 0, pc = 0;
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {items.map((m, i) => {
        const isVideo = m.type === "video";
        const label = isVideo ? `Video ${++vc}` : `Foto ${++pc}`;
        return (
          <button key={i} onClick={() => onOpen(items, i)}
            className="relative rounded-xl overflow-hidden bg-surface-alt border border-border cursor-pointer group"
            style={{ aspectRatio: "4/3" }}>
            {isVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#1b5e20,#2e7d32)" }}>
                <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-primary ml-0.5" />
                </div>
                <span className="text-[11px] font-bold text-white/90">{label}</span>
              </div>
            ) : (
              <>
                <img src={token ? `${m.url}?token=${token}` : m.url} alt={label} crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/40">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1">
                    <ImageIcon size={9} /> {label}
                  </span>
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── GalleryModal ──────────────────────────────────────────────────────────────
function GalleryModal({ items, startIdx, onClose, token }) {
  const [idx, setIdx] = useState(startIdx);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx(i => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items.length]);
  if (!items?.length) return null;
  const item = items[idx];
  const dl = () => {
    const a = document.createElement("a");
    a.href = token ? `${item.url}?token=${token}` : item.url;
    a.download = item.filename || `media-${idx + 1}`;
    a.target = "_blank"; a.click();
  };
  const btnCls = "flex items-center justify-center border-0 cursor-pointer transition-colors text-white";
  const btnStyle = { background: "rgba(255,255,255,0.12)" };
  const btnHover = (e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)");
  const btnLeave = (e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)");

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 99999, background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={dl} className={`${btnCls} gap-2 px-4 py-2 rounded-full text-xs font-bold`} style={btnStyle}
          onMouseEnter={btnHover} onMouseLeave={btnLeave}><Download size={14} /> Yüklə</button>
        <span className="text-white font-bold text-sm">{idx + 1} / {items.length}</span>
        <button onClick={onClose} className={`${btnCls} w-9 h-9 rounded-full`} style={btnStyle}
          onMouseEnter={btnHover} onMouseLeave={btnLeave}><X size={18} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
        {idx > 0 && (
          <button onClick={() => setIdx(i => Math.max(0, i - 1))}
            className={`${btnCls} absolute left-4 z-10 w-10 h-10 rounded-full`} style={btnStyle}
            onMouseEnter={btnHover} onMouseLeave={btnLeave}><ChevronLeft size={22} /></button>
        )}
        <div className="w-full h-full flex items-center justify-center px-16 py-2">
          {item.type === "video" ? (
            <video key={token ? `${item.url}?token=${token}` : item.url} controls playsInline crossOrigin="anonymous"
              className="rounded-2xl shadow-2xl" style={{ maxWidth: "100%", maxHeight: "calc(100vh - 140px)", background: "#000" }}>
              <source src={token ? `${item.url}?token=${token}` : item.url} type="video/mp4" />
            </video>
          ) : (
            <img src={token ? `${item.url}?token=${token}` : item.url} alt="Media" crossOrigin="anonymous"
              className="rounded-2xl shadow-2xl object-contain"
              style={{ maxWidth: "100%", maxHeight: "calc(100vh - 140px)" }} />
          )}
        </div>
        {idx < items.length - 1 && (
          <button onClick={() => setIdx(i => Math.min(items.length - 1, i + 1))}
            className={`${btnCls} absolute right-4 z-10 w-10 h-10 rounded-full`} style={btnStyle}
            onMouseEnter={btnHover} onMouseLeave={btnLeave}><ChevronRight size={22} /></button>
        )}
      </div>
      {items.length > 1 && (
        <div className="flex justify-center gap-2 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className="rounded-full border-0 cursor-pointer transition-all"
              style={{ width: i === idx ? 20 : 8, height: 8, background: i === idx ? "#fff" : "rgba(255,255,255,0.35)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();

  const [order,              setOrder]             = useState(null);
  const [loading,            setLoading]           = useState(true);
  const [rating,             setRating]            = useState(0);
  const [comment,            setComment]           = useState("");
  const [reviewed,           setReviewed]          = useState(false);
  const [reviewing,          setReviewing]         = useState(false);
  const [gallery,            setGallery]           = useState(null);
  const [meatPickupLocation, setMeatPickupLocation] = useState(null);
  const [cashPickupLocation, setCashPickupLocation] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.isGuest === true) { router.replace("/auth/login"); return; }
    if (id) fetchOrder();
  }, [authLoading, token, user?.isGuest, id]);

  useSocket({ "order:updated": (d) => { if (d?.orderId === id) fetchOrder(); } });

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      const o = res.data.data?.order;
      setOrder(o);
      if (o?.review) { setRating(o.review.rating || 0); setComment(o.review.comment || ""); setReviewed(true); }
      const isSelf = ["ozun_gotur", "ozum"].includes(o?.distribution?.type) || o?.selfPickup;
      if (isSelf || o?.cashPickupCode) {
        const cfg = await api.get("/app-config/settings");
        const d = cfg.data?.data;
        if (isSelf && d?.meatPickupLocation?.address) setMeatPickupLocation(d.meatPickupLocation);
        if (o?.cashPickupCode && d?.cashPickupLocation?.address) setCashPickupLocation(d.cashPickupLocation);
      }
    } catch (err) {
      if (err?.response?.status === 401) router.replace("/auth/login");
      else if (err?.response?.status === 404) router.replace("/my-orders");
    } finally { setLoading(false); }
  };

  const handleReview = async () => {
    if (!rating) return;
    setReviewing(true);
    try { await api.post(`/orders/${id}/review`, { rating, comment }); setReviewed(true); }
    catch (err) { alert(err.response?.data?.message || "Xəta baş verdi."); }
    finally { setReviewing(false); }
  };

  if (loading)
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!order) return null;

  const currentIdx   = STATUS_ORDER.indexOf(order.status);
  const animalImg    = order.animalImageUrl || ANIMAL_IMAGES[order.animalType] || "/qoyun.jpg";
  const animalName   = order.animalNameAz || "Heyvan";
  const totalAmt     = order.totalPrice ?? order.totalAmount ?? 0;
  const orderNum     = order.orderNumber || id.slice(-6).toUpperCase();
  const allMedia     = order.media || [];
  const timeline     = order.statusTimeline ||
    TIMELINE_STEPS.map(s => ({ key: s.key, done: STATUS_ORDER.indexOf(s.key) <= currentIdx }));
  const isSelfPickup = ["ozun_gotur", "ozum"].includes(order.distribution?.type) || order.selfPickup;

  const detailRows = [
    { label: "Sifariş növü",     value: order.orderMode === "serikli" ? "Şərikli" : "Tam heyvan" },
    { label: "Miqdar",           value: `${order.quantity || 1} ədəd` },
    { label: "Çatdırılma",       value: DIST_LABELS[order.distribution?.type] || "—" },
    { label: "Kəsim tarixi",     value: fmtDate(order.slaughterDate) },
    { label: "Çatdırılma vaxtı", value: order.deliveryWindow || "—" },
    ...(order.distribution?.location ? [{ label: "Ünvan", value: order.distribution.location }] : []),
    ...(order.distribution?.phones?.length > 0 ? [{ label: "Çatdırılma nömrələri", value: order.distribution.phones.join(", ") }] : []),
    ...(order.distribution?.note ? [{ label: "Ünvan qeydi", value: order.distribution.note }] : []),
    ...(order.contactInfo ? [
      { label: "Əlaqə",  value: `${order.contactInfo.firstName} ${order.contactInfo.lastName}` },
      { label: "Telefon", value: order.contactInfo.mobile || order.contactInfo.phone || "—" },
    ] : []),
    ...(order.userNote ? [{ label: "Müştəri qeydi", value: order.userNote }] : []),
  ];

  const cutEntries = (() => {
    const cs = order.cutStyle;
    if (!cs) return [];
    if (Array.isArray(cs.allocations)) return cs.allocations.filter(a => a.count > 0).map(a => [a.key, a.count]);
    return Object.entries(cs).filter(([k, v]) => k !== "extraFee" && v > 0);
  })();

  const mediaByStage   = (stage) => allMedia.filter(m => m.stage === stage);
  const showCashCode   = !!order.cashPickupCode;
  const showMeatPickup = isSelfPickup && meatPickupLocation;
  const showReview     = order.status === "completed";
  const doneCount      = Math.max(0, currentIdx + 1);

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <style>{`
        @keyframes od-up   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes od-ring { 0%{ transform:scale(1); opacity:.5; } 100%{ transform:scale(2.6); opacity:0; } }
        .od-card          { animation: od-up 0.38s cubic-bezier(.25,.8,.25,1) both; }
        .od-card-1        { animation-delay:.05s; }
        .od-card-2        { animation-delay:.10s; }
        .od-card-3        { animation-delay:.15s; }
        .od-card-4        { animation-delay:.20s; }
        .od-pulse         { animation: od-ring 1.6s ease-out infinite; }
        .od-stepper::-webkit-scrollbar { display:none; }
        .od-stepper       { scrollbar-width:none; }
      `}</style>

      <BackHeader title={`Sifariş #${orderNum}`} />

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-4">

          {/* ── HERO ── split: left gradient / right image ─────────────────── */}
          <div className="od-card relative rounded-3xl overflow-hidden shadow-xl"
            style={{ boxShadow: "0 16px 48px rgba(15,61,28,0.35)" }}>

            <div className="flex flex-row min-h-[180px]">
              {/* Left panel */}
              <div className="flex-1 min-w-0 flex flex-col justify-between p-5 md:p-6 relative z-10"
                style={{ background: "linear-gradient(145deg, #0f3d1c 0%, #14532d 50%, #196830 100%)" }}>

                {/* Decorative ring top-right */}
                <div style={{ position:"absolute", top:-40, left:-40, width:180, height:180, borderRadius:"50%", border:"40px solid rgba(255,255,255,0.04)" }} />

                <div>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">Sifariş nömrəsi</p>
                  <p className="text-white font-black text-xl md:text-2xl font-mono tracking-tight leading-none mb-3">
                    {orderNum}
                  </p>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-4">
                  <p className="text-white/55 text-xs font-semibold mb-0.5">{animalName}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-[28px] md:text-[32px] leading-none">{totalAmt}</span>
                    <span className="text-white/45 font-bold text-[15px]">AZN</span>
                  </div>
                </div>
              </div>

              {/* Right: full-bleed animal image with gradient fade to left */}
              <div className="relative w-40 md:w-56 shrink-0 overflow-hidden">
                <img src={animalImg} alt={animalName} className="w-full h-full object-cover" style={{ minHeight: 180 }} />
                {/* Fade to left so it blends with the green panel */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #14532d 0%, transparent 35%)" }} />
              </div>
            </div>

            {/* Progress bar strip at bottom */}
            <div className="px-5 py-3" style={{ background: "rgba(10,36,18,0.55)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex gap-1.5 mb-1.5">
                {TIMELINE_STEPS.map((s, i) => {
                  const done   = STATUS_ORDER.indexOf(s.key) <= currentIdx;
                  const active = order.status === s.key;
                  return (
                    <div key={s.key} className="flex-1 rounded-full transition-all duration-500"
                      style={{ height: active ? 5 : 3, background: done ? (active ? "#86efac" : "rgba(255,255,255,0.65)") : "rgba(255,255,255,0.15)" }} />
                  );
                })}
              </div>
              <p className="text-white/35 text-[10px] font-semibold">{doneCount} / {TIMELINE_STEPS.length} mərhələ</p>
            </div>
          </div>

          {/* ── HORIZONTAL PROGRESS STEPPER ────────────────────────────────── */}
          <div className="od-card od-card-1 bg-surface rounded-2xl border border-border shadow-card">
            <div className="od-stepper overflow-x-auto px-4 py-4">
              <div className="flex items-start" style={{ minWidth: "max-content", gap: 0 }}>
                {TIMELINE_STEPS.map((step, i) => {
                  const done      = STATUS_ORDER.indexOf(step.key) <= currentIdx;
                  const active    = order.status === step.key;
                  const last      = i === TIMELINE_STEPS.length - 1;
                  const tItem     = timeline.find(t => t.key === step.key) || {};
                  const nextDone  = !last && STATUS_ORDER.indexOf(TIMELINE_STEPS[i + 1].key) <= currentIdx;
                  const lbl       = isSelfPickup && step.key === "delivering" ? "Götürüldü" : step.shortLabel;

                  return (
                    <div key={step.key} className="flex items-start">
                      {/* Step column */}
                      <div className="flex flex-col items-center gap-1.5" style={{ width: 76 }}>
                        {/* Circle */}
                        <div className="relative">
                          {active && (
                            <span className="od-pulse absolute inset-[-5px] rounded-full"
                              style={{ background: "rgba(22,163,74,0.22)" }} />
                          )}
                          <div
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              done ? "bg-primary" : "bg-surface-alt border-2 border-border"
                            } ${active ? "ring-2 ring-primary/25 ring-offset-2" : ""}`}
                          >
                            <step.Icon size={17} className={done ? "text-white" : "text-text-muted"} />
                          </div>
                        </div>

                        {/* Label */}
                        <p className={`text-[10px] font-semibold text-center leading-tight px-1 ${done ? "text-text-primary" : "text-text-muted"}`}>
                          {lbl}
                        </p>

                        {/* Date or waiting */}
                        {tItem.date ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--primary-surface)", color: "var(--primary)" }}>
                            {fmtDate(tItem.date)}
                          </span>
                        ) : (
                          <span className="text-[9px] text-text-muted">
                            {done ? "" : "Gözlənilir"}
                          </span>
                        )}
                      </div>

                      {/* Connector line */}
                      {!last && (
                        <div className="flex-shrink-0 mt-5" style={{ width: 20 }}>
                          <div className="h-0.5 rounded-full w-full transition-all"
                            style={{ background: nextDone ? "var(--primary)" : "var(--border)" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── CONTENT COLUMNS ────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row gap-4 items-start">

            {/* LEFT column */}
            <div className="flex flex-col gap-4 w-full md:flex-1 md:min-w-0">

              {/* Timeline detail — steps with hints + media */}
              <div className="od-card od-card-2 bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-xl bg-primary-surface flex items-center justify-center">
                    <ClipboardList size={16} className="text-primary" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Gedişat məlumatları</span>
                </div>

                <div className="px-4 py-4 flex flex-col">
                  {TIMELINE_STEPS.map((step, i) => {
                    const tItem     = timeline.find(t => t.key === step.key) || {};
                    const done      = STATUS_ORDER.indexOf(step.key) <= currentIdx;
                    const active    = order.status === step.key;
                    const last      = i === TIMELINE_STEPS.length - 1;
                    const stepMedia = step.stage ? mediaByStage(step.stage) : [];
                    const hasMedia  = done && step.stage && stepMedia.length > 0;
                    const stepLabel = isSelfPickup && step.key === "delivering" ? "Sifariş götürüldü" : step.label;
                    const stepHint  = (() => {
                      if (done) return null;
                      if (step.key === "slaughtering" && order.slaughterDate)
                        return `Qurbanınız ${fmtDate(order.slaughterDate)} tarixində kəsiləcək`;
                      if (step.key === "delivering" && order.slaughterDate && order.deliveryWindow)
                        return isSelfPickup
                          ? `${fmtDate(order.slaughterDate)} tarixində ${order.deliveryWindow} aralığında götürə bilərsiniz`
                          : `${fmtDate(order.slaughterDate)} tarixində ${order.deliveryWindow} aralığında çatdırılacaq`;
                      return null;
                    })();

                    return (
                      <div key={step.key}>
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="relative">
                              {active && (
                                <span className="od-pulse absolute inset-[-4px] rounded-full"
                                  style={{ background: "rgba(22,163,74,0.22)" }} />
                              )}
                              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
                                done ? "bg-primary" : "bg-surface-alt border-2 border-border"
                              } ${active ? "ring-2 ring-primary/25 ring-offset-1" : ""}`}>
                                <step.Icon size={14} className={done ? "text-white" : "text-text-muted"} />
                              </div>
                            </div>
                            {(!last || hasMedia) && (
                              <div className={`w-0.5 mt-1 rounded-full ${done ? "bg-primary" : "bg-border"}`}
                                style={{ minHeight: hasMedia ? 14 : 26, flex: hasMedia ? "none" : 1, height: hasMedia ? 14 : undefined }} />
                            )}
                          </div>

                          <div className={`flex-1 min-w-0 pt-1 ${hasMedia ? "pb-1" : "pb-4"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-bold ${done ? "text-text-primary" : "text-text-muted"}`}>
                                {stepLabel}
                              </p>
                              {tItem.date && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                  style={{ background: "var(--primary-surface)", color: "var(--primary)" }}>
                                  {fmtDate(tItem.date)}
                                </span>
                              )}
                            </div>
                            {!tItem.date && !done && (
                              <div className="mt-0.5">
                                <p className="text-xs text-text-muted">Gözlənilir</p>
                                {stepHint && (
                                  <p className="text-[11px] font-semibold text-primary/75 leading-snug mt-0.5">{stepHint}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {hasMedia && (
                          <div className="flex gap-3 mb-3">
                            <div className="shrink-0 w-8 flex flex-col items-center">
                              {!last && <div className={`w-0.5 rounded-full flex-1 min-h-[8px] ${done ? "bg-primary" : "bg-border"}`} />}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <StepMedia items={stepMedia} pending={false}
                                onOpen={(items, idx) => setGallery({ items, idx })} token={token} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cash code */}
              {showCashCode && (
                <div className="od-card od-card-3 bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fef9ec" }}>
                      <Banknote size={16} style={{ color: "#d97706" }} />
                    </div>
                    <span className="text-sm font-bold text-text-primary">Yerində ödəniş kodu</span>
                  </div>
                  <div className="px-4 py-5 flex flex-col items-center gap-3">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Mağazada göstərin</p>
                    <div className="rounded-2xl px-8 py-3"
                      style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1.5px solid rgba(245,158,11,0.3)" }}>
                      <p className="text-3xl font-black tracking-[0.2em] font-mono" style={{ color: "#92400e" }}>
                        {order.cashPickupCode}
                      </p>
                    </div>
                    {cashPickupLocation && (
                      <div className="flex flex-col gap-1.5 w-full items-center">
                        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                          <MapPin size={13} className="text-primary" />
                          <span className="font-medium">{cashPickupLocation.address}</span>
                        </div>
                        {cashPickupLocation.lat && cashPickupLocation.lng && (
                          <a href={`https://www.google.com/maps?q=${cashPickupLocation.lat},${cashPickupLocation.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary text-sm font-bold no-underline">
                            <ExternalLink size={13} /> Xəritədə aç
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT column */}
            <div className="flex flex-col gap-4 w-full md:flex-1 md:min-w-0">

              {/* Order details */}
              <div className="od-card od-card-2 bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                    <FileText size={16} style={{ color: "#3b82f6" }} />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Sifariş məlumatları</span>
                </div>
                {detailRows.map((row, i) => (
                  <InfoRow key={row.label} label={row.label} value={row.value}
                    last={i === detailRows.length - 1 && cutEntries.length === 0} />
                ))}
                {cutEntries.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1.5 border-t border-border/60">
                      <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Doğranma növü</span>
                    </div>
                    {cutEntries.map(([k, v], i) => (
                      <InfoRow key={k} label={CUT_LABELS[k] || k} value={`${v} ədəd`} last={i === cutEntries.length - 1} />
                    ))}
                  </>
                )}
              </div>

              {/* Meat pickup */}
              {showMeatPickup && (
                <div className="od-card od-card-3 bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl bg-primary-surface flex items-center justify-center">
                      <ShoppingBag size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-bold text-text-primary">Əti götürmə</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2 bg-primary-surface rounded-xl border border-primary/20 px-3 py-2.5">
                      <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-primary">{meatPickupLocation.address}</p>
                    </div>
                    {meatPickupLocation.lat && meatPickupLocation.lng && (
                      <a href={`https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 border-2 border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary-surface transition-colors no-underline">
                        <ExternalLink size={14} /> Google Maps-də aç
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery confirm code */}
              {order.deliveryConfirmCode && (
                <div className="od-card od-card-3 bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                      <Truck size={16} style={{ color: "#3b82f6" }} />
                    </div>
                    <span className="text-sm font-bold text-text-primary">Çatdırılma kodu</span>
                  </div>
                  <div className="px-4 py-5 flex flex-col items-center gap-2">
                    <div className="rounded-2xl px-8 py-3"
                      style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1.5px solid rgba(59,130,246,0.25)" }}>
                      <p className="text-3xl font-black tracking-[0.2em] font-mono" style={{ color: "#1e40af" }}>
                        {order.deliveryConfirmCode}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary">Ət çatanda bu kodu kuryerə deyin</p>
                  </div>
                </div>
              )}

              {/* Review */}
              {showReview && (
                <div className="od-card od-card-4 bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fef9ec" }}>
                      <Star size={16} style={{ color: "#f59e0b" }} />
                    </div>
                    <span className="text-sm font-bold text-text-primary">Rəy bildirin</span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-center gap-3 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => !reviewed && setRating(star)} disabled={reviewed}
                          className="cursor-pointer bg-transparent border-0 p-0 transition-transform hover:scale-110">
                          <Star size={28} className={star <= rating ? "text-amber-400 fill-amber-400" : "text-border"} />
                        </button>
                      ))}
                    </div>
                    {!reviewed ? (
                      <>
                        <textarea value={comment} onChange={e => setComment(e.target.value)}
                          placeholder="Rəyinizi paylaşın (isteğe bağlı)" rows={3} className="field-input mb-3 resize-none" />
                        <button className="btn-primary w-full" onClick={handleReview} disabled={!rating || reviewing}>
                          {reviewing ? "Göndərilir..." : "Rəyi göndər"}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm py-2">
                        <CheckCircle2 size={16} /> Rəyiniz qeyd edildi
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {gallery && (
        <GalleryModal items={gallery.items} startIdx={gallery.idx} onClose={() => setGallery(null)} token={token} />
      )}
    </div>
  );
}
