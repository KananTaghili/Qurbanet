"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import {
  Home, List, CheckCircle, HelpCircle, FileText, Heart,
  Plus, Bell, User, ChevronDown, Eye, Video, Users,
  ArrowRight, Play, CalendarDays, UsersRound, Share2,
  ArrowLeft, X, Wallet, Flag, Beef, Rabbit, BadgeIcon as CamelIcon,
  Coins, Menu, Shield,
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

const ANIMALS = [
  { type: "Dana",  progressPercent: 62, collected: "1,116", target: "1,800", currency: "AZN", organizer: "Rəşad Əhmədov", participants: 5, shareMin: "540", totalMin: "684",   totalMax: "1,800", startTime: "10 May 2024", img: "/dana.png"  },
  { type: "Qoyun", progressPercent: 48, collected: "720",   target: "1,500", currency: "AZN", organizer: "Elsın Hüseynli", participants: 3, shareMin: "450", totalMin: "780",   totalMax: "1,500", startTime: "12 May 2024", img: "/qoyun_big.png" },
  { type: "Qoç",   progressPercent: 75, collected: "1,125", target: "3,500", currency: "AZN", organizer: "Tural Məmmədov", participants: 4, shareMin: "375", totalMin: "375",   totalMax: "1,500", startTime: "14 May 2024", img: "/qoc.jpg"       },
  { type: "Dəvə",  progressPercent: 30, collected: "1,200", target: "4,000", currency: "AZN", organizer: "Müşviq Babanlı", participants: 2, shareMin: "400", totalMin: "2,800", totalMax: "4,000", startTime: "15 May 2024", img: "/deve.jpg"      },
];
const FILTER_OPTIONS = ["Bütün heyvanlar", "Dana", "Qoyun", "Qoç", "Dəvə"];

const DONATIONS = [
  { id: 1, type: "Qoyun", amount: "540", collectedAmount: "1,080", totalAmount: "1,800", progressPercent: 60, startDate: "15 May 2024", endDate: "22 May 2024", status: "Davam edir",  organizer: "Siz açmısınız",        participants: 6, img: "/qoyun.png" },
  { id: 2, type: "Dana",  amount: "900", collectedAmount: "3,080", totalAmount: "3,000", progressPercent: 100,startDate: "01 May 2024", endDate: "07 May 2024", status: "Tamamlandı", organizer: "Siz açmısınız",        participants: 8, img: "/dana.png"  },
  { id: 3, type: "Qoç",   amount: "150", collectedAmount: "750",   totalAmount: "1,500", progressPercent: 50, startDate: "10 May 2024", endDate: "17 May 2024", status: "Davam edir",  organizer: "Siz iştirak etmisiniz", participants: 5, img: "/qoc.png"   },
  { id: 4, type: "Dəvə",  amount: "200", collectedAmount: "400",   totalAmount: "2,000", progressPercent: 0,  startDate: "01 May 2024", endDate: "08 May 2024", status: "Ləğv olundu", organizer: "Siz iştirak etmisiniz", participants: 2, img: "/deve.png"  },
];

const STATUS_CFG = {
  "Tamamlandı": { label: "Tamamlanıb",        badge: "bg-emerald-50 text-emerald-700", color: "#2f8b58", track: "#dff4e9" },
  "Davam edir": { label: "Açılış davam edir", badge: "bg-amber-50 text-amber-600",    color: "#5a19c9", track: "#eee4ff" },
  "Ləğv olundu":{ label: "Ləğv olundu",       badge: "bg-rose-50 text-rose-500",      color: "#fb4c61", track: "#ffe0e5" },
};

