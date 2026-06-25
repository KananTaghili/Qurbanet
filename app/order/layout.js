'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { MobileMenuProvider, useMobileMenu } from '../../context/MobileMenuContext';
import { X, Beef, ClipboardList, HelpCircle, BookOpen, LogOut } from 'lucide-react';

const GREEN = '#1c5e20';

const NAV = [
  { icon: Beef,          label: 'Heyvan Seçimi', href: '/qurban' },
  { icon: ClipboardList, label: 'Sifarişlərim',  href: '/my-orders' },
  { icon: HelpCircle,    label: 'Necə işləyir',  href: '/how-it-works' },
  { icon: BookOpen,      label: 'Qaydalar',       href: '/qurban-rules' },
];

function fullName(u) { return [u?.name, u?.lastName].filter(Boolean).join(' '); }
function initials(u) { return (fullName(u) || '?').split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join(''); }

function Drawer() {
  const { open, closeMenu } = useMobileMenu();
  const { user, isGuest, logout } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMenu}
      />
      {/* Panel */}
      <div
        className={`lg:hidden fixed top-0 left-0 z-[70] h-full w-[72%] max-w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: GREEN }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <Image src="/mb_logo_bottom_slogan.png" alt="MeatBox" width={130} height={70}
            style={{ height: 'auto', objectFit: 'contain' }} />
          <button onClick={closeMenu}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = href === '/qurban' ? pathname === '/qurban' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={closeMenu}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                  active ? 'bg-white/15 text-white font-semibold' : 'text-green-100/70 hover:bg-white/10 hover:text-white'
                }`}>
                <Icon size={16} className={active ? 'text-white' : 'text-green-200/60'} />
                {label}
              </Link>
            );
          })}
        </nav>
        {!isGuest && (
          <div className="px-4 pb-6 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-1 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                {initials(user)}
              </div>
              <span className="text-[13px] font-semibold text-white/90 truncate">{fullName(user)}</span>
            </div>
            <button onClick={() => { closeMenu(); logout(); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <LogOut size={14} /> Çıxış
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function OrderLayout({ children }) {
  return (
    <MobileMenuProvider>
      <Drawer />
      {children}
    </MobileMenuProvider>
  );
}
