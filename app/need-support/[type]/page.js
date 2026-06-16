'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Home, HeartHandshake, Handshake, Scissors, CalendarX, AlertCircle, Info } from 'lucide-react';
import BackHeader from '../../../components/BackHeader';
import api from '../../../lib/api';

const TARGET_CONFIG = {
  usaqlar_evi: {
    accentColor: '#1B5E20',
    surfaceColor: '#E8F5E9',
    label: 'Uşaqlar Evi',
    Icon: Home,
    heroDesc: 'Qurban ver və uşaqlar üçün dəstək ol.',
  },
  qocalar_evi: {
    accentColor: '#6A1B9A',
    surfaceColor: '#F3E5F5',
    label: 'Qocalar Evi',
    Icon: HeartHandshake,
    heroDesc: 'Qurban ver və yaşlılara dəstək ol.',
  },
  ehtiyac_sahibleri: {
    accentColor: '#1565C0',
    surfaceColor: '#E3F2FD',
    label: 'Ehtiyac Sahibləri',
    Icon: Handshake,
    heroDesc: 'Qurban ver və ehtiyac sahiblərinə dəstək ol.',
  },
};

export default function NeedSupportDetailPage() {
  const { type } = useParams();
  const router = useRouter();

  const cfg = TARGET_CONFIG[type] ?? TARGET_CONFIG.usaqlar_evi;
  const accentColor = cfg.accentColor;
  const surfaceColor = cfg.surfaceColor;
  const HeroIcon = cfg.Icon;

  const [targetLabel, setTargetLabel] = useState(cfg.label);
  const [heroDesc, setHeroDesc] = useState(cfg.heroDesc);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [weights, setWeights] = useState({});
  const [weightInfoText, setWeightInfoText] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('charity_target');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.nameAz) setTargetLabel(parsed.nameAz);
        if (parsed.description) setHeroDesc(parsed.description);
      } catch {}
    }
    fetchAnimals();
    fetchSettings();
  }, [type]);

  const fetchAnimals = async () => {
    try {
      const res = await api.get(`/app-config/charity-animals?charityType=${type}`);
      const list = res.data.data?.charityAnimals || [];
      setAnimals(list);
      const defaultWeights = {};
      list.forEach((a) => {
        if (a.priceOptions?.length > 0) defaultWeights[a._id] = a.priceOptions[0].key;
      });
      setWeights(defaultWeights);
    } catch {
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/app-config/settings');
      if (res.data?.data?.charityPageEnabled === false) {
        router.replace('/');
        return;
      }
      const text = res.data.data?.charityWeightInfoText;
      if (text) setWeightInfoText(text);
    } catch {}
    setReady(true);
  };

  const changeQty = (id, delta) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  };

  const totalAmount = useMemo(
    () =>
      animals.reduce((sum, a) => {
        const qty = quantities[a._id] ?? 0;
        const wKey = weights[a._id];
        if (qty > 0 && wKey) {
          const opt = a.priceOptions?.find((o) => o.key === wKey);
          if (opt) return sum + qty * opt.price;
        }
        return sum;
      }, 0),
    [animals, quantities, weights],
  );

  const anySelected = animals.some((a) => (quantities[a._id] ?? 0) > 0);
  const allWeighted = animals.every((a) => (quantities[a._id] ?? 0) === 0 || weights[a._id] != null);
  const canPay = anySelected && allWeighted;

  const summaryRows = useMemo(
    () =>
      animals
        .filter((a) => (quantities[a._id] ?? 0) > 0)
        .map((a) => {
          const qty = quantities[a._id];
          const wKey = weights[a._id];
          const opt = a.priceOptions?.find((o) => o.key === wKey);
          return {
            label: `Qurban - ${a.nameAz} × ${qty}${opt ? ` (${opt.labelAz})` : ''}`,
            value: `${qty * (opt?.price || 0)} AZN`,
          };
        }),
    [animals, quantities, weights],
  );

  if (!ready) return null;

  const handlePay = () => {
    if (!canPay) return;
    sessionStorage.setItem(
      'charity_payment',
      JSON.stringify({ target: type, targetLabel, accentColor, totalAmount, summaryRows }),
    );
    router.push('/charity/payment');
  };

  return (
    <div className="flex flex-col flex-1">
      <BackHeader title={targetLabel} />

      <div className="flex-1 page-scroll">
        <div className="p-4 md:p-6 flex flex-col gap-4 md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start">

          {/* ── LEFT: hero + animals + info ─────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Hero card */}
            <div style={{ borderRadius: 18, padding: 16, border: `1px solid ${accentColor}33`, backgroundColor: surfaceColor }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <HeroIcon size={26} color={accentColor} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: accentColor, marginBottom: 4 }}>{targetLabel}</div>
              <div style={{ fontSize: 13, lineHeight: '1.65', color: 'var(--text-secondary)' }}>{heroDesc}</div>
            </div>

            {/* Qurban ver section */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Scissors size={16} color={accentColor} />
                <span style={{ fontSize: 15, fontWeight: 800, color: accentColor }}>Qurban ver</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{ border: `3px solid ${accentColor}`, borderTopColor: 'transparent' }}
                  />
                </div>
              ) : animals.length === 0 ? (
                <div className="flex flex-col items-center py-10 px-6 gap-3 text-center">
                  <CalendarX size={36} color={accentColor} style={{ opacity: 0.45 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: accentColor }}>Hazırda mövcud deyil</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                    Bu istiqamət üçün heyvan seçimi müvəqqəti olaraq bağlıdır. Tezliklə əlavə ediləcək.
                  </div>
                </div>
              ) : (
                <div className="p-3 flex flex-col gap-3">
                  {animals.map((animal) => {
                    const qty = quantities[animal._id] ?? 0;
                    const selectedWKey = weights[animal._id];

                    return (
                      <div
                        key={animal._id}
                        style={{ borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'var(--bg)', overflow: 'hidden' }}
                      >
                        {/* Image + name + counter */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            {animal.imageUrl ? (
                              <img
                                src={animal.imageUrl}
                                alt={animal.nameAz}
                                style={{ width: 70, height: 55, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: 70, height: 55, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor + '14', flexShrink: 0, fontSize: 28 }}>
                                {animal.emoji || '🐑'}
                              </div>
                            )}
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{animal.nameAz}</span>
                          </div>

                          {/* +/- counter */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 4, flexShrink: 0 }}>
                            <button
                              onClick={() => changeQty(animal._id, -1)}
                              disabled={qty === 0}
                              style={{ width: 30, height: 30, borderRadius: 9, border: 'none', backgroundColor: 'var(--bg)', cursor: qty === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty === 0 ? 0.4 : 1, fontSize: 20, color: accentColor, fontWeight: 700 }}
                            >
                              −
                            </button>
                            <span style={{ minWidth: 26, textAlign: 'center', fontSize: 16, fontWeight: 800, color: qty > 0 ? accentColor : 'var(--text-primary)' }}>{qty}</span>
                            <button
                              onClick={() => changeQty(animal._id, 1)}
                              style={{ width: 30, height: 30, borderRadius: 9, border: 'none', backgroundColor: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: accentColor, fontWeight: 700 }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Weight chips — always visible */}
                        <div style={{ padding: '0 12px 12px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                            Çəki aralığını seçin:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {(animal.priceOptions || []).map((opt) => {
                              const active = selectedWKey === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => setWeights((prev) => ({ ...prev, [animal._id]: opt.key }))}
                                  style={{
                                    flex: '1 1 28%', minWidth: 0, borderRadius: 10,
                                    border: `1.5px solid ${active ? accentColor : 'var(--border)'}`,
                                    backgroundColor: active ? accentColor : 'var(--surface)',
                                    padding: '8px 6px', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', cursor: 'pointer',
                                  }}
                                >
                                  <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#fff' : 'var(--text-primary)', marginBottom: 2 }}>{opt.labelAz}</span>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}>{opt.price} AZN</span>
                                </button>
                              );
                            })}
                          </div>

                          {!selectedWKey && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                              <AlertCircle size={13} color="#E65100" />
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#E65100' }}>Çəki aralığını seçin</span>
                            </div>
                          )}

                          {weightInfoText && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: 'rgba(0,0,0,0.035)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', padding: 10 }}>
                              <Info size={14} color={accentColor} style={{ flexShrink: 0, marginTop: 1 }} />
                              <span style={{ fontSize: 11.5, lineHeight: '1.55', fontWeight: 500, color: accentColor + 'CC' }}>{weightInfoText}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Subtotal */}
                  {anySelected && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', marginTop: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Qurban cəmi</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: accentColor }}>{totalAmount} AZN</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info box */}
            <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${accentColor}33`, backgroundColor: accentColor + '0D', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={15} color={accentColor} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                Seçdiyiniz heyvan{anySelected ? 'lar' : ''} <strong>{targetLabel}</strong> üçün nəzərdə tutulur. Ödənişdən sonra sizinlə əlaqə saxlanılacaq.
              </span>
            </div>
          </div>

          {/* ── RIGHT: total card + summary + pay (desktop) ──────────────── */}
          <div className="hidden md:flex flex-col gap-4">
            <div style={{ borderRadius: 20, padding: 24, textAlign: 'center', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', background: accentColor }}>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Cəmi məbləğ</div>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{totalAmount} AZN</div>
            </div>

            {summaryRows.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
                <div className="px-4 py-3 border-b border-border text-xs font-bold text-text-secondary tracking-wide uppercase">
                  Sifariş xülasəsi
                </div>
                {summaryRows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handlePay}
              disabled={!canPay}
              style={canPay ? { background: accentColor } : {}}
            >
              {totalAmount > 0 ? `${totalAmount} AZN · Ödə →` : 'Ödə →'}
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile bottom bar ─────────────────────────────────────────────── */}
      <div className="mobile-action-bar mobile-only">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Cəmi məbləğ</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: accentColor, letterSpacing: -0.5, marginTop: 1 }}>{totalAmount} AZN</div>
          </div>
          <button
            onClick={handlePay}
            disabled={!canPay}
            style={{
              background: canPay ? accentColor : 'var(--border)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 800,
              cursor: canPay ? 'pointer' : 'not-allowed',
              opacity: canPay ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            Ödə »
          </button>
        </div>
      </div>
    </div>
  );
}
