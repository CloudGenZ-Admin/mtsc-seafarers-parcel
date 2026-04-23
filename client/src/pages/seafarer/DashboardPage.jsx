import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StationContact from '../../components/common/StationContact';

export default function DashboardPage() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingInput, setTrackingInput] = useState({});
  const [shippingFromInput, setShippingFromInput] = useState({});
  const [arrivalDateInput, setArrivalDateInput] = useState({});
  const [qrData, setQrData] = useState({});

  useEffect(() => { fetchParcels(); }, []);
  const fetchParcels = async () => {
    try { const { data } = await api.get('/parcels/active'); setParcels(data); }
    catch {} finally { setLoading(false); }
  };
  const addTracking = async (id) => {
    try {
      await api.patch(`/parcels/${id}/tracking`, {
        trackingLink: trackingInput[id],
        shippingFrom: shippingFromInput[id] || undefined,
        estimatedArrival: arrivalDateInput[id] || undefined,
      });
      fetchParcels();
    } catch {}
  };
  const showQR = async (id) => {
    try { const { data } = await api.get(`/parcels/${id}/qrcode`); setQrData(prev => ({ ...prev, [id]: data.qrCodeDataUrl })); } catch {}
  };

  if (loading) return <LoadingSpinner text="Loading your parcels..." />;

  return (
    <div className="container">
      <div className="flex-between mb-20">
        <div>
          <h1 className="page-title">My Parcels</h1>
          <p style={{ color: '#64748b' }}>Track your active parcel requests</p>
        </div>
        <Link to="/parcels/new" className="btn btn-accent">New Parcel</Link>
      </div>

      {parcels.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px 28px' }}>
          <div style={{ fontSize: 56, marginBottom: 16, color: '#cbd5e1' }}>—</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No active parcels</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Send your first parcel to a Canadian port station</p>
          <Link to="/parcels/new" className="btn btn-primary">Send a Parcel</Link>
        </div>
      ) : parcels.map(p => (
        <div className="card" key={p.id}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', marginTop: 2 }}>{p.referenceNumber}</p>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15, color: '#475569' }}>
            <div><span style={{ color: '#94a3b8' }}>Station</span><br /><strong>{p.stationName}</strong>{p.stationAddress && <span style={{ display: 'block', fontSize: 13, color: '#64748b', fontWeight: 400, marginTop: 2 }}>{p.stationAddress}</span>}</div>
            <div><span style={{ color: '#94a3b8' }}>Size</span><br /><strong>{p.size}</strong></div>
            {p.trackingLink && <div><span style={{ color: '#94a3b8' }}>Tracking</span><br /><a href={p.trackingLink} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>View Tracking</a></div>}
            {p.shippingFrom && <div><span style={{ color: '#94a3b8' }}>Shipped From</span><br /><strong>{p.shippingFrom}</strong></div>}
            {p.estimatedArrival && <div><span style={{ color: '#94a3b8' }}>Est. Arrival</span><br /><strong>{new Date(p.estimatedArrival).toLocaleDateString()}</strong></div>}
          </div>
          <StationContact phone={p.stationPhone} email={p.stationEmail} />

          {p.status === 'AwaitingShipment' && (
            <div style={{ marginTop: 20, padding: 16, background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 10 }}>Add your shipping details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input placeholder="Tracking link (optional)" value={trackingInput[p.id] || ''}
                  onChange={e => setTrackingInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                  style={{ padding: '11px 14px', fontSize: 16, border: '2px solid #e2e8f0', borderRadius: 10, background: '#fff' }} />
                <input placeholder="Shipping from — store name (optional)" value={shippingFromInput[p.id] || ''}
                  onChange={e => setShippingFromInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                  style={{ padding: '11px 14px', fontSize: 16, border: '2px solid #e2e8f0', borderRadius: 10, background: '#fff' }} />
                <div>
                  <label style={{ fontSize: 13, color: '#64748b', marginBottom: 4, display: 'block' }}>Estimated arrival date (optional)</label>
                  <input type="date" value={arrivalDateInput[p.id] || ''}
                    onChange={e => setArrivalDateInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                    style={{ padding: '11px 14px', fontSize: 16, border: '2px solid #e2e8f0', borderRadius: 10, background: '#fff', width: '100%' }} />
                </div>
                <button className="btn btn-secondary" onClick={() => addTracking(p.id)}>Mark as Shipped</button>
              </div>
            </div>
          )}

          {p.status === 'Arrived' && (
            <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              {qrData[p.id] ? (
                <>
                  <p style={{ fontWeight: 600, color: '#065f46', marginBottom: 12 }}>Show this QR code at the station</p>
                  <img src={qrData[p.id]} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => showQR(p.id)}>Show Pickup QR Code</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
