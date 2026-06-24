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
  Mail,
  Phone,
  Lock,
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
  { icon: Video, title: "Kəsim videosu", desc: "Kəsim videosunu izləyin" },
  { icon: Heart, title: "Ehtiyac sahiblərinə", desc: "Birbaşa çatdırılır" },
  { icon: Users, title: "Birlikdə xeyir", desc: "Kiçik məbləğlə böyük xeyir" },
];

/* ─── Ring Progress ──────────────────────────────────────────── */
function RingProgress({ percent, type, img }) {
  const size = 148, r = 64;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(percent, 100));
  const dash = (p / 100) * circ;
  const id = `grad-${type.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="relative mx-auto mt-1" style={{ height: 170, width: "100%", maxWidth: 156 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none">
        <defs>
          <linearGradient id={id} x1="74" y1="138" x2="74" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4513ad" />
            <stop offset="58%" stopColor="#5f2bd1" />
            <stop offset="100%" stopColor="#7547e6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#d9cdfa" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset="0" transform={`rotate(90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute left-1/2 top-[14px] flex h-[120px] w-[120px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: "#fbfaff" }}>
        <img src={img} alt={type} className="max-h-[85%] max-w-[85%] object-contain" style={{ mixBlendMode: "multiply" }} />
      </div>
      <div className="absolute left-1/2 top-[128px] z-20 -translate-x-1/2 rounded-xl px-4 py-1 leading-none text-white whitespace-nowrap"
        style={{ backgroundColor: "#551dc7", boxShadow: "0 6px 12px rgba(85,29,199,.25)", border: "2px solid white",
          fontSize: "17px", fontWeight: 900, letterSpacing: "-.04em",
          display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 54, height: 30 }}>
        {p}%
      </div>
    </div>
  );
}

/* ─── Ring Progress Small (compact 2-col cards) ──────────────── */
function RingProgressSmall({ percent, type, img }) {
  const size = 138, r = 58;
  const circ = 2 * Math.PI * r;
  const p    = Math.max(0, Math.min(percent, 100));
  const dash = (p / 100) * circ;
  const id   = `grad-sm-${type.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="relative mx-auto" style={{ height: 158, width: "100%", maxWidth: 146 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none">
        <defs>
          <linearGradient id={id} x1="69" y1="128" x2="69" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#4513ad" />
            <stop offset="58%"  stopColor="#5f2bd1" />
            <stop offset="100%" stopColor="#7547e6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#d9cdfa" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset="0" transform={`rotate(90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute left-1/2 top-[14px] flex h-[110px] w-[110px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: "#fbfaff" }}>
        <img src={img} alt={type} className="max-h-[85%] max-w-[85%] object-contain" style={{ mixBlendMode: "multiply" }} />
      </div>
      <div className="absolute left-1/2 top-[120px] z-20 -translate-x-1/2 rounded-2xl px-4 py-1 leading-none text-white whitespace-nowrap"
        style={{ backgroundColor: "#551dc7", boxShadow: "0 6px 12px rgba(85,29,199,.25)", border: "2px solid white",
          fontSize: "16px", fontWeight: 900, letterSpacing: "-.04em",
          display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 52, height: 28 }}>
        {p}%
      </div>
    </div>
  );
}

/* ─── Animal Card ────────────────────────────────────────────── */
function AnimalCard({ animal, onDonate, onClick }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-[#eee8f6] bg-white px-3 pb-3 pt-3 cursor-pointer transition-all hover:-translate-y-1"
      style={{ boxShadow: "0 6px 20px rgba(54,27,99,.08)" }}
    >
      <h3 className="text-[14px] font-bold text-center text-[#241a4d] mb-1 leading-tight">{animal.type}</h3>
      <RingProgressSmall percent={animal.progressPercent} type={animal.type} img={animal.img} />
      <div className="mt-1 text-center text-[12px] font-semibold text-[#281d55]">
        {animal.collected} / {animal.target} <span className="text-[#5521c6]">{animal.currency}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-purple-100 text-[9px] font-bold text-purple-700">
          {animal.organizer.split(" ").slice(0, 2).map((w) => w[0]).join("")}
        </div>
        <span className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: "#342760" }}>
          {animal.organizer}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDonate(animal); }}
        className="mt-3 w-full rounded-xl py-2 text-xs font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}
      >
        İanə et →
      </button>
      {copied && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#241a4d] px-5 py-3 text-center text-sm font-medium text-white"
          style={{ boxShadow: "0 18px 44px rgba(36,26,77,.28)" }}>
          Keçid kopyalandı
        </div>
      )}
    </div>
  );
}

