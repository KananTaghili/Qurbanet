'use client';
import { RiKnifeLine } from 'react-icons/ri';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList, Video, ArrowRight, Heart,
  CheckCircle2, Truck, XCircle, Clock,
  CreditCard, Package, RefreshCw,
  ShoppingBag, Wallet, Activity, Scale,
  Scissors, ChevronDown, Star, SlidersHorizontal,
} from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../lib/i18n';

const BRAND = '#1c5e20';

function fmtDate(ds, months) {
  if (!ds) return '—';
  const d = new Date(ds);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const ANIMAL_IMAGES = {
  quzu:  '/qoyun.jpg',
  qoyun: '/qoyun.jpg',
  qoc:   '/qoc.jpg',
  dana:  '/dana.jpg',
  deve:  '/deve.jpg',
};

const STATUS_CFG = {
  awaiting_payment: { label: 'Ödəniş gözlənilir', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', Icon: CreditCard,   step: 0, group: 'active'    },
  placed:           { label: 'Sifariş yoxlanılır', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', Icon: Clock,        step: 0, group: 'active'    },
  pending_payment:  { label: 'Ödəniş gözlənilir', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', Icon: CreditCard,   step: 0, group: 'active'    },
  confirmed:        { label: 'Təsdiqləndi',        bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', Icon: CheckCircle2, step: 1, group: 'active'    },
  paid:             { label: 'Ödənilib',           bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', Icon: CreditCard,   step: 1, group: 'active'    },
  slaughtering:     { label: 'Kəsilir',            bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', Icon: RiKnifeLine,  step: 2, group: 'active'    },
  preparing:        { label: 'Hazırlanır',         bg: '#D1FAE5', color: '#065F46', dot: '#10B981', Icon: Package,      step: 3, group: 'active'    },
  delivering:       { label: 'Çatdırılır',         bg: '#DBEAFE', color: '#1E3A8A', dot: '#2563EB', Icon: Truck,        step: 4, group: 'active'    },
  completed:        { label: 'Tamamlandı',         bg: '#D1FAE5', color: '#14532D', dot: '#22C55E', Icon: CheckCircle2, step: 5, group: 'completed' },
  cancelled:        { label: 'Ləğv edildi',        bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', Icon: XCircle,      step: -1, group: 'cancelled' },
};

const PIPELINE_STEPS = [
  { label: 'Sifariş yoxlanılır', Icon: Clock        },
  { label: 'Təsdiqləndi',     Icon: CheckCircle2 },
  { label: 'Kəsilir',         Icon: RiKnifeLine  },
  { label: 'Hazırlanır',      Icon: Package      },
  { label: 'Çatdırılır',      Icon: Truck        },
  { label: 'Tamamlandı',      Icon: Star         },
];

const CHARITY_DIST_KEYS = {
  usaqlar_evi:       'distLabel_usaqlar_evi',
  qocalar_evi:       'distLabel_qocalar_evi',
  ehtiyac_sahibleri: 'distLabel_ehtiyac_sahibleri',
};

/* ── Cancelled Badge ───────────────────────────── */
function CancelledBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: '#FEE2E2', border: '1.5px solid #FECACA' }}>
      <XCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
      <span className="text-[12px] font-bold" style={{ color: '#991B1B' }}>Ləğv edildi</span>
    </div>
  );
}

/* ── Pipeline ──────────────────────────────────── */
function Pipeline({ step }) {
  if (step < 0) return null;
  return (
    <div className="flex items-start">
      {PIPELINE_STEPS.map(({ label, Icon }, i) => {
        const done = i <= step;
        const isLast = i === PIPELINE_STEPS.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            {/* line + circle row */}
            <div className="flex items-center w-full">
              {/* left connector */}
              <div className="flex-1 h-[1.5px] sm:h-[2px]" style={{ background: i === 0 ? 'transparent' : (done ? BRAND : '#e5e7eb') }} />
              {/* icon circle */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: done ? BRAND : '#e9eee9', border: `2px solid ${done ? BRAND : '#d1d5db'}` }}>
                <Icon size={11} style={{ color: done ? '#fff' : '#9ca3af' }} />
              </div>
              {/* right connector */}
              <div className="flex-1 h-[1.5px] sm:h-[2px]" style={{ background: isLast ? 'transparent' : (done && i < step ? BRAND : '#e5e7eb') }} />
            </div>
            {/* label */}
            <span className="mt-1 text-[7.5px] sm:text-[9.5px] font-bold leading-none text-center"
              style={{ color: done ? BRAND : '#9ca3af' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Order Card ────────────────────────────────── */
function OrderCard({ item, lang }) {
  const months    = t(lang, 'months_short');
  const itemId    = item.id || item._id;
  const isCharity = item._type === 'charity';
  const href      = isCharity ? `/charity-order/detail?id=${itemId}` : `/my-orders/detail?id=${itemId}`;
  const status    = item.status || 'placed';
  const cfg       = STATUS_CFG[status] || STATUS_CFG.placed;
  const StatusIcon = cfg.Icon;

  const charityKey = CHARITY_DIST_KEYS[item.charityTarget];
  const title  = isCharity
    ? (charityKey ? t(lang, charityKey) : t(lang, 'charityLabel'))
    : (item.animal?.nameAz || item.animalNameAz || 'Heyvan');

  const orderNum  = item.orderNumber || `QRB-${new Date(item.createdAt || Date.now()).getFullYear()}-${String(itemId).slice(-5).toUpperCase()}`;
  const qty       = item.quantity || item.sharedPortion || 1;
  const amount    = item.totalPrice ?? item.totalAmount ?? null;
  const weight    = item.lambSelection?.weightCategoryLabel || item.weightCategoryLabel || item.animal?.weightRange || item.lambSelection?.weightRange || item.weightRange || null;
  const imgSrc    = isCharity ? null : (item.animal?.imageUrl || ANIMAL_IMAGES[item.animalType] || '/qoyun.jpg');

  return (
    <Link href={href} className="no-underline block group relative">
      {/* Status icon — green circle floating outside card at top-right, moves up on hover */}
      {(() => { const PipeIcon = PIPELINE_STEPS[Math.max(0, cfg.step)]?.Icon || StatusIcon; return (
        <div className="absolute -top-4 -right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:-translate-y-0.5"
          style={{ background: BRAND }}>
          <PipeIcon size={20} style={{ color: '#fff' }} />
        </div>
      ); })()}

      <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl"
        style={{ boxShadow: '0 3px 16px rgba(28,94,32,0.08)', border: '1.5px solid #e8f0e8' }}>

        {/* ── MOBILE layout: image top full-width, content + pipeline below ── */}
        <div className="md:hidden flex flex-col">
          <div className="relative w-full overflow-hidden" style={{ height: 130, background: '#f0f7f0' }}>
            {isCharity ? (
              <div className="w-full h-full flex items-center justify-center">
                <Heart size={36} style={{ color: BRAND, opacity: 0.2 }} />
              </div>
            ) : (
              <img src={imgSrc} alt={title} className="w-full h-full object-cover"
                style={{ objectPosition: 'center 20%' }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.52), transparent)' }}>
              <p className="font-mono text-[8px] font-bold text-white/90 truncate">{orderNum}</p>
            </div>
          </div>
          <div className="px-3 py-3 flex flex-col gap-2">
            <h3 className="text-[17px] font-extrabold text-[#071b0d] leading-tight pr-6">{title}</h3>
            <div className="flex flex-wrap gap-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: '#f0f7f0', color: '#2d5a2d' }}>
                <ShoppingBag size={9} /> {qty} {t(lang, 'animalUnit')}
              </div>
              {amount != null && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: '#f0f7f0', color: BRAND }}>
                  <Wallet size={9} /> {amount} AZN
                </div>
              )}
              {weight && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: '#f0f7f0', color: '#2d5a2d' }}>
                  <Scale size={9} /> Diri Çəki: {weight}
                </div>
              )}
              {item.mediaFiles?.length > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">
                  <Video size={9} /> Video
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">{fmtDate(item.createdAt, months)}</p>
          </div>
          {!isCharity && (
            <div className="px-3 pt-1 pb-3 border-t border-gray-100">
              {cfg.step < 0 ? <CancelledBadge /> : <Pipeline step={cfg.step} />}
            </div>
          )}
        </div>

        {/* ── DESKTOP layout: image left, all content + pipeline right ── */}
        <div className="hidden md:flex flex-row">
          <div className="relative shrink-0 w-[200px] overflow-hidden" style={{ background: '#f0f7f0', minHeight: 170 }}>
            {isCharity ? (
              <div className="w-full h-full flex items-center justify-center">
                <Heart size={40} style={{ color: BRAND, opacity: 0.2 }} />
              </div>
            ) : (
              <img src={imgSrc} alt={title} className="w-full h-full object-cover"
                style={{ objectPosition: 'center 15%' }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.52), transparent)' }}>
              <p className="font-mono text-[9px] font-bold text-white/90 truncate">{orderNum}</p>
            </div>
          </div>
          <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between gap-2">
            <h3 className="text-[17px] font-extrabold text-[#071b0d] leading-tight pr-6">{title}</h3>
            <div className="flex flex-wrap gap-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: '#f0f7f0', color: '#2d5a2d' }}>
                <ShoppingBag size={10} /> {qty} {t(lang, 'animalUnit')}
              </div>
              {amount != null && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: '#f0f7f0', color: BRAND }}>
                  <Wallet size={10} /> {amount} AZN
                </div>
              )}
              {weight && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: '#f0f7f0', color: '#2d5a2d' }}>
                  <Scale size={10} /> Diri Çəki: {weight}
                </div>
              )}
              {item.mediaFiles?.length > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-600">
                  <Video size={10} /> Video
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 -mb-1">{fmtDate(item.createdAt, months)}</p>
            {!isCharity && (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  {cfg.step < 0 ? <CancelledBadge /> : <Pipeline step={cfg.step} />}
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all group-hover:gap-1.5"
                  style={{ color: BRAND, background: '#e8f5e9' }}>
                  {t(lang, 'viewDetail')} <ArrowRight size={11} />
                </span>
              </div>
            )}
            {isCharity && (
              <div className="flex justify-end">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-xl"
                  style={{ color: BRAND, background: '#e8f5e9' }}>
                  {t(lang, 'viewDetail')} <ArrowRight size={11} />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Status Filter Dropdown ────────────────────── */
function StatusFilter({ tabs, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = tabs.find(t => t.key === value) || tabs[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[13px] transition-all"
        style={{ background: '#fff', border: `2px solid ${open ? BRAND : '#d4edda'}`, color: BRAND, boxShadow: open ? `0 0 0 3px ${BRAND}18` : '0 2px 8px rgba(28,94,32,0.08)' }}>
        <current.Icon size={14} strokeWidth={2.2} />
        <span>{current.label}</span>
        <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold" style={{ background: '#e8f5e9', color: BRAND }}>
          {current.count}
        </span>
        <ChevronDown size={13} strokeWidth={2.5} className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none', opacity: 0.6 }} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 8px 32px rgba(28,94,32,0.14)', border: '1.5px solid #e0ede0', minWidth: 200 }}>
          {tabs.map((tab, i) => {
            const TabIcon = tab.Icon;
            const active = tab.key === value;
            return (
              <button key={tab.key} onClick={() => { onChange(tab.key); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold transition-all text-left"
                style={{
                  background: active ? '#f0f9f0' : (i % 2 === 0 ? '#fff' : '#fafafa'),
                  color: active ? BRAND : '#374151',
                  borderLeft: active ? `3px solid ${BRAND}` : '3px solid transparent',
                }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: active ? '#e8f5e9' : '#f3f4f6' }}>
                  <TabIcon size={14} strokeWidth={2.2} style={{ color: active ? BRAND : '#6b7280' }} />
                </div>
                <span className="flex-1">{tab.label}</span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold"
                  style={{ background: active ? '#d1fae5' : '#f3f4f6', color: active ? BRAND : '#6b7280' }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3"
      style={{ boxShadow: '0 2px 12px rgba(28,94,32,0.07)', border: '1.5px solid #e8f0e8' }}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: '#e8f5e9' }}>
        <Icon size={15} color={BRAND} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 leading-none mb-0.5 sm:mb-1 truncate">{label}</p>
        <p className="text-sm sm:text-lg font-extrabold text-[#071b0d] leading-none truncate">{value}</p>
        {sub && <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 hidden sm:block">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */
export default function MyOrdersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const [orders,        setOrders]        = useState([]);
  const [charityOrders, setCharityOrders] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(false);
  const [filter,        setFilter]        = useState('all');
  const authLoadingRef = useRef(authLoading);

  const isActualGuest = !authLoading && (!token || user?.isGuest === true);

  useEffect(() => { authLoadingRef.current = authLoading; }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (isActualGuest) { router.replace('/auth/login'); return; }
    fetchAll();
  }, [authLoading, token, user?.isGuest]);

  useEffect(() => {
    const onPageShow = (e) => { if (e.persisted && !authLoadingRef.current && !isActualGuest) fetchAll(); };
    const onVisible  = () => { if (document.visibilityState === 'visible' && !authLoadingRef.current && !isActualGuest) fetchAll(); };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isActualGuest]);

  useSocket({
    'order:updated':         () => { if (!isActualGuest) fetchAll(); },
    'charity_order:updated': () => { if (!isActualGuest) fetchAll(); },
  });

  const fetchAll = async (retry = 0) => {
    if (retry === 0) { setLoading(true); setFetchError(false); }
    try {
      const [ordRes, charRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/charity-orders'),
      ]);
      if (ordRes.status === 'rejected' && ordRes.reason?.response?.status === 401) {
        router.replace('/auth/login'); return;
      }
      if (ordRes.status === 'rejected' && !ordRes.reason?.response) {
        if (retry < 2) {
          setTimeout(() => fetchAll(retry + 1), 1500 * (retry + 1));
          return;
        }
        setFetchError(true); return;
      }
      if (ordRes.status  === 'fulfilled') setOrders(ordRes.value.data.data?.orders || []);
      if (charRes.status === 'fulfilled') {
        const d = charRes.value.data.data;
        setCharityOrders(Array.isArray(d) ? d : (d?.orders || []));
      }
    } catch { setFetchError(true); } finally { setLoading(false); }
  };

  const allItems = [
    ...orders.map(o        => ({ ...o, _type: 'order' })),
    ...charityOrders.map(o => ({ ...o, _type: 'charity' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const activeCount = allItems.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  const totalAmount = allItems.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.totalPrice ?? o.totalAmount) || 0), 0);

  /* Status tabs — only show groups that have items */
  const TABS = [
    { key: 'all',       label: 'Hamısı',     Icon: ClipboardList, count: allItems.length,                                            filter: () => true },
    { key: 'active',    label: 'Aktiv',      Icon: Activity,      count: activeCount,                                                filter: o => !['completed','cancelled'].includes(o.status) },
    { key: 'completed', label: 'Tamamlanmış', Icon: CheckCircle2,  count: allItems.filter(o => o.status === 'completed').length,      filter: o => o.status === 'completed' },
    { key: 'cancelled', label: 'Ləğv edildi',Icon: XCircle,       count: allItems.filter(o => o.status === 'cancelled').length,      filter: o => o.status === 'cancelled' },
  ].filter(tab => tab.key === 'all' || tab.count > 0);

  const activeTab  = TABS.find(t => t.key === filter) || TABS[0];
  const filtered   = allItems.filter(activeTab.filter);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-6 max-w-4xl mx-auto w-full">

          <div className="mb-4">
            <h1 className="text-xl font-extrabold text-[#071b0d]">{t(lang, 'ordersTitle')}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Bütün sifariş tarixçənizi buradan izləyin</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 rounded-full animate-spin"
                style={{ borderColor: '#e8f5e9', borderTopColor: BRAND }} />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center py-24 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-50">
                <ClipboardList size={32} className="text-red-400" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#071b0d]">Sifarişlər yüklənmədi</p>
                <p className="text-sm text-gray-400 mt-1">İnternet bağlantınızı yoxlayın</p>
              </div>
              <button onClick={fetchAll}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: BRAND }}>
                <RefreshCw size={14} /> Yenidən cəhd et
              </button>
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#e8f5e9' }}>
                <ClipboardList size={32} color={BRAND} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#071b0d]">{t(lang, 'noOrders')}</p>
                <p className="text-sm text-gray-400 mt-1">{t(lang, 'noOrdersDesc')}</p>
              </div>
              <Link href="/qurban"
                className="no-underline inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: BRAND }}>
                {t(lang, 'placeOrder')}
              </Link>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                <StatCard icon={ClipboardList} label="Ümumi sifariş"   value={allItems.length}                   sub="Bugünə kimi" />
                <StatCard icon={Activity}      label="Aktiv sifariş"   value={activeCount}                       sub="Davam edir"  />
                <StatCard icon={Wallet}        label="Ödənilmiş məbləğ" value={`${totalAmount.toFixed(2)} AZN`} sub="Cəmi"        />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-3 mb-4">
                <StatusFilter tabs={TABS} value={filter} onChange={setFilter} />
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-5">
                {filtered.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Bu kateqoriyada sifariş yoxdur</div>
                ) : filtered.map(item => (
                  <OrderCard key={item.id || item._id} item={item} lang={lang} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
