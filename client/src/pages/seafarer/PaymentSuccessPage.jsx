import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [parcel, setParcel] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sessionId = searchParams.get('session_id');
    if (!sessionId) { setError('No payment session found.'); setLoading(false); return; }
    const size = searchParams.get('size') || JSON.parse(localStorage.getItem('pendingParcel') || '{}').size;
    const stationId = searchParams.get('stationId') || JSON.parse(localStorage.getItem('pendingParcel') || '{}').stationId;
    api.post('/parcels/confirm-payment', { sessionId, size, stationId })
      .then(({ data }) => { if (!cancelled) { setParcel(data); localStorage.removeItem('pendingParcel'); } })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error?.message || 'Unable to verify payment.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner text="Confirming your payment..." />;
  if (error) return (
    <div className="container" style={{ maxWidth: 500, margin: '60px auto' }}>
      <div className="card text-center" style={{ padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h1 className="page-title">Payment Issue</h1>
        <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>
        <Link to="/parcels/new" className="btn btn-primary mt-20">Try Again</Link>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="card card-success text-center" style={{ padding: 40 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Payment Confirmed</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#065f46' }}>Payment Successful!</h1>
        <p style={{ color: '#047857', marginTop: 6 }}>Your parcel request has been created</p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>What to Do Next</h2>

        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
          <div>
            <p style={{ fontWeight: 600, color: '#0f172a' }}>Write this reference number on your package</p>
            <div style={{ marginTop: 10, padding: '14px 20px', background: 'linear-gradient(135deg, #0f2744, #1e3a5f)', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', letterSpacing: 3, fontFamily: 'monospace' }}>{parcel.referenceNumber}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
          <div>
            <p style={{ fontWeight: 600, color: '#0f172a' }}>Ship your package to</p>
            <div style={{ marginTop: 8, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 700, fontSize: 17 }}>{parcel.stationName}</p>
              <p style={{ color: '#64748b', fontSize: 15 }}>{parcel.stationAddress}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
          <p style={{ fontWeight: 600, color: '#0f172a', paddingTop: 6 }}>Once shipped, add your tracking number on the dashboard</p>
        </div>
      </div>

      <Link to="/dashboard" className="btn btn-primary btn-block" style={{ fontSize: 18 }}>Go to My Parcels →</Link>
    </div>
  );
}
