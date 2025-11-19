import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

/**
 * Login page for email/password authentication using Supabase.
 * - Client-side validation for email and password.
 * - Loading state and error handling.
 * - On success redirects to returnTo (if provided) or /.
 * - If already authenticated, redirects away immediately.
 * - Includes optional magic link sign-in.
 */
// PUBLIC_INTERFACE
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signOut, signIn, loginWithMagicLink, actionLoading } = useAuth();

  // Attempt to read ?returnTo=... for post-login redirect
  const returnTo = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      const r = params.get('returnTo');
      if (r && typeof r === 'string') return r;
      return null;
    } catch {
      return null;
    }
  }, [location.search]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [magicSending, setMagicSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // If already logged in, redirect to destination/default after auth finished loading
  useEffect(() => {
    if (!loading && user) {
      navigate(returnTo || '/', { replace: true });
    }
  }, [user, loading, navigate, returnTo]);

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
    setInfo('');

    try {
      const { error: signErr } = await signIn(email, password);
      if (signErr) {
        setError(signErr.message || 'Invalid email or password.');
        setSubmitting(false);
        return;
      }
      // Success → redirect to home or returnTo
      navigate(returnTo || '/', { replace: true });
    } catch (e2) {
      setError(e2?.message || 'Unexpected error during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    if (magicSending) return;
    if (!isValidEmail(email)) {
      setError('Enter a valid email for magic link.');
      return;
    }
    setError('');
    setInfo('');
    setMagicSending(true);
    try {
      const siteUrl =
        process.env.REACT_APP_FRONTEND_URL ||
        (typeof window !== 'undefined' ? window.location.origin : undefined);
      const { error: magicErr } = await loginWithMagicLink(email, siteUrl);
      if (magicErr) {
        setError(magicErr.message || 'Could not send magic link.');
        return;
      }
      setInfo('Magic link sent. Check your email to continue.');
    } catch (e) {
      setError(e?.message || 'Could not send magic link.');
    } finally {
      setMagicSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
  };

  if (!loading && user) {
    return (
      <div className="max-w-md mx-auto">
        <Card title="Sign In">
          <div className="text-sm text-gray-600">Redirecting…</div>
        </Card>
      </div>
    );
  }

  const errBanner =
    error &&
    {
      bg: '#FEF2F2',
      br: '#FECACA',
      color: '#991B1B',
    };

  const infoBanner =
    info &&
    {
      bg: '#EFF6FF',
      br: '#BFDBFE',
      color: '#1E40AF',
    };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Sign In">
        {errBanner ? (
          <div
            className="text-sm rounded-lg mb-3"
            style={{
              background: errBanner.bg,
              border: `1px solid ${errBanner.br}`,
              color: errBanner.color,
              padding: 12,
            }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        ) : null}

        {infoBanner ? (
          <div
            className="text-sm rounded-lg mb-3"
            style={{
              background: infoBanner.bg,
              border: `1px solid ${infoBanner.br}`,
              color: infoBanner.color,
              padding: 12,
            }}
            role="status"
            aria-live="polite"
          >
            {info}
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
              disabled={submitting || actionLoading}
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
              disabled={submitting || actionLoading}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            ariaLabel="Sign In"
            disabled={submitting || actionLoading}
            className="w-full"
          >
            {submitting || actionLoading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">Or</span>
          <Button
            variant="secondary"
            onClick={handleMagicLink}
            ariaLabel="Send magic link"
            disabled={magicSending || actionLoading}
          >
            {magicSending ? 'Sending…' : 'Send Magic Link'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Tip: Ensure your Supabase Auth URL settings match REACT_APP_FRONTEND_URL.
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={handleLogout} ariaLabel="Sign Out" className="w-full">
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
