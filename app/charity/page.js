"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home, List, CheckCircle, HelpCircle, FileText, Heart,
  Plus, Bell, User, ChevronDown, Eye, Video, Users,
  ArrowRight, Play, CalendarDays, UsersRound, Share2,
  ArrowLeft, X
} from "lucide-react";

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

/* ─── Ring Progress ──────────────────────────────────────────── */
function RingProgress({ percent, type, img }) {
  const size = 188;
  const r = 82;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(percent, 100));
  const dash = (p / 100) * circ;
  const id = `grad-${type.replace(/[^a-zA-Z0-9]/g, "")}`;
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

/* ─── Animal Card ────────────────────────────────────────────── */
function AnimalCard({ animal, onDonate }) {
  const [copied, setCopied] = useState(false);
  const toNum = (v) => Number(String(v).replace(/[^0-9.]/g, ""));
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

      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-[22px] font-bold leading-none text-[#241a4d]">{animal.type}</h3>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600">Davam Edir</span>
      </div>

      <RingProgress percent={animal.progressPercent} type={animal.type} img={animal.img} />

      {/* Collected */}
      <div className="mt-1 text-center text-[13px] font-semibold text-[#281d55]">
        {animal.collected} / {animal.target} <span className="text-[#5521c6]">{animal.currency}</span>
      </div>

      {/* Date + participants */}
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

      {/* Organizer */}
      <div className="mt-4">
        <div className="mb-2 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Açan şəxs</div>
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 shrink-0">
            {animal.organizer[0]}
          </div>
          <div className="truncate text-[13px] font-medium" style={{ color: "#342760" }}>
            {animal.organizer}
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>

      {/* Paid amount */}
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Ödədiyi məbləğ</div>
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold text-[#241a4d]">{animal.shareMin} {animal.currency}</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold" style={{ color: "#5521c6" }}>{paidPct}%</span>
        </div>
      </div>

      {/* Qalan / Ümumi */}
      <div className="mt-4 border-t border-[#eee8f6] pt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Qalan məbləğ</div>
          <div className="text-[19px] font-bold text-[#241a4d]">
            {animal.totalMin} <span className="text-[11px] font-normal">{animal.currency}</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium" style={{ color: "#8a7ba7" }}>Ümumi məbləğ</div>
          <div className="text-[19px] font-bold text-[#241a4d]">
            {animal.totalMax} <span className="text-[11px] font-normal">{animal.currency}</span>
          </div>
        </div>
      </div>

      {/* Share button */}
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

function IanelerimPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <h1 className="text-[#241a4d] mb-1 text-2xl font-semibold">İanələrim</h1>
      <p className="text-gray-500 text-sm mb-6">Etdiyiniz ianələrin siyahısı</p>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(75,20,189,0.08)" }}>
          <Heart size={28} style={{ color: "#4b14bd" }} />
        </div>
        <p className="text-[#241a4d] font-semibold mb-1">Hələ ianə etməmisiniz</p>
        <p className="text-gray-400 text-sm">Açılışlardan birinə ianə edin</p>
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
            {/* Hero */}
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
                      <Plus size={14} />
                      Yeni açılış et
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border bg-white/70 hover:bg-white transition-all"
                      style={{ color: "#4b14bd", borderColor: "rgba(75,20,189,0.3)" }}>
                      <Play size={12} fill="currentColor" />
                      Necə işləyir?
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

            {/* Filter + heading */}
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-purple-50 ${
                          filter === opt ? "text-purple-700 font-semibold bg-purple-50" : "text-[#241a4d]"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 px-6 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(animal => (
                <AnimalCard key={animal.type} animal={animal} onDonate={setDonationTarget} />
              ))}
            </div>

            {/* Features banner */}
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
