import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminRoute protects admin-only routes.
 * - Requires authenticated user and profile.role === 'admin'
 * - If unauthenticated or not admin, redirects to /login (preserving the attempted location)
 *   so acceptance criteria guarantees no admin UI renders for unauthorized users.
 */
// PUBLIC_INTERFACE
export default function AdminRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
  }

  // Must be authenticated and admin
  if (!user || (profile && profile.role !== 'admin')) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If profile is not yet available (null) but user exists, conservatively block access
  // until profile is loaded to avoid flashing admin UI to non-admins.
  if (user && profile === null) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Checking permissions…</span>
      </div>
    );
  }

  return <Outlet />;
}
