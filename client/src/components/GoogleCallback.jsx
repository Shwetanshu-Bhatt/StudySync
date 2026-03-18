import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const needsCompletion = searchParams.get('needsCompletion') === 'true';
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        // Check if this is a popup window
        if (window.opener) {
          // Send message to parent window (popup)
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            token,
            user,
            needsCompletion
          }, '*');
          
          // Close the popup
          window.close();
        } else {
          // Regular redirect flow
          if (needsCompletion) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error parsing Google callback:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            message: 'Failed to process Google login'
          }, '*');
          window.close();
        } else {
          navigate('/login?error=google_callback_failed');
        }
      }
    } else {
      // No token, redirect to login
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          message: 'Google authentication failed'
        }, '*');
        window.close();
      } else {
        navigate('/login?error=no_token');
      }
    }
  }, [searchParams, navigate, setUser]);

  // Loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0612]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
