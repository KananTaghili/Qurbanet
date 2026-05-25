"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  ClipboardList,
  CheckCircle,
  Scissors,
  Package,
  Truck,
  Star,
  MapPin,
  ExternalLink,
  Video,
  ImageIcon,
  X,
  Banknote,
  FileText,
  ShoppingBag,
  Download,
  Play,
  ChevronLeft,
  Clock,
} from "lucide-react";
import { RiKnifeLine } from "react-icons/ri";
import BackHeader from "../../../components/BackHeader";
import StatusBadge from "../../../components/StatusBadge";
import api from "../../../lib/api";
import { useSocket } from "../../../hooks/useSocket";

const AZ_MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyun",
  "İyul",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];
function fmtDate(ds) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const ANIMAL_IMAGES = {
  quzu: "/qoyun.jpg",
  qoyun: "/qoyun.jpg",
  qoc: "/qoc.jpg",
  dana: "/dana.jpg",
  deve: "/deve.jpg",
};
const STATUS_COLOR = {
  placed: "#F59E0B",
  pending_payment: "#F59E0B",
  confirmed: "#3B82F6",
  paid: "#3B82F6",
  slaughtering: "#EF4444",
  preparing: "#10B981",
  delivering: "#3B82F6",
  completed: "#22C55E",
  cancelled: "#9CA3AF",
};
const TIMELINE_STEPS = [
  { key: "placed", label: "Sifariş verildi", Icon: ClipboardList, stage: null },
  { key: "confirmed", label: "Təsdiqləndi", Icon: CheckCircle, stage: null },
  {
    key: "slaughtering",
    label: "Kəsilir",
    Icon: RiKnifeLine,
    stage: "slaughter",
  },
  { key: "preparing", label: "Hazırlanır", Icon: Package, stage: null },
  { key: "delivering", label: "Çatdırılır", Icon: Truck, stage: "delivery" },
  { key: "completed", label: "Tamamlandı", Icon: Star, stage: null },
];
const STATUS_ORDER = [
  "placed",
  "confirmed",
  "slaughtering",
  "preparing",
  "delivering",
  "completed",
];
const DIST_LABELS = {
  catdirilsin: "Sizə çatdırılsın",
  ozun_gotur: "Özüm götürəcəm",
  ozum: "Özüm götürəcəm",
  usaqlar_evi: "Uşaqlar evi",
  qocalar_evi: "Qocalar evi",
  ehtiyac_sahibleri: "Ehtiyac sahibləri",
};
const CUT_LABELS = {
  tam_cemdek: "Tam cəmdək",
  kababliq: "Kabablıq",
  qazan_yemekleri: "Qazan yeməkləri",
  qiyma: "Qiyma",
};

