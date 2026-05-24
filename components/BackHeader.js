'use client';
import { useRouter } from 'next/navigation';

export default function BackHeader({ title, onBack }) {
  const router    = useRouter();
  const handleBack = onBack || (() => router.back());

  return (
    <div className="mobile-back-header mobile-only">
      <button
        onClick={handleBack}
        className="w-9 h-9 rounded-xl bg-primary-surface flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 transition-colors hover:bg-green-100"
      >
        ‹
      </button>
      <h1 className="text-[15px] font-bold text-text-primary flex-1 truncate">
        {title}
      </h1>
    </div>
  );
}
