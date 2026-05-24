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
    if (trimmedName.length < 2) {
      setError('Ad ən az 2 simvol olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        name: trimmedName,
        lastName: lastName.trim() || undefined,
      });
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
    <div className="flex-1 flex flex-col bg-primary">
      <div className="flex-1 flex flex-col justify-center items-center px-5 gap-8 py-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white/20">
            <Image src="/logo.png" alt="QurbanEt" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="text-3xl font-black text-white italic">
            Qurban<span className="text-green-300">Et</span>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-card-lg w-full max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-1">Adınızı daxil edin</h2>
          <p className="text-sm text-text-secondary mb-5">Sifarişlər üçün adınız istifadə ediləcək.</p>

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
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Yadda saxlanır...
                </span>
              ) : 'Davam et'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
