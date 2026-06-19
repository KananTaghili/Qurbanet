"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
  Home, List, CheckCircle, HelpCircle, FileText, Heart,
  Plus, Bell, User, ChevronDown, Eye, Video, Users,
  ArrowRight, Play, CalendarDays, UsersRound, Share2, Copy, ChevronRight,
  ArrowLeft, X, Wallet, Flag, Beef, Rabbit, BadgeIcon as CamelIcon,
  Coins, Menu, Shield, UserRoundCheck, PlusCircle, Scissors,
  Truck, HandHeart, Mail, Phone, Lock, BarChart3,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────── */
const SIDEBAR_NAV = [
  { icon: Home,        label: "Əsas Səhifə",  page: "home"        },
  { icon: List,        label: "İanələrim",     page: "ianelerim"   },
  { icon: CheckCircle, label: "Tamamlanmış",   page: "tamamlanmis" },
  { icon: HelpCircle,  label: "Necə işləyir", page: "nece"        },
  { icon: FileText,    label: "Şərtlərimiz",  page: "sertler"     },
];

const FEATURES = [
  { icon: Eye,    title: "Tam şəffaflıq",       desc: "Hər addımı izləyə bilərsiniz" },
  { icon: Video,  title: "Canlı izləmə",        desc: "Kəsim anını canlı izləyin"    },
  { icon: Heart,  title: "Ehtiyac sahiblərinə", desc: "Birbaşa çatdırılır"           },
  { icon: Users,  title: "Birlikdə xeyir",      desc: "Paylaş, birlikdə eylə"        },
];

const STATUS_CFG = {
  "Tamamlandı": { label: "Tamamlanıb",        badge: "bg-emerald-50 text-emerald-700", color: "#2f8b58", track: "#dff4e9" },
  "Davam edir": { label: "Açılış davam edir", badge: "bg-amber-50 text-amber-600",    color: "#5a19c9", track: "#eee4ff" },
  "Ləğv olundu":{ label: "Ləğv olundu",       badge: "bg-rose-50 text-rose-500",      color: "#fb4c61", track: "#ffe0e5" },
};

/* ─── API helpers ────────────────────────────────────────────── */
const AZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const ANIMAL_IMG_FALLBACK = { "Dana":"/dana.png","Qoyun":"/qoyun.png","Qoç":"/qoc.png","Dəvə":"/deve.png" };
const CAMPAIGN_STATUS_MAP = { collecting:"Davam edir", completed:"Tamamlandı", cancelled:"Ləğv olundu" };

