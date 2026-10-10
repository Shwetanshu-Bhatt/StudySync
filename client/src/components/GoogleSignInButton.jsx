import { useEffect, useRef } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

const GoogleSignInButton = ({ onCredential, onUnavailable, disabled = false }) => {
  const buttonRef = useRef(null);
  const handlersRef = useRef({ onCredential, onUnavailable });

  useEffect(() => {
    handlersRef.current = { onCredential, onUnavailable };
  }, [onCredential, onUnavailable]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;

    let active = true;
    const renderButton = () => {
      if (!active || !buttonRef.current || !window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (active && response?.credential) {
              handlersRef.current.onCredential(response.credential);
            }
          }
        });

        const width = Math.min(400, Math.max(200, Math.floor(buttonRef.current.getBoundingClientRect().width)));
        buttonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width
        });
      } catch {
        handlersRef.current.onUnavailable?.();
      }
    };

    const handleScriptError = () => {
      if (active) handlersRef.current.onUnavailable?.();
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => { active = false; };
    }

    let script = document.querySelector('script[data-google-identity]');
    const shouldAppend = !script;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.dataset.googleIdentity = 'true';
    }

    script.addEventListener('load', renderButton);
    script.addEventListener('error', handleScriptError);
    if (shouldAppend) document.head.appendChild(script);

    return () => {
      active = false;
      script.removeEventListener('load', renderButton);
      script.removeEventListener('error', handleScriptError);
    };
  }, []);

  return (
    <div className={'auth-google-provider' + (disabled ? ' is-disabled' : '')} aria-busy={disabled}>
      <div className="auth-divider"><span>OR</span></div>
      {clientId ? (
        <div className="auth-google-button" ref={buttonRef} />
      ) : (
        <>
          <button
            className="auth-google-fallback"
            type="button"
            disabled
            aria-describedby="google-signin-config-note"
          >
            <svg className="auth-google-mark" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1 1 32 15.1l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.6-.4-3.9Z" />
              <path fill="#34A853" d="M6.3 14.7 12.9 19.5A12 12 0 0 1 12 24c0 1.5.3 2.9.9 4.2l-6.6 5.1A20 20 0 0 1 4 24c0-3.6.8-6.9 2.3-9.3Z" />
              <path fill="#FBBC05" d="M24 44a20 20 0 0 0 12.7-4.6l-6.2-5.2A12 12 0 0 1 12.9 28.2l-6.6 5.1A20 20 0 0 0 24 44Z" />
              <path fill="#EA4335" d="M24 12c3.1 0 5.9 1.1 8.1 3.2l6.1-6.1A20 20 0 0 0 24 4C16.2 4 9.5 8.7 6.3 14.7l6.6 4.8A12 12 0 0 1 24 12Z" />
            </svg>
            Continue with Google
          </button>
          <p className="auth-google-setup-note" id="google-signin-config-note">
            Google sign-in is unavailable until the same Web Client ID is set as VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env.
          </p>
        </>
      )}
    </div>
  );
};

export default GoogleSignInButton;
