import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';

/**
 * Top navigation bar with app title and user/role indicator and theme toggle.
 */
// PUBLIC_INTERFACE
export default function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { profile, user } = useAuth();
  const role = profile?.role || 'employee';
  const name = profile?.full_name || user?.email || 'Guest';

  return (
    <header className="w-full bg-white border-b border-gray-200" role="banner">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <div className="font-bold" style={{ color: 'var(--ocean-primary)' }}>
          Employee Attendance
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-600" aria-label="User role">
            {name} • {role}
          </span>
          <button
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            type="button"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
    </header>
  );
}
