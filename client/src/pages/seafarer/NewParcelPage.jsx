import { useState, useEffect } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SIZES = [
  { value: 'Small', fee: '$15.00', desc: 'Fits in a shoebox' },
  { value: 'Medium', fee: '$20.00', desc: 'Up to a carry-on bag' },
  { value: 'Large', fee: '$30.00', desc: 'Suitcase-sized or larger' },
];

export default function NewParcelPage() {
  const [stations, setStations] = useState([]);
  const [prefs, setPrefs] = useState([]);
  const [stationId, setStationId] = useState('');
  const [size, setSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/stations'), api.get('/preferences/stations')])
      .then(([s, p]) => { setStations(s.data); setPrefs(p.data.map(x => x.stationId)); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const togglePref = async (sid) => {
    if (prefs.includes(sid)) {
      await api.delete(`/preferences/stations/${sid}`);
      setPrefs(prev => prev.filter(x => x !== sid));
    } else {
      await api.post('/preferences/stations', { stationId: sid });
      setPrefs(prev => [...prev, sid]);
    }
  };

  const sorted = [...stations].sort((a, b) => (prefs.includes(a.id) ? 0 : 1) - (prefs.includes(b.id) ? 0 : 1));

  const handleSubmit = async () => {
    if (!stationId || !size) { setError('Please select a station and parcel size.'); return; }
    setError(''); setSubmitting(true);
    try {
      const { data } = await api.post('/parcels', { stationId, size });
      localStorage.setItem('pendingParcel', JSON.stringify({ size, stationId }));
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create payment session.');
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading stations..." />;
  const selectedStation = stations.find(s => s.id === stationId);

  return (
    <div className="container">
      <h1 className="page-title">Send a New Parcel</h1>
      <p className="page-subtitle">Choose a station and parcel size, then pay the handling fee</p>
      {error && <div className="error-msg mb-20">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ background: 'linear-gradient(135deg, #d05535, #b84a2e)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>1</span>
          <h2 style={{ fontSize: 19, fontWeight: 700 }}>Choose a Station</h2>
        </div>
        <p className="help-text" style={{ marginBottom: 16 }}>Tap ★ to save a favourite station</p>
        {sorted.map(s => (
          <div key={s.id} onClick={() => setStationId(s.id)} style={{
            padding: '14px 16px', borderRadius: 12, marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
            border: stationId === s.id ? '2px solid #d05535' : '2px solid #e2e8f0',
            background: stationId === s.id ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>{s.name}</p>
              <p style={{ color: '#64748b', fontSize: 14 }}>{s.address}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); togglePref(s.id); }}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: prefs.includes(s.id) ? '#f59e0b' : '#d1d5db', transition: 'color 0.2s' }}
              aria-label={prefs.includes(s.id) ? 'Remove from favourites' : 'Add to favourites'}>
              {prefs.includes(s.id) ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ background: 'linear-gradient(135deg, #d05535, #b84a2e)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>2</span>
          <h2 style={{ fontSize: 19, fontWeight: 700 }}>Choose Parcel Size</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {SIZES.map(s => (
            <div key={s.value} onClick={() => setSize(s.value)} style={{
              flex: '1 1 140px', padding: '18px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              border: size === s.value ? '2px solid #d05535' : '2px solid #e2e8f0',
              background: size === s.value ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : '#fff',
            }}>
              <p style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{s.value}</p>
              <p style={{ fontWeight: 800, fontSize: 20, color: '#d05535', marginTop: 2 }}>{s.fee}</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {stationId && size && (
        <div className="card card-gold">
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 6 }}>
            <span style={{ color: '#64748b' }}>Station</span><strong>{selectedStation?.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 6 }}>
            <span style={{ color: '#64748b' }}>Size</span><strong>{size}</strong>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
            <span style={{ fontWeight: 600 }}>Handling Fee</span><strong style={{ color: '#d05535' }}>{SIZES.find(s => s.value === size)?.fee} CAD</strong>
          </div>
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={submitting || !stationId || !size}
        style={{ fontSize: 18, padding: '16px 28px' }}>
        {submitting ? 'Redirecting to Payment...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}
