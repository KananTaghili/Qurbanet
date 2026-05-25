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
    <div className="flex-1 flex flex-col bg-primary">
      <div className="flex-1 flex flex-col justify-center items-center px-6 gap-8 py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white/20">
            <Image src="/logo.png" alt="QurbanEt" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="text-3xl font-black text-white italic">Qurban<span className="text-green-300">Et</span></div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-1">Kodu daxil edin</h2>
          <p className="text-sm text-text-secondary mb-5 leading-5">
            <strong>{identifier}</strong>{' '}{subtitle}
          </p>

          {/* 4-digit code boxes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
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
                  width: 60, height: 68, textAlign: 'center', fontSize: 26, fontWeight: 700,
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
          <div className="mb-5">
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
            <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
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
            className="w-full text-center text-sm text-text-secondary mt-3 py-2 hover:text-primary transition-colors"
          >
            ← {identifierType === 'email' ? 'Email ünvanını dəyiş' : 'Telefon nömrəsini dəyiş'}
          </button>
        </form>
      </div>
    </div>
  );
}
