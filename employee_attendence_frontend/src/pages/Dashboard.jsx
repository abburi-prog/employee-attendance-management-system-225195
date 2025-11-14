import React from 'react';
import ClockInOut from '../components/ClockInOut';
import AttendanceTable from '../components/AttendanceTable';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard page is now public.
 * If a user is authenticated, they can use clock-in/out and see personal records.
 * If not authenticated, show a friendly info message and disable actions.
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {!user ? (
        <div
          role="status"
          style={{
            maxWidth: 1000,
            margin: '0 auto 16px',
            padding: 12,
            borderRadius: 8,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: 14,
          }}
        >
          You are viewing the public dashboard. Sign in is optional; authentication enables personal clock-in and attendance records.
        </div>
      ) : null}
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
