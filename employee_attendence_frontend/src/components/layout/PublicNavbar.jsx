import React from 'react';
import { Link, NavLink } from 'react-router-dom';

/**
 * PublicNavbar
 * Minimal top navigation for public pages (e.g., /login).
 * - Shows app brand
 * - Always shows a "Sign In" link to navigate to /login
 * - Keeps styling consistent with the main Navbar but without auth-specific controls
 */
// PUBLIC_INTERFACE
export default function PublicNavbar() {
  const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition';
  const linkActive = 'bg-blue-50 text-blue-700';
  const linkInactive = 'text-gray-700 hover:bg-gray-50 hover:text-blue-700';

  return (
    <nav className="w-full bg-white border-b border-gray-200" role="navigation" aria-label="Public">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-bold" style={{ color: 'var(--ocean-primary)' }}>
          Employee Attendance
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <NavLink
            to="/login"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            aria-label="Sign in"
          >
            Sign In
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
