import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function StaffLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/station/login', { username, password });
      login(data.token, data);
      navigate('/staff/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="https://mtsc.ca/wp-content/uploads/2025/09/seafarers-logo.png.webp" alt="Mission to Seafarers Canada" style={{ height: 60, marginBottom: 16, borderRadius: 8 }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Station Staff Login</h1>
          <p style={{ color: '#64748b', marginTop: 6 }}>Log in with your station credentials</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Station username" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Station password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20 }}><Link to="/login" style={{ color: '#0369a1', fontSize: 15, fontWeight: 700 }}>← Seafarer Login</Link></p>
      </div>
    </div>
  );
}
