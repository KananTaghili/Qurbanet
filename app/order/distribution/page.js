"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Truck,
  Store,
  MapPin,
  Home,
  HeartHandshake,
  Heart,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Plus,
  X,
} from "lucide-react";
import BackHeader from "../../../components/BackHeader";
import StepHeader from "../../../components/StepHeader";
import { useOrder } from "../../../context/OrderContext";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";
import { t } from "../../../lib/i18n";

const DIST_STATE_KEY = "qurbanet_dist_state";

// Azərbaycan üçün etibarlı operator prefiksləri (+994-dən sonra ilk 2 rəqəm)
const AZ_OPERATORS = [
  "10",       // Bakcell
  "12",       // Bakı şəhər xətti
  "18",       // Azerfon
  "20",       // Azercell (köhnə)
  "40", "41", // Azercell
  "44",       // Bakcell
  "50", "51", // Azercell
  "55",       // Bakcell
  "60",       // Naxtel
  "70", "77", // Nar Mobile
  "99",       // Bakcell
];

const formatPhone = (input) => {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.startsWith("0")) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

const isValidAzPhone = (formatted) => {
  const d = formatted.replace(/\D/g, "");
  if (d.length === 9) return AZ_OPERATORS.includes(d.slice(0, 2));
  if (d.length === 10 && d.startsWith("0")) return AZ_OPERATORS.includes(d.slice(1, 3));
  return false;
};

const MapLocationPicker = dynamic(
  () => import("../../../components/MapLocationPicker"),
  { ssr: false },
);

const DELIVERY_KEYS = ["catdirilsin", "ozum"];
const CHARITY_KEYS = ["usaqlar_evi", "qocalar_evi", "ehtiyac_sahibleri"];

