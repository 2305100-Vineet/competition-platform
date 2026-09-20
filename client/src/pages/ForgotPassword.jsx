import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordInput from '../components/PasswordInput';
export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const requestOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      setStep('otp');
      startCooldown(res.data.cooldownSeconds || 60);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response.data.message);
        startCooldown(err.response.data.retryAfterSeconds || 60);
        setStep('otp');
      } else {
        setError(err.response?.data?.message || 'Something went wrong');
      }
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p className="auth-subtitle">
          {step === 'email' ? "We'll email you a verification code" : `Enter the code sent to ${email}`}
        </p>

        {step === 'email' && (
          <form onSubmit={requestOtp}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block">Send Code</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={submitReset}>
            <div className="field-group">
              <label className="field-label">Verification code</label>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">New password</label>
             <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required />
            </div>
            {message && <p className="success-text">{message}</p>}
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block">Reset Password</button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              disabled={cooldown > 0}
              onClick={requestOtp}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </form>
        )}

        <div className="auth-footer-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}