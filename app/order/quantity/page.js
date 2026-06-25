// pages/order/quantity/page.js (və ya app/order/quantity/page.js)

"use client";

import React, {
  useState,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, AlertTriangle, Beef } from "lucide-react";

// ---------- Daxili komponentlər ----------
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
// ---------- Context-lər ----------
import { useMobileMenu } from "../../../context/MobileMenuContext";
import { useOrder } from "../../../context/OrderContext";
// ---------- API ----------
import api from "../../../lib/api";

// ============================================================
//  1.  SABİTLƏR və KÖMƏKÇİ FUNKSİYALAR
// ============================================================

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

/** Bugünün tarixini (saat 00:00) qaytarır */
const getTodayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Sabahın tarixini (saat 00:00) qaytarır */
const getTomorrowMidnight = () => {
  const d = getTodayMidnight();
  d.setDate(d.getDate() + 1);
  return d;
};

/** Verilən tarix üçün Azərbaycan dilində formatlanmış mətn */
const formatDateAz = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Ət çəkisi təxmini mətnini hazırlayır */
const getMeatWeight = (label) => {
  const nums = (label || "").match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length < 1) return null;
  const vals = nums.map((n) => parseFloat(n.replace(",", ".")));
  const lo = Math.floor(Math.min(...vals) * 0.5);
  const hi = Math.ceil(Math.max(...vals) * 0.5);
  return lo === hi ? `~${lo} kq ət` : `~${lo}–${hi} kq ət`;
};

/** Bugün üçün etibarlı vaxt intervallarını filtrələyir (4 saat qabaqcadan) */
const getValidWindowsForToday = (windows) => {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const minStartMins = nowMins + 4 * 60;
  return windows.filter((slot) => {
    const startH = parseInt(slot.split(":")[0], 10);
    return startH * 60 > minStartMins;
  });
};

// ============================================================
//  2.  REDUCER – FORM STATE İDARƏSİ
// ============================================================

const initialState = {
  mode: "tam",
  qty: 1,
  cutStyles: {},
  headBuckets: {},
  feetBuckets: {},
  selectedWeightKey: null,
  selectedDate: getTomorrowMidnight(),
  timeSlot: TIME_SLOTS[0],
  notes: "",
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "SET_QTY":
      return { ...state, qty: action.payload };
    case "SET_CUT_STYLES":
      return { ...state, cutStyles: action.payload };
    case "SET_HEAD_BUCKETS":
      return { ...state, headBuckets: action.payload };
    case "SET_FEET_BUCKETS":
      return { ...state, feetBuckets: action.payload };
    case "SET_SELECTED_WEIGHT_KEY":
      return { ...state, selectedWeightKey: action.payload };
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload };
    case "SET_TIME_SLOT":
      return { ...state, timeSlot: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
}

// ============================================================
//  3.  CUSTOM HOOK-LAR
// ============================================================

/**
 * Hayvan məlumatlarını localStorage-dan oxuyur və flow yoxlayır.
 * Əgər məlumat yoxdursa, ana səhifəyə yönləndirir.
 */
function useAnimalData(router) {
  const [animal, setAnimal] = useState(null);
  const [deliveryWindows, setDeliveryWindows] = useState(TIME_SLOTS);
  const [loading, setLoading] = useState(true);

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

      if (dw) {
        const windows = JSON.parse(dw);
        setDeliveryWindows(windows.length ? windows : TIME_SLOTS);
      } else {
        setDeliveryWindows(TIME_SLOTS);
      }
    } catch {
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { animal, deliveryWindows, loading };
}

/**
 * App konfiqurasiyasını (maxSlaughterDays, quickDate...) API-dən gətirir.
 */
