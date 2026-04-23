export default function StationContact({ phone, email, style }) {
  if (!phone && !email) return null;
  return (
    <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd', fontSize: 14, color: '#0369a1', ...style }}>
      <span style={{ fontWeight: 600 }}>Need help? Contact the station:</span>
      {phone && <span style={{ marginLeft: 8 }}><a href={`tel:${phone}`} style={{ color: '#0369a1', textDecoration: 'none', fontWeight: 600 }}>{phone}</a></span>}
      {phone && email && <span style={{ margin: '0 6px', color: '#93c5fd' }}>·</span>}
      {email && <span><a href={`mailto:${email}`} style={{ color: '#0369a1', textDecoration: 'none', fontWeight: 600 }}>{email}</a></span>}
    </div>
  );
}
