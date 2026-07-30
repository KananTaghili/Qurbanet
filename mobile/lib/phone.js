export const MAX_PHONES = 2;

export const AZ_OPERATORS = ["10", "12", "18", "20", "40", "41", "44", "50", "51", "55", "60", "70", "77", "99"];

export const formatPhone = (input) => {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.startsWith("0")) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

export const isValidAzPhone = (formatted) => {
  const d = formatted.replace(/\D/g, "");
  if (d.length === 9) return AZ_OPERATORS.includes(d.slice(0, 2));
  if (d.length === 10 && d.startsWith("0")) return AZ_OPERATORS.includes(d.slice(1, 3));
  return false;
};

export const toE164 = (formatted) => {
  const d = formatted.replace(/\D/g, "");
  return "+994" + (d.startsWith("0") ? d.slice(1) : d);
};

export const fromE164 = (e164) => {
  const stripped = (e164 || "").replace(/^\+994/, "").replace(/\D/g, "");
  return stripped ? formatPhone(stripped) : "";
};
