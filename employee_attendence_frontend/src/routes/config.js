 /**
  * Central route configuration with optional 'roles' metadata.
  * This can be used by navigation components to generate menus filtered by RBAC.
  * Current app integrates links directly, but this config provides a single source of truth.
  */
export const routes = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/attendance', label: 'Attendance' },
  { path: '/apply-leave', label: 'Apply Leave' },
  { path: '/my-leaves', label: 'My Leaves' },
  { path: '/leave-balance', label: 'Leave Balance' },
  // Admin routes (restricted)
  { path: '/admin', label: 'Admin', roles: ['admin'] },
  { path: '/admin/leaves', label: 'Leave Approvals', roles: ['admin'] },
  { path: '/admin/attendance', label: 'Attendance Viewer', roles: ['admin'] },
  { path: '/settings', label: 'Settings' },
];