/* ─── Desktop Animal Card (detailed long card) ──────────────── */
function DesktopAnimalCard({ animal, onDonate, onClick }) {
  const [copied, setCopied] = useState(false);
  const toNum = (v) => Number(String(v).replace(/[^0-9.]/g, ""));
  const paidPct = Math.round((toNum(animal.shareMin) / Math.max(toNum(animal.target), 1)) * 100);
  const handleShare = async (e) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2600);
  };
  return (
    <div onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-[#eee8f6] bg-white px-3 pb-3 pt-3 cursor-pointer transition-all hover:-translate-y-1"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.08)" }}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-bold leading-none text-[#241a4d]">{animal.type}</h3>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600">Davam Edir</span>
      </div>
      <RingProgress percent={animal.progressPercent} type={animal.type} img={animal.img} />
      <div className="mt-1 text-center text-[12px] font-semibold text-[#281d55]">
        {animal.collected} / {animal.target} <span className="text-[#5521c6]">{animal.currency}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl p-2" style={{ backgroundColor: "#f8f5ff" }}>
        <div className="flex items-center gap-1.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white shadow-sm" style={{ color: "#5521c6" }}>
            <CalendarDays size={12} strokeWidth={2} />
          </span>
          <div className="text-[10px] font-medium text-[#241a4d]">{animal.startTime}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white shadow-sm" style={{ color: "#5521c6" }}>
            <UsersRound size={12} strokeWidth={2} />
          </span>
          <div className="text-[10px] font-medium text-[#241a4d]">{animal.participants} iştirakçı</div>
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-1 text-[10px] font-medium" style={{ color: "#8a7ba7" }}>Açan şəxs</div>
        <div className="flex items-center gap-1.5">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-purple-100 text-[9px] font-semibold text-purple-700 shrink-0">
            {animal.organizer.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </div>
          <div className="truncate text-[11px] font-medium" style={{ color: "#342760" }}>{animal.organizer}</div>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#5521c6" }} />
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-0.5 text-[10px] font-medium" style={{ color: "#8a7ba7" }}>Ödədiyi məbləğ</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-[#241a4d]">{animal.shareMin} {animal.currency}</span>
          <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium" style={{ color: "#5521c6" }}>{paidPct}%</span>
        </div>
      </div>
      <div className="mt-2 border-t border-[#eee8f6] pt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="mb-0.5 text-[10px] font-medium" style={{ color: "#8a7ba7" }}>Qalan məbləğ</div>
          <div className="text-[13px] font-bold text-[#241a4d]">{animal.totalMin} <span className="text-[10px] font-normal">AZN</span></div>
        </div>
        <div>
          <div className="mb-0.5 text-[10px] font-medium" style={{ color: "#8a7ba7" }}>Ümumi məbləğ</div>
          <div className="text-[13px] font-bold text-[#241a4d]">{animal.totalMax} <span className="text-[10px] font-normal">AZN</span></div>
        </div>
      </div>
      <button onClick={handleShare}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d9cdfa] py-1.5 text-[11px] font-medium transition-all hover:bg-white"
        style={{ backgroundColor: "#f7f3ff", color: "#5521c6" }}>
        <Share2 size={11} strokeWidth={2} /> İanəyə Dəvət Et
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDonate(animal); }}
        className="mt-1.5 w-full rounded-lg py-1.5 text-[11px] font-medium text-white transition hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
        İanə et →
      </button>
      {copied && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#241a4d] px-5 py-3 text-center text-sm font-medium text-white"
          style={{ boxShadow: "0 18px 44px rgba(36,26,77,.28)" }}>
          Səhifənin bağlantısı kopyalandı.
        </div>
      )}
    </div>
  );
}

/* ─── New Opening Placeholder Card ──────────────────────────── */
function NewOpeningPlaceholderCard({ onOpen, animal }) {
  const animalImg = animal
    ? animal.imageHome || animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || null
    : null;

  return (
    <div
      onClick={() => onOpen(animal?.nameAz)}
      className="flex flex-col overflow-hidden rounded-[18px] border-2 border-dashed border-purple-200 bg-white/70 px-3 pb-3 pt-3 cursor-pointer transition-all hover:-translate-y-1 hover:border-purple-400 hover:bg-white"
      style={{ boxShadow: "0 6px 20px rgba(54,27,99,.04)" }}
    >
      {/* Name + badge */}
      <div className="flex items-center justify-between gap-1 mb-1">
        {animal
          ? <span className="text-[14px] font-bold text-[#6b4fa0] leading-tight">{animal.nameAz}</span>
          : <div className="h-4 w-14 rounded bg-purple-100/50" />}
        <span className="text-[9px] font-bold text-purple-300 bg-purple-50 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">Açılış yoxdur</span>
      </div>

      {/* Ring placeholder */}
      <div className="relative mx-auto" style={{ height: 158, width: "100%", maxWidth: 146 }}>
        <svg width="138" height="138" viewBox="0 0 138 138"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none">
          <circle cx="69" cy="69" r="58" fill="none" stroke="#ede9fe" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <div className="absolute left-1/2 top-[14px] flex h-[110px] w-[110px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-[#f8f5ff]">
          {animalImg
            ? <img src={animalImg} alt={animal.nameAz} className="max-h-[85%] max-w-[85%] object-contain mix-blend-multiply opacity-40"
                onError={e => { e.currentTarget.style.display = "none"; }} />
            : <Plus size={36} className="text-purple-200" strokeWidth={1.5} />}
        </div>
        <div className="absolute left-1/2 top-[120px] z-20 -translate-x-1/2 rounded-2xl px-4 py-1 leading-none text-white whitespace-nowrap"
          style={{ backgroundColor: "#551dc7", boxShadow: "0 6px 12px rgba(85,29,199,.25)", border: "2px solid white",
            fontSize: "16px", fontWeight: 900, letterSpacing: "-.04em",
            display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 52, height: 28 }}>
          —%
        </div>
      </div>

      {/* Amount placeholder */}
      <div className="text-center text-[12px] font-semibold text-purple-200 mt-1">— / — AZN</div>

      {/* Opener placeholder */}
      <div className="flex items-center gap-1.5 mt-3">
        <div className="h-6 w-6 rounded-full bg-purple-100/60 shrink-0" />
        <div className="h-3 w-20 rounded bg-purple-100/50" />
      </div>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(animal?.nameAz); }}
        className="mt-3 w-full rounded-xl py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}
      >
        <Plus size={13} strokeWidth={2.6} /> Açılış et
      </button>
    </div>
  );
}