const PAYERS = [
  ["1","Elvin Həsənli",  "100 AZN","6.67%","10 May 2024  •  11:15","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop"],
  ["2","Aysel Muradova", "100 AZN","6.67%","10 May 2024  •  11:30","https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop"],
  ["3","Anonim",         "50 AZN", "3.33%","10 May 2024  •  12:05",""],
  ["4","Tural Məmmədli", "100 AZN","6.67%","11 May 2024  •  09:20","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop"],
  ["5","Zeynəb Quliyeva","50 AZN", "3.33%","11 May 2024  •  10:40","https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop"],
  ["6","Anonim",         "30 AZN", "2.00%","11 May 2024  •  13:15",""],
  ["7","Murad İbrahimov","70 AZN", "4.67%","12 May 2024  •  16:45","https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=48&h=48&fit=crop"],
];

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
  const [amount, setAmount] = useState(animal.shareMin);
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
        <div className="mb-4">
          <label className="text-xs font-medium text-[#8a7ba7] mb-1.5 block">Məbləğ (AZN)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="10"
            className="w-full border border-[#d9cdfa] rounded-xl px-4 py-3 text-lg font-semibold text-[#241a4d] focus:outline-none focus:border-[#5521c6]" />
        </div>
        <button className="w-full py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, #4b14bd, #7c3aed)" }}>
          Ödəməyə keç
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
  const [selected, setSelected]           = useState(null);
  const [activeTab, setActiveTab]         = useState("Hamısı");
  const [statusFilter, setStatusFilter]   = useState("Hamısı");
  const [statusOpen, setStatusOpen]       = useState(false);
  const [videoTarget, setVideoTarget]     = useState(null);

  const filtered = DONATIONS.filter((item) => {
    const tabMatch =
      activeTab === "Hamısı" ||
      (activeTab === "Açdığım açılışlar"        && item.organizer === "Siz açmısınız") ||
      (activeTab === "İştirak etdiyim açılışlar" && item.organizer === "Siz iştirak etmisiniz");
    return tabMatch && (statusFilter === "Hamısı" || item.status === statusFilter);
  });

  if (selected) return <IaneDetailPage item={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-3 md:px-4 py-3 md:py-4 pb-20 lg:pb-4">
      {/* Top stats */}
      <div className="mb-4 flex flex-col sm:flex-row overflow-hidden rounded-xl border border-[#e7e1f0] bg-white shadow-sm">
        <TopStat icon={Wallet} title="Bütün ianələrimin toplamı" value="4,550 AZN" />
        <TopStat icon={Flag}   title="Ümumi açılış sayı"         value="2"         />
        <TopStat icon={Users}  title="Ümumi iştirak edilən sayı" value="2"         />
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
      <div className="space-y-3">
        {filtered.map((item) => {
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
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-14 text-center text-[14px] text-[#77689c]">
            Seçilmiş filterlərə uyğun ianə tapılmadı.
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
                  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
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
function NecePage() {
  const steps = [
    { title: "Qeydiyyatdan keç", desc: "Platformada hesab yaradın, şəxsiyyətinizi təsdiqləyin." },
    { title: "Açılış seç",       desc: "Mövcud qurban açılışlarına baxın, sizə uyğun olanı seçin." },
    { title: "Payını ödə",       desc: "Seçdiyiniz heyvana görə payınızı təhlükəsiz ödəyin." },
    { title: "Canlı izlə",       desc: "Kəsim prosesini canlı yayım vasitəsilə izləyin." },
    { title: "Yardım çatsın",    desc: "Ət ehtiyaclı ailələrə birbaşa çatdırılır." },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 pb-20 lg:pb-5">
      <h1 className="text-[#241a4d] mb-1 text-xl font-semibold">Necə işləyir?</h1>
      <p className="text-gray-500 text-sm mb-6">Kollektiv platformasında qurban prosesi</p>
      <div className="relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-purple-100" />
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-sm font-semibold text-[#5521c6]"
                style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>{i + 1}</div>
              <div className="bg-white rounded-2xl p-4 flex-1 border border-[#eee8f6] shadow-sm">
                <div className="font-semibold text-[#241a4d] text-sm mb-1">{i + 1}. {s.title}</div>
                <div className="text-sm text-gray-500">{s.desc}</div>
              </div>
            </div>
          ))}
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

const COMPLETED_OPENINGS = [
  {
    id: 1, type: "Qoyun", amount: "450", collectedAmount: "1,500", totalAmount: "1,500",
    progressPercent: 100, date: "13 İyun 2024", startDate: "10 May 2024", endDate: "13 İyun 2024",
    status: "Tamamlandı", organizer: "Rəşad Əhmədov", participants: 24,
    img: "/qoyun.png",
  },
  {
    id: 2, type: "Dana", amount: "900", collectedAmount: "3,000", totalAmount: "3,000",
    progressPercent: 100, date: "07 May 2024", startDate: "01 May 2024", endDate: "07 May 2024",
    status: "Tamamlandı", organizer: "Siz açmısınız", participants: 18,
    img: "/dana.png",
  },
  {
    id: 3, type: "Qoç", amount: "300", collectedAmount: "1,500", totalAmount: "1,500",
    progressPercent: 100, date: "22 Aprel 2024", startDate: "10 Aprel 2024", endDate: "22 Aprel 2024",
    status: "Tamamlandı", organizer: "Tural Məmmədov", participants: 15,
    img: "/qoc.png",
  },
  {
    id: 4, type: "Dəvə", amount: "1,200", collectedAmount: "4,000", totalAmount: "4,000",
    progressPercent: 100, date: "18 Mart 2024", startDate: "01 Mart 2024", endDate: "18 Mart 2024",
    status: "Tamamlandı", organizer: "Kamran Nəsirov", participants: 31,
    img: "/deve.png",
  },
];

const MONTH_INDEX = {
  Yanvar: 0, Fevral: 1, Mart: 2, Aprel: 3, May: 4, İyun: 5,
  İyul: 6, Avqust: 7, Sentyabr: 8, Oktyabr: 9, Noyabr: 10, Dekabr: 11,
};

function parseAzDate(value) {
  const [day, month, year] = value.split(" ");
  return new Date(Number(year), MONTH_INDEX[month] ?? 0, Number(day)).getTime();
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
  const [selected, setSelected]         = useState(null);
  const [shareMessage, setShareMessage] = useState(false);
  const [videoTarget, setVideoTarget]   = useState(null);

  const sorted = [...COMPLETED_OPENINGS].sort(
    (a, b) => parseAzDate(b.date) - parseAzDate(a.date)
  );

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
            <div className="mb-1 text-[12px] font-extrabold text-[#33245f]">Ümumi tamamlanmış açılış sayı</div>
            <div className="text-[24px] font-black leading-none tracking-[-.03em] text-[#24124f]">{COMPLETED_OPENINGS.length}</div>
            <div className="mt-1 text-[11px] font-bold text-[#77689c]">Tamamlanmış açılışlar</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h1 className="text-[20px] font-black tracking-[-.02em] text-[#33245f]">Tamamlanmış Açılışlar</h1>
        <p className="mt-1 text-[12px] font-semibold text-[#8778a8]">Açılışlar tamamlanma vaxtına görə sıralanıb</p>
      </div>

      <div className="space-y-3.5">
        {sorted.map((item) => {
          const paidPct = Math.round(
            (Number(item.amount.replace(/,/g, "")) / Number(item.totalAmount.replace(/,/g, ""))) * 100
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
                  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
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
const ANIMAL_OPTS = [
  { type: "Dana",  emoji: "🐄", image: "/dana.png",       price: 1800, weight: "180–240 kq" },
  { type: "Qoyun", emoji: "🐑", image: "/qoyun_big.png",  price: 1500, weight: "35–55 kq"  },
  { type: "Qoç",   emoji: "🐏", image: "/qoc.jpg",        price: 1500, weight: "40–65 kq"  },
  { type: "Dəvə",  emoji: "🐪", image: "/deve.jpg",       price: 4000, weight: "350–520 kq"},
];
const NOM_STEPS = ["Heyvan növü", "Ödəniş", "Təsdiq"];

function NewOpeningModal({ onClose }) {
  const [step,          setStep]         = useState(0);
  const [selAnimal,     setSelAnimal]    = useState("Dana");
  const [isAnon,        setIsAnon]       = useState(false);
  const [amount,        setAmount]       = useState("540");
  const [note,          setNote]         = useState("");
  const [contMode,      setContMode]     = useState("");
  const [name,          setName]         = useState("");
  const [phone,         setPhone]        = useState("");
  const [done,          setDone]         = useState(false);

  const animal     = useMemo(() => ANIMAL_OPTS.find(a => a.type === selAnimal) ?? ANIMAL_OPTS[0], [selAnimal]);
  const minAmount  = Math.ceil(animal.price * 0.3);
  const numAmount  = Number(amount || 0);
  const validAmt   = numAmount >= minAmount && numAmount <= animal.price;
  const remaining  = Math.max(animal.price - numAmount, 0);
  const finalValid = contMode === "registered" || (contMode === "guest" && name.trim() && phone.trim());

  const goNext = () => {
    if (step === 0) { setAmount(String(minAmount)); setStep(1); return; }
    if (step === 1 && !validAmt) return;
    setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {done ? (
          <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
            <div className="mb-4 text-6xl">🌟</div>
            <h2 className="mb-2 text-[1.25rem] font-extrabold text-[#1a0f2e]">Açılışınız yaradıldı!</h2>
            <p className="mb-6 text-sm leading-relaxed text-[#7c6fa0]">
              <strong>{animal.type} Qurbanı</strong> açılışı {numAmount.toLocaleString()} AZN ilkin ödənişlə qeydə alındı.
              Qalan {remaining.toLocaleString()} AZN tam məbləğ yığılana qədər ianələrlə toplanacaq.
            </p>
            <button onClick={onClose} className="rounded-xl px-8 py-3 text-sm font-semibold text-white hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>Bağla</button>
          </div>
        ) : (
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

              {/* Step 0 — Animal selection */}
              {step === 0 && (
                <div>
                  <div className="mb-3 text-xs font-semibold text-[#1a0f2e]">Heyvan növünü seçin</div>
                  <div className="grid grid-cols-2 gap-3">
                    {ANIMAL_OPTS.map(item => (
                      <button key={item.type} onClick={() => setSelAnimal(item.type)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all ${selAnimal === item.type ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                        <div className="mb-3 flex items-center gap-3">
                          <img src={item.image} alt={item.type}
                            className="h-12 w-12 rounded-2xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                          <div>
                            <div className="text-sm font-bold text-[#1a0f2e]">{item.type}</div>
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
                            <b>{item.weight}</b>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
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
              {step === 1 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <img src={animal.image} alt={animal.type}
                          className="h-12 w-12 rounded-2xl bg-purple-100 object-cover shadow-sm ring-1 ring-purple-200" />
                        <div>
                          <div className="font-bold text-[#1a0f2e]">{animal.type} Qurbanı</div>
                          <div className="text-xs text-[#7c6fa0]">{animal.weight} • {animal.price.toLocaleString()} AZN</div>
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
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setContMode("registered")}
                      className={`rounded-2xl border-2 p-4 text-left transition ${contMode === "registered" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                      <div className="font-bold text-[#1a0f2e]">Qeydiyyat ilə</div>
                      <div className="mt-1 text-xs text-[#7c6fa0]">Hesabınıza daxil olaraq davam edin</div>
                    </button>
                    <button onClick={() => setContMode("guest")}
                      className={`rounded-2xl border-2 p-4 text-left transition ${contMode === "guest" ? "border-purple-500 bg-purple-50" : "border-purple-100 hover:border-purple-300"}`}>
                      <div className="font-bold text-[#1a0f2e]">Qeydiyyatsız</div>
                      <div className="mt-1 text-xs text-[#7c6fa0]">Ad soyad və nömrə ilə davam edin</div>
                    </button>
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
                          <img src={animal.image} alt={animal.type} className="h-7 w-7 rounded-full bg-purple-100 object-cover ring-1 ring-purple-200" />
                          {animal.type}
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
            <div className="flex gap-3 px-6 pb-6 pt-3 shrink-0 border-t border-purple-100">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 rounded-xl border border-purple-200 py-3 text-sm font-semibold text-[#1a0f2e] hover:bg-purple-50 transition-colors">
                  Geri
                </button>
              )}
              {step < NOM_STEPS.length - 1 ? (
                <button onClick={goNext} disabled={step === 1 && !validAmt}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
                  Davam et
                </button>
              ) : (
                <button onClick={() => { if (finalValid) setDone(true); }} disabled={!finalValid}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                  Açılışı təsdiqlə ✓
                </button>
              )}
            </div>
          </>
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
  const [donationTarget, setDonationTarget] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewOpening, setShowNewOpening] = useState(false);

  const visibleNav = isGuest
    ? SIDEBAR_NAV.filter(n => n.page !== "ianelerim")
    : SIDEBAR_NAV;

  const setPageGuarded = (p) => {
    if (p === "ianelerim" && isGuest) return;
    setPage(p);
  };

  const filtered = filter === "Bütün heyvanlar" ? ANIMALS : ANIMALS.filter(a => a.type === filter);

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
                    {FILTER_OPTIONS.map(opt => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-3 md:px-6 mb-5">
              {filtered.map(animal => (
                <AnimalCard key={animal.type} animal={animal} onDonate={setDonationTarget} />
              ))}
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
