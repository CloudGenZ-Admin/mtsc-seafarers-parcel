import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { email, password });
      login(data.token, data);
      navigate('/parcels/new');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="https://mtsc.ca/wp-content/uploads/2025/09/seafarers-logo.png.webp" alt="Mission to Seafarers Canada" style={{ height: 60, marginBottom: 16, borderRadius: 8 }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Create Your Account</h1>
          <p style={{ color: '#64748b', marginTop: 6 }}>Sign up to send parcels to any Canadian port station</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />
              <p className="help-text">Choose a strong password with 8 or more characters</p>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#64748b' }}>Already have an account? <Link to="/login">Sign in</Link></p>
          <p style={{ marginTop: 12 }}><Link to="/staff/login" style={{ color: '#94a3b8', fontSize: 14 }}>Station Staff Login →</Link></p>
        </div>
      </div>
    </div>
  );
}
