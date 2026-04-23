import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [incomingOpen, setIncomingOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);

  // Scan / pickup state
  const [scanMode, setScanMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [scannedParcel, setScannedParcel] = useState(null);
  const [scanError, setScanError] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const sigRef = useRef(null);
  const scannerRef = useRef(null);

  const fetchAll = async (q) => {
    try {
      const params = q ? { search: q } : {};
      const [inc, pend] = await Promise.all([
        api.get('/station/parcels/incoming', { params }),
        api.get('/station/parcels/pending-pickup', { params }),
      ]);
      setIncoming(inc.data);
      setPending(pend.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(''); }, []);

  const handleSearch = () => { setLoading(true); fetchAll(search); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  const clearSearch = () => { setSearch(''); setLoading(true); fetchAll(''); };

  const markArrived = async (id) => {
    try { await api.patch(`/station/parcels/${id}/arrived`); fetchAll(search); } catch {}
  };

  // QR Scanner
  const startScanner = async () => {
    setScanMode(true); setScanning(true); setScanError(''); setScannedParcel(null); setDelivered(false);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // Small delay to let the DOM render the qr-reader div
      await new Promise(r => setTimeout(r, 100));
      const scanner = new Html5Qrcode('qr-reader-inline');
      scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 },
        (text) => { scanner.stop().catch(() => {}); setScanning(false); lookupRef(text); }, () => {});
    } catch { setScanError('Camera access denied. Use manual entry below.'); setScanning(false); }
  };

  const stopScanner = () => { scannerRef.current?.stop().catch(() => {}); setScanning(false); };
  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  const lookupRef = async (ref) => {
    setScanError(''); setScannedParcel(null); setDelivered(false);
    try { const { data } = await api.get(`/station/parcels/lookup/${ref}`); setScannedParcel(data); }
    catch (err) { setScanError(err.response?.data?.error?.message || 'Parcel not found.'); }
  };

  const confirmDelivery = async () => {
    if (sigRef.current?.isEmpty()) { setScanError('Please ask the seafarer to sign before confirming.'); return; }
    setDelivering(true); setScanError('');
    try {
      await api.post(`/station/parcels/${scannedParcel.id}/deliver`, { signatureDataUrl: sigRef.current.toDataURL('image/png') });
      setDelivered(true);
      fetchAll(search);
    } catch (err) { setScanError(err.response?.data?.error?.message || 'Delivery confirmation failed.'); }
    finally { setDelivering(false); }
  };

  const resetScan = () => { setScannedParcel(null); setDelivered(false); setRefInput(''); setScanError(''); setScanMode(false); };

  if (loading) return <LoadingSpinner text="Loading parcels..." />;

  const SectionHeader = ({ title, count, open, onToggle }) => (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 0', userSelect: 'none' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#475569', margin: 0 }}>
        {title} <span style={{ background: '#e2e8f0', padding: '2px 10px', borderRadius: 12, fontSize: 14, marginLeft: 8 }}>{count}</span>
      </h2>
      <span style={{ fontSize: 20, color: '#94a3b8', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
    </div>
  );

  const ParcelCard = ({ p, actions }) => (
    <div className="card" key={p.id}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{p.referenceNumber}</p>
        <StatusBadge status={p.status} />
      </div>
      <div className="divider" />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15, color: '#475569' }}>
        <div><span style={{ color: '#94a3b8' }}>Seafarer</span><br /><strong>{p.seafarerName || p.seafarerEmail}</strong></div>
        {p.seafarerPhone && <div><span style={{ color: '#94a3b8' }}>Phone</span><br /><strong>{p.seafarerPhone}</strong></div>}
        <div><span style={{ color: '#94a3b8' }}>Size</span><br /><strong>{p.size}</strong></div>
        {p.estimatedArrival && <div><span style={{ color: '#94a3b8' }}>Est. Arrival</span><br /><strong style={{ color: '#0369a1' }}>{new Date(p.estimatedArrival).toLocaleDateString()}</strong></div>}
        {p.trackingLink && <div><span style={{ color: '#94a3b8' }}>Tracking</span><br /><a href={p.trackingLink} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>View</a></div>}
        {p.shippingFrom && <div><span style={{ color: '#94a3b8' }}>From</span><br /><strong>{p.shippingFrom}</strong></div>}
        {p.arrivedAt && <div><span style={{ color: '#94a3b8' }}>Arrived</span><br /><strong>{new Date(p.arrivedAt).toLocaleDateString()}</strong></div>}
      </div>
      {actions}
    </div>
  );

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#d05535', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Station Dashboard</p>
        <h1 className="page-title">{user?.stationName || 'Station'}</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className="btn btn-accent" style={{ flex: 1, minWidth: 160 }} onClick={startScanner}>Scan QR for Pickup</button>
      </div>

      {/* Inline QR Scanner / Pickup Flow */}
      {scanMode && (
        <div className="card" style={{ padding: 24, marginBottom: 20, border: '2px solid #d05535' }}>
          {!scannedParcel && !delivered && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Scan QR Code for Pickup</h2>
              <div id="qr-reader-inline" style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden' }} />
              {scanning && <button className="btn btn-danger btn-block" onClick={stopScanner}>Stop Camera</button>}
              <div style={{ textAlign: 'center', padding: '8px 0', color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>— OR —</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input value={refInput} onChange={e => setRefInput(e.target.value.toUpperCase())} placeholder="e.g. MTSC-A3F7K2B9"
                  style={{ flex: 1, minWidth: 200, padding: '12px 14px', fontSize: 17, border: '2px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', fontFamily: 'monospace' }} />
                <button className="btn btn-secondary" onClick={() => lookupRef(refInput)}>Look Up</button>
              </div>
              <button className="btn btn-outline mt-20" onClick={resetScan}>Cancel</button>
            </>
          )}

          {scanError && <div className="error-msg mb-20">{scanError}</div>}

          {scannedParcel && !delivered && (
            <>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Parcel Found</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{scannedParcel.referenceNumber}</p>
                </div>
                <StatusBadge status={scannedParcel.status} />
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15, color: '#475569', marginBottom: 20 }}>
                <div><span style={{ color: '#94a3b8' }}>Seafarer</span><br /><strong>{scannedParcel.seafarerName || scannedParcel.seafarerEmail}</strong></div>
                {scannedParcel.seafarerPhone && <div><span style={{ color: '#94a3b8' }}>Phone</span><br /><strong>{scannedParcel.seafarerPhone}</strong></div>}
                <div><span style={{ color: '#94a3b8' }}>Size</span><br /><strong>{scannedParcel.size}</strong></div>
              </div>
              {scannedParcel.status === 'Arrived' ? (
                <div style={{ padding: 20, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: 14, border: '1px solid #fde68a' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Seafarer Signature</h3>
                  <p style={{ fontSize: 14, color: '#a16207', marginBottom: 14 }}>Ask the seafarer to sign below</p>
                  <div style={{ border: '2px solid #e2e8f0', borderRadius: 12, background: '#fff', overflow: 'hidden', marginBottom: 14 }}>
                    <SignatureCanvas ref={sigRef} canvasProps={{ width: 700, height: 180, style: { width: '100%', height: 180 } }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => sigRef.current?.clear()}>Clear</button>
                    <button className="btn btn-primary" onClick={confirmDelivery} disabled={delivering} style={{ flex: 1 }}>
                      {delivering ? 'Confirming...' : 'Confirm Delivery'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="error-msg">This parcel is not ready for pickup (status: {scannedParcel.status})</div>
              )}
              <button className="btn btn-outline mt-20" onClick={resetScan}>← Back</button>
            </>
          )}

          {delivered && (
            <div className="text-center" style={{ padding: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', textTransform: 'uppercase', marginBottom: 8 }}>Complete</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>Delivery Confirmed!</h2>
              <p style={{ color: '#047857', marginTop: 8, fontSize: 17 }}>The seafarer has been notified by email</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => { setScannedParcel(null); setDelivered(false); setRefInput(''); setScanError(''); startScanner(); }}>Scan Next</button>
                <button className="btn btn-outline" onClick={resetScan}>Done</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input placeholder="Search by name, email, reference, or store..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
          style={{ flex: 1, padding: '12px 16px', fontSize: 16, border: '2px solid #e2e8f0', borderRadius: 10, background: '#fff' }} />
        <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
        {search && <button className="btn btn-outline" onClick={clearSearch}>Clear</button>}
      </div>

      {/* Incoming Parcels - Collapsible */}
      <SectionHeader title="Incoming Parcels" count={incoming.length} open={incomingOpen} onToggle={() => setIncomingOpen(!incomingOpen)} />
      {incomingOpen && (
        incoming.length === 0 ? (
          <div className="card text-center" style={{ padding: '36px 28px' }}>
            <p style={{ fontSize: 16, color: '#64748b' }}>{search ? 'No incoming parcels match your search' : 'No incoming parcels'}</p>
          </div>
        ) : incoming.map(p => (
          <ParcelCard key={p.id} p={p} actions={
            p.status === 'Shipped' ? <button className="btn btn-secondary mt-20" onClick={() => markArrived(p.id)}>Mark as Arrived</button> : null
          } />
        ))
      )}

      {/* Pending Pickup - Collapsible */}
      <div style={{ marginTop: 12 }} />
      <SectionHeader title="Pending Pickup" count={pending.length} open={pendingOpen} onToggle={() => setPendingOpen(!pendingOpen)} />
      {pendingOpen && (
        pending.length === 0 ? (
          <div className="card text-center" style={{ padding: '36px 28px' }}>
            <p style={{ fontSize: 16, color: '#64748b' }}>{search ? 'No pending pickups match your search' : 'No parcels awaiting pickup'}</p>
          </div>
        ) : pending.map(p => (
          <ParcelCard key={p.id} p={p} actions={
            <button className="btn btn-accent mt-20" onClick={() => { setScanMode(true); setScannedParcel(p); setDelivered(false); setScanError(''); }}>Process Pickup</button>
          } />
        ))
      )}
    </div>
  );
}
