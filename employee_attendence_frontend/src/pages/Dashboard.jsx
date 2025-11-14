import React from 'react';
import ClockInOut from '../components/ClockInOut';
import AttendanceTable from '../components/AttendanceTable';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard page for authenticated users.
 * Renders clock controls and current user's attendance.
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        Please sign in to access your dashboard.
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        <ClockInOut />
        <AttendanceTable />
      </div>
    </div>
  );
}
