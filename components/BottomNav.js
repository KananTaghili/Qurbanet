'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, HandHeart, BookOpen, ClipboardList, PawPrint } from 'lucide-react';
import api from '../lib/api';

const BRAND = '#1c5e20';
const MUTED = '#94a3b8';

const ALL_TABS = [
  { href: '/how-it-works', label: 'Necə İşləyirik', Icon: HelpCircle,    key: 'how' },
  { href: '/need-support',  label: 'Xeyriyyə',       Icon: HandHeart,     key: 'charity' },
  { href: '/',              label: 'Heyvan Seçimi',  Icon: PawPrint,      key: 'home' },
  { href: '/qurban-rules',  label: 'Əhkamlar',       Icon: BookOpen,      key: 'rules' },
  { href: '/my-orders',     label: 'Sifarişlərim',   Icon: ClipboardList, key: 'orders' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [charityEnabled, setCharityEnabled] = useState(null);

  useEffect(() => {
    api.get('/app-config/settings')
      .then(res => {
        setCharityEnabled(res.data?.data?.charityPageEnabled !== false);
      })
      .catch(() => setCharityEnabled(true));
  }, []);

  return (
    <nav className="bottom-nav-wrap mobile-only">
      <div style={{ display: 'flex', width: '100%' }}>
        {ALL_TABS.map(({ href, label, Icon, key }) => {
          const disabled = key === 'charity' && charityEnabled !== true;
          const active = !disabled && (pathname === href || (href !== '/' && pathname.startsWith(href + '/')));
          const color = disabled ? '#d1d5db' : active ? BRAND : MUTED;

          const inner = (
            <>
              <div style={{
                width: 44,
                height: 32,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? 'var(--primary-surface)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.7} color={color} />
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.25,
                color,
                width: '100%',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {label}
              </span>
            </>
          );

          if (disabled) {
            return (
              <div
                key={key}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 2px 4px', minWidth: 0, cursor: 'not-allowed', opacity: 0.45 }}
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 2px 4px', textDecoration: 'none', minWidth: 0 }}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
