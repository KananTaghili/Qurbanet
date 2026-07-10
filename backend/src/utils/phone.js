/**
 * Azərbaycan telefon nömrəsi normallaşdırması
 * Qəbul olunan formatlar: +994501234567, 0501234567, 994501234567
 * Çıxış formatı: +994XXXXXXXXXX
 */
const AZ_OPS = "10|20|40|41|44|50|51|55|60|70|77|99";

const normalizeAzPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

  if (new RegExp(`^\\+994(${AZ_OPS})\\d{7}$`).test(cleaned)) return cleaned;
  if (new RegExp(`^994(${AZ_OPS})\\d{7}$`).test(cleaned)) return `+${cleaned}`;
  if (new RegExp(`^0(${AZ_OPS})\\d{7}$`).test(cleaned)) return `+994${cleaned.slice(1)}`;
  return null;
};

module.exports = { normalizeAzPhone };
