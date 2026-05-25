"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, AlertTriangle, Beef } from "lucide-react";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";

const TIME_SLOTS = ["12:00-15:00", "15:00-18:00", "18:00-21:00"];
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

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-border shadow-card overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const CardHead = ({ label, Icon }) => (
  <div className="px-4 py-3 border-b border-border text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase flex items-center gap-2">
    {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
    {label}
  </div>
);

const QtyBtn = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-lg sm:text-xl font-bold transition-all
    ${
      disabled
        ? "bg-border text-text-secondary cursor-default opacity-85"
        : "bg-primary text-white cursor-pointer hover:opacity-90"
    }`}
  >
    {children}
  </button>
);

function getMeatWeight(label) {
  const nums = (label || "").match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length < 1) return null;
  const vals = nums.map((n) => parseFloat(n.replace(",", ".")));
  const lo = Math.floor(Math.min(...vals) * 0.5);
  const hi = Math.ceil(Math.max(...vals) * 0.5);
  return lo === hi ? `~${lo} kq ət` : `~${lo}–${hi} kq ət`;
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function QuantityPage() {
  const router = useRouter();
  const { updateOrder } = useOrder();

  const [animal, setAnimal] = useState(null);
  const [deliveryWindows, setDeliveryWindows] = useState(TIME_SLOTS);
  const [mode, setMode] = useState("tam");
  const [qty, setQty] = useState(1);
  const [selectedDate, setSelectedDate] = useState(getTomorrow);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => getTomorrow().getFullYear());
  const [calMonth, setCalMonth] = useState(() => getTomorrow().getMonth());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [cutStyles, setCutStyles] = useState({});
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [headBuckets, setHeadBuckets] = useState({});
  const [feetBuckets, setFeetBuckets] = useState({});
  const [singleAnimalMode, setSingleAnimalMode] = useState(false);

  useEffect(() => {
    const a = sessionStorage.getItem("selected_animal");
    const dw = sessionStorage.getItem("delivery_windows");
    if (!a) {
      router.replace("/");
      return;
    }
    const parsed = JSON.parse(a);
    setAnimal(parsed);
    const sam = sessionStorage.getItem("single_animal_mode");
    setSingleAnimalMode(sam === "true");
    if (parsed.orderMode === "serikli" && parsed.serikliEnabled)
      setMode("serikli");
    if (dw) {
      const w = JSON.parse(dw);
      if (w.length) {
        setDeliveryWindows(w);
        setTimeSlot(w[0]);
      } else {
        setTimeSlot(TIME_SLOTS[0]);
      }
    } else {
      setTimeSlot(TIME_SLOTS[0]);
    }
    const init = {};
    (parsed.cutStyleOptions || []).forEach((c) => {
      init[c.key] = 0;
    });
    setCutStyles(init);
    const initHead = {};
    (parsed.headOptions || [])
      .filter((o) => o.isActive !== false)
      .forEach((o) => {
        initHead[o.key] = 0;
      });
    setHeadBuckets(initHead);
    const initFeet = {};
    (parsed.feetOptions || [])
      .filter((o) => o.isActive !== false)
      .forEach((o) => {
        initFeet[o.key] = 0;
      });
    setFeetBuckets(initFeet);

    // KORREKSİYA: ReferenceError xətasını həll etmək üçün ws massivini təyin edirik
    const ws = parsed.weights || parsed.weightOptions || [];
    if (ws.length > 0) {
      setSelectedWeight(ws[0]);
    }
  }, [router]);

  useEffect(() => {
    if (!animal) return;
    const initHead = {};
    (animal.headOptions || [])
      .filter((o) => o.isActive !== false)
      .forEach((o) => {
        initHead[o.key] = 0;
      });
    setHeadBuckets(initHead);
    const initFeet = {};
    (animal.feetOptions || [])
      .filter((o) => o.isActive !== false)
      .forEach((o) => {
        initFeet[o.key] = 0;
      });
    setFeetBuckets(initFeet);
  }, [qty, animal]);

  if (!animal) return null;

  const maxShares = Number(animal.totalShares) || 1;
  const effectiveCutStyles = animal.cutStyleOptions || [];
  const pricePerUnit = animal.pricePerShare || 0;
  const weights = animal.weights || animal.weightOptions || [];
  const effectivePrice = selectedWeight ? selectedWeight.price : pricePerUnit;

  const animalSharePrice =
    mode === "serikli"
      ? (effectivePrice / maxShares) * qty
      : effectivePrice * qty;

  const activeHeadOptions = (animal.headOptions || []).filter(
    (o) => o.isActive !== false,
  );
  const activeFeetOptions = (animal.feetOptions || []).filter(
    (o) => o.isActive !== false,
  );
  const headFee =
    animal.hasHeadOption !== false
      ? activeHeadOptions.reduce(
          (sum, o) => sum + (headBuckets[o.key] || 0) * (o.fee || 0),
          0,
        )
      : 0;
  const feetFee =
    animal.hasFeetOption !== false
      ? activeFeetOptions.reduce(
          (sum, o) => sum + (feetBuckets[o.key] || 0) * (o.fee || 0),
          0,
        )
      : 0;
  const partsFee = headFee + feetFee;

  const cutStyleFee = effectiveCutStyles.reduce(
    (sum, cs) => sum + (cutStyles[cs.key] || 0) * (cs.fee || 0),
    0,
  );

  const basePrice = animalSharePrice.toFixed(0);
  const totalPrice = (animalSharePrice + partsFee + cutStyleFee).toFixed(0);
  const totalCutCount = Object.values(cutStyles).reduce(
    (s, v) => s + (v || 0),
    0,
  );

  const needsHead =
    animal.hasHeadOption !== false &&
    (animal.headOptions || []).filter((o) => o.isActive !== false).length > 0;
  const needsFeet =
    animal.hasFeetOption !== false &&
    (animal.feetOptions || []).filter((o) => o.isActive !== false).length > 0;

  const headTotal = needsHead ? qty : 0;
  const feetTotal = needsFeet ? qty * 4 : 0;
  const headAssigned = Object.values(headBuckets).reduce((s, v) => s + v, 0);
  const feetAssigned = Object.values(feetBuckets).reduce((s, v) => s + v, 0);
  const headUnassigned = headTotal - headAssigned;
  const feetUnassigned = feetTotal - feetAssigned;

  const cutStyleError =
    submitAttempted &&
    effectiveCutStyles.length > 0 &&
    totalCutCount === 0;
  const partsError = submitAttempted && headUnassigned + feetUnassigned > 0;

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!selectedDate) {
      alert("Kəsim tarixini seçin.");
      return;
    }
    if (!timeSlot) {
      alert("Çatdırılma vaxtını seçin.");
      return;
    }
    if (effectiveCutStyles.length > 0 && totalCutCount === 0) {
      return;
    }
    if (needsHead && headUnassigned > 0) {
      alert("Baş bölgüsünü tamamlayın.");
      return;
    }
    if (needsFeet && feetUnassigned > 0) {
      alert("Ayaqlar bölgüsünü tamamlayın.");
      return;
    }

    const orderPatch = {
      animal,
      mode,
      qty,
      selectedDate,
      timeSlot,
      notes,
      cutStyles,
      selectedWeight,
      headBuckets,
      feetBuckets,
      pricePerUnit: effectivePrice,
      totalPrice: parseFloat(totalPrice),
    };
    if (mode === "serikli") {
      updateOrder({
        ...orderPatch,
        deliveryType: "ozum",
        address: "",
        charityDist: null,
        deliveryFee: 0,
      });
      router.push("/order/contact");
    } else {
      updateOrder(orderPatch);
      router.push("/order/distribution");
    }
  };

  const today = new Date();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const dateStr = selectedDate
    ? (() => {
        const d = new Date(selectedDate);
        return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : null;

  const CalendarBlock = () => (
    <div className="p-3">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all ${
          dateStr
            ? "border-primary bg-primary-surface text-primary"
            : "border-border bg-surface-alt text-text-muted"
        }`}
      >
        {dateStr || "Tarix seçin..."}
      </button>
      {showCalendar && (
        <div className="mt-2.5 border border-border rounded-xl p-3 bg-surface">
          <div className="flex items-center justify-between mb-2.5">
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((y) => y - 1);
                } else setCalMonth((m) => m - 1);
              }}
              className="w-8 h-8 flex items-center justify-center bg-surface-alt rounded-lg text-base font-bold text-text-secondary border-none cursor-pointer"
            >
              ‹
            </button>
            <span className="text-xs sm:text-[13px] font-bold text-text-primary">
              {AZ_MONTHS[calMonth]} {calYear}
            </span>
            <button
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear((y) => y + 1);
                } else setCalMonth((m) => m + 1);
              }}
              className="w-8 h-8 flex items-center justify-center bg-surface-alt rounded-lg text-base font-bold text-text-secondary border-none cursor-pointer"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1.5">
            {["BE", "ÇA", "Ç", "CA", "C", "Ş", "B"].map((d, i) => (
              <div
                key={i}
                className="text-center text-[9px] font-bold text-text-muted py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calDays.map((d, i) => {
              const disabled = !d || new Date(calYear, calMonth, d) < today;
              const sel =
                d &&
                selectedDate &&
                new Date(calYear, calMonth, d).toDateString() ===
                  new Date(selectedDate).toDateString();
              return (
                <button
                  key={i}
                  disabled={!d || disabled}
                  onClick={() => {
                    if (d && !disabled) {
                      setSelectedDate(new Date(calYear, calMonth, d));
                      setShowCalendar(false);
                    }
                  }}
                  className={`h-7 sm:h-8 rounded-lg border-none text-[11px] sm:text-xs font-medium transition-colors
                    ${
                      sel
                        ? "bg-primary text-white font-extrabold"
                        : disabled
                          ? "text-border bg-transparent cursor-default"
                          : "text-text-primary bg-transparent cursor-pointer hover:bg-surface-alt"
                    }`}
                >
                  {d || ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const TimeSlotBlock = ({ cols = "grid-cols-3" }) => (
    <div className={`p-3 grid ${cols} gap-2`}>
      {deliveryWindows.map((slot) => (
        <button
          key={slot}
          onClick={() => setTimeSlot(slot)}
          className={`px-2 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold text-center border-2 cursor-pointer transition-all ${
            timeSlot === slot
              ? "border-primary bg-primary-surface text-primary"
              : "border-border bg-surface-alt text-text-secondary"
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );

  const PriceSummary = () => (
    <div className="bg-primary rounded-2xl p-4 sm:p-5 text-white shadow-[0_4px_20px_rgba(27,94,32,0.35)]">
      <div className="text-[11px] sm:text-xs font-semibold opacity-75 mb-1">
        Ümumi məbləğ
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">
        {totalPrice} AZN
      </div>
      <div className="text-[11px] sm:text-xs opacity-70 mb-4 leading-relaxed">
        {mode === "serikli"
          ? `${animal.nameAz} · ${qty}/${maxShares} pay${partsFee > 0 ? ` + baş/ayaq ${partsFee.toFixed(0)} AZN` : ""}`
          : `${animal.nameAz} × ${qty} ədəd${selectedWeight ? ` · ${selectedWeight.labelAz || selectedWeight.label}` : ""}`}
      </div>
      <button
        onClick={handleContinue}
        className="w-full bg-white text-primary border-none rounded-xl py-3 text-sm font-extrabold cursor-pointer hover:bg-opacity-90 transition-all active:scale-[0.98]"
      >
        Davam et →
      </button>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <BackHeader title="Miqdar seçin" />
      <StepHeader currentStep={1} />

      <div className="flex-1 overflow-y-auto pb-24 xl:pb-6 pt-[124px] xl:pt-0">
        <div
          className="max-w-full mx-auto px-0 sm:px-4 md:px-5 py-3 sm:py-4 xl:py-6
                     xl:grid xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_400px]
                     xl:gap-5 xl:items-start"
        >
          {/* ════ LEFT COLUMN ════ */}
          <div className="flex flex-col gap-2 sm:gap-3 min-w-0">
            {/* Animal card */}
            <Card>
              <div className="flex items-center min-w-0 p-3 gap-3">
                <div className="w-36 h-24 sm:w-44 sm:h-28 md:w-52 md:h-32 flex-shrink-0 bg-surface-alt overflow-hidden rounded-xl">
                  {animal.imageUrl ? (
                    <img
                      src={animal.imageUrl}
                      alt={animal.nameAz}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      <Beef className="w-10 h-10 opacity-30" />
                    </div>
                  )}
                </div>

                {singleAnimalMode ? (
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 self-stretch py-1">
                    <div className="text-xl sm:text-2xl font-extrabold text-text-primary leading-tight">
                      {animal.nameAz}
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-primary leading-none">
                      {effectivePrice} AZN
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-3 self-stretch py-1">
                    <div>
                      <div className="text-base sm:text-lg font-extrabold text-text-primary leading-tight">
                        {animal.nameAz}
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-primary">
                          {effectivePrice} AZN
                        </span>
                        <span className="text-[10px] sm:text-xs text-text-secondary">
                          / ədəd
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                        Miqdar
                      </span>
                      <div className="flex items-center gap-2">
                        <QtyBtn
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          disabled={qty <= 1}
                        >
                          −
                        </QtyBtn>
                        <span className="w-7 text-center text-2xl font-extrabold text-primary leading-none">
                          {qty}
                        </span>
                        <QtyBtn
                          onClick={() =>
                            setQty((q) =>
                              mode === "serikli"
                                ? Math.min(maxShares, q + 1)
                                : q + 1,
                            )
                          }
                          disabled={mode === "serikli" && qty >= maxShares}
                        >
                          +
                        </QtyBtn>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!singleAnimalMode && (
                <div className="px-4 py-2.5 bg-surface-alt border-t border-border flex items-center justify-between gap-2">
                  <span className="text-xs text-text-secondary font-medium">
                    {mode === "serikli"
                      ? `${qty}/${maxShares} pay`
                      : `${qty} × ${effectivePrice} AZN`}
                  </span>
                  <span className="text-sm font-extrabold text-primary whitespace-nowrap">
                    Cəmi: {basePrice} AZN
                  </span>
                </div>
              )}
            </Card>

            {!animal.orderMode &&
              animal.totalShares > 1 &&
              animal.serikliEnabled && (
                <Card>
                  <CardHead label="Sifariş növü" />
                  <div className="p-3 flex gap-2">
                    {[
                      { k: "tam", l: "Tam heyvan" },
                      { k: "serikli", l: `Şərikli (/${maxShares})` },
                    ].map((m) => (
                      <button
                        key={m.k}
                        onClick={() => setMode(m.k)}
                        className={`flex-1 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold border-2 transition-all cursor-pointer ${
                          mode === m.k
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface-alt text-text-secondary"
                        }`}
                      >
                        {m.l}
                      </button>
                    ))}
                  </div>
                </Card>
              )}

            {weights.length > 0 && (
              <Card className="xl:hidden">
                <CardHead label="DİRİ ÇƏKİ KATEQORİYASI" />
                <div className="p-3 flex flex-wrap gap-2">
                  {weights.map((w) => {
                    const lbl = w.labelAz || w.label || w.key;
                    const isSel =
                      selectedWeight?.key === w.key ||
                      selectedWeight?.labelAz === w.labelAz;
                    return (
                      <button
                        key={w.key || lbl}
                        onClick={() => setSelectedWeight(w)}
                        className={`px-3 py-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-0.5 ${
                          isSel
                            ? "border-primary bg-primary-surface text-primary"
                            : "border-border bg-surface-alt text-text-primary"
                        }`}
                      >
                        <span className="text-[10px] sm:text-[11px] font-bold">
                          {lbl} — {w.price} AZN
                        </span>
                        {getMeatWeight(lbl) && (
                          <span
                            className={`text-[9px] font-semibold ${isSel ? "text-primary" : "text-text-muted"}`}
                          >
                            {getMeatWeight(lbl)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {effectiveCutStyles.length > 0 && (
              <Card className={cutStyleError ? "ring-2 ring-red-400" : ""}>
                <div className="px-3 sm:px-4 py-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide">
                    DOĞRAMA ÜSULU
                  </span>
                  {!singleAnimalMode && (
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                        totalCutCount >= qty && qty > 0
                          ? "bg-primary text-white"
                          : "bg-surface-alt text-text-muted"
                      }`}
                    >
                      {totalCutCount}/{qty}
                    </span>
                  )}
                </div>

                {cutStyleError && (
                  <div className="mx-3 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-[11px] sm:text-xs font-bold text-red-600">
                      <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 flex-shrink-0" />
                      Doğrama üsulu seçin. Xanı boş ola bilməz.
                    </p>
                  </div>
                )}

                {singleAnimalMode ? (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {effectiveCutStyles.map((cs) => {
                      const isSelected = (cutStyles[cs.key] || 0) > 0;
                      return (
                        <button
                          key={cs.key}
                          type="button"
                          onClick={() =>
                            setCutStyles(() => {
                              const allZero = Object.fromEntries(
                                effectiveCutStyles.map((c) => [c.key, 0]),
                              );
                              return { ...allZero, [cs.key]: 1 };
                            })
                          }
                          className={`flex items-center justify-between rounded-xl px-3 py-2.5 border-2 transition-all text-left w-full cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary-surface"
                              : "border-border bg-surface-alt"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] sm:text-xs font-semibold text-text-primary truncate">
                              {cs.labelAz}
                            </span>
                            {cs.fee > 0 && (
                              <span className="text-[10px] text-primary font-bold">
                                +{cs.fee} AZN
                              </span>
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-3 flex items-center justify-center transition-all ${
                              isSelected ? "border-primary" : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {effectiveCutStyles.map((cs) => (
                      <div
                        key={cs.key}
                        className="flex items-center justify-between bg-surface-alt rounded-xl px-3 py-2 gap-2"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[11px] sm:text-xs font-semibold text-text-primary truncate">
                            {cs.labelAz}
                          </span>
                          {cs.fee > 0 && (
                            <span className="text-[10px] text-primary font-bold">
                              +{cs.fee} AZN
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() =>
                              setCutStyles((p) => ({
                                ...p,
                                [cs.key]: Math.max(0, (p[cs.key] || 0) - 1),
                              }))
                            }
                            disabled={!cutStyles[cs.key]}
                            className={`w-7 h-7 rounded-lg text-sm font-bold border-none flex items-center justify-center transition-all ${
                              !cutStyles[cs.key]
                                ? "bg-border text-text-secondary cursor-default opacity-85"
                                : "bg-primary text-white cursor-pointer hover:opacity-90"
                            }`}
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-extrabold text-primary">
                            {cutStyles[cs.key] || 0}
                          </span>
                          <button
                            onClick={() =>
                              setCutStyles((p) => ({
                                ...p,
                                [cs.key]: (p[cs.key] || 0) + 1,
                              }))
                            }
                            disabled={totalCutCount >= qty}
                            className={`w-7 h-7 rounded-lg text-sm font-bold border-none flex items-center justify-center transition-all ${
                              totalCutCount >= qty
                                ? "bg-border text-text-secondary cursor-default opacity-85"
                                : "bg-primary text-white cursor-pointer hover:opacity-90"
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {(needsHead || needsFeet) && (
              <Card className={partsError ? "ring-2 ring-red-400" : ""}>
                <div className="px-3 sm:px-4 py-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase">
                    Qurbanın əlavə hissələri
                  </span>
                  {!singleAnimalMode && (
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                        headUnassigned + feetUnassigned === 0
                          ? "bg-primary text-white"
                          : "bg-surface-alt text-text-muted"
                      }`}
                    >
                      {headAssigned + feetAssigned}/{headTotal + feetTotal}
                    </span>
                  )}
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {needsHead && (
                    <PartBucketSection
                      label="Baş"
                      total={headTotal}
                      unitLabel="baş"
                      options={activeHeadOptions}
                      buckets={headBuckets}
                      unassigned={headUnassigned}
                      onChangeBucket={(key, delta) => {
                        setHeadBuckets((prev) => {
                          const current = prev[key] || 0;
                          const assigned = Object.values(prev).reduce(
                            (s, v) => s + v,
                            0,
                          );
                          const unassigned = headTotal - assigned;
                          if (delta > 0 && unassigned <= 0) return prev;
                          if (delta < 0 && current <= 0) return prev;
                          return { ...prev, [key]: current + delta };
                        });
                      }}
                      radioMode={singleAnimalMode}
                      onRadioSelect={(key) => {
                        setHeadBuckets((prev) => {
                          const allZero = Object.fromEntries(
                            Object.keys(prev).map((k) => [k, 0]),
                          );
                          return prev[key] > 0
                            ? allZero
                            : { ...allZero, [key]: 1 };
                        });
                      }}
                      required={needsHead}
                      submitAttempted={submitAttempted}
                    />
                  )}
                  {needsFeet && (
                    <PartBucketSection
                      label="Ayaqlar"
                      total={feetTotal}
                      unitLabel="ayaq"
                      options={activeFeetOptions}
                      buckets={feetBuckets}
                      unassigned={feetUnassigned}
                      onChangeBucket={(key, delta) => {
                        setFeetBuckets((prev) => {
                          const current = prev[key] || 0;
                          const assigned = Object.values(prev).reduce(
                            (s, v) => s + v,
                            0,
                          );
                          const unassigned = feetTotal - assigned;
                          if (delta > 0 && unassigned <= 0) return prev;
                          if (delta < 0 && current <= 0) return prev;
                          return { ...prev, [key]: current + delta };
                        });
                      }}
                      radioMode={singleAnimalMode}
                      onRadioSelect={(key) => {
                        setFeetBuckets((prev) => {
                          const allZero = Object.fromEntries(
                            Object.keys(prev).map((k) => [k, 0]),
                          );
                          return prev[key] > 0
                            ? allZero
                            : { ...allZero, [key]: 4 };
                        });
                      }}
                      required={needsFeet}
                      submitAttempted={submitAttempted}
                    />
                  )}
                </div>
              </Card>
            )}

            <div className="xl:hidden flex flex-col gap-3">
              <Card>
                <CardHead label="Kəsim tarixi" Icon={CalendarDays} />
                <CalendarBlock />
              </Card>
              <Card>
                <CardHead label="Çatdırılma vaxtı" Icon={Clock} />
                <TimeSlotBlock cols="grid-cols-3" />
              </Card>
              <Card>
                <CardHead label="Qeydlər" />
                <div className="p-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Xüsusi istəklərinizi qeyd edin..."
                    rows={3}
                    className="field-input resize-none w-full text-sm"
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* ════ RIGHT COLUMN — xl+ only ════ */}
          <div className="hidden xl:flex flex-col gap-3">
            {weights.length > 0 && (
              <Card>
                <CardHead label="DİRİ ÇƏKİ KATEQORİYASI" />
                <div className="p-3 flex flex-wrap gap-2">
                  {weights.map((w) => {
                    const lbl = w.labelAz || w.label || w.key;
                    const isSel =
                      selectedWeight?.key === w.key ||
                      selectedWeight?.labelAz === w.labelAz;
                    return (
                      <button
                        key={w.key || lbl}
                        onClick={() => setSelectedWeight(w)}
                        className={`px-3 py-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-0.5 ${
                          isSel
                            ? "border-primary bg-primary-surface text-primary"
                            : "border-border bg-surface-alt text-text-primary"
                        }`}
                      >
                        <span className="text-[10px] sm:text-[11px] font-bold">
                          {lbl} — {w.price} AZN
                        </span>
                        {getMeatWeight(lbl) && (
                          <span
                            className={`text-[9px] font-semibold ${isSel ? "text-primary" : "text-text-muted"}`}
                          >
                            {getMeatWeight(lbl)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}
            <Card>
              <CardHead label="Kəsim tarixi" Icon={CalendarDays} />
              <CalendarBlock />
            </Card>
            <Card>
              <CardHead label="Çatdırılma vaxtı" Icon={Clock} />
              <TimeSlotBlock cols="grid-cols-2" />
            </Card>
            <Card>
              <CardHead label="Qeydlər" />
              <div className="p-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Xüsusi istəklərinizi qeyd edin..."
                  rows={3}
                  className="field-input resize-none w-full text-sm"
                />
              </div>
            </Card>
            <PriceSummary />
          </div>
        </div>
      </div>

      {/* ════ MOBILE action bar ════ */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 z-[9999]">
        <div className="flex items-center gap-3">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-text-secondary font-medium">
              Cəmi məbləğ
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-primary leading-tight">
              {totalPrice} AZN
            </span>
            {!singleAnimalMode &&
              (mode === "serikli" ? (
                <span className="text-[10px] text-text-muted truncate">
                  {qty}/{maxShares} pay
                </span>
              ) : (
                <span className="text-[10px] text-text-muted truncate">
                  {qty} × {effectivePrice} AZN
                </span>
              ))}
          </div>
          <button
            onClick={handleContinue}
            className="flex-shrink-0 bg-primary text-white rounded-2xl py-3.5 px-6 sm:px-8 text-sm font-extrabold border-none cursor-pointer whitespace-nowrap active:scale-95 transition-transform"
          >
            Davam et →
          </button>
        </div>
      </div>
    </div>
  );
}

function PartBucketSection({
  label,
  total,
  unitLabel,
  options,
  buckets,
  unassigned,
  onChangeBucket,
  radioMode,
  onRadioSelect,
  required,
  submitAttempted,
}) {
  const isError = required && submitAttempted && unassigned > 0;

  if (radioMode) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-text-secondary">
            {label}
          </span>
          {isError && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              Seçin!
            </span>
          )}
        </div>
        {isError && (
          <p className="text-[11px] font-bold text-red-500 mb-2">
            Davam etmək üçün {label.toLowerCase()} seçin.
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          {options.map((opt) => {
            const isSelected = (buckets[opt.key] || 0) > 0;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onRadioSelect(opt.key)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 border-2 transition-all text-left w-full cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary-surface"
                    : isError
                      ? "border-red-200 bg-red-50"
                      : "border-border bg-surface-alt"
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] sm:text-xs font-semibold text-text-primary truncate">
                    {opt.labelAz}
                  </span>
                  <span className="text-[10px] text-primary font-bold">
                    {opt.fee > 0 ? `+${opt.fee} AZN` : "Pulsuz"}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-3 flex items-center justify-center transition-all ${
                    isSelected ? "border-primary" : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className="text-[10px] sm:text-xs font-bold text-text-secondary">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-text-muted bg-surface-alt border border-border px-2 py-0.5 rounded-full">
            Cəmi: {total} {unitLabel}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              unassigned === 0
                ? "text-primary bg-primary-surface border-primary/30"
                : isError
                  ? "text-red-600 bg-red-50 border-red-200"
                  : "text-text-muted bg-surface-alt border-border"
            }`}
          >
            {unassigned === 0
              ? "✓ Tamamlandı"
              : isError
                ? `Qalıq: ${unassigned}!`
                : `Qalıq: ${unassigned}`}
          </span>
        </div>
      </div>
      {isError && (
        <p className="text-[11px] font-bold text-red-500 mb-2">
          Davam etmək üçün bütün {label.toLowerCase()} bölgüsünü doldurun.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const count = buckets[opt.key] || 0;
          const canIncrease = unassigned > 0;
          return (
            <div
              key={opt.key}
              className="flex items-center justify-between bg-surface-alt rounded-xl px-3 py-2 gap-2"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] sm:text-xs font-semibold text-text-primary truncate">
                  {opt.labelAz}
                </span>
                <span className="text-[10px] text-primary font-bold">
                  {opt.fee > 0 ? `+${opt.fee} AZN` : "Pulsuz"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onChangeBucket(opt.key, -1)}
                  disabled={count <= 0}
                  className={`w-7 h-7 rounded-lg text-sm font-bold border-none flex items-center justify-center transition-all ${
                    count <= 0
                      ? "bg-border text-text-secondary cursor-default opacity-85"
                      : "bg-primary text-white cursor-pointer hover:opacity-90"
                  }`}
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-extrabold text-primary">
                  {count}
                </span>
                <button
                  onClick={() => onChangeBucket(opt.key, 1)}
                  disabled={!canIncrease}
                  className={`w-7 h-7 rounded-lg text-sm font-bold border-none flex items-center justify-center transition-all ${
                    !canIncrease
                      ? "bg-border text-text-secondary cursor-default opacity-85"
                      : "bg-primary text-white cursor-pointer hover:opacity-90"
                  }`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
