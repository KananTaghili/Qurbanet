"use client";
import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  "/": "Əsas Səhifə",
  "/my-orders": "Sifarişlərim",
  "/need-support": "Xeyriyyə",
  "/how-it-works": "Necə İşləyirik?",
  "/qurban-rules": "Qurbanın Əhkamları",
  "/settings": "Parametrlər",
  "/auth/login": "Giriş",
  "/auth/register": "Qeydiyyat",
  "/auth/otp": "Doğrulama",
  "/auth/name": "Ad daxil edin",
  "/auth/forgot-password": "Şifrəni Sıfırla",
  "/order/quantity": "Miqdar seçin",
  "/order/distribution": "Çatdırılma seçin",
  "/order/contact": "Əlaqə məlumatları",
  "/order/summary": "Sifariş xülasəsi",
  "/order/payment": "Ödəniş",
  "/order/confirmation": "Sifariş Tamamlandı ✓",
  "/order/cash-payment": "Nağd Ödəniş",
  "/charity/payment": "Xeyriyyə Ödənişi",
  "/charity/confirmation": "Xeyriyyə Tamamlandı ✓",
};

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/my-orders/")) return "Sifariş Detalı";
  if (pathname.startsWith("/need-support/")) return "Xeyriyyə";
  if (pathname.startsWith("/charity-order/")) return "Xeyriyyə Sifarişi";
  return "QurbanEt";
}

const BACK_ROUTES = {
  "/settings": "/",
  "/order/quantity": "/",
  "/order/distribution": "/order/quantity",
  "/order/contact": "/order/distribution",
  "/order/summary": "/order/contact",
  "/order/payment": "/order/summary",
  "/need-support": "/",
  "/how-it-works": "/",
  "/qurban-rules": "/",
  "/my-orders": "/",
  "/charity/payment": "/need-support",
  "/auth/login": "/",
  "/auth/otp": "/auth/login",
  "/auth/name": "/",
  "/auth/forgot-password": "/",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest } = useAuth();

  const backEntry = Object.entries(BACK_ROUTES).find(
    ([k]) => pathname === k || pathname.startsWith(k + "/"),
  );
  const backTo = backEntry?.[1];
  const showBack = !!backTo && pathname !== "/";

  return (
    <header className="topbar-component">
      {/* Left: back + title */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.push(backTo)}
            className="w-[34px] h-[34px] rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 transition-colors"
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            ‹
          </button>
        )}
        <h1 className="text-base font-extrabold tracking-tight text-white">
          {getTitle(pathname)}
        </h1>
      </div>

      {/* Right: auth */}
      <div className="flex items-center gap-3">
        {isGuest ? (
          <button
            onClick={() => router.push("/auth/login")}
            className="rounded-xl px-3.5 py-1.5 text-sm font-bold transition-colors text-white"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            Daxil ol
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/settings")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
              title="Parametrlər"
            >
              <Settings size={18} color="white" strokeWidth={2} />
            </button>
            <div
              className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-sm font-extrabold text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm font-semibold text-white/80">
              {user?.name?.split(" ")[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
