"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Users, User, Video, Copy, X } from "lucide-react";
import api from "../../../lib/api";
import { mapCompletedCampaign, fmtDate } from "../_lib";
import IaneDetailPage from "../_IaneDetailPage";

function CompletedStat({ label, value }) {
  return (
    <div className="min-w-[102px] border-r border-[#e7e1f0] pr-5 last:border-r-0 last:pr-0">
      <div className="mb-1.5 text-[12px] font-semibold text-[#8778a8]">{label}</div>
      <div className="text-[16px] font-extrabold leading-none text-[#33245f]">{value}</div>
    </div>
  );
}

export default function TamamlanmisPage() {
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

  const handleShare = async (e, item) => {
    e.stopPropagation();
    const url = `${window.location.origin}/charity/completed#${item.id}`;
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
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-4 py-2 pb-20 lg:pb-3">
      {shareMessage && (
        <div className="fixed right-5 top-5 z-50 max-w-sm rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_14px_36px_rgba(28,18,72,0.16)]">
          Səhifənin bağlantısı kopyalandı. Dostlarınla paylaşa bilərsən.
        </div>
      )}

      <div className="mb-3 flex overflow-hidden rounded-[11px] border border-[#e7e1f0] bg-white shadow-[0_4px_16px_rgba(63,34,116,0.07)]">
        <div className="flex min-h-[72px] flex-1 items-center gap-4 px-5">
          <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6a24d1] to-[#3d0aa8] text-white shadow-[0_8px_18px_rgba(83,25,188,.22)]">
            <CheckCircle size={26} strokeWidth={2} />
          </div>
          <div>
            <div className="mb-0.5 text-[12px] font-extrabold text-[#33245f]">Ümumi tamamlanmış ianə sayı</div>
            <div className="text-[22px] font-black leading-none tracking-[-.03em] text-[#24124f]">{orders.length}</div>
            <div className="mt-0.5 text-[11px] font-bold text-[#77689c]">Tamamlanmış ianələr</div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h1 className="text-[20px] font-black tracking-[-.02em] text-[#33245f]">Tamamlanmış Açılışlar</h1>
        <p className="mt-0.5 text-[12px] font-semibold text-[#8778a8]">Açılışlar tamamlanma vaxtına görə sıralanıb</p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
        </div>
      )}
      {!loading && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#d8cdec] bg-white px-6 py-14 text-center text-[14px] text-[#77689c]">
          Hələ tamamlanmış ianəniz yoxdur.
        </div>
      )}

      <div className="space-y-3.5">
        {orders.map((item) => {
          const openerDon  = (item.donations || []).find(d => d.isOpener);
          const paidPct    = openerDon ? Math.round(openerDon.percent || 0) : 0;
          const displayAmt = openerDon ? openerDon.amount : item.amount;
          const initials   = (item.organizer || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
          return (
            <div key={item.id} onClick={() => setSelected(item)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelected(item); }}
              className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-[#ece6f5] bg-white text-left shadow-[0_5px_16px_rgba(46,23,92,0.06)] transition-shadow hover:shadow-[0_12px_28px_rgba(46,23,92,0.11)]">

              {/* ── Mobile layout ── */}
              <div className="lg:hidden">
                {/* Cover photo with gradient overlay */}
                <div className="relative h-[150px] w-full overflow-hidden bg-[#f5f2ff]">
                  <img src={item.img} alt={item.type}
                    className="h-full w-full object-cover" />
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(20,8,60,0.75) 0%, rgba(20,8,60,0.1) 55%, transparent 100%)" }} />
                  {/* Animal name + badge over photo */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 pb-2.5">
                    <h3 className="text-[20px] font-black leading-none text-white drop-shadow">{item.type}</h3>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                      <CheckCircle size={11} strokeWidth={2.5} /> Tamamlandı
                    </span>
                  </div>
                </div>

                {/* Info section */}
                <div className="px-3 pt-3 pb-3 flex flex-col gap-2.5">

                  {/* Opener row */}
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">
                      {initials}
                    </div>
                    <span className="text-[12px] font-semibold text-[#33245f] truncate flex-1">{item.organizer}</span>
                    <span className="shrink-0 rounded-full bg-[#f1ecff] px-2 py-0.5 text-[10px] font-bold text-[#5622c6]">
                      {paidPct}% · {displayAmt} AZN
                    </span>
                  </div>

                  {/* Stats 2-col */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl bg-[#f8f6ff] px-2.5 py-2 col-span-1">
                      <div className="text-[9px] font-semibold text-[#8778a8] mb-0.5">Tarix</div>
                      <div className="text-[11px] font-bold text-[#33245f] leading-tight">{item.date}</div>
                    </div>
                    <div className="rounded-xl bg-[#f8f6ff] px-2.5 py-2 col-span-1">
                      <div className="text-[9px] font-semibold text-[#8778a8] mb-0.5">İştirakçı</div>
                      <div className="text-[11px] font-bold text-[#33245f]">{item.participants} nəfər</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-2.5 py-2 col-span-1">
                      <div className="text-[9px] font-semibold text-emerald-600 mb-0.5">Məbləğ</div>
                      <div className="text-[11px] font-bold text-emerald-700">{item.totalAmount} AZN</div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                      className="flex flex-1 h-[32px] items-center justify-center gap-1.5 rounded-xl bg-[#4b14bd] text-[11px] font-bold text-white">
                      <Users size={12} /> İştirakçılar
                    </button>
                    {item.videoUrl && (
                      <button onClick={(e) => { e.stopPropagation(); setVideoTarget(item); }}
                        className="flex flex-1 h-[32px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[11px] font-bold text-white">
                        <Video size={12} /> Video
                      </button>
                    )}
                    <button onClick={(e) => handleShare(e, item)}
                      className="flex h-[32px] items-center justify-center gap-1 rounded-xl border border-[#d9cff0] bg-white px-3 text-[11px] font-bold text-[#4b14bd]">
                      <Copy size={11} /> Paylaş
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Desktop layout (unchanged) ── */}
              <div className="hidden lg:grid min-h-[130px] grid-cols-[130px_240px_1fr_210px]">
                <div className="flex flex-col justify-center border-r border-[#e7e1f0] bg-[#fbf9ff] px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#8778a8]">
                    <span className="text-[#5b22c7] text-[16px] leading-none">•</span>
                    Tamamlanma tarixi
                  </div>
                  <div className="text-[16px] font-black leading-snug text-[#33245f]">
                    {item.date.split(" ").slice(0, 2).join(" ")}<br />{item.date.split(" ")[2]}
                  </div>
                </div>
                <div className="flex items-stretch border-r border-[#e7e1f0]">
                  <img src={item.img} alt={`${item.type} qurban heyvanı`} className="h-full w-full bg-white object-cover" />
                </div>
                <div className="flex flex-col justify-center px-5 py-3">
                  <div className="mb-1.5 flex items-center gap-3">
                    <h3 className="text-[22px] font-extrabold leading-none text-[#33245f]">{item.type}</h3>
                  </div>
                  <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-[#77689c]">
                    <User size={15} className="text-[#7760bb]" />
                    <span>{item.organizer}</span>
                    <span className="rounded-full bg-[#f1ecff] px-2.5 py-0.5 text-[12px] font-bold text-[#5622c6]">
                      {paidPct}% · {displayAmt} AZN ödədi
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start gap-5">
                    <CompletedStat label="Açılış tarixi"  value={item.date} />
                    <CompletedStat label="Ümumi məbləğ"   value={`${item.totalAmount} AZN`} />
                    <CompletedStat label="İştirakçı sayı" value={`${item.participants} nəfər`} />
                  </div>
                </div>
                <div className="flex items-center justify-center border-l border-[#e7e1f0] px-5 py-3">
                  <div className="w-full max-w-[180px] space-y-2">
                    <div className="rounded-[10px] border border-emerald-100 bg-emerald-50 py-2.5 text-center">
                      <CheckCircle size={26} className="mx-auto mb-1 text-emerald-500" strokeWidth={2} />
                      <div className="text-[11px] font-black text-emerald-600">Açılış tamamlanıb</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                      className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#4b14bd] text-[12px] font-bold text-white transition hover:bg-[#3d0aa8]">
                      <Users size={15} />İştirakçılara bax
                    </button>
                    {item.videoUrl && (
                      <button onClick={(e) => { e.stopPropagation(); setVideoTarget(item); }}
                        className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[8px] bg-emerald-600 text-[12px] font-bold text-white transition hover:bg-emerald-700">
                        <Video size={14} />Kəsim Videosu
                      </button>
                    )}
                    <button onClick={(e) => handleShare(e, item)}
                      className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[8px] border border-[#d9cff0] bg-white text-[12px] font-bold text-[#4b14bd] transition hover:bg-[#f6f1ff]">
                      <Copy size={13} />Dostlarınla paylaş
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {videoTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(10,4,30,0.72)" }} onClick={() => setVideoTarget(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(10,4,30,0.4)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e7e1f0] px-5 py-4"
              style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#4b14bd] text-white shadow-[0_4px_10px_rgba(75,20,189,.3)]">
                  <Video size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-black text-[#33245f] leading-none truncate">{videoTarget.type} — Kəsim Videosu</div>
                  <div className="mt-1 text-[11px] font-semibold text-[#8778a8]">{videoTarget.date} tarixində tamamlanmış qurbanlıq</div>
                </div>
              </div>
              <button onClick={() => setVideoTarget(null)}
                className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-[#4b14bd] transition hover:bg-white shadow-sm">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-0">
              {(videoTarget.media?.length > 0) ? videoTarget.media.map((m, i) =>
                m.type === "video" ? (
                  <div key={i} className="relative bg-black aspect-video">
                    <video controls autoPlay={i === 0} className="h-full w-full" style={{ display: "block" }}>
                      <source src={m.url} type="video/mp4" />
                    </video>
                  </div>
                ) : (
                  <img key={i} src={m.url} alt={`Kəsim ${i + 1}`} className="w-full object-cover max-h-72" />
                )
              ) : (
                <div className="relative bg-black aspect-video">
                  <video controls autoPlay className="h-full w-full" poster={videoTarget.img} style={{ display: "block" }}>
                    <source src={videoTarget.videoUrl || ""} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#e7e1f0] bg-[#fbfaff] px-5 py-3">
              <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#6e5b9b]">
                <img src={videoTarget.img} alt={videoTarget.type} className="h-8 w-8 rounded-lg object-contain bg-purple-50" />
                <span>{videoTarget.organizer}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Tamamlandı</span>
              </div>
              <button onClick={() => setVideoTarget(null)}
                className="flex h-8 items-center gap-2 rounded-lg border border-[#d9cff0] bg-white px-4 text-[12px] font-bold text-[#4b14bd] hover:bg-[#f6f1ff] transition">
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
