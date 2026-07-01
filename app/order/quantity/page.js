"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, AlertTriangle, Beef, ArrowRight } from "lucide-react";
import { useMobileMenu } from "../../../context/MobileMenuContext";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";
import api from "../../../lib/api";

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
  <div className="px-4 py-2 border-b border-border text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase flex items-center gap-2">
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

/* ─── Section card — defined outside to prevent remount on every render ─── */
function S({ label, Icon, error, hideOnXl = false, className: sCls = "", overflow = "hidden", children }) {
  return (
    <div
      className={`bg-white rounded-xl flex flex-col ${hideOnXl ? "xl:hidden" : ""}
      ${error ? "shadow-[0_0_0_1.5px_#f87171]" : "shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_8px_rgba(0,0,0,0.04)]"} ${sCls}`}
      style={{ overflow }}
    >
      <div
        className={`flex items-center justify-between px-2.5 py-1 border-b ${error ? "border-red-100 bg-red-50/50" : "border-[#f0f0f0]"}`}
      >
        <span
          className="flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.12em] uppercase"
          style={{ color: error ? "#ef4444" : "#9ca3af" }}
        >
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </span>
        {error && (
          <span className="flex items-center gap-1 text-[9.5px] font-bold text-red-500">
            <AlertTriangle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function QuantityPage() {
  const router = useRouter();
  const { openMenu } = useMobileMenu();
  const { updateOrder } = useOrder();

  const [animal, setAnimal] = useState(null);
  const [modalMsg, setModalMsg] = useState(null);
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
  const [maxSlaughterDays, setMaxSlaughterDays] = useState(14);
  const [quickDateTodayEnabled, setQuickDateTodayEnabled] = useState(true);
  const [quickDateTomorrowEnabled, setQuickDateTomorrowEnabled] =
    useState(true);

  useEffect(() => {
    try {
      const a = localStorage.getItem("selected_animal");
      const dw = localStorage.getItem("delivery_windows");
      const flowActive = sessionStorage.getItem("qurbanet_flow");
      if (!a || !flowActive) {
        router.replace("/");
        return;
      }
      const parsed = JSON.parse(a);
      setAnimal(parsed);
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

      const ws = parsed.weights || parsed.weightOptions || [];

      // Restore previously saved form state if available for same animal
      const savedRaw = sessionStorage.getItem("qurbanet_qty_state");
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);
          if (saved.animalId === parsed._id) {
            if (saved.qty) setQty(saved.qty);
            if (saved.mode) setMode(saved.mode);
            if (saved.cutStyles) setCutStyles(saved.cutStyles);
            if (saved.headBuckets) setHeadBuckets(saved.headBuckets);
            if (saved.feetBuckets) setFeetBuckets(saved.feetBuckets);
            if (saved.timeSlot) setTimeSlot(saved.timeSlot);
            if (saved.notes) setNotes(saved.notes);
            if (saved.selectedDate)
              setSelectedDate(new Date(saved.selectedDate));
            if (saved.selectedWeightKey && ws.length > 0) {
              const w = ws.find((w) => w.key === saved.selectedWeightKey);
              if (w) {
                setSelectedWeight(w);
                return;
              }
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (ws.length > 0) {
        setSelectedWeight(ws[0]);
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  // Fetch max slaughter days from settings
  useEffect(() => {
    api
      .get("/app-config/settings")
      .then((res) => {
        const d = res.data?.data;
        if (d?.maxSlaughterDays > 0) setMaxSlaughterDays(d.maxSlaughterDays);
        if (d?.quickDateTodayEnabled !== undefined)
          setQuickDateTodayEnabled(d.quickDateTodayEnabled);
        if (d?.quickDateTomorrowEnabled !== undefined)
          setQuickDateTomorrowEnabled(d.quickDateTomorrowEnabled);
      })
      .catch(() => {});
  }, []);

  // Autosave form state to sessionStorage on every change
  useEffect(() => {
    if (!animal) return;
    try {
      sessionStorage.setItem(
        "qurbanet_qty_state",
        JSON.stringify({
          animalId: animal._id,
          qty,
          mode,
          cutStyles,
          headBuckets,
          feetBuckets,
          selectedWeightKey: selectedWeight?.key || null,
          selectedDate: selectedDate ? selectedDate.toISOString() : null,
          timeSlot,
          notes,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [
    qty,
    mode,
    cutStyles,
    headBuckets,
    feetBuckets,
    selectedWeight,
    selectedDate,
    timeSlot,
    notes,
    animal,
  ]);

  // Bu gün seçilidisə və etibarlı slot yoxdursa → sabaha keç
  // (useEffect conditional return-dən ƏVVƏL olmalıdır — React Hooks qaydası)
  useEffect(() => {
    if (!selectedDate) return;
    const todayStr = new Date(new Date().setHours(0, 0, 0, 0)).toDateString();
    const isTodayCheck = new Date(selectedDate).toDateString() === todayStr;
    if (!isTodayCheck) return;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const validSlots = deliveryWindows.filter((slot) => {
      const startH = parseInt(slot.split(":")[0], 10);
      return startH * 60 > nowMins + 240;
    });
    if (validSlots.length === 0) {
      const tomorrow = new Date(new Date().setHours(0, 0, 0, 0));
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(new Date(tomorrow));
      if (deliveryWindows[0]) setTimeSlot(deliveryWindows[0]);
    }
  }, [selectedDate, deliveryWindows]); // eslint-disable-line react-hooks/exhaustive-deps

  const calendarRef = useRef(null);
  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCalendar]);

  if (!animal) return null;

  const maxQty = Number(animal.maxQuantity) || 1;
  const isSingle = maxQty === 1;
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
    submitAttempted && effectiveCutStyles.length > 0 && totalCutCount === 0;
  const partsError = submitAttempted && needsHead && headAssigned === 0;

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!selectedDate) {
      setModalMsg("Kəsim tarixini seçin.");
      return;
    }
    if (!timeSlot) {
      setModalMsg("Çatdırılma vaxtını seçin.");
      return;
    }
    if (effectiveCutStyles.length > 0 && totalCutCount === 0) {
      setModalMsg("Doğrama üsulunu seçin.");
      return;
    }
    if (needsHead && headAssigned === 0) {
      setModalMsg("Baş & ayaqlar üçün bir seçim edin.");
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

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  const isToday =
    selectedDate &&
    new Date(selectedDate).toDateString() === todayMidnight.toDateString();
  const isTomorrow =
    selectedDate &&
    new Date(selectedDate).toDateString() === tomorrowMidnight.toDateString();

  const isCustom = selectedDate && !isToday && !isTomorrow;

  // ── 4-saat interval məntiqi ───────────────────────────────────────────────
  const getValidWindowsForToday = (windows) => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const minStartMins = nowMins + 4 * 60;
    return windows.filter((slot) => {
      const startH = parseInt(slot.split(":")[0], 10);
      return startH * 60 > minStartMins;
    });
  };

  const validWindowsToday = getValidWindowsForToday(deliveryWindows);
  const noValidSlotsToday = validWindowsToday.length === 0;
  const visibleWindows = isToday ? validWindowsToday : deliveryWindows;
  const customLabel = isCustom
    ? `${new Date(selectedDate).getDate()} ${AZ_MONTHS[new Date(selectedDate).getMonth()]} ${new Date(selectedDate).getFullYear()}`
    : null;

  const CalendarBlock = () => (
    <div className="p-2 flex flex-col gap-1.5">
      {/* Quick picks */}
      {(quickDateTodayEnabled || quickDateTomorrowEnabled) && (
        <div
          className={`grid gap-2 ${quickDateTodayEnabled && quickDateTomorrowEnabled ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {[
            // "Bu gün" — məntiqi yazılıb amma hələlik deaktiv (imkanımız yoxdur)
            {
              label: "Bu gün",
              date: todayMidnight,
              active: isToday,
              enabled: false,
            },
            {
              label: "Sabah",
              date: tomorrowMidnight,
              active: isTomorrow,
              enabled: quickDateTomorrowEnabled,
            },
          ]
            .filter((o) => o.enabled)
            .map(({ label, date, active }) => (
              <button
                key={label}
                onClick={() => {
                  setSelectedDate(new Date(date));
                  setShowCalendar(false);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all
                ${
                  active
                    ? "border-primary bg-primary-surface text-primary"
                    : "border-border bg-surface-alt text-text-secondary hover:border-primary/40"
                }`}
              >
                <span>{label}</span>
                <span className="text-[11px] font-semibold opacity-60">
                  {date.getDate()} {AZ_MONTHS[date.getMonth()]}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* Custom date toggle */}
      <div ref={calendarRef} className="relative" style={{ zIndex: 50 }}>
      <button
        onClick={() => setShowCalendar((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-semibold cursor-pointer transition-all
          ${
            isCustom
              ? "border-primary bg-primary-surface text-primary"
              : showCalendar
                ? "border-primary/50 bg-surface text-text-secondary"
                : "border-border bg-surface-alt text-text-secondary hover:border-primary/40"
          }`}
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          {isCustom ? customLabel : "Başqa tarix seç"}
        </span>
        <span className="text-xs opacity-50">{showCalendar ? "▲" : "▼"}</span>
      </button>

      {/* Floating calendar */}
      {showCalendar && (
        <div className="absolute left-0 right-0 top-full mt-1.5 border border-border rounded-xl p-3 bg-white shadow-lg" style={{ zIndex: 9999 }}>
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
              const maxDate = new Date(todayMidnight);
              maxDate.setDate(maxDate.getDate() + maxSlaughterDays);
              const cellDate = d ? new Date(calYear, calMonth, d) : null;
              const disabled =
                !d || cellDate < todayMidnight || cellDate > maxDate;
              const sel =
                d &&
                selectedDate &&
                cellDate.toDateString() ===
                  new Date(selectedDate).toDateString();
              return (
                <button
                  key={i}
                  disabled={!d || disabled}
                  onClick={() => {
                    if (d && !disabled) {
                      setSelectedDate(cellDate);
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
    </div>
  );

  const TimeSlotBlock = ({ cols = "grid-cols-3" }) => (
    <div className={`p-2 grid ${cols} gap-1.5`}>
      {visibleWindows.map((slot) => (
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

  /* ─── Price Summary (desktop right col) ─── */
  const PriceSummary = () => (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(27,94,32,0.22)]"
      style={{ background: "linear-gradient(145deg,#1B5E20 0%,#2E7D32 60%,#388E3C 100%)" }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.15em]">Ümumi məbləğ</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-black text-white tracking-tight leading-none">{totalPrice}</span>
            <span className="text-base font-bold text-white/60">AZN</span>
          </div>
        </div>
        <button
          onClick={handleContinue}
          className="flex-shrink-0 flex items-center gap-1.5 bg-white text-primary rounded-xl py-2 px-4 text-[13px] font-extrabold border-none cursor-pointer transition-all active:scale-[0.98] hover:bg-green-50 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
        >
          Davam et <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );

  /* ─── Animal card inner content ─── */
  const animalCard = () => (
    <>
      <div className="flex items-stretch min-h-[90px]">
        <div className="w-[160px] sm:w-[190px] flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(145deg,#e8f5e9 0%,#c8e6c9 100%)" }}>
          {animal.imageUrl ? (
            <img src={animal.imageUrl} alt={animal.nameAz} className="w-full h-full object-contain" style={{ transform: "scale(1.06)" }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Beef className="w-8 h-8" style={{ color: "#1B5E20", opacity: 0.3 }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between px-3 py-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">Seçilmiş heyvan</p>
            <h2 className="text-[15px] font-extrabold text-text-primary mt-0.5 leading-tight">{animal.nameAz}</h2>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-black text-primary leading-none tracking-tight">{effectivePrice}</span>
              <span className="text-[11px] font-semibold text-text-muted ml-0.5">AZN{!isSingle ? " / əd." : ""}</span>
            </div>
          </div>
          {!isSingle && (
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Miqdar</span>
              <div className="flex items-center gap-1.5">
                <QtyBtn onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</QtyBtn>
                <span className="w-6 text-center text-lg font-black text-primary">{qty}</span>
                <QtyBtn onClick={() => setQty((q) => mode === "serikli" ? Math.min(maxShares, q + 1) : Math.min(maxQty, q + 1))}
                  disabled={(mode === "serikli" && qty >= maxShares) || (mode !== "serikli" && qty >= maxQty)}>+</QtyBtn>
              </div>
            </div>
          )}
        </div>
      </div>
      {!isSingle && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#f0f0f0]" style={{ background: "rgba(27,94,32,0.04)" }}>
          <span className="text-[10px] text-text-muted font-medium">
            {mode === "serikli" ? `${qty}/${maxShares} pay` : `${qty} × ${effectivePrice} AZN`}
          </span>
          <span className="text-[12px] font-extrabold text-primary">= {basePrice} AZN</span>
        </div>
      )}
    </>
  );

  /* ─── Option row (radio style) ─── */
  const Opt = ({ selected, onClick, label, sub, subGreen = false }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-all duration-150 border-2
        ${selected ? "border-primary bg-primary-surface" : "border-border bg-[#f7f8f7] hover:bg-[#eef5ee]"}`}
    >
      <div
        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all
        ${selected ? "border-primary bg-primary" : "border-[#d1d5db]"}`}
      >
        {selected && <div className="w-1 h-1 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-[11px] font-semibold leading-none block ${selected ? "text-primary" : "text-text-primary"}`}>
          {label}
        </span>
        {sub && (
          <span className={`text-[9px] font-bold leading-none mt-0.5 block ${subGreen ? "text-emerald-600" : "text-primary"}`}>
            {sub}
          </span>
        )}
      </div>
    </button>
  );

  /* ─── Weight pill ─── */
  const WPill = ({ w }) => {
    const lbl = w.labelAz || w.label || w.key;
    const on =
      selectedWeight?.key === w.key || selectedWeight?.labelAz === w.labelAz;
    return (
      <button
        onClick={() => setSelectedWeight(w)}
        className={`w-full h-full flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 border-2
          ${on ? "border-primary bg-primary-surface text-primary" : "border-border bg-[#f7f8f7] text-text-primary hover:bg-[#eef5ee]"}`}
      >
        <span className="text-[11px] font-bold leading-tight">
          {lbl} — {w.price} AZN
        </span>
        {getMeatWeight(lbl) && (
          <span
            className={`text-[9px] font-semibold ${on ? "text-primary/70" : "text-text-muted"}`}
          >
            {getMeatWeight(lbl)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "#f2f5f2" }}
    >
      {/* Info Modal */}
      {modalMsg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalMsg(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-200 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-center text-[15px] font-semibold text-text-primary mb-5">{modalMsg}</p>
            <button
              onClick={() => setModalMsg(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-extrabold border-none cursor-pointer hover:opacity-90 transition-all"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
      <StepHeader currentStep={1} />

      {/* ── Scrollable body ── */}
      <div
        className="order-scroll flex-1 overflow-y-auto min-h-0 flex flex-col"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#1B5E20 transparent",
        }}
      >
        <div className="p-2.5 xl:p-4">
          <h2 className="text-base font-bold text-text-primary mb-2 lg:hidden">Miqdar seçin</h2>
          {/* ══ LEFT — mobile only ══ */}
          <div className="flex flex-col gap-2 xl:hidden">
            {/* Animal hero card */}
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_8px_rgba(0,0,0,0.04)]">
              {animalCard()}
            </div>

            {/* Sifariş növü */}
            {!animal.orderMode &&
              animal.totalShares > 1 &&
              animal.serikliEnabled && (
                <S label="Sifariş növü">
                  <div className="p-2 flex gap-2">
                    {[
                      { k: "tam", l: "Tam heyvan" },
                      { k: "serikli", l: `Şərikli (/${maxShares})` },
                    ].map((m) => (
                      <button
                        key={m.k}
                        onClick={() => setMode(m.k)}
                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-150 cursor-pointer
                        ${mode === m.k ? "bg-primary text-white shadow-[0_2px_8px_rgba(27,94,32,0.25)]" : "bg-[#f7f8f7] text-text-secondary hover:bg-[#eef5ee]"}`}
                      >
                        {m.l}
                      </button>
                    ))}
                  </div>
                </S>
              )}

            {/* Diri çəki — mobile only */}
            {weights.length > 0 && (
              <S label="Diri çəki kateqoriyası" hideOnXl>
                <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {weights.map((w) => (
                    <WPill key={w.key || w.labelAz} w={w} />
                  ))}
                </div>
              </S>
            )}

            {/* Doğrama üsulu + Baş və Ayaqlar — alt-alta */}
            {effectiveCutStyles.length > 0 && (
              <S label="Doğrama üsulu" error={cutStyleError ? "Seçim edin" : null}>
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {effectiveCutStyles.map((cs) => (
                    <Opt
                      key={cs.key}
                      selected={(cutStyles[cs.key] || 0) > 0}
                      onClick={() => {
                        if ((cutStyles[cs.key] || 0) > 0) return;
                        setCutStyles(() => {
                          const z = Object.fromEntries(
                            effectiveCutStyles.map((c) => [c.key, 0]),
                          );
                          return { ...z, [cs.key]: qty };
                        });
                      }}
                      label={cs.labelAz}
                      sub={cs.fee > 0 ? `+${cs.fee * qty} AZN` : "Pulsuz"}
                      subGreen={cs.fee === 0}
                    />
                  ))}
                </div>
              </S>
            )}

            {needsHead && (
              <S label="Baş və Ayaqlar" error={partsError ? "Seçim edin" : null}>
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {activeHeadOptions.map((opt) => {
                    const on = (headBuckets[opt.key] || 0) > 0;
                    const fee = opt.fee || 0;
                    return (
                      <Opt
                        key={opt.key}
                        selected={on}
                        onClick={() => {
                          if (on) return;
                          const hZ = Object.fromEntries(
                            Object.keys(headBuckets).map((k) => [k, 0]),
                          );
                          const fZ = Object.fromEntries(
                            Object.keys(feetBuckets).map((k) => [k, 0]),
                          );
                          setHeadBuckets({ ...hZ, [opt.key]: headTotal });
                          setFeetBuckets({ ...fZ, [opt.key]: feetTotal });
                        }}
                        label={opt.labelAz}
                        sub={fee > 0 ? `+${fee * qty} AZN` : "Pulsuz"}
                        subGreen={fee === 0}
                      />
                    );
                  })}
                </div>
              </S>
            )}

            {/* Qeydlər — mobile-da Doğrama+Baş altında */}
            <div className="xl:hidden">
              <S label="Qeydlər">
                <div className="p-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Xüsusi istəklərinizi qeyd edin..."
                    rows={3}
                    className="field-input resize-none w-full text-sm"
                  />
                </div>
              </S>
            </div>

            {/* Date / Time — mobile */}
            <div className="xl:hidden flex flex-col gap-2">
              <S label="Kəsim tarixi" Icon={CalendarDays} overflow="visible">
                {CalendarBlock()}
              </S>
              <S label="Çatdırılma vaxtı" Icon={Clock}>
                {TimeSlotBlock({ cols: "grid-cols-3" })}
              </S>
            </div>
          </div>

          {/* ══ DESKTOP xl+ — 3-col flat grid ══ */}
          {weights.length > 0 ? (
            <div className="hidden xl:grid xl:grid-cols-[320px_1fr_minmax(280px,320px)] xl:gap-3 xl:items-stretch">
              {/* ── Row 1 ── */}
              {/* Col 1: Animal */}
              <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_8px_rgba(0,0,0,0.04)]">
                {animalCard()}
              </div>
              {/* Col 2: Diri çəki */}
              <S label="Diri çəki kateqoriyası">
                <div className="p-2 grid grid-cols-2 gap-1.5">
                  {weights.map((w) => <WPill key={w.key || w.labelAz} w={w} />)}
                </div>
              </S>
              {/* Col 3 Row 1: Kəsim tarixi */}
              <S label="Kəsim tarixi" Icon={CalendarDays} overflow="visible">
                {CalendarBlock()}
              </S>

              {/* ── Row 2 ── */}
              {/* Col 1: Doğrama üsulu (or spacer) */}
              {effectiveCutStyles.length > 0 ? (
                <S label="Doğrama üsulu" error={cutStyleError ? "Seçim edin" : null}>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {effectiveCutStyles.map((cs) => (
                      <Opt key={cs.key} selected={(cutStyles[cs.key] || 0) > 0}
                        onClick={() => { if ((cutStyles[cs.key] || 0) > 0) return; setCutStyles(() => { const z = Object.fromEntries(effectiveCutStyles.map((c) => [c.key, 0])); return { ...z, [cs.key]: qty }; }); }}
                        label={cs.labelAz} sub={cs.fee > 0 ? `+${cs.fee * qty} AZN` : "Pulsuz"} subGreen={cs.fee === 0} />
                    ))}
                  </div>
                </S>
              ) : <div />}
              {/* Col 2 Row 2: Qeydlər */}
              <S label="Qeydlər">
                <div className="p-2 h-full">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Xüsusi istəklərinizi qeyd edin..." rows={4}
                    className="field-input resize-none w-full h-full text-sm" />
                </div>
              </S>
              {/* Col 3 Row 2: Çatdırılma vaxtı */}
              <S label="Çatdırılma vaxtı" Icon={Clock}>
                {TimeSlotBlock({ cols: "grid-cols-2" })}
              </S>

              {/* ── Row 3 ── */}
              {/* Col 1: Baş və Ayaqlar (or spacer) */}
              {needsHead ? (
                <S label="Baş və Ayaqlar" error={partsError ? "Seçim edin" : null}>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {activeHeadOptions.map((opt) => {
                      const on = (headBuckets[opt.key] || 0) > 0;
                      const fee = opt.fee || 0;
                      return (
                        <Opt key={opt.key} selected={on}
                          onClick={() => { if (on) return; const hZ = Object.fromEntries(Object.keys(headBuckets).map((k) => [k, 0])); const fZ = Object.fromEntries(Object.keys(feetBuckets).map((k) => [k, 0])); setHeadBuckets({ ...hZ, [opt.key]: headTotal }); setFeetBuckets({ ...fZ, [opt.key]: feetTotal }); }}
                          label={opt.labelAz} sub={fee > 0 ? `+${fee * qty} AZN` : "Pulsuz"} subGreen={fee === 0} />
                      );
                    })}
                  </div>
                </S>
              ) : <div />}
              {/* Col 2 Row 3: spacer */}
              <div />
              {/* Col 3 Row 3: PriceSummary */}
              {PriceSummary()}
            </div>
          ) : (
            <div className="hidden xl:grid xl:grid-cols-[300px_1fr] xl:gap-3 xl:items-start">
              {/* No weights: animal + right col */}
              <div className="flex flex-col gap-2">
                <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_8px_rgba(0,0,0,0.04)]">
                  {animalCard()}
                </div>
                {effectiveCutStyles.length > 0 && (
                  <S label="Doğrama üsulu" error={cutStyleError ? "Seçim edin" : null}>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {effectiveCutStyles.map((cs) => (
                        <Opt key={cs.key} selected={(cutStyles[cs.key] || 0) > 0}
                          onClick={() => { if ((cutStyles[cs.key] || 0) > 0) return; setCutStyles(() => { const z = Object.fromEntries(effectiveCutStyles.map((c) => [c.key, 0])); return { ...z, [cs.key]: qty }; }); }}
                          label={cs.labelAz} sub={cs.fee > 0 ? `+${cs.fee * qty} AZN` : "Pulsuz"} subGreen={cs.fee === 0} />
                      ))}
                    </div>
                  </S>
                )}
                {needsHead && (
                  <S label="Baş və Ayaqlar" error={partsError ? "Seçim edin" : null}>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {activeHeadOptions.map((opt) => {
                        const on = (headBuckets[opt.key] || 0) > 0;
                        const fee = opt.fee || 0;
                        return (
                          <Opt key={opt.key} selected={on}
                            onClick={() => { if (on) return; const hZ = Object.fromEntries(Object.keys(headBuckets).map((k) => [k, 0])); const fZ = Object.fromEntries(Object.keys(feetBuckets).map((k) => [k, 0])); setHeadBuckets({ ...hZ, [opt.key]: headTotal }); setFeetBuckets({ ...fZ, [opt.key]: feetTotal }); }}
                            label={opt.labelAz} sub={fee > 0 ? `+${fee * qty} AZN` : "Pulsuz"} subGreen={fee === 0} />
                        );
                      })}
                    </div>
                  </S>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <S label="Kəsim tarixi" Icon={CalendarDays} overflow="visible">
                  {CalendarBlock()}
                </S>
                <S label="Çatdırılma vaxtı" Icon={Clock}>
                  {TimeSlotBlock({ cols: "grid-cols-2" })}
                </S>
                {PriceSummary()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ Mobile sticky price bar ══ */}
      <div className="xl:hidden shrink-0 p-2.5 pt-2" style={{ background: "#f2f5f2" }}>
        {PriceSummary()}
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
                    {opt.fee > 0 ? `+${opt.fee * total} AZN` : "Pulsuz"}
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
