"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Truck, Store, MapPin, Home, HeartHandshake, Heart,
  ChevronRight, AlertCircle, CheckCircle2, Info, Phone, Plus, X,
} from "lucide-react";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";

const AZ_OPERATORS = ["10","20","40","41","44","50","51","55","60","70","77","99"];
const DIST_STATE_KEY = "qurbanet_dist_state";

const formatPhone = (input) => {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.startsWith("0")) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8,10)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7,9)}`;
};

const isValidAzPhone = (formatted) => {
  const d = formatted.replace(/\D/g, "");
  if (d.length === 9) return AZ_OPERATORS.includes(d.slice(0,2));
  if (d.length === 10) return AZ_OPERATORS.includes(d.slice(1,3));
  return false;
};

const MapLocationPicker = dynamic(
  () => import("../../../components/MapLocationPicker"),
  { ssr: false },
);

const DELIVERY_KEYS = ["catdirilsin", "ozum"];
const CHARITY_KEYS  = ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];

const OPTION_META = {
  catdirilsin:       { Icon: Truck,          color: "#16a34a", light: "#f0fdf4", staticLabel: "Sizə çatdırılsın" },
  ozum:              { Icon: Store,          color: "#374151", light: "#f9fafb", staticLabel: "Özüm götürəcəm"   },
  usaqlar_evi:       { Icon: Home,           color: "#1B5E20", light: "#E8F5E9", staticLabel: null },
  qocalar_evi:       { Icon: Heart,          color: "#6A1B9A", light: "#F3E5F5", staticLabel: null },
  ehtiyac_sahibleri: { Icon: HeartHandshake, color: "#1565C0", light: "#E3F2FD", staticLabel: null },
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-border shadow-card overflow-hidden ${className}`}>
    {children}
  </div>
);

