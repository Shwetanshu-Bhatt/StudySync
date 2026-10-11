import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setStep('reset');
      setNotice(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request a reset code.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, code, password });
      setStep('done');
      setNotice(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setNotice(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request another code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-story">
          <Link to="/login" className="auth-brand">
            <span className="auth-mark"><img src="/studySync.svg" alt="" /></span>
            <span>StudySync</span>
          </Link>
          <div className="auth-story-copy">
            <p className="auth-kicker">ACCOUNT RECOVERY</p>
            <h1>Get back to your learning.</h1>
            <p>We’ll send a short-lived code to your account email so you can choose a new password.</p>
          </div>
          <div className="auth-story-footer"><span>Materials</span><span>Courses</span><span>Community</span></div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-mobile-brand">
            <span className="auth-mark"><img src="/studySync.svg" alt="" /></span>
            <span>StudySync</span>
          </div>
          <div className="auth-form-content">
            <p className="auth-kicker">PASSWORD HELP</p>
            <h2>{step === 'done' ? 'Password updated' : step === 'reset' ? 'Choose a new password' : 'Forgot your password?'}</h2>
            <p className="auth-intro">{step === 'request' ? 'Enter the email address on your account.' : 'Enter the code from your email and your new password.'}</p>

            {error && <div className="auth-error" role="alert"><span>{error}</span></div>}
            {notice && <div className="auth-note" role="status">{notice}</div>}

            {step === 'request' && (
              <form onSubmit={requestCode} className="auth-form">
                <label className="auth-field">
                  <span>Email address</span>
                  <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
                </label>
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset code'}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={resetPassword} className="auth-form">
                <label className="auth-field">
                  <span>Email address</span>
                  <input type="email" value={email} readOnly />
                </label>
                <label className="auth-field">
                  <span>Reset code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>New password</span>
                  <input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
                </label>
                <label className="auth-field">
                  <span>Confirm new password</span>
                  <input type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                </label>
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Updating…' : 'Reset password'}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </form>
            )}

            {step === 'reset' && (
              <div className="auth-recovery-actions">
                <button className="auth-text-button" type="button" onClick={resendCode} disabled={loading}>Resend code</button>
                <button className="auth-text-button" type="button" onClick={() => { setStep('request'); setError(''); setNotice(''); }} disabled={loading}>Change email</button>
              </div>
            )}

            {step === 'done' ? (
              <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>
            ) : (
              <p className="auth-switch"><button className="auth-text-button" type="button" onClick={() => navigate('/login')}>Back to sign in</button></p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
