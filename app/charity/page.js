"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home, List, CheckCircle, HelpCircle, FileText, Heart,
  Plus, Bell, User, ChevronDown, Eye, Video, Users,
  ArrowRight, Play, CalendarDays, UsersRound, Share2,
  ArrowLeft, X, Wallet, Flag, Beef, Rabbit, BadgeIcon as CamelIcon,
  Coins,
} from "lucide-react";

/* ─── Shared data ────────────────────────────────────────────── */
const SIDEBAR_NAV = [
  { icon: Home,        label: "Əsas Səhifə",  page: "home" },
  { icon: List,        label: "İanələrim",     page: "ianelerim" },
  { icon: CheckCircle, label: "Tamamlanmış",   page: "tamamlanmis" },
  { icon: HelpCircle,  label: "Necə işləyir", page: "nece" },
  { icon: FileText,    label: "Şərtlərimiz",  page: "sertler" },
];

const FEATURES = [
  { icon: Eye,    title: "Tam şəffaflıq",       desc: "Hər addımı izləyə bilərsiniz" },
  { icon: Video,  title: "Canlı izləmə",        desc: "Kəsim anını canlı izləyin" },
  { icon: Heart,  title: "Ehtiyac sahiblərinə", desc: "Birbaşa çatdırılır" },
  { icon: Users,  title: "Birlikdə xeyir",      desc: "Paylaş, birlikdə eylə" },
];

const ANIMALS = [
  { type: "Dana",  status: "Açıq", progressPercent: 62, collected: "1,116", target: "1,800", currency: "AZN", organizer: "Rəşad Əhmədov",  participants: 5, shareMin: "540", totalMin: "684",   totalMax: "1,800", startTime: "10 May 2024", img: "/dana.png"  },
  { type: "Qoyun", status: "Açıq", progressPercent: 48, collected: "720",   target: "1,500", currency: "AZN", organizer: "Elsın Hüseynli",  participants: 3, shareMin: "450", totalMin: "780",   totalMax: "1,500", startTime: "12 May 2024", img: "/qoyun.png" },
  { type: "Qoç",   status: "Açıq", progressPercent: 75, collected: "1,125", target: "3,500", currency: "AZN", organizer: "Tural Məmmədov",  participants: 4, shareMin: "375", totalMin: "375",   totalMax: "1,500", startTime: "14 May 2024", img: "/qoc.png"   },
  { type: "Dəvə",  status: "Açıq", progressPercent: 30, collected: "1,200", target: "4,000", currency: "AZN", organizer: "Müşviq Babanlı",  participants: 2, shareMin: "400", totalMin: "2,800", totalMax: "4,000", startTime: "15 May 2024", img: "/deve.png"  },
];

const FILTER_OPTIONS = ["Bütün heyvanlar", "Dana", "Qoyun", "Qoç", "Dəvə"];

/* ─── İanələrim data ─────────────────────────────────────────── */
const DONATIONS = [
  {
    id: 1, type: "Qoyun", amount: "540", collectedAmount: "1,080", totalAmount: "1,800",
    progressPercent: 60, startDate: "15 May 2024", endDate: "22 May 2024",
    status: "Davam edir", organizer: "Siz açmısınız", participants: 6, img: "/qoyun.png",
    timeline: [
      { label: "Açılış yaradıldı", done: true, date: "15 May 2024" },
      { label: "İanələr toplanır", done: true, date: "Davam edir" },
      { label: "Kəsim həyata keçiriləcək", done: false, date: "22 May 2024" },
    ],
  },
  {
    id: 2, type: "Dana", amount: "900", collectedAmount: "3,080", totalAmount: "3,000",
    progressPercent: 100, startDate: "01 May 2024", endDate: "07 May 2024",
    status: "Tamamlandı", organizer: "Siz açmısınız", participants: 8, img: "/dana.png",
    timeline: [
      { label: "Açılış yaradıldı", done: true, date: "01 May 2024" },
      { label: "Məbləğ toplandı", done: true, date: "06 May 2024" },
      { label: "Tamamlandı", done: true, date: "07 May 2024" },
    ],
  },
  {
    id: 3, type: "Qoç", amount: "150", collectedAmount: "750", totalAmount: "1,500",
    progressPercent: 50, startDate: "10 May 2024", endDate: "17 May 2024",
    status: "Davam edir", organizer: "Siz iştirak etmisiniz", participants: 5, img: "/qoc.png",
    timeline: [
      { label: "Açılış yaradıldı", done: true, date: "10 May 2024" },
      { label: "Sizin ianəniz qeydə alındı", done: true, date: "11 May 2024" },
      { label: "Toplanma davam edir", done: false, date: "17 May 2024" },
    ],
  },
  {
    id: 4, type: "Dəvə", amount: "200", collectedAmount: "400", totalAmount: "2,000",
    progressPercent: 0, startDate: "01 May 2024", endDate: "08 May 2024",
    status: "Ləğv olundu", organizer: "Siz iştirak etmisiniz", participants: 2, img: "/deve.png",
    timeline: [
      { label: "Açılış yaradıldı", done: true, date: "01 May 2024" },
      { label: "İanə qeydə alındı", done: true, date: "02 May 2024" },
      { label: "Ləğv olundu", done: true, date: "08 May 2024" },
    ],
  },
];

