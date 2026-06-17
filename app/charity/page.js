"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
  Home, List, CheckCircle, HelpCircle, FileText, Heart,
  Plus, Bell, User, ChevronDown, Eye, Video, Users,
  ArrowRight, Play, CalendarDays, UsersRound, Share2,
  ArrowLeft, X, Wallet, Flag, Beef, Rabbit, BadgeIcon as CamelIcon,
  Coins, Menu, Shield, UserRoundCheck, PlusCircle, Scissors,
  Truck, HandHeart,
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
    donations: c.donations || [],
  };
}
function mapHomeCampaign(c, minDonation) {
  const img = (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
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
function AnimalCard({ animal, onDonate }) {
  const [copied, setCopied] = useState(false);
  const toNum   = (v) => Number(String(v).replace(/[^0-9.]/g, ""));
  const paidPct = Math.round((toNum(animal.shareMin) / Math.max(toNum(animal.target), 1)) * 100);
  const handleShare = async (e) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2600);
  };
  return (
    <div className="group flex flex-col overflow-hidden rounded-[22px] border border-[#eee8f6] bg-white px-4 pb-4 pt-4 cursor-pointer transition-all hover:-translate-y-1"
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
      <button onClick={handleShare}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9cdfa] py-2.5 text-xs font-medium transition-all hover:bg-white"
        style={{ backgroundColor: "#f7f3ff", color: "#5521c6" }}>
        <Share2 size={13} strokeWidth={2} /> İanəyə Dəvət Et
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDonate(animal); }}
        className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-white opacity-0 transition-all group-hover:opacity-100"
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

/* ─── Donation Modal ─────────────────────────────────────────── */
function DonationModal({ animal, onClose }) {
  const [amount, setAmount]       = useState(animal.shareMin || "10");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const n = Number(amount);
    if (!n || n < 1) return alert("Düzgün məbləğ daxil edin");
    setSubmitting(true);
    try {
      const r1 = await api.post(`/campaigns/${animal.campaignId}/donate`, { amount: n });
      const { donationId } = r1.data.data;
      const r2 = await api.post(`/campaigns/${animal.campaignId}/epoint/start`, { donationId });
      window.location.href = r2.data.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#241a4d]">{animal.type} — İanə et</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>
        <div className="mb-1 text-xs text-[#8a7ba7]">Qalan: <b className="text-[#241a4d]">{animal.totalMin} AZN</b></div>
        <div className="mb-4">
          <label className="text-xs font-medium text-[#8a7ba7] mb-1.5 block">Məbləğ (AZN)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={animal.shareMin || 10}
            className="w-full border border-[#d9cdfa] rounded-xl px-4 py-3 text-lg font-semibold text-[#241a4d] focus:outline-none focus:border-[#5521c6]" />
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #4b14bd, #7c3aed)" }}>
          {submitting ? "Yönləndirilir..." : "Ödəməyə keç"}
        </button>
      </div>
    </div>
  );
}

