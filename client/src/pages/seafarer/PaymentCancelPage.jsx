import { Link } from 'react-router-dom';

export default function PaymentCancelPage() {
  return (
    <div className="container">
      <div className="card text-center" style={{ maxWidth: 500, margin: '40px auto' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Payment Not Completed</div>
        <h1 className="page-title">Payment Cancelled</h1>
        <p className="page-subtitle">Your payment was not completed. No charges were made.</p>
        <Link to="/parcels/new" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Try Again</Link>
        <br />
        <Link to="/dashboard" className="btn btn-outline mt-12" style={{ display: 'inline-block' }}>Back to Dashboard</Link>
      </div>
    </div>
  );
}