/* ─── Desktop New Opening Placeholder Card ──────────────────── */
function DesktopNewOpeningPlaceholderCard({ onOpen, animal }) {
  const animalImg = animal
    ? animal.imageHome || animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || null
    : null;
  return (
    <div onClick={() => onOpen(animal?.nameAz)}
      className="group flex flex-col overflow-hidden rounded-[18px] border-2 border-dashed border-purple-200 bg-white/70 px-3 pb-3 pt-3 cursor-pointer transition-all hover:-translate-y-1 hover:border-purple-400 hover:bg-white"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.04)" }}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-bold leading-none text-purple-200">{animal ? animal.nameAz : "—"}</h3>
        <span className="rounded-md bg-purple-50 px-2 py-1 text-[10px] font-medium text-purple-300 whitespace-nowrap shrink-0">Açılış yoxdur</span>
      </div>
      <div className="relative mx-auto mt-1" style={{ height: 170, width: "100%", maxWidth: 156 }}>
        <svg width="148" height="148" viewBox="0 0 148 148"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none">
          <circle cx="74" cy="74" r="64" fill="none" stroke="#ede9fe" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
        </svg>
        <div className="absolute left-1/2 top-[14px] flex h-[120px] w-[120px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: "#fbfaff" }}>
          {animalImg
            ? <img src={animalImg} alt={animal?.nameAz} className="max-h-[85%] max-w-[85%] object-contain opacity-35"
                style={{ mixBlendMode: "multiply" }} onError={e => { e.currentTarget.style.display = "none"; }} />
            : <Plus size={36} className="text-purple-200" strokeWidth={1.5} />}
        </div>
        <div className="absolute left-1/2 top-[128px] z-20 -translate-x-1/2 rounded-xl px-4 py-1 leading-none whitespace-nowrap text-white"
          style={{ backgroundColor: "#551dc7", boxShadow: "0 6px 12px rgba(85,29,199,.25)", border: "2px solid white",
            fontSize: "17px", fontWeight: 900, letterSpacing: "-.04em",
            display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 54, height: 30 }}>
          —%
        </div>
      </div>
      <div className="mt-1 text-center text-[12px] font-semibold text-purple-200">— / — <span className="text-purple-200">AZN</span></div>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl p-2" style={{ backgroundColor: "#f8f5ff" }}>
        <div className="flex items-center gap-1.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white shadow-sm text-purple-200"><CalendarDays size={12} strokeWidth={2} /></span>
          <div className="text-[10px] font-medium text-purple-200">— —</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white shadow-sm text-purple-200"><UsersRound size={12} strokeWidth={2} /></span>
          <div className="text-[10px] font-medium text-purple-200">— iştirakçı</div>
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-1 text-[10px] font-medium text-purple-300">Açan şəxs</div>
        <div className="flex items-center gap-1.5">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-purple-100/60 text-[9px] font-semibold text-purple-200 shrink-0">—</div>
          <div className="truncate text-[11px] font-medium text-purple-200">—</div>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-200 shrink-0" />
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-0.5 text-[10px] font-medium text-purple-300">Ödədiyi məbləğ</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-purple-200">— AZN</span>
          <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-200">—%</span>
        </div>
      </div>
      <div className="mt-2 border-t border-[#eee8f6] pt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="mb-0.5 text-[10px] font-medium text-purple-300">Qalan məbləğ</div>
          <div className="text-[13px] font-bold text-purple-200">— <span className="text-[10px] font-normal">AZN</span></div>
        </div>
        <div>
          <div className="mb-0.5 text-[10px] font-medium text-purple-300">Ümumi məbləğ</div>
          <div className="text-[13px] font-bold text-purple-200">— <span className="text-[10px] font-normal">AZN</span></div>
        </div>
      </div>
      <button disabled className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-purple-100 py-1.5 text-[11px] font-medium text-purple-200 bg-[#f7f3ff] cursor-not-allowed">
        <Share2 size={11} strokeWidth={2} /> İanəyə Dəvət Et
      </button>
      <button onClick={(e) => { e.stopPropagation(); onOpen(animal?.nameAz); }}
        className="mt-1.5 w-full rounded-lg py-1.5 text-[11px] font-medium text-white flex items-center justify-center gap-1.5 transition hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
        <Plus size={12} strokeWidth={2.6} /> Açılış et
      </button>
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
  const [storedAmount, setStoredAmount] = useState("");
  const isOpener = role === "opener";

  useEffect(() => {
    try { setStoredAmount(sessionStorage.getItem("_lastPaidAmount") || ""); } catch (_) {}
  }, []);

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

  // API already returns only paid donations — no paymentStatus field to filter by
  const donations = campaign?.donations || [];
  const lastDonation = [...donations].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0];
  const displayAmount = amount || storedAmount || String(lastDonation?.amount ?? "") || "";

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
            İanəniz qəbul edildi!
          </h1>
          <p className="mt-2 text-[13px] text-white/80 leading-snug">
            Kollektiv qurbanınıza töhfəniz uğurla qeydə alındı
          </p>
        </div>

        {/* Campaign card + dua */}
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
                  {displayAmount && (
                    <div className="mt-1 text-[13px] font-bold text-[#4b14bd]">
                      {displayAmount} AZN
                      {Number(campaign.totalAmount) > 0 && (
                        <span className="ml-2 text-[#7c6fa0] font-semibold">
                          · {Math.round((Number(displayAmount) / Number(campaign.totalAmount)) * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dua */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4 text-center">
            <div className="text-xl mb-2">✅</div>
            <p className="text-[13px] font-semibold text-emerald-800 leading-relaxed">
              Sədəqəniz Allah qatında qəbul olsun!<br />Allah sizdən razı olsun!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pt-3 pb-6 space-y-2">
          {campaignId && (
            <button
              onClick={onViewCampaign}
              className="w-full rounded-2xl py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4513ad, #7c3aed)" }}
            >
              Qurbanınızı izləyin
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

/* ─── Forgot Password Inline ─────────────────────────────────── */
function ForgotPasswordInline({ onBack, onSuccess }) {
  const [fpStep,   setFpStep]   = useState("id"); // "id" | "otp" | "reset"
  const [fpMethod, setFpMethod] = useState("email");
  const [fpInput,  setFpInput]  = useState("");
  const [fpId,     setFpId]     = useState(""); // stored identifier
  const [fpCode,   setFpCode]   = useState("");
  const [fpNew,    setFpNew]    = useState("");
  const [fpConf,   setFpConf]   = useState("");
  const [fpLoading,setFpLoading]= useState(false);
  const [fpError,  setFpError]  = useState("");

  const fpPhoneFilter = (v) => v.replace(/[^\d\s+\-()]/g, "");
  const fpPhoneOk = (v) => /^(\+994|0)(50|51|55|60|70|77|99)\d{7}$/.test(v.replace(/[\s\-()]/g, ""));

  const handleSend = async () => {
    setFpError("");
    const val = fpInput.trim();
    if (!val) return setFpError(fpMethod === "email" ? "Email ünvanını daxil edin" : "Telefon nömrəsini daxil edin");
    if (fpMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return setFpError("Email ünvanı düzgün deyil");
    if (fpMethod === "phone" && !fpPhoneOk(val)) return setFpError("Düzgün AZ nömrəsi daxil edin (+994XXXXXXXXX)");
    setFpLoading(true);
    try {
      const payload = fpMethod === "email" ? { email: val } : { phone: val };
      await api.post("/auth/forgot-password", payload);
      setFpId(val);
      setFpStep("otp");
    } catch (err) {
      const msg = err.response?.data?.message;
      setFpError(err.response?.status === 404
        ? "Bu hesab tapılmadı. Email və ya nömrəni yoxlayın."
        : msg || "Xəta baş verdi. Yenidən cəhd edin.");
    } finally { setFpLoading(false); }
  };

  const handleReset = async () => {
    setFpError("");
    if (!fpCode || fpCode.length < 4) return setFpError("Doğrulama kodunu tam daxil edin");
    if (!fpNew || fpNew.length < 6) return setFpError("Yeni şifrə minimum 6 simvol olmalıdır");
    if (fpNew !== fpConf) return setFpError("Şifrələr uyğun gəlmir");
    setFpLoading(true);
    try {
      const payload = fpMethod === "email"
        ? { email: fpId, code: fpCode, newPassword: fpNew }
        : { phone: fpId, code: fpCode, newPassword: fpNew };
      const res = await api.post("/auth/reset-password", payload);
      const { token, user } = res.data.data;
      await onSuccess(token, user);
    } catch (err) {
      const msg = err.response?.data?.message;
      setFpError(msg?.toLowerCase().includes("code") || msg?.toLowerCase().includes("kod")
        ? "Kod yanlışdır və ya müddəti bitib. Yenidən kod alın."
        : msg || "Şifrə yenilənə bilmədi.");
      if (err.response?.status === 400) { setFpStep("otp"); setFpCode(""); }
    } finally { setFpLoading(false); }
  };

  const inputCls = "w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]";

  return (
    <div className="flex flex-col gap-3">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#8a7ba7] hover:text-[#241a4d] transition-colors self-start">
        <ChevronDown size={13} className="rotate-90" /> Geri qayıt
      </button>

      <div className="text-sm font-bold text-[#241a4d]">Şifrəni bərpa et</div>
      <div className="text-xs text-[#8a7ba7]">
        {fpStep === "id" && "Qeydiyyatda istifadə etdiyiniz email və ya telefonu daxil edin."}
        {fpStep === "otp" && <>Doğrulama kodu <b className="text-purple-700">{fpId}</b> ünvanına göndərildi.</>}
        {fpStep === "reset" && "Yeni şifrənizi daxil edin."}
      </div>

      {fpStep === "id" && (
        <>
          <div className="flex gap-2">
            {([["email", Mail, "Email"], ["phone", Phone, "Telefon"]]).map(([mt, Icon, label]) => (
              <button key={mt} onClick={() => { setFpMethod(mt); setFpInput(""); setFpError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-semibold transition-all ${fpMethod === mt ? "border-purple-500 bg-purple-50 text-purple-700" : "border-[#e8e4f4] text-[#8a7ba7] hover:border-purple-300"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <div className="relative">
            {fpMethod === "email" ? <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" /> : <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />}
            <input type={fpMethod === "email" ? "email" : "tel"} inputMode={fpMethod === "phone" ? "tel" : undefined}
              placeholder={fpMethod === "email" ? "Email ünvanı" : "+994 50 000 00 00"}
              value={fpInput}
              onChange={e => { const v = fpMethod === "phone" ? fpPhoneFilter(e.target.value) : e.target.value; setFpInput(v); setFpError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className={inputCls} autoFocus />
          </div>
          {fpError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{fpError}</p>}
          <button onClick={handleSend} disabled={fpLoading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
            {fpLoading ? "Göndərilir..." : "Kod göndər →"}
          </button>
        </>
      )}

      {fpStep === "otp" && (
        <>
          <input type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
            value={fpCode} autoFocus
            onChange={e => { setFpCode(e.target.value.replace(/\D/g, "")); setFpError(""); if (e.target.value.replace(/\D/g,"").length >= 4) setFpStep("reset"); }}
            className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-3 text-xl text-center font-black tracking-[0.5em] text-[#241a4d] outline-none focus:border-purple-400 transition-colors" />
          {fpError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{fpError}</p>}
          <button onClick={() => { setFpStep("id"); setFpCode(""); setFpError(""); }}
            className="text-xs font-semibold text-purple-600 hover:underline text-center">
            Kodu yenidən göndər
          </button>
        </>
      )}

      {fpStep === "reset" && (
        <>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
            <input type="password" placeholder="Yeni şifrə (min 6 simvol)" value={fpNew} autoFocus
              onChange={e => { setFpNew(e.target.value); setFpError(""); }}
              className={inputCls} />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
            <input type="password" placeholder="Şifrəni təsdiqlə" value={fpConf}
              onChange={e => { setFpConf(e.target.value); setFpError(""); }}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              className={inputCls} />
          </div>
          {fpError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{fpError}</p>}
          <button onClick={handleReset} disabled={fpLoading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
            {fpLoading ? "Yadda saxlanır..." : "Şifrəni yenilə ✓"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Donation Modal ─────────────────────────────────────────── */
const DONATE_STEPS = ["Məlumat", "Ödəniş", "Təsdiq"];

const isValidAzPhone = (v) => /^(\+994|0)(50|51|55|60|70|77|99)\d{7}$/.test(v.replace(/[\s\-()]/g, ""));
const filterPhoneInput = (v) => v.replace(/[^\d\s+\-()]/g, "");

function DonationModal({ animal, onClose }) {
  const { isGuest, user, login } = useAuth();
  const [step, setStep] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [anonExpanded, setAnonExpanded] = useState(false);
  const [amount, setAmount] = useState(animal.shareMin || "10");
  const [note, setNote] = useState("");
  const [continueMode, setContinueMode] = useState(!isGuest ? "registered" : "");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Inline auth states
  const [authPhase,    setAuthPhase]   = useState(false);
  const [authMode,     setAuthMode]    = useState("login");
  const [authMethod,   setAuthMethod]  = useState("email");
  const [authInput,    setAuthInput]   = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRegFirst, setAuthRegFirst] = useState("");
  const [authRegLast,  setAuthRegLast]  = useState("");
  const [authOtp,      setAuthOtp]     = useState("");
  const [authOtpSent,  setAuthOtpSent] = useState(false);
  const [authLoading,  setAuthLoading] = useState(false);
  const [authError,    setAuthError]   = useState("");
  const [forgotPhase,  setForgotPhase] = useState(false);

  const minAmt = Number(animal.shareMin) || 0.01;
  const maxAmt = animal.remainingAmount != null ? animal.remainingAmount : 999999;
  const numAmt = Number(amount) || 0;
  const validAmt = numAmt >= minAmt && numAmt <= maxAmt;
  const canConfirm = !isGuest
    ? true
    : continueMode === "registered"
      ? true
      : continueMode === "guest"
        ? guestName.trim().length > 0 && guestPhone.trim().length > 0 && isValidAzPhone(guestPhone)
        : false;

  const resetAuth = () => {
    setAuthOtpSent(false); setAuthOtp(""); setAuthError("");
    setAuthInput(""); setAuthPassword(""); setAuthRegFirst(""); setAuthRegLast("");
    setForgotPhase(false);
  };

  const submitDonation = async (overrideUser) => {
    setSubmitting(true);
    const u = overrideUser || user;
    const donorName = [u?.name, u?.lastName].filter(Boolean).join(" ").trim() || guestName.trim();
    const donorPhone = u?.phone || u?.email || guestPhone.trim();
    try {
      const r1 = await api.post(`/campaigns/${animal.campaignId}/donate`, {
        amount: numAmt, donorName, donorPhone, isAnonymous: anonymous, note,
      });
      const { donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${animal.campaignId}/epoint/start`, { donationId });
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  const afterAuth = async (token, u) => {
    login(token, u);
    setAuthPhase(false);
    await submitDonation(u);
  };

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateInput = (val) => {
    if (!val) return authMethod === "email" ? "Email ünvanını daxil edin" : "Telefon nömrəsini daxil edin";
    if (authMethod === "email" && !isValidEmail(val)) return "Email ünvanı düzgün deyil (məs: ad@mail.com)";
    if (authMethod === "phone" && !isValidAzPhone(val)) return "Telefon nömrəsi düzgün deyil (məs: +994501234567)";
    return null;
  };

  const handleAuthLogin = async () => {
    setAuthError("");
    const val = authInput.trim();
    const inputErr = validateInput(val);
    if (inputErr) return setAuthError(inputErr);
    if (!authPassword) return setAuthError("Şifrəni daxil edin");
    if (authPassword.length < 6) return setAuthError("Şifrə minimum 6 simvoldan ibarət olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = authMethod === "email";
      const res = await api.post("/auth/login-password", isEmail ? { email: val, password: authPassword } : { phone: val, password: authPassword });
      const { token, user: u } = res.data.data;
      await afterAuth(token, u);
    } catch (err) {
      const msg = err.response?.data?.message;
      setAuthError(msg?.toLowerCase().includes("not found") || msg?.toLowerCase().includes("tapılmadı")
        ? "Bu hesab tapılmadı. Əvvəlcə qeydiyyatdan keçin."
        : "Email və ya şifrə yanlışdır. Yenidən cəhd edin.");
      setAuthLoading(false);
    }
  };

  const handleAuthSendOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (!authRegFirst.trim()) return setAuthError("Adınızı daxil edin");
    if (!/^[a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s]{2,}$/.test(authRegFirst.trim())) return setAuthError("Ad yalnız hərf ola bilər (min 2 simvol)");
    if (!authRegLast.trim()) return setAuthError("Soyadınızı daxil edin");
    if (!/^[a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s]{2,}$/.test(authRegLast.trim())) return setAuthError("Soyad yalnız hərf ola bilər (min 2 simvol)");
    const inputErr = validateInput(val);
    if (inputErr) return setAuthError(inputErr);
    if (!authPassword) return setAuthError("Şifrəni daxil edin");
    if (authPassword.length < 6) return setAuthError("Şifrə minimum 6 simvoldan ibarət olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = authMethod === "email";
      await api.post("/auth/send-otp", isEmail ? { email: val, isRegister: true } : { phone: val, channel: "sms", isRegister: true });
      setAuthOtpSent(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      setAuthError(msg?.toLowerCase().includes("exist") || msg?.toLowerCase().includes("mövcud")
        ? "Bu email/telefon artıq qeydiyyatdan keçib. Daxil olmağa cəhd edin."
        : msg || "Kod göndərilmədi. Bir az sonra yenidən cəhd edin.");
    } finally { setAuthLoading(false); }
  };

  const handleAuthVerifyOtp = async () => {
    setAuthError("");
    if (!authOtp) return setAuthError("Doğrulama kodunu daxil edin");
    if (authOtp.length < 4) return setAuthError("Doğrulama kodu ən azı 4 rəqəmdən ibarət olmalıdır");
    setAuthLoading(true);
    try {
      const val = authInput.trim();
      const isEmail = authMethod === "email";
      const res = await api.post("/auth/verify-otp", isEmail ? { email: val, code: authOtp, password: authPassword } : { phone: val, code: authOtp, password: authPassword });
      const { token, user: u } = res.data.data;
      const fullName = `${authRegFirst.trim()} ${authRegLast.trim()}`;
      const pRes = await api.put("/auth/profile", { name: fullName }, { headers: { Authorization: `Bearer ${token}` } });
      await afterAuth(pRes.data?.data?.token || token, pRes.data?.data?.user || { ...u, name: fullName });
    } catch (err) {
      const msg = err.response?.data?.message;
      setAuthError(msg?.toLowerCase().includes("expired") ? "Kodun müddəti bitib. Geri qayıdıb yeni kod göndərin." : "Daxil etdiyiniz kod yanlışdır.");
      setAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canConfirm) return;
    if (isGuest && continueMode === "registered") { setAuthPhase(true); return; }
    await submitDonation();
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
          style={{ scrollbarWidth: "thin", scrollbarColor: "#a78bfa transparent" }}
        >
          {/* ── Inline Auth Phase ── */}
          {authPhase && forgotPhase && (
            <ForgotPasswordInline onBack={() => setForgotPhase(false)} onSuccess={afterAuth} />
          )}
          {authPhase && !forgotPhase && (
            <div className="flex flex-col gap-3">
              <button onClick={() => { setAuthPhase(false); resetAuth(); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#8a7ba7] hover:text-[#241a4d] transition-colors self-start">
                <ChevronDown size={13} className="rotate-90" /> Geri qayıt
              </button>
              <div className="flex rounded-2xl bg-[#f0ecff] p-1 gap-1">
                {[["login","Daxil ol"],["register","Qeydiyyat"]].map(([m, label]) => (
                  <button key={m} onClick={() => { setAuthMode(m); resetAuth(); }}
                    className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${authMode === m ? "bg-white shadow-sm text-purple-700" : "text-[#8a7ba7] hover:text-purple-600"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {([["email", Mail, "Email"], ["phone", Phone, "Telefon"]]).map(([mt, Icon, label]) => (
                  <button key={mt} onClick={() => { setAuthMethod(mt); setAuthInput(""); setAuthError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-semibold transition-all ${authMethod === mt ? "border-purple-500 bg-purple-50 text-purple-700" : "border-[#e8e4f4] text-[#8a7ba7] hover:border-purple-300"}`}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
              {authMode === "login" && (
                <div className="flex flex-col gap-2.5 mt-1">
                  <div className="relative">
                    {authMethod === "email" ? <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" /> : <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />}
                    <input type={authMethod === "email" ? "email" : "tel"} inputMode={authMethod === "phone" ? "tel" : undefined}
                      placeholder={authMethod === "email" ? "Email ünvanı" : "+994 50 000 00 00"}
                      value={authInput} onChange={e => { const v = authMethod === "phone" ? e.target.value.replace(/[^\d\s+\-()]/g, "") : e.target.value; setAuthInput(v); setAuthError(""); }}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]" />
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                    <input type="password" placeholder="Şifrə" value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuthLogin()}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]" />
                  </div>
                  {authError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{authError}</p>}
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setForgotPhase(true)}
                      className="text-xs font-semibold text-purple-600 hover:underline">Şifrəmi unutdum</button>
                  </div>
                  <button onClick={handleAuthLogin} disabled={authLoading}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                    {authLoading ? "Giriş edilir..." : "Daxil ol"}
                  </button>
                </div>
              )}
              {authMode === "register" && !authOtpSent && (
                <div className="flex flex-col gap-2.5 mt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Ad" value={authRegFirst} onChange={e => { setAuthRegFirst(e.target.value); setAuthError(""); }}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]" />
                    <input type="text" placeholder="Soyad" value={authRegLast} onChange={e => { setAuthRegLast(e.target.value); setAuthError(""); }}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]" />
                  </div>
                  <div className="relative">
                    {authMethod === "email" ? <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" /> : <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />}
                    <input type={authMethod === "email" ? "email" : "tel"} inputMode={authMethod === "phone" ? "tel" : undefined}
                      placeholder={authMethod === "email" ? "Email ünvanı" : "+994 50 000 00 00"}
                      value={authInput} onChange={e => { const v = authMethod === "phone" ? e.target.value.replace(/[^\d\s+\-()]/g, "") : e.target.value; setAuthInput(v); setAuthError(""); }}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]" />
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                    <input type="password" placeholder="Şifrə (min 6 simvol)" value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuthSendOtp()}
                      className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] pl-9 pr-3 py-2.5 text-sm text-[#241a4d] outline-none focus:border-purple-400 transition-colors placeholder:text-[#c4b5e0]" />
                  </div>
                  {authError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{authError}</p>}
                  <button onClick={handleAuthSendOtp} disabled={authLoading}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                    {authLoading ? "Göndərilir..." : "Kod göndər →"}
                  </button>
                </div>
              )}
              {authMode === "register" && authOtpSent && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2.5 text-xs text-[#8a7ba7]">
                    Doğrulama kodu <b className="text-purple-700">{authInput}</b> ünvanına göndərildi.{" "}
                    <button onClick={() => { setAuthOtpSent(false); setAuthOtp(""); setAuthError(""); }}
                      className="text-purple-600 font-semibold underline">Dəyiş</button>
                  </div>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
                    value={authOtp} autoFocus onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => e.key === "Enter" && handleAuthVerifyOtp()}
                    className="w-full rounded-xl border-2 border-[#e8e4f4] bg-[#f8f6ff] px-3 py-3 text-xl text-center font-black tracking-[0.5em] text-[#241a4d] outline-none focus:border-purple-400 transition-colors" />
                  {authError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{authError}</p>}
                  <button onClick={handleAuthVerifyOtp} disabled={authLoading || authOtp.length < 4}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                    {authLoading ? "Yoxlanılır..." : "Qeydiyyatı tamamla ✓"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!authPhase && step === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                <div className="flex flex-col gap-1.5 text-xs text-[#8a7ba7]">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-purple-500 shrink-0" />
                    <span className="line-clamp-1 font-medium">{animal.organizer}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-purple-500 shrink-0" />
                      <span>{animal.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins size={12} className="text-purple-500 shrink-0" />
                      <span>Qalan: {animal.totalMin} AZN</span>
                    </div>
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

          {!authPhase && step === 1 && (
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

          {!authPhase && step === 2 && (
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
                          inputMode="tel"
                          onChange={(e) => {
                            const v = filterPhoneInput(e.target.value);
                            setGuestPhone(v);
                            setPhoneError(v && !isValidAzPhone(v) ? "Düzgün AZ nömrəsi daxil edin (+994XXXXXXXXX)" : "");
                          }}
                          onBlur={() => {
                            if (guestPhone && !isValidAzPhone(guestPhone))
                              setPhoneError("Düzgün AZ nömrəsi daxil edin (+994XXXXXXXXX)");
                          }}
                          placeholder="+994 50 000 00 00"
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${phoneError ? "border-rose-400 bg-rose-50 focus:border-rose-500" : "border-[#d9cdfa] bg-[#fafafa] focus:border-[#5521c6]"}`}
                        />
                        {phoneError && <p className="mt-1 text-xs text-rose-500">{phoneError}</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
              {anonymous && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                  <button type="button" onClick={() => setAnonExpanded(v => !v)}
                    className="flex w-full items-start justify-between gap-2 text-left">
                    <p className={`text-[12px] font-semibold leading-relaxed text-amber-800 ${anonExpanded ? "" : "line-clamp-2"}`}>
                      Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir. Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur, üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                    </p>
                    <ChevronDown size={14} className={`shrink-0 mt-0.5 text-amber-600 transition-transform duration-200 ${anonExpanded ? "rotate-180" : ""}`} />
                  </button>
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

        {!authPhase && <div className="flex gap-3 border-t border-[#f0ebff] px-5 pb-4 pt-3 shrink-0">
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
                  : isGuest && continueMode === "registered"
                    ? "linear-gradient(135deg, #5b21b6, #7c3aed)"
                    : "linear-gradient(135deg, #059669, #10b981)",
              }}
            >
              {submitting
                ? "Yönləndirilir..."
                : isGuest && continueMode === "registered"
                  ? "Daxil ol →"
                  : "İanəni təsdiqlə ✓"}
            </button>
          )}
        </div>}
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
        <h1 className="flex-1 min-w-0 text-[15px] font-black tracking-[-.02em] text-[#33245f] line-clamp-1">
          {isCompleted
            ? `${fmtDate(campaign.createdAt)} — tamamlandı`
            : `${campaign.animal?.nameAz || "Qurban"}`}
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
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {/* Col 1 — left on mobile: name, weight, date, participants */}
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[18px] font-black text-[#33245f] mb-3">
                    {campaign.animal?.nameAz || "Qurban"}
                  </div>
                  {campaign.animal?.weightRange && (
                    <>
                      <div className="text-[11px] font-bold text-[#8b7dac] mb-1">Diri çəki</div>
                      <div className="text-[13px] font-black text-[#33245f] mb-3">{campaign.animal.weightRange}</div>
                    </>
                  )}
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Açılış tarixi</div>
                  <div className="flex items-center gap-1.5 text-[13px] font-black text-[#33245f] mb-3">
                    <CalendarDays size={14} className="text-[#6840c6]" /> {fmtDate(campaign.createdAt)}
                  </div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">İştirakçı sayı</div>
                  <div className="flex items-center gap-1.5 text-[13px] font-black text-[#33245f]">
                    <Users size={14} className="text-[#5b22c7]" /> {campaign.participantCount} nəfər
                  </div>
                </div>

                {/* Col 2 — right on mobile: total, collected, remaining */}
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Ümumi məbləğ</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-3">
                    <Coins size={16} className="text-[#5b22c7]" /> {campaign.totalAmount} AZN
                  </div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Toplanan məbləğ</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-3">
                    <Coins size={16} className="text-[#5b22c7]" /> {campaign.collectedAmount} AZN
                  </div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Qalan məbləğ</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f]">
                    <Coins size={16} className="text-[#5b22c7]" /> {Number((campaign.remainingAmount || 0).toFixed(2))} AZN
                  </div>
                </div>

                {/* Col 3 — desktop only (md+) */}
                <div className="hidden md:block">
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">İştirakçı sayı</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-5">
                    <Users size={20} className="text-[#5b22c7]" /> {campaign.participantCount} nəfər
                  </div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Qalan məbləğ</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f]">
                    <Coins size={20} className="text-[#5b22c7]" /> {Number((campaign.remainingAmount || 0).toFixed(2))} AZN
                  </div>
                </div>
              </div>

              {/* Status panel */}
              <div className="xl:w-[210px] shrink-0 p-4 border-t xl:border-t-0 xl:border-l border-[#e7e1f0]">
                {isCompleted ? (
                  <div className="flex items-center gap-4 xl:flex-col xl:items-center xl:text-center">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle size={26} />
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">Tamamlandı</span>
                    </div>
                    <button onClick={handleShare}
                      className="flex flex-1 xl:w-full items-center justify-center gap-2 rounded-[6px] border border-[#d9cff0] bg-white py-2 text-[12px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition">
                      <Share2 size={14} /> {copied ? "Kopyalandı!" : "Dostlarınla paylaş"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 xl:flex-col xl:items-center xl:text-center">
                    {/* Ring — left, larger */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="text-[11px] font-bold text-[#6e5b9b]">Tamamlanma</div>
                      <svg width="130" height="130" viewBox="0 0 108 108">
                        <defs>
                          <linearGradient id="camp-detail-ring-grad" x1="54" y1="96" x2="54" y2="12" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#4513ad" />
                            <stop offset="65%" stopColor="#5d28cf" />
                            <stop offset="100%" stopColor="#7b4cea" />
                          </linearGradient>
                        </defs>
                        <circle cx="54" cy="54" r="42" fill="none" stroke="#e6dcff" strokeWidth="9" />
                        <circle cx="54" cy="54" r="42" fill="none" stroke="url(#camp-detail-ring-grad)" strokeWidth="11"
                          strokeLinecap="round"
                          strokeDasharray={`${((campaign.percent || 0) / 100) * 2 * Math.PI * 42} ${(1 - (campaign.percent || 0) / 100) * 2 * Math.PI * 42}`}
                          transform="rotate(90 54 54)" />
                        <text x="54" y="61" textAnchor="middle" fontSize="22" fontWeight="900" fill="#4b14bd">
                          {campaign.percent || 0}%
                        </text>
                      </svg>
                    </div>
                    {/* Right: status on top, share below */}
                    <div className="flex flex-1 flex-col items-center gap-2 xl:w-full">
                      <span className="w-full max-w-[130px] rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-center text-amber-700">Davam edir</span>
                      <button onClick={handleShare}
                        className="flex w-full max-w-[130px] items-center justify-center gap-1.5 rounded-lg border border-[#d9cff0] bg-white px-2 py-1.5 text-[10px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition">
                        <Share2 size={12} /> {copied ? "Kopyalandı!" : "Paylaş"}
                      </button>
                    </div>
                  </div>
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
      if (amount) sessionStorage.setItem("_lastPaidAmount", amount);
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
          className="relative overflow-hidden rounded-xl md:rounded-2xl mx-3 md:mx-6 mt-3 mb-3"
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
          <div className="lg:hidden relative min-h-[180px]">
            <img
              src="/xeyriye_bg_image.png"
              alt="Xeyriyyə"
              className="absolute inset-0 w-full h-full object-cover object-center rounded-xl"
            />
            <div className="relative z-10 p-5 flex flex-col justify-center min-h-[180px]">
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
            <div className="pl-6 py-3 pr-2 flex flex-col justify-center">
              <h1
                className="leading-tight mb-1.5 text-[#241a4d]"
                style={{ fontSize: "1.3rem", fontWeight: 700 }}
              >
                Birlikdə qurban,
                <br />
                <span style={{ color: "#551dc7" }}>birlikdə xeyir.</span>
              </h1>
              <p className="text-gray-500 text-xs mb-3 leading-relaxed max-w-xs">
                Heyvanı birlikdə alın, ehtiyac sahiblərinə çatdıraq.<br />Tam şəffaflıq, tam izlənirlik.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={openNewCampaign}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: "#4b14bd" }}
                >
                  <Plus size={12} /> Yeni açılış et
                </button>
              </div>
              <p className="text-gray-400 text-[11px] mt-2 flex items-center gap-1">
                <ArrowRight size={10} /> Aşağıda davam edən açılışlara basaraq ianə edə bilərsiniz
              </p>
            </div>
            <div className="relative min-h-[130px]">
              <img
                src="/charity-hero.png"
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
        <div className="flex items-center justify-between px-3 md:px-6 mb-2">
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
              <span>{filter}</span>
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
            <>
              {/* Mobile: compact 2-col */}
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                {filtered.map((animal) => (
                  <AnimalCard key={animal.campaignId || animal.type} animal={animal}
                    onDonate={setDonationTarget} onClick={() => openCampaign(animal.campaignId)} />
                ))}
                {Array.from({ length: Math.max(0, 4 - filtered.length) }).map((_, i) => (
                  <NewOpeningPlaceholderCard key={`placeholder-${i}`}
                    animal={filter === "Bütün heyvanlar" ? missingAnimals[i] || null : null}
                    onOpen={openNewCampaign} />
                ))}
              </div>
              {/* Desktop: detailed long card */}
              <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((animal) => (
                  <DesktopAnimalCard key={animal.campaignId || animal.type} animal={animal}
                    onDonate={setDonationTarget} onClick={() => openCampaign(animal.campaignId)} />
                ))}
                {Array.from({ length: Math.max(0, 4 - filtered.length) }).map((_, i) => (
                  <DesktopNewOpeningPlaceholderCard key={`placeholder-${i}`}
                    animal={filter === "Bütün heyvanlar" ? missingAnimals[i] || null : null}
                    onOpen={openNewCampaign} />
                ))}
              </div>
            </>
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
