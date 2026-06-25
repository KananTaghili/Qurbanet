'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Video, Heart, ArrowRight, X, HelpCircle, BookOpen, Beef, LogOut } from 'lucide-react';
import BackHeader from '../../components/BackHeader';
import StatusBadge from '../../components/StatusBadge';
import BottomNav from '../../components/BottomNav';
import api from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../lib/i18n';

const GREEN = '#1c5e20';
const DRAWER_NAV = [
  { icon: Beef,          label: 'Heyvan Seçimi',  href: '/qurban' },
  { icon: ClipboardList, label: 'Sifarişlərim',   href: '/my-orders' },
  { icon: HelpCircle,    label: 'Necə işləyir?',  href: '/how-it-works' },
  { icon: BookOpen,      label: 'Qaydalar',        href: '/qurban-rules' },
];

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

const STATUS_COLOR = {
  awaiting_payment: '#9CA3AF',
  placed:          '#F59E0B',
  pending_payment: '#F59E0B',
  confirmed:       '#3B82F6',
  paid:            '#3B82F6',
  slaughtering:    '#EF4444',
  preparing:       '#10B981',
  delivering:      '#3B82F6',
  completed:       '#22C55E',
  cancelled:       '#9CA3AF',
};

const CHARITY_DIST_KEYS = {
  usaqlar_evi:       'distLabel_usaqlar_evi',
  qocalar_evi:       'distLabel_qocalar_evi',
  ehtiyac_sahibleri: 'distLabel_ehtiyac_sahibleri',
};

