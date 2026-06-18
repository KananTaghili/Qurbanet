"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Heart, ArrowLeft, Users } from "lucide-react";
import api from "../../../lib/api";

export default function CampaignConfirmationPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const campaignId = params.get("campaignId");
  const role       = params.get("role"); // "opener" | "donor"

  const [campaign, setCampaign] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!campaignId) { setLoading(false); return; }
    api.get(`/campaigns/${campaignId}`)
      .then(r => setCampaign(r.data?.data?.campaign || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  const isOpener = role === "opener";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle size={52} className="text-emerald-500" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#1a0f2e] mb-2">
            {isOpener ? "Kampaniya açıldı!" : "İanəniz qəbul edildi!"}
          </h1>
          <p className="text-[#7c6fa0] text-sm">
            {isOpener
              ? "Ödənişiniz uğurla tamamlandı. Kampaniyanız artıq aktivdir."
              : "Ödənişiniz uğurla tamamlandı. Töhfəniz üçün təşəkkür edirik!"}
          </p>
        </div>

        {/* Campaign info card */}
        {!loading && campaign && (
          <div className="rounded-2xl border border-purple-100 bg-white p-5 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-purple-700">
              <Heart size={13} /> Kampaniya məlumatları
            </div>
            <div className="space-y-2.5 text-sm">
              {campaign.animal?.name && (
                <div className="flex justify-between">
                  <span className="text-[#7c6fa0]">Heyvan</span>
                  <span className="font-semibold text-[#1a0f2e]">{campaign.animal.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#7c6fa0]">Tam məbləğ</span>
                <span className="font-semibold text-[#1a0f2e]">{campaign.totalAmount} AZN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c6fa0]">Toplanmış</span>
                <span className="font-semibold text-emerald-600">{campaign.collectedAmount} AZN</span>
              </div>
              {campaign.donations?.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#7c6fa0]">İanəçi sayı</span>
                  <span className="font-semibold text-[#1a0f2e] flex items-center gap-1">
                    <Users size={13} />{campaign.donations.filter(d => d.paymentStatus === "paid").length}
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {campaign.totalAmount > 0 && (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-purple-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                    style={{ width: `${Math.min(100, Math.round((campaign.collectedAmount / campaign.totalAmount) * 100))}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-[#7c6fa0]">
                  {Math.min(100, Math.round((campaign.collectedAmount / campaign.totalAmount) * 100))}% tamamlandı
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="rounded-2xl border border-purple-100 bg-white p-5 mb-5 animate-pulse">
            <div className="h-3 w-1/3 rounded bg-purple-100 mb-4" />
            <div className="space-y-3">
              <div className="h-3 w-full rounded bg-purple-50" />
              <div className="h-3 w-3/4 rounded bg-purple-50" />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/charity")}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #5b21b6, #7c3aed)" }}>
            Əsas səhifəyə qayıt
          </button>
          <button
            onClick={() => router.push(`/charity?campaign=${campaignId}`)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-200 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-all">
            <ArrowLeft size={15} /> Kampaniyaya bax
          </button>
        </div>

      </div>
    </div>
  );
}
