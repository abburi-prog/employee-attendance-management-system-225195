import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * NavBar
 * Top navigation with branding, links and sign-out button when authenticated.
 */
// PUBLIC_INTERFACE
export default function NavBar({ theme, onToggle }) {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <div className="font-bold text-ocean-primary">Attendance</div>
        <Link className="text-gray-900 hover:text-ocean-primary" to="/login">Login</Link>
        <Link className="text-gray-900 hover:text-ocean-primary" to="/dashboard">Dashboard</Link>
        <Link className="text-gray-900 hover:text-ocean-primary" to="/admin">Admin</Link>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <button
              onClick={async () => { await signOut(); }}
              className="ocean-btn-secondary px-3 py-2 text-sm"
              type="button"
            >
              Sign out
            </button>
          ) : null}
          <button
            className="ocean-btn-primary px-3 py-2 text-sm"
            onClick={onToggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            type="button"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
    </nav>
  );
}
