const config = {
  AwaitingShipment: { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Awaiting Shipment' },
  Shipped: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', label: 'Shipped' },
  Arrived: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', label: 'Ready for Pickup' },
  Delivered: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Delivered' },
};

export default function StatusBadge({ status }) {
  const c = config[status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '6px 14px', borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 14, fontWeight: 600,
    }}>
      {c.label}
    </span>
  );
}
