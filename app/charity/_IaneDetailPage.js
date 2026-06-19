"use client";
import { useState } from "react";
import {
  ArrowLeft, CalendarDays, Coins, Users, Share2, Video,
  CheckCircle, X, ChevronDown,
} from "lucide-react";
import { fmtDate, fmtTime, avatarColor, initials, STATUS_CFG } from "./_lib";

export default function IaneDetailPage({ item, onBack }) {
  const [showAll, setShowAll]     = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [copied, setCopied]       = useState(false);

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
            <div className="xl:w-[260px] shrink-0 bg-[#f5f2ff]">
              <img src={item.img} alt={`${item.type} qurban heyvanı`}
                className="h-[220px] xl:h-full w-full object-cover" />
            </div>
            <div className="flex flex-col xl:flex-row flex-1 divide-y xl:divide-y-0 xl:divide-x divide-[#e7e1f0]">
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
