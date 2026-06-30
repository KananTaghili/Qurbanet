'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
  const [isExiting, setIsExiting] = useState(false);
  const [identifier, setIdentifier] = useState('');

  const navigate = (path) => { setIsExiting(true); setTimeout(() => router.push(path), 260); };
  const [identifierType, setIdentifierType] = useState('phone');
  const [isLogin, setIsLogin] = useState(false);

  const onlyLetters = (val) => val.replace(/[^a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s\-]/g, '');
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
    sessionStorage.removeItem('otp_from');
  };

  const handleBack = () => {
    clearOtpSession();
    navigate(isLogin ? '/auth/login' : '/auth/register');
  };

  const handleSubmit = async (e, autoCode) => {
    e?.preventDefault();
    const otp = autoCode || code.join('');
    if (otp.length < 4) { setError('4 rəqəmli kodu daxil edin.'); return; }
    if (!isLogin) {
      if (name.trim().length < 2) { setError('Ad ən az 2 hərf olmalıdır.'); return; }
      if (!/^[a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s\-]+$/.test(name.trim())) { setError('Ad yalnız hərf ola bilər.'); return; }
      if (lastName.trim().length < 2) { setError('Soyad ən az 2 hərf olmalıdır.'); return; }
      if (!/^[a-zA-ZəƏıİöÖüÜçÇşŞğĞ\s\-]+$/.test(lastName.trim())) { setError('Soyad yalnız hərf ola bilər.'); return; }
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
            const body = { name: name.trim(), lastName: lastName.trim() };
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

        const otpFrom = sessionStorage.getItem('otp_from') || '/';
        clearOtpSession();
        router.push(otpFrom);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (!status || status >= 500) {
        setError('Xidmət müvəqqəti əlçatan deyil. Bir az sonra yenidən cəhd edin.');
      } else if (status === 404) {
        setError('Kod müddəti bitib və ya tapılmadı. Yenidən kod göndərin.');
      } else {
        setError(msg || 'Daxil etdiyiniz kod yanlışdır. Yenidən cəhd edin.');
      }
      setCode(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const subtitle = identifierType === 'email'
    ? 'ünvanına göndərilən 4 rəqəmli kodu daxil edin.'
    : 'nömrəsinə göndərilən 4 rəqəmli kodu daxil edin.';

  return (
    <>
      <main className="h-screen overflow-hidden bg-background p-0 md:p-7" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>{`@media(max-width:767px){.auth-frame{border-radius:0!important;border:none!important;}}`}</style>
      <div
        className="auth-frame"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '1.75rem',
          border: '1px solid rgba(255,255,255,0.13)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
          background: '#130807',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr',
        }}
        className="lg:grid auth-grid-cols-otp"
      >
        {/* Background */}
        <Image
          src="/auth_bg.jpg"
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.55, zIndex: 0 }}
          priority
        />

        {/* Mobile-only back to home */}
        <Link href="/" className="flex lg:hidden" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(4px)' }}>
          <ArrowLeft size={18} />
        </Link>

        {/* ── Left panel (desktop only) ── */}
        <section
          className="hidden lg:flex flex-col justify-center px-[6vw] py-[4vh] h-full overflow-y-auto"
          style={{ position: 'relative', zIndex: 1, color: '#fff' }}
        >
          <Link
            href="/"
            className="hidden lg:flex"
            style={{
              position: 'absolute', top: 20, left: 20,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ArrowLeft size={18} />
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 420, margin: '0 auto', width: '100%', textAlign: 'center' }}>
            {/* Logo (includes MEATBOX text) */}
            <div style={{ width: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/meatbox logo bottom white.png" alt="MEATBOX.AZ loqosu" width={200} height={154} style={{ objectFit: 'contain', width: '100%', height: 'auto' }} />
            </div>

            {/* Slogan below logo */}
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['ETİBARLI', 'HALAL', 'SÜRƏTLİ'].map((t, i) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)' }}>{t}</span>
                  {i < 2 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'inline-block' }} />}
                </span>
              ))}
            </div>

          </div>
        </section>

        {/* ── Right panel — form ── */}
        <section
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', overflowX: 'hidden' }}
          className="h-full overflow-y-auto"
        >
          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', paddingTop: 8, paddingBottom: 8 }}>
          {/* Mobile branding — above card, hidden on desktop */}
          <div className="flex lg:hidden flex-col items-center auth-mobile-brand">
            <div className="auth-mobile-logo" style={{ width: 160 }}>
              <Image src="/meatbox logo bottom white.png" alt="MEATBOX.AZ" width={160} height={123} style={{ objectFit: 'contain', width: '100%', height: 'auto' }} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              {['ETİBARLI', 'HALAL', 'SÜRƏTLİ'].map((t, i) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)' }}>{t}</span>
                  {i < 2 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'inline-block' }} />}
                </span>
              ))}
            </div>
          </div>

          <div className={`auth-card${isExiting ? ' auth-card-out' : ''}`} style={{
            width: '100%',
            maxWidth: 380,
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 24px 90px rgba(15,23,42,0.16)',
            padding: '18px 24px 22px',
            fontFamily: "'Manrope', sans-serif",
          }}>

            {/* ── Back + Title row ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#f5f5f7', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#241331', flexShrink: 0,
                }}
                aria-label="Geri qayıt"
              >
                <ArrowLeft size={17} strokeWidth={2.5} />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: '#111827', margin: 0 }}>
                Kodu daxil edin
              </h2>
            </div>

            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.55, paddingLeft: 44 }}>
              <strong style={{ color: '#241331' }}>{identifier}</strong>{' '}{subtitle}
            </p>

            <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* OTP inputs */}
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
                    autoComplete="one-time-code"
                    style={{
                      width: 48, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 700,
                      border: d ? '2px solid #c8102e' : '2px solid #e5e7eb',
                      borderRadius: 14, outline: 'none',
                      background: d ? '#fff5f5' : '#f9fafb',
                      color: d ? '#c8102e' : '#111827',
                      transition: 'border-color 0.15s, background 0.15s',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#1f2937', marginBottom: 4, display: 'block' }}>Ad *</label>
                    <input
                      ref={nameRef}
                      type="text"
                      name="given-name"
                      autoComplete="given-name"
                      value={name}
                      onChange={(e) => { setName(onlyLetters(e.target.value)); setError(''); }}
                      placeholder="Məsələn: Əli"
                      autoCapitalize="words"
                      maxLength={60}
                      style={{ width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#1f2937', marginBottom: 4, display: 'block' }}>Soyad *</label>
                    <input
                      type="text"
                      name="family-name"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => { setLastName(onlyLetters(e.target.value)); setError(''); }}
                      placeholder="Məsələn: Hüseynov"
                      autoCapitalize="words"
                      maxLength={60}
                      style={{ width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#1f2937', marginBottom: 4, display: 'block' }}>Şifrə *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        name="new-password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Ən az 6 simvol"
                        maxLength={128}
                        style={{ width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 44px 0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', fontSize: 12, fontWeight: 600, padding: '10px 14px', borderRadius: 10 }}>
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
                  className="auth-btn-primary"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    height: 44, width: '100%', borderRadius: 14, border: 'none',
                    background: loading ? '#9ca3af' : '#f20b32',
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    boxShadow: loading ? 'none' : '0 10px 20px rgba(242,11,50,0.15)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 15, height: 15, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Yoxlanılır...
                    </>
                  ) : 'Təsdiq et'}
                </button>
              )}

              <button
                type="button"
                onClick={() => { clearOtpSession(); navigate(isLogin ? '/auth/login' : '/auth/register'); }}
                style={{ width: '100%', textAlign: 'center', fontSize: 12, color: '#6b7280', padding: '2px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {identifierType === 'email' ? '← Email ünvanını dəyiş' : '← Telefon nömrəsini dəyiş'}
              </button>
            </form>
          </div>
          </div>{/* end margin:auto wrapper */}
        </section>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes authCardIn { from { opacity:0; transform:translateY(28px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes authCardOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-18px) scale(0.97); } }
        .auth-card { animation: authCardIn 0.38s cubic-bezier(0.34,1.4,0.64,1) both; }
        .auth-card-out { animation: authCardOut 0.24s ease-in both !important; }
        .auth-btn-primary { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
        .auth-btn-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-2px); box-shadow: 0 16px 32px rgba(242,11,50,0.28) !important; }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        @media (min-width: 1024px) {
          .auth-grid-cols-otp { grid-template-columns: 1.22fr 0.78fr !important; }
        }
        @media (max-height: 720px) and (max-width: 1023px) {
          .auth-mobile-logo { width: 110px !important; }
          .auth-mobile-brand { gap: 4px !important; }
        }
        @media (max-height: 620px) and (max-width: 1023px) {
          .auth-mobile-brand { display: none !important; }
        }
      `}</style>
      </main>
    </>
  );
}
