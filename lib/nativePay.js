import { Capacitor } from "@capacitor/core";

/**
 * Ödəniş (Epoint) səhifəsini aç:
 *  - APK (native): tətbiq daxilində WebView (Chrome UI yoxdur).
 *  - Web: adi yönləndirmə.
 *
 * Epoint ödənişdən sonra bizim result_url (frontend) səhifəsinə yönləndirir.
 * WebView həmin səhifəyə çatanda onu bağlayıb tətbiqi eyni path+query-ə yönləndiririk —
 * beləliklə uğur/xəta səhifəsi (məs. /order/confirmation, /charity?paymentDone=1) düzgün görünür.
 * onFinish: istifadəçi ödənişi tamamlamadan pəncərəni əl ilə bağlayanda (fallback) çağırılır.
 */

// Epoint/pashabank və backend api xaric — bizim nəticə səhifəsidirmi?
const isResultUrl = (u) => {
  if (!u) return false;
  if (u.includes("epoint") || u.includes("pashabank") || u.includes("/api/")) return false;
  return (
    u.includes("meatbox") ||
    u.includes("paymentdone") ||
    u.includes("payment=") ||
    u.includes("/order/confirmation") ||
    u.includes("/order/error") ||
    u.includes("/charity/confirmation") ||
    u.includes("/charity")
  );
};

// Tam URL-dən tətbiq-daxili path çıxar (trailing slash ilə — static export üçün)
const toAppPath = (raw) => {
  try {
    const p = new URL(raw);
    let path = p.pathname || "/";
    if (!path.endsWith("/") && !path.split("/").pop().includes(".")) path += "/";
    return path + (p.search || "") + (p.hash || "");
  } catch (_) {
    return null;
  }
};

export async function openPayment(url, onFinish) {
  if (!Capacitor?.isNativePlatform?.()) {
    window.location.href = url;
    return;
  }
  try {
    const { InAppBrowser } = await import("@capacitor/inappbrowser");
    let done = false;
    let navSub, closeSub;
    const cleanup = () => {
      try { navSub?.remove?.(); } catch (_) {}
      try { closeSub?.remove?.(); } catch (_) {}
    };
    // Nəticə səhifəsinə çatdı → bağla və path-ı onFinish-ə ötür (call site naviqasiya edir)
    const goResult = async (raw) => {
      if (done) return;
      done = true;
      cleanup();
      try { await InAppBrowser.close(); } catch (_) {}
      try { onFinish?.(toAppPath(raw)); } catch (_) {}
    };
    // İstifadəçi əl ilə bağladı (ödəniş tamamlanmadı) → dest yoxdur
    const manualClose = () => {
      if (done) return;
      done = true;
      cleanup();
      try { onFinish?.(null); } catch (_) {}
    };

    navSub = await InAppBrowser.addListener("browserPageNavigationCompleted", (e) => {
      const raw = e?.url || "";
      if (isResultUrl(raw.toLowerCase())) goResult(raw);
    });
    closeSub = await InAppBrowser.addListener("browserClosed", () => manualClose());

    await InAppBrowser.openInWebView({
      url,
      options: {
        showURL: false,
        showToolbar: true,
        clearCache: false,
        clearSessionCache: false,
        showNavigationButtons: false,
        closeButtonText: "‹  MeatBox",
      },
    });
  } catch (_) {
    window.location.href = url;
  }
}
