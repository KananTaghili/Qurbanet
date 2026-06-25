'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, BookOpen, ClipboardList, Beef } from 'lucide-react';

const BRAND = '#1c5e20';
const MUTED  = '#9ca3af';
const BG     = '#f0f4f0';

const TABS = [
  { href: '/qurban',       label: 'Heyvan Seçimi', Icon: Beef,          key: 'home'   },
  { href: '/my-orders',    label: 'Sifarişlərim',  Icon: ClipboardList, key: 'orders' },
  { href: '/how-it-works', label: 'Necə İşləyir?', Icon: HelpCircle,    key: 'how'    },
  { href: '/qurban-rules', label: 'Qaydalar',       Icon: BookOpen,      key: 'rules'  },
];

const CSS = `
  .epn-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px 10px;
    background: #fff;
  }
  .epn-tab {
    display: inline-flex;
    align-items: center;
    gap: 0px;
    height: 40px;
    border-radius: 999px;
    padding: 0 11px;
    text-decoration: none;
    overflow: hidden;
    transition:
      background 0.3s ease,
      padding 0.3s ease,
      box-shadow 0.3s ease;
    flex-shrink: 0;
  }
  .epn-tab.epn-on {
    background: #1c5e20;
    padding: 0 16px;
    box-shadow: 0 4px 14px rgba(27,94,32,0.30);
    gap: 7px;
  }
  .epn-lbl {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transition:
      max-width 0.32s ease,
      opacity 0.22s ease;
  }
  .epn-tab.epn-on .epn-lbl {
    max-width: 120px;
    opacity: 1;
  }
`;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav-wrap mobile-only">
      <style>{CSS}</style>
      <div className="epn-bar">
        {TABS.map(({ href, label, Icon, key }) => {
          const active = href === '/qurban'
            ? (pathname === '/qurban' || pathname === '/qurban/')
            : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link key={key} href={href} className={`epn-tab${active ? ' epn-on' : ''}`}
              style={{ background: active ? BRAND : BG }}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8}
                color={active ? '#fff' : MUTED} style={{ flexShrink: 0 }} />
              <span className="epn-lbl">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
