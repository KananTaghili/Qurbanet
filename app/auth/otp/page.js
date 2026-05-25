'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

export default function OtpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('phone');
  const inputs = useRef([]);

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
    if (digit && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d)) submitCode(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setCode(pasted.split('')); submitCode(pasted); }
  };

  const submitCode = async (otp) => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = identifierType === 'email'
        ? { email: identifier, code: otp }
        : { phone: identifier, code: otp };
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
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const subtitle = identifierType === 'email'
    ? `ünvanına göndərilən 6 rəqəmli kodu daxil edin.`
    : `nömrəsinə göndərilən 6 rəqəmli kodu daxil edin.`;

  return (
    <div className="flex-1 flex flex-col bg-primary">
      <div className="flex-1 flex flex-col justify-center items-center px-6 gap-8 py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white/20">
            <Image src="/logo.png" alt="QurbanEt" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="text-3xl font-black text-white italic">Qurban<span className="text-green-300">Et</span></div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-1">Kodu daxil edin</h2>
          <p className="text-sm text-text-secondary mb-5 leading-5">
            <strong>{identifier}</strong>{' '}{subtitle}
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
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
                  width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                  border: `2px solid ${d ? '#1B5E20' : '#E0E0E0'}`,
                  borderRadius: 14, outline: 'none',
                  background: d ? '#E8F5E9' : '#F8F9FA',
                  color: d ? '#1B5E20' : '#111827',
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: 'inherit',
                }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <button onClick={() => router.push('/auth/login')} className="w-full text-center text-sm text-text-secondary mt-2 py-2 hover:text-primary transition-colors">
            ← {identifierType === 'email' ? 'Email ünvanını dəyiş' : 'Telefon nömrəsini dəyiş'}
          </button>
        </div>
      </div>
    </div>
  );
}
