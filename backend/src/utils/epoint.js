const crypto = require("crypto");

const EPOINT_API_BASE = () =>
  process.env.EPOINT_API_BASE || "https://epoint.az/api/1";
const PUBLIC_KEY = () => process.env.EPOINT_PUBLIC_KEY || "";
const PRIVATE_KEY = () => process.env.EPOINT_PRIVATE_KEY || "";

/** base64( json_string ) */
const encodeData = (params) =>
  Buffer.from(JSON.stringify(params)).toString("base64");

/** Epoint-dən gələn Base64-JSON data sahəsini decode et */
const decodeData = (dataStr) =>
  JSON.parse(Buffer.from(dataStr, "base64").toString("utf-8"));

// base64_encode(sha1(private_key + data + private_key, raw=true))
const buildSignature = (dataStr) => {
  const raw = crypto
    .createHash("sha1")
    .update(PRIVATE_KEY() + dataStr + PRIVATE_KEY())
    .digest();
  return raw.toString("base64");
};

/** Gələn imzanı timing-safe müqayisə ilə yoxla */
const verifySignature = (dataStr, signature) => {
  const expected = buildSignature(dataStr);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "base64"),
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
};

/** Hər Epoint endpoint-i üçün { data, signature } body qur */
const buildEpointBody = (payload) => {
  const data = encodeData({ public_key: PUBLIC_KEY(), ...payload });
  const signature = buildSignature(data);
  return { data, signature };
};

/** Epoint API-yə POST */
const epointPost = async (endpoint, payload) => {
  const body = buildEpointBody(payload);
  const res = await fetch(`${EPOINT_API_BASE()}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Epoint HTTP ${res.status}`);
  return res.json();
};

// ─── Epoint əməliyyatları ─────────────────────────────────────────────────────

const createPayment = async ({
  orderId,
  amount,
  description,
  successUrl,
  errorUrl,
  currency,
  language,
}) => {
  const result = await epointPost("/request", {
    amount: Number(amount).toFixed(2),
    currency: currency || "AZN",
    language: language || "az",
    order_id: String(orderId),
    description: String(description || "").slice(0, 1000),
    success_redirect_url: successUrl,
    error_redirect_url: errorUrl,
  });
  console.log("[EPoint] createPayment ←", JSON.stringify(result));
  if (result.status !== "success") {
    throw new Error(`EPoint xətası: ${result.message || result.status}`);
  }
  return result;
};

const getTransactionStatus = async (lookup) => {
  const result = await epointPost("/get-status", lookup);
  console.log("[EPoint] getStatus ←", JSON.stringify(result));
  return result;
};

// ─── Azerbaijani bank response codes ─────────────────────────────────────────

