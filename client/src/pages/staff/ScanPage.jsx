import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';

export default function ScanPage() {
  const [refInput, setRefInput] = useState('');
  const [parcel, setParcel] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const sigRef = useRef(null);
  const scannerRef = useRef(null);

  const lookup = async (ref) => {
    setError(''); setParcel(null); setDelivered(false);
    try { const { data } = await api.get(`/station/parcels/lookup/${ref}`); setParcel(data); }
    catch (err) { setError(err.response?.data?.error?.message || 'Parcel not found.'); }
  };

  const startScanner = async () => {
    setScanning(true); setError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 },
        (text) => { scanner.stop().catch(() => {}); setScanning(false); lookup(text); }, () => {});
    } catch { setError('Camera access denied. Please use manual entry below.'); setScanning(false); }
  };

  const stopScanner = () => { scannerRef.current?.stop().catch(() => {}); setScanning(false); };
  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  const confirmDelivery = async () => {
    if (sigRef.current?.isEmpty()) { setError('Please ask the seafarer to sign before confirming.'); return; }
    setDelivering(true); setError('');
    try {
      await api.post(`/station/parcels/${parcel.id}/deliver`, { signatureDataUrl: sigRef.current.toDataURL('image/png') });
      setDelivered(true);
    } catch (err) { setError(err.response?.data?.error?.message || 'Delivery confirmation failed.'); }
    finally { setDelivering(false); }
  };

  const reset = () => { setParcel(null); setDelivered(false); setRefInput(''); setError(''); };

  return (
    <div className="container">
      <h1 className="page-title">Parcel Pickup</h1>
      <p className="page-subtitle">Scan a QR code or enter a reference number to process a pickup</p>

      {!parcel && !delivered && (
        <>
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Scan QR Code</h2>
            <div id="qr-reader" style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden' }} />
            {!scanning
              ? <button className="btn btn-primary btn-block" onClick={startScanner}>Open Camera</button>
              : <button className="btn btn-danger btn-block" onClick={stopScanner}>Stop Camera</button>}
          </div>
          <div style={{ textAlign: 'center', padding: '8px 0', color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>— OR —</div>
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Enter Reference Number</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={refInput} onChange={e => setRefInput(e.target.value.toUpperCase())} placeholder="e.g. MTSC-A3F7K2B9"
                style={{ flex: 1, minWidth: 200, padding: '12px 14px', fontSize: 17, border: '2px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', fontFamily: 'monospace' }} />
              <button className="btn btn-secondary" onClick={() => lookup(refInput)}>Look Up</button>
            </div>
          </div>
        </>
      )}

      {error && <div className="error-msg mb-20">{error}</div>}

      {parcel && !delivered && (
        <div className="card" style={{ padding: 32 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parcel Found</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{parcel.referenceNumber}</p>
            </div>
            <StatusBadge status={parcel.status} />
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15, color: '#475569', marginBottom: 20 }}>
            <div><span style={{ color: '#94a3b8' }}>Seafarer</span><br /><strong>{parcel.seafarerEmail || parcel.User?.email}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Size</span><br /><strong>{parcel.size}</strong></div>
          </div>

          {parcel.status === 'Arrived' ? (
            <div style={{ padding: 20, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: 14, border: '1px solid #fde68a' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Seafarer Signature</h3>
              <p style={{ fontSize: 14, color: '#a16207', marginBottom: 14 }}>Ask the seafarer to sign below with their finger or mouse</p>
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
            <div className="error-msg">This parcel is not ready for pickup (status: {parcel.status})</div>
          )}
          <button className="btn btn-outline mt-20" onClick={reset}>← Scan Another</button>
        </div>
      )}

      {delivered && (
        <div className="card card-success text-center" style={{ padding: 48 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Complete</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>Delivery Confirmed!</h2>
          <p style={{ color: '#047857', marginTop: 8, fontSize: 17 }}>The seafarer has been notified by email</p>
          <button className="btn btn-primary mt-20" onClick={reset}>Scan Next Parcel</button>
        </div>
      )}
    </div>
  );
}
