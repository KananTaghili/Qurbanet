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
    <div
      className={`px-3 py-1.5 bg-surface-alt/50 flex items-center justify-between ${top ? "border-t border-border/60" : ""}`}
    >
      <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
        {label}
      </span>
      {badge && (
        <span className="text-[9px] font-bold text-text-secondary bg-white border border-border px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function PriceItem({ label, sub, value, isFree, sep, freeLabel }) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 gap-2 ${sep ? "border-b border-border/40" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-text-primary leading-tight">
          {label}
        </p>
        {sub && <p className="text-[10px] text-text-secondary mt-0.5">{sub}</p>}
      </div>
      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
        isFree
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-surface-alt text-text-primary border-border/40"
      }`}>
        {isFree ? freeLabel : value}
      </span>
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
    } catch {
      router.replace("/");
    }
  }, [isLoaded, order, router]);
  if (!isLoaded || !order) return null;

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

  const months = t(lang, "months_long");
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

  // Determine selected distribution option and its fee
  const charityKeys = ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];
  const selectedDistKey = Object.keys(dist || {}).find(
    (k) => (dist[k] || 0) > 0,
  );
  const isCharityDist = charityKeys.includes(selectedDistKey);
  const selectedDistFee = distFees[selectedDistKey] || 0;

  const finalDeliveryFee = isCharityDist
    ? selectedDistFee
    : deliveryType === "delivery"
      ? deliveryFee
      : 0;
  const grandTotal = totalPrice + finalDeliveryFee;

  const activeCutRows = effectiveCutStyles.filter(
    (cs) => (cutStyles[cs.key] || 0) > 0,
  );
  const activeHeadRows = activeHeadOptions.filter(
    (o) => (headBuckets[o.key] || 0) > 0,
  );
  const activeFeetRows = activeFeetOptions.filter(
    (o) => (feetBuckets[o.key] || 0) > 0,
  );

  const infoRows = [
    { label: t(lang, "animalRow2"), value: animal?.nameAz || "-" },
    { label: t(lang, "quantityRow"), value: `${qty} ${t(lang, "pcsLabel")}` },
    { label: t(lang, "slaughterDateRow"), value: dateStr },
    { label: t(lang, "deliveryTimeRow"), value: timeSlot || "-" },
    ...(mode !== "serikli"
      ? [
          {
            label: t(lang, "deliveryTypeRow"),
            value: isCharityDist
              ? getDistLabel(selectedDistKey)
              : deliveryType === "delivery"
              ? t(lang, "homeDelivery")
              : t(lang, "pickupSelf"),
          },
          ...(deliveryType === "delivery" && address
            ? [{ label: t(lang, "addressRow"), value: address }]
            : []),
        ]
      : []),
    ...(!isCharityDist ? [
      {
        label: t(lang, "contactRow"),
        value: contactInfo
          ? `${contactInfo.firstName} ${contactInfo.lastName}`
          : "-",
      },
      {
    label: t(lang, "phoneRow"),
    value: order.deliveryPhones?.length
      ? order.deliveryPhones.join("\n")
      : contactInfo?.phone || "Nömrə yoxdur",
  },
    ] : []),
    ...(order.notes ? [{ label: t(lang, "notes"), value: order.notes }] : []),
    ...(order.addressNote ? [{ label: "Ünvan qeydi", value: order.addressNote }] : []),
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
          coordinates:
            loc?.coordinates?.lat != null
              ? { lat: loc.coordinates.lat, lng: loc.coordinates.lng }
              : undefined,
        };
      } else if ((dist.ozum || 0) > 0) {
        distributionObj = { type: "ozum" };
      } else {
        const charityEntry = Object.entries(dist).find(
          ([k, v]) =>
            ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"].includes(k) &&
            (v || 0) > 0,
        );
        distributionObj = { type: charityEntry?.[0] || "ozum" };
      }

      const cutStyleAllocations = Object.entries(cutStyles)
        .filter(([, count]) => (count || 0) > 0)
        .map(([key, count]) => ({ key, count }));

      const headTotalCount = Object.values(headBuckets).reduce(
        (s, v) => s + (v || 0),
        0,
      );
      const feetTotalCount = Object.values(feetBuckets).reduce(
        (s, v) => s + (v || 0),
        0,
      );

      const payload = {
        animalType: animal.type,
        orderMode: mode,
        quantity: qty,
        slaughterDate: selectedDate
          ? new Date(selectedDate).toISOString()
          : null,
        deliveryWindow: timeSlot,
        distribution: distributionObj,
        lambSelection: selectedWeight
          ? {
              weightCategoryKey: selectedWeight.key,
              weightCategoryLabel: selectedWeight.labelAz || selectedWeight.label || selectedWeight.key,
            }
          : undefined,
        cutStyle:
          cutStyleAllocations.length > 0
            ? { allocations: cutStyleAllocations }
            : undefined,
        qurbanParts:
          headTotalCount > 0 || feetTotalCount > 0
            ? {
                headTotalCount,
                headTorchedCount: headBuckets.torched || 0,
                headReadyCount: headBuckets.ready || 0,
                headFreeCount: headBuckets.free || 0,
                headCharityCount: headBuckets.charity || 0,
                feetTotalCount,
                feetTorchedCount: feetBuckets.torched || 0,
                feetReadyCount: feetBuckets.ready || 0,
                feetFreeCount: feetBuckets.free || 0,
                feetCharityCount: feetBuckets.charity || 0,
              }
            : undefined,
        contactInfo: {
          firstName: contactInfo?.firstName || "",
          lastName: contactInfo?.lastName || "",
          mobile: contactInfo?.mobile || contactInfo?.phone || undefined,
        },
        selfPickup: (dist.ozum || 0) > 0,
        distSnapshot: Object.keys(dist).length ? dist : undefined,
        userNote: order.notes || undefined,
        deliveryPhones: order.deliveryPhones?.length
          ? order.deliveryPhones
          : undefined,
        addressNote: order.addressNote || undefined,
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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(t(lang, "sessionExpired"));
        router.push("/order/contact");
        return;
      }
      alert(err.response?.data?.message || t(lang, "orderCreatedFail"));
    } finally {
      setLoading(false);
    }
  };

  const freeLabel = t(lang, "free");

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader
        title={t(lang, "orderSummary")}
        onBack={() =>
          router.push(
            order?.mode === "serikli"
              ? "/order/quantity"
              : "/order/distribution",
          )
        }
      />
      <StepHeader currentStep={3} />

      <div className="flex-1 page-scroll">
        <div className="p-4 lg:p-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-5 lg:items-start max-w-6xl mx-auto w-full">
          {/* ── LEFT: Order info ─────────────────────────────────────── */}
          <C>
            <CHead label={t(lang, "orderInfoCard")} colored />
            <div className="divide-y divide-border/40">
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-start px-4 py-2.5 gap-3"
                >
                  <span className="text-xs text-text-secondary font-medium shrink-0">
                    {row.label}
                  </span>
                  <span className="text-xs font-bold text-text-primary text-right whitespace-pre-line">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </C>

          {/* ── RIGHT: Price breakdown ───────────────────────────────── */}
          <div className="mt-4 lg:mt-0 flex flex-col gap-4">
            <C className="border-primary/20 shadow-lg">
              <CHead label={t(lang, "priceCalcCard")} colored />

              {/* Animal base price */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-alt/20">
                <div>
                  <p className="text-xs font-bold text-text-primary">
                    {animal?.nameAz || t(lang, "animalRow2")}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {mode === "serikli"
                      ? `${qty}/${animal?.totalShares || "?"} ${t(lang, "shares")}`
                      : `${qty} ${t(lang, "pcsLabel")} × ${Math.round(animalBasePrice / qty)} AZN`}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-text-primary bg-surface-alt px-2 py-1 rounded-lg border border-border/40">
                  {animalBasePrice} AZN
                </span>
              </div>

              {/* Cut / head / feet sections */}
              {(activeCutRows.length > 0 ||
                activeHeadRows.length > 0 ||
                activeFeetRows.length > 0) && (
                <>
                  {/* Cut Styles */}
                  {activeCutRows.length > 0 && (
                    <div className="border-b border-border/50">
                      <SectionHead label={t(lang, "cutMethodSection")} />
                      <div className="flex flex-col">
                        {activeCutRows.map((cs, i) => (
                          <PriceItem
                            key={cs.key}
                            label={cs.labelAz}
                            sub={`${cutStyles[cs.key]} ${t(lang, "animalUnit")}`}
                            value={`+${cs.fee * cutStyles[cs.key]} AZN`}
                            isFree={cs.fee === 0}
                            freeLabel={freeLabel}
                            sep={i < activeCutRows.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Head + Feet Processing — merged by option key */}
                  {(activeHeadRows.length > 0 || activeFeetRows.length > 0) && (() => {
                    const allKeys = [...new Set([
                      ...activeHeadRows.map(o => o.key),
                      ...activeFeetRows.map(o => o.key),
                    ])];
                    const rows = allKeys.map(key => {
                      const headOpt = activeHeadRows.find(o => o.key === key);
                      const feetOpt = activeFeetRows.find(o => o.key === key);
                      const opt = headOpt || feetOpt;
                      const hCount = headBuckets[key] || 0;
                      const fCount = feetBuckets[key] || 0;
                      const parts = [];
                      if (hCount > 0) parts.push(`${hCount} ${t(lang, "headsLabel")}`);
                      if (fCount > 0) parts.push(`${fCount} ${t(lang, "feetLabel")}`);
                      const totalFee = opt.fee * (hCount + fCount);
                      return { key, opt, sub: parts.join(" və "), totalFee };
                    });
                    return (
                      <div className="border-b border-border/50">
                        <SectionHead label="Baş və Ayaqlar" />
                        {rows.map((r, i) => (
                          <PriceItem
                            key={r.key}
                            label={r.opt.labelAz}
                            sub={r.sub}
                            value={`+${r.totalFee} AZN`}
                            isFree={r.opt.fee === 0}
                            freeLabel={freeLabel}
                            sep={i < rows.length - 1}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Delivery / Distribution fee */}
              {finalDeliveryFee > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      {isCharityDist
                        ? getDistLabel(selectedDistKey)
                        : t(lang, "deliveryRow")}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      {isCharityDist ? "Çatdırılma haqqı" : t(lang, "deliveryRow")}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-text-primary bg-surface-alt px-2 py-0.5 rounded-md border border-border/40 shrink-0">
                    +{finalDeliveryFee} AZN
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center px-4 py-4 bg-primary-surface/20">
                <div className="flex flex-col">
                  <span className="font-black text-text-primary text-xs uppercase tracking-wider">
                    {t(lang, "totalAmountHeader")}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium mt-0.5">
                    {t(lang, "allServicesIncl")}
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
            {loading ? (
              <Spinner label={t(lang, "orderCreating")} />
            ) : (
              t(lang, "confirmOrder")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