/* ─── İanə Detail Page ───────────────────────────────────────── */
function IaneDetailPage({ item, onBack }) {
  const toNum   = (v) => Number(String(v).replace(/[^0-9.]/g, ""));
  const remaining = Math.max(0, toNum(item.totalAmount) - toNum(item.collectedAmount)).toLocaleString("en-US");
  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] pb-20 lg:pb-0">
      <div className="flex items-center gap-3 border-b border-purple-100 bg-white/70 px-4 py-3 backdrop-blur-sm">
        <button onClick={onBack}
          className="flex h-9 items-center gap-2 rounded-xl border border-[#ded5ec] bg-white px-3 text-[13px] font-semibold text-[#4b14bd] shadow-sm hover:bg-purple-50 transition">
          <ArrowLeft size={16} /> Geri qayıt
        </button>
        <h1 className="text-[15px] font-semibold text-[#33245f] truncate">{item.type} — ianə detalları</h1>
      </div>
      <div className="p-4 space-y-4">
        {/* Main card */}
        <div className="rounded-2xl border border-[#e7e1f0] bg-white p-4 shadow-sm">
          <div className="flex flex-col lg:grid lg:grid-cols-[160px_1fr_190px] gap-4">
            <img src={item.img} alt={item.type}
              className="h-[160px] w-full lg:h-[190px] rounded-xl bg-purple-50 object-contain" />
            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-2">
              <div>
                <div className="text-[20px] font-bold text-[#33245f] mb-4">{item.type}</div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-1.5">Açılış tarixi</div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#33245f]">
                  <CalendarDays size={14} className="text-[#6840c6]" />{item.startDate}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-1.5">İştirakçı</div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#33245f] mb-4">
                  <Users size={16} className="text-[#5b22c7]" />{item.participants} nəfər
                </div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-1.5">Toplanan</div>
                <div className="text-[15px] font-bold text-[#33245f]">{item.collectedAmount} AZN</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-1.5">Ümumi məbləğ</div>
                <div className="text-[14px] font-bold text-[#33245f] mb-4">{item.totalAmount} AZN</div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-1.5">Qalan məbləğ</div>
                <div className="text-[14px] font-bold text-[#33245f]">{remaining} AZN</div>
              </div>
            </div>
            {/* Status ring */}
            <div className="rounded-xl border border-[#dcd2ec] p-4 text-center flex flex-col items-center gap-3">
              <div className="text-[12px] font-medium text-[#6e5b9b]">Qurbanlıq statusu</div>
              <span className={`rounded px-3 py-1.5 text-[12px] font-semibold ${STATUS_CFG[item.status]?.badge || ""}`}>
                {STATUS_CFG[item.status]?.label || item.status}
              </span>
              <svg width="100" height="100" viewBox="0 0 108 108">
                <defs>
                  <linearGradient id="detail-ring" x1="54" y1="96" x2="54" y2="12" gradientUnits="userSpaceOnUse">
                    <stop offset="0%"   stopColor="#4513ad" />
                    <stop offset="65%"  stopColor="#5d28cf" />
                    <stop offset="100%" stopColor="#7b4cea" />
                  </linearGradient>
                </defs>
                <circle cx="54" cy="54" r="42" fill="none" stroke="#e6dcff" strokeWidth="9" />
                <circle cx="54" cy="54" r="42" fill="none" stroke="url(#detail-ring)" strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - item.progressPercent / 100)}
                  transform="rotate(90 54 54)" />
                <text x="54" y="61" textAnchor="middle" fontSize="20" fontWeight="700" fill="#4b14bd">
                  {item.progressPercent}%
                </text>
              </svg>
              <div className="text-[11px] font-medium text-[#6e5b9b]">Tamamlanma</div>
            </div>
          </div>
        </div>
        {/* Organizer */}
        <div>
          <div className="inline-flex rounded-t-md bg-[#4b14bd] px-3 py-1.5 text-[11px] font-medium text-white">Açan şəxs</div>
          <div className="rounded-b-xl rounded-tr-xl border border-[#e1d8ee] bg-[#f5f0ff] px-4 py-3 flex flex-wrap items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-purple-200 grid place-items-center text-purple-700 font-semibold text-[11px] shrink-0">RƏ</div>
            <div>
              <div className="text-[13px] font-semibold text-[#33245f]">Rəşad Əhmədov <span className="text-[#4b14bd]">●</span></div>
              <div className="text-[12px] text-[#6f6290]">Açılış edən şəxs</div>
            </div>
            <div className="ml-auto text-[18px] font-bold text-[#24124f]">
              450 AZN <span className="text-[12px] font-normal text-[#5b22c7]">(30%)</span>
            </div>
          </div>
        </div>
        {/* Payers */}
        <div>
          <h2 className="mb-3 text-[14px] font-semibold text-[#33245f]">Digər ödəniş edənlər ({PAYERS.length} nəfər)</h2>
          <div className="overflow-x-auto rounded-xl border border-[#e7e1f0] bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-left text-[12px] text-[#33245f]">
              <thead>
                <tr className="border-b border-[#e7e1f0] text-[11px] text-[#8b7dac]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Ad Soyad</th>
                  <th className="px-4 py-3">Məbləğ</th>
                  <th className="px-4 py-3">Faiz</th>
                  <th className="px-4 py-3 text-right">Tarix</th>
                </tr>
              </thead>
              <tbody>
                {PAYERS.map((p) => (
                  <tr key={p[0]} className="border-b border-[#eee8f6] last:border-b-0 hover:bg-purple-50/30">
                    <td className="px-4 py-2.5 font-semibold">{p[0]}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-purple-100 text-purple-700 text-[9px] font-semibold shrink-0">{p[1].split(" ").slice(0, 2).map(w => w[0]).join("")}</div>
                        <span>{p[1]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{p[2]}</td>
                    <td className="px-4 py-2.5 text-[#5b22c7]">{p[3]}</td>
                    <td className="px-4 py-2.5 text-right text-[#4f4075]">{p[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center py-3">
              <button className="flex h-8 items-center gap-2 rounded-lg border border-[#c8b9eb] px-4 text-[12px] font-medium text-[#5b22c7] hover:bg-purple-50 transition">
                Daha çoxunu göstər <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
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
              className="cursor-pointer overflow-hidden rounded-2xl border border-[#ece6f5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              {/* Mobile layout */}
              <div className="flex lg:hidden gap-3 p-2.5">
                <img src={item.img} alt={item.type}
                  className="w-[80px] self-stretch rounded-xl bg-purple-50 object-contain shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#33245f]">{item.type}</h3>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="text-[11px] text-[#77689c] mb-1">{item.organizer}</div>
                  <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    <div>
                      <div className="text-[10px] text-[#8778a8]">İanəniz</div>
                      <div className="text-[12px] font-bold text-[#33245f]">{item.amount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8778a8]">Toplanan</div>
                      <div className="text-[12px] font-bold text-[#33245f]">{item.collectedAmount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8778a8]">Ümumi</div>
                      <div className="text-[12px] font-bold text-[#33245f]">{item.totalAmount}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="scale-[0.78] origin-left shrink-0"><CircularProgress percent={item.progressPercent} status={item.status} /></div>
                    <div className="flex flex-col gap-1 flex-1">
                      <button onClick={(e) => { e.stopPropagation(); if (item.status === "Tamamlandı") setVideoTarget(item); }}
                        className="flex h-[28px] w-full items-center justify-center gap-1.5 rounded-md bg-[#4b14bd] text-[11px] font-medium text-white">
                        {item.status === "Tamamlandı"
                          ? <><Video size={12} /> Kəsim Videosu</>
                          : <><Users size={12} /> İştirakçılara bax</>}
                      </button>
                      {item.status !== "Ləğv olundu" && (
                        <button onClick={(e) => e.stopPropagation()}
                          className="flex h-[28px] w-full items-center justify-center gap-1.5 rounded-md border border-[#bcaee4] text-[11px] font-medium text-[#5b26c8]">
                          <Share2 size={11} /> Paylaş
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden lg:grid grid-cols-[155px_1fr_250px] min-h-[148px]">
                <div className="p-4 pr-2">
                  <img src={item.img} alt={item.type}
                    className="h-[120px] w-full rounded-xl bg-purple-50 object-cover" />
                </div>
                <div className="px-4 py-4">
                  <div className="mb-2.5 flex items-center gap-3">
                    <h3 className="text-[18px] font-bold leading-none text-[#33245f]">{item.type}</h3>
                    <span className={`rounded px-2.5 py-1 text-[11px] font-medium ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-[11px] text-[#77689c]">
                    <User size={13} className="text-[#7760bb]" />{item.organizer}
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-4 max-w-[340px]">
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
                    <StatCell label="Sizin ianəniz"       value={item.amount}          />
                    <StatCell label="Bu günə kimi ödənən" value={item.collectedAmount} />
                    <StatCell label="Ümumi məbləğ"        value={item.totalAmount}     />
                  </div>
                </div>
                <div className="flex items-center justify-center border-l border-[#e7e1f0] px-5">
                  <div className="w-full max-w-[190px] space-y-2">
                    <div className="flex justify-center"><CircularProgress percent={item.progressPercent} status={item.status} /></div>
                    <button onClick={(e) => { e.stopPropagation(); if (item.status === "Tamamlandı") setVideoTarget(item); }}
                      className="flex h-[32px] w-full items-center justify-center gap-2 rounded-lg bg-[#4b14bd] text-[12px] font-medium text-white hover:bg-[#3d0aa8] transition">
                      {item.status === "Tamamlandı"
                        ? <><Video size={14} /> Kəsim Videosu</>
                        : <><Users size={14} /> İştirakçılara bax</>}
                    </button>
                    {item.status !== "Ləğv olundu" && (
                      <button onClick={(e) => e.stopPropagation()}
                        className="flex h-[32px] w-full items-center justify-center gap-2 rounded-lg border border-[#bcaee4] text-[12px] font-medium text-[#5b26c8] hover:bg-purple-50 transition">
                        <Share2 size={13} /> Dostlarınla Paylaş
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
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#f1ecff] px-2.5 py-0.5">
                  <span className="text-[10px] font-black text-[#5b22c7]">Addım {i + 1}</span>
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

function SertlerPage() {
  const stats = [
    { value: "30%",     label: "Dana, Qoç, Dəvə üçün ən az 30% toplanmalıdır" },
    { value: "10 AZN",  label: "Ən az 10 AZN ianə etmək mümkündür" },
    { value: "1 gün",   label: "Ödənişdən 1 gün sonra geri qaytarıla bilər" },
    { value: "1 nəfər", label: "Hər açılışa 1 nəfər maksimum iştirak edə bilər" },
    { value: "7 gün",   label: "Kəsimdən əvvəl 7 gün müddəti qalan açılışlar" },
    { value: "Anonim",  label: "Anonim ianə etmək mümkündür" },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 pb-20 lg:pb-5">
      <h1 className="text-[#241a4d] mb-1 text-xl font-semibold">Şərtlərimiz</h1>
      <p className="text-gray-500 text-sm mb-5">Platforma qaydaları və istifadə şərtləri</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#eee8f6] shadow-sm">
            <div className="font-bold text-purple-700 mb-1 text-2xl">{s.value}</div>
            <div className="text-sm text-gray-500 leading-relaxed">{s.label}</div>
          </div>
        ))}
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
              <div className="grid min-h-[150px] grid-cols-1 lg:grid-cols-[132px_168px_1fr_250px]">
                {/* Date column */}
                <div className="flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[#e7e1f0] bg-[#fbf9ff] px-5 py-4 lg:py-0">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8778a8]">
                    <CalendarDays size={14} className="text-[#5b22c7]" />Tamamlanma tarixi
                  </div>
                  <div className="text-[16px] font-black leading-tight text-[#33245f]">{item.date}</div>
                </div>

                {/* Animal image */}
                <div className="relative p-4 pr-3 hidden lg:block">
                  <img
                    src={item.img}
                    alt={`${item.type} qurban heyvanı`}
                    className="h-[122px] w-full rounded-[9px] bg-white object-contain"
                  />
                </div>

                {/* Info */}
                <div className="px-4 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <img src={item.img} alt={item.type} className="lg:hidden h-[56px] w-[56px] rounded-[8px] object-contain bg-[#f8f5ff]" />
                    <h3 className="text-[20px] font-extrabold leading-none text-[#33245f]">{item.type}</h3>
                  </div>
                  <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[#77689c]">
                    <User size={15} className="text-[#7760bb]" />
                    <span>{item.organizer}</span>
                    <span className="rounded-full bg-[#f1ecff] px-2 py-0.5 text-[#5622c6]">
                      {paidPct}% · {item.amount} AZN ödədi
                    </span>
                  </div>
                  <div className="flex flex-wrap items-end gap-5">
                    <CompletedStat label="Açılış tarixi"  value={item.date} />
                    <CompletedStat label="Ümumi məbləğ"   value={`${item.totalAmount} AZN`} />
                    <CompletedStat label="İştirakçı sayı" value={`${item.participants} nəfər`} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center border-t lg:border-t-0 lg:border-l border-[#e7e1f0] px-5 py-5 lg:px-6 lg:py-4">
                  <div className="w-full max-w-[176px] space-y-2">
                    <div className="mx-auto max-w-[156px] rounded-[8px] bg-emerald-50 px-3 py-2 text-center">
                      <CheckCircle size={22} className="mx-auto mb-1.5 text-emerald-600" />
                      <div className="text-[11px] font-black text-emerald-700">Açılış tamamlanıb</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                      className="flex h-[32px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#4b14bd] text-[12px] font-extrabold text-white shadow-[0_5px_10px_rgba(75,20,189,.22)]"
                    >
                      <Users size={15} />İştirakçılara bax
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setVideoTarget(item); }}
                      className="flex h-[32px] w-full items-center justify-center gap-2 rounded-[5px] bg-emerald-600 text-[12px] font-extrabold text-white shadow-[0_4px_10px_rgba(5,150,105,.25)] transition hover:bg-emerald-700"
                    >
                      <Video size={14} />Kəsim Videosu
                    </button>
                    <button
                      onClick={(e) => handleShare(e, item)}
                      className="flex h-[32px] w-full items-center justify-center gap-2 rounded-[5px] border border-[#d9cff0] bg-white text-[12px] font-extrabold text-[#4b14bd] transition hover:bg-[#f6f1ff]"
                    >
                      <Share2 size={14} />Dostlarınla paylaş
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
  const { isGuest, login } = useAuth();

  // campaign flow
  const [step,        setStep]        = useState(0);
  const [selAnimalId, setSelAnimalId] = useState(null);
  const [isAnon,      setIsAnon]      = useState(false);
  const [amount,      setAmount]      = useState("");
  const [note,        setNote]        = useState("");
  const [contMode,    setContMode]    = useState("");
  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // mini auth flow
  const [authPhase,    setAuthPhase]   = useState(false);
  const [authMode,     setAuthMode]    = useState("login");   // "login"|"register"
  const [authMethod,   setAuthMethod]  = useState("email");   // "email"|"phone"
  const [authInput,    setAuthInput]   = useState("");        // email or phone value
  const [authPassword, setAuthPassword]= useState("");
  const [authRegName,  setAuthRegName] = useState("");        // full name for register
  const [authOtp,      setAuthOtp]     = useState("");
  const [authOtpSent,  setAuthOtpSent] = useState(false);
  const [authLoading,  setAuthLoading] = useState(false);
  const [authError,    setAuthError]   = useState("");

  useEffect(() => {
    api.get("/campaigns/settings")
      .then(res => {
        const d = res.data?.data || {};
        setSettingsData(d);
        if (d.animals?.length) setSelAnimalId(d.animals[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const animals    = settingsData?.animals || [];
  const settings   = settingsData?.settings || {};
  const animal     = animals.find(a => String(a._id) === String(selAnimalId)) || null;
  const minPct     = settings.minOpenPercent || 30;
  const minAmount  = animal ? Math.ceil(animal.price * minPct / 100) : 0;
  const numAmount  = Number(amount || 0);
  const validAmt   = animal ? (numAmount >= minAmount && numAmount <= animal.price) : false;
  const remaining  = animal ? Math.max(animal.price - numAmount, 0) : 0;
  const finalValid = contMode === "registered" || (contMode === "guest" && name.trim());

  const goNext = () => {
    if (step === 0 && !animal) return;
    if (step === 0) { setAmount(String(minAmount)); setStep(1); return; }
    if (step === 1 && !validAmt) return;
    setStep(s => s + 1);
  };

  const handleConfirm = async () => {
    if (!finalValid || !animal) return;
    // If registered mode but user is still guest → show mini auth
    if (contMode === "registered" && isGuest) {
      setAuthPhase(true);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        animalId: animal._id,
        amount: numAmount,
        isAnonymous: isAnon,
        note: note || undefined,
        ...(contMode === "guest" && !isAnon ? { openerName: name, openerPhone: phone } : {}),
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
    setAuthInput(""); setAuthPassword(""); setAuthRegName("");
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
    if (!authRegName.trim()) return setAuthError("Ad Soyad daxil edin");
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
      const pRes = await api.put("/auth/profile", { name: authRegName.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const finalToken = pRes.data?.data?.token || token;
      const finalUser  = pRes.data?.data?.user  || { ...u, name: authRegName.trim() };
      await afterAuth(finalToken, finalUser);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Kod yanlışdır");
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4 shrink-0"
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
            <div className="flex items-center justify-center gap-2 border-b border-purple-100 px-6 py-3 shrink-0">
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
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#a78bfa transparent" }}>

              {/* ── Mini Auth Phase ── */}
              {authPhase && (
                <div className="flex flex-col gap-4">
                  <button onClick={() => { setAuthPhase(false); resetAuth(); }}
                    className="flex items-center gap-1.5 text-xs text-[#7c6fa0] hover:text-[#1a0f2e] transition-colors self-start">
                    <ChevronDown size={14} className="rotate-90" /> Geri qayıt
                  </button>

                  {/* Login / Register tabs */}
                  <div className="flex rounded-2xl bg-[#f5f3ff] p-1 gap-1">
                    {[["login","Daxil ol"],["register","Qeydiyyat"]].map(([m, label]) => (
                      <button key={m} onClick={() => { setAuthMode(m); resetAuth(); }}
                        className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${authMode === m ? "bg-white shadow text-purple-700" : "text-[#7c6fa0]"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Method selector */}
                  <div className="flex gap-2">
                    {[["email","📧 Email"],["phone","📱 Telefon"]].map(([mt, label]) => (
                      <button key={mt} onClick={() => { setAuthMethod(mt); setAuthInput(""); setAuthError(""); }}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${authMethod === mt ? "border-purple-400 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-500"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── Form area — fixed min-height so modal doesn't resize on tab switch ── */}
                  <div className="flex flex-col gap-3" style={{ minHeight: "228px" }}>

                    {/* LOGIN */}
                    {authMode === "login" && (
                      <>
                        {/* spacer so login aligns same as register (which has name field on top) */}
                        <div className="rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm invisible select-none" aria-hidden>
                          placeholder
                        </div>
                        <input
                          type={authMethod === "email" ? "email" : "tel"}
                          placeholder={authMethod === "email" ? "example@mail.com" : "+994 50 000 00 00"}
                          value={authInput}
                          onChange={e => setAuthInput(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-4 py-3 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        <input
                          type="password"
                          placeholder="Şifrə"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAuthLogin()}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-4 py-3 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        {authError && <p className="text-xs text-red-500">{authError}</p>}
                        <button onClick={handleAuthLogin} disabled={authLoading}
                          className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                          {authLoading ? "Giriş edilir..." : "Daxil ol"}
                        </button>
                      </>
                    )}

                    {/* REGISTER — step 1 */}
                    {authMode === "register" && !authOtpSent && (
                      <>
                        <input
                          type="text"
                          placeholder="Ad Soyad"
                          value={authRegName}
                          onChange={e => setAuthRegName(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-4 py-3 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        <input
                          type={authMethod === "email" ? "email" : "tel"}
                          placeholder={authMethod === "email" ? "example@mail.com" : "+994 50 000 00 00"}
                          value={authInput}
                          onChange={e => setAuthInput(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-4 py-3 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        <input
                          type="password"
                          placeholder="Şifrə (min 6 simvol)"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAuthSendOtp()}
                          className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-4 py-3 text-sm text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                        />
                        {authError && <p className="text-xs text-red-500">{authError}</p>}
                        <button onClick={handleAuthSendOtp} disabled={authLoading}
                          className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
                          style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                          {authLoading ? "Göndərilir..." : "OTP kodu göndər"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* ── OTP verify (register step 2) ── */}
                  {authMode === "register" && authOtpSent && (
                    <div className="flex flex-col gap-3">
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
                        className="w-full rounded-xl border border-purple-200 bg-[#f5f3ff] px-4 py-3 text-sm text-center font-bold tracking-[0.4em] text-[#1a0f2e] outline-none focus:border-purple-400 transition-colors"
                      />
                      {authError && <p className="text-xs text-red-500">{authError}</p>}
                      <button onClick={handleAuthVerifyOtp} disabled={authLoading || authOtp.length < 4}
                        className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all"
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
                  <div className="mb-3 text-xs font-semibold text-[#1a0f2e]">Heyvan növünü seçin</div>
                  {loadingSettings ? (
                    <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" /></div>
                  ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {animals.map(item => (
                      <button key={item._id} onClick={() => setSelAnimalId(item._id)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all ${String(selAnimalId) === String(item._id) ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                        <div className="mb-3 flex items-center gap-3">
                          <img src={item.image || ANIMAL_IMG_FALLBACK[item.nameAz] || "/qoyun.png"} alt={item.nameAz}
                            className="h-12 w-12 rounded-2xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                          <div>
                            <div className="text-sm font-bold text-[#1a0f2e]">{item.nameAz}</div>
                            <div className="text-[11px] font-semibold text-purple-700">Qurbanlıq seçimi</div>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-white/70 p-2">
                            <span className="block text-[#7c6fa0]">Qiymət</span>
                            <b>{item.price.toLocaleString()} AZN</b>
                          </div>
                          <div className="rounded-xl bg-white/70 p-2">
                            <span className="block text-[#7c6fa0]">Çəki</span>
                            <b>{item.weightRange || "—"}</b>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  )}
                  <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/30 p-4">
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
                <div className="space-y-4">
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <img src={animal.image || ANIMAL_IMG_FALLBACK[animal.nameAz] || "/qoyun.png"} alt={animal.nameAz}
                          className="h-12 w-12 rounded-2xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                        <div>
                          <div className="font-bold text-[#1a0f2e]">{animal.nameAz} Qurbanı</div>
                          <div className="text-xs text-[#7c6fa0]">{animal.weightRange} • {animal.price.toLocaleString()} AZN</div>
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
                    <input type="number" min={minAmount} max={animal.price} value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] focus:border-purple-400 focus:outline-none transition-colors" />
                    <div className={`mt-1 text-xs ${validAmt ? "text-[#7c6fa0]" : "text-rose-500"}`}>
                      Minimum {minAmount.toLocaleString()} AZN — heyvanın tam məbləği yığılana qədər minimum 10 AZN-lik ianələr qəbul olunacaq.
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Qeyd</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Açılışla bağlı qeyd..." rows={3}
                      className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-[#1a0f2e] placeholder:text-[#7c6fa0] focus:border-purple-400 focus:outline-none transition-colors" />
                  </div>
                </div>
              )}

              {/* Step 2 — Confirmation */}
              {!authPhase && step === 2 && animal && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setContMode("registered")}
                      className={`rounded-2xl border-2 p-4 text-left transition ${contMode === "registered" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                      <div className="font-bold text-[#1a0f2e]">Qeydiyyat ilə</div>
                      <div className="mt-1 text-xs text-[#7c6fa0]">Hesabınıza daxil olaraq davam edin</div>
                    </button>
                    {settings.allowGuest !== false && (
                    <button onClick={() => setContMode("guest")}
                      className={`rounded-2xl border-2 p-4 text-left transition ${contMode === "guest" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                      <div className="font-bold text-[#1a0f2e]">Qeydiyyatsız</div>
                      <div className="mt-1 text-xs text-[#7c6fa0]">Ad soyad ilə davam edin</div>
                    </button>
                    )}
                  </div>
                  {isAnon && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 text-xs leading-relaxed text-purple-900">
                      <strong>Qeyd:</strong> Anonim ianə seçimini etdiyiniz üçün şəxsi məlumatlarınızın məxfiliyi tam qorunur.
                      İstifadəçilərə açıq olan bölmələrdə adınız &ldquo;Anonim&rdquo; olaraq qeyd ediləcəkdir.
                    </div>
                  )}
                  {contMode === "guest" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Ad Soyad</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Adınızı daxil edin"
                          className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#1a0f2e]">Telefon</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+994 XX XXX XX XX"
                          className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none" />
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border border-purple-100 p-4"
                    style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
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
                    Pay sistemi yoxdur. Tam məbləğ tamamlanana qədər digər istifadəçilər minimum 10 AZN ianə edə biləcəklər.
                  </p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            {!authPhase && <div className="flex gap-3 px-6 pb-6 pt-3 shrink-0 border-t border-purple-100">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 rounded-xl border border-purple-200 py-3 text-sm font-semibold text-[#1a0f2e] hover:bg-purple-50 transition-colors">
                  Geri
                </button>
              )}
              {step < NOM_STEPS.length - 1 ? (
                <button onClick={goNext} disabled={(step === 0 && !animal) || (step === 1 && !validAmt)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                  Davam et
                </button>
              ) : (
                <button onClick={handleConfirm} disabled={!finalValid || submitting}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
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

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CharityPage() {
  const { isGuest } = useAuth();
  const [page, setPage]                     = useState("home");
  const [filter, setFilter]                 = useState("Bütün heyvanlar");
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [donationTarget, setDonationTarget] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewOpening, setShowNewOpening] = useState(false);
  const [homeAnimals, setHomeAnimals]       = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/campaigns/settings").catch(() => ({ data: {} })),
      api.get("/campaigns").catch(() => ({ data: {} })),
    ]).then(([sRes, cRes]) => {
      const minDon    = sRes.data?.data?.settings?.minDonation || 10;
      const campaigns = cRes.data?.data?.campaigns || [];
      setHomeAnimals(campaigns.map(c => mapHomeCampaign(c, minDon)));
    }).finally(() => setAnimalsLoading(false));
  }, []);

  const visibleNav = isGuest
    ? SIDEBAR_NAV.filter(n => n.page !== "ianelerim")
    : SIDEBAR_NAV;

  const setPageGuarded = (p) => {
    if (p === "ianelerim" && isGuest) return;
    setPage(p);
  };

  const filterOptions = useMemo(() => {
    const types = [...new Set(homeAnimals.map(a => a.type))];
    return ["Bütün heyvanlar", ...types];
  }, [homeAnimals]);

  const filtered = filter === "Bütün heyvanlar" ? homeAnimals : homeAnimals.filter(a => a.type === filter);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f5ff]">

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
        {page === "home" && (
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
                    Heyvanı birlikdə alın, ehtiyac sahiblərinə çatdıraq.<br />Tam şəffaflıq, tam izlənilənlik.
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
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-14 text-center text-[14px] text-[#77689c]">
                  Hal-hazırda aktiv açılış yoxdur.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {filtered.map(animal => (
                    <AnimalCard key={animal.campaignId || animal.type} animal={animal} onDonate={setDonationTarget} />
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mx-3 md:mx-6 mb-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-[#eee8f6] hover:shadow-md transition-all"
                  style={{ boxShadow: "0 4px 18px rgba(54,27,99,0.02)" }}>
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(75,20,189,0.08)" }}>
                    <Icon size={16} style={{ color: "#4b14bd" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-[#241a4d] leading-none truncate">{title}</div>
                    <div className="text-[10px] mt-1 truncate" style={{ color: "#8a7ba7" }}>{desc}</div>
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
        {page === "sertler"     && <SertlerPage />}
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