function useAppSettings() {
  const [settings, setSettings] = useState({
    maxSlaughterDays: 14,
    quickDateTodayEnabled: true,
    quickDateTomorrowEnabled: true,
  });

  useEffect(() => {
    api
      .get("/app-config/settings")
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setSettings((prev) => ({
            ...prev,
            maxSlaughterDays: data.maxSlaughterDays ?? prev.maxSlaughterDays,
            quickDateTodayEnabled:
              data.quickDateTodayEnabled ?? prev.quickDateTodayEnabled,
            quickDateTomorrowEnabled:
              data.quickDateTomorrowEnabled ?? prev.quickDateTomorrowEnabled,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return settings;
}

/**
 * Form state-ni sessionStorage-da avtomatik saxlayır.
 */
function useAutoSave(animal, formState) {
  const savedOnce = useRef(false);

  useEffect(() => {
    if (!animal || savedOnce.current) return;
    // Yalnız bir dəfə yükləmək üçün (restore işləmi)
    savedOnce.current = true;
  }, [animal]);

  useEffect(() => {
    if (!animal) return;
    try {
      sessionStorage.setItem(
        "qurbanet_qty_state",
        JSON.stringify({
          animalId: animal._id,
          qty: formState.qty,
          mode: formState.mode,
          cutStyles: formState.cutStyles,
          headBuckets: formState.headBuckets,
          feetBuckets: formState.feetBuckets,
          selectedWeightKey: formState.selectedWeightKey,
          selectedDate: formState.selectedDate
            ? new Date(formState.selectedDate).toISOString()
            : null,
          timeSlot: formState.timeSlot,
          notes: formState.notes,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [
    animal,
    formState.qty,
    formState.mode,
    formState.cutStyles,
    formState.headBuckets,
    formState.feetBuckets,
    formState.selectedWeightKey,
    formState.selectedDate,
    formState.timeSlot,
    formState.notes,
  ]);
}

/**
 * Əvvəlcədən saxlanmış form state-i bərpa edir.
 */
function useRestoreFormState(animal, dispatch) {
  useEffect(() => {
    if (!animal) return;
    const savedRaw = sessionStorage.getItem("qurbanet_qty_state");
    if (!savedRaw) return;

    try {
      const saved = JSON.parse(savedRaw);
      if (saved.animalId === animal._id) {
        if (saved.qty) dispatch({ type: "SET_QTY", payload: saved.qty });
        if (saved.mode) dispatch({ type: "SET_MODE", payload: saved.mode });
        if (saved.cutStyles)
          dispatch({ type: "SET_CUT_STYLES", payload: saved.cutStyles });
        if (saved.headBuckets)
          dispatch({ type: "SET_HEAD_BUCKETS", payload: saved.headBuckets });
        if (saved.feetBuckets)
          dispatch({ type: "SET_FEET_BUCKETS", payload: saved.feetBuckets });
        if (saved.timeSlot)
          dispatch({ type: "SET_TIME_SLOT", payload: saved.timeSlot });
        if (saved.notes) dispatch({ type: "SET_NOTES", payload: saved.notes });
        if (saved.selectedDate) {
          dispatch({
            type: "SET_SELECTED_DATE",
            payload: new Date(saved.selectedDate),
          });
        }
        // selectedWeightKey bərpası ayrıca işlənəcək (çəkilər gəldikdən sonra)
        // Burada yalnız key-i saxlayırıq, sonra animal.weights ilə uyğunlaşdıracağıq
        if (saved.selectedWeightKey) {
          // Saxlanılan key-i bir dəyişəndə saxlaya bilərik, amma indi onu formState-ə əlavə etmək üçün:
          // Bunu ayrıca useEffect-də edəcəyik.
          // Sadəlik üçün burada dispatç etmirik, aşağıdakı hook-da edəcəyik.
          // Lakin bizə lazımdır ki, seçilmiş çəki key-i state-ə yazılsın.
          // Bunu animal yükləndikdən sonra işlədəcəyik.
          // Ona görə ayrıca useEffect yazırıq.
        }
      }
    } catch {
      /* ignore */
    }
  }, [animal, dispatch]);
}

// ============================================================
//  4.  UI KOMPONENTLƏRİ (stateless)
// ============================================================

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

/** Seçim düyməsi (radio) */
const OptionButton = ({ selected, onClick, label, sub, subGreen = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left cursor-pointer transition-all duration-150 border-2
      ${selected ? "border-primary bg-primary-surface" : "border-transparent bg-[#f7f8f7] hover:bg-[#eef5ee]"}`}
  >
    <div
      className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all
        ${selected ? "border-primary bg-primary" : "border-[#d1d5db]"}`}
    >
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-[12px] font-semibold leading-tight block text-text-primary">
        {label}
      </span>
      {sub && (
        <span
          className={`text-[10px] font-bold ${
            subGreen ? "text-emerald-600" : "text-primary"
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  </button>
);

/** Çəki seçim düyməsi (pill) */
const WeightPill = ({ weight, selectedWeight, onSelect }) => {
  const lbl = weight.labelAz || weight.label || weight.key;
  const on =
    selectedWeight?.key === weight.key ||
    selectedWeight?.labelAz === weight.labelAz;
  return (
    <button
      onClick={() => onSelect(weight)}
      className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 border-2
        ${on ? "border-primary bg-primary-surface text-primary" : "border-transparent bg-[#f7f8f7] text-text-primary hover:bg-[#eef5ee]"}`}
    >
      <span className="text-[11px] font-bold leading-tight">
        {lbl} — {weight.price} AZN
      </span>
      {getMeatWeight(lbl) && (
        <span
          className={`text-[9px] font-semibold ${
            on ? "text-primary/70" : "text-text-muted"
          }`}
        >
          {getMeatWeight(lbl)}
        </span>
      )}
    </button>
  );
};

// ------------------------------------------------------------
//  CalendarBlock – Təqvim və sürətli seçimlər
// ------------------------------------------------------------
const CalendarBlock = ({
  selectedDate,
  onDateSelect,
  maxSlaughterDays,
  quickDateTodayEnabled,
  quickDateTomorrowEnabled,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(
    () => selectedDate?.getFullYear() || getTodayMidnight().getFullYear(),
  );
  const [calMonth, setCalMonth] = useState(
    () => selectedDate?.getMonth() || getTodayMidnight().getMonth(),
  );

  const todayMidnight = getTodayMidnight();
  const tomorrowMidnight = getTomorrowMidnight();

  const isToday =
    selectedDate &&
    new Date(selectedDate).toDateString() === todayMidnight.toDateString();
  const isTomorrow =
    selectedDate &&
    new Date(selectedDate).toDateString() === tomorrowMidnight.toDateString();
  const isCustom = selectedDate && !isToday && !isTomorrow;

  const customLabel = isCustom ? formatDateAz(selectedDate) : null;

  // Təqvim günləri
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const maxDate = new Date(todayMidnight);
  maxDate.setDate(maxDate.getDate() + maxSlaughterDays);

  const handleDayClick = (day) => {
    if (!day) return;
    const cellDate = new Date(calYear, calMonth, day);
    if (cellDate < todayMidnight || cellDate > maxDate) return;
    onDateSelect(cellDate);
    setShowCalendar(false);
  };

  return (
    <div className="p-2 flex flex-col gap-1.5">
      {/* Sürətli seçimlər */}
      {(quickDateTodayEnabled || quickDateTomorrowEnabled) && (
        <div
          className={`grid gap-2 ${
            quickDateTodayEnabled && quickDateTomorrowEnabled
              ? "grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {[
            {
              label: "Bu gün",
              date: todayMidnight,
              active: isToday,
              enabled: quickDateTodayEnabled,
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
                  onDateSelect(new Date(date));
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

      {/* Özgə tarix */}
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

      {/* Açılan təqvim */}
      {showCalendar && (
        <div className="border border-border rounded-xl p-3 bg-surface">
          <div className="flex items-center justify-between mb-2.5">
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((y) => y - 1);
                } else {
                  setCalMonth((m) => m - 1);
                }
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
                } else {
                  setCalMonth((m) => m + 1);
                }
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
              const cellDate = d ? new Date(calYear, calMonth, d) : null;
              const disabled =
                !d ||
                !cellDate ||
                cellDate < todayMidnight ||
                cellDate > maxDate;
              const sel =
                d &&
                selectedDate &&
                cellDate.toDateString() ===
                  new Date(selectedDate).toDateString();
              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => handleDayClick(d)}
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
};

// ------------------------------------------------------------
//  TimeSlotBlock – Vaxt intervalları
// ------------------------------------------------------------
const TimeSlotBlock = ({
  timeSlot,
  onTimeSlotSelect,
  windows,
  cols = "grid-cols-3",
}) => (
  <div className={`p-2 grid ${cols} gap-1.5`}>
    {windows.map((slot) => (
      <button
        key={slot}
        onClick={() => onTimeSlotSelect(slot)}
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

// ------------------------------------------------------------
//  PriceSummary – Sağ tərəfdəki ümumi məbləğ kartı
// ------------------------------------------------------------
const PriceSummary = ({
  totalPrice,
  animal,
  qty,
  mode,
  maxShares,
  partsFee,
  selectedWeight,
  onContinue,
}) => (
  <div
    className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(27,94,32,0.22)]"
    style={{
      background: "linear-gradient(145deg,#1B5E20 0%,#2E7D32 60%,#388E3C 100%)",
    }}
  >
    <div className="p-5">
      <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] mb-2">
        Ümumi məbləğ
      </p>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-4xl font-black text-white tracking-tight leading-none">
          {totalPrice}
        </span>
        <span className="text-lg font-bold text-white/60 mb-0.5">AZN</span>
      </div>
      <p className="text-[10px] text-white/40 leading-relaxed mt-1">
        {mode === "serikli"
          ? `${animal.nameAz} · ${qty}/${maxShares} pay${
              partsFee > 0 ? ` + ${partsFee.toFixed(0)} AZN` : ""
            }`
          : `${animal.nameAz} × ${qty}${
              selectedWeight
                ? ` · ${selectedWeight.labelAz || selectedWeight.label}`
                : ""
            }`}
      </p>
    </div>
    <div className="px-4 pb-4">
      <button
        onClick={onContinue}
        className="w-full bg-white text-primary rounded-xl py-3 text-[13px] font-extrabold border-none cursor-pointer transition-all active:scale-[0.98] hover:bg-green-50 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      >
        Davam et →
      </button>
    </div>
  </div>
);

// ============================================================
//  5.  ƏSAS SƏHİFƏ KOMPONENTİ
// ============================================================

export default function QuantityPage() {
  const router = useRouter();
  const { openMenu } = useMobileMenu();
  const { updateOrder } = useOrder();

  // ---------- Custom hook-lar ----------
  const { animal, deliveryWindows, loading } = useAnimalData(router);
  const settings = useAppSettings();
  const { maxSlaughterDays, quickDateTodayEnabled, quickDateTomorrowEnabled } =
    settings;

  // ---------- Form state (useReducer) ----------
  const [formState, dispatch] = useReducer(formReducer, initialState);

  // Bərpa (restore) – animal yükləndikdə işləsin
  useRestoreFormState(animal, dispatch);

  // Avtosaxlama
  useAutoSave(animal, formState);

  // ---------- Local state ----------
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ---------- Derived data ----------
  const maxQty = Number(animal?.maxQuantity) || 1;
  const isSingle = maxQty === 1;
  const maxShares = Number(animal?.totalShares) || 1;
  const effectiveCutStyles = animal?.cutStyleOptions || [];
  const weightOptions = animal?.weights || animal?.weightOptions || [];
  const activeHeadOptions = (animal?.headOptions || []).filter(
    (o) => o.isActive !== false,
  );
  const activeFeetOptions = (animal?.feetOptions || []).filter(
    (o) => o.isActive !== false,
  );

  // Seçilmiş çəki obyekti
  const selectedWeight = useMemo(() => {
    if (!weightOptions.length) return null;
    if (formState.selectedWeightKey) {
      const found = weightOptions.find(
        (w) => w.key === formState.selectedWeightKey,
      );
      if (found) return found;
    }
    return weightOptions[0];
  }, [weightOptions, formState.selectedWeightKey]);

  // Qiymətlər
  const pricePerUnit = animal?.pricePerShare || 0;
  const effectivePrice = selectedWeight ? selectedWeight.price : pricePerUnit;
  const animalSharePrice =
    formState.mode === "serikli"
      ? (effectivePrice / maxShares) * formState.qty
      : effectivePrice * formState.qty;

  // Baş və ayaq haqları
  const headFee =
    animal?.hasHeadOption !== false
      ? activeHeadOptions.reduce(
          (sum, o) => sum + (formState.headBuckets[o.key] || 0) * (o.fee || 0),
          0,
        )
      : 0;
  const feetFee =
    animal?.hasFeetOption !== false
      ? activeFeetOptions.reduce(
          (sum, o) => sum + (formState.feetBuckets[o.key] || 0) * (o.fee || 0),
          0,
        )
      : 0;
  const partsFee = headFee + feetFee;

  // Doğrama haqqı
  const cutStyleFee = effectiveCutStyles.reduce(
    (sum, cs) => sum + (formState.cutStyles[cs.key] || 0) * (cs.fee || 0),
    0,
  );

  const totalPrice = (animalSharePrice + partsFee + cutStyleFee).toFixed(0);
  const basePrice = animalSharePrice.toFixed(0);
  const totalCutCount = Object.values(formState.cutStyles).reduce(
    (s, v) => s + (v || 0),
    0,
  );

  // Baş və ayaq bölgüsü yoxlamaları
  const needsHead =
    animal?.hasHeadOption !== false && activeHeadOptions.length > 0;
  const needsFeet =
    animal?.hasFeetOption !== false && activeFeetOptions.length > 0;

  const headTotal = needsHead ? formState.qty : 0;
  const feetTotal = needsFeet ? formState.qty * 4 : 0;
  const headAssigned = Object.values(formState.headBuckets).reduce(
    (s, v) => s + v,
    0,
  );
  const feetAssigned = Object.values(formState.feetBuckets).reduce(
    (s, v) => s + v,
    0,
  );
  const headUnassigned = headTotal - headAssigned;
  const feetUnassigned = feetTotal - feetAssigned;

  // Validasiya xətaları
  const cutStyleError =
    submitAttempted && effectiveCutStyles.length > 0 && totalCutCount === 0;
  const partsError = submitAttempted && needsHead && headAssigned === 0;

  // Bugün üçün etibarlı vaxt intervalları
  const validWindowsToday = getValidWindowsForToday(deliveryWindows);
  const noValidSlotsToday = validWindowsToday.length === 0;
  const visibleWindows =
    formState.selectedDate &&
    new Date(formState.selectedDate).toDateString() ===
      getTodayMidnight().toDateString()
      ? validWindowsToday
      : deliveryWindows;

  // Tarix seçimi zamanı bugün seçilibsə və etibarlı slot yoxdursa avtomatik sabaha keç
  useEffect(() => {
    if (!formState.selectedDate) return;
    const todayStr = getTodayMidnight().toDateString();
    const isTodayCheck =
      new Date(formState.selectedDate).toDateString() === todayStr;
    if (!isTodayCheck) return;
    if (noValidSlotsToday) {
      const tomorrow = getTomorrowMidnight();
      dispatch({ type: "SET_SELECTED_DATE", payload: tomorrow });
      if (deliveryWindows[0]) {
        dispatch({ type: "SET_TIME_SLOT", payload: deliveryWindows[0] });
      }
    }
  }, [formState.selectedDate, noValidSlotsToday, deliveryWindows]);

  // ---------- Handlers ----------
  const handleQtyChange = (delta) => {
    const newQty = formState.qty + delta;
    if (formState.mode === "serikli") {
      if (newQty >= 1 && newQty <= maxShares)
        dispatch({ type: "SET_QTY", payload: newQty });
    } else {
      if (newQty >= 1 && newQty <= maxQty)
        dispatch({ type: "SET_QTY", payload: newQty });
    }
  };

  const handleCutStyleSelect = (key) => {
    const newStyles = Object.fromEntries(
      effectiveCutStyles.map((c) => [c.key, 0]),
    );
    newStyles[key] = formState.qty;
    dispatch({ type: "SET_CUT_STYLES", payload: newStyles });
  };

  const handleHeadSelect = (key) => {
    const resetHead = Object.fromEntries(
      Object.keys(formState.headBuckets).map((k) => [k, 0]),
    );
    const resetFeet = Object.fromEntries(
      Object.keys(formState.feetBuckets).map((k) => [k, 0]),
    );
    const isSelected = (formState.headBuckets[key] || 0) > 0;
    if (isSelected) {
      dispatch({ type: "SET_HEAD_BUCKETS", payload: resetHead });
      dispatch({ type: "SET_FEET_BUCKETS", payload: resetFeet });
    } else {
      dispatch({
        type: "SET_HEAD_BUCKETS",
        payload: { ...resetHead, [key]: headTotal },
      });
      dispatch({
        type: "SET_FEET_BUCKETS",
        payload: { ...resetFeet, [key]: feetTotal },
      });
    }
  };

  const handleContinue = useCallback(() => {
    setSubmitAttempted(true);
    if (!formState.selectedDate) {
      alert("Kəsim tarixini seçin.");
      return;
    }
    if (!formState.timeSlot) {
      alert("Çatdırılma vaxtını seçin.");
      return;
    }
    if (effectiveCutStyles.length > 0 && totalCutCount === 0) {
      return;
    }
    if (needsHead && headAssigned === 0) {
      alert("Baş & ayaqlar üçün bir seçim edin.");
      return;
    }

    const orderPatch = {
      animal,
      mode: formState.mode,
      qty: formState.qty,
      selectedDate: formState.selectedDate,
      timeSlot: formState.timeSlot,
      notes: formState.notes,
      cutStyles: formState.cutStyles,
      selectedWeight,
      headBuckets: formState.headBuckets,
      feetBuckets: formState.feetBuckets,
      pricePerUnit: effectivePrice,
      totalPrice: parseFloat(totalPrice),
    };

    if (formState.mode === "serikli") {
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
  }, [
    formState,
    effectiveCutStyles,
    totalCutCount,
    needsHead,
    headAssigned,
    animal,
    selectedWeight,
    effectivePrice,
    totalPrice,
    updateOrder,
    router,
  ]);

  // ---------- Loading state ----------
  if (loading || !animal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-muted">Yüklənir...</p>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "#f2f5f2" }}
    >
      <BackHeader
        title="Miqdar seçin"
        onBack={() => router.replace("/")}
        onMenu={openMenu}
      />
      <StepHeader currentStep={1} />

      {/* Scrollable body */}
      <div
        className="order-scroll flex-1 overflow-y-auto min-h-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#1B5E20 transparent",
        }}
      >
        <div className="p-2.5 xl:p-4 xl:grid xl:grid-cols-[1fr_290px] 2xl:grid-cols-[1fr_310px] xl:gap-3.5 xl:items-start">
          {/* SOL TƏRƏF */}
          <div className="flex flex-col gap-2">
            {/* Heyvan kartı */}
            <AnimalCard
              animal={animal}
              qty={formState.qty}
              maxQty={maxQty}
              maxShares={maxShares}
              mode={formState.mode}
              isSingle={isSingle}
              effectivePrice={effectivePrice}
              basePrice={basePrice}
              onQtyChange={handleQtyChange}
              onModeChange={(mode) =>
                dispatch({ type: "SET_MODE", payload: mode })
              }
            />

            {/* Sifariş növü (şərikli varsa) */}
            {!animal.orderMode &&
              animal.totalShares > 1 &&
              animal.serikliEnabled && (
                <SectionCard label="Sifariş növü">
                  <div className="p-2 flex gap-2">
                    {[
                      { k: "tam", l: "Tam heyvan" },
                      { k: "serikli", l: `Şərikli (/${maxShares})` },
                    ].map((m) => (
                      <button
                        key={m.k}
                        onClick={() =>
                          dispatch({ type: "SET_MODE", payload: m.k })
                        }
                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-150 cursor-pointer
                        ${
                          formState.mode === m.k
                            ? "bg-primary text-white shadow-[0_2px_8px_rgba(27,94,32,0.25)]"
                            : "bg-[#f7f8f7] text-text-secondary hover:bg-[#eef5ee]"
                        }`}
                      >
                        {m.l}
                      </button>
                    ))}
                  </div>
                </SectionCard>
              )}

            {/* Diri çəki (yalnız mobil) */}
            {weightOptions.length > 0 && (
              <SectionCard label="Diri çəki kateqoriyası" hideOnXl>
                <div className="p-2 grid grid-cols-2 gap-1.5">
                  {weightOptions.map((w) => (
                    <WeightPill
                      key={w.key || w.labelAz}
                      weight={w}
                      selectedWeight={selectedWeight}
                      onSelect={(w) =>
                        dispatch({
                          type: "SET_SELECTED_WEIGHT_KEY",
                          payload: w.key,
                        })
                      }
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Doğrama üsulu */}
            {effectiveCutStyles.length > 0 && (
              <SectionCard
                label="Doğrama üsulu"
                error={cutStyleError ? "Seçim edin" : null}
              >
                <div className="p-2 flex flex-col gap-1">
                  {effectiveCutStyles.map((cs) => (
                    <OptionButton
                      key={cs.key}
                      selected={(formState.cutStyles[cs.key] || 0) > 0}
                      onClick={() => handleCutStyleSelect(cs.key)}
                      label={cs.labelAz}
                      sub={cs.fee > 0 ? `+${cs.fee * formState.qty} AZN` : null}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Baş & Ayaqlar */}
            {needsHead && (
              <SectionCard
                label="Baş & Ayaqlar"
                error={partsError ? "Seçim edin" : null}
              >
                <div className="p-2 flex flex-col gap-1">
                  {activeHeadOptions.map((opt) => {
                    const on = (formState.headBuckets[opt.key] || 0) > 0;
                    const fee = opt.fee || 0;
                    return (
                      <OptionButton
                        key={opt.key}
                        selected={on}
                        onClick={() => handleHeadSelect(opt.key)}
                        label={opt.labelAz}
                        sub={fee > 0 ? `+${fee * formState.qty} AZN` : "Pulsuz"}
                        subGreen={fee === 0}
                      />
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Tarix, vaxt, qeydlər – mobil */}
            <div className="xl:hidden flex flex-col gap-2">
              <SectionCard label="Kəsim tarixi" Icon={CalendarDays}>
                <CalendarBlock
                  selectedDate={formState.selectedDate}
                  onDateSelect={(date) =>
                    dispatch({ type: "SET_SELECTED_DATE", payload: date })
                  }
                  maxSlaughterDays={maxSlaughterDays}
                  quickDateTodayEnabled={quickDateTodayEnabled}
                  quickDateTomorrowEnabled={quickDateTomorrowEnabled}
                />
              </SectionCard>
              <SectionCard label="Çatdırılma vaxtı" Icon={Clock}>
                <TimeSlotBlock
                  timeSlot={formState.timeSlot}
                  onTimeSlotSelect={(slot) =>
                    dispatch({ type: "SET_TIME_SLOT", payload: slot })
                  }
                  windows={visibleWindows}
                  cols="grid-cols-3"
                />
              </SectionCard>
              <SectionCard label="Qeydlər">
                <div className="p-2">
                  <textarea
                    value={formState.notes}
                    onChange={(e) =>
                      dispatch({ type: "SET_NOTES", payload: e.target.value })
                    }
                    placeholder="Xüsusi istəklərinizi qeyd edin..."
                    rows={3}
                    className="field-input resize-none w-full text-sm"
                  />
                </div>
              </SectionCard>
            </div>
          </div>

          {/* SAĞ TƏRƏF (yalnız xl+) */}
          <div className="hidden xl:flex flex-col gap-2">
            {weightOptions.length > 0 && (
              <SectionCard label="Diri çəki kateqoriyası">
                <div className="p-2 grid grid-cols-1 gap-1.5">
                  {weightOptions.map((w) => (
                    <WeightPill
                      key={w.key || w.labelAz}
                      weight={w}
                      selectedWeight={selectedWeight}
                      onSelect={(w) =>
                        dispatch({
                          type: "SET_SELECTED_WEIGHT_KEY",
                          payload: w.key,
                        })
                      }
                    />
                  ))}
                </div>
              </SectionCard>
            )}
            <SectionCard label="Kəsim tarixi" Icon={CalendarDays}>
              <CalendarBlock
                selectedDate={formState.selectedDate}
                onDateSelect={(date) =>
                  dispatch({ type: "SET_SELECTED_DATE", payload: date })
                }
                maxSlaughterDays={maxSlaughterDays}
                quickDateTodayEnabled={quickDateTodayEnabled}
                quickDateTomorrowEnabled={quickDateTomorrowEnabled}
              />
            </SectionCard>
            <SectionCard label="Çatdırılma vaxtı" Icon={Clock}>
              <TimeSlotBlock
                timeSlot={formState.timeSlot}
                onTimeSlotSelect={(slot) =>
                  dispatch({ type: "SET_TIME_SLOT", payload: slot })
                }
                windows={visibleWindows}
                cols="grid-cols-2"
              />
            </SectionCard>
            <SectionCard label="Qeydlər">
              <div className="p-2">
                <textarea
                  value={formState.notes}
                  onChange={(e) =>
                    dispatch({ type: "SET_NOTES", payload: e.target.value })
                  }
                  placeholder="Xüsusi istəklərinizi qeyd edin..."
                  rows={2}
                  className="field-input resize-none w-full text-sm"
                />
              </div>
            </SectionCard>
            <PriceSummary
              totalPrice={totalPrice}
              animal={animal}
              qty={formState.qty}
              mode={formState.mode}
              maxShares={maxShares}
              partsFee={partsFee}
              selectedWeight={selectedWeight}
              onContinue={handleContinue}
            />
          </div>
        </div>
      </div>

      {/* Mobil alt aksiya paneli */}
      <div
        className="xl:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ background: "linear-gradient(90deg,#1B5E20,#2E7D32)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.12em]">
            Cəmi məbləğ
          </p>
          <p className="text-xl font-black text-white leading-tight tracking-tight">
            {totalPrice} AZN
          </p>
          {!isSingle && (
            <p className="text-[10px] text-white/40 truncate">
              {formState.mode === "serikli"
                ? `${formState.qty}/${maxShares} pay`
                : `${formState.qty} × ${effectivePrice} AZN`}
            </p>
          )}
        </div>
        <button
          onClick={handleContinue}
          className="flex-shrink-0 bg-white text-primary rounded-xl py-3 px-5 text-[13px] font-extrabold border-none cursor-pointer whitespace-nowrap active:scale-95 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
        >
          Davam et →
        </button>
      </div>
    </div>
  );
}

// ============================================================
//  6.  KÖMƏKÇİ UI KOMPONENTLƏRİ (səhifə daxilində)
// ============================================================

/** Heyvan kartı (mobil və desktop üçün) */
function AnimalCard({
  animal,
  qty,
  maxQty,
  maxShares,
  mode,
  isSingle,
  effectivePrice,
  basePrice,
  onQtyChange,
  onModeChange,
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-stretch min-h-[90px]">
        <div
          className="w-[110px] sm:w-[130px] flex-shrink-0 overflow-hidden"
          style={{
            background: "linear-gradient(145deg,#e8f5e9 0%,#c8e6c9 100%)",
          }}
        >
          {animal.imageUrl ? (
            <img
              src={animal.imageUrl}
              alt={animal.nameAz}
              className="w-full h-full object-contain"
              style={{ transform: "scale(1.06)" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Beef
                className="w-8 h-8"
                style={{ color: "#1B5E20", opacity: 0.3 }}
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between px-3 py-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">
              Seçilmiş heyvan
            </p>
            <h2 className="text-[15px] font-extrabold text-text-primary mt-0.5 leading-tight">
              {animal.nameAz}
            </h2>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-black text-primary leading-none tracking-tight">
                {effectivePrice}
              </span>
              <span className="text-[11px] font-semibold text-text-muted ml-0.5">
                AZN{!isSingle ? " / əd." : ""}
              </span>
            </div>
          </div>
          {!isSingle && (
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">
                Miqdar
              </span>
              <div className="flex items-center gap-1.5">
                <QtyBtn onClick={() => onQtyChange(-1)} disabled={qty <= 1}>
                  −
                </QtyBtn>
                <span className="w-6 text-center text-lg font-black text-primary">
                  {qty}
                </span>
                <QtyBtn
                  onClick={() => onQtyChange(1)}
                  disabled={
                    mode === "serikli" ? qty >= maxShares : qty >= maxQty
                  }
                >
                  +
                </QtyBtn>
              </div>
            </div>
          )}
        </div>
      </div>
      {!isSingle && (
        <div
          className="flex items-center justify-between px-3 py-1.5 border-t border-[#f0f0f0]"
          style={{ background: "rgba(27,94,32,0.04)" }}
        >
          <span className="text-[10px] text-text-muted font-medium">
            {mode === "serikli"
              ? `${qty}/${maxShares} pay`
              : `${qty} × ${effectivePrice} AZN`}
          </span>
          <span className="text-[12px] font-extrabold text-primary">
            = {basePrice} AZN
          </span>
        </div>
      )}
    </div>
  );
}

/** Bölmə kartı (xəta göstərmə imkanı) */
function SectionCard({ label, Icon, error, hideOnXl = false, children }) {
  return (
    <div
      className={`bg-white rounded-xl overflow-hidden ${
        hideOnXl ? "xl:hidden" : ""
      } ${
        error
          ? "shadow-[0_0_0_1.5px_#f87171]"
          : "shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_8px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          error ? "border-red-100 bg-red-50/50" : "border-[#f0f0f0]"
        }`}
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
//