// ── Custom knife icon ─────────────────────────────────────────────────────────
// ── Accordion ─────────────────────────────────────────────────────────────────
function AccordionCard({
  id,
  openId,
  setOpenId,
  Icon,
  iconBg = "bg-primary-surface",
  iconColor = "text-primary",
  title,
  children,
}) {
  const isOpen = openId === id;
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer bg-transparent border-0 text-left"
        onClick={() => setOpenId(isOpen ? null : id)}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon size={20} className={iconColor} />
        </div>
        <span className="flex-1 text-sm font-bold text-text-primary">
          {title}
        </span>
        {isOpen ? (
          <ChevronDown
            size={18}
            className="text-text-secondary flex-shrink-0"
          />
        ) : (
          <ChevronRight
            size={18}
            className="text-text-secondary flex-shrink-0"
          />
        )}
      </button>
      {isOpen && <div className="border-t border-border/60">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div
      className={`flex justify-between items-start px-4 py-3 gap-3 ${!last ? "border-b border-border/60" : ""}`}
    >
      <span className="text-xs text-text-secondary font-medium shrink-0">
        {label}
      </span>
      <span className="text-xs font-bold text-text-primary text-right max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  );
}

// ── Media thumbnail grid inside timeline step ──────────────────────────────────
function StepMedia({ items, onOpen, pending }) {
  const [filter, setFilter] = useState("all");

  if (!items || items.length === 0) {
    if (!pending) return null;
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-alt border border-border/60">
        <Clock size={13} className="text-text-muted flex-shrink-0" />
        <span className="text-xs text-text-muted font-medium">
          Video və şəkillər gözlənilir...
        </span>
      </div>
    );
  }

  const videos = items.filter((m) => m.type === "video");
  const photos = items.filter((m) => m.type === "photo");
  const shown =
    filter === "video" ? videos : filter === "photo" ? photos : items;

  return (
    <div className="mt-2 mb-1">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {[
          { key: "all", label: `Hamısı ${items.length}` },
          ...(videos.length > 0
            ? [{ key: "video", label: `Video ${videos.length}` }]
            : []),
          ...(photos.length > 0
            ? [{ key: "photo", label: `Foto ${photos.length}` }]
            : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
              filter === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-surface border-border text-text-secondary hover:border-primary/40"
            }`}
          >
            {tab.key === "video" && <Video size={10} />}
            {tab.key === "photo" && <ImageIcon size={10} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 gap-2">
        {shown.map((m, i) => {
          const globalIdx = items.indexOf(m);
          return (
            <button
              key={i}
              onClick={() => onOpen(items, globalIdx)}
              className="relative rounded-xl overflow-hidden bg-surface-alt border border-border cursor-pointer group"
              style={{ aspectRatio: "16/10" }}
            >
              {m.type === "video" ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-primary-surface/60">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play size={16} className="text-primary ml-0.5" />
                  </div>
                  <span className="text-[10px] font-bold text-primary">
                    Video {videos.indexOf(m) + 1}
                  </span>
                </div>
              ) : (
                <>
                  <img
                    src={m.url}
                    alt={`Foto ${photos.indexOf(m) + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/40">
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      <ImageIcon size={9} /> Foto {photos.indexOf(m) + 1}
                    </span>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Gallery viewer ─────────────────────────────────────────────────────────────
function GalleryModal({ items, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  if (!items || items.length === 0) return null;
  const item = items[idx];
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(items.length - 1, i + 1));

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.filename || `media-${idx + 1}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 99999, background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold cursor-pointer transition-colors border-0"
          style={{ background: "rgba(255,255,255,0.12)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
        >
          <Download size={14} /> Yüklə
        </button>

        <span className="text-white font-bold text-sm tracking-wide">
          {idx + 1} / {items.length}
        </span>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors border-0"
          style={{ background: "rgba(255,255,255,0.12)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Media area ── */}
      <div
        className="flex-1 flex items-center justify-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev arrow */}
        {idx > 0 && (
          <button
            onClick={prev}
            className="absolute left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors border-0"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center px-16 py-2">
          {item.type === "video" ? (
            <video
              key={item.url}
              controls
              autoPlay
              className="rounded-2xl shadow-2xl"
              style={{
                maxWidth: "100%",
                maxHeight: "calc(100vh - 140px)",
                background: "#000",
              }}
            >
              <source src={item.url} />
            </video>
          ) : (
            <img
              src={item.url}
              alt="Media"
              className="rounded-2xl shadow-2xl object-contain"
              style={{ maxWidth: "100%", maxHeight: "calc(100vh - 140px)" }}
            />
          )}
        </div>

        {/* Next arrow */}
        {idx < items.length - 1 && (
          <button
            onClick={next}
            className="absolute right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors border-0"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* ── Dot nav ── */}
      {items.length > 1 && (
        <div
          className="flex justify-center gap-2 py-4 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="rounded-full border-0 cursor-pointer transition-all"
              style={{
                width: i === idx ? 20 : 8,
                height: 8,
                background: i === idx ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState("timeline");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [gallery, setGallery] = useState(null); // {items, idx}
  const [meatPickupLocation, setMeatPickupLocation] = useState(null);
  const [cashPickupLocation, setCashPickupLocation] = useState(null);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);
  useSocket({
    "order:updated": (d) => {
      if (d?.orderId === id) fetchOrder();
    },
  });

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      const o = res.data.data?.order;
      setOrder(o);
      if (o?.review) {
        setRating(o.review.rating || 0);
        setComment(o.review.comment || "");
        setReviewed(true);
      }
      const isSelfPickup =
        ["ozun_gotur", "ozum"].includes(o?.distribution?.type) || o?.selfPickup;
      if (isSelfPickup || o?.cashPickupCode) {
        const cfg = await api.get("/app-config/settings");
        const d = cfg.data?.data;
        if (isSelfPickup && d?.meatPickupLocation?.address)
          setMeatPickupLocation(d.meatPickupLocation);
        if (o?.cashPickupCode && d?.cashPickupLocation?.address)
          setCashPickupLocation(d.cashPickupLocation);
      }
    } catch (err) {
      console.error("Order fetch error:", err?.response?.status, err?.message);
      if (err?.response?.status === 404) router.replace("/my-orders");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!rating) return;
    setReviewing(true);
    try {
      await api.post(`/orders/${id}/review`, { rating, comment });
      setReviewed(true);
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi.");
    } finally {
      setReviewing(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!order) return null;

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const accentColor = STATUS_COLOR[order.status] || "#9CA3AF";
  const animalImg =
    order.animalImageUrl || ANIMAL_IMAGES[order.animalType] || "/qoyun.jpg";
  const animalName = order.animalNameAz || "Heyvan";
  const totalAmt = order.totalPrice ?? order.totalAmount ?? 0;
  const orderNum = order.orderNumber || id.slice(-6).toUpperCase();
  const allMedia = order.media || [];
  const timeline =
    order.statusTimeline ||
    TIMELINE_STEPS.map((s) => ({
      key: s.key,
      label: s.label,
      done: STATUS_ORDER.indexOf(s.key) <= currentIdx,
    }));

  const detailRows = [
    {
      label: "Sifariş növü",
      value: order.orderMode === "serikli" ? "Şərikli" : "Tam heyvan",
    },
    { label: "Miqdar", value: `${order.quantity || 1} ədəd` },
    {
      label: "Çatdırılma",
      value: DIST_LABELS[order.distribution?.type] || "—",
    },
    { label: "Kəsim tarixi", value: fmtDate(order.slaughterDate) },
    { label: "Çatdırılma vaxtı", value: order.deliveryWindow || "—" },
    ...(order.distribution?.location
      ? [{ label: "Ünvan", value: order.distribution.location }]
      : []),
    ...(order.distribution?.phones?.length > 0
      ? [
          {
            label: "Çatdırılma nömrələri",
            value: order.distribution.phones.join(", "),
          },
        ]
      : []),
    ...(order.distribution?.note
      ? [{ label: "Ünvan qeydi", value: order.distribution.note }]
      : []),
    ...(order.contactInfo
      ? [
          {
            label: "Əlaqə",
            value: `${order.contactInfo.firstName} ${order.contactInfo.lastName}`,
          },
          {
            label: "Telefon",
            value: order.contactInfo.mobile || order.contactInfo.phone || "—",
          },
        ]
      : []),
    ...(order.userNote
      ? [{ label: "Müştəri qeydi", value: order.userNote }]
      : []),
  ];

  const cutEntries = (() => {
    const cs = order.cutStyle;
    if (!cs) return [];
    if (Array.isArray(cs.allocations))
      return cs.allocations
        .filter((a) => a.count > 0)
        .map((a) => [a.key, a.count]);
    return Object.entries(cs).filter(([k, v]) => k !== "extraFee" && v > 0);
  })();

  const showCashCode = !!order.cashPickupCode;
  const isSelfPickup =
    ["ozun_gotur", "ozum"].includes(order.distribution?.type) ||
    order.selfPickup;
  const showMeatPickup = isSelfPickup && meatPickupLocation;
  const showReview = order.status === "completed";

  // Media per stage
  const mediaByStage = (stage) => allMedia.filter((m) => m.stage === stage);

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title={`Sifariş #${orderNum}`} />

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-3">
          {/* Hero */}
          <div
            className="rounded-3xl overflow-hidden shadow-lg"
            style={{ background: "var(--primary)" }}
          >
            <div className="p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Sifariş nömrəsi
                </p>
                <p className="text-white font-extrabold text-xl font-mono leading-tight mb-3">
                  {orderNum}
                </p>
                <div className="mb-3">
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-white/80 text-sm font-semibold">
                  {animalName}
                </p>
                <p className="text-white text-2xl font-extrabold mt-0.5">
                  {totalAmt} AZN
                </p>
              </div>
              <div
                className="w-40 h-40 rounded-2xl overflow-hidden bg-white flex-shrink-0"
                style={{ border: `3px solid ${accentColor}` }}
              >
                <img
                  src={animalImg}
                  alt={animalName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div className="flex flex-col md:flex-row gap-3 items-start">
            {/* LEFT */}
            <div className="flex flex-col gap-3 w-full md:flex-1 md:min-w-0">
              {/* Timeline — ALWAYS FIRST */}
              <AccordionCard
                id="timeline"
                openId={openId}
                setOpenId={setOpenId}
                Icon={ClipboardList}
                title="Sifariş gedişatı"
              >
                <div className="px-4 py-4 flex flex-col">
                  {TIMELINE_STEPS.map((step, i) => {
                    const tItem =
                      timeline.find((t) => t.key === step.key) || {};
                    const done =
                      tItem.done ||
                      STATUS_ORDER.indexOf(step.key) <= currentIdx;
                    const active = order.status === step.key;
                    const last = i === TIMELINE_STEPS.length - 1;
                    const stepMedia = step.stage
                      ? mediaByStage(step.stage)
                      : [];
                    const hasMedia = done && step.stage;
                    return (
                      <div key={step.key}>
                        {/* Step row */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                done
                                  ? "bg-primary"
                                  : "bg-surface-alt border-2 border-border"
                              } ${active ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}
                            >
                              <step.Icon
                                size={16}
                                className={
                                  done ? "text-white" : "text-text-muted"
                                }
                              />
                            </div>
                            {(!last || hasMedia) && (
                              <div
                                className={`w-0.5 mt-1 rounded-full ${done ? "bg-primary" : "bg-border"}`}
                                style={{
                                  minHeight: hasMedia ? 16 : 28,
                                  flex: hasMedia ? "none" : 1,
                                  height: hasMedia ? 16 : undefined,
                                }}
                              />
                            )}
                          </div>
                          <div
                            className={`flex-1 min-w-0 ${hasMedia ? "pt-1.5 pb-2" : "pt-1.5 pb-5"}`}
                          >
                            <p
                              className={`text-sm font-bold ${done ? "text-text-primary" : "text-text-muted"}`}
                            >
                              {step.label}
                            </p>
                            {tItem.date ? (
                              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary-surface border border-primary/20">
                                <span className="text-[11px] font-bold text-primary">
                                  {fmtDate(tItem.date)}
                                </span>
                              </div>
                            ) : (
                              !done && (
                                <p className="text-xs text-text-muted mt-0.5">
                                  Gözlənilir
                                </p>
                              )
                            )}
                          </div>
                        </div>

                        {/* Full-width media row */}
                        {hasMedia && (
                          <div className="flex gap-3 mb-4">
                            {/* Connector line continuation */}
                            <div className="flex flex-col items-center flex-shrink-0 w-9">
                              {!last && (
                                <div
                                  className={`w-0.5 rounded-full flex-1 min-h-[8px] ${done ? "bg-primary" : "bg-border"}`}
                                />
                              )}
                            </div>
                            {/* Media area — full remaining width */}
                            <div className="flex-1 min-w-0 pb-2">
                              <StepMedia
                                items={stepMedia}
                                pending={stepMedia.length === 0}
                                onOpen={(items, idx) =>
                                  setGallery({ items, idx })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionCard>

              {showCashCode && (
                <AccordionCard
                  id="cash"
                  openId={openId}
                  setOpenId={setOpenId}
                  Icon={Banknote}
                  title="Yerində ödəniş kodu"
                >
                  <div className="px-4 py-5 text-center">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
                      Mağazada göstərin
                    </p>
                    <p className="text-3xl font-extrabold text-text-primary tracking-[0.15em] font-mono">
                      {order.cashPickupCode}
                    </p>
                    {cashPickupLocation && (
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-1.5 text-sm text-text-secondary">
                          <MapPin size={13} className="text-primary" />
                          <span className="font-medium">
                            {cashPickupLocation.address}
                          </span>
                        </div>
                        {cashPickupLocation.lat && cashPickupLocation.lng && (
                          <a
                            href={`https://www.google.com/maps?q=${cashPickupLocation.lat},${cashPickupLocation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-primary text-sm font-bold no-underline"
                          >
                            <ExternalLink size={13} /> Xəritədə aç
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionCard>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-3 w-full md:flex-1 md:min-w-0">
              <AccordionCard
                id="details"
                openId={openId}
                setOpenId={setOpenId}
                Icon={FileText}
                title="Sifariş məlumatları"
              >
                {detailRows.map((row, i) => (
                  <InfoRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={
                      i === detailRows.length - 1 && cutEntries.length === 0
                    }
                  />
                ))}
                {cutEntries.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1.5 border-t border-border/60">
                      <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">
                        Doğranma növü
                      </span>
                    </div>
                    {cutEntries.map(([k, v], i) => (
                      <InfoRow
                        key={k}
                        label={CUT_LABELS[k] || k}
                        value={`${v} ədəd`}
                        last={i === cutEntries.length - 1}
                      />
                    ))}
                  </>
                )}
              </AccordionCard>

              {showMeatPickup && (
                <AccordionCard
                  id="pickup"
                  openId={openId}
                  setOpenId={setOpenId}
                  Icon={ShoppingBag}
                  title="Əti götürmə"
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2 bg-primary-surface rounded-xl border border-primary/20 px-3 py-2.5">
                      <MapPin
                        size={14}
                        className="text-primary flex-shrink-0 mt-0.5"
                      />
                      <p className="text-sm font-semibold text-primary">
                        {meatPickupLocation.address}
                      </p>
                    </div>
                    {meatPickupLocation.lat && meatPickupLocation.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 border-2 border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary-surface transition-colors no-underline"
                      >
                        <ExternalLink size={14} /> Google Maps-də aç
                      </a>
                    )}
                  </div>
                </AccordionCard>
              )}

              {order.deliveryConfirmCode && (
                <AccordionCard
                  id="delcode"
                  openId={openId}
                  setOpenId={setOpenId}
                  Icon={Truck}
                  title="Çatdırılma kodu"
                >
                  <div className="px-4 py-5 text-center">
                    <p className="text-3xl font-extrabold text-primary tracking-[0.15em] font-mono mb-1">
                      {order.deliveryConfirmCode}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Ət çatanda bu kodu kuryerə deyin
                    </p>
                  </div>
                </AccordionCard>
              )}

              {showReview && (
                <AccordionCard
                  id="review"
                  openId={openId}
                  setOpenId={setOpenId}
                  Icon={Star}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-500"
                  title="Rəy bildirin"
                >
                  <div className="p-4">
                    <div className="flex justify-center gap-3 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => !reviewed && setRating(star)}
                          disabled={reviewed}
                          className="cursor-pointer bg-transparent border-0 p-0 transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={
                              star <= rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-border"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    {!reviewed ? (
                      <>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Rəyinizi paylaşın (isteğe bağlı)"
                          rows={3}
                          className="field-input mb-3 resize-none"
                        />
                        <button
                          className="btn-primary w-full"
                          onClick={handleReview}
                          disabled={!rating || reviewing}
                        >
                          {reviewing ? "Göndərilir..." : "Rəyi göndər"}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm py-2">
                        <CheckCircle size={16} /> Rəyiniz qeyd edildi
                      </div>
                    )}
                  </div>
                </AccordionCard>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery modal */}
      {gallery && (
        <GalleryModal
          items={gallery.items}
          startIdx={gallery.idx}
          onClose={() => setGallery(null)}
        />
      )}
    </div>
  );
}
