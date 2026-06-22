"use client";
import { useState } from "react";
import {
  ArrowLeft, CalendarDays, Coins, Users, Share2, Video,
  CheckCircle, X, ChevronDown, Heart,
} from "lucide-react";
import { fmtDate, fmtTime, avatarColor, initials, STATUS_CFG } from "./_lib";

export default function IaneDetailPage({ item, onBack, onDonate }) {
  const [showAll, setShowAll]     = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [copied, setCopied]       = useState(false);

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const donations   = item.donations || [];
  const openerDon   = donations.find(d => d.isOpener);
  const otherDons   = donations.filter(d => !d.isOpener);
  const shown       = showAll ? otherDons : otherDons.slice(0, 5);
  const isCompleted = item.status === "Tamamlandı";

  const fmtDonTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${fmtDate(d)}  •  ${dt.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const cfg = STATUS_CFG[item.status] || STATUS_CFG["Davam edir"];

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] pb-20 lg:pb-0">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-purple-100 bg-white/80 px-4 md:px-6 py-3 backdrop-blur-sm">
        <button onClick={onBack}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#4b14bd] px-3 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#3d0aa8] transition">
          <ArrowLeft size={16} /> Geri qayıt
        </button>
        <h1 className="flex-1 min-w-0 text-[15px] font-black tracking-[-.02em] text-[#33245f] truncate">
          {isCompleted ? `${item.type} · Tamamlandı` : item.type}
        </h1>
        {!isCompleted && onDonate && (
          <button onClick={() => onDonate(item)}
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#4b14bd] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-[#3d0aa8] transition">
            <Heart size={15} /> İanə et
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">

        {/* ── Main info card ── */}
        <div className="overflow-hidden rounded-[10px] border border-[#e7e1f0] bg-white shadow-[0_4px_14px_rgba(49,22,93,.05)]">
          <div className="flex flex-col lg:flex-row">

            {/* Photo — full width on mobile, left sidebar on lg+ */}
            <div className="lg:w-[280px] shrink-0 bg-[#f5f2ff]">
              <img src={item.img} alt={`${item.type} qurban heyvanı`}
                className="h-[200px] lg:h-full w-full object-cover" />
            </div>

            {/* Data area */}
            <div className="flex flex-col xl:flex-row flex-1 divide-y xl:divide-y-0 xl:divide-x divide-[#e7e1f0]">

              {/* Stats — 2 col on mobile */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 p-4">

                {/* Col 1: name / weight / date / participants */}
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[18px] font-black text-[#33245f] mb-3">{item.type}</div>
                  {item.weightRange && (
                    <>
                      <div className="text-[11px] font-bold text-[#8b7dac] mb-1">Diri çəki</div>
                      <div className="text-[13px] font-black text-[#33245f] mb-3">{item.weightRange}</div>
                    </>
                  )}
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Açılış tarixi</div>
                  <div className="flex items-center gap-1.5 text-[13px] font-black text-[#33245f] mb-3">
                    <CalendarDays size={14} className="text-[#6840c6]" /> {item.startDate}
                  </div>
                  {/* İştirakçı sayı — mobile only (desktop shows in Col 3) */}
                  <div className="md:hidden">
                    <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">İştirakçı sayı</div>
                    <div className="flex items-center gap-1.5 text-[13px] font-black text-[#33245f]">
                      <Users size={14} className="text-[#5b22c7]" /> {item.participants} nəfər
                    </div>
                  </div>
                </div>

                {/* Col 2: total / collected */}
                <div className="md:border-r md:border-[#e7e1f0] md:pr-5">
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Ümumi məbləğ</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-3">
                    <Coins size={16} className="text-[#5b22c7]" /> {item.totalAmount} AZN
                  </div>
                  {!isCompleted && (
                    <>
                      <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">Toplanan məbləğ</div>
                      <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f]">
                        <Coins size={16} className="text-[#5b22c7]" /> {item.collectedAmount} AZN
                      </div>
                    </>
                  )}
                </div>

                {/* Col 3 — desktop only */}
                <div className="hidden md:block">
                  <div className="text-[11px] font-bold text-[#8b7dac] mb-1.5">İştirakçı sayı</div>
                  <div className="flex items-center gap-1.5 text-[15px] font-black text-[#33245f] mb-5">
                    <Users size={20} className="text-[#5b22c7]" /> {item.participants} nəfər
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
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">Açılış tamamlanıb</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1 xl:w-full">
                      <button onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4b14bd] py-2 text-[12px] font-extrabold text-white hover:bg-[#3d0aa8] transition">
                        <Video size={14} /> Kəsim videosu
                      </button>
                      <button onClick={handleShare}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d9cff0] bg-white py-2 text-[12px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition">
                        <Share2 size={14} /> {copied ? "Kopyalandı!" : "Dostlarınla paylaş"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 xl:flex-col xl:items-center xl:text-center">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="text-[11px] font-bold text-[#6e5b9b] mb-1">Tamamlanma</div>
                      <svg width="130" height="130" viewBox="0 0 108 108">
                        <defs>
                          <linearGradient id="iane-detail-grad" x1="54" y1="96" x2="54" y2="12" gradientUnits="userSpaceOnUse">
                            <stop offset="0%"   stopColor="#4513ad" />
                            <stop offset="65%"  stopColor="#5d28cf" />
                            <stop offset="100%" stopColor="#7b4cea" />
                          </linearGradient>
                        </defs>
                        <circle cx="54" cy="54" r="42" fill="none" stroke="#e6dcff" strokeWidth="9" />
                        <circle cx="54" cy="54" r="42" fill="none" stroke="url(#iane-detail-grad)" strokeWidth="11"
                          strokeLinecap="round"
                          strokeDasharray={`${(item.progressPercent / 100) * 2 * Math.PI * 42} ${(1 - item.progressPercent / 100) * 2 * Math.PI * 42}`}
                          transform="rotate(90 54 54)" />
                        <text x="54" y="61" textAnchor="middle" fontSize="22" fontWeight="900" fill="#4b14bd">
                          {item.progressPercent}%
                        </text>
                      </svg>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-2 xl:w-full">
                      <span className={`w-full max-w-[130px] rounded-lg px-3 py-1.5 text-[11px] font-black text-center ${cfg.badge}`}>
                        {cfg.label || item.status}
                      </span>
                      <button onClick={handleShare}
                        className="flex w-full max-w-[130px] items-center justify-center gap-1.5 rounded-lg border border-[#d9cff0] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#4b14bd] hover:bg-[#f6f1ff] transition">
                        <Share2 size={12} /> {copied ? "Kopyalandı!" : "Paylaş"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Opener row ── */}
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

        {/* ── Donors table ── */}
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

      {/* ── Video modal ── */}
      {showVideo && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4"
          style={{ backgroundColor: "rgba(10,4,30,0.82)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowVideo(false)}>
          <div className="w-full sm:max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-2xl bg-[#0d0820] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                  style={{ background: "linear-gradient(135deg,#4b14bd,#7c3aed)" }}>
                  <Video size={17} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[15px] font-black text-white leading-none">{item.type} — Kəsim Videosu</div>
                  <div className="mt-1 text-[11px] font-medium text-white/50">Tamamlanmış qurban kəsimi</div>
                </div>
              </div>
              <button onClick={() => setShowVideo(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
                <X size={18} />
              </button>
            </div>
            {item.videoUrl ? (
              <div className="aspect-video bg-black">
                <video src={item.videoUrl} controls autoPlay playsInline className="h-full w-full" style={{ display: "block" }}>
                  <source src={item.videoUrl} type="video/mp4" />
                </video>
              </div>
            ) : (
              <div className="aspect-video bg-[#080514] flex flex-col items-center justify-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/5">
                  <Video size={32} className="text-white/20" />
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-bold text-white/40">Video hələ yüklənməyib</div>
                  <div className="mt-1 text-[12px] text-white/25">Kəsim tamamlandıqdan sonra əlavə ediləcək</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-white/5">
              <img src={item.img} alt={item.type} className="h-10 w-10 rounded-xl object-cover" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white/80 truncate">{item.type} qurban · {item.startDate}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{item.participants} iştirakçı · {item.totalAmount} AZN</div>
              </div>
              <span className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: "rgba(52,211,153,0.15)", color: "#6ee7b7" }}>Tamamlandı</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
