"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const amount = searchParams.get("amount") || "";
  const currency = searchParams.get("currency") || "AZN";
  const status = searchParams.get("status") || "success";
  const type = searchParams.get("type") || "order";
  const transaction = searchParams.get("transaction") || "";

  // Notify parent (iframe or React Native WebView)
  useEffect(() => {
    const msg = {
      type: "EPOINT_RESULT",
      orderType: type,
      status: "success",
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
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 max-w-md w-full">
        {/* Success Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-green-700 mb-2">
          Ödəniş uğurlu oldu!
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Sifarişiniz qəbul edildi. Tezliklə sizinlə əlaqə saxlanılacaq.
        </p>

        {/* Order details */}
        {(orderId || amount || transaction) && (
          <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left text-sm">
            {orderId && (
              <div className="flex justify-between py-1.5 border-b border-green-100">
                <span className="text-green-700 font-medium">Sifariş №</span>
                <span className="text-green-900 font-semibold">{orderId}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between py-1.5 border-b border-green-100">
                <span className="text-green-700 font-medium">Məbləğ</span>
                <span className="text-green-900 font-semibold">
                  {amount} {currency}
                </span>
              </div>
            )}
            {transaction && (
              <div className="flex justify-between py-1.5">
                <span className="text-green-700 font-medium">Tranzaksiya</span>
                <span className="text-green-900 font-mono text-xs break-all">
                  {transaction}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Next steps */}
        <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left text-sm text-green-800">
          <p className="font-semibold mb-1">Növbəti addımlar:</p>
          <ul className="list-disc list-inside space-y-1 text-green-700">
            <li>Təsdiq SMS-i alacaqsınız</li>
            <li>Kəsimxana ilə əlaqə saxlanılacaq</li>
            <li>Çatdırılma tarixi bildirilcək</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/my-orders"
            className="inline-block w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-2xl transition-colors text-center"
          >
            Sifarişimi izlə
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
