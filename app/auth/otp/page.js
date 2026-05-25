'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

export default function OtpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [code, setCode] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('phone');
  const inputs = useRef([]);
  const passwordRef = useRef(null);

  useEffect(() => {
    const id = sessionStorage.getItem('otp_identifier') || sessionStorage.getItem('otp_phone');
    const idType = sessionStorage.getItem('otp_identifier_type') || 'phone';
    if (!id) { router.replace('/auth/login'); return; }
    setIdentifier(id);
    setIdentifierType(idType);
  }, [router]);

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError('');
    if (digit && i < 3) {
      inputs.current[i + 1]?.focus();
    } else if (digit && i === 3) {
      passwordRef.current?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(''));
      passwordRef.current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const otp = code.join('');
    if (otp.length < 4) { setError('4 rəqəmli kodu daxil edin.'); return; }
    if (!password || password.length < 6) { setError('Şifrə ən az 6 simvol olmalıdır.'); return; }
    if (loading) return;

    setLoading(true);
    try {
      const payload = identifierType === 'email'
        ? { email: identifier, code: otp, password }
        : { phone: identifier, code: otp, password };
      const res = await api.post('/auth/verify-otp', payload);
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        sessionStorage.removeItem('otp_identifier');
        sessionStorage.removeItem('otp_identifier_type');
        sessionStorage.removeItem('otp_phone');
        if (!user.name) router.push('/auth/name');
        else router.push('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Yanlış kod. Yenidən cəhd edin.');
      setCode(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const subtitle = identifierType === 'email'
    ? `ünvanına göndərilən 4 rəqəmli kodu daxil edin.`
    : `nömrəsinə göndərilən 4 rəqəmli kodu daxil edin.`;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Brand panel ── */}
        <div
          className="relative flex flex-col items-center justify-center py-10 px-8 lg:py-0 lg:w-[44%]"
          style={{ background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)' }}
        >
          {/* Back button — mobile only */}
          <button
            type="button"
            onClick={() => router.push('/auth/register')}
            className="lg:hidden absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-2xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            aria-label="Geri qayıt"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

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
                İlahi qurbanınızı etibarla kəsdirin
              </div>
            </div>

            <div
              className="flex items-center gap-3 text-[10px] font-bold tracking-widest"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <span>ETİBARLI</span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }} />
              <span>HALAL</span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }} />
              <span>SÜRƏTLİ</span>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-surface">
          <div className="w-full max-w-sm animate-fade-up">
            <h2 className="text-2xl font-black text-text-primary mb-1">Kodu daxil edin</h2>
            <p className="text-sm text-text-secondary mb-6 leading-5">
              <strong>{identifier}</strong>{' '}{subtitle}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* 4-digit code boxes */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handlePaste}>
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    style={{
                      width: 64, height: 72, textAlign: 'center', fontSize: 28, fontWeight: 700,
                      border: `2px solid ${d ? '#1B5E20' : '#E0E0E0'}`,
                      borderRadius: 16, outline: 'none',
                      background: d ? '#E8F5E9' : '#F8F9FA',
                      color: d ? '#1B5E20' : '#111827',
                      transition: 'border-color 0.15s, background 0.15s',
                      fontFamily: 'inherit',
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Password field */}
              <div>
                <label className="text-sm font-semibold text-text-primary mb-2 block">Şifrə *</label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Ən az 6 simvol"
                    className="field-input pr-10"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
                    Yoxlanılır...
                  </span>
                ) : 'Təsdiq et'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="w-full text-center text-sm text-text-secondary py-1 hover:text-primary transition-colors"
              >
                ← {identifierType === 'email' ? 'Email ünvanını dəyiş' : 'Telefon nömrəsini dəyiş'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
