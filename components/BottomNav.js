'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, BookOpen, ClipboardList, Beef } from 'lucide-react';

const BRAND = '#1c5e20';
const MUTED  = '#a1a1aa';

const TABS = [
  { href: '/qurban',       label: 'Əsas',           Icon: Beef,          key: 'home'   },
  { href: '/my-orders',    label: 'Sifarişlərim',  Icon: ClipboardList, key: 'orders' },
  { href: '/how-it-works', label: 'Necə İşləyir?', Icon: HelpCircle,    key: 'how'    },
  { href: '/qurban-rules', label: 'Əhkamlar',        Icon: BookOpen,      key: 'rules'  },
];

const CSS = `
  .bnv-bar {
    display: flex;
    width: 100%;
    padding: 6px 4px 8px;
    background: #fff;
    border-top: 1px solid #f0f0f0;
  }
  .bnv-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px 2px 2px;
    text-decoration: none;
    min-width: 0;
  }
  .bnv-icon {
    width: 42px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }
  .bnv-tab.bnv-on .bnv-icon {
    background: #e8f5e9;
  }
  .bnv-lbl {
    font-size: 10px;
    font-weight: 500;
    color: ${MUTED};
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    transition: color 0.2s ease, font-weight 0.2s ease;
  }
  .bnv-tab.bnv-on .bnv-lbl {
    color: ${BRAND};
    font-weight: 700;
  }
`;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav-wrap mobile-only">
      <style>{CSS}</style>
      <div className="bnv-bar">
        {TABS.map(({ href, label, Icon, key }) => {
          const active = href === '/qurban'
            ? (pathname === '/qurban' || pathname === '/qurban/')
            : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link key={key} href={href} className={`bnv-tab${active ? ' bnv-on' : ''}`}>
              <div className="bnv-icon">
                <Icon size={19} strokeWidth={active ? 2.4 : 1.7}
                  color={active ? BRAND : MUTED} />
              </div>
              <span className="bnv-lbl">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
