"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, AlertTriangle, Beef } from "lucide-react";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useMobileMenu } from "../../../context/MobileMenuContext";
import { useOrder } from "../../../context/OrderContext";
import api from "../../../lib/api";

// Sabitlər
const TIME_SLOTS = ["12:00-15:00", "15:00-18:00", "18:00-21:00"];
const MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyn",
  "İyl",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const tomorrow = () => {
  const d = today();
  d.setDate(d.getDate() + 1);
  return d;
};

// Yardımçı funksiyalar
const fmt = (d) =>
  d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "";
const meatWeight = (label) => {
  const nums = (label || "").match(/\d+(?:[.,]\d+)?/g);
  if (!nums) return null;
  const vals = nums.map((n) => parseFloat(n.replace(",", ".")));
  const lo = Math.floor(Math.min(...vals) * 0.5);
  const hi = Math.ceil(Math.max(...vals) * 0.5);
  return lo === hi ? `~${lo} kq ət` : `~${lo}–${hi} kq ət`;
};
const validToday = (windows) => {
  const now = new Date();
  const min = now.getHours() * 60 + now.getMinutes() + 240;
  return windows.filter((s) => parseInt(s.split(":")[0]) * 60 > min);
};

// Əsas komponent
export default function QuantityPage() {
  const router = useRouter();
  const { openMenu } = useMobileMenu();
  const { updateOrder } = useOrder();

  // ── State ──
  const [animal, setAnimal] = useState(null);
  const [deliveryWindows, setDeliveryWindows] = useState(TIME_SLOTS);
  const [form, setForm] = useState({
    mode: "tam",
    qty: 1,
    cutStyle: null,
    headOption: null,
    feetOption: null,
    weightKey: null,
    date: tomorrow(),
    timeSlot: TIME_SLOTS[0],
    notes: "",
  });
  const [settings, setSettings] = useState({
    maxDays: 14,
    showToday: true,
    showTomorrow: true,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── Yükləmə ──
  useEffect(() => {
    const a = localStorage.getItem("selected_animal");
    const dw = localStorage.getItem("delivery_windows");
    const flow = sessionStorage.getItem("qurbanet_flow");
    if (!a || !flow) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(a);
      setAnimal(parsed);
      if (parsed.orderMode === "serikli" && parsed.serikliEnabled) {
        setForm((f) => ({ ...f, mode: "serikli" }));
      }
      if (dw) {
        const w = JSON.parse(dw);
        if (w.length) setDeliveryWindows(w);
      }
      // Restore session
      const saved = sessionStorage.getItem("qurbanet_qty_state");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.animalId === parsed._id) {
          setForm((f) => ({
            ...f,
            qty: s.qty || f.qty,
            mode: s.mode || f.mode,
            cutStyle: s.cutStyle || f.cutStyle,
            headOption: s.headOption || f.headOption,
            feetOption: s.feetOption || f.feetOption,
            weightKey: s.weightKey || f.weightKey,
            date: s.date ? new Date(s.date) : f.date,
            timeSlot: s.timeSlot || f.timeSlot,
            notes: s.notes || f.notes,
          }));
        }
      }
      // İlk weight
      const ws = parsed.weights || parsed.weightOptions || [];
      if (ws.length && !form.weightKey) {
        setForm((f) => ({ ...f, weightKey: ws[0].key }));
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  // Settings
  useEffect(() => {
    api
      .get("/app-config/settings")
      .then((res) => {
        const d = res.data?.data;
        if (d)
          setSettings({
            maxDays: d.maxSlaughterDays || 14,
            showToday: d.quickDateTodayEnabled !== false,
            showTomorrow: d.quickDateTomorrowEnabled !== false,
          });
      })
      .catch(() => {});
  }, []);

  // Avtosaxlama
  useEffect(() => {
    if (!animal) return;
    sessionStorage.setItem(
      "qurbanet_qty_state",
      JSON.stringify({
        animalId: animal._id,
        ...form,
        date: form.date ? form.date.toISOString() : null,
      }),
    );
  }, [form, animal]);

  // Törəmələr
  const weights = animal?.weights || animal?.weightOptions || [];
  const selectedWeight = useMemo(
    () => weights.find((w) => w.key === form.weightKey) || weights[0] || null,
    [weights, form.weightKey],
  );
  const effectivePrice = selectedWeight?.price || animal?.pricePerShare || 0;
  const maxQty = Number(animal?.maxQuantity) || 1;
  const maxShares = Number(animal?.totalShares) || 1;
  const isSerikli = form.mode === "serikli";
  const basePrice = isSerikli
    ? (effectivePrice / maxShares) * form.qty
    : effectivePrice * form.qty;
  const cutFee = form.cutStyle
    ? (animal?.cutStyleOptions || []).find((c) => c.key === form.cutStyle)
        ?.fee || 0
    : 0;
  const headFee = form.headOption
    ? (animal?.headOptions || []).find((h) => h.key === form.headOption)?.fee ||
      0
    : 0;
  const feetFee = form.feetOption
    ? (animal?.feetOptions || []).find((f) => f.key === form.feetOption)?.fee ||
      0
    : 0;
  const totalPrice =
    basePrice +
    cutFee * form.qty +
    headFee * form.qty +
    feetFee * (form.feetOption ? form.qty * 4 : 0);
  const totalPriceFixed = totalPrice.toFixed(0);

  const cutError =
    submitAttempted && animal?.cutStyleOptions?.length > 0 && !form.cutStyle;
  const headError =
    submitAttempted && animal?.hasHeadOption !== false && !form.headOption;

  const todayMid = today();
  const tomorrowMid = tomorrow();
  const isToday = form.date?.toDateString() === todayMid.toDateString();
  const isTomorrow = form.date?.toDateString() === tomorrowMid.toDateString();
  const visibleWindows = isToday
    ? validToday(deliveryWindows)
    : deliveryWindows;

  // Handlers
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const handleQty = (delta) => {
    const max = isSerikli ? maxShares : maxQty;
    setForm((f) => ({ ...f, qty: Math.max(1, Math.min(max, f.qty + delta)) }));
  };

  const handleContinue = useCallback(() => {
    setSubmitAttempted(true);
    if (!form.date) return alert("Kəsim tarixini seçin.");
    if (!form.timeSlot) return alert("Vaxt seçin.");
    if (cutError) return;
    if (headError) return alert("Baş seçimi edin.");
    const order = {
      animal,
      ...form,
      selectedWeight,
      totalPrice: parseFloat(totalPriceFixed),
    };
    if (isSerikli) {
      updateOrder({
        ...order,
        deliveryType: "ozum",
        address: "",
        charityDist: null,
        deliveryFee: 0,
      });
      router.push("/order/contact");
    } else {
      updateOrder(order);
      router.push("/order/distribution");
    }
  }, [
    form,
    animal,
    selectedWeight,
    totalPriceFixed,
    cutError,
    headError,
    isSerikli,
    updateOrder,
    router,
  ]);

  // ── Render ──
  if (!animal)
    return (
      <div className="flex justify-center items-center h-screen">
        Yüklənir...
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f5f2]">
      <BackHeader
        title="Qurbanliq"
        onBack={() => router.replace("/")}
        onMenu={openMenu}
      />
      <StepHeader currentStep={1} />

      <div className="flex-1 overflow-y-auto p-3 xl:grid xl:grid-cols-[1fr_280px] xl:gap-4 max-w-7xl mx-auto w-full">
        {/* Sol hissə */}
        <div className="space-y-3">
          {/* Heyvan kartı */}
          <div className="bg-white rounded-xl shadow-sm flex items-stretch">
            <div className="w-28 bg-gradient-to-br from-green-50 to-green-100 rounded-l-xl flex items-center justify-center">
              {animal.imageUrl ? (
                <img
                  src={animal.imageUrl}
                  alt={animal.nameAz}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Beef className="w-10 h-10 text-green-800/30" />
              )}
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  SEÇİLMİŞ HEYVAN
                </div>
                <h2 className="text-lg font-bold">{animal.nameAz}</h2>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-green-700">
                    {effectivePrice}
                  </span>
                  <span className="text-xs text-gray-500">AZN</span>
                </div>
              </div>
              {maxQty > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    Miqdar
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQty(-1)}
                      disabled={form.qty <= 1}
                      className="w-8 h-8 rounded-lg bg-green-700 text-white disabled:bg-gray-200 disabled:text-gray-400 text-lg font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-lg font-bold">
                      {form.qty}
                    </span>
                    <button
                      onClick={() => handleQty(1)}
                      disabled={
                        isSerikli ? form.qty >= maxShares : form.qty >= maxQty
                      }
                      className="w-8 h-8 rounded-lg bg-green-700 text-white disabled:bg-gray-200 disabled:text-gray-400 text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Şərikli seçimi (əgər varsa) */}
          {!animal.orderMode &&
            animal.totalShares > 1 &&
            animal.serikliEnabled && (
              <div className="bg-white rounded-xl shadow-sm p-3">
                <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">
                  Sifariş növü
                </div>
                <div className="flex gap-2">
                  {["tam", "serikli"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setField("mode", m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.mode === m ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      {m === "tam" ? "Tam heyvan" : `Şərikli (/${maxShares})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Diri çəki (yalnız mobil) */}
          {weights.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-3 xl:hidden">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">
                Diri çəki
              </div>
              <div className="grid grid-cols-2 gap-2">
                {weights.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => setField("weightKey", w.key)}
                    className={`p-2 rounded-lg border-2 text-left text-sm ${form.weightKey === w.key ? "border-green-700 bg-green-50" : "border-gray-200"}`}
                  >
                    <div className="font-semibold">
                      {w.labelAz || w.label} — {w.price} AZN
                    </div>
                    <div className="text-xs text-gray-500">
                      {meatWeight(w.labelAz || w.label)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Doğrama üsulu */}
          {(animal.cutStyleOptions || []).length > 0 && (
            <div
              className={`bg-white rounded-xl shadow-sm p-3 ${cutError ? "ring-2 ring-red-400" : ""}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  Doğrama üsulu
                </span>
                {cutError && (
                  <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Seçin
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {(animal.cutStyleOptions || []).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setField("cutStyle", c.key)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border-2 ${form.cutStyle === c.key ? "border-green-700 bg-green-50" : "border-gray-200"}`}
                  >
                    <span className="font-medium text-sm">{c.labelAz}</span>
                    {c.fee > 0 && (
                      <span className="text-xs text-green-700">
                        +{c.fee * form.qty} AZN
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Baş & Ayaqlar */}
          {animal.hasHeadOption !== false &&
            (animal.headOptions || []).filter((h) => h.isActive !== false)
              .length > 0 && (
              <div
                className={`bg-white rounded-xl shadow-sm p-3 ${headError ? "ring-2 ring-red-400" : ""}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    Baş & Ayaqlar
                  </span>
                  {headError && (
                    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Seçin
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {(animal.headOptions || [])
                    .filter((h) => h.isActive !== false)
                    .map((h) => (
                      <button
                        key={h.key}
                        onClick={() => setField("headOption", h.key)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border-2 ${form.headOption === h.key ? "border-green-700 bg-green-50" : "border-gray-200"}`}
                      >
                        <span className="font-medium text-sm">{h.labelAz}</span>
                        <span className="text-xs text-green-700">
                          {h.fee > 0 ? `+${h.fee * form.qty} AZN` : "Pulsuz"}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

          {/* Tarix, vaxt, qeyd (mobil) */}
          <div className="xl:hidden space-y-3">
            <DateSection
              form={form}
              setField={setField}
              settings={settings}
              visibleWindows={visibleWindows}
            />
            <NoteSection
              notes={form.notes}
              setNotes={(v) => setField("notes", v)}
            />
          </div>
        </div>

        {/* Sağ hissə (desktop) */}
        <div className="hidden xl:block space-y-3">
          {weights.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-3">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">
                Diri çəki
              </div>
              <div className="space-y-2">
                {weights.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => setField("weightKey", w.key)}
                    className={`w-full p-2 rounded-lg border-2 text-left ${form.weightKey === w.key ? "border-green-700 bg-green-50" : "border-gray-200"}`}
                  >
                    <div className="font-semibold text-sm">
                      {w.labelAz || w.label} — {w.price} AZN
                    </div>
                    <div className="text-xs text-gray-500">
                      {meatWeight(w.labelAz || w.label)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <DateSection
            form={form}
            setField={setField}
            settings={settings}
            visibleWindows={visibleWindows}
          />
          <NoteSection
            notes={form.notes}
            setNotes={(v) => setField("notes", v)}
          />

          {/* Ümumi məbləğ */}
          <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-xl shadow-lg p-4 text-white">
            <div className="text-[10px] font-bold uppercase opacity-60">
              Ümumi məbləğ
            </div>
            <div className="text-3xl font-black">
              {totalPriceFixed}{" "}
              <span className="text-lg font-bold opacity-80">AZN</span>
            </div>
            <div className="text-xs opacity-60 mt-1">
              {isSerikli
                ? `${form.qty}/${maxShares} pay`
                : `${form.qty} × ${effectivePrice} AZN`}
            </div>
            <button
              onClick={handleContinue}
              className="w-full mt-3 bg-white text-green-800 rounded-lg py-2.5 font-extrabold text-sm"
            >
              Davam et →
            </button>
          </div>
        </div>
      </div>

      {/* Mobil alt panel */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-800 to-green-700 p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase opacity-60">Cəmi</div>
          <div className="text-xl font-black text-white">
            {totalPriceFixed} AZN
          </div>
        </div>
        <button
          onClick={handleContinue}
          className="bg-white text-green-800 px-6 py-2.5 rounded-lg font-extrabold text-sm"
        >
          Davam et →
        </button>
      </div>
    </div>
  );
}

// ── Alt komponentlər ──
function DateSection({ form, setField, settings, visibleWindows }) {
  const [showCal, setShowCal] = useState(false);
  const [calYear, setCalYear] = useState(
    form.date?.getFullYear() || new Date().getFullYear(),
  );
  const [calMonth, setCalMonth] = useState(
    form.date?.getMonth() || new Date().getMonth(),
  );

  const todayMid = today();
  const tomorrowMid = tomorrow();
  const isToday = form.date?.toDateString() === todayMid.toDateString();
  const isTomorrow = form.date?.toDateString() === tomorrowMid.toDateString();
  const isCustom = form.date && !isToday && !isTomorrow;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const maxDate = new Date(todayMid);
  maxDate.setDate(maxDate.getDate() + settings.maxDays);

  return (
    <div className="bg-white rounded-xl shadow-sm p-3">
      <div className="text-[10px] font-bold uppercase text-gray-400 mb-2 flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" /> Kəsim tarixi
      </div>
      <div className="space-y-2">
        <div
          className={`grid gap-2 ${settings.showToday && settings.showTomorrow ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {[
            {
              label: "Bu gün",
              date: todayMid,
              active: isToday,
              enabled: settings.showToday,
            },
            {
              label: "Sabah",
              date: tomorrowMid,
              active: isTomorrow,
              enabled: settings.showTomorrow,
            },
          ]
            .filter((o) => o.enabled)
            .map((o) => (
              <button
                key={o.label}
                onClick={() => {
                  setField("date", o.date);
                  setShowCal(false);
                }}
                className={`p-2 rounded-lg border-2 text-sm font-semibold ${o.active ? "border-green-700 bg-green-50" : "border-gray-200"}`}
              >
                {o.label}{" "}
                <span className="text-xs font-normal text-gray-500">
                  {o.date.getDate()} {MONTHS[o.date.getMonth()]}
                </span>
              </button>
            ))}
        </div>
        <button
          onClick={() => setShowCal(!showCal)}
          className={`w-full p-2 rounded-lg border-2 text-sm font-semibold flex justify-between ${isCustom ? "border-green-700 bg-green-50" : "border-gray-200"}`}
        >
          <span>{isCustom ? fmt(form.date) : "Başqa tarix"}</span>
          <span>{showCal ? "▲" : "▼"}</span>
        </button>
        {showCal && (
          <div className="border rounded-lg p-2">
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else setCalMonth((m) => m - 1);
                }}
                className="px-2 py-1 bg-gray-100 rounded"
              >
                ‹
              </button>
              <span className="font-bold text-sm">
                {MONTHS[calMonth]} {calYear}
              </span>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else setCalMonth((m) => m + 1);
                }}
                className="px-2 py-1 bg-gray-100 rounded"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-gray-400 mb-1">
              {["B", "Ç", "Ç", "C", "C", "Ş", "B"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d, i) => {
                const cell = d ? new Date(calYear, calMonth, d) : null;
                const disabled = !cell || cell < todayMid || cell > maxDate;
                const sel =
                  cell &&
                  form.date &&
                  cell.toDateString() === form.date.toDateString();
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        setField("date", cell);
                        setShowCal(false);
                      }
                    }}
                    className={`h-7 rounded text-sm ${sel ? "bg-green-700 text-white font-bold" : disabled ? "text-gray-300" : "hover:bg-gray-100"}`}
                  >
                    {d || ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="text-[10px] font-bold uppercase text-gray-400 mt-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Vaxt
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {visibleWindows.map((s) => (
            <button
              key={s}
              onClick={() => setField("timeSlot", s)}
              className={`p-2 rounded-lg border-2 text-sm font-semibold ${form.timeSlot === s ? "border-green-700 bg-green-50" : "border-gray-200"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteSection({ notes, setNotes }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3">
      <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">
        Qeydlər
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Xüsusi istəklərinizi qeyd edin..."
        rows={2}
        className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>
  );
}