function OrderCard({ item, lang }) {
  const months = t(lang, 'months_short');
  const itemId     = item.id || item._id;
  const isCharity  = item._type === 'charity';
  const href       = isCharity ? `/charity-order/${itemId}` : `/my-orders/${itemId}`;
  const status     = item.status || 'placed';
  const accentColor = STATUS_COLOR[status] || '#9CA3AF';

  const charityKey = CHARITY_DIST_KEYS[item.charityTarget];
  const title      = isCharity
    ? (charityKey ? t(lang, charityKey) : t(lang, 'charityLabel'))
    : (item.animal?.nameAz || item.animalNameAz || 'Heyvan');
  const orderNum  = item.orderNumber || String(itemId).slice(-6).toUpperCase();
  const qty       = item.quantity || item.sharedPortion || 1;

  return (
    <Link href={href} className="no-underline block group">
      <div
        className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden transition-all duration-150 group-hover:shadow-md group-hover:-translate-y-0.5"
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      >

        {/* Top row: image + title + status */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div
            className="w-16 h-16 rounded-xl overflow-hidden bg-primary-surface flex-shrink-0 flex items-center justify-center"
            style={{ outline: `2px solid ${accentColor}`, outlineOffset: 2 }}
          >
            {isCharity ? (
              <Heart size={28} className="text-primary" />
            ) : (
              <img
                src={item.animal?.imageUrl || ANIMAL_IMAGES[item.animalType] || '/qoyun.jpg'}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-text-primary truncate">{title}</p>
            <p className="text-xs text-text-secondary mt-0.5 font-mono">{orderNum}</p>
          </div>
          <div className="flex-shrink-0">
            {isCharity
              ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-surface text-primary border border-primary/20">
                  <Heart size={10} /> {t(lang, 'charityLabel')}
                </span>
              : <StatusBadge status={status} />
            }
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-border/60" />

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-border/60 px-0 py-3">
          <div className="flex flex-col items-center gap-0.5 px-3">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">{t(lang, 'qtyLabel')}</span>
            <span className="text-sm font-extrabold text-text-primary">{qty} {t(lang, 'animalUnit')}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">{t(lang, 'amountLabel')}</span>
            <span className="text-sm font-extrabold text-primary">{item.totalPrice ?? item.totalAmount ?? '—'} AZN</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">{t(lang, 'dateLabel')}</span>
            <span className="text-[11px] font-bold text-text-primary text-center leading-tight">{fmtDate(item.createdAt, months)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-3">
          {item.mediaFiles?.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-semibold">
              <Video size={12} /> {t(lang, 'videoAvailable')}
            </span>
          ) : <span />}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
            {t(lang, 'viewDetail')} <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const [orders,        setOrders]        = useState([]);
  const [charityOrders, setCharityOrders] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const { logout } = useAuth();

  // true only for explicit guests (isGuest flag), NOT for real users without a name
  const isActualGuest = !authLoading && (!token || user?.isGuest === true);

  useEffect(() => {
    if (authLoading) return;
    if (isActualGuest) {
      router.replace('/auth/login');
      return;
    }
    fetchAll();
  }, [authLoading, token, user?.isGuest]);

  // iOS Safari BFCache: pageshow fires with persisted=true when restored from cache.
  // React effects don't re-run in that case, so orders would stay frozen from the
  // previous visit. Force a fresh fetch whenever the page is restored this way.
  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted && !isActualGuest) fetchAll();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isActualGuest) fetchAll();
    };
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActualGuest]);

  useSocket({
    'order:updated':         () => { if (!isActualGuest) fetchAll(); },
    'charity_order:updated': () => { if (!isActualGuest) fetchAll(); },
  });

  const fetchAll = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [ordRes, charRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/charity-orders'),
      ]);
      // If auth failed (expired token), redirect to login
      if (ordRes.status === 'rejected' && ordRes.reason?.response?.status === 401) {
        router.replace('/auth/login');
        return;
      }
      if (ordRes.status === 'rejected' && !ordRes.reason?.response) {
        // Network/timeout error — show retry UI instead of false "no orders"
        setFetchError(true);
        return;
      }
      if (ordRes.status  === 'fulfilled') setOrders(ordRes.value.data.data?.orders || []);
      // Charity orders endpoint returns the array directly in data (not wrapped in {orders:[...]})
      if (charRes.status === 'fulfilled') {
        const charData = charRes.value.data.data;
        setCharityOrders(Array.isArray(charData) ? charData : (charData?.orders || []));
      }
    } catch { setFetchError(true); } finally { setLoading(false); }
  };

  const allItems = [
    ...orders.map((o)        => ({ ...o, _type: 'order' })),
    ...charityOrders.map((o) => ({ ...o, _type: 'charity' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="flex flex-col flex-1">
      <BackHeader title={t(lang, 'ordersTitle')} onMenu={() => setMenuOpen(true)} />

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 mobile-only" onClick={() => setMenuOpen(false)} />
      )}
      {/* Mobile drawer panel */}
      <div className={`fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out mobile-only ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: GREEN }}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <span className="text-white font-bold text-[15px]">Menyu</span>
          <button onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {DRAWER_NAV.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                router && typeof window !== 'undefined' && window.location.pathname === href
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-green-100/70 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="px-4 pb-6 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-1 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                {([user?.name, user?.lastName].filter(Boolean).join(' ') || '?').split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('')}
              </div>
              <span className="text-[13px] font-semibold text-white/90 truncate">
                {[user?.name, user?.lastName].filter(Boolean).join(' ')}
              </span>
            </div>
            <button onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <LogOut size={14} /> Çıxış
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 page-scroll">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center py-24 px-8 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <ClipboardList size={36} className="text-red-400" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-text-primary">{t(lang, 'errorLoadingOrders') || 'Sifarişlər yüklənmədi'}</p>
              <p className="text-sm text-text-secondary mt-1">{t(lang, 'checkConnection') || 'İnternet bağlantınızı yoxlayın və yenidən cəhd edin.'}</p>
            </div>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md mt-1"
            >
              {t(lang, 'retry') || 'Yenidən cəhd et'}
            </button>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center py-24 px-8 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-surface flex items-center justify-center">
              <ClipboardList size={36} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-text-primary">{t(lang, 'noOrders')}</p>
              <p className="text-sm text-text-secondary mt-1">{t(lang, 'noOrdersDesc')}</p>
            </div>
            <Link
              href="/"
              className="no-underline inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md mt-1"
            >
              {t(lang, 'placeOrder')}
            </Link>
          </div>
        ) : (
          <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {allItems.map((item) => (
                <OrderCard key={item.id || item._id} item={item} lang={lang} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
