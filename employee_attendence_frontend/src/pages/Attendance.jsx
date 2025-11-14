import React from 'react';
import useAttendance from '../hooks/useAttendance';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import DateRangePicker from '../components/ui/DateRangePicker';
import { formatTimeHHmmss } from '../utils/time';
import { formatDurationHMS, diffSecondsBetweenIso } from '../utils/duration';

/**
 * Attendance page: Clock In/Out with today's status and history table with filters and pagination.
 */
// PUBLIC_INTERFACE
export default function AttendancePage() {
  const {
    today, loading, history, histLoading, page, pageSize, total, setPage, setStart, setEnd, onClockIn, onClockOut,
  } = useAttendance({});

  // Columns expect formatted strings; history will carry ISO times and we format here if needed.
  const columns = [
    { key: 'date', title: 'Date', dataIndex: 'date' },
    { key: 'checkIn', title: 'Check-In', dataIndex: 'checkIn' },
    { key: 'checkOut', title: 'Check-Out', dataIndex: 'checkOut' },
    { key: 'hours', title: 'Hours', dataIndex: 'hours' },
  ];

  const checkInText = today.checkInAt ? formatTimeHHmmss(today.checkInAt) : '-';
  const checkOutText = today.checkOutAt ? formatTimeHHmmss(today.checkOutAt) : '-';

  let stateText = 'Not clocked in';
  if (today.state === 'in') {
    stateText = `Clocked in at ${checkInText}`;
  } else if (today.state === 'out') {
    const secs = diffSecondsBetweenIso(today.checkInAt, today.checkOutAt);
    stateText = `Clocked out at ${checkOutText} • Worked ${formatDurationHMS(secs)}`;
  }

  // Ensure history rows show seconds and humanized duration (compute from ISO).
  const historyWithFormattedTimes = history.map((r) => {
    const checkInIso = r.checkIn && r.checkIn !== '-' ? r.checkIn : null;
    const checkOutIso = r.checkOut && r.checkOut !== '-' ? r.checkOut : null;
    const secs = checkInIso && checkOutIso ? diffSecondsBetweenIso(checkInIso, checkOutIso) : 0;
    return {
      ...r,
      checkIn: checkInIso ? formatTimeHHmmss(checkInIso) : '-',
      checkOut: checkOutIso ? formatTimeHHmmss(checkOutIso) : '-',
      hours: secs > 0 ? formatDurationHMS(secs) : '-',
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Clock In / Out"
        actions={
          <div className="flex gap-2">
            <Button onClick={onClockIn} disabled={loading || today.state === 'in'} ariaLabel="Clock In">
              {loading && today.state !== 'in' ? 'Working...' : 'Clock In'}
            </Button>
            <Button
              variant="secondary"
              onClick={onClockOut}
              disabled={loading || today.state !== 'in'}
              ariaLabel="Clock Out"
            >
              {loading && today.state === 'in' ? 'Working...' : 'Clock Out'}
            </Button>
          </div>
        }
      >
        <div className="text-sm text-gray-700">{stateText}</div>
      </Card>

      <Card
        title="Attendance History"
        actions={
          <DateRangePicker
            onChange={(from, to) => {
              setStart(from || '');
              setEnd(to || '');
              setPage(1);
            }}
          />
        }
      >
        {histLoading ? (
          <div className="text-sm text-gray-600">Loading history...</div>
        ) : (
          <>
            <Table columns={columns} data={historyWithFormattedTimes} empty="No attendance records found." />
            <div className="mt-3">
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
