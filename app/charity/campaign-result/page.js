'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CampaignResultRedirect() {
  const router   = useRouter();
  const params   = useSearchParams();

  useEffect(() => {
    const campaignId = params.get('campaignId');
    const role       = params.get('role') || 'donor';
    const payment    = params.get('payment');
    const amount     = params.get('amount') || '';
    const message    = params.get('message') || '';

    if (payment === 'success' && campaignId) {
      router.replace(
        `/charity?campaign=${campaignId}&paymentDone=1&role=${role}&amount=${amount}`
      );
    } else {
      router.replace(
        `/charity?payment=fail&message=${encodeURIComponent(message || 'Ödəniş uğursuz oldu')}`
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ff]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
    </div>
  );
}

export default function CampaignResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3ff]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4b14bd] border-t-transparent" />
      </div>
    }>
      <CampaignResultRedirect />
    </Suspense>
  );
}
