export function getInitials(user) {
  return (
    [user?.name, user?.lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function formatPhone(val) {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

export function toE164(phone) {
  const raw = phone.replace(/\s/g, "");
  if (raw.startsWith("0")) return "+994" + raw.slice(1);
  if (raw.startsWith("+994")) return raw;
  return "+994" + raw;
}
