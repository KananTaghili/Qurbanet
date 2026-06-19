'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Receipt } from 'lucide-react';
import api from '../../../lib/api';

function CampaignResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const campaignId = params.get('campaignId');
  const role       = params.get('role');       // "opener" | "donor"
  const payment    = params.get('payment');    // "success" | "fail"
  const message    = params.get('message');
  const amount     = params.get('amount');

  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    if (campaignId && payment === 'success') {
      api.get(`/campaigns/${campaignId}`)
        .then(r => setCampaign(r.data?.data || null))
        .catch(() => {});
    }
  }, [campaignId]);

  const isSuccess = payment === 'success';
  const isOpener  = role === 'opener';

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {isSuccess ? (
          /* ── Success ── */
          <div className="rounded-3xl bg-white shadow-xl overflow-hidden">
            {/* Hero */}
            <div className="px-6 py-10 text-center"
              style={{ background: "linear-gradient(135deg, #4513ad, #7c3aed)" }}>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                <Receipt size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">
                {isOpener ? "Kampaniya açıldı!" : "Ödəniş təsdiqləndi"}
              </h1>
              <p className="text-white/80 text-sm">
                {isOpener
                  ? "Kollektiv qurban açılışınız başladı"
                  : "Ödənişiniz uğurla tamamlandı"}
              </p>
            </div>

            {/* Info */}
            <div className="p-6 space-y-3">
              {campaign && (
                <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3">
                  <div className="flex items-center gap-3">
                    {campaign.animal?.image && (
                      <img src={campaign.animal.image} alt={campaign.animal?.nameAz}
                        className="h-12 w-12 rounded-xl object-contain bg-white border border-purple-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-[#33245f] truncate">{campaign.animal?.nameAz} Qurbanı</div>
                      <div className="text-xs text-[#7c6fa0]">
                        {campaign.collectedAmount} / {campaign.totalAmount} AZN · {campaign.percent || 0}%
                      </div>
                    </div>
                  </div>
                  {amount && (
                    <div className="mt-3 pt-3 border-t border-purple-100 flex justify-between items-center">
                      <span className="text-sm text-[#7c6fa0]">Ödənilən məbləğ</span>
                      <span className="text-sm font-black text-[#4b14bd]">{amount} AZN</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-semibold text-emerald-800 leading-relaxed">
                  "Sədəqəniz Allah qatında qəbul olsun.<br />Allah sizdən razı olsun."
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2">
              {campaignId && (
                <button
                  onClick={() => router.replace(`/charity?campaign=${campaignId}`)}
                  className="w-full rounded-2xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #4513ad, #7c3aed)" }}
                >
                  Qurbanlığı izlə
                </button>
              )}
              <button
                onClick={() => router.replace('/charity')}
                className="w-full rounded-2xl border-2 border-purple-200 py-3 text-sm font-bold text-[#4b14bd] hover:bg-purple-50 transition"
              >
                Əsas səhifəyə qayıt
              </button>
            </div>
          </div>

        ) : (
          /* ── Fail ── */
          <div className="rounded-3xl bg-white shadow-xl overflow-hidden">
            {/* Hero */}
            <div className="px-6 py-10 text-center bg-red-50 border-b border-red-100">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-5xl">
                ❌
              </div>
              <h1 className="text-2xl font-black text-red-700 mb-1">Ödəniş uğursuz oldu</h1>
              <p className="text-red-500 text-sm">
                {message || "Ödəniş zamanı xəta baş verdi"}
              </p>
            </div>

            {/* Info */}
            <div className="p-6 space-y-3">
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 leading-relaxed">
                💡 Kart məlumatlarınızı yoxlayın və ya başqa bir kart ilə yenidən cəhd edin. Problem davam edərsə bankınızla əlaqə saxlayın.
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2">
              <button
                onClick={() => router.back()}
                className="w-full rounded-2xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4513ad, #7c3aed)" }}
              >
                Yenidən cəhd et
              </button>
              <button
                onClick={() => router.replace('/charity')}
                className="w-full rounded-2xl border-2 border-purple-200 py-3 text-sm font-bold text-[#4b14bd] hover:bg-purple-50 transition"
              >
                Əsas səhifəyə qayıt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignResultPage() {
  return (
    <Suspense>
      <CampaignResultContent />
    </Suspense>
  );
}
