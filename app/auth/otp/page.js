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
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('phone');
  const [isLogin, setIsLogin] = useState(false);
  const inputs = useRef([]);
  const nameRef = useRef(null);
  const passwordRef = useRef(null);
  const submittingRef = useRef(false);
  const abortRef = useRef(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    const id = sessionStorage.getItem('otp_identifier') || sessionStorage.getItem('otp_phone');
    const idType = sessionStorage.getItem('otp_identifier_type') || 'phone';
    const flow = sessionStorage.getItem('otp_flow') || 'register';
    if (!id) { router.replace('/auth/login'); return; }
    setIdentifier(id);
    setIdentifierType(idType);
    setIsLogin(flow === 'login');
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
      if (isLogin) {
        handleSubmit(null, next.join(''));
      } else {
        nameRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(''));
      if (isLogin) {
        handleSubmit(null, pasted);
      } else {
        nameRef.current?.focus();
      }
    }
  };

  const clearOtpSession = () => {
    sessionStorage.removeItem('otp_identifier');
    sessionStorage.removeItem('otp_identifier_type');
    sessionStorage.removeItem('otp_phone');
    sessionStorage.removeItem('otp_flow');
  };

  const handleBack = () => {
    clearOtpSession();
    router.push(isLogin ? '/auth/login' : '/auth/register');
  };

  const handleSubmit = async (e, autoCode) => {
    e?.preventDefault();
    const otp = autoCode || code.join('');
    if (otp.length < 4) { setError('4 rəqəmli kodu daxil edin.'); return; }
    if (!isLogin) {
      if (name.trim().length < 2) { setError('Ad ən az 2 simvol olmalıdır.'); return; }
      if (!password || password.length < 6) { setError('Şifrə ən az 6 simvol olmalıdır.'); return; }
    }
    if (submittingRef.current) return;
    submittingRef.current = true;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const payload = identifierType === 'email'
        ? { email: identifier, code: otp }
        : { phone: identifier, code: otp };

      if (!isLogin && password) payload.password = password;

      const res = await api.post('/auth/verify-otp', payload, { signal: abortRef.current.signal });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        if (!isLogin && name.trim()) {
          try {
            const body = { name: name.trim() };
            if (lastName.trim()) body.lastName = lastName.trim();
            const profileRes = await api.put('/auth/profile', body, { signal: abortRef.current.signal });
            const freshToken = profileRes.data.data?.token || token;
            const updatedUser = profileRes.data.data?.user || { ...user, name: name.trim() };
            login(freshToken, updatedUser);
          } catch (profileErr) {
            if (profileErr.name === 'AbortError' || profileErr.code === 'ERR_CANCELED') return;
            setError(profileErr.response?.data?.message || 'Ad yenilənə bilmədi.');
            setLoading(false);
            submittingRef.current = false;
            return;
          }
        }

        clearOtpSession();
        router.push('/');
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      setError(err.response?.data?.message || 'Yanlış kod. Yenidən cəhd edin.');
      setCode(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const subtitle = identifierType === 'email'
    ? 'unvanina gonderilen 4 rəqəmli kodu daxil edin.'
    : 'nomresine gonderilen 4 rəqəmli kodu daxil edin.';

  return (
    <>
      <main
        style={{ minHeight: '100vh', background: '#241331', display: 'grid', gridTemplateColumns: '1fr', fontFamily: "'Manrope', sans-serif", position: 'relative' }}
        className="lg:grid lg:h-screen auth-grid-cols-otp"
      >
        <Image
          src="/auth_bg.jpg"
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.45, zIndex: 0 }}
          priority
        />

        <div
          className="hidden lg:flex flex-col items-center justify-center px-10"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', border: '2px solid rgba(255,255,255,0.18)', flexShrink: 0 }}>
              <Image src="/meatbox_icon.png" alt="MeatBox" width={88} height={88} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1, fontStyle: 'italic' }}>
                Meat<span style={{ color: '#f20b32' }}>Box</span>
              </div>
              <div style={{ fontSize: 15, marginTop: 10, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5, maxWidth: 220 }}>
                Premium ət çatdırılması platforması
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Təmiz ət', 'Təmiz niyyət', 'Təmiz xidmət'].map((label) => (
                <span key={label} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative' }}>

            <button
              type="button"
              onClick={handleBack}
              style={{ position: 'absolute', top: 20, left: 20, width: 36, height: 36, borderRadius: 12, background: '#f5f5f7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#241331' }}
              aria-label="Geri qayıt"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex lg:hidden" style={{ justifyContent: 'center', marginBottom: 20, marginTop: 8 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <Image src="/meatbox_icon.png" alt="MeatBox" width={52} height={52} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 6 }}>Kodu daxil edin</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
              <strong style={{ color: '#241331' }}>{identifier}</strong>{' '}{subtitle}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      width: 64, height: 68, textAlign: 'center', fontSize: 26, fontWeight: 700,
                      border: d ? '2px solid #c8102e' : '2px solid #e5e7eb',
                      borderRadius: 14, outline: 'none',
                      background: d ? '#fff5f5' : '#f9fafb',
                      color: d ? '#c8102e' : '#111827',
                      transition: 'border-color 0.15s, background 0.15s',
                      fontFamily: 'inherit',
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Ad *</label>
                    <input
                      ref={nameRef}
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder="Məsələn: Əli"
                      autoCapitalize="words"
                      maxLength={60}
                      style={{ width: '100%', height: 48, border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Soyad</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Məsələn: Hüseynov"
                      autoCapitalize="words"
                      maxLength={60}
                      style={{ width: '100%', height: 48, border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Şifrə *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Ən az 6 simvol"
                        maxLength={128}
                        style={{ width: '100%', height: 48, border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '0 44px 0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', fontSize: 13, fontWeight: 600, padding: '12px 16px', borderRadius: 12 }}>
                  {error}
                </div>
              )}

              {isLogin ? (
                loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                    <span style={{ width: 28, height: 28, border: '3px solid #c8102e', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                )
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: 50, borderRadius: 14, background: loading ? '#e5e7eb' : '#c8102e', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Yoxlanılır...
                    </>
                  ) : 'Təsdiq et'}
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push(isLogin ? '/auth/login' : '/auth/register')}
                style={{ width: '100%', textAlign: 'center', fontSize: 13, color: '#6b7280', padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {identifierType === 'email' ? '← Email ünvanını dəyiş' : '← Telefon nömrəsini dəyiş'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .auth-grid-cols-otp { grid-template-columns: 1.22fr 0.78fr !important; }
        }
      `}</style>
    </>
  );
}



