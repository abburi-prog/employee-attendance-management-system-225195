import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useUserRole from '../hooks/useUserRole';

/**
 * Navbar
 * Displays app brand, primary navigation links, and auth actions.
 * - Shows Login when unauthenticated (navigates to /login)
 * - Shows user email (if available) and Logout when authenticated
 * - Uses NavLink for active route highlighting
 * - Admin links hidden when role !== 'admin'
 */
// PUBLIC_INTERFACE
export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut, actionLoading } = useAuth();
  const role = useUserRole();
  const [localError, setLocalError] = useState('');

  const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition';
  const linkActive = 'bg-blue-50 text-blue-700';
  const linkInactive = 'text-gray-700 hover:bg-gray-50 hover:text-blue-700';

  const handleLogout = async () => {
    setLocalError('');
    try {
      const { error } = await signOut();
      if (error) {
        setLocalError(error.message || 'Failed to sign out');
      }
    } catch (e) {
      setLocalError(e?.message || 'Failed to sign out');
    }
    // No local navigate; AuthContext will hard-redirect after clearing
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200" role="navigation" aria-label="Primary">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <Link to="/dashboard" className="font-bold" style={{ color: 'var(--ocean-primary)' }}>
          Employee Attendance
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Dashboard
          </NavLink>
          <NavLink to="/apply-leave" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Apply Leave
          </NavLink>
          <NavLink to="/my-leaves" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            My Leaves
          </NavLink>
          <NavLink to="/leave-balance" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Leave Balance
          </NavLink>
          {role === 'admin' ? (
            <NavLink to="/admin/leaves" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              Admin
            </NavLink>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-gray-600" aria-label="Signed in user">
                {user.email || 'User'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                aria-label="Logout"
                disabled={actionLoading}
              >
                {actionLoading ? 'Signing out…' : 'Logout'}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
              aria-label="Login"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      {localError ? (
        <div
          className="mx-auto max-w-7xl px-4 pb-2 text-sm"
          style={{ color: 'var(--ocean-error)' }}
          role="status"
          aria-live="polite"
        >
          {localError}
        </div>
      ) : null}
    </nav>
  );
}
