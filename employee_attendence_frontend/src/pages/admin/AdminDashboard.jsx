import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import useUserRole from '../../hooks/useUserRole';

/**
 * AdminDashboard: Shell layout for admin routes with local sidebar and topbar.
 * Provides navigation to Leave Approvals and Attendance Viewer.
 * Note: This shell is mounted under <AdminRoute />, but we defensively hide nav items if role !== 'admin'.
 */
export default function AdminDashboardShell() {
  const role = useUserRole();
  const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition';
  const linkActive = 'bg-blue-50 text-blue-700';
  const linkInactive = 'text-gray-700 hover:bg-gray-50 hover:text-blue-700';

  return (
    <div className="flex min-h-[60vh]">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="p-3 flex flex-col gap-1">
          {role === 'admin' ? (
            <>
              <NavLink to="/admin/leaves" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
                Leave Approvals
              </NavLink>
              <NavLink to="/admin/attendance" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
                Attendance Viewer
              </NavLink>
            </>
          ) : null}
        </div>
      </aside>
      <section className="flex-1 p-4">
        <header className="mb-3">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ocean-text)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600">Manage leave approvals and view attendance across employees.</p>
        </header>
        <Outlet />
      </section>
    </div>
  );
}
