"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
  Plus,
  ChevronDown,
  ShieldCheck,
  Video,
  Users,
  ArrowRight,
  Play,
  CalendarDays,
  UsersRound,
  Share2,
  ChevronRight,
  ArrowLeft,
  X,
  Coins,
  Shield,
  Heart,
  CheckCircle,
  User,
} from "lucide-react";
import { useCharityLayout } from "./_context";
import {
  ANIMAL_IMG_FALLBACK,
  mapHomeCampaign,
  fmtDate,
  fmtAmt,
  fmtTime,
  avatarColor,
  initials,
} from "./_lib";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Tam şəffaflıq",
    desc: "Hər addımı izləyə bilərsiniz",
  },
  { icon: Video, title: "Kəsim videosu", desc: "Kəsimi canlı izləyin" },
  { icon: Heart, title: "Ehtiyac sahiblərinə", desc: "Birbaşa çatdırılır" },
  { icon: Users, title: "Birlikdə xeyir", desc: "Kiçik məbləğlə böyük xeyir" },
];

/* ─── Ring Progress ──────────────────────────────────────────── */
function RingProgress({ percent, type, img }) {
  const size = 188,
    r = 82;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(percent, 100));
  const dash = (p / 100) * circ;
  const id = `grad-${type.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div
      className="relative mx-auto mt-2"
      style={{ height: 218, width: "100%", maxWidth: 198 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none"
      >
        <defs>
          <linearGradient
            id={id}
            x1="94"
            y1="176"
            x2="94"
            y2="12"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4513ad" />
            <stop offset="58%" stopColor="#5f2bd1" />
            <stop offset="100%" stopColor="#7547e6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#d9cdfa"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset="0"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        className="absolute left-1/2 top-[19px] flex h-[150px] w-[150px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: "#fbfaff" }}
      >
        <img
          src={img}
          alt={type}
          className="max-h-[85%] max-w-[85%] object-contain"
          style={{ mixBlendMode: "multiply" }}
        />
      </div>
      <div
        className="absolute left-1/2 top-[164px] z-20 -translate-x-1/2 rounded-2xl px-6 py-1.5 leading-none text-white"
        style={{
          backgroundColor: "#551dc7",
          boxShadow: "0 8px 16px rgba(85,29,199,.25)",
          border: "3px solid white",
          fontSize: "22px",
          fontWeight: 900,
          letterSpacing: "-.04em",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {p}%
      </div>
    </div>
  );
}

/* ─── Animal Card ────────────────────────────────────────────── */
function AnimalCard({ animal, onDonate, onClick }) {
  const [copied, setCopied] = useState(false);
  const _target = animal.targetRaw || 0;
  const paidPct =
    _target > 0 ? Math.round((animal.shareMinRaw / _target) * 100) : 0;

  const handleShare = async (e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/charity?campaign=${animal.campaignId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  };

  return (
    <div
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-[#eee8f6] bg-white px-4 pb-4 pt-4 cursor-pointer transition-all hover:-translate-y-1"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.08)" }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-[20px] font-bold leading-none text-[#241a4d]">
          {animal.type}
        </h3>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600">
          Davam Edir
        </span>
      </div>
      <RingProgress
        percent={animal.progressPercent}
        type={animal.type}
        img={animal.img}
      />
      <div className="mt-1 text-center text-[13px] font-semibold text-[#281d55]">
        {animal.collected} / {animal.target}{" "}
        <span className="text-[#5521c6]">{animal.currency}</span>
      </div>
      <div
        className="mt-4 grid grid-cols-2 gap-3 rounded-2xl p-3"
        style={{ backgroundColor: "#f8f5ff" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white shadow-sm"
            style={{ color: "#5521c6" }}
          >
            <CalendarDays size={15} strokeWidth={2} />
          </span>
          <div className="text-[11px] font-medium text-[#241a4d]">
            {animal.startTime}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white shadow-sm"
            style={{ color: "#5521c6" }}
          >
            <UsersRound size={15} strokeWidth={2} />
          </span>
          <div className="text-[11px] font-medium text-[#241a4d]">
            {animal.participants} iştirakçı
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div
          className="mb-1.5 text-[11px] font-medium"
          style={{ color: "#8a7ba7" }}
        >
          Açan şəxs
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700 shrink-0">
            {animal.organizer
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </div>
          <div
            className="truncate text-[12px] font-medium"
            style={{ color: "#342760" }}
          >
            {animal.organizer}
          </div>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: "#5521c6" }}
          />
        </div>
      </div>
      <div className="mt-3">
        <div
          className="mb-1 text-[11px] font-medium"
          style={{ color: "#8a7ba7" }}
        >
          Ödədiyi məbləğ
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-bold text-[#241a4d]">
            {animal.shareMin} {animal.currency}
          </span>
          <span
            className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium"
            style={{ color: "#5521c6" }}
          >
            {paidPct}%
          </span>
        </div>
      </div>
      <div className="mt-3 border-t border-[#eee8f6] pt-3 grid grid-cols-2 gap-3">
        <div>
          <div
            className="mb-1 text-[11px] font-medium"
            style={{ color: "#8a7ba7" }}
          >
            Qalan məbləğ
          </div>
          <div className="text-[17px] font-bold text-[#241a4d]">
            {animal.totalMin}{" "}
            <span className="text-[11px] font-normal">AZN</span>
          </div>
        </div>
        <div>
          <div
            className="mb-1 text-[11px] font-medium"
            style={{ color: "#8a7ba7" }}
          >
            Ümumi məbləğ
          </div>
          <div className="text-[17px] font-bold text-[#241a4d]">
            {animal.totalMax}{" "}
            <span className="text-[11px] font-normal">AZN</span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-3 flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare(e);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9cdfa] py-2.5 text-xs font-semibold transition-all hover:bg-white"
          style={{ backgroundColor: "#f7f3ff", color: "#5521c6" }}
        >
          <Share2 size={13} strokeWidth={2} /> Dostlarını dəvət et
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDonate(animal);
          }}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}
        >
          İanə et →
        </button>
      </div>
      {copied && (
        <div
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#241a4d] px-5 py-3 text-center text-sm font-medium text-white"
          style={{ boxShadow: "0 18px 44px rgba(36,26,77,.28)" }}
        >
          Keçid kopyalandı
        </div>
      )}
    </div>
  );
}

/* ─── New Opening Placeholder Card ──────────────────────────── */
function NewOpeningPlaceholderCard({ onOpen, animal }) {
  const animalImg = animal
    ? animal.imageHome ||
      animal.image ||
      ANIMAL_IMG_FALLBACK[animal.nameAz] ||
      null
    : null;

  return (
    <div
      onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-[22px] border-2 border-dashed border-purple-200 bg-white/70 px-4 pb-4 pt-4 cursor-pointer transition-all hover:-translate-y-1 hover:border-purple-400 hover:bg-white"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.04)" }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        {animal ? (
          <div className="text-[17px] font-black leading-none tracking-[-.03em] text-[#6b4fa0]">
            {animal.nameAz}
          </div>
        ) : (
          <div className="h-[28px] w-20 rounded-lg bg-purple-100/50" />
        )}
        <div className="flex h-[26px] items-center rounded-full bg-purple-50 px-3 text-[11px] font-bold text-purple-300 whitespace-nowrap shrink-0">
          Açılış yoxdur
        </div>
      </div>
      <div
        className="relative mx-auto mt-2"
        style={{ height: 218, width: "100%", maxWidth: 198 }}
      >
        <svg
          width="188"
          height="188"
          viewBox="0 0 188 188"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none"
        >
          <circle
            cx="94"
            cy="94"
            r="82"
            fill="none"
            stroke="#ede9fe"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute left-1/2 top-[19px] flex h-[150px] w-[150px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-[#f8f5ff]">
          {animalImg ? (
            <img
              src={animalImg}
              alt={animal.nameAz}
              className="h-full w-full object-cover mix-blend-multiply opacity-40"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <Plus
            size={48}
            className="text-purple-200"
            strokeWidth={1.5}
            style={{ display: animalImg ? "none" : "block" }}
          />
        </div>
        <div
          className="absolute top-[164px] left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-[#ede9fe] px-6 py-1.5 leading-none text-purple-300"
          style={{
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "-.04em",
            border: "3px solid white",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          —%
        </div>
      </div>
      <div className="mt-0 text-center text-[12px] font-black tracking-[-.035em] text-purple-200">
        — / — AZN
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f8f5ff] p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white text-purple-200 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="h-[12px] w-16 rounded bg-purple-100/60" />
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white text-purple-200 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div className="h-[12px] w-12 rounded bg-purple-100/60" />
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 text-[11px] font-medium text-[#8a7ba7]">
          Açan şəxs
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-purple-100/60 shrink-0" />
          <div className="h-[12px] w-28 rounded bg-purple-100/50" />
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 text-[11px] font-medium text-[#8a7ba7]">
          Ödədiyi məbləğ
        </div>
        <div className="flex items-end gap-2">
          <div className="h-[22px] w-20 rounded-lg bg-purple-100/50" />
          <div className="h-[22px] w-12 rounded-full bg-purple-100/40" />
        </div>
      </div>
      <div className="mt-4 border-t border-[#eee8f6] pt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium text-[#8a7ba7]">
            Qalan məbləğ
          </div>
          <div className="h-[26px] w-16 rounded-lg bg-purple-100/50" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium text-[#8a7ba7]">
            Ümumi məbləğ
          </div>
          <div className="h-[26px] w-16 rounded-lg bg-purple-100/50" />
        </div>
      </div>
      <div className="mt-auto pt-3 flex flex-col gap-2">
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-100 bg-[#f7f3ff] py-2.5 text-xs font-semibold text-purple-300">
          <Share2 size={13} strokeWidth={2} /> Dostlarını dəvət et
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}
        >
          <Plus size={15} strokeWidth={2.6} /> Açılış et
        </button>
      </div>
    </div>
  );
}

/* ─── Payment Success Modal ──────────────────────────────────── */
function PaymentSuccessModal({
  campaignId,
  role,
  amount,
  onClose,
  onViewCampaign,
}) {
  const [campaign, setCampaign] = useState(null);
  const isOpener = role === "opener";

  useEffect(() => {
    if (!campaignId) return;
    api
      .get(`/campaigns/${campaignId}`)
      .then((r) => setCampaign(r.data?.data || null))
      .catch(() => {});
  }, [campaignId]);

  const animalImg =
    campaign?.animal?.image ||
    ANIMAL_IMG_FALLBACK[campaign?.animal?.nameAz] ||
    null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(10,4,30,0.72)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Hero */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(135deg, #4513ad, #7c3aed)" }}
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Heart size={38} className="text-white fill-white" />
          </div>
          <h1 className="text-[22px] font-black text-white leading-snug">
            {isOpener ? "İanəniz açılışı təsdiqləndi" : "İanəniz təsdiqləndi"}
          </h1>
        </div>

        {/* Campaign card */}
        <div className="px-5 pt-5 pb-2 space-y-3">
          {campaign && (
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3">
              <div className="flex items-center gap-3">
                {animalImg && (
                  <img
                    src={animalImg}
                    alt={campaign.animal?.nameAz}
                    className="h-12 w-12 rounded-xl object-cover bg-white border border-purple-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-[#33245f] truncate">
                    {campaign.animal?.nameAz} Qurbanı
                  </div>
                  <div className="text-xs text-[#7c6fa0]">
                    {campaign.collectedAmount} / {campaign.totalAmount} AZN ·{" "}
                    {campaign.percent || 0}%
                  </div>
                </div>
              </div>
              {amount && (
                <div className="mt-3 pt-3 border-t border-purple-100 flex justify-between items-center">
                  <span className="text-sm text-[#7c6fa0]">
                    Ödənilən məbləğ
                  </span>
                  <span className="text-sm font-black text-[#4b14bd]">
                    {amount} AZN
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pt-3 pb-6 space-y-2">
          {campaignId && (
            <button
              onClick={onViewCampaign}
              className="w-full rounded-2xl py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4513ad, #7c3aed)",
              }}
            >
              Qurbanlığı izlə
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-2xl border-2 border-purple-200 py-3 text-sm font-bold text-[#4b14bd] hover:bg-purple-50 transition"
          >
            Əsas səhifəyə qayıt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Donation Modal ─────────────────────────────────────────── */
const DONATE_STEPS = ["Məlumat", "Ödəniş", "Təsdiq"];

function DonationModal({ animal, onClose }) {
  const { isGuest, user } = useAuth();
  const [step, setStep] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount] = useState(animal.shareMin || "10");
  const [note, setNote] = useState("");
  const [continueMode, setContinueMode] = useState(
    !isGuest ? "registered" : "",
  );
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const minAmt = Number(animal.shareMin) || 0.01;
  const maxAmt =
    animal.remainingAmount != null ? animal.remainingAmount : 999999;
  const numAmt = Number(amount) || 0;
  const validAmt = numAmt >= minAmt && numAmt <= maxAmt;
  const canConfirm = !isGuest
    ? true
    : continueMode === "guest"
      ? guestName.trim().length > 0 && guestPhone.trim().length > 0
      : false;

  const handleSubmit = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    const donorName = !isGuest
      ? [user?.name, user?.lastName].filter(Boolean).join(" ").trim()
      : guestName.trim();
    const donorPhone = !isGuest
      ? user?.phone || user?.email || ""
      : guestPhone.trim();
    try {
      const r1 = await api.post(`/campaigns/${animal.campaignId}/donate`, {
        amount: numAmt,
        donorName,
        donorPhone,
        isAnonymous: anonymous,
        note,
      });
      const { donationId } = r1.data.data;
      const r2 = await api.post(
        `/campaigns/${animal.campaignId}/epoint/start`,
        { donationId },
      );
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative h-[560px] max-h-[calc(100vh-2rem)] w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-[#ede9fe] shrink-0"
          style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shrink-0">
              <img
                src={animal.img}
                alt={animal.type}
                className="h-10 w-10 object-contain mix-blend-multiply"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="font-bold text-[#241a4d]">
                {animal.type} Qurbanı
              </div>
              <div className="text-xs text-[#8a7ba7]">
                Minimum {animal.shareMin} AZN ianə edin
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-100 transition-colors"
          >
            <X size={16} className="text-[#8a7ba7]" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 border-b border-[#f0ebff] px-5 py-2 shrink-0">
          {DONATE_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold ${i === step ? "text-[#4b14bd]" : i < step ? "text-emerald-600" : "text-[#b0a0c8]"}`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i === step ? "bg-[#5521c6] text-white" : i < step ? "bg-emerald-500 text-white" : "bg-[#f0ebff] text-[#b0a0c8]"}`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                {s}
              </div>
              {i < DONATE_STEPS.length - 1 && (
                <ChevronRight size={12} className="text-[#c4b5e0]" />
              )}
            </div>
          ))}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#a78bfa transparent",
          }}
        >
          {step === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                <div className="grid grid-cols-3 gap-3 text-xs text-[#8a7ba7]">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-purple-500 shrink-0" />
                    <span className="truncate">{animal.organizer}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays
                      size={12}
                      className="text-purple-500 shrink-0"
                    />
                    <span>{animal.startTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins size={12} className="text-purple-500 shrink-0" />
                    <span>Qalan: {animal.totalMin} AZN</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-[#8a7ba7]">
                    <span>Toplanıb</span>
                    <span>{animal.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-purple-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${animal.progressPercent}%`,
                        background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="font-semibold text-[#4b14bd]">
                      {animal.collected} AZN
                    </span>
                    <span className="text-[#8a7ba7]">{animal.target} AZN</span>
                  </div>
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3">
                <div>
                  <div className="text-sm font-bold text-[#241a4d]">
                    Anonim ianə
                  </div>
                  <div className="text-xs text-[#8a7ba7]">
                    Adınız iştirakçılar siyahısında gizli görünsün
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-5 w-5 accent-[#5521c6]"
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">
                  İanə məbləği
                </label>
                <input
                  type="number"
                  min={minAmt}
                  max={maxAmt}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-lg font-semibold text-[#241a4d] transition focus:border-[#5521c6] focus:outline-none"
                />
                <div
                  className={`mt-1 text-xs ${validAmt ? "text-[#8a7ba7]" : "text-rose-500"}`}
                >
                  Minimum {minAmt} AZN · Qalan: {animal.totalMin} AZN
                </div>
              </div>
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7ba7]">İanə</span>
                  <span className="font-semibold text-[#241a4d]">
                    {numAmt} AZN
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#e5e7eb] pt-2">
                  <span className="font-bold text-[#241a4d]">Cəmi ödəniş</span>
                  <span className="text-base font-bold text-[#5521c6]">
                    {numAmt} AZN
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">
                  Qeyd (istəyə bağlı)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="İanə ilə bağlı qeyd..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-sm text-[#241a4d] transition focus:border-[#5521c6] focus:outline-none placeholder:text-[#c4b5e0]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {!isGuest ? (
                <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                  <div className="h-10 w-10 rounded-full bg-[#5521c6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initials(
                      [user?.name, user?.lastName].filter(Boolean).join(" ") ||
                        "?",
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#241a4d] truncate">
                      {[user?.name, user?.lastName].filter(Boolean).join(" ") ||
                        "İstifadəçi"}
                    </div>
                    <div className="text-xs text-[#8a7ba7] truncate">
                      {user?.phone || user?.email || "Qeydiyyatlı hesab"}
                    </div>
                  </div>
                  <div className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Aktiv hesab
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setContinueMode("registered")}
                      className={`rounded-2xl border-2 p-3 text-left transition ${continueMode === "registered" ? "border-[#5521c6] bg-purple-50" : "border-[#e5e7eb] hover:border-purple-200"}`}
                    >
                      <div className="font-bold text-[#241a4d] text-sm">
                        Qeydiyyat ilə
                      </div>
                      <div className="mt-0.5 text-xs text-[#8a7ba7]">
                        Hesabınıza daxil olaraq davam edin
                      </div>
                    </button>
                    <button
                      onClick={() => setContinueMode("guest")}
                      className={`rounded-2xl border-2 p-3 text-left transition ${continueMode === "guest" ? "border-[#5521c6] bg-purple-50" : "border-[#e5e7eb] hover:border-purple-200"}`}
                    >
                      <div className="font-bold text-[#241a4d] text-sm">
                        Qeydiyyatsız
                      </div>
                      <div className="mt-0.5 text-xs text-[#8a7ba7]">
                        Ad soyad və nömrə ilə davam edin
                      </div>
                    </button>
                  </div>
                  {continueMode === "guest" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">
                          Ad Soyad
                        </label>
                        <input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Adınızı daxil edin"
                          className="w-full rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-sm focus:border-[#5521c6] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">
                          Telefon
                        </label>
                        <input
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+994 XX XXX XX XX"
                          className="w-full rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-sm focus:border-[#5521c6] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {anonymous && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-[12px] font-semibold leading-relaxed text-amber-800">
                  Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi
                  məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq
                  olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir.
                  Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem
                  təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur,
                  üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                </div>
              )}
              <div
                className="rounded-2xl border border-purple-100 p-3"
                style={{
                  background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                }}
              >
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#4b14bd]">
                  <Shield size={12} /> İanə xülasəsi
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8a7ba7]">Anonim</span>
                    <span className="font-semibold">
                      {anonymous ? "Bəli" : "Xeyr"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7ba7]">Heyvan</span>
                    <span className="font-semibold">{animal.type}</span>
                  </div>
                  {animal.weightRange && (
                    <div className="flex justify-between">
                      <span className="text-[#8a7ba7]">Diri çəki</span>
                      <span className="font-semibold">
                        {animal.weightRange}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-purple-100 pt-2">
                    <span className="font-bold text-[#241a4d]">Ödəniş</span>
                    <span className="font-bold text-[#5521c6]">
                      {numAmt} AZN
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-[#f0ebff] px-5 pb-4 pt-3 shrink-0">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-xl border border-[#d9cdfa] py-2.5 text-sm font-semibold text-[#241a4d] hover:bg-[#f5f3ff] transition-colors"
            >
              Geri
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => {
                if (step === 1 && !validAmt) return;
                setStep((s) => s + 1);
              }}
              disabled={step === 1 && !validAmt}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
              }}
            >
              Davam et
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canConfirm}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: submitting
                  ? "#aaa"
                  : "linear-gradient(135deg, #059669, #10b981)",
              }}
            >
              {submitting ? "Yönləndirilir..." : "İanəni təsdiqlə ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Campaign Detail View ───────────────────────────────────── */
function DetailCircle({ percent }) {
  const size = 108,
    r = 42,
    c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(percent, 100));
  const prog = (clamped / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient
            id="dcp"
            x1="54"
            y1="96"
            x2="54"
            y2="12"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4513ad" />
            <stop offset="65%" stopColor="#5d28cf" />
            <stop offset="100%" stopColor="#7b4cea" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e6dcff"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#dcp)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${prog} ${c - prog}`}
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        />
        <text
          x={size / 2}
          y={size / 2 + 7}
          textAnchor="middle"
          fontSize="22"
          fontWeight="900"
          fill="#4b14bd"
        >
          {clamped}%
        </text>
      </svg>
      <div className="text-[12px] font-bold text-[#6e5b9b]">Tamamlanma</div>
    </div>
  );
}

