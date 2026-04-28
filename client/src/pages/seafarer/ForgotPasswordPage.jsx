import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('OTP sent to your email. Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', { email, otp });
      setMessage('OTP verified successfully');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '40px', maxWidth: '450px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '28px', textAlign: 'center' }}>Reset Password</h1>
        <p style={{ color: '#666', marginBottom: '30px', textAlign: 'center' }}>
          {step === 1 && 'Enter your email to receive an OTP'}
          {step === 2 && 'Enter the OTP sent to your email'}
          {step === 3 && 'Create a new password'}
        </p>

        {error && (
          <div style={{ background: '#fee', border: '1px solid #fcc', color: '#c33', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: '#efe', border: '1px solid #cfc', color: '#3c3', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
            {message}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1B2A4A', fontWeight: '500' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#ccc' : '#1B2A4A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '15px' }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '14px', background: 'transparent', color: '#1B2A4A', border: '1px solid #1B2A4A', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1B2A4A', fontWeight: '500' }}>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="123456"
                maxLength="6"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>OTP expires in 15 minutes</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{ width: '100%', padding: '14px', background: loading || otp.length !== 6 ? '#ccc' : '#1B2A4A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', marginBottom: '15px' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ width: '100%', padding: '14px', background: 'transparent', color: '#1B2A4A', border: '1px solid #1B2A4A', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1B2A4A', fontWeight: '500' }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1B2A4A', fontWeight: '500' }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#ccc' : '#1B2A4A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
