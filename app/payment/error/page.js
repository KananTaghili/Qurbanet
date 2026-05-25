"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Link from "next/link";

const REASON_LABELS = {
  payment_failed: "Ödəniş rədd edildi",
  missing_params: "Parametrlər çatışmır",
  invalid_signature: "İmza doğrulanmadı",
  verification_failed: "Ödəniş yoxlanılmadı",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const reason = searchParams.get("reason") || "";
  const transaction = searchParams.get("transaction") || "";
  const type = searchParams.get("type") || "order";

  const reasonLabel = REASON_LABELS[reason] || "Naməlum xəta";

  // Notify parent (iframe or React Native WebView)
  useEffect(() => {
    const msg = {
      type: "EPOINT_RESULT",
      orderType: type,
      status: "fail",
      orderId,
    };
    try {
      if (window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    } catch (e) {}
    try {
      window.parent.postMessage(msg, "*");
    } catch (e) {}
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 max-w-md w-full">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-red-600 mb-2">
          Ödəniş uğursuz oldu
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {reasonLabel}. Zəhmət olmasa yenidən cəhd edin.
        </p>

        {/* Details */}
        {(orderId || transaction) && (
          <div className="bg-red-50 rounded-2xl p-4 mb-6 text-left text-sm">
            {orderId && orderId !== "unknown" && (
              <div className="flex justify-between py-1.5 border-b border-red-100">
                <span className="text-red-700 font-medium">Sifariş №</span>
                <span className="text-red-900 font-semibold">{orderId}</span>
              </div>
            )}
            {transaction && transaction !== "unknown" && (
              <div className="flex justify-between py-1.5">
                <span className="text-red-700 font-medium">Tranzaksiya</span>
                <span className="text-red-900 font-mono text-xs break-all">
                  {transaction}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Possible reasons */}
        <div className="bg-red-50 rounded-2xl p-4 mb-6 text-left text-sm text-red-800">
          <p className="font-semibold mb-1">Mümkün səbəblər:</p>
          <ul className="list-disc list-inside space-y-1 text-red-700">
            <li>Kart məlumatları yanlışdır</li>
            <li>Balans kifayət deyil</li>
            <li>Bank tərəfindən rədd edildi</li>
            <li>Şəbəkə əlaqəsi kəsildi</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-2xl transition-colors text-center"
          >
            Yenidən Cəhd Et
          </Link>
          <Link
            href="/"
            className="inline-block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-2xl transition-colors text-center"
          >
            Ana Səhifəyə Qayıt
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
