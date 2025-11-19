import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminRoute protects admin-only routes.
 * - Requires authenticated user and profile.role === 'admin'
 * - If unauthenticated or not admin, redirects to /login (preserving the attempted location)
 * - Safety: if profile never resolves within a short window, fallback to /login to avoid indefinite loading.
 */
// PUBLIC_INTERFACE
export default function AdminRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Safety timer to avoid indefinite loading when role/profile cannot be resolved
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Start a short safety window if we have a user but no profile yet, or global auth loading
    if ((loading || (user && profile === null)) && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        setTimedOut(true);
      }, 3500); // 3.5s gives time for Supabase to respond but avoids indefinite spinner
    }
    // Clear timer once conditions resolve
    if (!loading && (!user || profile)) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setTimedOut(false);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading, user, profile]);

  // While loading and not timed out, show a small placeholder
  if (loading && !timedOut) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
  }

  // Must be authenticated and admin
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If role is known and not admin -> redirect away
  if (profile && profile.role !== 'admin') {
    return <Navigate to="/not-authorized" replace />;
  }

  // If profile hasn't loaded yet and we timed out, fail safe to login (or not-authorized)
  if (user && profile === null && timedOut) {
    // Fallback to safe page rather than blocking UX
    return <Navigate to="/not-authorized" replace />;
  }

  // If still waiting (user exists, profile null, but within safety window), show minimal UI
  if (user && profile === null && !timedOut) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Checking permissions…</span>
      </div>
    );
  }

  return <Outlet />;
}
