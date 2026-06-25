'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, BookOpen, ClipboardList, Beef } from 'lucide-react';

const BRAND = '#1c5e20';
const MUTED = '#9ca3af';

const TABS = [
  { href: '/qurban',       lines: ['Heyvan', 'Seçimi'],   Icon: Beef,          key: 'home'   },
  { href: '/my-orders',    lines: ['Sifarişlərim'],        Icon: ClipboardList, key: 'orders' },
  { href: '/how-it-works', lines: ['Necə', 'İşləyir?'],   Icon: HelpCircle,    key: 'how'    },
  { href: '/qurban-rules', lines: ['Qaydalar'],            Icon: BookOpen,      key: 'rules'  },
];

const CSS = `
  .qn-bar { display:flex; width:100%; padding:0 6px; }
  .qn-tab {
    flex:1; display:flex; flex-direction:column; align-items:center;
    padding:7px 2px 8px; text-decoration:none; min-width:0;
    transition: transform 0.28s cubic-bezier(.34,1.56,.64,1);
  }
  .qn-tab.qn-on { transform: translateY(-7px); }
  .qn-pill {
    width:52px; height:30px; border-radius:15px;
    display:flex; align-items:center; justify-content:center;
    transition: background 0.22s ease, box-shadow 0.22s ease;
  }
  .qn-on .qn-pill {
    background: #1c5e20;
    box-shadow: 0 3px 10px rgba(27,94,32,0.28);
  }
  .qn-label {
    font-size:10px; font-weight:600; text-align:center;
    line-height:1.35; margin-top:4px; min-height:26px;
    display:flex; flex-direction:column; align-items:center;
    transition: color 0.18s ease;
  }
  .qn-on .qn-label { font-weight:700; }
`;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav-wrap mobile-only">
      <style>{CSS}</style>
      <div className="qn-bar">
        {TABS.map(({ href, lines, Icon, key }) => {
          const active = href === '/qurban'
            ? (pathname === '/qurban' || pathname === '/qurban/')
            : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link key={key} href={href} className={`qn-tab${active ? ' qn-on' : ''}`}>
              <div className="qn-pill">
                <Icon size={19} strokeWidth={active ? 2.5 : 1.7} color={active ? '#fff' : MUTED} />
              </div>
              <span className="qn-label" style={{ color: active ? BRAND : MUTED }}>
                {lines.map((ln, i) => (
                  <span key={i}>{ln}</span>
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
