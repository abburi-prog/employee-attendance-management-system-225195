import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Left sidebar navigation with role-aware Admin item.
 * Shows "Admin", and nested "Leave Approvals" and "Attendance Viewer" only for admins.
 */
// PUBLIC_INTERFACE
export default function SideNav() {
  const { profile } = useAuth();
  const role = profile?.role || 'employee';

  const linkBase = 'block px-3 py-2 rounded-md text-sm font-medium transition';
  const linkActive = 'bg-blue-50 text-blue-700';
  const linkInactive = 'text-gray-700 hover:bg-gray-50 hover:text-blue-700';

  const subLinkBase = 'ml-4 block px-3 py-2 rounded-md text-sm transition';
  const subLinkActive = 'bg-blue-50 text-blue-700';
  const subLinkInactive = 'text-gray-600 hover:bg-gray-50 hover:text-blue-700';

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white" role="navigation" aria-label="Sidebar">
      <div className="p-3 flex flex-col gap-1">
        <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          Dashboard
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          Attendance
        </NavLink>

        {role === 'admin' ? (
          <>
            <NavLink to="/admin" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              Admin
            </NavLink>
            <NavLink
              to="/admin/leaves"
              className={({ isActive }) => `${subLinkBase} ${isActive ? subLinkActive : subLinkInactive}`}
            >
              Leave Approvals
            </NavLink>
            <NavLink
              to="/admin/attendance"
              className={({ isActive }) => `${subLinkBase} ${isActive ? subLinkActive : subLinkInactive}`}
            >
              Attendance Viewer
            </NavLink>
          </>
        ) : null}

        <NavLink to="/settings" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
