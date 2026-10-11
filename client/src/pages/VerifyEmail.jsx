import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deliveryFailed = searchParams.get('delivery') === 'failed';
  const [email, setEmail] = useState(location.state?.email || searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState(deliveryFailed ? 'Your account was saved, but the verification email could not be sent. Wait one minute, then resend the code.' : '');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyEmail } = useAuth();

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-verification', { email });
      setNotice(response.data.message || 'If verification is needed, a new code will be sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send another code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-story">
          <Link to="/signup" className="auth-brand">
            <span className="auth-mark"><img src="/studySync.svg" alt="" /></span>
            <span>StudySync</span>
          </Link>
          <div className="auth-story-copy">
            <p className="auth-kicker">ONE QUICK CHECK</p>
            <h1>Make your learning space yours.</h1>
            <p>Confirm your email to finish creating your StudySync account.</p>
          </div>
          <div className="auth-story-footer"><span>Materials</span><span>Courses</span><span>Community</span></div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-mobile-brand">
            <span className="auth-mark"><img src="/studySync.svg" alt="" /></span>
            <span>StudySync</span>
          </div>
          <div className="auth-form-content">
            <p className="auth-kicker">EMAIL VERIFICATION</p>
            <h2>Check your inbox</h2>
            <p className="auth-intro">
              {deliveryFailed
                ? 'Email delivery failed for this attempt. After the cooldown, resend the code or check the server email configuration.'
                : 'Enter the six-digit code we sent to finish creating your account.'}
            </p>

            {error && <div className="auth-error" role="alert"><span>{error}</span></div>}
            {notice && <div className="auth-note" role="status">{notice}</div>}

            <form onSubmit={handleVerify} className="auth-form">
              <label className="auth-field">
                <span>Email address</span>
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="auth-field">
                <span>Verification code</span>
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
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify email'}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="auth-switch">Didn’t receive a code? <button className="auth-text-button" type="button" onClick={handleResend} disabled={loading || !email}>Resend code</button></p>
            <p className="auth-switch"><Link to="/signup">Back to sign up</Link></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VerifyEmail;
