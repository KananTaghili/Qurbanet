'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error('Order flow error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-6 text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl">⚠️</div>
      <div>
        <h2 className="text-xl font-extrabold text-text-primary mb-2">Bir xəta baş verdi</h2>
        <p className="text-sm text-text-secondary">Səhifəni yeniləmək üçün aşağıdakı düymələrdən birinə basın.</p>
      </div>
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <button
          onClick={reset}
          className="btn-primary"
        >
          Yenidən cəhd et
        </button>
        <button
          onClick={() => router.replace('/')}
          className="w-full py-3 text-primary font-bold text-sm border-2 border-primary rounded-2xl bg-transparent cursor-pointer"
        >
          Ana səhifəyə qayıt
        </button>
      </div>
    </div>
  );
}