const OPTION_META = {
  catdirilsin: { Icon: Truck, color: "#16a34a", light: "#f0fdf4" },
  ozum: { Icon: Store, color: "#374151", light: "#f9fafb" },
  usaqlar_evi: { Icon: Home, color: "#1B5E20", light: "#E8F5E9" },
  qocalar_evi: { Icon: Heart, color: "#6A1B9A", light: "#F3E5F5" },
  ehtiyac_sahibleri: {
    Icon: HeartHandshake,
    color: "#1565C0",
    light: "#E3F2FD",
  },
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-border shadow-card overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export default function DistributionPage() {
  const router = useRouter();
  const { order, updateOrder, isLoaded } = useOrder();
  const { user } = useAuth();
  const { lang } = useLanguage();

  const distLabel = (key, data) => {
    const iKey = `distLabel_${key}`;
    const val = t(lang, iKey);
    return val !== iKey ? val : data?.labelAz || key;
  };

  const [selectedKey, setSelectedKey] = useState(null);
  const [optionData, setOptionData] = useState({});
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [meatPickupLocation, setMeatPickupLocation] = useState(null);
  const [phones, setPhones] = useState([""]);
  const [addressNote, setAddressNote] = useState("");
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const flowActive = sessionStorage.getItem("qurbanet_flow");
      if (!order || !flowActive) {
        router.replace("/");
        return;
      }
      if (order.mode === "serikli") {
        router.replace("/order/contact");
        return;
      }
    } catch {
      router.replace("/");
      return;
    }

    try {
      const saved = sessionStorage.getItem(DIST_STATE_KEY);
      let hasSavedPhones = false;
      if (saved) {
        const s = JSON.parse(saved);
        if (s.selectedKey) setSelectedKey(s.selectedKey);
        if (s.pickedLocation) {
          setPickedLocation(s.pickedLocation);
          setAddress(s.pickedLocation.address || "");
        }
        if (Array.isArray(s.phones) && s.phones.length > 0) {
          setPhones(s.phones);
          hasSavedPhones = true;
        }
        if (typeof s.addressNote === "string") setAddressNote(s.addressNote);
      }
      if (!hasSavedPhones && user?.phone) {
        const stripped = user.phone.replace(/^\+994/, "").replace(/\D/g, "");
        if (stripped) setPhones([formatPhone(stripped)]);
      }
    } catch (_) {}
    hasRestoredRef.current = true;

    api
      .get("/app-config/settings")
      .then((res) => {
        const loc = res.data?.data?.meatPickupLocation;
        if (loc?.address) setMeatPickupLocation(loc);
      })
      .catch(() => {});

    api
      .get("/app-config/delivery-options")
      .then((res) => {
        const options = res.data?.data?.deliveryOptions || [];
        const animalId = order?.animal?._id;

        const delivOpt = options.find(
          (o) =>
            o.key === "catdirilsin" ||
            o.key === "delivery" ||
            o.type === "home",
        );
        // Helper: get effective fee for an option+animal from categorySpecificPrices
        const effectiveFee = (opt) => {
          const specific = (opt?.categorySpecificPrices || []).find(
            (sp) => (sp.categoryId?._id || sp.categoryId) === animalId
          );
          return specific != null ? specific.price : (opt?.basePrice ?? 0);
        };

        const fee = effectiveFee(delivOpt);
        setDeliveryFee(fee);

        const data = {
          catdirilsin: { labelAz: "Sizə çatdırılsın", fee },
          ozum: { labelAz: "Özüm götürəcəm", fee: 0 },
        };

        const charityOpts = CHARITY_KEYS.map((key) =>
          options.find((o) => o.key === key),
        ).filter((o) => {
          if (!o) return false;
          const cats = o.applicableCategories || [];
          if (cats.length === 0) return false;
          return cats.some((c) => (c._id || c) === animalId);
        });

        charityOpts.forEach((o) => {
          data[o.key] = {
            labelAz: o.labelAz,
            fee: effectiveFee(o),
            disabled: !o.isActive,
          };
        });

        setOptionData(data);
      })
      .catch(() => {});
  }, [isLoaded, order, router]);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    try {
      sessionStorage.setItem(
        DIST_STATE_KEY,
        JSON.stringify({ selectedKey, pickedLocation, phones, addressNote }),
      );
    } catch (_) {}
  }, [selectedKey, pickedLocation, phones, addressNote]);

  const handleMapConfirm = useCallback((loc) => {
    setPickedLocation(loc);
    setAddress(loc.address);
    setShowMap(false);
  }, []);

  if (!isLoaded || !order) return null;

  const qty = order.qty || 1;
  const maxPortionSplit = order.animal?.hasPortionSplit
    ? Number(order.animal?.maxPortionSplit) || 1
    : 1;
  const total = qty * maxPortionSplit;

  const needsLocation = selectedKey === "catdirilsin";
  const needsPhone = selectedKey === "catdirilsin" || selectedKey === "ozum";
  const deliveryKeys = DELIVERY_KEYS.filter((k) => k in optionData);
  const charityKeys = CHARITY_KEYS.filter((k) => k in optionData);

  const selectionOk = selectedKey !== null;
  const phonesValid = needsPhone
    ? phones.some((p) => isValidAzPhone(p)) &&
      phones.every((p) => !p.trim() || isValidAzPhone(p))
    : true;
  const addrOk = (!needsLocation || !!pickedLocation) && phonesValid;
  const canContinue = selectionOk && addrOk;

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!canContinue) return;

    const dist = { [selectedKey]: total };
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
      deliveryPhones: needsPhone
        ? phones
            .filter((p) => p.trim())
            .map((p) => {
              const d = p.replace(/\D/g, "");
              return "+994" + (d.startsWith("0") ? d.slice(1) : d);
            })
        : undefined,
      addressNote: needsLocation ? addressNote.trim() || undefined : undefined,
    };

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

    updateOrder(distPatch);
    router.push("/order/contact");
  };

  const selectedFee = selectedKey ? (optionData[selectedKey]?.fee ?? 0) : 0;
  const totalAmount = parseFloat(order.totalPrice || 0) + selectedFee;

  // Renders the radio option list (used in both mobile and desktop)
  const OptionList = () => (
    <div className="p-3 flex flex-col gap-2">
      {deliveryKeys.map((key) => {
        const meta = OPTION_META[key];
        const data = optionData[key] || {};
        const isSelected = selectedKey === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedKey(key)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 w-full text-left cursor-pointer transition-all ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-white hover:border-primary/30"
            }`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: meta.light }}
            >
              <meta.Icon className="w-5 h-5" style={{ color: meta.color }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-text-primary">
                {distLabel(key, data)}
              </div>
              <div
                className="text-xs font-semibold mt-0.5"
                style={{ color: meta.color }}
              >
                {(data.fee || 0) > 0 ? `+${data.fee} AZN` : t(lang, "free")}
              </div>
              {key === "catdirilsin" && (
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                  Yalnız Bakı və ətrafı
                </div>
              )}
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        );
      })}

      {charityKeys.length > 0 && (
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-bold text-text-secondary tracking-wide uppercase px-2 whitespace-nowrap">
            {t(lang, "charityAs")}
          </span>
          <div className="flex-1 border-t border-border" />
        </div>
      )}
      {charityKeys.map((key) => {
        const meta = OPTION_META[key];
        const data = optionData[key] || {};
        const isSelected = selectedKey === key;
        const isDisabled = data.disabled;
        return (
          <button
            key={key}
            type="button"
            onClick={() => !isDisabled && setSelectedKey(key)}
            disabled={isDisabled}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 w-full text-left transition-all ${
              isDisabled
                ? "border-border/50 bg-gray-50 cursor-not-allowed opacity-75"
                : isSelected
                  ? "border-primary bg-primary/5 cursor-pointer"
                  : "border-border bg-white hover:border-primary/30 cursor-pointer"
            }`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isDisabled ? "#f3f4f6" : meta.light }}
            >
              <meta.Icon
                className="w-5 h-5"
                style={{ color: isDisabled ? "#d1d5db" : meta.color }}
              />
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-bold ${isDisabled ? "text-text-muted" : "text-text-primary"}`}
              >
                {distLabel(key, data)}
              </div>
              <div
                className={`text-xs font-semibold mt-0.5 ${isDisabled ? "text-text-muted" : ""}`}
                style={{ color: isDisabled ? undefined : meta.color }}
              >
                {isDisabled
                  ? t(lang, "deactivated")
                  : (data.fee || 0) > 0
                    ? `+${data.fee} AZN`
                    : t(lang, "free")}
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isDisabled
                  ? "border-border/40"
                  : isSelected
                    ? "border-primary bg-primary"
                    : "border-border"
              }`}
            >
              {isSelected && !isDisabled && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  // Address + phone section (reused in mobile and desktop)
  const AddressSection = ({ className = "", phoneOnly = false }) => (
    <Card
      className={`${className} ${submitAttempted && !addrOk ? "ring-2 ring-red-400 border-transparent" : ""}`}
    >
      <div className="px-3 py-2 border-b border-border bg-surface-alt/40 flex items-center gap-1">
        <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase">
          {phoneOnly ? t(lang, "contactPhone") : t(lang, "deliveryAddress")}
        </span>
        <span className="text-sm font-black text-red-500 leading-none">*</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {!phoneOnly && (
          <>
            {/* Bakı/ətraf ərazilər xəbərdarlığı */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <span className="text-base shrink-0 mt-0.5">📍</span>
              <p className="text-[11px] font-semibold text-amber-800 leading-snug">
                Çatdırılma xidməti yalnız <span className="font-extrabold">Bakı və Bakı ətrafı ərazilər</span> üçün nəzərdə tutulub.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex items-center justify-center gap-2 w-full bg-primary-surface border border-primary/30 text-primary font-bold text-xs rounded-xl py-2.5 cursor-pointer hover:bg-primary-surface/80 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" /> {t(lang, "selectOnMap")}
            </button>

            {pickedLocation ? (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-emerald-700 mb-0.5">
                    {t(lang, "locationSelected")}
                  </p>
                  <p className="text-[11px] text-emerald-600 leading-snug">
                    {pickedLocation.address}
                  </p>
                </div>
              </div>
            ) : submitAttempted && !pickedLocation ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 text-[11px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{" "}
                {t(lang, "selectLocationError")}
              </div>
            ) : (
              <p className="text-[11px] text-text-muted italic text-center">
                {t(lang, "noLocation")}
              </p>
            )}
          </>
        )}

        <div className={`flex flex-col gap-1.5 ${!phoneOnly ? "border-t border-border pt-2 mt-1" : ""}`}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                {t(lang, "contactPhone")}{" "}
                <span className="text-sm font-black text-red-500 leading-none">*</span>
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
              <Plus className="w-3 h-3" /> {t(lang, "addPhone")}
            </button>
          </div>
          {phones.map((phone, idx) => {
            const isEmpty = submitAttempted && idx === 0 && !phone.trim();
            const isInvalid =
              submitAttempted && phone.trim() && !isValidAzPhone(phone);
            const hasError = isEmpty || isInvalid;
            return (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex-1 flex items-center bg-surface-alt border rounded-xl overflow-hidden transition-colors focus-within:bg-white ${
                      hasError
                        ? "border-red-400"
                        : "border-border focus-within:border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-2.5 border-r border-border bg-surface-alt shrink-0">
                      <span className="text-base leading-none">🇦🇿</span>
                      <span className="text-xs font-bold text-text-secondary">
                        +994
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhones((prev) =>
                          prev.map((p, i) =>
                            i === idx ? formatPhone(e.target.value) : p,
                          ),
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
                      onClick={() =>
                        setPhones((p) => p.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEmpty && (
                  <p className="text-[10px] text-red-500 font-semibold px-1">
                    {t(lang, "enterPhone")}
                  </p>
                )}
                {isInvalid && (
                  <p className="text-[10px] text-red-500 font-semibold px-1">
                    {t(lang, "validAZPhone")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <textarea
          value={addressNote}
          onChange={(e) => setAddressNote(e.target.value)}
          placeholder={t(lang, "addressNotePlaceholder")}
          rows={2}
          className="w-full bg-surface-alt border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:bg-white transition-colors resize-none"
        />
      </div>
    </Card>
  );

  // Pickup location card
  const PickupCard = ({ className = "" }) => (
    <Card className={className}>
      <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
        <span className="text-[10px] font-bold text-text-secondary tracking-wide uppercase">
          {t(lang, "pickupLocation")}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <Store className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700 mb-0.5">
              {t(lang, "pickupHere")}
            </p>
            <p className="text-xs text-emerald-600 leading-snug">
              {meatPickupLocation?.address}
            </p>
          </div>
        </div>
        {meatPickupLocation?.lat && meatPickupLocation?.lng && (
          <a
            href={`https://www.google.com/maps?q=${meatPickupLocation.lat},${meatPickupLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-primary/30 text-primary font-bold text-xs rounded-xl py-2 bg-primary-surface hover:bg-primary-surface/80 transition-all"
          >
            <MapPin className="w-3.5 h-3.5" /> {t(lang, "openGoogleMaps")}
          </a>
        )}
      </div>
    </Card>
  );

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
        <BackHeader
          title={t(lang, "distribution")}
          onBack={() => router.push("/order/quantity")}
        />
        <StepHeader currentStep={2} />

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-6 pt-[124px] lg:pt-0">
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3
                          lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]
                          lg:gap-5 lg:items-start"
          >
            {/* ════ LEFT ════ */}
            <div className="flex flex-col gap-3">
              <Card
                className={
                  submitAttempted && !selectionOk
                    ? "ring-2 ring-red-400 border-transparent"
                    : ""
                }
              >
                <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                  <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide uppercase">
                    {t(lang, "distMethod")}
                  </span>
                </div>

                {submitAttempted && !selectionOk && (
                  <div className="mx-3 mt-2 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 text-[11px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {t(lang, "selectDelivery")}
                  </div>
                )}

                {OptionList()}
              </Card>

              {/* Pickup info — mobile */}
              {selectedKey === "ozum" && meatPickupLocation && (
                PickupCard({ className: "lg:hidden" })
              )}

              {/* Address — mobile */}
              {needsLocation && AddressSection({ className: "lg:hidden" })}
              {selectedKey === "ozum" && AddressSection({ className: "lg:hidden", phoneOnly: true })}
            </div>

            {/* ════ RIGHT — desktop ════ */}
            <div className="hidden lg:flex flex-col gap-3">
              {selectedKey === "ozum" && meatPickupLocation && PickupCard({})}
              {needsLocation && AddressSection({})}
              {selectedKey === "ozum" && AddressSection({ phoneOnly: true })}

              <Card>
                <div className="px-3 py-2 border-b border-border bg-surface-alt/40">
                  <span className="text-[10px] font-bold text-text-secondary tracking-wide uppercase">
                    {t(lang, "orderSummaryCard")}
                  </span>
                </div>

                {/* Animal base — subtract cut/head/feet fees from totalPrice */}
                {(() => {
                  const cutFee = (order.animal?.cutStyleOptions || []).reduce(
                    (s, cs) => s + (order.cutStyles?.[cs.key] || 0) * (cs.fee || 0), 0);
                  const headFee = (order.animal?.headOptions || []).reduce(
                    (s, o) => s + (order.headBuckets?.[o.key] || 0) * (o.fee || 0), 0);
                  const feetFee = (order.animal?.feetOptions || []).reduce(
                    (s, o) => s + (order.feetBuckets?.[o.key] || 0) * (o.fee || 0), 0);
                  const basePrice = Math.max(0, (order.totalPrice || 0) - cutFee - headFee - feetFee);
                  const pricePerUnit = qty > 0 ? Math.round(basePrice / qty) : basePrice;
                  return (
                    <div className="border-b border-border">
                      <div className="px-3 pt-1.5 pb-0">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Heyvan Seçimi</span>
                      </div>
                      <div className="flex justify-between items-center px-3 py-1">
                        <div>
                          <p className="text-[11px] font-semibold text-text-primary">{order.animal?.nameAz}</p>
                          <p className="text-[10px] text-text-secondary mt-0.5">{qty} {t(lang, "pcsLabel")} × {pricePerUnit} AZN</p>
                        </div>
                        <span className="text-[11px] font-extrabold text-text-primary bg-surface-alt px-2 py-0.5 rounded-md border border-border/40 shrink-0">
                          {basePrice} AZN
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Cut styles */}
                {(() => {
                  const cutOpts = (order.animal?.cutStyleOptions || []).filter(cs => (order.cutStyles?.[cs.key] || 0) > 0);
                  if (!cutOpts.length) return null;
                  return (
                    <div className="border-b border-border">
                      <div className="px-3 pt-1.5 pb-0">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Doğrama üsulu</span>
                      </div>
                      {cutOpts.map(cs => {
                        const cnt = order.cutStyles[cs.key];
                        const fee = cs.fee * cnt;
                        return (
                          <div key={cs.key} className="flex justify-between items-center px-3 py-1">
                            <div>
                              <p className="text-[11px] font-semibold text-text-primary">{cs.labelAz}</p>
                              <p className="text-[10px] text-text-secondary">{cnt} {t(lang, "animalUnit")}</p>
                            </div>
                            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${fee === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-surface-alt text-text-primary border-border/40"}`}>
                              {fee === 0 ? t(lang, "free") : `+${fee} AZN`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Head + Feet */}
                {(() => {
                  const headOpts = (order.animal?.headOptions || []).filter(o => o.isActive !== false && (order.headBuckets?.[o.key] || 0) > 0);
                  const feetOpts = (order.animal?.feetOptions || []).filter(o => o.isActive !== false && (order.feetBuckets?.[o.key] || 0) > 0);
                  const allKeys = [...new Set([...headOpts.map(o => o.key), ...feetOpts.map(o => o.key)])];
                  if (!allKeys.length) return null;
                  return (
                    <div className="border-b border-border">
                      <div className="px-3 pt-1.5 pb-0">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Baş və Ayaqlar</span>
                      </div>
                      {allKeys.map(key => {
                        const opt = headOpts.find(o => o.key === key) || feetOpts.find(o => o.key === key);
                        const hCnt = order.headBuckets?.[key] || 0;
                        const fCnt = order.feetBuckets?.[key] || 0;
                        const parts = [];
                        if (hCnt > 0) parts.push(`${hCnt} ${t(lang, "headsLabel")}`);
                        if (fCnt > 0) parts.push(`${fCnt} ${t(lang, "feetLabel")}`);
                        const fee = opt.fee * (hCnt + fCnt);
                        return (
                          <div key={key} className="flex justify-between items-center px-3 py-1">
                            <div>
                              <p className="text-[11px] font-semibold text-text-primary">{opt.labelAz}</p>
                              <p className="text-[10px] text-text-secondary">{parts.join(" və ")}</p>
                            </div>
                            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${fee === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-surface-alt text-text-primary border-border/40"}`}>
                              {fee === 0 ? t(lang, "free") : `+${fee} AZN`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Delivery */}
                {selectedKey && (
                  <div className="border-b border-border">
                    <div className="px-3 pt-1.5 pb-0">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Çatdırılma</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-1">
                      <div>
                        <p className="text-[11px] font-semibold text-text-primary">
                          {optionData[selectedKey]?.labelAz || selectedKey}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          {t(lang, "deliveryFeeRow")}
                        </p>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${selectedFee === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-surface-alt text-text-primary border-border/40"}`}>
                        {selectedFee === 0 ? t(lang, "free") : `+${selectedFee} AZN`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-2.5 border-t border-border bg-surface-alt/30">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">
                      {t(lang, "totalAmountLabel")}:
                    </span>
                    <span className="text-xl font-extrabold text-primary">
                      {totalAmount.toFixed(0)} AZN
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!canContinue}
                    className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t(lang, "continue")}{" "}
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* MOBILE action bar */}
        <div className="fixed-action-bar lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-4 py-2.5 z-[999]">
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wide">
                {t(lang, "totalAmountLabel")}
              </span>
              <span className="text-xl font-black text-primary leading-tight">
                {totalAmount.toFixed(0)} AZN
              </span>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="flex-1 flex items-center justify-center gap-1 bg-primary text-white rounded-xl py-2.5 px-4 text-xs font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t(lang, "continue")}{" "}
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
