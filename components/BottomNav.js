'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, BookOpen, ClipboardList, Beef } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

const BRAND = '#1c5e20';
const MUTED = '#9ca3af';

const TABS = [
  { href: '/qurban',       labelKey: 'animalSelection', Icon: Beef,          key: 'home' },
  { href: '/my-orders',    labelKey: 'myOrders',        Icon: ClipboardList, key: 'orders' },
  { href: '/how-it-works', labelKey: 'howItWorks',      Icon: HelpCircle,    key: 'how' },
  { href: '/qurban-rules', labelKey: 'rules',           Icon: BookOpen,      key: 'rules' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  return (
    <nav className="bottom-nav-wrap mobile-only">
      <style>{`
        .qbn-bar { display:flex; width:100%; padding: 0 4px; }
        .qbn-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 8px 2px 6px;
          text-decoration: none;
          min-width: 0;
          position: relative;
          transition: transform 0.25s cubic-bezier(.34,1.4,.64,1);
        }
        .qbn-tab.qbn-active { transform: translateY(-5px); }
        .qbn-pill {
          width: 44px; height: 30px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }
        .qbn-active .qbn-pill {
          background: #e8f5e9;
          box-shadow: 0 2px 8px rgba(27,94,32,0.13);
        }
        .qbn-label {
          font-size: 9.5px;
          font-weight: 600;
          text-align: center;
          line-height: 1.3;
          margin-top: 3px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          width: 100%;
          max-width: 64px;
          transition: color 0.18s ease;
        }
        .qbn-dot {
          margin-top: 3px;
          height: 3px;
          border-radius: 99px;
          background: transparent;
          transition: width 0.25s cubic-bezier(.34,1.3,.64,1), background 0.18s ease;
          width: 0px;
        }
        .qbn-active .qbn-dot {
          background: ${BRAND};
          width: 18px;
        }
      `}</style>

      <div className="qbn-bar">
        {TABS.map(({ href, labelKey, Icon, key }) => {
          const active = href === '/qurban'
            ? (pathname === '/qurban' || pathname === '/qurban/')
            : pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

          return (
            <Link key={key} href={href} className={`qbn-tab${active ? ' qbn-active' : ''}`}>
              <div className="qbn-pill">
                <Icon size={20} strokeWidth={active ? 2.3 : 1.7} color={active ? BRAND : MUTED} />
              </div>
              <span className="qbn-label" style={{ color: active ? BRAND : MUTED }}>
                {t(lang, labelKey)}
              </span>
              <div className="qbn-dot" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
