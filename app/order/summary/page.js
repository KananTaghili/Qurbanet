"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../lib/i18n";
import api from "../../../lib/api";

const C = ({ children, className = "" }) => (
  <div className={`bg-surface rounded-2xl border border-border shadow-card overflow-hidden ${className}`}>
    {children}
  </div>
);
const CHead = ({ label, colored }) => (
  <div className={`px-4 py-3 border-b border-border text-xs font-bold tracking-wide uppercase ${colored ? "text-primary bg-primary-surface" : "text-text-secondary bg-surface-alt/40"}`}>
    {label}
  </div>
);

function Spinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {label}
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

function PriceItem({ label, sub, value, isFree, sep, freeLabel }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 gap-2 ${sep ? "border-b border-border/40" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-text-primary leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-text-secondary mt-0.5">{sub}</p>}
      </div>
      {isFree
        ? <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">{freeLabel}</span>
        : <span className="text-[11px] font-extrabold text-text-primary bg-surface-alt px-1.5 py-0.5 rounded-md border border-border/40 shrink-0">{value}</span>
      }
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const { order, updateOrder, isLoaded } = useOrder();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const flowActive = sessionStorage.getItem("qurbanet_flow");
      if (!order || !flowActive) router.replace("/");
    } catch { router.replace("/"); }
  }, [isLoaded, order, router]);
  if (!isLoaded || !order) return null;

  const {
    animal, mode, qty, selectedDate, timeSlot,
    contactInfo, deliveryType, address,
    dist = {}, distFees = {}, deliveryFee = 0,
    totalPrice = 0, cutStyles = {},
    headBuckets = {}, feetBuckets = {},
    selectedWeight,
  } = order;

  const months = t(lang, 'months_long');
  const dateStr = selectedDate
    ? (() => {
        const d = new Date(selectedDate);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : "-";

  const getDistLabel = (key) => {
    const iKey = `distLabel_${key}`;
    const val = t(lang, iKey);
    return val !== iKey ? val : key;
  };

  const activeHeadOptions = (animal?.headOptions || []).filter((o) => o.isActive !== false);
  const activeFeetOptions = (animal?.feetOptions || []).filter((o) => o.isActive !== false);
  const effectiveCutStyles = animal?.cutStyleOptions || [];

  const headFee = activeHeadOptions.reduce((s, o) => s + (headBuckets[o.key] || 0) * (o.fee || 0), 0);
  const feetFee = activeFeetOptions.reduce((s, o) => s + (feetBuckets[o.key] || 0) * (o.fee || 0), 0);
  const cutFee  = effectiveCutStyles.reduce((s, cs) => s + (cutStyles[cs.key] || 0) * (cs.fee || 0), 0);
  const animalBasePrice = Math.max(0, totalPrice - headFee - feetFee - cutFee);

  const distRows = Object.entries(dist)
    .filter(([, count]) => (count || 0) > 0)
    .map(([key, count]) => ({
      key, label: getDistLabel(key), count, fee: distFees[key] ?? 0,
    }));
  const distFeeTotal = distRows.reduce((s, r) => s + r.fee, 0);

  const finalDeliveryFee = distRows.length === 0 && deliveryType === "delivery" ? deliveryFee : 0;
  const grandTotal = totalPrice + (distRows.length > 0 ? distFeeTotal : finalDeliveryFee);

  const activeCutRows  = effectiveCutStyles.filter((cs) => (cutStyles[cs.key] || 0) > 0);
  const activeHeadRows = activeHeadOptions.filter((o) => (headBuckets[o.key] || 0) > 0);
  const activeFeetRows = activeFeetOptions.filter((o) => (feetBuckets[o.key] || 0) > 0);

  const infoRows = [
    { label: t(lang, 'animalRow2'), value: animal?.nameAz || "-" },
    { label: t(lang, 'orderTypeRow'), value: mode === "serikli" ? t(lang, 'sharedTypeLabel') : t(lang, 'fullAnimal') },
    { label: t(lang, 'quantityRow'), value: `${qty} ${t(lang, 'pcsLabel')}` },
    { label: t(lang, 'slaughterDateRow'), value: dateStr },
    { label: t(lang, 'deliveryTimeRow'), value: timeSlot || "-" },
    ...(mode !== "serikli"
      ? [
          ...(distRows.length > 0
            ? [
                {
                  label: t(lang, 'meatDistRow'),
                  value: distRows.map((r) => `${r.label}: ${r.count} ${t(lang, 'shares')}`).join("\n"),
                },
                ...(address ? [{ label: t(lang, 'deliveryAddrRow'), value: address }] : []),
              ]
            : [
                { label: t(lang, 'deliveryTypeRow'), value: deliveryType === "delivery" ? t(lang, 'homeDelivery') : t(lang, 'pickupSelf') },
                ...(deliveryType === "delivery" && address ? [{ label: t(lang, 'addressRow'), value: address }] : []),
              ]),
        ]
      : []),
    { label: t(lang, 'contactRow'), value: contactInfo ? `${contactInfo.firstName} ${contactInfo.lastName}` : "-" },
    { label: t(lang, 'phoneRow'), value: contactInfo?.phone || "-" },
  ];

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
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

      const cutStyleAllocations = Object.entries(cutStyles)
        .filter(([, count]) => (count || 0) > 0)
        .map(([key, count]) => ({ key, count }));

      const headTotalCount = Object.values(headBuckets).reduce((s, v) => s + (v || 0), 0);
      const feetTotalCount = Object.values(feetBuckets).reduce((s, v) => s + (v || 0), 0);

      const payload = {
        animalType: animal.type,
        orderMode: mode,
        quantity: qty,
        slaughterDate: selectedDate ? new Date(selectedDate).toISOString() : null,
        deliveryWindow: timeSlot,
        distribution: distributionObj,
        lambSelection: selectedWeight ? { weightCategoryKey: selectedWeight.key } : undefined,
        cutStyle: cutStyleAllocations.length > 0 ? { allocations: cutStyleAllocations } : undefined,
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
        userNote: order.notes || undefined,
        deliveryPhones: order.deliveryPhones?.length ? order.deliveryPhones : undefined,
        addressNote: order.addressNote || undefined,
      };
      const res = await api.post("/orders", payload);
      if (res.data.success) {
        const createdOrder = res.data.data.order;
        updateOrder({ createdOrderId: createdOrder.id || createdOrder._id, createdOrder, grandTotal });
        router.push("/order/payment");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert(t(lang, 'sessionExpired'));
        router.push("/order/contact");
        return;
      }
      alert(err.response?.data?.message || t(lang, 'orderCreatedFail'));
    } finally {
      setLoading(false);
    }
  };

  const freeLabel = t(lang, 'free');

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title={t(lang, 'orderSummary')} />
      <StepHeader currentStep={3} />

      <div className="flex-1 page-scroll">
        <div className="p-4 md:p-6 md:grid md:grid-cols-[300px_1fr] md:gap-5 md:items-start max-w-6xl mx-auto w-full">
          {/* ── LEFT: Order info ─────────────────────────────────────── */}
          <C>
            <CHead label={t(lang, 'orderInfoCard')} colored />
            <div className="divide-y divide-border/40">
              {infoRows.map((row) => (
                <div key={row.label} className="flex justify-between items-start px-4 py-2.5 gap-3">
                  <span className="text-xs text-text-secondary font-medium shrink-0">{row.label}</span>
                  <span className="text-xs font-bold text-text-primary text-right whitespace-pre-line">{row.value}</span>
                </div>
              ))}
            </div>
          </C>

          {/* ── RIGHT: Price breakdown ───────────────────────────────── */}
          <div className="mt-4 md:mt-0 flex flex-col gap-4">
            <C className="border-primary/20 shadow-lg">
              <CHead label={t(lang, 'priceCalcCard')} colored />

              {/* Animal base price */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-alt/20">
                <div>
                  <p className="text-xs font-bold text-text-primary">{animal?.nameAz || t(lang, 'animalRow2')}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {mode === "serikli"
                      ? `${qty}/${animal?.totalShares || "?"} ${t(lang, 'shares')}`
                      : `${qty} ${t(lang, 'pcsLabel')} × ${Math.round(animalBasePrice / qty)} AZN`}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-text-primary bg-surface-alt px-2 py-1 rounded-lg border border-border/40">
                  {animalBasePrice} AZN
                </span>
              </div>

              {/* Cut / head / feet grid */}
              {(activeCutRows.length > 0 || activeHeadRows.length > 0 || activeFeetRows.length > 0) && (
                <div className="grid grid-cols-2 border-b border-border/50">
                  <div className="border-r border-border/50">
                    {activeCutRows.length > 0 ? (
                      <>
                        <SectionHead label={t(lang, 'cutMethodSection')} />
                        {activeCutRows.map((cs, i) => (
                          <PriceItem
                            key={cs.key}
                            label={cs.labelAz}
                            sub={`${cutStyles[cs.key]} ${t(lang, 'animalUnit')}`}
                            value={`+${cs.fee * cutStyles[cs.key]} AZN`}
                            isFree={cs.fee === 0}
                            freeLabel={freeLabel}
                            sep={i < activeCutRows.length - 1}
                          />
                        ))}
                      </>
                    ) : <div className="h-full" />}
                  </div>

                  <div>
                    {activeHeadRows.length > 0 && (
                      <>
                        <SectionHead label={t(lang, 'headProcessing')} badge={`${qty} ${t(lang, 'headsLabel')}`} />
                        {activeHeadRows.map((o, i) => (
                          <PriceItem
                            key={o.key}
                            label={o.labelAz}
                            sub={`${headBuckets[o.key]} ${t(lang, 'headsLabel')}`}
                            value={`+${o.fee * headBuckets[o.key]} AZN`}
                            isFree={o.fee === 0}
                            freeLabel={freeLabel}
                            sep={i < activeHeadRows.length - 1}
                          />
                        ))}
                      </>
                    )}
                    {activeFeetRows.length > 0 && (
                      <>
                        <SectionHead label={t(lang, 'feetProcessing')} badge={`${qty * 4} ${t(lang, 'feetLabel')}`} top={activeHeadRows.length > 0} />
                        {activeFeetRows.map((o, i) => (
                          <PriceItem
                            key={o.key}
                            label={o.labelAz}
                            sub={`${feetBuckets[o.key]} ${t(lang, 'feetLabel')}`}
                            value={`+${o.fee * feetBuckets[o.key]} AZN`}
                            isFree={o.fee === 0}
                            freeLabel={freeLabel}
                            sep={i < activeFeetRows.length - 1}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Dist rows */}
              {distRows.length > 0 && (
                <div className="border-b border-border/50">
                  <SectionHead label={t(lang, 'meatDistSection')} badge={`${Object.values(dist).reduce((s, v) => s + (v || 0), 0)} ${t(lang, 'shares')}`} />
                  <div className="grid grid-cols-2">
                    {distRows.map((row, i) => (
                      <div
                        key={row.key}
                        className={`flex items-center justify-between px-3 py-2 gap-2 ${i % 2 !== 0 ? "border-l border-border/40" : ""} ${i < distRows.length - 2 ? "border-b border-border/40" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-text-primary leading-tight">{row.label}</p>
                          <p className="text-[10px] text-text-secondary">{row.count} {t(lang, 'shares')}</p>
                        </div>
                        {row.fee === 0
                          ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">{freeLabel}</span>
                          : <span className="text-[11px] font-extrabold text-text-primary bg-surface-alt px-1.5 py-0.5 rounded-md border border-border/40 shrink-0">+{row.fee} AZN</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery */}
              {finalDeliveryFee > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                  <span className="text-xs font-medium text-text-secondary">{t(lang, 'deliveryRow')}</span>
                  <span className="text-xs font-extrabold text-text-primary">+{finalDeliveryFee} AZN</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center px-4 py-4 bg-primary-surface/20">
                <div className="flex flex-col">
                  <span className="font-black text-text-primary text-xs uppercase tracking-wider">
                    {t(lang, 'totalAmountHeader')}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium mt-0.5">
                    {t(lang, 'allServicesIncl')}
                  </span>
                </div>
                <span className="text-2xl font-black text-primary bg-white px-3 py-1 rounded-xl border border-primary/10 shadow-sm">
                  {grandTotal} AZN
                </span>
              </div>
            </C>
          </div>
        </div>

        {/* ── Mobile action bar ─────────────────────────────────────── */}
        <div className="mobile-action-bar">
          <button
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm"
            onClick={handleCreateOrder}
            disabled={loading}
          >
            {loading ? <Spinner label={t(lang, 'orderCreating')} /> : t(lang, 'confirmOrder')}
          </button>
        </div>
      </div>
    </div>
  );
}
