'use client';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

export default function BackHeader({ title, onBack, onMenu }) {
  const router = useRouter();
  const handleBack = onBack || (() => router.back());

  return (
    <div className="mobile-back-header">
      {onMenu && (
        <button
          onClick={onMenu}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
        >
          <Menu size={18} />
        </button>
      )}
      <button
        onClick={handleBack}
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 transition-colors"
        style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
      >
        ‹
      </button>
      <h1 className="text-[15px] font-bold flex-1 truncate" style={{ color: 'white' }}>
        {title}
      </h1>
    </div>
  );
}
