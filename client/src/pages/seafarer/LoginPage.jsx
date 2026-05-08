import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your email and password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      {/* Hero Image Section */}
      <div style={{ 
        width: '100%',
        backgroundColor: '#0f4c81',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0
      }}>
        <img 
          src="/Home.jpeg" 
          alt="Mission to Seafarers" 
          style={{ 
            width: '100%',
            maxWidth: '75%',
            height: 'auto',
            display: 'block',
            margin: 0,
            padding: 0
          }} 
          className="hero-banner"
        />
      </div>

      {/* Login Form Section */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px 20px',
        backgroundColor: '#e8eef3',
        minHeight: '60vh'
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Welcome Back</h1>
            <p style={{ color: '#64748b', fontSize: 15 }}>Log in to manage your parcel pickups</p>
          </div>
          <div className="card" style={{ padding: 32, backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" style={{ textTransform: 'uppercase', fontSize: '13px', fontWeight: 600, color: '#475569' }}>EMAIL ADDRESS</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="password" style={{ textTransform: 'uppercase', fontSize: '13px', fontWeight: 600, color: '#475569' }}>PASSWORD</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <Link to="/forgot-password" style={{ color: '#d05535', fontSize: '14px', fontWeight: '600' }}>Forgot Password?</Link>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ backgroundColor: '#1e3a5f', borderColor: '#1e3a5f', padding: '12px', fontSize: '15px', fontWeight: 600 }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ color: '#64748b', fontSize: 15 }}>Don't have an account? <Link to="/register" style={{ color: '#d05535', fontWeight: 600 }}>Create one</Link></p>
            <p style={{ marginTop: 12 }}><Link to="/staff/login" style={{ color: '#0369a1', fontSize: 15, fontWeight: 600 }}>Station Staff Login →</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
