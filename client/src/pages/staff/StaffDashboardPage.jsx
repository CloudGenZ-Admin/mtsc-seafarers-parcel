import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParcels = async () => {
    try { const { data } = await api.get('/station/parcels/incoming'); setParcels(data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchParcels(); }, []);

  const markArrived = async (id) => {
    try { await api.patch(`/station/parcels/${id}/arrived`); fetchParcels(); } catch {}
  };

  if (loading) return <LoadingSpinner text="Loading incoming parcels..." />;

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#d05535', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Station Dashboard</p>
        <h1 className="page-title">{user?.stationName || 'Station'}</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link to="/staff/scan" className="btn btn-accent" style={{ flex: 1, minWidth: 160 }}>Scan QR for Pickup</Link>
        <Link to="/staff/reports" className="btn btn-outline" style={{ flex: 1, minWidth: 160 }}>Revenue Reports</Link>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#475569' }}>
        Incoming Parcels <span style={{ background: '#e2e8f0', padding: '2px 10px', borderRadius: 12, fontSize: 14, marginLeft: 8 }}>{parcels.length}</span>
      </h2>

      {parcels.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px 28px' }}>
          <div style={{ fontSize: 48, marginBottom: 12, color: '#cbd5e1' }}>—</div>
          <p style={{ fontSize: 18, color: '#64748b' }}>No incoming parcels at this time</p>
        </div>
      ) : parcels.map(p => (
        <div className="card" key={p.id}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{p.referenceNumber}</p>
            <StatusBadge status={p.status} />
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15, color: '#475569' }}>
            <div><span style={{ color: '#94a3b8' }}>Seafarer</span><br /><strong>{p.seafarerEmail || p.User?.email}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Size</span><br /><strong>{p.size}</strong></div>
            {p.trackingLink && <div><span style={{ color: '#94a3b8' }}>Tracking</span><br /><a href={p.trackingLink} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>View Tracking</a></div>}
            {p.shippingFrom && <div><span style={{ color: '#94a3b8' }}>Shipped From</span><br /><strong>{p.shippingFrom}</strong></div>}
          </div>
          {p.status === 'Shipped' && (
            <button className="btn btn-secondary mt-20" onClick={() => markArrived(p.id)}>Mark as Arrived</button>
          )}
        </div>
      ))}
    </div>
  );
}
