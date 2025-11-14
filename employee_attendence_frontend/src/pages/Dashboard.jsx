import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import KPIStat from '../components/ui/KPIStat';
import { useAuth } from '../context/AuthContext';
import { getMyLeaves } from '../api/leaveApi';
import LeaveBalance from './LeaveBalance';
import AdminLeaveDashboard from './AdminLeaveDashboard';

/**
 * Attendance & Leave unified dashboard
 * - Quick Actions to Apply Leave / My Leaves
 * - Leave Balance (inline)
 * - Recent Leaves (latest 5 via getMyLeaves)
 * - Attendance Snapshot (link to /attendance or placeholder)
 * - Admin Leave Approvals (collapsible, shown behind simple admin toggle)
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || 'employee';

  const [recent, setRecent] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [errorLeaves, setErrorLeaves] = useState('');
  const [showAdmin, setShowAdmin] = useState(role === 'admin'); // placeholder role check

  // fetch recent leaves (latest 5)
  const loadRecentLeaves = async () => {
    setLoadingLeaves(true);
    setErrorLeaves('');
    try {
      const { data, error } = await getMyLeaves();
      if (error) setErrorLeaves(error.message || 'Failed to load recent leaves');
      // When unauthenticated, data === null by contract → show empty list gracefully
      const safe = Array.isArray(data) ? data : [];
      setRecent(safe.slice(0, 5));
    } catch (e) {
      setErrorLeaves(e?.message || 'Failed to load recent leaves');
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadRecentLeaves();
  }, []);

  const attendanceCard = useMemo(
    () => (
      <Card
        title="Attendance Snapshot"
        actions={
          <Link to="/attendance">
            <Button ariaLabel="Go to Attendance">Open Attendance</Button>
          </Link>
        }
      >
        <div className="text-sm text-gray-700">
          View and manage today’s clock in/out, plus your full attendance history.
        </div>
      </Card>
    ),
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ocean-text)' }}>
          Attendance & Leave Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Quick overview of your attendance and leave information.
        </p>
      </header>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/apply-leave">
            <Button ariaLabel="Apply for Leave">Apply Leave</Button>
          </Link>
          <Link to="/my-leaves">
            <Button variant="secondary" ariaLabel="View My Leaves">
              My Leaves
            </Button>
          </Link>
          <Link to="/leave-balance">
            <Button variant="secondary" ariaLabel="View Leave Balance">
              Full Leave Balance
            </Button>
          </Link>
        </div>
      </Card>

      {/* KPIs snapshot (optional small summary placeholder) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStat label="Pending Approvals" value="-" color="#F59E0B" />
        <KPIStat label="Upcoming Leaves" value="-" color="#2563EB" />
        <KPIStat label="Used Sick Days" value="-" color="#10b981" />
        <KPIStat label="Used Annual Days" value="-" color="#EF4444" />
      </section>

      {/* Two-column main: Leave Balance + Attendance Snapshot */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Leave Balance" className="h-full">
          {/* Embed the existing LeaveBalance UI inline */}
          <div className="rounded-lg border border-gray-100">
            <LeaveBalance />
          </div>
        </Card>

        {attendanceCard}
      </section>

      {/* Recent Leaves */}
      <Card
        title="Recent Leaves"
        actions={
          <Link to="/my-leaves" className="text-sm text-blue-700 hover:underline">
            View all
          </Link>
        }
      >
        {loadingLeaves ? (
          null
        ) : errorLeaves ? (
          <div
            className="text-sm"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: 10,
              borderRadius: 8,
            }}
          >
            {errorLeaves}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-sm text-gray-600">No recent leave requests.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                style={{ background: 'var(--ocean-surface)' }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {leave.leave_type || 'Leave'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {leave.start_date} → {leave.end_date}
                    {typeof leave.total_days !== 'undefined' ? ` • ${leave.total_days} day(s)` : ''}
                  </span>
                  {leave.reason ? (
                    <span className="text-xs text-gray-500 mt-0.5">Reason: {leave.reason}</span>
                  ) : null}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    leave.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : leave.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {leave.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Admin Approvals (collapsible) - simple role hint; future: role-based visibility */}
      <Card
        title="Admin Leave Approvals"
        actions={
          <Button
            variant="secondary"
            onClick={() => setShowAdmin((s) => !s)}
            ariaLabel="Toggle admin approvals"
          >
            {showAdmin ? 'Hide' : 'Show'}
          </Button>
        }
      >
        {/* Placeholder role check comment: replace with actual RBAC in future */}
        {/* Only show if admin; for now we gate it with a simple toggle defaulting true when role === 'admin' */}
        {showAdmin ? (
          <div className="rounded-lg border border-gray-100">
            <AdminLeaveDashboard />
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Approvals are available to administrators. Toggle to preview.
          </div>
        )}
      </Card>
    </div>
  );
}
