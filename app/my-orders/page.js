'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList, Video, Heart, ArrowRight,
  CheckCircle2, Truck, Scissors, XCircle,
  Clock, CreditCard, RefreshCw, ChevronDown,
  ShoppingBag, Wallet, Activity,
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
  awaiting_payment: { label: 'Ödəniş gözlənilir', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', step: 0 },
  placed:           { label: 'Gözləmədə',         bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', step: 1 },
  pending_payment:  { label: 'Ödəniş gözlənilir', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', step: 0 },
  confirmed:        { label: 'Təsdiqləndi',        bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', step: 2 },
  paid:             { label: 'Ödənilib',           bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', step: 2 },
  slaughtering:     { label: 'Kəsilir',            bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', step: 3 },
  preparing:        { label: 'Hazırlanır',         bg: '#D1FAE5', color: '#065F46', dot: '#10B981', step: 4 },
  delivering:       { label: 'Çatdırılır',         bg: '#DBEAFE', color: '#1E3A8A', dot: '#2563EB', step: 5 },
  completed:        { label: 'Tamamlandı',         bg: '#D1FAE5', color: '#14532D', dot: '#22C55E', step: 6 },
  cancelled:        { label: 'Ləğv edildi',        bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', step: -1 },
};

const PIPELINE_STEPS = ['Gözləmə', 'Təsdiq', 'Kəsim', 'Hazırlıq', 'Çatdırılma', 'Tamamlandı'];

const CHARITY_DIST_KEYS = {
  usaqlar_evi:       'distLabel_usaqlar_evi',
  qocalar_evi:       'distLabel_qocalar_evi',
  ehtiyac_sahibleri: 'distLabel_ehtiyac_sahibleri',
};

/* ── Status Badge ─────────────────────────────── */
function Badge({ status }) {
  const c = STATUS_CFG[status] || { label: status, bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: c.bg, color: c.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

/* ── Progress Pipeline ────────────────────────── */
function Pipeline({ step }) {
  if (step < 0) return (
    <div className="flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', flexShrink: 0 }} />
      <span className="text-[10px] text-gray-400 font-medium">Ləğv edildi</span>
    </div>
  );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        {PIPELINE_STEPS.map((_, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className="h-1.5 flex-1 rounded-full" style={{
              background: i <= step ? BRAND : '#e5e7eb',
              transition: 'background 0.3s'
            }} />
            {i < PIPELINE_STEPS.length - 1 && <div style={{ width: 2 }} />}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {PIPELINE_STEPS.map((label, i) => (
          <span key={i} className="text-[8px] font-medium flex-1 text-center" style={{
            color: i <= step ? BRAND : '#9ca3af',
          }}>{label}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Order Card ───────────────────────────────── */
function OrderCard({ item, lang }) {
  const months   = t(lang, 'months_short');
  const itemId   = item.id || item._id;
  const isCharity = item._type === 'charity';
  const href     = isCharity ? `/charity-order/${itemId}` : `/my-orders/${itemId}`;
  const status   = item.status || 'placed';
  const cfg      = STATUS_CFG[status] || STATUS_CFG.placed;

  const charityKey = CHARITY_DIST_KEYS[item.charityTarget];
  const title    = isCharity
    ? (charityKey ? t(lang, charityKey) : t(lang, 'charityLabel'))
    : (item.animal?.nameAz || item.animalNameAz || 'Heyvan');
  const orderNum = item.orderNumber || `QRB-${new Date(item.createdAt).getFullYear()}-${String(itemId).slice(-5).toUpperCase()}`;
  const qty      = item.quantity || item.sharedPortion || 1;
  const amount   = item.totalPrice ?? item.totalAmount ?? null;
  const imgSrc   = isCharity ? null : (item.animal?.imageUrl || ANIMAL_IMAGES[item.animalType] || '/qoyun.jpg');

  return (
    <Link href={href} className="no-underline block group">
      <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl flex"
        style={{ boxShadow: '0 4px 18px rgba(28,94,32,0.09)', border: '1.5px solid #e8f0e8' }}>

        {/* Left image */}
        <div className="relative shrink-0 w-[140px] md:w-[160px] overflow-hidden" style={{ background: '#f0f7f0' }}>
          {isCharity ? (
            <div className="w-full h-full flex items-center justify-center">
              <Heart size={40} style={{ color: BRAND, opacity: 0.25 }} />
            </div>
          ) : (
            <img src={imgSrc} alt={title}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }} />
          )}
          {/* Order number tag */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}>
            <p className="font-mono text-[9px] font-bold text-white/90 truncate">{orderNum}</p>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-between gap-2">
          {/* Top: title + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-extrabold text-[#071b0d] leading-tight truncate">{title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(item.createdAt, months)}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <Badge status={status} />
              {item.mediaFiles?.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded-lg">
                  <Video size={9} /> Video
                </span>
              )}
            </div>
          </div>

          {/* Middle: stats chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-lg px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: '#f0f7f0' }}>
              <ShoppingBag size={11} color={BRAND} strokeWidth={2} />
              <span className="text-[11px] font-bold text-[#071b0d]">{qty} {t(lang, 'animalUnit')}</span>
            </div>
            {amount != null && (
              <div className="rounded-lg px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: '#f0f7f0' }}>
                <Wallet size={11} color={BRAND} strokeWidth={2} />
                <span className="text-[11px] font-extrabold" style={{ color: BRAND }}>{amount} AZN</span>
              </div>
            )}
          </div>

          {/* Bottom: pipeline + CTA */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              {!isCharity && <Pipeline step={cfg.step} />}
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all group-hover:gap-1.5"
              style={{ color: BRAND, background: '#e8f5e9' }}>
              {t(lang, 'viewDetail')} <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Stat Card ────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3.5"
      style={{ boxShadow: '0 2px 12px rgba(28,94,32,0.08)', border: '1.5px solid #e8f0e8' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: '#e8f5e9' }}>
        <Icon size={20} color={BRAND} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 leading-none mb-1">{label}</p>
        <p className="text-xl font-extrabold text-[#071b0d] leading-none">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────── */
export default function MyOrdersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const [orders,        setOrders]        = useState([]);
  const [charityOrders, setCharityOrders] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(false);
  const [filter,        setFilter]        = useState('all');

  const isActualGuest = !authLoading && (!token || user?.isGuest === true);

  useEffect(() => {
    if (authLoading) return;
    if (isActualGuest) { router.replace('/auth/login'); return; }
    fetchAll();
  }, [authLoading, token, user?.isGuest]);

  useEffect(() => {
    const onPageShow = (e) => { if (e.persisted && !isActualGuest) fetchAll(); };
    const onVisible  = () => { if (document.visibilityState === 'visible' && !isActualGuest) fetchAll(); };
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

  const fetchAll = async () => {
    setLoading(true); setFetchError(false);
    try {
      const [ordRes, charRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/charity-orders'),
      ]);
      if (ordRes.status === 'rejected' && ordRes.reason?.response?.status === 401) {
        router.replace('/auth/login'); return;
      }
      if (ordRes.status === 'rejected' && !ordRes.reason?.response) {
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
    ...orders.map((o)        => ({ ...o, _type: 'order' })),
    ...charityOrders.map((o) => ({ ...o, _type: 'charity' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const activeCount  = allItems.filter(o => !['completed','cancelled'].includes(o.status)).length;
  const totalAmount  = allItems.reduce((s, o) => s + (Number(o.totalPrice ?? o.totalAmount) || 0), 0);

  const filtered = filter === 'orders'  ? allItems.filter(o => o._type === 'order')
                 : filter === 'charity' ? allItems.filter(o => o._type === 'charity')
                 : allItems;

  const TABS = [
    { key: 'all',     label: 'Hamısı',          count: allItems.length },
    { key: 'orders',  label: 'Qurbanlıq',       count: orders.length },
    { key: 'charity', label: 'Kollektiv Qurban', count: charityOrders.length },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto" style={{ marginBottom: 0 }}>
        <div className="px-5 md:px-7 pt-5 pb-6 max-w-5xl mx-auto w-full">

          {/* Page title */}
          <div className="mb-4">
            <h1 className="text-xl font-extrabold text-[#071b0d]">{t(lang, 'ordersTitle')}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Bütün sifariş və iştirakınızı buradan izləyin</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#e8f5e9', borderTopColor: BRAND }} />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center py-24 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                <ClipboardList size={32} style={{ color: '#EF4444' }} />
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
                <ClipboardList size={32} style={{ color: BRAND }} />
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
              <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCard icon={ClipboardList} label="Ümumi sifariş" value={allItems.length} sub="Bugünə kimi" />
                <StatCard icon={Activity}      label="Aktiv sifariş"  value={activeCount}     sub="Davam edir" />
                <StatCard icon={Wallet}        label="Ödənilmiş məbləğ" value={`${totalAmount.toFixed(2)} AZN`} sub="Cəmi" />
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 mb-4">
                {TABS.map(tab => (
                  <button key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all"
                    style={filter === tab.key
                      ? { background: BRAND, color: '#fff' }
                      : { background: '#f0f7f0', color: '#4b7a4f' }}>
                    {tab.label}
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg"
                      style={filter === tab.key ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: '#d1fae5', color: BRAND }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Order list */}
              <div className="flex flex-col gap-3">
                {filtered.map(item => (
                  <OrderCard key={item.id || item._id} item={item} lang={lang} />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm font-medium">Bu kateqoriyada sifariş yoxdur</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
