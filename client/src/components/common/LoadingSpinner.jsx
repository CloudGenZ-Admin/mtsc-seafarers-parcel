export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: 44, height: 44, margin: '0 auto 20px',
        border: '3px solid #e2e8f0', borderTop: '3px solid #d05535',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 17, color: '#64748b', fontWeight: 500 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