function CampaignDetailView({ campaignId, onBack, onDonate, minDon = 10 }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    api
      .get(`/campaigns/${campaignId}`)
      .then((r) => setCampaign(r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#fbfaff]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
      </div>
    );
  if (!campaign)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#fbfaff]">
        <div className="text-[#4b14bd] text-4xl">⚠️</div>
        <div className="text-[#33245f] font-bold">Kampaniya tapılmadı</div>
        <button
          onClick={onBack}
          className="mt-2 flex items-center gap-2 rounded-xl bg-[#4b14bd] px-4 py-2 text-sm font-bold text-white hover:bg-[#3d0aa8] transition"
        >
          <ArrowLeft size={15} /> Geri qayıt
        </button>
      </div>
    );

  const isCompleted = campaign.status === "completed";
  const paidDons = campaign.donations || [];
  const openerDon = paidDons.find((d) => d.isOpener);
  const otherDons = paidDons.filter((d) => !d.isOpener);
  const displayDons = showAll ? otherDons : otherDons.slice(0, 10);
  const animalImg =
    campaign.animal?.image ||
    ANIMAL_IMG_FALLBACK[campaign.animal?.nameAz] ||
    "/qoyun.png";
  const fmtDonTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${fmtDate(d)}  •  ${dt.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-purple-100 bg-white/70 px-4 md:px-6 py-3.5 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#4b14bd] px-3 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#3d0aa8] transition"
        >
          <ArrowLeft size={16} /> Geri qayıt
        </button>
        <h1 className="flex-1 truncate text-[16px] font-black tracking-[-.02em] text-[#33245f]">
          {isCompleted
            ? `${fmtDate(campaign.createdAt)} — tamamlanmış açılış`
            : `${campaign.animal?.nameAz || "Qurban"} — ianə detalları`}
        </h1>
        {!isCompleted && onDonate && (
          <button
            onClick={() =>
              onDonate({
                campaignId: campaign._id,
                type: campaign.animal?.nameAz || "Qurban",
                img: animalImg,
                shareMin: String(minDon),
                remainingAmount: campaign.remainingAmount,
                targetRaw: campaign.totalAmount,
                shareMinRaw: minDon,
                collected: String(campaign.collectedAmount),
                target: String(campaign.totalAmount),
                totalMin: String(
                  Number(
                    Math.max(
                      0,
                      campaign.totalAmount - campaign.collectedAmount,
                    ).toFixed(2),
                  ),
                ),
                totalMax: String(campaign.totalAmount),
                currency: "AZN",
                organizer: campaign.opener?.isAnonymous
                  ? "Anonim"
                  : [campaign.opener?.name, campaign.opener?.lastName]
                      .filter(Boolean)
                      .join(" ") || "—",
                startTime: fmtDate(campaign.createdAt),
                progressPercent: campaign.percent || 0,
              })
            }
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#4b14bd] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-[#3d0aa8] transition"
          >
            <Heart size={15} /> İanə et
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Main info card */}
        <div className="overflow-hidden rounded-[10px] border border-[#e7e1f0] bg-white shadow-[0_4px_14px_rgba(49,22,93,.05)]">
          <div className="flex flex-col xl:flex-row">
            {/* Animal image */}
            <div className="xl:w-[340px] shrink-0 bg-[#f5f2ff]">
              <img
                src={animalImg}
                alt={`${campaign.animal?.nameAz || "Qurban"} heyvanı`}
                className="h-[240px] xl:h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col xl:flex-row flex-1 divide-y xl:divide-y-0 xl:divide-x divide-[#e7e1f0]">
              {/* Stats grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 p-4">
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[22px] font-black text-[#33245f] mb-4">
                    {campaign.animal?.nameAz || "Qurban"}
                  </div>
                  {campaign.animal?.weightRange && (
                    <>
                      <div className="text-[11px] font-bold text-[#8b7dac] mb-1">
                        Diri çəki
                      </div>
                      <div className="text-[13px] font-black text-[#33245f] mb-3">
                        {campaign.animal.weightRange}
                      </div>
                    </>
                  )}
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">
                    Açılış tarixi
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-black text-[#33245f]">
                    <CalendarDays size={15} className="text-[#6840c6]" />{" "}
                    {fmtDate(campaign.createdAt)}
                  </div>
                </div>
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">
                    Ümumi məbləğ
                  </div>
                  <div className="flex items-center gap-1.5 text-[17px] font-black text-[#33245f] mb-5">
                    <Coins size={20} className="text-[#5b22c7]" />{" "}
                    {campaign.totalAmount} AZN
                  </div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">
                    Toplanan məbləğ
                  </div>
                  <div className="flex items-center gap-1.5 text-[17px] font-black text-[#33245f]">
                    <Coins size={20} className="text-[#5b22c7]" />{" "}
                    {campaign.collectedAmount} AZN
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">
                    İştirakçı sayı
                  </div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-5">
                    <Users size={20} className="text-[#5b22c7]" />{" "}
                    {campaign.participantCount} nəfər
                  </div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">
                    Qalan məbləğ
                  </div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f]">
                    <Coins size={20} className="text-[#5b22c7]" />{" "}
                    {Number((campaign.remainingAmount || 0).toFixed(2))} AZN
                  </div>
                </div>
              </div>

              {/* Status panel */}
              <div className="xl:w-[210px] shrink-0 p-4 flex flex-col items-center justify-center gap-3 text-center">
                {isCompleted ? (
                  <>
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle size={32} />
                    </div>
                    <div className="text-[15px] font-black text-emerald-700">
                      Açılış tamamlanıb
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                      Tamamlandı
                    </span>
                    <button
                      onClick={handleShare}
                      className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#d9cff0] bg-white py-2 text-[12px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition"
                    >
                      <Share2 size={14} />{" "}
                      {copied ? "Kopyalandı!" : "Dostlarınla paylaş"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] font-bold text-[#6e5b9b]">
                      Tamamlanma
                    </div>
                    <svg width="100" height="100" viewBox="0 0 108 108">
                      <defs>
                        <linearGradient
                          id="camp-detail-ring-grad"
                          x1="54"
                          y1="96"
                          x2="54"
                          y2="12"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop offset="0%" stopColor="#4513ad" />
                          <stop offset="65%" stopColor="#5d28cf" />
                          <stop offset="100%" stopColor="#7b4cea" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="54"
                        cy="54"
                        r="42"
                        fill="none"
                        stroke="#e6dcff"
                        strokeWidth="9"
                      />
                      <circle
                        cx="54"
                        cy="54"
                        r="42"
                        fill="none"
                        stroke="url(#camp-detail-ring-grad)"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeDasharray={`${((campaign.percent || 0) / 100) * 2 * Math.PI * 42} ${(1 - (campaign.percent || 0) / 100) * 2 * Math.PI * 42}`}
                        transform="rotate(90 54 54)"
                      />
                      <text
                        x="54"
                        y="61"
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="900"
                        fill="#4b14bd"
                      >
                        {campaign.percent || 0}%
                      </text>
                    </svg>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                      Davam edir
                    </span>
                    <button
                      onClick={handleShare}
                      className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#d9cff0] bg-white py-2 text-[12px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition"
                    >
                      <Share2 size={14} />{" "}
                      {copied ? "Kopyalandı!" : "Dostlarınla paylaş"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opener row */}
        {openerDon && (
          <div>
            <div className="inline-flex rounded-t-[5px] bg-[#4b14bd] px-3 py-1.5 text-[11px] font-black text-white">
              Açan şəxs
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] min-h-[60px] items-center gap-4 rounded-b-[8px] rounded-tr-[8px] border border-[#e1d8ee] bg-[#f5f0ff] px-5 py-3 shadow-[0_3px_10px_rgba(49,22,93,.04)]">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-black text-sm"
                  style={(() => {
                    const c = avatarColor(
                      openerDon.isAnonymous ? null : openerDon.name,
                    );
                    return { backgroundColor: c.bg, color: c.text };
                  })()}
                >
                  {openerDon.isAnonymous ? "AN" : initials(openerDon.name)}
                </div>
                <div>
                  <div className="text-[13px] font-black text-[#33245f]">
                    {openerDon.isAnonymous ? "Anonim" : openerDon.name}
                    {!openerDon.isAnonymous && (
                      <span className="ml-1 text-[#4b14bd]">●</span>
                    )}
                  </div>
                  <div className="text-[12px] font-bold text-[#6f6290]">
                    Açılış edən şəxs
                  </div>
                </div>
              </div>
              <div className="text-[20px] font-black text-[#24124f]">
                {openerDon.amount} AZN
                <span className="ml-2 text-[13px] font-bold text-[#5b22c7]">
                  ({Math.round(openerDon.percent)}%)
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#4f4075] text-right whitespace-nowrap">
                {fmtDate(openerDon.paidAt)}
              </div>
            </div>
          </div>
        )}

        {/* Donors table */}
        {otherDons.length > 0 && (
          <div>
            <h2 className="mb-3 text-[15px] font-black text-[#33245f]">
              Digər ödəniş edənlər ({otherDons.length} nəfər)
            </h2>
            <div className="overflow-hidden rounded-[10px] border border-[#e7e1f0] bg-white shadow-[0_4px_14px_rgba(49,22,93,.04)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-[11px] font-bold text-[#33245f]">
                  <thead>
                    <tr className="border-b border-[#e7e1f0] bg-white text-[11px] text-[#8b7dac]">
                      <th className="px-5 py-3.5">#</th>
                      <th className="px-4 py-3.5">Ad Soyad</th>
                      <th className="px-4 py-3.5">Ödənilən məbləğ</th>
                      <th className="px-4 py-3.5">Faiz</th>
                      <th className="px-4 py-3.5 text-right">Ödəniş tarixi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDons.map((d, i) => (
                      <tr
                        key={d._id || i}
                        className="border-b border-[#eee8f6] last:border-b-0 hover:bg-purple-50/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-black">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                              style={(() => {
                                const c = avatarColor(
                                  d.isAnonymous ? null : d.name,
                                );
                                return { backgroundColor: c.bg, color: c.text };
                              })()}
                            >
                              {d.isAnonymous ? "AN" : initials(d.name)}
                            </div>
                            <span>
                              {d.isAnonymous ? "Anonim" : d.name}
                              {!d.isAnonymous && (
                                <span className="ml-1 text-[#4b14bd]">●</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-black">{d.amount} AZN</td>
                        <td className="px-4 py-3 text-[#5b22c7]">
                          {Math.round(d.percent)}%
                        </td>
                        <td className="px-4 py-3 text-right text-[#4f4075]">
                          {fmtDonTime(d.paidAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {otherDons.length > 10 && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="flex h-10 items-center gap-2 rounded-[6px] border border-[#c8b9eb] px-6 text-[13px] font-black text-[#5b22c7] hover:bg-purple-50 transition"
                  >
                    {showAll ? "Daha az göstər" : "Daha çoxunu göstər"}
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${showAll ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {otherDons.length === 0 && !openerDon && (
          <div className="rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-10 text-center text-sm text-[#77689c]">
            Hələ ödəniş edən yoxdur.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Home Page ──────────────────────────────────────────────── */
function HomeContent() {
  const { openNewCampaign } = useCharityLayout();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState("Bütün heyvanlar");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [donationTarget, setDonationTarget] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [homeAnimals, setHomeAnimals] = useState([]);
  const [allAnimals, setAllAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [pageSettings, setPageSettings] = useState({
    minDon: 10,
    minOpenPct: 30,
  });
  const [paymentToast, setPaymentToast] = useState(null);
  const [successModal, setSuccessModal] = useState(null); // { campaignId, role, amount }

  useEffect(() => {
    const cId = searchParams.get("campaign");
    const done = searchParams.get("paymentDone");
    const role = searchParams.get("role") || "donor";
    const amount = searchParams.get("amount") || "";

    if (done === "1" && cId) {
      setSuccessModal({ campaignId: cId, role, amount });
      router.replace(`/charity?campaign=${cId}`, { scroll: false });
      setSelectedCampaignId(cId);
      return;
    }

    if (cId) setSelectedCampaignId(cId);

    if (searchParams.get("payment") === "fail") {
      const msg =
        searchParams.get("message") ||
        "Ödəniş uğursuz oldu. Yenidən cəhd edin.";
      setPaymentToast({ type: "fail", message: msg });
      router.replace("/charity");
      setTimeout(() => setPaymentToast(null), 6000);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.get("/campaigns/settings").catch(() => ({ data: {} })),
      api.get("/campaigns").catch(() => ({ data: {} })),
    ])
      .then(([sRes, cRes]) => {
        const s = sRes.data?.data?.settings || {};
        const minDon = s.minDonation || 10;
        const minOpenPct = s.minOpenPercent || 30;
        setPageSettings({ minDon, minOpenPct });
        setAllAnimals(sRes.data?.data?.animals || []);
        const campaigns = cRes.data?.data?.campaigns || [];
        setHomeAnimals(campaigns.map((c) => mapHomeCampaign(c, minDon)));
      })
      .finally(() => setAnimalsLoading(false));
  }, []);

  const filterOptions = useMemo(() => {
    const types = [...new Set(homeAnimals.map((a) => a.type))];
    return ["Bütün heyvanlar", ...types];
  }, [homeAnimals]);

  const filtered =
    filter === "Bütün heyvanlar"
      ? homeAnimals
      : homeAnimals.filter((a) => a.type === filter);
  const activeTypes = new Set(homeAnimals.map((a) => a.type));
  const missingAnimals = allAnimals.filter((a) => !activeTypes.has(a.nameAz));

  const openCampaign = (id) => {
    setSelectedCampaignId(id);
    router.push(id ? `/charity?campaign=${id}` : "/charity", { scroll: false });
  };

  const closeCampaign = () => {
    setSelectedCampaignId(null);
    router.replace("/charity", { scroll: false });
  };

  if (selectedCampaignId) {
    return (
      <>
        <CampaignDetailView
          campaignId={selectedCampaignId}
          onBack={closeCampaign}
          onDonate={setDonationTarget}
          minDon={pageSettings.minDon}
        />
        {donationTarget && (
          <DonationModal
            animal={donationTarget}
            onClose={() => setDonationTarget(null)}
          />
        )}
        {successModal && (
          <PaymentSuccessModal
            campaignId={successModal.campaignId}
            role={successModal.role}
            amount={successModal.amount}
            onClose={() => {
              setSuccessModal(null);
              closeCampaign();
            }}
            onViewCampaign={() => setSuccessModal(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {paymentToast?.type === "fail" && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-3 rounded-2xl bg-white border border-red-200 shadow-2xl px-5 py-4 max-w-sm w-[calc(100vw-2rem)]"
          style={{ boxShadow: "0 8px 32px rgba(220,38,38,.18)" }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-lg">
            ✕
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-red-700 mb-0.5">
              Ödəniş uğursuz oldu
            </div>
            <div className="text-xs text-red-500 leading-relaxed">
              {paymentToast.message}
            </div>
          </div>
          <button
            onClick={() => setPaymentToast(null)}
            className="shrink-0 text-red-300 hover:text-red-500 transition-colors ml-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-xl md:rounded-2xl mx-3 md:mx-6 mt-4 mb-5"
          style={{
            background:
              "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-48 md:w-72 h-48 md:h-72 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #7c3aed, transparent)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="lg:hidden relative min-h-[140px]">
            <img
              src="/xeyriye_bg_image.jpg"
              alt="Xeyriyyə"
              className="absolute right-0 top-0 h-full w-[55%] object-cover rounded-r-xl"
              style={{ objectPosition: "left center" }}
            />
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "linear-gradient(to right, #ede9fe 0%, #ede9fe 42%, rgba(237,233,254,0.75) 58%, transparent 80%)",
              }}
            />
            <div className="relative z-10 p-5 flex flex-col justify-center min-h-[140px]">
              <h1 className="leading-tight mb-4 text-[#241a4d] text-[1.4rem] font-bold">
                Birlikdə qurban,
                <br />
                <span style={{ color: "#551dc7" }}>birlikdə xeyir.</span>
              </h1>
              <button
                onClick={openNewCampaign}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all hover:opacity-90 self-start"
                style={{ background: "#4b14bd" }}
              >
                <Plus size={13} /> Yeni açılış et
              </button>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-6 items-stretch">
            <div className="pl-8 py-8 pr-2 flex flex-col justify-center">
              <h1
                className="leading-tight mb-5 text-[#241a4d]"
                style={{ fontSize: "1.75rem", fontWeight: 700 }}
              >
                Birlikdə qurban,
                <br />
                <span style={{ color: "#551dc7" }}>birlikdə xeyir.</span>
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={openNewCampaign}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: "#4b14bd" }}
                >
                  <Plus size={14} /> Yeni açılış et
                </button>
              </div>
            </div>
            <div className="relative min-h-[220px]">
              <img
                src="/xeyriye_bg_image.jpg"
                alt="Xeyriyyə"
                className="absolute inset-0 w-full h-full object-cover object-center rounded-r-2xl"
              />
              <div
                className="absolute inset-0 rounded-r-2xl"
                style={{
                  background:
                    "linear-gradient(to right, #ede9fe 0%, rgba(237,233,254,0.7) 30%, transparent 65%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Filter + heading */}
        <div className="flex items-center justify-between px-3 md:px-6 mb-4">
          <div>
            <h2 className="font-semibold text-[#241a4d] text-base md:text-lg">
              Davam edən açılışlar
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              İanə etmək üçün açılışa basın
            </p>
          </div>
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium bg-white border border-[#eee8f6] text-[#241a4d] hover:border-purple-300 transition-all"
            >
              <span className="hidden sm:inline">{filter}</span>
              <span className="sm:hidden">Filtr</span>
              <ChevronDown
                size={13}
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-[#eee8f6] shadow-lg z-50 min-w-[160px] overflow-hidden">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setFilter(opt);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-purple-50 ${filter === opt ? "text-purple-700 font-semibold bg-purple-50" : "text-[#241a4d]"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cards grid */}
        <div className="px-3 md:px-6 mb-5">
          {animalsLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((animal) => (
                <AnimalCard
                  key={animal.campaignId || animal.type}
                  animal={animal}
                  onDonate={setDonationTarget}
                  onClick={() => openCampaign(animal.campaignId)}
                />
              ))}
              {Array.from({ length: Math.max(0, 4 - filtered.length) }).map(
                (_, i) => (
                  <NewOpeningPlaceholderCard
                    key={`placeholder-${i}`}
                    animal={
                      filter === "Bütün heyvanlar"
                        ? missingAnimals[i] || null
                        : null
                    }
                    onOpen={openNewCampaign}
                  />
                ),
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mx-3 md:mx-6 mb-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl px-3 py-2.5 flex items-center gap-2.5 border border-[#eee8f6]"
              style={{ boxShadow: "0 4px 18px rgba(54,27,99,0.04)" }}
            >
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(75,20,189,0.08)" }}
              >
                <Icon size={15} style={{ color: "#4b14bd" }} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#241a4d] leading-tight">
                  {title}
                </div>
                <div
                  className="text-[10px] mt-0.5 leading-snug"
                  style={{ color: "#8a7ba7" }}
                >
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {donationTarget && (
        <DonationModal
          animal={donationTarget}
          onClose={() => setDonationTarget(null)}
        />
      )}
    </>
  );
}

export default function CharityHomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[#fbfaff]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
