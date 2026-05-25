"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";
import api from "../../../lib/api";

const AZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];
const DIST_LABELS = {
  catdirilsin:       "Sizə çatdırılsın",
  ozum:              "Özüm götürəcəm",
  usaqlar_evi:       "Uşaqlar evinə",
  qocalar_evi:       "Qocalar evinə",
  ehtiyac_sahibleri: "Ehtiyac sahiblərinə",
};

const C = ({ children, className = "" }) => (
  <div
    className={`bg-surface rounded-2xl border border-border shadow-card overflow-hidden ${className}`}
  >
    {children}
  </div>
);
const CHead = ({ label, colored }) => (
  <div
    className={`px-4 py-3 border-b border-border text-xs font-bold tracking-wide uppercase ${colored ? "text-primary bg-primary-surface" : "text-text-secondary bg-surface-alt/40"}`}
  >
    {label}
  </div>
);

function Spinner() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Sifariş yaradılır...
    </span>
  );
}

function SectionHead({ label, badge, top }) {
  return (
    <div className={`px-3 py-1.5 bg-surface-alt/50 flex items-center justify-between ${top ? "border-t border-border/60" : ""}`}>
      <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">{label}</span>
      {badge && (
        <span className="text-[9px] font-bold text-text-secondary bg-white border border-border px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </div>
  );
}

function PriceItem({ label, sub, value, isFree, sep }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 gap-2 ${sep ? "border-b border-border/40" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-text-primary leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-text-secondary mt-0.5">{sub}</p>}
      </div>
      {isFree
        ? <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">Pulsuz</span>
        : <span className="text-[11px] font-extrabold text-text-primary bg-surface-alt px-1.5 py-0.5 rounded-md border border-border/40 shrink-0">{value}</span>
      }
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const { order, updateOrder } = useOrder();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order) router.replace("/");
  }, []);
  if (!order) return null;

  const {
    animal,
    mode,
    qty,
    selectedDate,
    timeSlot,
    contactInfo,
    deliveryType,
    address,
    dist = {},
    distFees = {},
    deliveryFee = 0,
    totalPrice = 0,
    cutStyles = {},
    headBuckets = {},
    feetBuckets = {},
    selectedWeight,
  } = order;

  const dateStr = selectedDate
    ? (() => {
        const d = new Date(selectedDate);
        return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : "-";

  // ── Fees ─────────────────────────────────────────────────────────────────
  const activeHeadOptions = (animal?.headOptions || []).filter(
    (o) => o.isActive !== false,
  );
  const activeFeetOptions = (animal?.feetOptions || []).filter(
    (o) => o.isActive !== false,
  );
  const effectiveCutStyles = animal?.cutStyleOptions || [];

  const headFee = activeHeadOptions.reduce(
    (s, o) => s + (headBuckets[o.key] || 0) * (o.fee || 0),
    0,
  );
  const feetFee = activeFeetOptions.reduce(
    (s, o) => s + (feetBuckets[o.key] || 0) * (o.fee || 0),
    0,
  );
  const cutFee = effectiveCutStyles.reduce(
    (s, cs) => s + (cutStyles[cs.key] || 0) * (cs.fee || 0),
    0,
  );
  const animalBasePrice = Math.max(0, totalPrice - headFee - feetFee - cutFee);

  // Distribution fee rows (new dist-based system)
  const distRows = Object.entries(dist)
    .filter(([, count]) => (count || 0) > 0)
    .map(([key, count]) => ({
      key,
      label: DIST_LABELS[key] || key,
      count,
      fee: distFees[key] ?? 0,
    }));
  const distFeeTotal = distRows.reduce((s, r) => s + r.fee, 0);

  // Fallback for serikli / old orders without dist
  const finalDeliveryFee = distRows.length === 0 && deliveryType === "delivery" ? deliveryFee : 0;
  const grandTotal = totalPrice + (distRows.length > 0 ? distFeeTotal : finalDeliveryFee);

  const activeCutRows = effectiveCutStyles.filter(
    (cs) => (cutStyles[cs.key] || 0) > 0,
  );
  const activeHeadRows = activeHeadOptions.filter(
    (o) => (headBuckets[o.key] || 0) > 0,
  );
  const activeFeetRows = activeFeetOptions.filter(
    (o) => (feetBuckets[o.key] || 0) > 0,
  );

  // ── Info rows ─────────────────────────────────────────────────────────────
  const infoRows = [
    { label: "Heyvan", value: animal?.nameAz || "-" },
    {
      label: "Sifariş növü",
      value: mode === "serikli" ? "Şərikli" : "Tam heyvan",
    },
    { label: "Miqdar", value: `${qty} ədəd` },
    { label: "Kəsim tarixi", value: dateStr },
    { label: "Çatdırılma vaxtı", value: timeSlot || "-" },
    ...(mode !== "serikli"
      ? [
          ...(distRows.length > 0
            ? [
                {
                  label: "Ət paylanması",
                  value: distRows
                    .map((r) => `${r.label}: ${r.count} pay`)
                    .join("\n"),
                },
                ...(address ? [{ label: "Çatdırılma ünvanı", value: address }] : []),
              ]
            : [
                { label: "Çatdırılma növü", value: deliveryType === "delivery" ? "Evə çatdırılma" : "Özüm götürəcəm" },
                ...(deliveryType === "delivery" && address ? [{ label: "Ünvan", value: address }] : []),
              ]),
        ]
      : []),
    {
      label: "Əlaqə",
      value: contactInfo
        ? `${contactInfo.firstName} ${contactInfo.lastName}`
        : "-",
    },
    { label: "Telefon", value: contactInfo?.phone || "-" },
  ];

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      // Build distribution object expected by backend from the dist pool
      let distributionObj;
      if ((dist.catdirilsin || 0) > 0) {
        const loc = order.pickedLocation;
        distributionObj = {
          type: "catdirilsin",
          location: address || loc?.address || "",
          coordinates: (loc?.coordinates?.lat != null)
            ? { lat: loc.coordinates.lat, lng: loc.coordinates.lng }
            : undefined,
        };
      } else if ((dist.ozum || 0) > 0) {
        distributionObj = { type: "ozum" };
      } else {
        const charityEntry = Object.entries(dist).find(
          ([k, v]) => ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"].includes(k) && (v || 0) > 0,
        );
        distributionObj = { type: charityEntry?.[0] || "ozum" };
      }

      // Cut style allocations
      const cutStyleAllocations = Object.entries(cutStyles)
        .filter(([, count]) => (count || 0) > 0)
        .map(([key, count]) => ({ key, count }));

      // Head / feet counts from buckets
      const headTotalCount = Object.values(headBuckets).reduce((s, v) => s + (v || 0), 0);
      const feetTotalCount = Object.values(feetBuckets).reduce((s, v) => s + (v || 0), 0);

      const payload = {
        animalType: animal.type,
        orderMode: mode,
        quantity: qty,
        slaughterDate: selectedDate ? new Date(selectedDate).toISOString() : null,
        deliveryWindow: timeSlot,
        distribution: distributionObj,
        lambSelection: selectedWeight
          ? { weightCategoryKey: selectedWeight.key }
          : undefined,
        cutStyle: cutStyleAllocations.length > 0
          ? { allocations: cutStyleAllocations }
          : undefined,
        qurbanParts: (headTotalCount > 0 || feetTotalCount > 0)
          ? {
              headTotalCount,
              headTorchedCount: headBuckets.torched  || 0,
              headReadyCount:   headBuckets.ready    || 0,
              headFreeCount:    headBuckets.free      || 0,
              headCharityCount: headBuckets.charity  || 0,
              feetTotalCount,
              feetTorchedCount: feetBuckets.torched  || 0,
              feetReadyCount:   feetBuckets.ready    || 0,
              feetFreeCount:    feetBuckets.free      || 0,
              feetCharityCount: feetBuckets.charity  || 0,
            }
          : undefined,
        contactInfo: {
          firstName: contactInfo?.firstName || "",
          lastName:  contactInfo?.lastName  || "",
          mobile:    contactInfo?.mobile || contactInfo?.phone || "",
        },
        selfPickup: (dist.ozum || 0) > 0,
        distSnapshot: Object.keys(dist).length ? dist : undefined,
      };
      const res = await api.post("/orders", payload);
      if (res.data.success) {
        const createdOrder = res.data.data.order;
        updateOrder({
          createdOrderId: createdOrder.id || createdOrder._id,
          createdOrder,
          grandTotal,
        });
        router.push("/order/payment");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert("Sessiya başa çatıb. Zəhmət olmasa yenidən daxil olun.");
        router.push("/order/contact");
        return;
      }
      alert(
        err.response?.data?.message ||
          "Sifariş yaradıla bilmədi. Yenidən cəhd edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title="Sifariş xülasəsi" />
      <StepHeader currentStep={3} />

      <div className="flex-1 page-scroll">
        <div className="p-4 md:p-6 md:grid md:grid-cols-[300px_1fr] md:gap-5 md:items-start max-w-6xl mx-auto w-full">
          {/* ── LEFT: Sifariş məlumatları (1 column) ──────────────────── */}
          <C>
            <CHead label="Sifariş məlumatları" colored />
            <div className="divide-y divide-border/40">
              {infoRows.map((row) => (
                <div key={row.label} className="flex justify-between items-start px-4 py-2.5 gap-3">
                  <span className="text-xs text-text-secondary font-medium shrink-0">{row.label}</span>
                  <span className="text-xs font-bold text-text-primary text-right whitespace-pre-line">{row.value}</span>
                </div>
              ))}
            </div>
          </C>

          {/* ── RIGHT (QIYMƏT HESABLAMASI) ────────────────────────────────── */}
          <div className="mt-4 md:mt-0 flex flex-col gap-4">
            <C className="border-primary/20 shadow-lg">
              <CHead label="Qiymət hesablaması" colored />

              {/* Heyvan əsas qiymət - tam eni */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-alt/20">
                <div>
                  <p className="text-xs font-bold text-text-primary">{animal?.nameAz || "Heyvan"}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {mode === "serikli"
                      ? `${qty}/${animal?.totalShares || "?"} pay`
                      : `${qty} ədəd × ${Math.round(animalBasePrice / qty)} AZN`}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-text-primary bg-surface-alt px-2 py-1 rounded-lg border border-border/40">
                  {animalBasePrice} AZN
                </span>
              </div>

              {/* 2-column grid: sol=Doğrama, sağ=Baş+Ayaq (alt-alta) */}
              {(activeCutRows.length > 0 || activeHeadRows.length > 0 || activeFeetRows.length > 0) && (
                <div className="grid grid-cols-2 border-b border-border/50">

                  {/* SOL SÜTUN — Doğrama üsulu */}
                  <div className="border-r border-border/50">
                    {activeCutRows.length > 0 ? (
                      <>
                        <SectionHead label="Doğrama üsulu" />
                        {activeCutRows.map((cs, i) => (
                          <PriceItem
                            key={cs.key}
                            label={cs.labelAz}
                            sub={`${cutStyles[cs.key]} heyvan`}
                            value={`+${cs.fee * cutStyles[cs.key]} AZN`}
                            isFree={cs.fee === 0}
                            sep={i < activeCutRows.length - 1}
                          />
                        ))}
                      </>
                    ) : <div className="h-full" />}
                  </div>

                  {/* SAĞ SÜTUN — Baş emalı üstdə, Ayaq emalı altda */}
                  <div>
                    {activeHeadRows.length > 0 && (
                      <>
                        <SectionHead label="Baş emalı" badge={`${qty} baş`} />
                        {activeHeadRows.map((o, i) => (
                          <PriceItem
                            key={o.key}
                            label={o.labelAz}
                            sub={`${headBuckets[o.key]} baş`}
                            value={`+${o.fee * headBuckets[o.key]} AZN`}
                            isFree={o.fee === 0}
                            sep={i < activeHeadRows.length - 1}
                          />
                        ))}
                      </>
                    )}
                    {activeFeetRows.length > 0 && (
                      <>
                        <SectionHead label="Ayaq emalı" badge={`${qty * 4} ayaq`} top={activeHeadRows.length > 0} />
                        {activeFeetRows.map((o, i) => (
                          <PriceItem
                            key={o.key}
                            label={o.labelAz}
                            sub={`${feetBuckets[o.key]} ayaq`}
                            value={`+${o.fee * feetBuckets[o.key]} AZN`}
                            isFree={o.fee === 0}
                            sep={i < activeFeetRows.length - 1}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Ət paylanması — tam eni */}
              {distRows.length > 0 && (
                <div className="border-b border-border/50">
                  <SectionHead label="Ət paylanması" badge={`${Object.values(dist).reduce((s, v) => s + (v || 0), 0)} pay`} />
                  <div className="grid grid-cols-2">
                    {distRows.map((row, i) => (
                      <div
                        key={row.key}
                        className={`flex items-center justify-between px-3 py-2 gap-2 ${i % 2 !== 0 ? "border-l border-border/40" : ""} ${i < distRows.length - 2 ? "border-b border-border/40" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-text-primary leading-tight">{row.label}</p>
                          <p className="text-[10px] text-text-secondary">{row.count} pay</p>
                        </div>
                        {row.fee === 0
                          ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">Pulsuz</span>
                          : <span className="text-[11px] font-extrabold text-text-primary bg-surface-alt px-1.5 py-0.5 rounded-md border border-border/40 shrink-0">+{row.fee} AZN</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Çatdırılma */}
              {finalDeliveryFee > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                  <span className="text-xs font-medium text-text-secondary">Çatdırılma</span>
                  <span className="text-xs font-extrabold text-text-primary">+{finalDeliveryFee} AZN</span>
                </div>
              )}

              {/* Cəmi */}
              <div className="flex justify-between items-center px-4 py-4 bg-primary-surface/20">
                <div className="flex flex-col">
                  <span className="font-black text-text-primary text-xs uppercase tracking-wider">
                    Yekun Məbləğ
                  </span>
                  <span className="text-[10px] text-text-muted font-medium mt-0.5">
                    Bütün xidmətlər daxil
                  </span>
                </div>
                <span className="text-2xl font-black text-primary bg-white px-3 py-1 rounded-xl border border-primary/10 shadow-sm">
                  {grandTotal} AZN
                </span>
              </div>
            </C>

            <button
              className="btn-primary hidden md:flex items-center justify-center py-4 rounded-xl font-bold text-base shadow-md transition-all active:scale-[0.98]"
              onClick={handleCreateOrder}
              disabled={loading}
            >
              {loading ? <Spinner /> : "Sifarişi təsdiqlə →"}
            </button>
          </div>
        </div>

        {/* ── MOBILE action bar ─────────────────────────────────────────── */}
        <div className="mobile-action-bar md:hidden">
          <button
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm"
            onClick={handleCreateOrder}
            disabled={loading}
          >
            {loading ? <Spinner /> : "Sifarişi təsdiqlə →"}
          </button>
        </div>
      </div>
    </div>
  );
}
