import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';

/**
 * Login component that allows users to request a magic link via email.
 * In Supabase project, enable Email (magic link) provider.
 */
const oceanStyles = {
  card: {
    maxWidth: 420,
    margin: '48px auto',
    padding: '24px',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
  },
  title: { margin: '0 0 8px', color: '#111827' },
  subtitle: { margin: '0 0 24px', color: '#6b7280', fontSize: 14 },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    outline: 'none',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  link: { color: '#2563EB' },
  help: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  alert: (color) => ({
    padding: '10px 12px',
    borderRadius: 8,
    marginBottom: 12,
    background: color === 'error' ? '#FEF2F2' : '#ECFDF5',
    color: color === 'error' ? '#991B1B' : '#065F46',
    border: `1px solid ${color === 'error' ? '#FECACA' : '#A7F3D0'}`,
    fontSize: 13,
  }),
};

// PUBLIC_INTERFACE
export default function Login() {
  /** Login page using magic link email OTP via Supabase. */
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // For CRA, no NEXT style redirect var; rely on SITE URL configured in Supabase project.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: process.env.REACT_APP_FRONTEND_URL || window.location.origin,
        },
      });
      if (error) {
        setStatus({ type: 'error', message: error.message });
      } else {
        setStatus({
          type: 'success',
          message: 'Check your email for the magic link to sign in.',
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to send magic link' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={oceanStyles.card} aria-live="polite">
        <h2 style={oceanStyles.title}>Sign in</h2>
        <p style={oceanStyles.subtitle}>
          Use your work email to receive a secure magic link.
        </p>

        {user ? (
          <div style={oceanStyles.alert('success')}>
            You are already signed in. You can navigate to the Dashboard.
          </div>
        ) : null}

        {status.message ? (
          <div style={oceanStyles.alert(status.type === 'error' ? 'error' : 'success')}>
            {status.message}
          </div>
        ) : null}

        <form onSubmit={handleSendMagicLink}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={oceanStyles.input}
          />
          <button
            type="submit"
            disabled={submitting || !email}
            style={{
              ...oceanStyles.button,
              opacity: submitting || !email ? 0.7 : 1,
            }}
          >
            {submitting ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        <p style={oceanStyles.help}>
          Make sure to check your spam folder if you don’t see the email. Contact admin if problems
          persist.
        </p>
      </div>
    </div>
  );
}