const STATUS_CFG = {
  "Tamamlandı": { label: "Tamamlanıb",        badge: "bg-emerald-50 text-emerald-700", color: "#2f8b58", track: "#dff4e9" },
  "Davam edir": { label: "Açılış davam edir", badge: "bg-amber-50 text-amber-600",    color: "#5a19c9", track: "#eee4ff" },
  "Ləğv olundu":{ label: "Ləğv olundu",       badge: "bg-rose-50 text-rose-500",      color: "#fb4c61", track: "#ffe0e5" },
};

const PAYERS = [
  ["1", "Elvin Həsənli",   "100 AZN", "6.67%", "10 May 2024  •  11:15", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop"],
  ["2", "Aysel Muradova",  "100 AZN", "6.67%", "10 May 2024  •  11:30", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop"],
  ["3", "Anonim",          "50 AZN",  "3.33%", "10 May 2024  •  12:05", ""],
  ["4", "Tural Məmmədli",  "100 AZN", "6.67%", "11 May 2024  •  09:20", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop"],
  ["5", "Zeynəb Quliyeva", "50 AZN",  "3.33%", "11 May 2024  •  10:40", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop"],
  ["6", "Anonim",          "30 AZN",  "2.00%", "11 May 2024  •  13:15", ""],
  ["7", "Murad İbrahimov", "70 AZN",  "4.67%", "12 May 2024  •  16:45", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=48&h=48&fit=crop"],
];

const TAB_OPTIONS    = ["Hamısı", "Açdığım açılışlar", "İştirak etdiyim açılışlar"];
const STATUS_OPTIONS = ["Hamısı", "Davam edir", "Tamamlandı", "Ləğv olundu"];

/* ─── Small helpers ──────────────────────────────────────────── */
function AnimalIcon({ type }) {
  const cls = "text-[#5622c6]";
  if (type === "Dana") return <Beef size={24} strokeWidth={2.2} className={cls} />;
  if (type === "Dəvə") return <CamelIcon size={24} strokeWidth={2.2} className={cls} />;
  return <Rabbit size={24} strokeWidth={2.2} className={cls} />;
}

function StatCell({ label, value }) {
  return (
    <div className="border-r border-[#e7e1f0] pr-5 last:border-r-0 last:pr-0">
      <div className="mb-1 text-[11px] font-medium text-[#8778a8]">{label}</div>
      <div className="text-[15px] font-bold leading-none text-[#33245f]">
        {value} <span className="text-[12px] font-normal">AZN</span>
      </div>
    </div>
  );
}

function TopStat({ icon: Icon, title, value }) {
  return (
    <div className="flex flex-1 items-center gap-5 border-r border-[#ded5ec] px-6 py-5 last:border-r-0">
      <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full text-white shadow-[0_8px_18px_rgba(83,25,188,.22)]"
        style={{ background: "linear-gradient(135deg, #6a24d1, #3d0aa8)" }}>
        <Icon size={26} strokeWidth={1.9} />
      </div>
      <div>
        <div className="mb-1.5 text-[12px] font-semibold text-[#33245f]">{title}</div>
        <div className="text-[20px] font-bold leading-none text-[#24124f]">{value}</div>
        <div className="mt-1.5 text-[11px] text-[#77689c]">Bugünə kimi</div>
      </div>
    </div>
  );
}

function CircularProgress({ percent, status }) {
  const r = 31;
  const c = 2 * Math.PI * r;
  const cfg = STATUS_CFG[status] || STATUS_CFG["Davam edir"];

  if (status === "Ləğv olundu") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="grid h-[70px] w-[70px] place-items-center rounded-full border-[6px] border-rose-100 text-rose-500">
          <X size={24} strokeWidth={2.2} />
        </div>
        <span className="text-[11px] font-medium text-rose-500">Ləğv olundu</span>
      </div>
    );
  }

  const progress = (Math.min(percent, 100) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke={cfg.track} strokeWidth="7" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={cfg.color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={c - progress}
          strokeLinecap="round" transform="rotate(-90 38 38)" />
        <text x="38" y="43" textAnchor="middle" fontSize="17" fontWeight="700" fill={cfg.color}>{percent}%</text>
      </svg>
      <span className="text-[11px] font-medium text-[#4d3678]">Tamamlanma</span>
    </div>
  );
}

/* ─── Detail Page ────────────────────────────────────────────── */
function IaneDetailPage({ item, onBack }) {
  const toNum = (v) => Number(String(v).replace(/[^0-9.]/g, ""));
  const remaining = Math.max(0, toNum(item.totalAmount) - toNum(item.collectedAmount)).toLocaleString("en-US");

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff]">
      {/* Back header */}
      <div className="flex items-center gap-4 border-b border-purple-100 bg-white/70 px-6 py-3.5 backdrop-blur-sm">
        <button onClick={onBack}
          className="flex h-9 items-center gap-2 rounded-xl border border-[#ded5ec] bg-white px-3 text-[13px] font-semibold text-[#4b14bd] shadow-sm hover:bg-purple-50 transition">
          <ArrowLeft size={16} />
          Geri qayıt
        </button>
        <h1 className="text-[17px] font-semibold text-[#33245f]">{item.type} — ianə detalları</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Main card */}
        <div className="rounded-2xl border border-[#e7e1f0] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-[180px_1fr_200px] gap-5 xl:grid-cols-[180px_1fr_200px]">
            <img src={item.img} alt={item.type}
              className="h-[200px] w-full rounded-xl bg-purple-50 object-contain" />
            <div className="grid grid-cols-3 gap-5 py-4">
              <div className="border-r border-[#e7e1f0] pr-5">
                <div className="text-[22px] font-bold text-[#33245f] mb-6">{item.type}</div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-2">Açılış tarixi</div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#33245f]">
                  <CalendarDays size={15} className="text-[#6840c6]" />{item.startDate}
                </div>
              </div>
              <div className="border-r border-[#e7e1f0] pr-5">
                <div className="text-[11px] font-medium text-[#8b7dac] mb-2">İştirakçı sayı</div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#33245f] mb-8">
                  <Users size={18} className="text-[#5b22c7]" />{item.participants} nəfər
                </div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-2">Toplanan məbləğ</div>
                <div className="flex items-center gap-1.5 text-[16px] font-bold text-[#33245f]">
                  <Coins size={18} className="text-[#5b22c7]" />{item.collectedAmount} AZN
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-2">Ümumi məbləğ</div>
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#33245f] mb-6">
                  <Coins size={17} className="text-[#5b22c7]" />{item.totalAmount} AZN
                </div>
                <div className="text-[11px] font-medium text-[#8b7dac] mb-2">Qalan məbləğ</div>
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#33245f]">
                  <Coins size={17} className="text-[#5b22c7]" />{remaining} AZN
                </div>
              </div>
            </div>
            {/* Status + ring */}
            <div className="rounded-xl border border-[#dcd2ec] p-4 text-center flex flex-col items-center gap-4">
              <div className="text-[12px] font-medium text-[#6e5b9b]">Qurbanlıq statusu</div>
              <span className={`rounded px-3 py-1.5 text-[12px] font-semibold ${STATUS_CFG[item.status]?.badge || ""}`}>
                {STATUS_CFG[item.status]?.label || item.status}
              </span>
              <div className="mt-2">
                <svg width="108" height="108" viewBox="0 0 108 108">
                  <defs>
                    <linearGradient id="detail-ring" x1="54" y1="96" x2="54" y2="12" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#4513ad" />
                      <stop offset="65%" stopColor="#5d28cf" />
                      <stop offset="100%" stopColor="#7b4cea" />
                    </linearGradient>
                  </defs>
                  <circle cx="54" cy="54" r="42" fill="none" stroke="#e6dcff" strokeWidth="9" />
                  <circle cx="54" cy="54" r="42" fill="none" stroke="url(#detail-ring)" strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - item.progressPercent / 100)}
                    transform="rotate(90 54 54)" />
                  <text x="54" y="61" textAnchor="middle" fontSize="22" fontWeight="700" fill="#4b14bd">
                    {item.progressPercent}%
                  </text>
                </svg>
                <div className="text-[12px] font-medium text-[#6e5b9b] mt-2">Tamamlanma</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="inline-flex rounded-t-md bg-[#4b14bd] px-3 py-1.5 text-[11px] font-medium text-white">
            Açan şəxs
          </div>
          <div className="rounded-b-xl rounded-tr-xl border border-[#e1d8ee] bg-[#f5f0ff] px-6 py-4 flex items-center gap-6">
            <div className="w-9 h-9 rounded-full bg-purple-200 grid place-items-center text-purple-700 font-semibold text-sm shrink-0">
              R
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#33245f]">
                Rəşad Əhmədov <span className="text-[#4b14bd]">●</span>
              </div>
              <div className="text-[12px] text-[#6f6290]">Açılış edən şəxs</div>
            </div>
            <div className="ml-auto text-[20px] font-bold text-[#24124f]">
              450 AZN <span className="text-[13px] font-normal text-[#5b22c7]">(30%)</span>
            </div>
            <div className="text-[11px] text-[#4f4075] text-right">
              10 May 2024<br />10:30
            </div>
          </div>
        </div>

        {/* Payers table */}
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-[#33245f]">Digər ödəniş edənlər ({PAYERS.length} nəfər)</h2>
          <div className="overflow-hidden rounded-xl border border-[#e7e1f0] bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-left text-[12px] text-[#33245f]">
              <thead className="bg-white">
                <tr className="border-b border-[#e7e1f0] text-[11px] text-[#8b7dac]">
                  <th className="px-5 py-3">#</th>
                  <th className="px-4 py-3">Ad Soyad</th>
                  <th className="px-4 py-3">Məbləğ</th>
                  <th className="px-4 py-3">Faiz</th>
                  <th className="px-4 py-3 text-right">Tarix</th>
                </tr>
              </thead>
              <tbody>
                {PAYERS.map((p) => (
                  <tr key={p[0]} className="border-b border-[#eee8f6] last:border-b-0 hover:bg-purple-50/30">
                    <td className="px-5 py-3 font-semibold">{p[0]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {p[5] ? (
                          <img src={p[5]} alt={p[1]} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#f0edf6] text-[#6f6290]">
                            <User size={14} />
                          </div>
                        )}
                        <span className="font-medium">{p[1]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{p[2]}</td>
                    <td className="px-4 py-3 text-[#5b22c7]">{p[3]}</td>
                    <td className="px-4 py-3 text-right text-[#4f4075]">{p[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center py-3">
              <button className="flex h-9 items-center gap-2 rounded-lg border border-[#c8b9eb] px-5 text-[13px] font-medium text-[#5b22c7] hover:bg-purple-50 transition">
                Daha çoxunu göstər <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── İanələrim list page ────────────────────────────────────── */
function IanelerimPage() {
  const [selected, setSelected]       = useState(null);
  const [activeTab, setActiveTab]     = useState("Hamısı");
  const [statusFilter, setStatusFilter] = useState("Hamısı");
  const [statusOpen, setStatusOpen]   = useState(false);

  const filtered = DONATIONS.filter((item) => {
    const tabMatch =
      activeTab === "Hamısı" ||
      (activeTab === "Açdığım açılışlar"        && item.organizer === "Siz açmısınız") ||
      (activeTab === "İştirak etdiyim açılışlar" && item.organizer === "Siz iştirak etmisiniz");
    const statusMatch = statusFilter === "Hamısı" || item.status === statusFilter;
    return tabMatch && statusMatch;
  });

  if (selected) return <IaneDetailPage item={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-4 py-4">
      {/* Top stats */}
      <div className="mb-4 flex overflow-hidden rounded-xl border border-[#e7e1f0] bg-white shadow-sm">
        <TopStat icon={Wallet} title="Bütün ianələrimin toplamı" value="4,550 AZN" />
        <TopStat icon={Flag}   title="Ümumi açılış sayı"         value="2"         />
        <TopStat icon={Users}  title="Ümumi iştirak edilən sayı" value="2"         />
      </div>

      {/* Tabs + filter */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex overflow-hidden rounded-lg border border-[#e7e1f0] bg-white shadow-sm">
          {TAB_OPTIONS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`h-[42px] px-5 text-[12px] font-medium transition ${i > 0 ? "border-l border-[#eee8f6]" : ""} ${
                activeTab === tab
                  ? "bg-[#4b14bd] text-white"
                  : "bg-white text-[#4c3b77] hover:bg-purple-50"
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setStatusOpen(!statusOpen)}
            className="flex h-[40px] min-w-[148px] items-center justify-between rounded-lg border border-[#e7e1f0] bg-white px-4 text-[12px] font-medium text-[#4c3b77] shadow-sm gap-2">
            {statusFilter === "Hamısı" ? "Statusa görə" : statusFilter}
            <ChevronDown size={15} className={`text-[#4b14bd] transition-transform ${statusOpen ? "rotate-180" : ""}`} />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-full overflow-hidden rounded-lg border border-[#e7e1f0] bg-white shadow-lg">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition hover:bg-purple-50 ${statusFilter === s ? "bg-purple-50 text-[#4b14bd]" : "text-[#4c3b77]"}`}>
                  {s === "Hamısı" ? "Bütün statuslar" : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Donation list */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const cfg = STATUS_CFG[item.status] || STATUS_CFG["Davam edir"];
          return (
            <div key={item.id} onClick={() => setSelected(item)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-[#ece6f5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="grid grid-cols-[165px_1fr_265px] min-h-[150px]">
                {/* Photo */}
                <div className="p-4 pr-2">
                  <img src={item.img} alt={item.type}
                    className="h-[126px] w-full rounded-xl bg-purple-50 object-cover" />
                </div>

                {/* Info */}
                <div className="px-4 py-4">
                  <div className="mb-2.5 flex items-center gap-3">
                    <AnimalIcon type={item.type} />
                    <h3 className="text-[19px] font-bold leading-none text-[#33245f]">{item.type}</h3>
                    <span className={`rounded px-2.5 py-1 text-[11px] font-medium ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="mb-3.5 flex items-center gap-2 text-[11px] text-[#77689c]">
                    <User size={14} className="text-[#7760bb]" />
                    {item.organizer}
                  </div>
                  <div className="mb-4 grid max-w-[360px] grid-cols-2 gap-4">
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

                {/* Right: progress + buttons */}
                <div className="flex items-center justify-center border-l border-[#e7e1f0] px-5">
                  <div className="w-full max-w-[200px] space-y-3">
                    <div className="flex justify-center">
                      <CircularProgress percent={item.progressPercent} status={item.status} />
                    </div>
                    <button onClick={(e) => e.stopPropagation()}
                      className="flex h-[34px] w-full items-center justify-center gap-2 rounded-lg bg-[#4b14bd] text-[12px] font-medium text-white shadow-sm hover:bg-[#3d0aa8] transition">
                      <Users size={15} />
                      İştirakçılara bax
                    </button>
                    {item.status !== "Ləğv olundu" && (
                      <button onClick={(e) => e.stopPropagation()}
                        className="flex h-[34px] w-full items-center justify-center gap-2 rounded-lg border border-[#bcaee4] bg-white text-[12px] font-medium text-[#5b26c8] hover:bg-purple-50 transition">
                        <Share2 size={14} />
                        Dostlarınla Paylaş
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
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset="0"
          transform={`rotate(90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute left-1/2 top-[19px] flex h-[150px] w-[150px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: "#fbfaff" }}>
        <img src={img} alt={type} className="max-h-[85%] max-w-[85%] object-contain" style={{ mixBlendMode: "multiply" }} />
      </div>
      <div className="absolute left-1/2 top-[164px] z-20 -translate-x-1/2 rounded-2xl px-6 py-1.5 text-xl font-bold leading-none text-white ring-4 ring-white"
        style={{ backgroundColor: "#551dc7", boxShadow: "0 8px 16px rgba(85,29,199,.25)", letterSpacing: "-.02em" }}>
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-[22px] border border-[#eee8f6] bg-white px-4 pb-4 pt-4 cursor-pointer transition-all hover:-translate-y-1"
      style={{ boxShadow: "0 8px 28px rgba(54,27,99,.08)" }}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-[22px] font-bold leading-none text-[#241a4d]">{animal.type}</h3>
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
          <div className="text-[12px] font-medium text-[#241a4d]">{animal.startTime}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white shadow-sm" style={{ color: "#5521c6" }}>
            <UsersRound size={15} strokeWidth={2} />
          </span>
          <div className="text-[12px] font-medium text-[#241a4d]">{animal.participants} iştirakçı</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Açan şəxs</div>
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 shrink-0">
            {animal.organizer[0]}
          </div>
          <div className="truncate text-[13px] font-medium" style={{ color: "#342760" }}>{animal.organizer}</div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Ödədiyi məbləğ</div>
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold text-[#241a4d]">{animal.shareMin} {animal.currency}</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium" style={{ color: "#5521c6" }}>{paidPct}%</span>
        </div>
      </div>
      <div className="mt-4 border-t border-[#eee8f6] pt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Qalan məbləğ</div>
          <div className="text-[19px] font-bold text-[#241a4d]">{animal.totalMin} <span className="text-[11px] font-normal">AZN</span></div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Ümumi məbləğ</div>
          <div className="text-[19px] font-bold text-[#241a4d]">{animal.totalMax} <span className="text-[11px] font-normal">AZN</span></div>
        </div>
      </div>
      <button onClick={handleShare}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9cdfa] py-2.5 text-xs font-medium transition-all hover:bg-white"
        style={{ backgroundColor: "#f7f3ff", color: "#5521c6" }}>
        <Share2 size={14} strokeWidth={2} />
        İanəyə Dəvət Et
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDonate(animal); }}
        className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-white opacity-0 transition-all group-hover:opacity-100"
        style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
        İanə et →
      </button>
      {copied && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#241a4d] px-5 py-3 text-center text-sm font-medium text-white"
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
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <h1 className="text-[#241a4d] mb-1 text-2xl font-semibold">Necə işləyir?</h1>
      <p className="text-gray-500 text-sm mb-8">Kollektiv platformasında qurban prosesi</p>
      <div className="relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-purple-100" />
        <div className="space-y-5">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-5 relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-sm font-semibold text-[#5521c6] text-lg"
                style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>
                {i + 1}
              </div>
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
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <h1 className="text-[#241a4d] mb-1 text-2xl font-semibold">Şərtlərimiz</h1>
      <p className="text-gray-500 text-sm mb-6">Platforma qaydaları və istifadə şərtləri</p>
      <div className="grid grid-cols-2 gap-4">
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

function TamamlanmisPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <h1 className="text-[#241a4d] mb-1 text-2xl font-semibold">Tamamlanmış</h1>
      <p className="text-gray-500 text-sm mb-6">Tamamlanmış açılışlar</p>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(75,20,189,0.08)" }}>
          <CheckCircle size={28} style={{ color: "#4b14bd" }} />
        </div>
        <p className="text-[#241a4d] font-semibold mb-1">Tamamlanmış açılış yoxdur</p>
        <p className="text-gray-400 text-sm">Tamamlanan açılışlar burada görünəcək</p>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CharityPage() {
  const [page, setPage]                 = useState("home");
  const [filter, setFilter]             = useState("Bütün heyvanlar");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [donationTarget, setDonationTarget] = useState(null);

  const filtered = filter === "Bütün heyvanlar" ? ANIMALS : ANIMALS.filter(a => a.type === filter);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f5ff]">

      {/* ── Sidebar ── */}
      <aside className="w-56 min-h-screen flex flex-col shrink-0" style={{ backgroundColor: "#301586" }}>
        <div className="px-4 py-5 flex items-center gap-3">
          <Image src="/logo_test.png" alt="meatbox.az" width={48} height={48}
            className="rounded-full object-contain bg-white shadow-sm" />
          <div className="text-white font-semibold text-[15px] tracking-wide">meatbox.az</div>
        </div>
        <div className="px-3 mb-3">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-all">
            <Plus size={15} />
            Yeni açılış et
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {SIDEBAR_NAV.map(({ icon: Icon, label, page: p }) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                page === p
                  ? "bg-white/15 text-white font-semibold"
                  : "text-purple-100/70 hover:bg-white/5 hover:text-white font-normal"
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TopBar */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-purple-900/20 shrink-0"
          style={{ backgroundColor: "#301586" }}>
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} className="text-white" />
            </Link>
            <span className="text-[17px] font-semibold text-white tracking-[-0.01em]">
              Kollektiv Qurban-Xeyriyyə Platforması
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative">
              <Bell size={18} className="text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#301586]" />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <User size={18} className="text-white" />
            </button>
            <Link href="/auth/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#301586] text-sm font-semibold hover:bg-purple-50 transition-all shadow-sm">
              Qeydiyyat
              <ChevronDown size={13} />
            </Link>
          </div>
        </div>

        {/* Content */}
        {page === "home" && (
          <main className="flex-1 overflow-y-auto">
            <div className="relative overflow-hidden rounded-2xl mx-6 mt-5 mb-6"
              style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)" }}>
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(30%, -30%)" }} />
              <div className="relative grid grid-cols-2 gap-6 items-stretch">
                <div className="pl-8 py-8 pr-2 flex flex-col justify-center">
                  <h1 className="leading-tight mb-3 text-[#241a4d]" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                    Birlikdə qurban,<br />
                    <span style={{ color: "#551dc7" }}>birlikdə xeyir.</span>
                  </h1>
                  <p className="text-gray-500 text-sm mb-5 leading-relaxed max-w-xs">
                    Heyvanı birlikdə alın, ehtiyac sahiblərinə çatdıraq.<br />
                    Tam şəffaflıq, tam izlənilənlik.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
                      style={{ background: "#4b14bd" }}>
                      <Plus size={14} />Yeni açılış et
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border bg-white/70 hover:bg-white transition-all"
                      style={{ color: "#4b14bd", borderColor: "rgba(75,20,189,0.3)" }}>
                      <Play size={12} fill="currentColor" />Necə işləyir?
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-3 flex items-center gap-1">
                    <ArrowRight size={11} />
                    Aşağıda davam edən açılışlara basaraq ianə edə bilərsiniz
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

            <div className="flex items-center justify-between px-6 mb-4">
              <div>
                <h2 className="font-semibold text-[#241a4d] text-lg">Davam edən açılışlar</h2>
                <p className="text-gray-400 text-xs mt-0.5">İanə etmək üçün açılışa basın</p>
              </div>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-[#eee8f6] text-[#241a4d] hover:border-purple-300 transition-all">
                  {filter}
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-[#eee8f6] shadow-lg z-10 min-w-full overflow-hidden">
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

            <div className="grid grid-cols-1 gap-4 px-6 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(animal => (
                <AnimalCard key={animal.type} animal={animal} onDonate={setDonationTarget} />
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 mx-6 mb-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-[22px] p-3 flex items-center gap-3 border border-[#eee8f6] transition-all hover:shadow-md"
                  style={{ boxShadow: "0 4px 18px rgba(54,27,99,0.02)" }}>
                  <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(75,20,189,0.08)" }}>
                    <Icon size={18} style={{ color: "#4b14bd" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#241a4d] leading-none truncate">{title}</div>
                    <div className="text-[11px] mt-1 truncate" style={{ color: "#8a7ba7" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {page === "ianelerim"   && <IanelerimPage />}
        {page === "tamamlanmis" && <TamamlanmisPage />}
        {page === "nece"        && <NecePage />}
        {page === "sertler"     && <SertlerPage />}
      </div>

      {donationTarget && (
        <DonationModal animal={donationTarget} onClose={() => setDonationTarget(null)} />
      )}
    </div>
  );
}
