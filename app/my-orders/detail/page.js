"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2, Package, Truck, Star,
  MapPin, ExternalLink, ImageIcon, X, Banknote, FileText,
  ShoppingBag, Download, Play, Clock, CreditCard, XCircle,
  ChevronLeft, ChevronRight, Scale,
} from "lucide-react";
import api from "../../../lib/api";
import { useSocket } from "../../../hooks/useSocket";
import { useAuth } from "../../../context/AuthContext";

const BRAND = '#1c5e20';

function KnifeIcon({ size = 14, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className={className} style={style}>
      <path d="M4.34315 1.4082L22.3744 19.4394C22.9602 20.0252 22.9602 20.975 22.3744 21.5607C21.7886 22.1465 20.8388 22.1465 20.253 21.5607L15.6569 16.9646L12.1213 20.5001L4.34315 12.7219C1.2779 9.65666 1.22006 4.72285 4.16964 1.58709L4.34315 1.4082ZM4.58437 4.47838L4.5329 4.58823C3.56416 6.72709 3.91772 9.315 5.58066 11.1234L5.75736 11.3077L12.1207 17.6716L14.9491 14.8431L4.58437 4.47838Z"/>
    </svg>
  );
}

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

/* ── Status config — matches list page exactly ── */
const STATUS_CFG = {
  awaiting_payment: { label: 'Ödəniş gözlənilir', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', Icon: CreditCard,   step: 0 },
  placed:           { label: 'Sifariş yoxlanılır', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', Icon: Clock,        step: 0 },
  pending_payment:  { label: 'Ödəniş gözlənilir',  bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', Icon: CreditCard,   step: 0 },
  confirmed:        { label: 'Təsdiqləndi',         bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', Icon: CheckCircle2, step: 1 },
  paid:             { label: 'Ödənilib',            bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', Icon: CreditCard,   step: 1 },
  slaughtering:     { label: 'Kəsilir',             bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', Icon: KnifeIcon,    step: 2 },
  preparing:        { label: 'Hazırlanır',          bg: '#D1FAE5', color: '#065F46', dot: '#10B981', Icon: Package,      step: 3 },
  delivering:       { label: 'Çatdırılır',          bg: '#DBEAFE', color: '#1E3A8A', dot: '#2563EB', Icon: Truck,        step: 4 },
  completed:        { label: 'Tamamlandı',          bg: '#D1FAE5', color: '#14532D', dot: '#22C55E', Icon: CheckCircle2, step: 5 },
  cancelled:        { label: 'Ləğv edildi',         bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', Icon: XCircle,      step: -1 },
};

/* ── Pipeline steps — matches list page exactly ── */
const PIPELINE_STEPS = [
  { label: 'Sifariş yoxlanılır', Icon: Clock        },
  { label: 'Təsdiqləndi',        Icon: CheckCircle2 },
  { label: 'Kəsilir',            Icon: KnifeIcon    },
  { label: 'Hazırlanır',         Icon: Package      },
  { label: 'Çatdırılır',        Icon: Truck        },
  { label: 'Tamamlandı',         Icon: Star         },
];

const DIST_LABELS = {
  catdirilsin: "Sizə çatdırılsın", ozun_gotur: "Özüm götürəcəm",
  ozum: "Özüm götürəcəm", usaqlar_evi: "Uşaqlar evi",
  qocalar_evi: "Qocalar evi", ehtiyac_sahibleri: "Ehtiyac sahibləri",
};
const CUT_LABELS = {
  tam_cemdek: "Tam cəmdək", kababliq: "Kabablıq",
  qazan_yemekleri: "Qazan yeməkləri", qiyma: "Qiyma",
};

/* ── Vertical Timeline ── */
function VerticalTimeline({ step }) {
  if (step < 0) return null;
  return (
    <div className="flex flex-col">
      {PIPELINE_STEPS.map(({ label, Icon }, i) => {
        const done   = i <= step;
        const active = i === step;
        const isLast = i === PIPELINE_STEPS.length - 1;
        return (
          <div key={i} className="flex gap-3">
            {/* icon + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: done ? BRAND : '#f0f7f0',
                  border: `2px solid ${done ? BRAND : '#d1d5db'}`,
                  boxShadow: active ? `0 0 0 4px ${BRAND}22` : 'none',
                }}>
                <Icon size={14} style={{ color: done ? '#fff' : '#9ca3af' }} />
              </div>
              {!isLast && (
                <div className="w-[2px] flex-1 my-1" style={{ background: done && i < step ? BRAND : '#e5e7eb', minHeight: 20 }} />
              )}
            </div>
            {/* label */}
            <div className={`pt-1 ${isLast ? '' : 'pb-4'}`}>
              <p className="text-[13px] font-bold leading-none" style={{ color: done ? '#071b0d' : '#9ca3af' }}>
                {label}
              </p>
              {active && (
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: BRAND }}>Hal-hazırda</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── InfoRow ── */
function InfoRow({ label, value, last }) {
  return (
    <div className={`flex justify-between items-start px-4 py-3 gap-3 ${!last ? "border-b border-gray-100" : ""}`}>
      <span className="text-[11px] text-gray-400 font-medium shrink-0">{label}</span>
      <span className="text-[11px] font-bold text-gray-800 text-right max-w-[60%]">{value || "—"}</span>
    </div>
  );
}

/* ── StepMedia ── */
function StepMedia({ items, onOpen, token }) {
  if (!items?.length) return null;
  let vc = 0, pc = 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((m, i) => {
        const isVideo = m.type === "video";
        const label = isVideo ? `Video ${++vc}` : `Foto ${++pc}`;
        return (
          <button key={i} onClick={() => onOpen(items, i)}
            className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group"
            style={{ aspectRatio: "4/3" }}>
            {isVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#1b5e20,#2e7d32)" }}>
                <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={20} style={{ color: BRAND }} className="ml-0.5" />
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

/* ── GalleryModal ── */
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

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 99999, background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={dl} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white border-0 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <Download size={14} /> Yüklə
        </button>
        <span className="text-white font-bold text-sm">{idx + 1} / {items.length}</span>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white border-0 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
        {idx > 0 && (
          <button onClick={() => setIdx(i => Math.max(0, i - 1))}
            className="absolute left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white border-0 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ChevronLeft size={22} />
          </button>
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
            className="absolute right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white border-0 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ChevronRight size={22} />
          </button>
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

/* ── Page ── */
export default function OrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <OrderDetailInner />
    </Suspense>
  );
}

function OrderDetailInner() {
  const id = useSearchParams().get("id");
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
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: '#e8f5e9', borderTopColor: BRAND }} />
      </div>
    );
  if (!order) return null;

  const status     = order.status || 'placed';
  const cfg        = STATUS_CFG[status] || STATUS_CFG.placed;
  const StatusIcon = cfg.Icon;
  const step       = cfg.step;

  const animalImg    = order.animalImageUrl || ANIMAL_IMAGES[order.animalType] || "/qoyun.jpg";
  const animalName   = order.animalNameAz || "Heyvan";
  const totalAmt     = order.totalPrice ?? order.totalAmount ?? 0;
  const orderNum     = order.orderNumber || id.slice(-6).toUpperCase();
  const allMedia     = order.media || [];
  const weight       = order.lambSelection?.weightCategoryLabel || order.weightCategoryLabel || order.weightRange || order.lambSelection?.weightRange || order.animal?.weightRange || null;
  const isSelfPickup = ["ozun_gotur", "ozum"].includes(order.distribution?.type) || order.selfPickup;

  const detailRows = [
    { label: "Sifariş növü",     value: order.orderMode === "serikli" ? "Şərikli" : "Tam heyvan" },
    { label: "Miqdar",           value: `${order.quantity || 1} ədəd` },
    ...(weight ? [{ label: "Diri Çəki", value: weight }] : []),
    { label: "Çatdırılma",       value: DIST_LABELS[order.distribution?.type] || "—" },
    { label: "Kəsim tarixi",     value: fmtDate(order.slaughterDate) },
    { label: "Çatdırılma vaxtı", value: order.deliveryWindow || "—" },
    ...(order.distribution?.location ? [{ label: "Ünvan",   value: order.distribution.location }] : []),
    ...(order.distribution?.phones?.length > 0 ? [{ label: "Nömrə", value: order.distribution.phones.join(", ") }] : []),
    ...(order.distribution?.note      ? [{ label: "Qeyd",    value: order.distribution.note }] : []),
    ...(order.contactInfo ? [
      { label: "Əlaqə",   value: `${order.contactInfo.firstName} ${order.contactInfo.lastName}` },
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

  const cardStyle = { boxShadow: '0 2px 12px rgba(28,94,32,0.08)', border: '1.5px solid #e8f0e8' };

  const SectionHead = ({ Icon, label, iconBg = '#e8f5e9', iconColor = BRAND }) => (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      <span className="text-sm font-bold text-[#071b0d]">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col flex-1" style={{ background: '#f4f7f4' }}>
      <div className="flex-1 overflow-y-auto pb-10 relative">

        {/* ── BACK BUTTON — absolute far left of content area ── */}
        <button
          onClick={() => router.push('/my-orders')}
          className="apk-hide absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all hover:opacity-85 active:scale-95"
          style={{ background: BRAND, color: '#fff', border: 'none' }}
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
          Geri Qayıt
        </button>

        <div className="max-w-3xl mx-auto px-4 pt-4 pb-0 flex flex-col gap-3">

          {/* ── HERO CARD ── */}
          <div className="relative">
            {/* Green circle status icon — floats above card top-right */}
            {(() => { const PipeIcon = PIPELINE_STEPS[Math.max(0, step)]?.Icon || StatusIcon; return (
              <div className="absolute -top-3 -right-3 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: BRAND }}>
                <PipeIcon size={22} style={{ color: '#fff' }} />
              </div>
            ); })()}

            <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="flex flex-col md:flex-row">
                {/* PHOTO — full width on mobile, fixed width on desktop */}
                <div className="relative w-full md:w-[320px] md:shrink-0 overflow-hidden"
                  style={{ background: '#f0f7f0', height: undefined }}>
                  <img src={animalImg} alt={animalName}
                    className="w-full object-cover"
                    style={{ height: 260, objectPosition: 'center 15%' }} />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}>
                    <p className="font-mono text-[9px] font-bold text-white/90 truncate">{orderNum}</p>
                  </div>
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0 px-5 py-5 flex flex-col justify-center gap-1.5">
                  <p className="text-[18px] font-black text-[#071b0d] leading-snug">{animalName}</p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[32px] font-black text-[#071b0d] leading-none">{totalAmt}</span>
                    <span className="text-[15px] font-bold text-gray-400">AZN</span>
                  </div>
                  {weight && (
                    <span className="self-start inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: '#f0f7f0', color: BRAND }}>
                      <Scale size={11} /> {weight}
                    </span>
                  )}
                  <p className="text-[11px] text-gray-400">{fmtDate(order.createdAt)}</p>
                </div>
              </div>
            </div>{/* end bg-white card */}
          </div>{/* end relative wrapper (hero card) */}

          {/* ── STATUS + DETAILS: side by side on desktop ── */}
          <div className="flex flex-col md:flex-row gap-3 items-start">
            {/* LEFT: status steps */}
            <div className="w-full md:w-[45%] bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={CheckCircle2} label="Sifariş gedişatı" />
              <div className="px-4 py-4">
                <VerticalTimeline step={step} />
              </div>
            </div>

            {/* RIGHT: order details */}
            <div className="w-full md:flex-1 bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={FileText} label="Sifariş məlumatları" />
              {detailRows.map((row, i) => (
                <InfoRow key={row.label} label={row.label} value={row.value}
                  last={i === detailRows.length - 1 && cutEntries.length === 0} />
              ))}
              {cutEntries.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1.5 border-t border-gray-100">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Doğranma növü</span>
                  </div>
                  {cutEntries.map(([k, v], i) => (
                    <InfoRow key={k} label={CUT_LABELS[k] || k} value={`${v} ədəd`} last={i === cutEntries.length - 1} />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ── MEDIA CARD ── */}
          {allMedia.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={ImageIcon} label="Foto / Video" />
              <div className="p-4">
                <StepMedia items={allMedia}
                  onOpen={(items, idx) => setGallery({ items, idx })} token={token} />
              </div>
            </div>
          )}

          {/* ── CASH PICKUP CODE ── */}
          {order.cashPickupCode && (
            <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={Banknote} label="Yerində ödəniş kodu" iconBg="#fef9ec" iconColor="#d97706" />
              <div className="px-4 py-5 flex flex-col items-center gap-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mağazada göstərin</p>
                <div className="rounded-2xl px-8 py-3"
                  style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1.5px solid rgba(245,158,11,0.3)" }}>
                  <p className="text-3xl font-black tracking-[0.2em] font-mono" style={{ color: "#92400e" }}>
                    {order.cashPickupCode}
                  </p>
                </div>
                {cashPickupLocation && (
                  <div className="flex flex-col gap-1.5 w-full items-center">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin size={13} style={{ color: BRAND }} />
                      <span className="font-medium">{cashPickupLocation.address}</span>
                    </div>
                    {cashPickupLocation.lat && cashPickupLocation.lng && (
                      <a href={`https://www.google.com/maps?q=${cashPickupLocation.lat},${cashPickupLocation.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold no-underline" style={{ color: BRAND }}>
                        <ExternalLink size={13} /> Xəritədə aç
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MEAT PICKUP ── */}
          {isSelfPickup && meatPickupLocation && (
            <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={ShoppingBag} label="Əti götürmə" />
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                  style={{ background: '#f0f9f0', borderColor: `${BRAND}30` }}>
                  <MapPin size={14} style={{ color: BRAND }} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold" style={{ color: BRAND }}>{meatPickupLocation.address}</p>
                </div>
                {meatPickupLocation.lat && meatPickupLocation.lng && (
                  <a href={`https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm no-underline"
                    style={{ border: `2px solid ${BRAND}`, color: BRAND }}>
                    <ExternalLink size={14} /> Google Maps-də aç
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── DELIVERY CONFIRM CODE ── */}
          {order.deliveryConfirmCode && (
            <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={Truck} label="Çatdırılma kodu" iconBg="#eff6ff" iconColor="#3b82f6" />
              <div className="px-4 py-5 flex flex-col items-center gap-2">
                <div className="rounded-2xl px-8 py-3"
                  style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1.5px solid rgba(59,130,246,0.25)" }}>
                  <p className="text-3xl font-black tracking-[0.2em] font-mono" style={{ color: "#1e40af" }}>
                    {order.deliveryConfirmCode}
                  </p>
                </div>
                <p className="text-xs text-gray-400">Ət çatanda bu kodu kuryerə deyin</p>
              </div>
            </div>
          )}

          {/* ── REVIEW ── */}
          {order.status === "completed" && (
            <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
              <SectionHead Icon={Star} label="Rəy bildirin" iconBg="#fef9ec" iconColor="#f59e0b" />
              <div className="p-4">
                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => !reviewed && setRating(star)} disabled={reviewed}
                      className="cursor-pointer bg-transparent border-0 p-0 transition-transform hover:scale-110">
                      <Star size={28} className={star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                    </button>
                  ))}
                </div>
                {!reviewed ? (
                  <>
                    <textarea value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Rəyinizi paylaşın (isteğe bağlı)" rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none outline-none mb-3"
                      style={{ fontFamily: 'inherit' }} />
                    <button onClick={handleReview} disabled={!rating || reviewing}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-opacity disabled:opacity-50 border-0 cursor-pointer"
                      style={{ background: BRAND }}>
                      {reviewing ? "Göndərilir..." : "Rəyi göndər"}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold py-2" style={{ color: BRAND }}>
                    <CheckCircle2 size={16} /> Rəyiniz qeyd edildi
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {gallery && (
        <GalleryModal items={gallery.items} startIdx={gallery.idx} onClose={() => setGallery(null)} token={token} />
      )}
    </div>
  );
}
