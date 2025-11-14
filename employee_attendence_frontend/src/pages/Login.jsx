import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

/**
 * Login page for email/password authentication using Supabase.
 * - Client-side validation for email and password.
 * - Loading state and error handling.
 * - On success redirects to /dashboard.
 * - If already authenticated, redirects away immediately.
 * - Includes a trivial logout button when authenticated.
 */
// PUBLIC_INTERFACE
export default function Login() {
  const navigate = useNavigate();
  const { user, loading, signOut, signIn } = useAuth();

  // Pre-fill email if present in query string or stored elsewhere (future)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard (only after auth finished loading)
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Simple email regex for UI-level validation (actual validation by Supabase on server)
  const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val);

  const validate = () => {
    if (!email || !password) {
      return 'Please enter your email and password.';
    }
    if (!isValidEmail(email)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Route sign-in through AuthContext for consistent diagnostics and state updates
      await signIn(email, password);

      // On success: redirect to dashboard as the default post-login landing page
      navigate('/dashboard', { replace: true });
    } catch (e2) {
      setError(e2?.message || 'Unexpected error during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  // Trivial logout (optional)
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // or await signOut();
    } catch (e2) {
      // ignore logout errors in UI
    }
  };

  // If user is present and auth is not loading, defensively block form and render a redirect link/state
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const banner =
    error &&
    {
      bg: '#FEF2F2',
      br: '#FECACA',
      color: '#991B1B',
    };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Sign In">
        {banner ? (
          <div
            className="text-sm rounded-lg mb-4"
            style={{
              background: banner.bg,
              border: `1px solid ${banner.br}`,
              color: banner.color,
              padding: 12,
            }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              aria-label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              aria-label="Password"
              type="password"
              autoComplete="current-password"
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            ariaLabel="Sign In"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="text-xs text-gray-500 mt-3">
          Tip: If your project requires email confirmation, verify the email first in Supabase settings.
        </div>

        {/* Optional trivial logout button for convenience if session somehow exists */}
        <div className="mt-4">
          <Button variant="secondary" onClick={handleLogout} ariaLabel="Sign Out" className="w-full">
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