function DistRow({ optKey, meta, label, fee, min, count, canInc, onDec, onInc, dimmed, last, disabled }) {
  const { Icon, color, light } = meta;
  return (
    <div className={`flex items-center gap-3 px-3 py-3 transition-opacity ${disabled ? "opacity-80" : dimmed ? "opacity-40" : ""} ${!last ? "border-b border-border" : ""}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: disabled ? "#F3F4F6" : light }}>
        <Icon className="w-4 h-4" style={{ color: disabled ? "#9CA3AF" : color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-text-primary">{label}</div>
        <div className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: disabled ? "#9CA3AF" : color }}>
          {fee > 0 ? `+${fee} AZN` : "Pulsuz"}
          {!disabled && min > 0 && (
            <span className="text-amber-600 font-bold">• ən azı {min}</span>
          )}
        </div>
      </div>
      {disabled ? (
        <span className="bg-red-100 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">Deaktiv</span>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onDec} disabled={count <= 0}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold transition-all ${count <= 0 ? "bg-border text-text-secondary cursor-default opacity-70" : "bg-primary text-white cursor-pointer hover:opacity-90"}`}>
            −
          </button>
          <span className="w-6 text-center font-extrabold text-primary text-sm">{count}</span>
          <button onClick={onInc} disabled={!canInc}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold transition-all ${!canInc ? "bg-border text-text-secondary cursor-default opacity-70" : "bg-primary text-white cursor-pointer hover:opacity-90"}`}>
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function DistributionPage() {
  const router = useRouter();
  const { order, updateOrder, isLoaded } = useOrder();
  const { user } = useAuth();

  // Single distribution pool
  const [dist, setDist]       = useState({ catdirilsin: 0, ozum: 0 });
  const [optionData, setOptionData] = useState({});  // { key: { labelAz, fee } }
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [meatPickupLocation, setMeatPickupLocation] = useState(null);
  const [phones, setPhones] = useState([""]);
  const [addressNote, setAddressNote] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const flowActive = sessionStorage.getItem("qurbanet_flow");
      if (!order || !flowActive) { router.replace("/"); return; }
      if (order.mode === "serikli") { router.replace("/order/contact"); return; }
    } catch { router.replace("/"); return; }

    try {
      const saved = sessionStorage.getItem(DIST_STATE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.dist && typeof s.dist === "object") setDist(s.dist);
        if (s.pickedLocation) { setPickedLocation(s.pickedLocation); setAddress(s.pickedLocation.address || ""); }
        if (Array.isArray(s.phones) && s.phones.length > 0) setPhones(s.phones);
        if (typeof s.addressNote === "string") setAddressNote(s.addressNote);
      }
    } catch (_) {}

    api.get("/app-config/settings")
      .then((res) => {
        const loc = res.data?.data?.meatPickupLocation;
        if (loc?.address) setMeatPickupLocation(loc);
      })
      .catch(() => {});

    api.get("/app-config/delivery-options")
      .then((res) => {
        const options  = res.data?.data?.deliveryOptions || [];
        const animalId = order?.animal?._id;

        const delivOpt = options.find((o) => o.key === "catdirilsin" || o.key === "delivery" || o.type === "home");
        const baseFee = delivOpt?.basePrice ?? delivOpt?.fee ?? 0;
        const animalDeliveryFee = Number(order?.animal?.deliveryFee);
        const fee = animalDeliveryFee > 0 ? animalDeliveryFee : baseFee;
        setDeliveryFee(fee);

        const data = {
          catdirilsin: { labelAz: "Sizə çatdırılsın", fee },
          ozum:        { labelAz: "Özüm götürəcəm",   fee: 0 },
        };

        const charityOpts = CHARITY_KEYS
          .map((key) => options.find((o) => o.key === key))
          .filter((o) => {
            if (!o) return false;
            const cats = o.applicableCategories || [];
            if (cats.length === 0) return false;
            return cats.some((c) => (c._id || c) === animalId);
          });

        charityOpts.forEach((o) => {
          const animalCatId = order?.animal?._id?.toString();
          const minEntry = (o.categoryMinimums || []).find(
            (m) => (m.categoryId?._id || m.categoryId)?.toString() === animalCatId,
          );
          data[o.key] = {
            labelAz: o.labelAz,
            fee: o.basePrice ?? 0,
            min: minEntry?.minShares ?? 0,
            disabled: !o.isActive,
          };
        });

        setOptionData(data);
        setDist((prev) => {
          const next = { ...prev };
          charityOpts.forEach((o) => { if (!(o.key in next) && o.isActive) next[o.key] = 0; });
          return next;
        });
      })
      .catch(() => {});
  }, [isLoaded, order, router]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DIST_STATE_KEY, JSON.stringify({ dist, pickedLocation, phones, addressNote }));
    } catch (_) {}
  }, [dist, pickedLocation, phones, addressNote]);

  if (!isLoaded || !order) return null;

  const qty             = order.qty || 1;
  const maxPortionSplit = order.animal?.hasPortionSplit
    ? (Number(order.animal?.maxPortionSplit) || 1)
    : 1;
  const total           = qty * maxPortionSplit;

  const assigned  = Object.values(dist).reduce((s, v) => s + (v || 0), 0);
  const remaining = total - assigned;

  const needsLocation = (dist.catdirilsin || 0) > 0;
  const deliveryKeys     = DELIVERY_KEYS.filter((k) => k in dist);
  const charityKeys      = CHARITY_KEYS.filter((k) => k in optionData);
  const activeCharityKeys = charityKeys.filter((k) => !optionData[k]?.disabled);
  const bothDelivBlocked = (dist.catdirilsin || 0) > 0 || (dist.ozum || 0) > 0;

  // Simple mode: no active charity options for this animal → just pick one delivery option
  const isSimpleMode = Object.keys(optionData).length > 0 && activeCharityKeys.length === 0;
  const simpleSelected = isSimpleMode
    ? ((dist.catdirilsin || 0) > 0 ? "catdirilsin" : (dist.ozum || 0) > 0 ? "ozum" : null)
    : null;

  const handleSimpleSelect = (key) => {
    setDist((prev) => {
      const reset = Object.fromEntries(Object.keys(prev).map((k) => [k, 0]));
      return { ...reset, [key]: total };
    });
  };

  const handleChange = (key, delta) => {
    if (optionData[key]?.disabled) return;
    const minVal = optionData[key]?.min ?? 0;
    const cur = dist[key] || 0;

    if (delta > 0) {
      if (key === "catdirilsin" && (dist.ozum || 0) > 0) return;
      if (key === "ozum"        && (dist.catdirilsin || 0) > 0) return;
      if (cur === 0 && minVal > 0) {
        if (remaining >= minVal) setDist((prev) => ({ ...prev, [key]: minVal }));
        return;
      }
      if (remaining <= 0) return;
      setDist((prev) => ({ ...prev, [key]: cur + 1 }));
    } else {
      if (cur <= 0) return;
      if (cur === minVal && minVal > 0) {
        setDist((prev) => ({ ...prev, [key]: 0 }));
      } else {
        setDist((prev) => ({ ...prev, [key]: Math.max(0, cur - 1) }));
      }
    }
  };

  const handleMapConfirm = useCallback((loc) => {
    setPickedLocation(loc);
    setAddress(loc.address);
    setShowMap(false);
  }, []);

  const assignedOk  = remaining === 0;
  const phonesValid = needsLocation
    ? phones.some((p) => isValidAzPhone(p)) &&
      phones.every((p) => !p.trim() || isValidAzPhone(p))
    : true;
  const addrOk = !needsLocation || (!!pickedLocation && phonesValid);

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!assignedOk || !addrOk) return;

    const distFees = {};
    Object.keys(optionData).forEach((k) => {
      distFees[k] = optionData[k]?.fee ?? 0;
    });

    const distPatch = {
      dist,
      distFees,
      deliveryType: needsLocation ? "delivery" : "pickup",
      address: needsLocation ? address : "",
      pickedLocation: needsLocation ? pickedLocation : null,
      deliveryFee: needsLocation ? deliveryFee : 0,
      deliveryPhones: needsLocation
        ? phones.filter((p) => p.trim()).map((p) => {
            const d = p.replace(/\D/g, "");
            return "+994" + (d.startsWith("0") ? d.slice(1) : d);
          })
        : undefined,
      addressNote: needsLocation ? addressNote.trim() || undefined : undefined,
    };

    // Registered user: skip contact page, auto-fill from profile
    if (user?.name) {
      const contactInfo = {
        firstName: user.name,
        lastName: user.lastName || "",
        phone: user.phone || "",
        email: user.email || "",
      };
      updateOrder({ ...distPatch, contactInfo });
      router.push("/order/summary");
      return;
    }

    // Guest: check if saved contact info exists
    try {
      const raw = localStorage.getItem('contact_info');
      if (raw) {
        const ci = JSON.parse(raw);
        if (ci?.firstName && (ci?.phone || ci?.email)) {
          updateOrder({ ...distPatch, contactInfo: ci });
          router.push('/order/summary');
          return;
        }
      }
    } catch (_) {}

    updateOrder(distPatch);
    router.push("/order/contact");
  };

  const totalAmount = parseFloat(order.totalPrice || 0) + (needsLocation ? deliveryFee : 0);

  return (
    <>
      {showMap && (
        <MapLocationPicker
          initialLocation={pickedLocation}
          onClose={() => setShowMap(false)}
          onConfirm={handleMapConfirm}
        />
      )}
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      <BackHeader title="Ət paylanması" />
      <StepHeader currentStep={2} />

      <div className="flex-1 overflow-y-auto pb-24 lg:pb-6 pt-[124px] lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3
                        lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]
                        lg:gap-5 lg:items-start">

          {/* ════ LEFT ════ */}
          <div className="flex flex-col gap-3">

            {/* Single distribution card */}
            <Card className={submitAttempted && !assignedOk ? "ring-2 ring-red-400 border-transparent" : ""}>
              {/* Header */}
              <div className="px-3 py-2 border-b border-border bg-surface-alt/40 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase">
                  {isSimpleMode ? "Çatdırılma üsulu" : "Ət paylanması"}
                </span>
                {!isSimpleMode && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    assignedOk ? "bg-primary text-white" : "bg-surface-alt text-text-muted border border-border"
                  }`}>{assigned}/{total}</span>
                )}
              </div>

              {submitAttempted && !assignedOk && (
                <div className="mx-3 mt-2 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {isSimpleMode ? "Çatdırılma üsulunu seçin" : `${remaining} pay bölüşdürülməyib`}
                </div>
              )}

              {/* Simple mode: just pick one delivery option (radio), then show disabled charity rows */}
              {isSimpleMode ? (
                <>
                  <div className="p-3 flex flex-col gap-2">
                    {deliveryKeys.map((key) => {
                      const meta = OPTION_META[key];
                      const data = optionData[key] || {};
                      const isSelected = simpleSelected === key;
                      return (
                        <button key={key} type="button" onClick={() => handleSimpleSelect(key)}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 w-full text-left cursor-pointer transition-all ${
                            isSelected ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/30"
                          }`}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                               style={{ background: meta.light }}>
                            <meta.Icon className="w-5 h-5" style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-text-primary">{data.labelAz || meta.staticLabel}</div>
                            <div className="text-xs font-semibold mt-0.5" style={{ color: meta.color }}>
                              {(data.fee || 0) > 0 ? `+${data.fee} AZN` : "Pulsuz"}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-primary bg-primary" : "border-border"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Disabled charity rows still visible in simple mode */}
                  {charityKeys.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mx-3 my-1">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Xeyriyyə olaraq</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      {charityKeys.map((key, idx) => {
                        const meta = OPTION_META[key];
                        const data = optionData[key] || {};
                        return (
                          <DistRow
                            key={key}
                            optKey={key}
                            meta={meta}
                            label={data.labelAz || key}
                            fee={data.fee ?? 0}
                            min={0}
                            count={0}
                            canInc={false}
                            onDec={() => {}}
                            onInc={() => {}}
                            dimmed={false}
                            disabled={true}
                            last={idx === charityKeys.length - 1}
                          />
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Counter mode: delivery rows with +/- */}
                  {deliveryKeys.map((key, idx) => {
                    const meta    = OPTION_META[key];
                    const data    = optionData[key] || {};
                    const count   = dist[key] || 0;
                    const other   = key === "catdirilsin" ? "ozum" : "catdirilsin";
                    const blocked = (dist[other] || 0) > 0;
                    const isLast  = idx === deliveryKeys.length - 1 && charityKeys.length === 0;
                    return (
                      <DistRow
                        key={key}
                        optKey={key}
                        meta={meta}
                        label={data.labelAz || meta.staticLabel}
                        fee={data.fee ?? 0}
                        min={0}
                        count={count}
                        canInc={remaining > 0 && !blocked}
                        onDec={() => handleChange(key, -1)}
                        onInc={() => handleChange(key, 1)}
                        dimmed={blocked && count === 0}
                        last={isLast}
                      />
                    );
                  })}

                  {/* Divider */}
                  {charityKeys.length > 0 && (
                    <div className="flex items-center gap-2 mx-3 my-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Xeyriyyə olaraq</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {/* Charity rows (active + disabled) */}
                  {charityKeys.map((key, idx) => {
                    const meta     = OPTION_META[key];
                    const data     = optionData[key] || {};
                    const isDisabled = !!data.disabled;
                    const count    = dist[key] || 0;
                    const minVal   = data.min ?? 0;
                    const canInc   = count === 0 && minVal > 0 ? remaining >= minVal : remaining > 0;
                    return (
                      <DistRow
                        key={key}
                        optKey={key}
                        meta={meta}
                        label={data.labelAz || key}
                        fee={data.fee ?? 0}
                        min={minVal}
                        count={count}
                        canInc={canInc}
                        onDec={() => handleChange(key, -1)}
                        onInc={() => handleChange(key, 1)}
                        dimmed={false}
                        disabled={isDisabled}
                        last={idx === charityKeys.length - 1}
                      />
                    );
                  })}

                  {/* Remaining hint */}
                  {remaining > 0 && (
                    <div className="mx-3 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <p className="text-[11px] text-amber-700 font-medium">{remaining} pay hələ bölüşdürülməyib</p>
                    </div>
                  )}

                  {/* Mutual exclusion note */}
                  {bothDelivBlocked && (
                    <div className="mx-3 mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                      <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <p className="text-[11px] text-blue-700 font-medium">Çatdırılma və özüm götürəcəm eyni anda seçilə bilməz</p>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Özüm götürəcəm — pickup location (mobile only, desktop lives in right column) */}
            {(dist.ozum || 0) > 0 && meatPickupLocation && (
              <Card className="lg:hidden">
                <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                  <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase">Götürmə məkanı</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <Store className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-700 mb-0.5">Əti götürəcəyiniz yer</p>
                      <p className="text-xs text-emerald-600 leading-snug">{meatPickupLocation.address}</p>
                    </div>
                  </div>
                  {meatPickupLocation.lat && meatPickupLocation.lng && (
                    <a href={`https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full border border-primary/30 text-primary font-bold text-xs rounded-xl py-2 bg-primary-surface hover:bg-primary-surface/80 transition-all">
                      <MapPin className="w-3.5 h-3.5" /> Google Maps-də aç
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Address picker — mobile only (desktop version lives in right column) */}
            {needsLocation && (
              <Card className={`lg:hidden ${submitAttempted && !addrOk ? "ring-2 ring-red-400 border-transparent" : ""}`}>
                <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                  <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase">Çatdırılma ünvanı</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <button type="button" onClick={() => setShowMap(true)}
                    className="flex items-center justify-center gap-2 w-full bg-primary-surface border border-primary/30 text-primary font-bold text-xs rounded-xl py-2.5 cursor-pointer hover:bg-primary-surface/80 transition-all">
                    <MapPin className="w-3.5 h-3.5" /> Xəritədə konum seç
                  </button>

                  {pickedLocation ? (
                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-emerald-700 mb-0.5">Konum seçildi</p>
                        <p className="text-[11px] text-emerald-600 leading-snug">{pickedLocation.address}</p>
                      </div>
                    </div>
                  ) : submitAttempted && !pickedLocation ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 text-[11px] font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Xəritədən konum seçin.
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-muted italic text-center">Hələ konum seçilməyib</p>
                  )}

                  {/* ── Phone numbers ── */}
                  <div className="border-t border-border pt-2 mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                          Əlaqə nömrəsi <span className="text-red-500">*</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={phones.length >= 4}
                        onClick={() => setPhones((p) => [...p, ""])}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          phones.length >= 4
                            ? "bg-border text-text-muted cursor-default"
                            : "bg-primary-surface border border-primary/30 text-primary cursor-pointer hover:bg-primary-surface/80"
                        }`}
                      >
                        <Plus className="w-3 h-3" /> Nömrə əlavə et
                      </button>
                    </div>

                    {phones.map((phone, idx) => {
                      const isEmpty   = submitAttempted && idx === 0 && !phone.trim();
                      const isInvalid = submitAttempted && phone.trim() && !isValidAzPhone(phone);
                      const hasError  = isEmpty || isInvalid;
                      return (
                        <div key={idx} className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 flex items-center bg-surface-alt border rounded-xl overflow-hidden transition-colors focus-within:bg-white ${
                              hasError ? "border-red-400" : "border-border focus-within:border-primary"
                            }`}>
                              <div className="flex items-center gap-1.5 px-2.5 py-2.5 border-r border-border bg-surface-alt shrink-0">
                                <span className="text-base leading-none">🇦🇿</span>
                                <span className="text-xs font-bold text-text-secondary">+994</span>
                              </div>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) =>
                                  setPhones((prev) =>
                                    prev.map((p, i) => (i === idx ? formatPhone(e.target.value) : p))
                                  )
                                }
                                placeholder="50 XXX XX XX"
                                inputMode="numeric"
                                maxLength={12}
                                className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted px-2.5 py-2.5 font-medium border-none"
                              />
                            </div>
                            {phones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setPhones((p) => p.filter((_, i) => i !== idx))}
                                className="p-1.5 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {isEmpty && (
                            <p className="text-[10px] text-red-500 font-semibold px-1">Nömrə daxil edin</p>
                          )}
                          {isInvalid && (
                            <p className="text-[10px] text-red-500 font-semibold px-1">Düzgün AZ nömrəsi: 50 XXX XX XX</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Address note ── */}
                  <textarea
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    placeholder="Əlavə qeyd (mənzil, giriş, mərtəbə...)"
                    rows={2}
                    className="w-full bg-surface-alt border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white transition-colors resize-none"
                  />

                </div>
              </Card>
            )}
          </div>

          {/* ════ RIGHT — desktop summary ════ */}
          <div className="hidden lg:flex flex-col gap-3">

            {/* Pickup location — desktop only */}
            {(dist.ozum || 0) > 0 && meatPickupLocation && (
              <Card>
                <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                  <span className="text-[10px] font-bold text-text-secondary tracking-wide uppercase">Götürmə məkanı</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <Store className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-700 mb-0.5">Əti götürəcəyiniz yer</p>
                      <p className="text-xs text-emerald-600 leading-snug">{meatPickupLocation.address}</p>
                    </div>
                  </div>
                  {meatPickupLocation.lat && meatPickupLocation.lng && (
                    <a href={`https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full border border-primary/30 text-primary font-bold text-xs rounded-xl py-2 bg-primary-surface hover:bg-primary-surface/80 transition-all">
                      <MapPin className="w-3.5 h-3.5" /> Google Maps-də aç
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Address picker — desktop only */}
            {needsLocation && (
              <Card className={submitAttempted && !addrOk ? "ring-2 ring-red-400 border-transparent" : ""}>
                <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                  <span className="text-[10px] font-bold text-text-secondary tracking-wide uppercase">Çatdırılma ünvanı</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <button type="button" onClick={() => setShowMap(true)}
                    className="flex items-center justify-center gap-2 w-full bg-primary-surface border border-primary/30 text-primary font-bold text-xs rounded-xl py-2.5 cursor-pointer hover:bg-primary-surface/80 transition-all">
                    <MapPin className="w-3.5 h-3.5" /> Xəritədə konum seç
                  </button>

                  {pickedLocation ? (
                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-emerald-700 mb-0.5">Konum seçildi</p>
                        <p className="text-[11px] text-emerald-600 leading-snug">{pickedLocation.address}</p>
                      </div>
                    </div>
                  ) : submitAttempted && !pickedLocation ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 text-[11px] font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Xəritədən konum seçin.
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-muted italic text-center">Hələ konum seçilməyib</p>
                  )}

                  {/* Phone numbers */}
                  <div className="border-t border-border pt-2 mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                          Əlaqə nömrəsi <span className="text-red-500">*</span>
                        </span>
                      </div>
                      <button type="button" disabled={phones.length >= 4}
                        onClick={() => setPhones((p) => [...p, ""])}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          phones.length >= 4
                            ? "bg-border text-text-muted cursor-default"
                            : "bg-primary-surface border border-primary/30 text-primary cursor-pointer hover:bg-primary-surface/80"
                        }`}>
                        <Plus className="w-3 h-3" /> Nömrə əlavə et
                      </button>
                    </div>
                    {phones.map((phone, idx) => {
                      const isEmpty   = submitAttempted && idx === 0 && !phone.trim();
                      const isInvalid = submitAttempted && phone.trim() && !isValidAzPhone(phone);
                      const hasError  = isEmpty || isInvalid;
                      return (
                        <div key={idx} className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 flex items-center bg-surface-alt border rounded-xl overflow-hidden transition-colors focus-within:bg-white ${
                              hasError ? "border-red-400" : "border-border focus-within:border-primary"
                            }`}>
                              <div className="flex items-center gap-1.5 px-2.5 py-2.5 border-r border-border bg-surface-alt shrink-0">
                                <span className="text-base leading-none">🇦🇿</span>
                                <span className="text-xs font-bold text-text-secondary">+994</span>
                              </div>
                              <input type="tel" value={phone}
                                onChange={(e) => setPhones((prev) => prev.map((p, i) => (i === idx ? formatPhone(e.target.value) : p)))}
                                placeholder="50 XXX XX XX" inputMode="numeric" maxLength={12}
                                className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted px-2.5 py-2.5 font-medium border-none" />
                            </div>
                            {phones.length > 1 && (
                              <button type="button" onClick={() => setPhones((p) => p.filter((_, i) => i !== idx))}
                                className="p-1.5 text-text-muted hover:text-red-500 transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {isEmpty   && <p className="text-[10px] text-red-500 font-semibold px-1">Nömrə daxil edin</p>}
                          {isInvalid && <p className="text-[10px] text-red-500 font-semibold px-1">Düzgün AZ nömrəsi: 50 XXX XX XX</p>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Address note */}
                  <textarea value={addressNote} onChange={(e) => setAddressNote(e.target.value)}
                    placeholder="Əlavə qeyd (mənzil, giriş, mərtəbə...)" rows={2}
                    className="w-full bg-surface-alt border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white transition-colors resize-none" />
                </div>
              </Card>
            )}

            <Card>
              <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                <span className="text-[10px] font-bold text-text-secondary tracking-wide uppercase">Sifariş xülasəsi</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Seçilən heyvan", value: order.animal?.nameAz },
                  { label: "Sifariş miqdarı", value: `${qty} ədəd` },
                  ...(needsLocation && deliveryFee > 0 ? [{ label: "Çatdırılma haqqı", value: `${deliveryFee} AZN` }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-[11px] text-text-secondary font-medium">{row.label}</span>
                    <span className="text-[11px] font-bold text-text-primary">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border bg-surface-alt/30">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Yekun Məbləğ:</span>
                  <span className="text-xl font-extrabold text-primary">{totalAmount.toFixed(0)} AZN</span>
                </div>
                <button type="button" onClick={handleContinue}
                  disabled={!assignedOk || !addrOk}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Davam et <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* MOBILE action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-4 py-2.5 z-[999]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wide">Ümumi Məbləğ</span>
            <span className="text-xl font-black text-primary leading-tight">{totalAmount.toFixed(0)} AZN</span>
          </div>
          <button type="button" onClick={handleContinue}
            disabled={!assignedOk || !addrOk}
            className="flex-1 flex items-center justify-center gap-1 bg-primary text-white rounded-xl py-2.5 px-4 text-xs font-extrabold disabled:opacity-50 disabled:cursor-not-allowed">
            Davam et <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
