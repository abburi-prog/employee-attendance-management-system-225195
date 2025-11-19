import React, { useEffect, useMemo, useState } from 'react';
import { adminListLeaves, adminUpdateLeaveStatus } from '../../services/adminService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';

/**
 * LeaveApprovals: Lists pending leaves and allows approve/deny with confirm.
 * Uses optimistic UI updates and toast notifications (via global event).
 */
export default function LeaveApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');

  const showToast = (message, type = 'info', duration = 3500) => {
    try {
      const evt = new CustomEvent('app:toast', { detail: { message, type, duration } });
      window.dispatchEvent(evt);
    } catch {
      // no-op
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListLeaves();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAction = async (id, nextStatus) => {
    const item = rows.find((r) => r.id === id);
    if (!item) return;

    const label = nextStatus === 'approved' ? 'Approve' : 'Deny';
    // Confirm
    const ok = window.confirm(`Are you sure you want to ${label.toLowerCase()} this request?`);
    if (!ok) return;

    // Optimistic UI
    const prev = [...rows];
    setWorkingId(id);
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));

    try {
      await adminUpdateLeaveStatus(id, nextStatus);
      showToast(`Leave ${label.toLowerCase()}d`, 'success');
    } catch (e) {
      // Revert
      setRows(prev);
      showToast(e?.message || `Failed to ${label.toLowerCase()} leave`, 'error');
    } finally {
      setWorkingId(null);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'employee', title: 'Employee', dataIndex: 'name' },
      { key: 'email', title: 'Email', dataIndex: 'email' },
      { key: 'type', title: 'Type', dataIndex: 'leave_type' },
      { key: 'dates', title: 'Dates', dataIndex: 'dates' },
      { key: 'reason', title: 'Reason', dataIndex: 'reason' },
      { key: 'status', title: 'Status', dataIndex: 'status' },
      { key: 'actions', title: 'Actions', dataIndex: 'actions' },
    ],
    []
  );

  const data = rows.map((r) => ({
    ...r,
    email: r.user?.email || r.email || '',
    dates: `${r.start_date} → ${r.end_date}${typeof r.total_days !== 'undefined' ? ` • ${r.total_days}d` : ''}`,
    actions: '',
  }));

  return (
    <Card title="Leave Approvals">
      {error ? (
        <div
          className="mb-3 text-sm rounded-lg"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: 12 }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600">Loading leaves...</div>
      ) : (
        <Table
          columns={columns}
          data={data}
          empty="No leave requests."
          renderRow={(row) => (
            <>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                {row.name || row.userId}
              </td>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                {row.email || '-'}
              </td>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                {row.leave_type || '-'}
              </td>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                {row.dates}
              </td>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                {row.reason || '-'}
              </td>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    row.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : row.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {row.status || 'pending'}
                </span>
              </td>
              <td className="text-sm text-gray-900" style={{ padding: 8 }}>
                {row.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onAction(row.id, 'approved')}
                      disabled={workingId === row.id}
                      ariaLabel="Approve"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onAction(row.id, 'rejected')}
                      disabled={workingId === row.id}
                      ariaLabel="Deny"
                    >
                      Deny
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </td>
            </>
          )}
        />
      )}
    </Card>
  );
}
