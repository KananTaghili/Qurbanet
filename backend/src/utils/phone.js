/**
 * Azərbaycan telefon nömrəsi normallaşdırması
 * Qəbul olunan formatlar: +994501234567, 0501234567, 994501234567
 * Çıxış formatı: +994XXXXXXXXXX
 */
const normalizeAzPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

  if (/^\+994(50|51|55|60|70|77|99)\d{7}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^994(50|51|55|60|70|77|99)\d{7}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^0(50|51|55|60|70|77|99)\d{7}$/.test(cleaned)) {
    return `+994${cleaned.slice(1)}`;
  }
  return null;
};

module.exports = { normalizeAzPhone };
