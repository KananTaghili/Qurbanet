// Mobile-app aligned status badge with dot indicator
const STATUS_MAP = {
  placed:          { label: 'Gözləmədə',       bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  pending_payment: { label: 'Ödəniş gözlənilir', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  confirmed:       { label: 'Təsdiqləndi',      bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  slaughtering:    { label: 'Kəsilir',           bg: '#FEF2F2', color: '#7C2D12', dot: '#EF4444' },
  preparing:       { label: 'Hazırlanır',        bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  delivering:      { label: 'Çatdırılır',        bg: '#EFF6FF', color: '#1E3A8A', dot: '#3B82F6' },
  completed:       { label: 'Tamamlandı',        bg: '#F0FDF4', color: '#14532D', dot: '#22C55E' },
  cancelled:       { label: 'Ləğv edildi',       bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
  paid:            { label: 'Ödənilib',          bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  processing:      { label: 'İşlənir',           bg: '#F5F3FF', color: '#5B21B6', dot: '#8B5CF6' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || { label: status, bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
