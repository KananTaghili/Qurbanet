'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, HandHeart, BookOpen, ClipboardList, Beef } from 'lucide-react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

const BRAND = '#1c5e20';
const MUTED = '#94a3b8';

const ALL_TABS = [
  { href: '/how-it-works', labelKey: 'howItWorks',      Icon: HelpCircle,    key: 'how' },
  { href: '/need-support',  labelKey: 'charity',          Icon: HandHeart,     key: 'charity' },
  { href: '/qurban',        labelKey: 'animalSelection',  Icon: Beef,          key: 'home' },
  { href: '/qurban-rules',  labelKey: 'rules',            Icon: BookOpen,      key: 'rules' },
  { href: '/my-orders',     labelKey: 'myOrders',         Icon: ClipboardList, key: 'orders' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [charityEnabled, setCharityEnabled] = useState(null);

  useEffect(() => {
    api.get('/app-config/settings')
      .then(res => {
        setCharityEnabled(res.data?.data?.charityPageEnabled !== false);
      })
      .catch(() => setCharityEnabled(true));
  }, []);

  const visibleTabs = charityEnabled === null
    ? ALL_TABS
    : ALL_TABS.filter(({ key }) => key !== 'charity' || charityEnabled === true);

  return (
    <nav className="bottom-nav-wrap mobile-only">
      <div style={{ display: 'flex', width: '100%' }}>
        {visibleTabs.map(({ href, labelKey, Icon, key }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
          const color = active ? BRAND : MUTED;

          return (
            <Link
              key={key}
              href={href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 2px 4px', textDecoration: 'none', minWidth: 0 }}
            >
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
                {t(lang, labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