const AVATAR_PALETTE = [
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ccfbf1", text: "#115e59" },
  { bg: "#e0e7ff", text: "#3730a3" },
  { bg: "#ffedd5", text: "#9a3412" },
];
function avatarColor(name) {
  if (!name || name === "Anonim") return { bg: "#f1f5f9", text: "#64748b" };
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function initials(name) {
  if (!name || name === "Anonim") return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${AZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}
function fmtAmt(v) {
  const n = Number(v || 0);
  return isNaN(n) ? "0" : n.toLocaleString();
}
function mapMyCampaign(c) {
  const img = (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
    || ANIMAL_IMG_FALLBACK[c.animal?.nameAz] || "/qoyun.png";
  const video = (c.media || []).find(m => m.type === "video");
  return {
    id: c._id, campaignNumber: c.campaignNumber || "",
    type: c.animal?.nameAz || "Qurban",
    amount: fmtAmt(c.myPaidAmount), amountRaw: c.myPaidAmount || 0,
    collectedAmount: fmtAmt(c.collectedAmount), totalAmount: fmtAmt(c.totalAmount),
    progressPercent: c.percent || 0,
    startDate: fmtDate(c.createdAt),
    endDate: c.status === "completed" ? fmtDate(c.completedAt) : "—",
    date: fmtDate(c.status === "completed" ? c.completedAt : c.createdAt),
    status: CAMPAIGN_STATUS_MAP[c.status] || "Davam edir",
    organizer: c.iAmOpener ? "Siz açmısınız" : "Siz iştirak etmisiniz",
    participants: c.participantCount || 1,
    img, videoUrl: video?.url || null, iAmOpener: !!c.iAmOpener,
    weightRange: c.animal?.weightRange || "",
    donations: c.donations || [],
  };
}
function mapCompletedCampaign(c) {
  const img = (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
    || ANIMAL_IMG_FALLBACK[c.animal?.nameAz] || "/qoyun.png";
  const video = (c.media || []).find(m => m.type === "video");
  return {
    id: c._id, campaignNumber: c.campaignNumber || "",
    type: c.animal?.nameAz || "Qurban",
    amount: fmtAmt(c.collectedAmount), amountRaw: c.collectedAmount || 0,
    collectedAmount: fmtAmt(c.collectedAmount), totalAmount: fmtAmt(c.totalAmount),
    progressPercent: 100,
    date: fmtDate(c.completedAt), startDate: fmtDate(c.createdAt), endDate: fmtDate(c.completedAt),
    status: "Tamamlandı",
    organizer: c.opener?.isAnonymous ? "Anonim" : (c.opener?.name || "—"),
    participants: c.participantCount || 0,
    img, videoUrl: video?.url || null,
    weightRange: c.animal?.weightRange || "",
    donations: c.donations || [],
  };
}
function mapHomeCampaign(c, minDonation) {
  const img = (c.animal?.imageHome?.startsWith?.("http") ? c.animal.imageHome : null)
    || (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
    || ANIMAL_IMG_FALLBACK[c.animal?.nameAz] || "/qoyun.png";
  return {
    campaignId: c._id,
    type: c.animal?.nameAz || "Qurban",
    progressPercent: c.percent || 0,
    collected: fmtAmt(c.collectedAmount),
    target: fmtAmt(c.totalAmount),
    currency: "AZN",
    organizer: c.opener?.isAnonymous ? "Anonim" : (c.opener?.name || "—"),
    participants: c.participantCount || 0,
    shareMin: String(minDonation || 10),
    shareMinRaw: Number(minDonation || 10),
    targetRaw: Number(c.totalAmount || 0),
    totalMin: fmtAmt(Math.max(0, c.totalAmount - c.collectedAmount)),
    totalMax: fmtAmt(c.totalAmount),
    startTime: fmtDate(c.createdAt),
    img, remainingAmount: c.remainingAmount, status: c.status,
  };
}

const TAB_OPTIONS    = ["Hamısı","Açdığım açılışlar","İştirak etdiyim açılışlar"];
const STATUS_OPTIONS = ["Hamısı","Davam edir","Tamamlandı","Ləğv olundu"];

/* ─── Helpers ────────────────────────────────────────────────── */
function StatCell({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-[#8778a8] mb-0.5">{label}</div>
      <div className="text-[14px] font-bold leading-none text-[#33245f]">
        {value} <span className="text-[11px] font-normal">AZN</span>
      </div>
    </div>
  );
}

function TopStat({ icon: Icon, title, value }) {
  return (
    <div className="flex flex-1 items-center gap-4 px-5 py-4 border-b md:border-b-0 md:border-r border-[#ded5ec] last:border-0">
      <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full text-white"
        style={{ background: "linear-gradient(135deg, #6a24d1, #3d0aa8)", boxShadow: "0 6px 16px rgba(83,25,188,.22)" }}>
        <Icon size={24} strokeWidth={1.9} />
      </div>
      <div>
        <div className="text-[11px] font-medium text-[#33245f] mb-1">{title}</div>
        <div className="text-[18px] font-bold leading-none text-[#24124f]">{value}</div>
        <div className="mt-1 text-[10px] text-[#77689c]">Bugünə kimi</div>
      </div>
    </div>
  );
}

function CircularProgress({ percent, status }) {
  const r = 31, c = 2 * Math.PI * r;
  const cfg = STATUS_CFG[status] || STATUS_CFG["Davam edir"];
  if (status === "Ləğv olundu") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="grid h-[66px] w-[66px] place-items-center rounded-full border-[6px] border-rose-100 text-rose-500">
          <X size={22} strokeWidth={2.2} />
        </div>
        <span className="text-[11px] font-medium text-rose-500">Ləğv olundu</span>
      </div>
    );
  }
  const progress = (Math.min(percent, 100) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="72" height="72" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke={cfg.track} strokeWidth="7" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={cfg.color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={c - progress} strokeLinecap="round" transform="rotate(-90 38 38)" />
        <text x="38" y="43" textAnchor="middle" fontSize="16" fontWeight="700" fill={cfg.color}>{percent}%</text>
      </svg>
      <span className="text-[11px] font-medium text-[#4d3678]">Tamamlanma</span>
    </div>
  );
}

/* ─── Ring Progress (home cards) ─────────────────────────────── */
function RingProgress({ percent, type, img }) {
  const size = 188, r = 82;
  const circ = 2 * Math.PI * r;
  const p    = Math.max(0, Math.min(percent, 100));
  const dash = (p / 100) * circ;
  const id   = `grad-${type.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="relative mx-auto mt-2" style={{ height: 218, width: "100%", maxWidth: 198 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none">
        <defs>
          <linearGradient id={id} x1="94" y1="176" x2="94" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#4513ad" />
            <stop offset="58%"  stopColor="#5f2bd1" />
            <stop offset="100%" stopColor="#7547e6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#d9cdfa" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset="0" transform={`rotate(90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute left-1/2 top-[19px] flex h-[150px] w-[150px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: "#fbfaff" }}>
        <img src={img} alt={type} className="max-h-[85%] max-w-[85%] object-contain" style={{ mixBlendMode: "multiply" }} />
      </div>
      <div className="absolute left-1/2 top-[164px] z-20 -translate-x-1/2 rounded-2xl px-6 py-1.5 leading-none text-white"
        style={{ backgroundColor: "#551dc7", boxShadow: "0 8px 16px rgba(85,29,199,.25)", border: "3px solid white",
          fontSize: "22px", fontWeight: 900, letterSpacing: "-.04em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {p}%
      </div>
    </div>
  );
}

/* ─── Animal Card (home) ─────────────────────────────────────── */
function AnimalCard({ animal, onDonate, onClick }) {
  const [copied, setCopied] = useState(false);
  const _target = animal.targetRaw || 0;
  const paidPct = _target > 0 ? Math.round((animal.shareMinRaw / _target) * 100) : 0;
  const handleShare = async (e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/charity?campaign=${animal.campaignId}`;
    try { await navigator.clipboard.writeText(url); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2600);
  };
  return (
    <div onClick={onClick} className="group flex flex-col overflow-hidden rounded-[22px] border border-[#eee8f6] bg-white px-4 pb-4 pt-4 cursor-pointer transition-all hover:-translate-y-1"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.08)" }}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-[20px] font-bold leading-none text-[#241a4d]">{animal.type}</h3>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600">Davam Edir</span>
      </div>
      <RingProgress percent={animal.progressPercent} type={animal.type} img={animal.img} />
      <div className="mt-1 text-center text-[13px] font-semibold text-[#281d55]">
        {animal.collected} / {animal.target} <span className="text-[#5521c6]">{animal.currency}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl p-3" style={{ backgroundColor: "#f8f5ff" }}>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white shadow-sm" style={{ color: "#5521c6" }}>
            <CalendarDays size={15} strokeWidth={2} />
          </span>
          <div className="text-[11px] font-medium text-[#241a4d]">{animal.startTime}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white shadow-sm" style={{ color: "#5521c6" }}>
            <UsersRound size={15} strokeWidth={2} />
          </span>
          <div className="text-[11px] font-medium text-[#241a4d]">{animal.participants} iştirakçı</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Açan şəxs</div>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700 shrink-0">
            {animal.organizer.split(" ").slice(0, 2).map(w => w[0]).join("")}
          </div>
          <div className="truncate text-[12px] font-medium" style={{ color: "#342760" }}>{animal.organizer}</div>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#5521c6" }} />
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Ödədiyi məbləğ</div>
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-bold text-[#241a4d]">{animal.shareMin} {animal.currency}</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium" style={{ color: "#5521c6" }}>{paidPct}%</span>
        </div>
      </div>
      <div className="mt-3 border-t border-[#eee8f6] pt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Qalan məbləğ</div>
          <div className="text-[17px] font-bold text-[#241a4d]">{animal.totalMin} <span className="text-[11px] font-normal">AZN</span></div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Ümumi məbləğ</div>
          <div className="text-[17px] font-bold text-[#241a4d]">{animal.totalMax} <span className="text-[11px] font-normal">AZN</span></div>
        </div>
      </div>
      <div className="mt-auto pt-3 flex flex-col gap-2">
        <button onClick={(e) => { e.stopPropagation(); handleShare(e); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9cdfa] py-2.5 text-xs font-semibold transition-all hover:bg-white"
          style={{ backgroundColor: "#f7f3ff", color: "#5521c6" }}>
          <Share2 size={13} strokeWidth={2} /> Dostlarını dəvət et
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDonate(animal); }}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
          İanə et →
        </button>
      </div>
      {copied && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#241a4d] px-5 py-3 text-center text-sm font-medium text-white"
          style={{ boxShadow: "0 18px 44px rgba(36,26,77,.28)" }}>
          Keçid kopyalandı
        </div>
      )}
    </div>
  );
}

/* ─── New Opening Placeholder Card ──────────────────────────── */
function NewOpeningPlaceholderCard({ onOpen, animal }) {
  const animalImg = animal
    ? (animal.imageHome || animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || null)
    : null;

  return (
    <div onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-[22px] border-2 border-dashed border-purple-200 bg-white/70 px-4 pb-4 pt-4 cursor-pointer transition-all hover:-translate-y-1 hover:border-purple-400 hover:bg-white"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.04)" }}>

      {/* row 1: title + "Açılış yoxdur" badge */}
      <div className="mb-2 flex items-start justify-between gap-3">
        {animal
          ? <div className="text-[17px] font-black leading-none tracking-[-.03em] text-[#6b4fa0]">{animal.nameAz}</div>
          : <div className="h-[28px] w-20 rounded-lg bg-purple-100/50" />}
        <div className="flex h-[26px] items-center rounded-full bg-purple-50 px-3 text-[11px] font-bold text-purple-300 whitespace-nowrap shrink-0">
          Açılış yoxdur
        </div>
      </div>

      {/* ring — matches RingProgress layout exactly */}
      <div className="relative mx-auto mt-2" style={{ height: 218, width: "100%", maxWidth: 198 }}>
        <svg width="188" height="188" viewBox="0 0 188 188"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 pointer-events-none">
          <circle cx="94" cy="94" r="82" fill="none" stroke="#ede9fe" strokeWidth="7" strokeLinecap="round" />
        </svg>
        <div className="absolute left-1/2 top-[19px] flex h-[150px] w-[150px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-[#f8f5ff]">
          {animalImg
            ? <img src={animalImg} alt={animal.nameAz}
                className="h-full w-full object-cover mix-blend-multiply opacity-40"
                onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = "flex"); }} />
            : null}
          <Plus size={48} className="text-purple-200" strokeWidth={1.5} style={{ display: animalImg ? "none" : "block" }} />
        </div>
        <div className="absolute top-[164px] left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-[#ede9fe] px-6 py-1.5 leading-none text-purple-300"
          style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-.04em", border: "3px solid white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          —%
        </div>
      </div>

      {/* collected / total */}
      <div className="mt-0 text-center text-[12px] font-black tracking-[-.035em] text-purple-200">— / — AZN</div>

      {/* info box: date + participants */}
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f8f5ff] p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white text-purple-200 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <div className="h-[12px] w-16 rounded bg-purple-100/60" />
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white text-purple-200 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <div className="h-[12px] w-12 rounded bg-purple-100/60" />
        </div>
      </div>

      {/* Açan şəxs */}
      <div className="mt-5">
        <div className="mb-2 text-[11px] font-medium text-[#8a7ba7]">Açan şəxs</div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-purple-100/60 shrink-0" />
          <div className="h-[12px] w-28 rounded bg-purple-100/50" />
        </div>
      </div>

      {/* Ödədiyi məbləğ */}
      <div className="mt-5">
        <div className="mb-2 text-[11px] font-medium text-[#8a7ba7]">Ödədiyi məbləğ</div>
        <div className="flex items-end gap-2">
          <div className="h-[22px] w-20 rounded-lg bg-purple-100/50" />
          <div className="h-[22px] w-12 rounded-full bg-purple-100/40" />
        </div>
      </div>

      {/* Qalan / Ümumi */}
      <div className="mt-4 border-t border-[#eee8f6] pt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium text-[#8a7ba7]">Qalan məbləğ</div>
          <div className="h-[26px] w-16 rounded-lg bg-purple-100/50" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium text-[#8a7ba7]">Ümumi məbləğ</div>
          <div className="h-[26px] w-16 rounded-lg bg-purple-100/50" />
        </div>
      </div>

      {/* share + CTA — pinned to bottom, same layout as real card */}
      <div className="mt-auto pt-3 flex flex-col gap-2">
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-100 bg-[#f7f3ff] py-2.5 text-xs font-semibold text-purple-300">
          <Share2 size={13} strokeWidth={2} /> Dostlarını dəvət et
        </div>
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
          <Plus size={15} strokeWidth={2.6} /> Açılış et
        </button>
      </div>
    </div>
  );
}

/* ─── Donation Modal ─────────────────────────────────────────── */
const DONATE_STEPS = ["Məlumat", "Ödəniş", "Təsdiq"];

function DonationModal({ animal, onClose }) {
  const { isGuest, user } = useAuth();
  const [step, setStep]           = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount]       = useState(animal.shareMin || "10");
  const [note, setNote]           = useState("");
  const [continueMode, setContinueMode] = useState(!isGuest ? "registered" : "");
  const [guestName, setGuestName]   = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const minAmt   = Number(animal.shareMin) || 0.01;
  const maxAmt   = animal.remainingAmount != null ? animal.remainingAmount : 999999;
  const numAmt   = Number(amount) || 0;
  const validAmt = numAmt >= minAmt && numAmt <= maxAmt;
  const canConfirm = !isGuest
    ? true
    : continueMode === "guest" ? (guestName.trim().length > 0 && guestPhone.trim().length > 0) : false;

  const handleSubmit = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    const donorName  = !isGuest ? [user?.name, user?.lastName].filter(Boolean).join(" ").trim() : guestName.trim();
    const donorPhone = !isGuest ? (user?.phone || user?.email || "") : guestPhone.trim();
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative h-[560px] max-h-[calc(100vh-2rem)] w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#ede9fe] shrink-0"
          style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shrink-0">
              <img src={animal.img} alt={animal.type}
                className="h-10 w-10 object-contain mix-blend-multiply"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div>
              <div className="font-bold text-[#241a4d]">{animal.type} Qurbanı</div>
              <div className="text-xs text-[#8a7ba7]">Minimum {animal.shareMin} AZN ianə edin</div>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-100 transition-colors">
            <X size={16} className="text-[#8a7ba7]" />
          </button>
        </div>

        {/* Step bar */}
        <div className="flex items-center justify-center gap-2 border-b border-[#f0ebff] px-5 py-2 shrink-0">
          {DONATE_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${i === step ? "text-[#4b14bd]" : i < step ? "text-emerald-600" : "text-[#b0a0c8]"}`}>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i === step ? "bg-[#5521c6] text-white" : i < step ? "bg-emerald-500 text-white" : "bg-[#f0ebff] text-[#b0a0c8]"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                {s}
              </div>
              {i < DONATE_STEPS.length - 1 && <ChevronRight size={12} className="text-[#c4b5e0]" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#a78bfa transparent" }}>

          {/* Step 0: Məlumat */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                <div className="grid grid-cols-3 gap-3 text-xs text-[#8a7ba7]">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-purple-500 shrink-0" />
                    <span className="truncate">{animal.organizer}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-purple-500 shrink-0" />
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
                    <div className="h-full rounded-full" style={{ width: `${animal.progressPercent}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="font-semibold text-[#4b14bd]">{animal.collected} AZN</span>
                    <span className="text-[#8a7ba7]">{animal.target} AZN</span>
                  </div>
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3">
                <div>
                  <div className="text-sm font-bold text-[#241a4d]">Anonim ianə</div>
                  <div className="text-xs text-[#8a7ba7]">Adınız iştirakçılar siyahısında gizli görünsün</div>
                </div>
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-5 w-5 accent-[#5521c6]" />
              </label>
            </div>
          )}

          {/* Step 1: Ödəniş */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">İanə məbləği</label>
                <input type="number" min={minAmt} max={maxAmt} value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-lg font-semibold text-[#241a4d] transition focus:border-[#5521c6] focus:outline-none" />
                <div className={`mt-1 text-xs ${validAmt ? "text-[#8a7ba7]" : "text-rose-500"}`}>
                  Minimum {minAmt} AZN · Qalan: {animal.totalMin} AZN
                </div>
              </div>
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7ba7]">İanə</span>
                  <span className="font-semibold text-[#241a4d]">{numAmt} AZN</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#e5e7eb] pt-2">
                  <span className="font-bold text-[#241a4d]">Cəmi ödəniş</span>
                  <span className="text-base font-bold text-[#5521c6]">{numAmt} AZN</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">Qeyd (istəyə bağlı)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="İanə ilə bağlı qeyd..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-sm text-[#241a4d] transition focus:border-[#5521c6] focus:outline-none placeholder:text-[#c4b5e0]" />
              </div>
            </div>
          )}

          {/* Step 2: Təsdiq */}
          {step === 2 && (
            <div className="space-y-3">
              {!isGuest ? (
                /* Logged-in user: show account auto */
                <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                  <div className="h-10 w-10 rounded-full bg-[#5521c6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#241a4d] truncate">{user?.name}</div>
                    <div className="text-xs text-[#8a7ba7] truncate">{user?.phone || user?.email || "Qeydiyyatlı hesab"}</div>
                  </div>
                  <div className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Aktiv hesab
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setContinueMode("registered")}
                      className={`rounded-2xl border-2 p-3 text-left transition ${continueMode === "registered" ? "border-[#5521c6] bg-purple-50" : "border-[#e5e7eb] hover:border-purple-200"}`}>
                      <div className="font-bold text-[#241a4d] text-sm">Qeydiyyat ilə</div>
                      <div className="mt-0.5 text-xs text-[#8a7ba7]">Hesabınıza daxil olaraq davam edin</div>
                    </button>
                    <button onClick={() => setContinueMode("guest")}
                      className={`rounded-2xl border-2 p-3 text-left transition ${continueMode === "guest" ? "border-[#5521c6] bg-purple-50" : "border-[#e5e7eb] hover:border-purple-200"}`}>
                      <div className="font-bold text-[#241a4d] text-sm">Qeydiyyatsız</div>
                      <div className="mt-0.5 text-xs text-[#8a7ba7]">Ad soyad və nömrə ilə davam edin</div>
                    </button>
                  </div>
                  {continueMode === "guest" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">Ad Soyad</label>
                        <input value={guestName} onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Adınızı daxil edin"
                          className="w-full rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-sm focus:border-[#5521c6] focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#241a4d]">Telefon</label>
                        <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+994 XX XXX XX XX"
                          className="w-full rounded-xl border border-[#d9cdfa] bg-[#fafafa] px-4 py-2.5 text-sm focus:border-[#5521c6] focus:outline-none" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {anonymous && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-[12px] font-semibold leading-relaxed text-amber-800">
                  Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir. Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur, üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                </div>
              )}

              <div className="rounded-2xl border border-purple-100 p-3" style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#4b14bd]">
                  <Shield size={12} /> İanə xülasəsi
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8a7ba7]">Anonim</span>
                    <span className="font-semibold">{anonymous ? "Bəli" : "Xeyr"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7ba7]">Heyvan</span>
                    <span className="font-semibold">{animal.type}</span>
                  </div>
                  {animal.weightRange && (
                    <div className="flex justify-between">
                      <span className="text-[#8a7ba7]">Diri çəki</span>
                      <span className="font-semibold">{animal.weightRange}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-purple-100 pt-2">
                    <span className="font-bold text-[#241a4d]">Ödəniş</span>
                    <span className="font-bold text-[#5521c6]">{numAmt} AZN</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[#f0ebff] px-5 pb-4 pt-3 shrink-0">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-xl border border-[#d9cdfa] py-2.5 text-sm font-semibold text-[#241a4d] hover:bg-[#f5f3ff] transition-colors">
              Geri
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => { if (step === 1 && !validAmt) return; setStep(s => s + 1); }}
              disabled={step === 1 && !validAmt}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
              Davam et
            </button>
          ) : (
            <button onClick={handleSubmit}
              disabled={submitting || !canConfirm}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: submitting ? "#aaa" : "linear-gradient(135deg, #059669, #10b981)" }}>
              {submitting ? "Yönləndirilir..." : "İanəni təsdiqlə ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── İanə Detail Page ───────────────────────────────────────── */
function IaneDetailPage({ item, onBack }) {
  const [showAll, setShowAll]   = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [copied, setCopied]     = useState(false);

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const donations  = item.donations || [];
  const openerDon  = donations.find(d => d.isOpener);
  const otherDons  = donations.filter(d => !d.isOpener);
  const shown      = showAll ? otherDons : otherDons.slice(0, 5);
  const isCompleted = item.status === "Tamamlandı";

  const fmtDonTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    const time = dt.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
    return `${fmtDate(d)}  •  ${time}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-purple-100 bg-white/70 px-4 md:px-6 py-3.5 backdrop-blur-sm">
        <button onClick={onBack}
          className="flex h-9 items-center gap-2 rounded-xl border border-[#ded5ec] bg-white px-3 text-[13px] font-extrabold text-[#4b14bd] shadow-sm hover:bg-purple-50 transition">
          <ArrowLeft size={16} /> Geri qayıt
        </button>
        <h1 className="truncate text-[16px] font-black tracking-[-.02em] text-[#33245f]">
          {isCompleted ? `${item.date} — tamamlanmış açılış` : `${item.type} — ianə detalları`}
        </h1>
      </div>

      <div className="p-4 space-y-3">
        {/* Main info card */}
        <div className="overflow-hidden rounded-[10px] border border-[#e7e1f0] bg-white shadow-[0_4px_14px_rgba(49,22,93,.05)]">
          <div className="flex flex-col xl:flex-row">
            {/* Photo — full height, wide */}
            <div className="xl:w-[260px] shrink-0 bg-[#f5f2ff]">
              <img src={item.img} alt={`${item.type} qurban heyvanı`}
                className="h-[220px] xl:h-full w-full object-cover" />
            </div>

            <div className="flex flex-col xl:flex-row flex-1 divide-y xl:divide-y-0 xl:divide-x divide-[#e7e1f0]">
              {/* Info columns */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 p-4">
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[22px] font-black text-[#33245f] mb-4">{item.type}</div>
                  {item.weightRange && (
                    <>
                      <div className="text-[11px] font-bold text-[#8b7dac] mb-1">Diri çəki</div>
                      <div className="text-[13px] font-black text-[#33245f] mb-3">{item.weightRange}</div>
                    </>
                  )}
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Açılış tarixi</div>
                  <div className="flex items-center gap-1.5 text-[13px] font-black text-[#33245f]">
                    <CalendarDays size={15} className="text-[#6840c6]" /> {item.startDate}
                  </div>
                </div>
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Ümumi məbləğ</div>
                  <div className="flex items-center gap-1.5 text-[17px] font-black text-[#33245f] mb-5">
                    <Coins size={20} className="text-[#5b22c7]" /> {item.totalAmount} AZN
                  </div>
                  {!isCompleted && (
                    <>
                      <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Toplanan məbləğ</div>
                      <div className="flex items-center gap-1.5 text-[17px] font-black text-[#33245f]">
                        <Coins size={20} className="text-[#5b22c7]" /> {item.collectedAmount} AZN
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">İştirakçı sayı</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-5">
                    <Users size={20} className="text-[#5b22c7]" /> {item.participants} nəfər
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
                  <div className="text-[15px] font-black text-emerald-700">Açılış tamamlanıb</div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">Tamamlandı</span>
                  <button onClick={() => setShowVideo(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#1d4ed8] py-2 text-[12px] font-extrabold text-white hover:bg-[#1e40af] transition">
                    <Video size={14} /> Kəsim Videosu
                  </button>
                  <button onClick={handleShare}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#d9cff0] bg-white py-2 text-[12px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition">
                    <Share2 size={14} /> {copied ? "Kopyalandı!" : "Dostlarınla paylaş"}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[11px] font-bold text-[#6e5b9b]">Tamamlanma</div>
                  <svg width="100" height="100" viewBox="0 0 108 108">
                    <defs>
                      <linearGradient id="detail-ring-grad" x1="54" y1="96" x2="54" y2="12" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stopColor="#4513ad" />
                        <stop offset="65%"  stopColor="#5d28cf" />
                        <stop offset="100%" stopColor="#7b4cea" />
                      </linearGradient>
                    </defs>
                    <circle cx="54" cy="54" r="42" fill="none" stroke="#e6dcff" strokeWidth="9" />
                    <circle cx="54" cy="54" r="42" fill="none" stroke="url(#detail-ring-grad)" strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={`${(item.progressPercent / 100) * 2 * Math.PI * 42} ${(1 - item.progressPercent / 100) * 2 * Math.PI * 42}`}
                      transform="rotate(90 54 54)" />
                    <text x="54" y="61" textAnchor="middle" fontSize="22" fontWeight="900" fill="#4b14bd">
                      {item.progressPercent}%
                    </text>
                  </svg>
                  <span className={`rounded px-3 py-1.5 text-[11px] font-black ${STATUS_CFG[item.status]?.badge || "bg-purple-50 text-[#4b14bd]"}`}>
                    {STATUS_CFG[item.status]?.label || item.status}
                  </span>
                </>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Opener row */}
        {openerDon && (
          <div>
            <div className="inline-flex rounded-t-[5px] bg-[#4b14bd] px-3 py-1.5 text-[11px] font-black text-white">Açan şəxs</div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] min-h-[60px] items-center gap-4 rounded-b-[8px] rounded-tr-[8px] border border-[#e1d8ee] bg-[#f5f0ff] px-5 py-3 shadow-[0_3px_10px_rgba(49,22,93,.04)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-black text-sm"
                  style={(() => { const c = avatarColor(openerDon.isAnonymous ? null : openerDon.name); return { backgroundColor: c.bg, color: c.text }; })()}>
                  {openerDon.isAnonymous ? "AN" : initials(openerDon.name)}
                </div>
                <div>
                  <div className="text-[13px] font-black text-[#33245f]">
                    {openerDon.isAnonymous ? "Anonim" : openerDon.name}
                    {!openerDon.isAnonymous && <span className="ml-1 text-[#4b14bd]">●</span>}
                  </div>
                  <div className="text-[12px] font-bold text-[#6f6290]">Açılış edən şəxs</div>
                </div>
              </div>
              <div className="text-[20px] font-black text-[#24124f]">
                {openerDon.amount} AZN
                <span className="ml-2 text-[13px] font-bold text-[#5b22c7]">({Math.round(openerDon.percent)}%)</span>
              </div>
              <div className="text-[11px] font-bold text-[#4f4075] text-right whitespace-nowrap">
                {fmtDate(openerDon.paidAt)}
              </div>
            </div>
          </div>
        )}

        {/* Donors table */}
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
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-[#8b7dac]">
                        Digər iştirakçı yoxdur
                      </td>
                    </tr>
                  )}
                  {shown.map((d, i) => (
                    <tr key={d._id || i} className="border-b border-[#eee8f6] last:border-b-0 hover:bg-purple-50/30 transition-colors">
                      <td className="px-5 py-3 font-black">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                            style={(() => { const c = avatarColor(d.isAnonymous ? null : d.name); return { backgroundColor: c.bg, color: c.text }; })()}>
                            {d.isAnonymous ? "AN" : initials(d.name)}
                          </div>
                          <span>
                            {d.isAnonymous ? "Anonim" : d.name}
                            {!d.isAnonymous && <span className="ml-1 text-[#4b14bd]">●</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black">{d.amount} AZN</td>
                      <td className="px-4 py-3 text-[#5b22c7]">{Math.round(d.percent)}%</td>
                      <td className="px-4 py-3 text-right text-[#4f4075]">{fmtDonTime(d.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {otherDons.length > 5 && (
              <div className="flex justify-center py-4">
                <button onClick={() => setShowAll(v => !v)}
                  className="flex h-10 items-center gap-2 rounded-[6px] border border-[#c8b9eb] px-6 text-[13px] font-black text-[#5b22c7] hover:bg-purple-50 transition">
                  {showAll ? "Daha az göstər" : "Daha çoxunu göstər"}
                  <ChevronDown size={16} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showVideo && item.videoUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(10,4,30,0.72)" }}
          onClick={() => setShowVideo(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e7e1f0] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Video size={16} strokeWidth={2} />
                </div>
                <div className="text-[15px] font-black text-[#33245f]">{item.type} — Kəsim Videosu</div>
              </div>
              <button onClick={() => setShowVideo(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#f3effe] text-[#4b14bd] hover:bg-[#e8deff] transition">
                <X size={16} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video src={item.videoUrl} controls autoPlay className="h-full w-full" style={{ display: "block" }}>
                <source src={item.videoUrl} type="video/mp4" />
              </video>
            </div>
            <div className="flex items-center gap-2.5 border-t border-[#e7e1f0] bg-[#fbfaff] px-5 py-3 text-[12px] font-semibold text-[#6e5b9b]">
              <img src={item.img} alt={item.type} className="h-8 w-8 rounded-lg object-contain bg-purple-50" />
              <span>{item.type}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Tamamlandı</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── İanələrim list ─────────────────────────────────────────── */
function IanelerimPage() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState(null);
  const [activeTab, setActiveTab]         = useState("Hamısı");
  const [statusFilter, setStatusFilter]   = useState("Hamısı");
  const [statusOpen, setStatusOpen]       = useState(false);
  const [videoTarget, setVideoTarget]     = useState(null);
  const [copiedId, setCopiedId]           = useState(null);

  const handleShare = (e, item) => {
    e.stopPropagation();
    const url = `${window.location.origin}/charity`;
    if (navigator.share) {
      navigator.share({ title: `${item.type} qurban kampaniyasına qatıl!`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  useEffect(() => {
    api.get("/campaigns/my")
      .then(res => setOrders((res.data?.data?.campaigns || []).map(mapMyCampaign)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = orders.reduce((s, o) => s + o.amountRaw, 0);

  const filtered = orders.filter((item) => {
    const tabMatch =
      activeTab === "Hamısı" ||
      (activeTab === "Açdığım açılışlar"         && item.iAmOpener === true) ||
      (activeTab === "İştirak etdiyim açılışlar" && item.iAmOpener === false);
    return tabMatch && (statusFilter === "Hamısı" || item.status === statusFilter);
  });

  if (selected) return <IaneDetailPage item={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-3 md:px-4 py-3 md:py-4 pb-20 lg:pb-4">
      {/* Top stats */}
      <div className="mb-4 flex flex-col sm:flex-row overflow-hidden rounded-xl border border-[#e7e1f0] bg-white shadow-sm">
        <TopStat icon={Wallet} title="Bütün ianələrimin toplamı" value={`${fmtAmt(totalPaid)} AZN`} />
        <TopStat icon={Flag}   title="Ümumi ianə sayı"           value={String(orders.length)}       />
        <TopStat icon={Users}  title="Tamamlanmış ianələr"       value={String(orders.filter(o => o.status === "Tamamlandı").length)} />
      </div>

      {/* Tabs + filter */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex overflow-x-auto rounded-lg border border-[#e7e1f0] bg-white shadow-sm w-full sm:w-auto">
          {TAB_OPTIONS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`h-[40px] px-4 text-[12px] font-medium whitespace-nowrap transition shrink-0 ${i > 0 ? "border-l border-[#eee8f6]" : ""} ${
                activeTab === tab ? "bg-[#4b14bd] text-white" : "bg-white text-[#4c3b77] hover:bg-purple-50"
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <button onClick={() => setStatusOpen(!statusOpen)}
            className="flex h-[40px] min-w-[140px] items-center justify-between rounded-lg border border-[#e7e1f0] bg-white px-4 text-[12px] font-medium text-[#4c3b77] shadow-sm gap-2 whitespace-nowrap">
            {statusFilter === "Hamısı" ? "Statusa görə" : statusFilter}
            <ChevronDown size={14} className={`text-[#4b14bd] transition-transform ${statusOpen ? "rotate-180" : ""}`} />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-full overflow-hidden rounded-lg border border-[#e7e1f0] bg-white shadow-lg">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition hover:bg-purple-50 whitespace-nowrap ${statusFilter === s ? "bg-purple-50 text-[#4b14bd]" : "text-[#4c3b77]"}`}>
                  {s === "Hamısı" ? "Bütün statuslar" : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
        </div>
      )}
      <div className="space-y-3">
        {!loading && filtered.map((item) => {
          const cfg = STATUS_CFG[item.status] || STATUS_CFG["Davam edir"];
          return (
            <div key={item.id} onClick={() => setSelected(item)}
              className="cursor-pointer overflow-hidden rounded-2xl border border-[#ece6f5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md my-2">
              {/* Mobile layout */}
              <div className="flex lg:hidden">
                <div className="shrink-0 w-[110px]">
                  <img src={item.img} alt={item.type}
                    className="h-full w-full rounded-l-2xl bg-[#f5f2ff] object-cover" />
                </div>
                <div className="flex-1 min-w-0 p-3 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#33245f]">{item.type}</h3>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="text-[11px] text-[#77689c] mb-1">{item.organizer}</div>
                  {item.weightRange && (
                    <div className="text-[10px] text-[#8778a8] mb-1.5">
                      Diri çəki: <span className="font-semibold text-[#5b22c7]">{item.weightRange}</span>
                    </div>
                  )}
                  <div className={`grid gap-1.5 mb-2 ${item.status === "Tamamlandı" ? "grid-cols-2" : "grid-cols-3"}`}>
                    <div>
                      <div className="text-[10px] text-[#8778a8]">İanəniz</div>
                      <div className="text-[12px] font-bold text-[#33245f]">{item.amount}</div>
                    </div>
                    {item.status !== "Tamamlandı" && (
                      <div>
                        <div className="text-[10px] text-[#8778a8]">Toplanan</div>
                        <div className="text-[12px] font-bold text-[#33245f]">{item.collectedAmount}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-[#8778a8]">Ümumi</div>
                      <div className="text-[12px] font-bold text-[#33245f]">{item.totalAmount}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="scale-[0.78] origin-left shrink-0"><CircularProgress percent={item.progressPercent} status={item.status} /></div>
                    <div className="flex flex-col gap-1 flex-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                        className="flex h-[28px] w-full items-center justify-center gap-1.5 rounded-md bg-[#4b14bd] text-[11px] font-medium text-white">
                        <Users size={12} /> İştirakçılara bax
                      </button>
                      {item.status === "Tamamlandı" && item.videoUrl && (
                        <button onClick={(e) => { e.stopPropagation(); setVideoTarget(item); }}
                          className="flex h-[28px] w-full items-center justify-center gap-1.5 rounded-md bg-[#1d4ed8] text-[11px] font-medium text-white">
                          <Video size={12} /> Kəsim Videosu
                        </button>
                      )}
                      {item.status !== "Ləğv olundu" && (
                        <button onClick={(e) => handleShare(e, item)}
                          className="flex h-[28px] w-full items-center justify-center gap-1.5 rounded-md border border-[#bcaee4] text-[11px] font-medium text-[#5b26c8]">
                          <Share2 size={11} /> {copiedId === item.id ? "Kopyalandı!" : "Paylaş"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden lg:grid grid-cols-[260px_1fr_250px] min-h-[160px]">
                <div className="shrink-0">
                  <img src={item.img} alt={item.type}
                    className="h-full w-full rounded-l-2xl bg-[#f5f2ff] object-cover" />
                </div>
                <div className="px-5 py-4">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-[18px] font-bold leading-none text-[#33245f]">{item.type}</h3>
                    <span className={`rounded px-2.5 py-1 text-[11px] font-medium ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] text-[#77689c]">
                    <User size={13} className="text-[#7760bb]" />{item.organizer}
                  </div>
                  {item.weightRange && (
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[#8778a8]">
                      <Beef size={13} className="text-[#5b22c7]" />
                      Diri çəki: <span className="font-semibold text-[#5b22c7]">{item.weightRange}</span>
                    </div>
                  )}
                  <div className="mb-3.5 grid grid-cols-2 gap-4 max-w-[340px]">
                    <div>
                      <div className="text-[11px] text-[#8778a8]">Başlanma tarixi</div>
                      <div className="mt-0.5 text-[13px] font-semibold text-[#33245f]">{item.startDate}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8778a8]">Bitmə tarixi</div>
                      <div className="mt-0.5 text-[13px] font-semibold text-[#33245f]">{item.endDate}</div>
                    </div>
                  </div>
                  <div className="flex items-end gap-5">
                    <StatCell label="Sizin ianəniz" value={item.amount} />
                    {item.status !== "Tamamlandı" && (
                      <StatCell label="Bu günə kimi ödənən" value={item.collectedAmount} />
                    )}
                    <StatCell label="Ümumi məbləğ" value={item.totalAmount} />
                  </div>
                </div>
                <div className="flex items-center justify-center border-l border-[#e7e1f0] px-5">
                  <div className="w-full max-w-[190px] space-y-2">
                    <div className="flex justify-center"><CircularProgress percent={item.progressPercent} status={item.status} /></div>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                      className="flex h-[32px] w-full items-center justify-center gap-2 rounded-lg bg-[#4b14bd] text-[12px] font-medium text-white hover:bg-[#3d0aa8] transition">
                      <Users size={14} /> İştirakçılara bax
                    </button>
                    {item.status === "Tamamlandı" && item.videoUrl && (
                      <button onClick={(e) => { e.stopPropagation(); setVideoTarget(item); }}
                        className="flex h-[32px] w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] text-[12px] font-medium text-white hover:bg-[#1e40af] transition">
                        <Video size={14} /> Kəsim Videosu
                      </button>
                    )}
                    {item.status !== "Ləğv olundu" && (
                      <button onClick={(e) => handleShare(e, item)}
                        className="flex h-[32px] w-full items-center justify-center gap-2 rounded-lg border border-[#bcaee4] text-[12px] font-medium text-[#5b26c8] hover:bg-purple-50 transition">
                        <Share2 size={13} /> {copiedId === item.id ? "Kopyalandı!" : "Dostlarınla Paylaş"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-14 text-center text-[14px] text-[#77689c]">
            {orders.length === 0 ? "Hələ heç bir ianəniz yoxdur." : "Seçilmiş filterlərə uyğun ianə tapılmadı."}
          </div>
        )}
      </div>

      {/* ── Kəsim Video Modal ── */}
      {videoTarget && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(10,4,30,0.72)" }}
          onClick={() => setVideoTarget(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(10,4,30,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#e7e1f0] px-5 py-4"
              style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#4b14bd] text-white shadow-[0_4px_10px_rgba(75,20,189,.3)]">
                  <Video size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-black text-[#33245f] leading-none truncate">
                    {videoTarget.type} — Kəsim Videosu
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#8778a8]">
                    {videoTarget.endDate} tarixində tamamlanmış qurbanlıq
                  </div>
                </div>
              </div>
              <button
                onClick={() => setVideoTarget(null)}
                className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-[#4b14bd] transition hover:bg-white shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video player */}
            <div className="relative bg-black aspect-video">
              <video
                controls
                autoPlay
                className="h-full w-full"
                poster={videoTarget.img}
                style={{ display: "block" }}
              >
                <source
                  src={videoTarget.videoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}
                  type="video/mp4"
                />
              </video>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-4 border-t border-[#e7e1f0] bg-[#fbfaff] px-5 py-3">
              <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#6e5b9b]">
                <img
                  src={videoTarget.img}
                  alt={videoTarget.type}
                  className="h-8 w-8 rounded-lg object-contain bg-purple-50"
                />
                <span>{videoTarget.organizer}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Tamamlandı
                </span>
              </div>
              <button
                onClick={() => setVideoTarget(null)}
                className="flex h-8 items-center gap-2 rounded-lg border border-[#d9cff0] bg-white px-4 text-[12px] font-bold text-[#4b14bd] hover:bg-[#f6f1ff] transition"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-pages ──────────────────────────────────────────────── */
const NECE_STEPS = [
  {
    icon: "register",
    title: "Qeydiyyatdan keçirsiz və ya Anonim davam edirsiz",
    desc: "Platformada hesab yaradın və ya qeydiyyatdan keçmədən anonim şəkildə davam edərək şəxsiyyətinizi təsdiqləyin.",
    bg: "linear-gradient(135deg, #fff7ed, #fed7aa)",
  },
  {
    icon: "opening",
    title: "Yeni Açılış edirsiz və ya Davam edən açılışlardan seçirsiz",
    desc: "Əgər hansısa qurbanlıq tipi açılışı yoxdursa yeni açılış edə bilərsiniz. Və ya davam edən qurban açılışlarına baxıb, sizə uyğun olanı seçə bilərsiniz.",
    bg: "linear-gradient(135deg, #ecfeff, #a5f3fc)",
  },
  {
    icon: "payment",
    title: "İanə məbləğini daxil edib, ödəniş səhifəsinə keçirsiz",
    desc: "Seçdiyiniz heyvana görə ianə məbləğini daxil edib, təhlükəsiz ödəniş səhifəsinə keçirsiz.",
    bg: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
  },
  {
    icon: "video",
    title: "Tamamlanmış qurbanlığın kəsim videosunu izləyə bilərsiz",
    desc: "Qurbanlığın tam məbləği toplandıqdan sonra qurbanlığı biz alırıq və kəsirik. Kəsim zamanı qurbanlığın kəsim videosu çəkilir və səhifəyə yüklənir.",
    bg: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
  },
  {
    icon: "delivery",
    title: "Kəsilmiş qurbanlığı biz çatdırırıq",
    desc: "Kəsilmiş qurbanlıq doğranaraq paylara bölünür və ehtiyac sahibi ailələrə paylanılır.",
    bg: "linear-gradient(135deg, #f0fdf4, #bbf7d0)",
  },
];

function NeceStepIcon({ icon }) {
  if (icon === "register")
    return <UserRoundCheck size={24} strokeWidth={2.4} className="text-[#ea580c]" />;
  if (icon === "opening")
    return <PlusCircle size={24} strokeWidth={2.4} className="text-[#0891b2]" />;
  if (icon === "payment")
    return <Coins size={24} strokeWidth={2.2} className="text-[#7c3aed]" />;
  if (icon === "video")
    return <Video size={24} strokeWidth={2.2} className="text-[#db2777]" />;
  return <HandHeart size={24} strokeWidth={2.2} className="text-[#16a34a]" />;
}

function NecePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-4 py-5 pb-20 lg:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-black tracking-[-.02em] text-[#241a4d]">Necə işləyir?</h1>
        <p className="mt-1 text-[13px] font-semibold text-[#8778a8]">Kollektiv platformasında qurban prosesi</p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-7 bottom-7 w-0.5 bg-gradient-to-b from-[#e9d9ff] via-[#c4b5fd] to-[#e9d9ff]" />

        <div className="space-y-4">
          {NECE_STEPS.map((s, i) => (
            <div key={i} className="flex gap-4 relative">
              {/* Step icon */}
              <div
                className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center z-10 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{ background: s.bg }}
              >
                <NeceStepIcon icon={s.icon} />
              </div>

              {/* Card */}
              <div className="flex-1 rounded-2xl border border-[#ece6f5] bg-white p-4 shadow-[0_3px_10px_rgba(46,23,92,0.06)]">
                {/* Step number badge */}
                <div className="mb-2 inline-flex items-center justify-center rounded-full bg-[#f1ecff] h-6 w-6">
                  <span className="text-[11px] font-black text-[#5b22c7]">{i + 1}</span>
                </div>
                <div className="text-[14px] font-extrabold leading-snug text-[#241a4d] mb-1.5">
                  {s.title}
                </div>
                <div className="text-[13px] leading-relaxed text-[#6b7280]">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom note */}
      <div className="mt-6 rounded-2xl border border-[#e7e1f0] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6a24d1] to-[#3d0aa8] text-white shadow-[0_4px_10px_rgba(83,25,188,.22)]">
            <Heart size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[13px] font-extrabold text-[#241a4d]">Birlikdə xeyir, birlikdə paylaşaq</div>
            <div className="mt-0.5 text-[12px] text-[#8778a8]">Tam şəffaflıq · Halal kəsim · Ehtiyac sahiblərinə çatdırılır</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SERTLER_STATIC = [
  {
    icon: Beef,
    color: { bg: "bg-amber-50",   icon: "text-amber-500",   title: "text-amber-700"   },
    value: "Hər heyvan növünə 1 ədəd",
    label: "Hər heyvan tipi üçün yalnız 1 açılış ola bilər. Yeni açılış üçün müvafiq heyvan tipinə uyğun davam edən açılışın bitməsi lazımdır.",
  },
  {
    icon: UserRoundCheck,
    color: { bg: "bg-blue-50",    icon: "text-blue-500",    title: "text-blue-700"    },
    value: "Yeni açılışa 1 nəfər",
    label: "Yeni açılışı yalnız bir nəfər edə bilər. Yeni açılış əlavə et səhifəsinə daxil olaraq aktiv görünən heyvan tipini seçib ilkin ödənişi etdikdən sonra açılış baş tutacaq.",
  },
  {
    icon: Lock,
    color: { bg: "bg-rose-50",    icon: "text-rose-500",    title: "text-rose-700"    },
    value: "Anonim açılış və ya ianə",
    label: "Əgər adınızın digər istifadəçilərə görünməsini istəmirsinizsə həm Anonim olaraq açılış edə bilərsiniz, həm də ianə verə bilərsiniz. Bu zaman qeydiyyat etməyə ehtiyac yoxdur.",
  },
  {
    icon: FileText,
    color: { bg: "bg-teal-50",    icon: "text-teal-500",    title: "text-teal-700"    },
    value: "Şəxsi səhifə",
    label: "Əgər qeydiyyatdan keçmisinizsə əsas səhifədən İanələrim bölməsinə keçərək etdiyiniz açılış və ianə detalları haqqında ətraflı məlumat əldə edə bilərsiniz.",
  },
];

function SertlerPage({ minDon = 10, minOpenPct = 30 }) {
  const sertler = [
    {
      icon: BarChart3,
      color: { bg: "bg-violet-50",  icon: "text-violet-500",  title: "text-violet-700"  },
      value: `Yeni Açılış üçün minimum ${minOpenPct}%`,
      label: `Yeni ianə açılışı zamanı ümumi qurbanlıq məbləğinin minimum ${minOpenPct}%-ni açılış edən şəxs ödəməlidir.`,
    },
    {
      icon: Coins,
      color: { bg: "bg-emerald-50", icon: "text-emerald-500", title: "text-emerald-700" },
      value: `İanə üçün minimum ${minDon} AZN`,
      label: `Əsas səhifədə göstərilən açılışı davam edən qurbanlıqlara ianə vermək üçün minimum ${minDon} AZN tələb olunur.`,
    },
    ...SERTLER_STATIC,
  ];
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 pb-20 lg:pb-5">
      <h1 className="text-[#241a4d] mb-1 font-extrabold" style={{ fontSize: "1.35rem" }}>Şərtlərimiz</h1>
      <p className="text-gray-500 text-sm mb-6">Platforma qaydaları və istifadə şərtləri</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sertler.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.value} className="bg-white rounded-2xl p-5 border border-[#eee8f6] shadow-sm">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${s.color.bg}`}>
                <Icon size={22} className={s.color.icon} />
              </div>
              <div className={`font-extrabold mb-2 leading-tight ${s.color.title}`} style={{ fontSize: "1rem" }}>
                {s.value}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompletedStat({ label, value }) {
  return (
    <div className="min-w-[102px] border-r border-[#e7e1f0] pr-5 last:border-r-0 last:pr-0">
      <div className="mb-1.5 text-[11px] font-semibold text-[#8778a8]">{label}</div>
      <div className="text-[15px] font-extrabold leading-none text-[#33245f]">{value}</div>
    </div>
  );
}

function TamamlanmisPage() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [shareMessage, setShareMessage] = useState(false);
  const [videoTarget, setVideoTarget]   = useState(null);

  useEffect(() => {
    api.get("/campaigns/completed")
      .then(res => setOrders((res.data?.data?.campaigns || []).map(mapCompletedCampaign)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = orders;

  const handleShare = async (e, item) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#tamamlanmis-${item.id}`;
    try { await navigator.clipboard.writeText(url); } catch {
      const ta = document.createElement("textarea");
      ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareMessage(true);
    window.setTimeout(() => setShareMessage(false), 2600);
  };

  if (selected) return <IaneDetailPage item={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-4 py-4 pb-20 lg:pb-4">
      {shareMessage && (
        <div className="fixed right-5 top-5 z-50 max-w-sm rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_14px_36px_rgba(28,18,72,0.16)]">
          Səhifənin bağlantısı kopyalandı. Dostlarınla paylaşa bilərsən.
        </div>
      )}

      {/* Summary card */}
      <div className="mb-4 flex overflow-hidden rounded-[11px] border border-[#e7e1f0] bg-white shadow-[0_4px_16px_rgba(63,34,116,0.07)]">
        <div className="flex min-h-[92px] flex-1 items-center gap-5 px-6">
          <div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6a24d1] to-[#3d0aa8] text-white shadow-[0_8px_18px_rgba(83,25,188,.22)]">
            <CheckCircle size={30} strokeWidth={2} />
          </div>
          <div>
            <div className="mb-1 text-[12px] font-extrabold text-[#33245f]">Ümumi tamamlanmış ianə sayı</div>
            <div className="text-[24px] font-black leading-none tracking-[-.03em] text-[#24124f]">{orders.length}</div>
            <div className="mt-1 text-[11px] font-bold text-[#77689c]">Tamamlanmış ianələr</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h1 className="text-[20px] font-black tracking-[-.02em] text-[#33245f]">Tamamlanmış Açılışlar</h1>
        <p className="mt-1 text-[12px] font-semibold text-[#8778a8]">Açılışlar tamamlanma vaxtına görə sıralanıb</p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
        </div>
      )}
      {!loading && sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-14 text-center text-[14px] text-[#77689c]">
          Hələ tamamlanmış ianəniz yoxdur.
        </div>
      )}
      <div className="space-y-3.5">
        {sorted.map((item) => {
          const paidPct = Math.round(
            (Number(item.amount.replace(/[^\d]/g, "")) / Math.max(1, Number(item.totalAmount.replace(/[^\d]/g, "")))) * 100
          );
          return (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelected(item); }}
              role="button"
              tabIndex={0}
              className="group w-full cursor-pointer overflow-hidden rounded-[16px] border border-[#ece6f5] bg-white text-left shadow-[0_5px_16px_rgba(46,23,92,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(46,23,92,0.11)]"
            >
              <div className="grid min-h-[150px] grid-cols-1 lg:grid-cols-[120px_150px_1fr_210px]">
                {/* Date column */}
                <div className="flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[#e7e1f0] bg-[#fbf9ff] px-4 py-4 lg:py-0">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#8778a8]">
                    <span className="text-[#5b22c7] text-[16px] leading-none">•</span>
                    Tamamlanma tarixi
                  </div>
                  <div className="text-[16px] font-black leading-snug text-[#33245f]">
                    {item.date.split(" ").slice(0, 2).join(" ")}
                    <br />
                    {item.date.split(" ")[2]}
                  </div>
                </div>

                {/* Animal image */}
                <div className="hidden lg:flex items-center justify-center p-4 pr-3">
                  <img
                    src={item.img}
                    alt={`${item.type} qurban heyvanı`}
                    className="h-[118px] w-full rounded-[10px] bg-[#f8f5ff] object-contain"
                  />
                </div>

                {/* Info */}
                <div className="px-5 py-4">
                  <div className="mb-2.5 flex items-center gap-3">
                    <img src={item.img} alt={item.type} className="lg:hidden h-[56px] w-[56px] rounded-[8px] object-contain bg-[#f8f5ff]" />
                    <h3 className="text-[20px] font-extrabold leading-none text-[#33245f]">{item.type}</h3>
                  </div>
                  <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-[#77689c]">
                    <User size={14} className="text-[#7760bb]" />
                    <span>{item.organizer}</span>
                    <span className="rounded-full bg-[#f1ecff] px-2.5 py-0.5 text-[11px] font-bold text-[#5622c6]">
                      {paidPct}% · {item.amount} AZN ödədi
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start gap-5">
                    <CompletedStat label="Açılış tarixi"  value={item.date} />
                    <CompletedStat label="Ümumi məbləğ"   value={`${item.totalAmount} AZN`} />
                    <CompletedStat label="İştirakçı sayı" value={`${item.participants} nəfər`} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center border-t lg:border-t-0 lg:border-l border-[#e7e1f0] px-5 py-5 lg:py-4">
                  <div className="w-full max-w-[180px] space-y-2.5">
                    <div className="rounded-[10px] border border-emerald-100 bg-emerald-50 py-3 text-center">
                      <CheckCircle size={26} className="mx-auto mb-1 text-emerald-500" strokeWidth={2} />
                      <div className="text-[11px] font-black text-emerald-600">Açılış tamamlanıb</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                      className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#4b14bd] text-[12px] font-bold text-white transition hover:bg-[#3d0aa8]"
                    >
                      <Users size={15} />İştirakçılara bax
                    </button>
                    {item.videoUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setVideoTarget(item); }}
                        className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[8px] bg-emerald-600 text-[12px] font-bold text-white transition hover:bg-emerald-700"
                      >
                        <Video size={14} />Kəsim Videosu
                      </button>
                    )}
                    <button
                      onClick={(e) => handleShare(e, item)}
                      className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[8px] border border-[#d9cff0] bg-white text-[12px] font-bold text-[#4b14bd] transition hover:bg-[#f6f1ff]"
                    >
                      <Copy size={13} />Dostlarınla paylaş
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Kəsim Video Modal ── */}
      {videoTarget && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(10,4,30,0.72)" }}
          onClick={() => setVideoTarget(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(10,4,30,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e7e1f0] px-5 py-4"
              style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#4b14bd] text-white shadow-[0_4px_10px_rgba(75,20,189,.3)]">
                  <Video size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-black text-[#33245f] leading-none truncate">
                    {videoTarget.type} — Kəsim Videosu
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#8778a8]">
                    {videoTarget.date} tarixində tamamlanmış qurbanlıq
                  </div>
                </div>
              </div>
              <button
                onClick={() => setVideoTarget(null)}
                className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-[#4b14bd] transition hover:bg-white shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video */}
            <div className="relative bg-black aspect-video">
              <video
                controls
                autoPlay
                className="h-full w-full"
                poster={videoTarget.img}
                style={{ display: "block" }}
              >
                <source
                  src={videoTarget.videoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}
                  type="video/mp4"
                />
              </video>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 border-t border-[#e7e1f0] bg-[#fbfaff] px-5 py-3">
              <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#6e5b9b]">
                <img
                  src={videoTarget.img}
                  alt={videoTarget.type}
                  className="h-8 w-8 rounded-lg object-contain bg-purple-50"
                />
                <span>{videoTarget.organizer}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Tamamlandı
                </span>
              </div>
              <button
                onClick={() => setVideoTarget(null)}
                className="flex h-8 items-center gap-2 rounded-lg border border-[#d9cff0] bg-white px-4 text-[12px] font-bold text-[#4b14bd] hover:bg-[#f6f1ff] transition"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── New Opening Modal ──────────────────────────────────────── */
const NOM_STEPS = ["Heyvan növü", "Ödəniş", "Təsdiq"];

function NewOpeningModal({ onClose }) {
  const { isGuest, user, login } = useAuth();

  // campaign flow
  const [step,        setStep]        = useState(0);
  const [selAnimalId, setSelAnimalId] = useState(null);
  const [isAnon,      setIsAnon]      = useState(false);
  const [amount,      setAmount]      = useState("");
  const [note,        setNote]        = useState("");
  const [contMode,    setContMode]    = useState("");
  const [name,        setName]        = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [phone,       setPhone]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // mini auth flow
  const [authPhase,    setAuthPhase]   = useState(false);
  const [authMode,     setAuthMode]    = useState("login");   // "login"|"register"
  const [authMethod,   setAuthMethod]  = useState("email");   // "email"|"phone"
  const [authInput,      setAuthInput]     = useState("");
  const [authPassword,   setAuthPassword]  = useState("");
  const [authRegFirst,   setAuthRegFirst]  = useState("");
  const [authRegLast,    setAuthRegLast]   = useState("");
  const [authOtp,        setAuthOtp]       = useState("");
  const [authOtpSent,  setAuthOtpSent] = useState(false);
  const [authLoading,  setAuthLoading] = useState(false);
  const [authError,    setAuthError]   = useState("");

  useEffect(() => {
    api.get("/campaigns/settings")
      .then(res => {
        const d = res.data?.data || {};
        setSettingsData(d);
        if (d.animals?.length) {
          const mp = d.settings?.maxPerAnimal || 1;
          const first = d.animals.find(a => (a.activeCount || 0) < mp) || d.animals[0];
          setSelAnimalId(first._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const animals       = settingsData?.animals || [];
  const settings      = settingsData?.settings || {};
  const maxPerAnimal  = settings.maxPerAnimal || 1;
  const isAtLimit     = (item) => item.activeCount >= maxPerAnimal;
  const animal        = animals.find(a => String(a._id) === String(selAnimalId)) || null;
  const minPct     = settings.minOpenPercent || 30;
  const minDon     = settings.minDonation    || 10;
  const minAmount  = animal ? Math.min(Math.ceil(Math.round(animal.price * 100) * minPct / 100) / 100, animal.price) : 0;
  const numAmount  = Number(amount || 0);
  const validAmt   = animal ? (numAmount >= minAmount && numAmount <= animal.price) : false;
  const remaining  = animal ? Math.max(animal.price - numAmount, 0) : 0;
  const finalValid = !isGuest || contMode === "registered" || (contMode === "guest" && name.trim() && guestLastName.trim());

  const goNext = () => {
    if (step === 0 && (!animal || isAtLimit(animal))) return;
    if (step === 0) { setAmount(String(minAmount)); setStep(1); return; }
    if (step === 1 && !validAmt) return;
    setStep(s => s + 1);
  };

  const handleConfirm = async () => {
    if (!finalValid || !animal) return;
    // If registered mode but user is still a guest → show mini auth
    if (isGuest && contMode === "registered") {
      setAuthPhase(true);
      return;
    }
    setSubmitting(true);
    try {
      const isGuestMode = isGuest && contMode === "guest";
      const body = {
        animalId: animal._id,
        amount: numAmount,
        isAnonymous: isAnon,
        note: note || undefined,
        ...(!isAnon ? {
          openerName: isGuestMode
            ? `${name.trim()} ${guestLastName.trim()}`
            : (user?.name || ""),
          ...(isGuestMode ? { openerPhone: phone } : {}),
        } : {}),
      };
      const r1 = await api.post("/campaigns", body);
      const { campaignId, donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaignId}/epoint/start`, { donationId });
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  const resetAuth = () => {
    setAuthOtpSent(false); setAuthOtp(""); setAuthError("");
    setAuthInput(""); setAuthPassword(""); setAuthRegFirst(""); setAuthRegLast("");
  };

  const afterAuth = async (token, user) => {
    login(token, user);
    setAuthPhase(false);
    setSubmitting(true);
    try {
      const body = { animalId: animal._id, amount: numAmount, isAnonymous: isAnon, note: note || undefined };
      const r1 = await api.post("/campaigns", body);
      const { campaignId, donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${campaignId}/epoint/start`, { donationId });
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  // LOGIN: email/phone + password
  const handleAuthLogin = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (!val) return setAuthError("Email və ya telefon daxil edin");
    if (!authPassword) return setAuthError("Şifrə daxil edin");
    setAuthLoading(true);
    try {
      const isEmail = val.includes("@");
      const body = isEmail ? { email: val, password: authPassword } : { phone: val, password: authPassword };
      const res = await api.post("/auth/login-password", body);
      const { token, user: u } = res.data.data;
      await afterAuth(token, u);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Giriş uğursuz oldu");
      setAuthLoading(false);
    }
  };

  // REGISTER step 1: validate + send OTP
  const handleAuthSendOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (!authRegFirst.trim()) return setAuthError("Adınızı daxil edin");
    if (!authRegLast.trim())  return setAuthError("Soyadınızı daxil edin");
    if (!val) return setAuthError("Email və ya telefon daxil edin");
    if (!authPassword || authPassword.length < 6) return setAuthError("Şifrə minimum 6 simvol olmalıdır");
    setAuthLoading(true);
    try {
      const isEmail = val.includes("@");
      const body = isEmail
        ? { email: val, isRegister: true }
        : { phone: val, channel: "sms", isRegister: true };
      await api.post("/auth/send-otp", body);
      setAuthOtpSent(true);
    } catch (err) {
      setAuthError(err.response?.data?.message || "OTP göndərilmədi");
    } finally {
      setAuthLoading(false);
    }
  };

  // REGISTER step 2: verify OTP + set password + set name
  const handleAuthVerifyOtp = async () => {
    setAuthError("");
    const val = authInput.trim();
    if (authOtp.length < 4) return setAuthError("OTP kodu daxil edin");
    setAuthLoading(true);
    try {
      const isEmail = val.includes("@");
      const body = isEmail
        ? { email: val, code: authOtp, password: authPassword }
        : { phone: val, code: authOtp, password: authPassword };
      const res = await api.post("/auth/verify-otp", body);
      const { token, user: u } = res.data.data;
      // Set name (registration always needs name)
      const fullName = `${authRegFirst.trim()} ${authRegLast.trim()}`;
      const pRes = await api.put("/auth/profile", { name: fullName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const finalToken = pRes.data?.data?.token || token;
      const finalUser  = pRes.data?.data?.user  || { ...u, name: fullName };
      await afterAuth(finalToken, finalUser);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Kod yanlışdır");
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto flex h-[560px] max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-100 px-5 py-3 shrink-0"
              style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
              <div>
                <div className="font-bold text-[#1a0f2e]">Yeni Açılış Et</div>
                <div className="text-xs text-[#7c6fa0]">Heyvan seçin və minimum 30% ilkin ödəniş edin</div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-100 transition-colors">
                <X size={16} className="text-[#7c6fa0]" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 border-b border-purple-100 px-5 py-2 shrink-0">
              {NOM_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${i === step ? "text-purple-700" : i < step ? "text-emerald-600" : "text-[#7c6fa0]"}`}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      i === step ? "bg-purple-600 text-white" : i < step ? "bg-emerald-500 text-white" : "bg-[#e8e4f4] text-[#7c6fa0]"}`}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    {s}
                  </div>
                  {i < NOM_STEPS.length - 1 && <ChevronDown size={12} className="text-[#7c6fa0] -rotate-90" />}
                </div>
              ))}
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#a78bfa transparent" }}>

              {/* ── Mini Auth Phase ── */}
              {authPhase && (
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => { setAuthPhase(false); resetAuth(); }}
                    className="flex items-center gap-1 text-xs text-[#7c6fa0] hover:text-[#1a0f2e] transition-colors self-start mb-0.5">
                    <ChevronDown size={13} className="rotate-90" /> Geri qayıt
                  </button>

                  {/* Login / Register tabs */}
                  <div className="flex rounded-xl bg-[#f5f3ff] p-1 gap-1">
                    {[["login","Daxil ol"],["register","Qeydiyyat"]].map(([m, label]) => (
                      <button key={m} onClick={() => { setAuthMode(m); resetAuth(); }}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${authMode === m ? "bg-white shadow text-purple-700" : "text-[#7c6fa0]"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Method selector */}
                  <div className="flex gap-2">
                    {([["email", Mail, "Email"], ["phone", Phone, "Telefon"]] ).map(([mt, Icon, label]) => (
                      <button key={mt} onClick={() => { setAuthMethod(mt); setAuthInput(""); setAuthError(""); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-semibold transition-all ${authMethod === mt ? "border-purple-400 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-500"}`}>
                        <Icon size={13} />{label}
                      </button>
                    ))}
                  </div>

                  {/* ── Fixed-height form area ── */}
                  <div className="flex flex-col gap-2" style={{ minHeight: "240px" }}>
                    {/* LOGIN */}
                    {authMode === "login" && (
                      <>
                        <div className="invisible select-none rounded-xl border border-transparent px-3 py-2.5 text-sm" aria-hidden>x</div>
                        <div className="invisible select-none rounded-xl border border-transparent px-3 py-2.5 text-sm" aria-hidden>x</div>
                        <input
                          type={authMethod === "email" ? "email" : "tel"}
                          placeholder={authMethod === "email" ? "Email" : "+994 50 000 00 00"}
                          value={authInput}
                          onChange={e => setAuthInput(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                          <input
                            type="password"
                            placeholder="Şifrə"
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAuthLogin()}
                            className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                          />
                        </div>
                        {authError && <p className="text-xs text-red-500 -mt-0.5">{authError}</p>}
                        <div className="flex justify-end -mt-0.5">
                          <a href="/auth/forgot-password" target="_blank" rel="noopener noreferrer"
                            className="text-xs text-purple-600 hover:text-purple-800 hover:underline transition-colors">
                            Şifrəmi unutdum
                          </a>
                        </div>
                        <button onClick={handleAuthLogin} disabled={authLoading}
                          className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all mt-auto"
                          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                          {authLoading ? "Giriş edilir..." : "Daxil ol"}
                        </button>
                      </>
                    )}

                    {/* REGISTER — step 1 */}
                    {authMode === "register" && !authOtpSent && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Ad"
                            value={authRegFirst}
                            onChange={e => setAuthRegFirst(e.target.value)}
                            className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="Soyad"
                            value={authRegLast}
                            onChange={e => setAuthRegLast(e.target.value)}
                            className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                          />
                        </div>
                        <input
                          type={authMethod === "email" ? "email" : "tel"}
                          placeholder={authMethod === "email" ? "Email" : "+994 50 000 00 00"}
                          value={authInput}
                          onChange={e => setAuthInput(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                          <input
                            type="password"
                            placeholder="Şifrə (min 6 simvol)"
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAuthSendOtp()}
                            className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] pl-9 pr-3 py-2.5 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                          />
                        </div>
                        {authError && <p className="text-xs text-red-500 -mt-0.5">{authError}</p>}
                        <button onClick={handleAuthSendOtp} disabled={authLoading}
                          className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all mt-auto"
                          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                          {authLoading ? "Göndərilir..." : "OTP kodu göndər"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* ── OTP verify (register step 2) ── */}
                  {authMode === "register" && authOtpSent && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-[#7c6fa0]">
                        Kod <b>{authInput}</b> ünvanına göndərildi.{" "}
                        <button onClick={() => { setAuthOtpSent(false); setAuthOtp(""); setAuthError(""); }}
                          className="text-purple-600 underline">Dəyiş</button>
                      </p>
                      <input
                        type="text" inputMode="numeric" maxLength={6}
                        placeholder="6 rəqəmli OTP kodu"
                        value={authOtp}
                        autoFocus
                        onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={e => e.key === "Enter" && handleAuthVerifyOtp()}
                        className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-3 py-2.5 text-sm text-center font-bold tracking-[0.4em] text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                      />
                      {authError && <p className="text-xs text-red-500 -mt-0.5">{authError}</p>}
                      <button onClick={handleAuthVerifyOtp} disabled={authLoading || authOtp.length < 4}
                        className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all"
                        style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                        {authLoading ? "Yoxlanılır..." : "Qeydiyyatı tamamla ✓"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 0 — Animal selection */}
              {!authPhase && step === 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold text-[#1a0f2e]">Heyvan növünü seçin</div>
                  {loadingSettings ? (
                    <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" /></div>
                  ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {animals.map(item => {
                      const limited = isAtLimit(item);
                      const isSelected = !limited && String(selAnimalId) === String(item._id);
                      return (
                        <button key={item._id}
                          onClick={() => !limited && setSelAnimalId(item._id)}
                          disabled={limited}
                          className={`relative rounded-2xl border-2 p-3 text-left transition-all overflow-hidden
                            ${limited ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-70"
                              : isSelected ? "border-purple-500 bg-purple-50"
                              : "border-purple-100 hover:border-purple-300"}`}>
                          {limited && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 rounded-2xl z-10">
                              <span className="rounded-xl bg-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-white text-center leading-snug">
                                Açılış Limitinə<br />Çatıb
                              </span>
                            </div>
                          )}
                          <div className="mb-2 flex items-center gap-2">
                            <img src={item.image || ANIMAL_IMG_FALLBACK[item.nameAz] || "/qoyun.png"} alt={item.nameAz}
                              className="h-10 w-10 rounded-xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                            <div>
                              <div className="text-sm font-bold text-[#1a0f2e]">{item.nameAz}</div>
                              <div className="text-[10px] font-semibold text-purple-700">Qurbanlıq seçimi</div>
                            </div>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs">
                            <div className="rounded-lg bg-white/70 p-1.5">
                              <span className="block text-[#7c6fa0]">Qiymət</span>
                              <b>{item.price.toLocaleString()} AZN</b>
                            </div>
                            <div className="rounded-lg bg-white/70 p-1.5">
                              <span className="block text-[#7c6fa0]">Diri çəki</span>
                              <b>{item.weightRange || "—"}</b>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  )}
                  <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/30 p-3">
                    <div>
                      <div className="text-sm font-bold text-[#1a0f2e]">Anonim açılış</div>
                      <div className="text-xs text-[#7c6fa0]">Adınız iştirakçılara göstərilməyəcək</div>
                    </div>
                    <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)}
                      className="h-5 w-5 accent-purple-700" />
                  </label>
                </div>
              )}

              {/* Step 1 — Payment */}
              {!authPhase && step === 1 && animal && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <img src={animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || "/qoyun.png"} alt={animal.nameAz}
                          className="h-10 w-10 rounded-xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                        <div>
                          <div className="font-bold text-[#1a0f2e]">{animal.nameAz} Qurbanı</div>
                          <div className="text-xs text-[#7c6fa0]">Diri çəki: {animal.weightRange} • {animal.price.toLocaleString()} AZN</div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-[#7c6fa0]">
                        Minimum ilkin ödəniş<br />
                        <b className="text-sm text-purple-700">{minAmount.toLocaleString()} AZN</b>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Ödəmək istədiyiniz məbləğ</label>
                    <input type="number" min={minAmount} max={animal.price} step={0.01} value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] focus:border-purple-400 focus:outline-none transition-colors" />
                    <div className={`mt-1 text-xs ${validAmt ? "text-[#7c6fa0]" : "text-rose-500"}`}>
                      Minimum {minAmount.toLocaleString()} AZN — heyvanın tam məbləği yığılana qədər minimum {minDon} AZN-lik ianələr qəbul olunacaq.
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Qeyd</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Açılışla bağlı qeyd..." rows={2}
                      className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] placeholder:text-[#7c6fa0] focus:border-purple-400 focus:outline-none transition-colors" />
                  </div>
                </div>
              )}

              {/* Step 2 — Confirmation */}
              {!authPhase && step === 2 && animal && (
                <div className="space-y-3">
                  {/* Logged-in: show account card directly */}
                  {!isGuest ? (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                        <Shield size={12} /> Aktiv hesab
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-700 text-sm font-extrabold text-white">
                          {(user?.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-[#1a0f2e]">{user?.name || "İstifadəçi"}</div>
                          <div className="truncate text-xs text-[#7c6fa0]">{user?.phone || user?.email || ""}</div>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Qeydiyyatlı</span>
                      </div>
                    </div>
                  ) : (
                    /* Guest: show mode selector + form */
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setContMode("registered")}
                          className={`rounded-2xl border-2 p-3 text-left transition ${contMode === "registered" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                          <div className="font-bold text-[#1a0f2e]">Qeydiyyat ilə</div>
                          <div className="mt-0.5 text-xs text-[#7c6fa0]">Hesabınıza daxil olaraq davam edin</div>
                        </button>
                        {settings.allowGuest !== false && (
                          <button onClick={() => setContMode("guest")}
                            className={`rounded-2xl border-2 p-3 text-left transition ${contMode === "guest" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                            <div className="font-bold text-[#1a0f2e]">Qeydiyyatsız</div>
                            <div className="mt-0.5 text-xs text-[#7c6fa0]">Ad soyad ilə davam edin</div>
                          </button>
                        )}
                      </div>
                      {contMode === "guest" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Ad</label>
                              <input value={name} onChange={e => setName(e.target.value)} placeholder="Adınız"
                                className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Soyad</label>
                              <input value={guestLastName} onChange={e => setGuestLastName(e.target.value)} placeholder="Soyadınız"
                                className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Telefon</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+994 XX XXX XX XX"
                              className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {isAnon && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-[12px] font-semibold leading-relaxed text-amber-800">
                      Qeyd: Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur. İstifadəçilərə açıq olan bölmələrdə adınız "Anonim" olaraq qeyd ediləcəkdir. Aşağıdakı xanalara daxil edilən məlumatlar yalnız sistem təhlükəsizliyi və əməliyyatın tamamlanması üçün tələb olunur, üçüncü şəxslərlə və ya ictimaiyyətlə qətiyyən paylaşılmır.
                    </div>
                  )}
                  <div className="rounded-2xl border border-purple-100 p-3"
                    style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                      <Shield size={12} /> Açılış xülasəsi
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#7c6fa0]">Heyvan</span>
                        <span className="flex items-center gap-2 font-semibold">
                          <img src={animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || "/qoyun.png"} alt={animal.nameAz} className="h-7 w-7 rounded-full bg-purple-100 object-cover ring-1 ring-purple-200" />
                          {animal.nameAz}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7c6fa0]">Tam məbləğ</span>
                        <span className="font-semibold">{animal.price.toLocaleString()} AZN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7c6fa0]">İlkin ödəniş</span>
                        <span className="font-semibold">{numAmount.toLocaleString()} AZN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7c6fa0]">Anonim</span>
                        <span className="font-semibold">{isAnon ? "Bəli" : "Xeyr"}</span>
                      </div>
                      <div className="flex justify-between border-t border-purple-100 pt-2">
                        <span className="font-bold text-[#1a0f2e]">Qalan toplanacaq</span>
                        <span className="font-bold text-purple-700">{remaining.toLocaleString()} AZN</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[#7c6fa0]">
                    Pay sistemi yoxdur. Tam məbləğ tamamlanana qədər digər istifadəçilər minimum {minDon} AZN ianə edə biləcəklər.
                  </p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            {!authPhase && <div className="flex gap-3 px-5 pb-4 pt-3 shrink-0 border-t border-purple-100">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 rounded-xl border border-purple-200 py-2.5 text-sm font-semibold text-[#1a0f2e] hover:bg-purple-50 transition-colors">
                  Geri
                </button>
              )}
              {step < NOM_STEPS.length - 1 ? (
                <button onClick={goNext} disabled={(step === 0 && !animal) || (step === 1 && !validAmt)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                  Davam et
                </button>
              ) : (
                <button onClick={handleConfirm} disabled={!finalValid || submitting}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                  {submitting ? "Yönləndirilir..." : "Açılışı təsdiqlə ✓"}
                </button>
              )}
            </div>}
          </>
      </div>
    </div>
  );
}

/* ─── Campaign Detail View ───────────────────────────────────── */
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
}

function DetailCircle({ percent }) {
  const size = 108, r = 42, c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(percent, 100));
  const prog = (clamped / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="dcp" x1="54" y1="96" x2="54" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4513ad" />
            <stop offset="65%" stopColor="#5d28cf" />
            <stop offset="100%" stopColor="#7b4cea" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e6dcff" strokeWidth="9" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#dcp)" strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${prog} ${c - prog}`}
          transform={`rotate(90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2+7} textAnchor="middle" fontSize="22" fontWeight="900" fill="#4b14bd">{clamped}%</text>
      </svg>
      <div className="text-[12px] font-bold text-[#6e5b9b]">Tamamlanma</div>
    </div>
  );
}

function CampaignDetailView({ campaignId, onBack, onDonate, minDon = 10 }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showAll, setShowAll]   = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    api.get(`/campaigns/${campaignId}`)
      .then(r => setCampaign(r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#fbfaff]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
    </div>
  );
  if (!campaign) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#fbfaff]">
      <div className="text-[#4b14bd] text-4xl">⚠️</div>
      <div className="text-[#33245f] font-bold">Kampaniya tapılmadı</div>
      <button onClick={onBack} className="mt-2 flex items-center gap-2 rounded-xl border border-[#ded5ec] bg-white px-4 py-2 text-sm font-bold text-[#4b14bd]">
        <ArrowLeft size={15} /> Geri qayıt
      </button>
    </div>
  );

  const isCompleted  = campaign.status === "completed";
  const paidDons     = (campaign.donations || []);
  const openerDon    = paidDons.find(d => d.isOpener);
  const otherDons    = paidDons.filter(d => !d.isOpener);
  const displayDons  = showAll ? otherDons : otherDons.slice(0, 10);
  const animalImg    = campaign.animal?.image || ANIMAL_IMG_FALLBACK[campaign.animal?.nameAz] || "/qoyun.png";

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-purple-100 bg-white/70 px-4 md:px-6 py-3.5 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[#ded5ec] bg-white px-3 text-[13px] font-bold text-[#4b14bd] shadow-sm hover:bg-purple-50 transition">
          <ArrowLeft size={16} /> Geri qayıt
        </button>
        <h1 className="flex-1 truncate text-[17px] font-black text-[#33245f]">
          {isCompleted ? "Tamamlanmış açılış" : "İanəsi davam edən qurbanlıq"}
        </h1>
        {!isCompleted && onDonate && (
          <button
            onClick={() => onDonate({
              campaignId: campaign._id,
              type: campaign.animal?.nameAz || "Qurban",
              img: animalImg,
              shareMin: String(minDon),
              remainingAmount: campaign.remainingAmount,
              targetRaw: campaign.totalAmount,
              shareMinRaw: minDon,
              collected: String(campaign.collectedAmount),
              target: String(campaign.totalAmount),
              totalMin: String(Math.max(0, campaign.totalAmount - campaign.collectedAmount)),
              totalMax: String(campaign.totalAmount),
              currency: "AZN",
            })}
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#4b14bd] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-[#3d0aa8] transition"
          >
            <Heart size={15} /> İanə et
          </button>
        )}
      </div>

      <div className="p-3 md:p-4">
        {/* Info card */}
        <div className="rounded-[10px] border border-[#e7e1f0] bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr_190px] gap-4">
            {/* Animal image */}
            <img src={animalImg} alt={campaign.animal?.nameAz}
              className="h-[180px] w-full xl:h-[210px] rounded-[7px] bg-purple-50 object-contain" />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              <div className="md:border-r border-[#e7e1f0] md:pr-6">
                <div className="text-[23px] font-black text-[#33245f] mb-4">{campaign.animal?.nameAz || "Qurban"}</div>
                {campaign.animal?.weightRange && (
                  <>
                    <div className="mb-1 text-[11px] font-bold text-[#8b7dac]">Diri çəki</div>
                    <div className="text-[14px] font-black text-[#33245f] mb-4">{campaign.animal.weightRange}</div>
                  </>
                )}
                <div className="mb-2 text-[11px] font-bold text-[#8b7dac]">Açılış tarixi</div>
                <div className="flex items-center gap-2 text-[14px] font-black text-[#33245f]">
                  <CalendarDays size={16} className="text-[#6840c6]" />
                  {fmtDate(campaign.createdAt)}
                </div>
              </div>
              <div className="md:border-r border-[#e7e1f0] md:pr-6">
                <div className="mb-2 text-[12px] font-bold text-[#8b7dac]">Ümumi məbləğ</div>
                <div className="flex items-center gap-2 text-[18px] font-black text-[#33245f] mb-8">
                  <Coins size={22} className="text-[#5b22c7]" />{campaign.totalAmount} AZN
                </div>
                <div className="mb-2 text-[12px] font-bold text-[#8b7dac]">Toplanan məbləğ</div>
                <div className="flex items-center gap-2 text-[18px] font-black text-[#33245f]">
                  <Coins size={22} className="text-[#5b22c7]" />{campaign.collectedAmount} AZN
                </div>
              </div>
              <div>
                <div className="mb-2 text-[12px] font-bold text-[#8b7dac]">İştirakçı sayı</div>
                <div className="flex items-center gap-2 text-[15px] font-black text-[#33245f] mb-8">
                  <Users size={20} className="text-[#5b22c7]" />{campaign.participantCount} nəfər
                </div>
                <div className="mb-2 text-[12px] font-bold text-[#8b7dac]">Qalan məbləğ</div>
                <div className="flex items-center gap-2 text-[15px] font-black text-[#33245f]">
                  <Coins size={20} className="text-[#5b22c7]" />{Number(campaign.remainingAmount.toFixed(2))} AZN
                </div>
              </div>
            </div>

            {/* Status box */}
            <div className="rounded-[8px] border border-[#dcd2ec] p-4 text-center flex flex-col items-center justify-center gap-3">
              {isCompleted ? (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle size={28} />
                  </div>
                  <div className="text-[15px] font-black text-emerald-700">Açılış tamamlanıb</div>
                </>
              ) : (
                <>
                  <div className="text-[12px] font-black text-[#6e5b9b]">Qurbanlıq statusu</div>
                  <span className="rounded-[4px] bg-[#fff6dd] px-3 py-1.5 text-[12px] font-black text-[#f59a00]">
                    Açılış davam edir
                  </span>
                  <DetailCircle percent={campaign.percent || 0} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Opener row */}
        {openerDon && (
          <>
            <div className="mt-4 inline-flex rounded-t-[5px] bg-[#4b14bd] px-3 py-1.5 text-[11px] font-black text-white">
              Açan şəxs
            </div>
            <div className="grid min-h-[64px] grid-cols-1 md:grid-cols-3 items-center rounded-[8px] border border-[#e1d8ee] bg-[#f5f0ff] px-5 py-4 shadow-sm gap-3 md:gap-0 mb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-purple-200 text-sm font-black text-purple-800 shrink-0">
                  {(openerDon.isAnonymous ? "A" : (openerDon.name || "?")[0]).toUpperCase()}
                </div>
                <div>
                  <div className="text-[13px] font-black text-[#33245f]">
                    {openerDon.isAnonymous ? "Anonim" : openerDon.name}
                    {!openerDon.isAnonymous && <span className="text-[#4b14bd] ml-1">●</span>}
                  </div>
                  <div className="text-[12px] font-bold text-[#6f6290]">Açılış edən şəxs</div>
                </div>
              </div>
              <div className="text-center text-[20px] font-black text-[#24124f]">
                {openerDon.amount} AZN
                <span className="ml-3 text-[13px] text-[#5b22c7]">({Math.round(openerDon.percent)}%)</span>
              </div>
              <div className="text-right text-[11px] font-bold leading-6 text-[#4f4075]">
                {fmtDate(openerDon.paidAt)}<br />{fmtTime(openerDon.paidAt)}
              </div>
            </div>
          </>
        )}

        {/* Other donors table */}
        {otherDons.length > 0 && (
          <>
            <h2 className="mb-3 text-[15px] font-black text-[#33245f]">
              Digər ödəniş edənlər ({otherDons.length} nəfər)
            </h2>
            <div className="overflow-hidden rounded-[10px] border border-[#e7e1f0] bg-white shadow-sm overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[11px] font-bold text-[#33245f]">
                <thead className="bg-white text-[12px] text-[#8b7dac]">
                  <tr className="border-b border-[#e7e1f0]">
                    <th className="px-5 py-4">#</th>
                    <th className="px-4 py-4">Ad Soyad</th>
                    <th className="px-4 py-4">Ödənilən məbləğ</th>
                    <th className="px-4 py-4">Faiz</th>
                    <th className="px-4 py-4 text-right">Ödəniş tarixi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDons.map((d, i) => (
                    <tr key={d._id || i} className="border-b border-[#eee8f6] last:border-b-0">
                      <td className="px-5 py-3 font-black">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-7 w-7 place-items-center rounded-full shrink-0 text-[9px] font-bold ${d.isAnonymous ? "bg-slate-100 text-slate-500" : "bg-[#f0edf6] text-[#6f6290]"}`}>
                            {d.isAnonymous ? "AN" : (d.name || "?")[0].toUpperCase()}
                          </div>
                          <span>
                            {d.isAnonymous ? "Anonim" : d.name}
                            {!d.isAnonymous && <span className="text-[#4b14bd] ml-1">●</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black">{d.amount} AZN</td>
                      <td className="px-4 py-3 text-[#5b22c7]">{Math.round(d.percent)}%</td>
                      <td className="px-4 py-3 text-right">
                        {fmtDate(d.paidAt)}  •  {fmtTime(d.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {otherDons.length > 10 && !showAll && (
                <div className="flex justify-center py-4">
                  <button onClick={() => setShowAll(true)}
                    className="flex h-10 items-center gap-2 rounded-[6px] border border-[#c8b9eb] px-6 text-[13px] font-black text-[#5b22c7]">
                    Daha çoxunu göstər <ChevronDown size={15} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {otherDons.length === 0 && !openerDon && (
          <div className="mt-4 rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-10 text-center text-sm text-[#77689c]">
            Hələ ödəniş edən yoxdur.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CharityPage() {
  const { isGuest } = useAuth();
  const [page, setPage]                     = useState("home");
  const [filter, setFilter]                 = useState("Bütün heyvanlar");
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [donationTarget, setDonationTarget]       = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen]       = useState(false);
  const [showNewOpening, setShowNewOpening]       = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [homeAnimals, setHomeAnimals]             = useState([]);
  const [allAnimals, setAllAnimals]               = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [pageSettings, setPageSettings]     = useState({ minDon: 10, minOpenPct: 30 });
  const [paymentToast, setPaymentToast]     = useState(null); // { type: "fail", message }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get("campaign");
    if (cId) setSelectedCampaignId(cId);

    if (params.get("payment") === "fail") {
      const msg = params.get("message") || "Ödəniş uğursuz oldu. Yenidən cəhd edin.";
      setPaymentToast({ type: "fail", message: msg });
      window.history.replaceState({}, "", "/charity");
      setTimeout(() => setPaymentToast(null), 6000);
    }

    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      const id = p.get("campaign");
      setSelectedCampaignId(id || null);
      setPage("home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get("/campaigns/settings").catch(() => ({ data: {} })),
      api.get("/campaigns").catch(() => ({ data: {} })),
    ]).then(([sRes, cRes]) => {
      const s        = sRes.data?.data?.settings || {};
      const minDon   = s.minDonation   || 10;
      const minOpenPct = s.minOpenPercent || 30;
      setPageSettings({ minDon, minOpenPct });
      setAllAnimals(sRes.data?.data?.animals || []);
      const campaigns = cRes.data?.data?.campaigns || [];
      setHomeAnimals(campaigns.map(c => mapHomeCampaign(c, minDon)));
    }).finally(() => setAnimalsLoading(false));
  }, []);

  const visibleNav = isGuest
    ? SIDEBAR_NAV.filter(n => n.page !== "ianelerim")
    : SIDEBAR_NAV;

  const openCampaign = (id) => {
    setSelectedCampaignId(id);
    const url = id ? `/charity?campaign=${id}` : "/charity";
    window.history.pushState({}, "", url);
  };

  const closeCampaign = () => {
    setSelectedCampaignId(null);
    window.history.replaceState({}, "", "/charity");
  };

  const setPageGuarded = (p) => {
    if (p === "ianelerim" && isGuest) return;
    closeCampaign();
    setDonationTarget(null);
    setPage(p);
  };

  const filterOptions = useMemo(() => {
    const types = [...new Set(homeAnimals.map(a => a.type))];
    return ["Bütün heyvanlar", ...types];
  }, [homeAnimals]);

  const filtered = filter === "Bütün heyvanlar" ? homeAnimals : homeAnimals.filter(a => a.type === filter);

  // Animals that have no active campaign → shown in placeholder cards
  const activeTypes = new Set(homeAnimals.map(a => a.type));
  const missingAnimals = allAnimals.filter(a => !activeTypes.has(a.nameAz));

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f5ff]">

      {/* Payment fail toast */}
      {paymentToast?.type === "fail" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-3 rounded-2xl bg-white border border-red-200 shadow-2xl px-5 py-4 max-w-sm w-[calc(100vw-2rem)]"
          style={{ boxShadow: "0 8px 32px rgba(220,38,38,.18)" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-lg">✕</div>
          <div className="min-w-0">
            <div className="text-sm font-black text-red-700 mb-0.5">Ödəniş uğursuz oldu</div>
            <div className="text-xs text-red-500 leading-relaxed">{paymentToast.message}</div>
          </div>
          <button onClick={() => setPaymentToast(null)}
            className="shrink-0 text-red-300 hover:text-red-500 transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      )}


      {/* ── Desktop Sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-56 min-h-screen flex-col shrink-0" style={{ backgroundColor: "#301586" }}>
        <div className="px-4 py-5 flex items-center gap-3">
          <Image src="/logo_test.png" alt="meatbox.az" width={44} height={44}
            className="rounded-full object-contain bg-white shadow-sm" />
          <div className="text-white font-semibold text-[15px] tracking-wide">meatbox.az</div>
        </div>
        <div className="px-3 mb-3">
          <button onClick={() => setShowNewOpening(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
            style={{ backdropFilter: "blur(4px)" }}>
            <Plus size={15} /> Yeni açılış et
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {visibleNav.map(({ icon: Icon, label, page: p }) => (
            <button key={p} onClick={() => setPageGuarded(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                page === p ? "bg-white/15 text-white font-semibold" : "text-purple-100/70 hover:bg-white/5 hover:text-white"
              }`}>
              <Icon size={16} className={page === p ? "text-white" : "text-purple-200/60"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mx-3 mb-5 p-3.5 rounded-xl bg-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={13} className="text-white/80" />
            <span className="text-white/80 text-xs font-medium">Birlikdə xeyir,</span>
          </div>
          <span className="text-purple-100/60 text-xs">birlikdə paylaşaq</span>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── TopBar ── */}
        <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 border-b border-purple-900/20 shrink-0"
          style={{ backgroundColor: "#301586" }}>
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0">
              <ArrowLeft size={18} className="text-white" />
            </Link>
            {/* Logo on mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <Image src="/logo_test.png" alt="meatbox.az" width={30} height={30}
                className="rounded-full object-contain bg-white shadow-sm shrink-0" />
            </div>
            <span className="text-[13px] md:text-[16px] font-semibold text-white truncate">
              Kollektiv Qurban-Xeyriyyə Platforması
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative">
              <Bell size={16} className="text-white" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-[#301586]" />
            </button>
            <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center hover:bg-white/10 transition-colors">
              <User size={16} className="text-white" />
            </button>
            <Link href="/auth/register"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#301586] text-[12px] font-semibold hover:bg-purple-50 transition-all shadow-sm">
              Qeydiyyat <ChevronDown size={12} />
            </Link>
            {/* Mobile hamburger */}
            <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden shrink-0 border-b border-purple-900/30 py-2 px-3" style={{ backgroundColor: "#301586" }}>
            {visibleNav.map(({ icon: Icon, label, page: p }) => (
              <button key={p} onClick={() => { setPageGuarded(p); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  page === p ? "bg-white/15 text-white font-semibold" : "text-purple-100/70"
                }`}>
                <Icon size={15} className={page === p ? "text-white" : "text-purple-200/60"} />
                {label}
              </button>
            ))}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3 px-3">
              <Link href="/auth/register"
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white text-[#301586] text-[12px] font-semibold">
                Qeydiyyat
              </Link>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {page === "home" && selectedCampaignId && (
          <CampaignDetailView
            campaignId={selectedCampaignId}
            onBack={closeCampaign}
            onDonate={setDonationTarget}
            minDon={pageSettings.minDon}
          />
        )}

        {page === "home" && !selectedCampaignId && (
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl mx-3 md:mx-6 mt-4 mb-5"
              style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)" }}>
              <div className="absolute top-0 right-0 w-48 md:w-72 h-48 md:h-72 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(30%, -30%)" }} />
              {/* Mobile: stacked */}
              <div className="lg:hidden p-5">
                <h1 className="leading-tight mb-3 text-[#241a4d] text-[1.4rem] font-bold">
                  Birlikdə qurban,<br />
                  <span style={{ color: "#551dc7" }}>birlikdə xeyir.</span>
                </h1>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  Heyvanı birlikdə alın, ehtiyac sahiblərinə çatdıraq. Tam şəffaflıq.
                </p>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <button onClick={() => setShowNewOpening(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all hover:opacity-90"
                    style={{ background: "#4b14bd" }}>
                    <Plus size={13} /> Yeni açılış et
                  </button>
                  <button onClick={() => setPage("nece")}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border bg-white/70 hover:bg-white transition-all"
                    style={{ color: "#4b14bd", borderColor: "rgba(75,20,189,0.3)" }}>
                    <Play size={11} fill="currentColor" /> Necə işləyir?
                  </button>
                </div>
              </div>
              {/* Desktop: 2-col */}
              <div className="hidden lg:grid grid-cols-2 gap-6 items-stretch">
                <div className="pl-8 py-8 pr-2 flex flex-col justify-center">
                  <h1 className="leading-tight mb-3 text-[#241a4d]" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                    Birlikdə qurban,<br />
                    <span style={{ color: "#551dc7" }}>birlikdə xeyir.</span>
                  </h1>
                  <p className="text-gray-500 text-sm mb-5 leading-relaxed max-w-xs">
                    Heyvanı birlikdə alın, ehtiyac sahiblərinə çatdıraq.<br />Tam şəffaflıq, tam izlənirlik.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setShowNewOpening(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: "#4b14bd" }}>
                      <Plus size={14} /> Yeni açılış et
                    </button>
                    <button onClick={() => setPage("nece")}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border bg-white/70 hover:bg-white transition-all"
                      style={{ color: "#4b14bd", borderColor: "rgba(75,20,189,0.3)" }}>
                      <Play size={12} fill="currentColor" /> Necə işləyir?
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-3 flex items-center gap-1">
                    <ArrowRight size={11} /> Aşağıda davam edən açılışlara basaraq ianə edə bilərsiniz
                  </p>
                </div>
                <div className="relative min-h-[220px]">
                  <img src="/charity-hero.png" alt="Qurban heyvanları"
                    className="absolute inset-0 w-full h-full object-cover object-center rounded-r-2xl"
                    style={{ maskImage: "linear-gradient(to right, transparent 0%, black 25%)" }} />
                  <div className="absolute inset-0 rounded-r-2xl"
                    style={{ background: "linear-gradient(to right, #ede9fe 0%, transparent 40%)" }} />
                </div>
              </div>
            </div>

            {/* Filter + heading */}
            <div className="flex items-center justify-between px-3 md:px-6 mb-4">
              <div>
                <h2 className="font-semibold text-[#241a4d] text-base md:text-lg">Davam edən açılışlar</h2>
                <p className="text-gray-400 text-xs mt-0.5">İanə etmək üçün açılışa basın</p>
              </div>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium bg-white border border-[#eee8f6] text-[#241a4d] hover:border-purple-300 transition-all">
                  <span className="hidden sm:inline">{filter}</span>
                  <span className="sm:hidden">Filtr</span>
                  <ChevronDown size={13} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-[#eee8f6] shadow-lg z-10 min-w-[160px] overflow-hidden">
                    {filterOptions.map(opt => (
                      <button key={opt} onClick={() => { setFilter(opt); setDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-purple-50 ${filter === opt ? "text-purple-700 font-semibold bg-purple-50" : "text-[#241a4d]"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
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
                  {filtered.map(animal => (
                    <AnimalCard key={animal.campaignId || animal.type} animal={animal}
                      onDonate={setDonationTarget}
                      onClick={() => openCampaign(animal.campaignId)} />
                  ))}
                  {Array.from({ length: Math.max(0, 4 - filtered.length) }).map((_, i) => (
                    <NewOpeningPlaceholderCard key={`placeholder-${i}`} animal={filter === "Bütün heyvanlar" ? (missingAnimals[i] || null) : null} onOpen={() => setShowNewOpening(true)} />
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mx-3 md:mx-6 mb-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 text-center border border-[#eee8f6] hover:shadow-md transition-all"
                  style={{ boxShadow: "0 4px 18px rgba(54,27,99,0.02)" }}>
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(75,20,189,0.08)" }}>
                    <Icon size={16} style={{ color: "#4b14bd" }} />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#241a4d] leading-tight">{title}</div>
                    <div className="text-[10px] mt-0.5 leading-snug" style={{ color: "#8a7ba7" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {page === "ianelerim" && (
          isGuest ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 pb-24 lg:pb-14 text-center bg-[#fbfaff]">
              <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl mb-5"
                style={{ background: "linear-gradient(135deg,#f0ebff,#e4d9ff)" }}>
                <List size={32} style={{ color: "#4b14bd" }} />
              </div>
              <h2 className="text-[20px] font-black text-[#241a4d] mb-2">Giriş tələb olunur</h2>
              <p className="text-[14px] text-[#77689c] mb-6 max-w-xs leading-relaxed">
                İanələrim səhifəsini görmək üçün qeydiyyatdan keçin və ya hesabınıza daxil olun.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-[220px]">
                <Link href="/auth/register"
                  className="flex h-[44px] items-center justify-center rounded-xl text-[14px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#4b14bd,#7c3aed)" }}>
                  Qeydiyyatdan keç
                </Link>
                <Link href="/auth/login"
                  className="flex h-[44px] items-center justify-center rounded-xl border border-[#d9cff0] text-[14px] font-bold text-[#4b14bd] bg-white hover:bg-[#f6f1ff] transition">
                  Daxil ol
                </Link>
              </div>
            </div>
          ) : (
            <IanelerimPage />
          )
        )}
        {page === "tamamlanmis" && <TamamlanmisPage />}
        {page === "nece"        && <NecePage />}
        {page === "sertler"     && <SertlerPage minDon={pageSettings.minDon} minOpenPct={pageSettings.minOpenPct} />}
      </div>

      {/* ── Mobile Bottom Nav (< lg) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#e7e1f0] bg-white flex">
        {visibleNav.map(({ icon: Icon, label, page: p }) => (
          <button key={p} onClick={() => { setPageGuarded(p); setMobileMenuOpen(false); }}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
              page === p ? "text-[#4b14bd]" : "text-gray-400"
            }`}>
            <Icon size={20} strokeWidth={page === p ? 2.2 : 1.8} />
            <span className="text-[9px] font-medium leading-none truncate max-w-[52px]">{label}</span>
          </button>
        ))}
      </nav>

      {donationTarget && (
        <DonationModal animal={donationTarget} onClose={() => setDonationTarget(null)} />
      )}
      {showNewOpening && (
        <NewOpeningModal onClose={() => setShowNewOpening(false)} />
      )}
    </div>
  );
}
