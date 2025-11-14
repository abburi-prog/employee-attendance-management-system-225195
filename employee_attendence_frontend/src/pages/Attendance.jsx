import React from 'react';
import useAttendance from '../hooks/useAttendance';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import DateRangePicker from '../components/ui/DateRangePicker';

/**
 * Attendance page: Clock In/Out with today's status and history table with filters and pagination.
 */
// PUBLIC_INTERFACE
export default function AttendancePage() {
  const {
    today, loading, history, histLoading, page, pageSize, total, setPage, setStart, setEnd, onClockIn, onClockOut,
  } = useAttendance({});

  const columns = [
    { key: 'date', title: 'Date', dataIndex: 'date' },
    { key: 'checkIn', title: 'Check-In', dataIndex: 'checkIn' },
    { key: 'checkOut', title: 'Check-Out', dataIndex: 'checkOut' },
    { key: 'hours', title: 'Hours', dataIndex: 'hours' },
  ];

  const stateText =
    today.state === 'in'
      ? `Clocked in at ${today.checkInAt}`
      : today.state === 'out'
      ? `Clocked out at ${today.checkOutAt}`
      : 'Not clocked in';

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
            <Table columns={columns} data={history} empty="No attendance records found." />
            <div className="mt-3">
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
