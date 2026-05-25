'use client';
import { useRouter } from 'next/navigation';

export default function BackHeader({ title, onBack }) {
  const router    = useRouter();
  const handleBack = onBack || (() => router.back());

  return (
    <div className="mobile-back-header mobile-only" style={{position:'fixed',top:0,left:0,right:0,zIndex:50,background:'var(--primary)',borderBottom:'none'}}>
      <button
        onClick={handleBack}
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 transition-colors"
        style={{background:'rgba(255,255,255,0.15)',color:'white'}}
      >
        ‹
      </button>
      <h1 className="text-[15px] font-bold flex-1 truncate" style={{color:'white'}}>
        {title}
      </h1>
    </div>
  );
}
