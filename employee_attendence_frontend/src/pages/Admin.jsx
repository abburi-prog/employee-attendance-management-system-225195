import React, { useMemo } from 'react';
import useAdminData from '../hooks/useAdminData';
import KPIStat from '../components/ui/KPIStat';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import DateRangePicker from '../components/ui/DateRangePicker';
import Button from '../components/ui/Button';
import NotAuthorized from './NotAuthorized';
import { useAuth } from '../context/AuthContext';
import { formatTimeHHmmss } from '../utils/time';
import { formatDurationHMS, diffSecondsBetweenIso } from '../utils/duration';

/**
 * Admin page: KPIs, attendance overview table with filters and CSV export, and employee list placeholder.
 */
// PUBLIC_INTERFACE
export default function Admin() {
  const { profile } = useAuth();
  const role = profile?.role || 'employee';

  // Hooks must always be called unconditionally
  const {
    overview, attRows, attTotal, attLoading, empRows, filters, setFilters,
  } = useAdminData();

  const columns = [
    { key: 'name', title: 'Employee', dataIndex: 'name' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
    { key: 'department', title: 'Department', dataIndex: 'department' },
    { key: 'date', title: 'Date', dataIndex: 'date' },
    { key: 'checkIn', title: 'Check-In', dataIndex: 'checkIn' },
    { key: 'checkOut', title: 'Check-Out', dataIndex: 'checkOut' },
    { key: 'hours', title: 'Hours', dataIndex: 'hours' },
  ];

  // Prepare view rows with formatted HH:mm:ss while keeping source data intact
  const viewRows = useMemo(
    () =>
      attRows.map((r) => {
        const inIso = r.checkIn && r.checkIn !== '-' ? r.checkIn : null;
        const outIso = r.checkOut && r.checkOut !== '-' ? r.checkOut : null;
        const secs = inIso && outIso ? diffSecondsBetweenIso(inIso, outIso) : 0;
        return {
          ...r,
          checkIn: inIso ? formatTimeHHmmss(inIso) : '-',
          checkOut: outIso ? formatTimeHHmmss(outIso) : '-',
          hours: secs > 0 ? formatDurationHMS(secs) : '-',
        };
      }),
    [attRows]
  );

  // Compute CSV regardless of role; format times as HH:mm:ss for consistency
  const csvData = useMemo(() => {
    const header = ['Employee', 'Email', 'Department', 'Date', 'Check-In', 'Check-Out', 'Hours'];
    const lines = attRows.map((r) => {
      const inIso = r.checkIn && r.checkIn !== '-' ? r.checkIn : null;
      const outIso = r.checkOut && r.checkOut !== '-' ? r.checkOut : null;
      const secs = inIso && outIso ? diffSecondsBetweenIso(inIso, outIso) : 0;
      return [
        r.name,
        r.email,
        r.department,
        r.date,
        inIso ? formatTimeHHmmss(inIso) : '-',
        outIso ? formatTimeHHmmss(outIso) : '-',
        secs > 0 ? formatDurationHMS(secs) : '-',
      ].join(',');
    });
    return [header.join(','), ...lines].join('\n');
  }, [attRows]);

  const downloadCsv = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (role !== 'admin') {
    return <NotAuthorized />;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStat label="Present Today" value={overview.presentToday} color="#2563EB" />
        <KPIStat label="Absent Today" value={overview.absentToday} color="#EF4444" />
        <KPIStat label="Late" value={overview.late} color="#F59E0B" />
        <KPIStat label="Total Employees" value={overview.totalEmployees} color="#10b981" />
      </section>

      <Card
        title="Attendance Overview"
        actions={
          <div className="flex items-center gap-2">
            <input
              aria-label="Search employees"
              type="text"
              placeholder="Search name or email"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
            <select
              aria-label="Department filter"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value, page: 1 }))}
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
            </select>
            <DateRangePicker
              start={filters.start}
              end={filters.end}
              onChange={(from, to) => setFilters((f) => ({ ...f, start: from || '', end: to || '', page: 1 }))}
            />
            <Button variant="secondary" onClick={downloadCsv} ariaLabel="Export CSV">
              Export CSV
            </Button>
          </div>
        }
      >
        {attLoading ? (
          <div className="text-sm text-gray-600">Loading attendance...</div>
        ) : (
          <>
            <Table columns={columns} data={viewRows} empty="No matching records." />
            <div className="mt-3">
              <Pagination
                page={filters.page}
                pageSize={filters.pageSize}
                total={attTotal}
                onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          </>
        )}
      </Card>

      <Card title="Employees">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-semibold text-gray-700 py-2">Name</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-2">Email</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-2">Department</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-2">Role</th>
                <th className="text-left text-sm font-semibold text-gray-700 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {empRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm text-gray-600 py-2">No employees found.</td>
                </tr>
              ) : (
                empRows.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100">
                    <td className="py-2 text-sm">{e.name}</td>
                    <td className="py-2 text-sm">{e.email}</td>
                    <td className="py-2 text-sm">{e.department}</td>
                    <td className="py-2 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{e.role}</span>
                    </td>
                    <td className="py-2 text-sm">{e.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