const AZ_BANK_MESSAGES = {
  116: "Kartınızda kifayət qədər məbləğ yoxdur.",
  101: "Kartınızın istifadə müddəti bitib. Yeni kartla cəhd edin.",
  117: "Yanlış PIN kod daxil edildi.",
  104: "Kartınız məhdudlaşdırılıb. Bankınızla əlaqə saxlayın.",
  106: "Yanlış PIN cəhd sayı limitini aşdınız. Bankınızla əlaqə saxlayın.",
  121: "Gündəlik pul çıxarma limitinizi aşdınız.",
  122: "Təhlükəsizlik pozuntusu aşkarlandı. Bankınızla əlaqə saxlayın.",
  123: "Əməliyyat tezliyi limitini aşdınız. Bir az gözləyib yenidən cəhd edin.",
  111: "Kart nömrəsi yanlışdır.",
  110: "Ödəniş məbləği etibarsızdır.",
  113: "Bu məbləğ kartınız üçün qəbul edilə bilməz.",
  112: "PIN kod tələb olunur.",
  100: "Ödəniş rədd edildi. Bankınızla əlaqə saxlayın.",
  102: "Fırıldaqçılıq şübhəsi ilə əməliyyat rədd edildi. Bankınızla əlaqə saxlayın.",
  103: "Bankınızla əlaqə saxlayın.",
  105: "Bankınızın təhlükəsizlik şöbəsi ilə əlaqə saxlayın.",
  107: "Kartınızı verən bankla əlaqə saxlayın.",
  108: "Bankınızın xüsusi şərtləri barədə məlumat üçün bankla əlaqə saxlayın.",
  109: "Etibarsız tacir.",
  114: "Tələb edilən hesab növü mövcud deyil.",
  115: "Bu əməliyyat kartınız tərəfindən dəstəklənmir.",
  118: "Kart məlumatları tapılmadı.",
  119: "Bu əməliyyat kartınız üçün icazəsizdir.",
  120: "Bu əməliyyat terminal tərəfindən icazəsizdir.",
  124: "Qanun pozuntusu səbəbindən rədd edildi.",
  125: "Kart etibarsızdır.",
  126: "PIN bloku xətası.",
  127: "PIN uzunluğu xətası.",
  128: "PIN sinxronizasiya xətası.",
  129: "Saxta kartdan şübhə var. Bankınızla əlaqə saxlayın.",
  180: "Kart sahibinin tələbi ilə rədd edildi.",
  200: "Kartınız rədd edildi. Bankınızla əlaqə saxlayın.",
  201: "Kartınızın istifadə müddəti bitib.",
  202: "Fırıldaqçılıq şübhəsi. Bankınızla əlaqə saxlayın.",
  204: "Kart məhdudlaşdırılıb.",
  208: "Kart itirilmiş kimi qeydə alınıb. Bankınızla əlaqə saxlayın.",
  209: "Kart oğurlanmış kimi qeydə alınıb. Bankınızla əlaqə saxlayın.",
  902: "Etibarsız əməliyyat. Yenidən cəhd edin.",
  904: "Format xətası. Yenidən cəhd edin.",
  909: "Sistem nasazlığı. Bir az sonra yenidən cəhd edin.",
  910: "Kartınızı verən bankın xidməti müvəqqəti bağlıdır.",
  911: "Bankdan cavab vaxtında alınmadı. Bir az sonra yenidən cəhd edin.",
  912: "Bankın sistemi hazırda əlçatmazdır. Bir az sonra yenidən cəhd edin.",
  950: "İş razılaşmasının pozuntusu səbəbindən rədd edildi.",
};

const getAzPaymentErrorMessage = (bankCode, epointMessage) => {
  const codeStr = String(bankCode || "").trim();
  if (AZ_BANK_MESSAGES[codeStr]) return AZ_BANK_MESSAGES[codeStr];

  const rawMsg = String(epointMessage || "").trim();
  if (AZ_BANK_MESSAGES[rawMsg]) return AZ_BANK_MESSAGES[rawMsg];

  const msg = rawMsg.toLowerCase();
  if (
    msg.includes("insufficient") ||
    msg.includes("not enough") ||
    msg.includes("balance")
  )
    return "Kartınızda kifayət qədər məbləğ yoxdur.";
  if (msg.includes("expired") || msg.includes("expir"))
    return "Kartınızın istifadə müddəti bitib.";
  if (msg.includes("maximum operation limit"))
    return "Merchant ödəniş limiti aşıldı. Operatorla əlaqə saxlayın.";
  if (msg.includes("limit")) return "Kart limiti aşıldı.";
  if (msg.includes("blocked") || msg.includes("restrict"))
    return "Kartınız məhdudlaşdırılıb. Bankınızla əlaqə saxlayın.";
  if (msg.includes("fraud") || msg.includes("security"))
    return "Təhlükəsizlik səbəbindən əməliyyat rədd edildi.";
  if (msg.includes("pin")) return "Yanlış PIN kod daxil edildi.";
  if (msg.includes("declined") || msg.includes("decline"))
    return "Ödəniş rədd edildi. Bankınızla əlaqə saxlayın.";
  if (
    msg.includes("server") ||
    msg.includes("technical") ||
    msg.includes("system")
  )
    return "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin.";
  return "Ödəniş rədd edildi. Kartınızda kifayət qədər məbləğ yoxdur. Başqa kart ilə cəhd edin.";
};

module.exports = {
  encodeData,
  decodeData,
  buildSignature,
  verifySignature,
  createPayment,
  getTransactionStatus,
  getAzPaymentErrorMessage,
};
