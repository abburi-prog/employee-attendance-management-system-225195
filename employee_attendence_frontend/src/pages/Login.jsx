import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Login page with two tabs: Create Account and Sign In.
 * Uses Supabase email/password authentication through AuthContext.
 */
const oceanStyles = {
  card: {
    maxWidth: 480,
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
  secondaryBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: 600,
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: (active) => ({
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${active ? '#2563EB' : '#e5e7eb'}`,
    background: active ? '#DBEAFE' : '#fff',
    color: active ? '#1D4ED8' : '#111827',
    cursor: 'pointer',
    fontWeight: 600,
  }),
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
  /** Login page using email/password for Sign Up and Sign In. */
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await signUp(form.email, form.password, form.fullName || undefined);
      // Depending on Supabase settings, confirmation may be required
      setStatus({
        type: 'success',
        message:
          'Account created. Please check your email to confirm (if required), then sign in.',
      });
      setActiveTab('signin');
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Unable to create account' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await signIn(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const code = err?.code ? ` (${err.code})` : '';
      setStatus({ type: 'error', message: (err?.message || 'Failed to sign in') + code });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={oceanStyles.card} aria-live="polite">
        <h2 style={oceanStyles.title}>Welcome</h2>
        <p style={oceanStyles.subtitle}>Sign in to manage your attendance.</p>

        {user ? (
          <div style={oceanStyles.alert('success')}>
            You are signed in. Go to Dashboard.
          </div>
        ) : null}

        {status.message ? (
          <div style={oceanStyles.alert(status.type === 'error' ? 'error' : 'success')}>
            {status.message}
          </div>
        ) : null}

        <div style={oceanStyles.tabs} role="tablist" aria-label="Authentication Tabs">
          <button
            type="button"
            style={oceanStyles.tabBtn(activeTab === 'signin')}
            aria-selected={activeTab === 'signin'}
            aria-controls="signin-panel"
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={oceanStyles.tabBtn(activeTab === 'signup')}
            aria-selected={activeTab === 'signup'}
            aria-controls="signup-panel"
            onClick={() => setActiveTab('signup')}
          >
            Create Account
          </button>
        </div>

        {activeTab === 'signin' ? (
          <form id="signin-panel" onSubmit={handleSignIn}>
            <label htmlFor="email" style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              value={form.email}
              onChange={onChange}
              style={oceanStyles.input}
            />
            <label htmlFor="password" style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              style={oceanStyles.input}
              minLength={6}
            />

            <button
              type="submit"
              disabled={submitting || !form.email || !form.password}
              style={{
                ...oceanStyles.button,
                opacity: submitting || !form.email || !form.password ? 0.7 : 1,
              }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form id="signup-panel" onSubmit={handleSignUp}>
            <label htmlFor="fullName" style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
              Full name (optional)
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jane Doe"
              value={form.fullName}
              onChange={onChange}
              style={oceanStyles.input}
            />
            <label htmlFor="email2" style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
              Email address
            </label>
            <input
              id="email2"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              value={form.email}
              onChange={onChange}
              style={oceanStyles.input}
            />
            <label htmlFor="password2" style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
              Password
            </label>
            <input
              id="password2"
              name="password"
              type="password"
              required
              placeholder="At least 6 characters"
              value={form.password}
              onChange={onChange}
              style={oceanStyles.input}
              minLength={6}
            />
            <button
              type="submit"
              disabled={submitting || !form.email || !form.password}
              style={{
                ...oceanStyles.button,
                opacity: submitting || !form.email || !form.password ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}

        <p style={oceanStyles.help}>
          Email/Password auth requires the Email provider enabled in Supabase.
        </p>
      </div>
    </div>
  );
}
