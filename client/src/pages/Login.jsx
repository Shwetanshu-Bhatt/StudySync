import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle(credential, { intent: 'signin' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleUnavailable = (message) => {
    setError(message || 'Google sign-in could not load. Please try again.');
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
            <p className="auth-kicker">YOUR STUDYSYNC WORKSPACE</p>
            <h1>Your learning,<br />in sync.</h1>
            <p>Course materials, classmates, and study conversations in one connected space.</p>
          </div>
          <div className="auth-story-footer">
            <span>Materials</span><span>Courses</span><span>Community</span>
          </div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-mobile-brand">
            <span className="auth-mark"><img src="/studySync.svg" alt="" /></span>
            <span>StudySync</span>
          </div>
          <div className="auth-form-content">
            <p className="auth-kicker">WELCOME BACK</p>
            <h2>Sign in to your account</h2>
            <p className="auth-intro">Pick up where you left off.</p>

            {error && (
              <div className="auth-error" role="alert">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="auth-field">
                <span>Email address</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <div className="auth-password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onUnavailable={handleGoogleUnavailable}
              disabled={loading}
            />

            <p className="auth-switch">New to StudySync? <Link to="/signup">Create an account</Link></p>
            <a className="auth-github" href="https://github.com/Shwetanshu-Bhatt/StudySync.git" target="_blank" rel="noopener noreferrer">
              View the project on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
