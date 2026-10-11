import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    year: 1,
    course: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        if (response.data.success) setCourses(response.data.courses);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { course, ...userData } = formData;
      delete userData.confirmPassword;
      const result = await register({ ...userData, branch: course });
      navigate(`/verify-email?email=${encodeURIComponent(result.email || userData.email)}`);
    } catch (err) {
      if (err.response?.data?.emailVerificationRequired) {
        navigate(`/verify-email?email=${encodeURIComponent(err.response.data.email || formData.email)}`);
        return;
      }
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle(credential, {
        intent: 'signup',
        year: formData.year,
        branch: formData.course
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleUnavailable = (message) => {
    setError(message || 'Google sign-in could not load. Please try again.');
  };

  return (
    <div className="auth-page auth-page-signup">
      <div className="auth-layout auth-layout-signup">
        <aside className="auth-story">
          <Link to="/signup" className="auth-brand">
            <span className="auth-mark"><img src="/studySync.svg" alt="" /></span>
            <span>StudySync</span>
          </Link>
          <div className="auth-story-copy">
            <p className="auth-kicker">START WITH YOUR COURSES</p>
            <h1>Create a home for your learning.</h1>
            <p>Find course materials, meet classmates, and join the conversations around your classes.</p>
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
          <div className="auth-form-content auth-form-content-signup">
            <p className="auth-kicker">GET STARTED</p>
            <h2>Create your account</h2>
            <p className="auth-intro">Join your course community on StudySync.</p>

            {error && (
              <div className="auth-error" role="alert">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field-grid">
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>Year of study</span>
                  <select name="year" value={formData.year} onChange={handleChange}>
                    <option value="1">1st year</option>
                    <option value="2">2nd year</option>
                    <option value="3">3rd year</option>
                    <option value="4">4th year</option>
                  </select>
                </label>
              </div>

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
                <span>Course or branch</span>
                <select name="course" value={formData.course} onChange={handleChange} required>
                  <option value="">Choose your course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.name} ({course.code})</option>
                  ))}
                </select>
              </label>

              <div className="auth-field-grid">
                <label className="auth-field">
                  <span>Password</span>
                  <div className="auth-password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      minLength={6}
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
                <label className="auth-field">
                  <span>Confirm password</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                  />
                </label>
              </div>

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Sending verification code…' : 'Continue with email'}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
              <p className="auth-note">Teachers can only be added by administrators.</p>
            </form>

            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onUnavailable={handleGoogleUnavailable}
              disabled={loading}
            />

            <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signup;
