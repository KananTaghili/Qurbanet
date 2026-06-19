"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";
import {
  Wallet, Flag, Users, User, Video, Share2, ChevronDown,
  X, Beef,
} from "lucide-react";
import {
  fmtAmt, fmtDate, mapMyCampaign,
  STATUS_CFG, TAB_OPTIONS, STATUS_OPTIONS,
} from "../_lib";
import IaneDetailPage from "../_IaneDetailPage";

/* ─── Shared small components ────────────────────────────────── */
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

/* ─── İanələrim Page ─────────────────────────────────────────── */
function IanelerimContent() {
  const { isGuest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [activeTab, setActiveTab]       = useState("Hamısı");
  const [statusFilter, setStatusFilter] = useState("Hamısı");
  const [statusOpen, setStatusOpen]     = useState(false);
  const [videoTarget, setVideoTarget]   = useState(null);
  const [copiedId, setCopiedId]         = useState(null);

  const handleShare = (e, item) => {
    e.stopPropagation();
    const url = `${window.location.origin}/charity/donations?detail=${item.id}`;
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

  useEffect(() => {
    const detailId = searchParams.get("detail");
    if (detailId && orders.length > 0) {
      const item = orders.find(o => o.id === detailId);
      if (item) setSelected(item);
    }
  }, [searchParams, orders]);

  const openDetail = (item) => {
    setSelected(item);
    router.push(`/charity/donations?detail=${item.id}`, { scroll: false });
  };

  const closeDetail = () => {
    setSelected(null);
    router.push("/charity/donations", { scroll: false });
  };

  if (isGuest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 pb-24 lg:pb-14 text-center bg-[#fbfaff]">
        <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl mb-5"
          style={{ background: "linear-gradient(135deg,#f0ebff,#e4d9ff)" }}>
          <Users size={32} style={{ color: "#4b14bd" }} />
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
    );
  }

  if (selected) return <IaneDetailPage item={selected} onBack={closeDetail} />;

  const totalPaid = orders.reduce((s, o) => s + o.amountRaw, 0);
  const filtered = orders.filter((item) => {
    const tabMatch =
      activeTab === "Hamısı" ||
      (activeTab === "Açdığım açılışlar"         && item.iAmOpener === true) ||
      (activeTab === "İştirak etdiyim açılışlar" && item.iAmOpener === false);
    return tabMatch && (statusFilter === "Hamısı" || item.status === statusFilter);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-3 md:px-4 py-3 md:py-4 pb-20 lg:pb-4">
      <div className="mb-4 flex flex-col sm:flex-row overflow-hidden rounded-xl border border-[#e7e1f0] bg-white shadow-sm">
        <TopStat icon={Wallet} title="Bütün ianələrimin toplamı" value={`${fmtAmt(totalPaid)} AZN`} />
        <TopStat icon={Flag}   title="Ümumi ianə sayı"           value={String(orders.length)}       />
        <TopStat icon={Users}  title="Tamamlanmış ianələr"       value={String(orders.filter(o => o.status === "Tamamlandı").length)} />
      </div>

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

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
        </div>
      )}

      <div className="space-y-3">
        {!loading && filtered.map((item) => {
          const cfg = STATUS_CFG[item.status] || STATUS_CFG["Davam edir"];
          return (
            <div key={item.id} onClick={() => openDetail(item)}
              className="cursor-pointer overflow-hidden rounded-2xl border border-[#ece6f5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md my-2">
              {/* Mobile */}
              <div className="flex lg:hidden">
                <div className="shrink-0 w-[110px]">
                  <img src={item.img} alt={item.type} className="h-full w-full rounded-l-2xl bg-[#f5f2ff] object-cover" />
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
                      <button onClick={(e) => { e.stopPropagation(); openDetail(item); }}
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

              {/* Desktop */}
              <div className="hidden lg:grid grid-cols-[260px_1fr_250px] min-h-[160px]">
                <div className="shrink-0">
                  <img src={item.img} alt={item.type} className="h-full w-full rounded-l-2xl bg-[#f5f2ff] object-cover" />
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
                    <button onClick={(e) => { e.stopPropagation(); openDetail(item); }}
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

      {/* Kəsim Video Modal */}
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
                  <div className="mt-1 text-[11px] font-semibold text-[#8778a8]">{videoTarget.endDate} tarixində tamamlanmış qurbanlıq</div>
                </div>
              </div>
              <button onClick={() => setVideoTarget(null)}
                className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-[#4b14bd] transition hover:bg-white shadow-sm">
                <X size={16} />
              </button>
            </div>
            <div className="relative bg-black aspect-video">
              <video controls autoPlay className="h-full w-full" poster={videoTarget.img} style={{ display: "block" }}>
                <source src={videoTarget.videoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"} type="video/mp4" />
              </video>
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

export default function IanelerimPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[#fbfaff]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
      </div>
    }>
      <IanelerimContent />
    </Suspense>
  );
}
