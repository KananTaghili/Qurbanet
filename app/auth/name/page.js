'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

export default function NamePage() {
  const router = useRouter();
  const { login, token, user } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedLastName = lastName.trim();
    if (trimmedName.length < 2) { setError('Ad ən az 2 simvol olmalıdır.'); return; }

    setLoading(true);
    try {
      const body = { name: trimmedName };
      if (trimmedLastName) body.lastName = trimmedLastName;
      const res = await api.put('/auth/profile', body);
      const freshToken = res.data.data?.token || token;
      const updatedUser = res.data.data?.user || { ...user, name: trimmedName };
      login(freshToken, updatedUser);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Brand panel ── */}
        <div
          className="relative flex flex-col items-center justify-center py-10 px-8 lg:py-0 lg:w-[44%]"
          style={{ background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)' }}
        >
          <div className="flex flex-col items-center gap-5 text-center animate-fade-up">
            <div
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)' }}
            >
              <Image src="/logo.png" alt="QurbanEt" width={128} height={128} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="text-4xl lg:text-5xl font-black text-white italic leading-none">
                Qurban<span style={{ color: '#86efac' }}>Et</span>
              </div>
              <div
                className="text-sm lg:text-base mt-3 leading-relaxed max-w-[220px] mx-auto"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Qeydiyyat tamamlandı!
              </div>
            </div>

            <div className="text-[10px] font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              TAZE ƏT · QURBANLIQ · XEYRİYYƏ
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-surface">
          <div className="w-full max-w-sm animate-fade-up">
            <h2 className="text-2xl font-black text-text-primary mb-1">Adınızı daxil edin</h2>
            <p className="text-sm text-text-secondary mb-6">Sifarişlər üçün adınız istifadə ediləcək.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 block">Ad *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Məsələn: Əli"
                  className="field-input"
                  autoFocus
                  autoCapitalize="words"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 block">Soyad</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setError(''); }}
                  placeholder="Məsələn: Hüseynov"
                  className="field-input"
                  autoCapitalize="words"
                  maxLength={60}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Yadda saxlanır...
                  </span>
                ) : 'Davam et →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
