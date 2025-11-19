import React, { useEffect, useMemo, useState } from 'react';
import { adminListAttendance, adminSearchUsers } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import DateRangePicker from '../../components/ui/DateRangePicker';
import { formatTimeHHmmss } from '../../utils/time';
import { diffSecondsBetweenIso, formatDurationHMS } from '../../utils/duration';

/**
 * AttendanceViewer: filter by user and date range, display table, pagination.
 */
export default function AttendanceViewer() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'info', duration = 3500) => {
    try {
      const evt = new CustomEvent('app:toast', { detail: { message, type, duration } });
      window.dispatchEvent(evt);
    } catch {
      // no-op
    }
  };

  const loadUsers = async (term) => {
    try {
      const res = await adminSearchUsers(term || '');
      setUsers(Array.isArray(res) ? res : []);
    } catch (e) {
      showToast(e?.message || 'Failed to load users', 'error');
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await adminListAttendance({
        userId: selectedUser,
        start,
        end,
        page,
        pageSize,
      });
      setRows(res?.rows || []);
      setTotal(res?.total || 0);
    } catch (e) {
      showToast(e?.message || 'Failed to load attendance', 'error');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers('');
  }, []);

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, start, end, page, pageSize]);

  const columns = useMemo(
    () => [
      { key: 'name', title: 'Employee', dataIndex: 'name' },
      { key: 'email', title: 'Email', dataIndex: 'email' },
      { key: 'department', title: 'Department', dataIndex: 'department' },
      { key: 'date', title: 'Date', dataIndex: 'date' },
      { key: 'checkIn', title: 'Check-In', dataIndex: 'checkIn' },
      { key: 'checkOut', title: 'Check-Out', dataIndex: 'checkOut' },
      { key: 'hours', title: 'Hours', dataIndex: 'hours' },
      { key: 'status', title: 'Status', dataIndex: 'status' },
    ],
    []
  );

  const viewRows = rows.map((r) => {
    const inIso = r.checkIn && r.checkIn !== '-' ? r.checkIn : null;
    const outIso = r.checkOut && r.checkOut !== '-' ? r.checkOut : null;
    const secs = inIso && outIso ? diffSecondsBetweenIso(inIso, outIso) : 0;
    return {
      ...r,
      checkIn: inIso ? formatTimeHHmmss(inIso) : '-',
      checkOut: outIso ? formatTimeHHmmss(outIso) : '-',
      hours: secs > 0 ? formatDurationHMS(secs) : '-',
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Filters"
        actions={
          <div className="flex items-center gap-2">
            <input
              aria-label="Search users"
              type="text"
              placeholder="Search user by name or email"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadUsers(q);
              }}
            />
            <select
              aria-label="Select user"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} • {u.email}
                </option>
              ))}
            </select>
            <DateRangePicker
              start={start}
              end={end}
              onChange={(from, to) => {
                setStart(from || '');
                setEnd(to || '');
                setPage(1);
              }}
            />
          </div>
        }
      >
        <div className="text-sm text-gray-600">Select a user and a date range to filter attendance. Leave user blank to view all.</div>
      </Card>

      <Card title="Attendance">
        {loading ? (
          <div className="text-sm text-gray-600">Loading attendance...</div>
        ) : (
          <>
            <Table columns={columns} data={viewRows} empty="No records found." />
            <div className="mt-3">
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
