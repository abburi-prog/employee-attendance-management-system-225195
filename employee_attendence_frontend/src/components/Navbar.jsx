import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useUserRole from '../hooks/useUserRole';

/**
 * Navbar
 * Displays app brand, primary navigation links, and auth actions.
 * - Always shows a "Sign In" button linking to /login
 * - When authenticated, shows a profile/avatar button that opens a dropdown with "Account" and "Logout"
 * - Admin links hidden when role !== 'admin' (unchanged RBAC)
 *
 * Feature flag controlling Sign Out behavior:
 * - Reads process.env.REACT_APP_ENABLE_LOGOUT
 * - Defaults to true if the env var is missing/empty
 * - When true: clicking Logout calls AuthContext.signOut()
 * - When false: Logout remains visible but acts as a no-op and shows a tooltip
 */
 // PUBLIC_INTERFACE
export default function Navbar() {
  const { user, signOut, actionLoading } = useAuth();
  const role = useUserRole();
  const [localError, setLocalError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Prefer REACT_APP_ENABLE_LOGOUT; default to true if missing.
  const enableLogout = useMemo(() => {
    const raw = process.env.REACT_APP_ENABLE_LOGOUT;
    if (raw === undefined || raw === null || raw === '') return true;
    return String(raw).toLowerCase() === 'true';
  }, []);

  const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition';
  const linkActive = 'bg-blue-50 text-blue-700';
  const linkInactive = 'text-gray-700 hover:bg-gray-50 hover:text-blue-700';

  const closeMenu = () => setMenuOpen(false);

  const onAccount = () => {
    navigate('/account');
    closeMenu();
  };

  const handleLogout = async (e) => {
    if (!enableLogout) {
      e?.preventDefault?.();
      setLocalError('Sign-out is disabled in this environment');
      closeMenu();
      return;
    }
    setLocalError('');
    try {
      const { error } = await signOut();
      if (error) {
        setLocalError(error.message || 'Failed to sign out');
      }
    } catch (err) {
      setLocalError(err?.message || 'Failed to sign out');
    } finally {
      closeMenu();
    }
  };

  // Accessibility: close on outside click and on Escape
  useEffect(() => {
    function onDocClick(ev) {
      if (!menuOpen) return;
      const target = ev.target;
      if (menuRef.current && !menuRef.current.contains(target) && menuBtnRef.current && !menuBtnRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    function onKey(ev) {
      if (ev.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Keyboard navigation: handle ArrowDown/ArrowUp on menu button to focus first/last item
  const onMenuButtonKeyDown = (e) => {
    if (!menuOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setMenuOpen(true);
      // focus first item shortly after open
      setTimeout(() => {
        const first = menuRef.current?.querySelector('button, a');
        first?.focus();
      }, 0);
    }
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
          {/* Always show Sign In that routes to /login */}
          <Link
            to="/login"
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            aria-label="Sign in"
          >
            Sign In
          </Link>

          {/* Authenticated profile dropdown */}
          {user ? (
            <div className="relative">
              <button
                ref={menuBtnRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls="profile-menu"
                onClick={() => setMenuOpen((s) => !s)}
                onKeyDown={onMenuButtonKeyDown}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={user.email || 'Account menu'}
              >
                <span
                  aria-hidden="true"
                  className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center"
                >
                  {(user.email?.[0] || 'U').toUpperCase()}
                </span>
                <span className="hidden sm:inline text-gray-700">{user.email || 'User'}</span>
                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  ref={menuRef}
                  id="profile-menu"
                  role="menu"
                  aria-labelledby="profile-menu-button"
                  className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none"
                >
                  <button
                    role="menuitem"
                    onClick={onAccount}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    Account
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    disabled={enableLogout && actionLoading}
                    title={!enableLogout ? 'Sign-out is disabled in this environment' : undefined}
                  >
                    {enableLogout && actionLoading ? 'Signing out…' : 'Logout'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {localError && !enableLogout ? (
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
