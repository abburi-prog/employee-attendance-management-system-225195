import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClockInOut from '../components/ClockInOut';
import AttendanceTable from '../components/AttendanceTable';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard page for authenticated users.
 * Renders clock controls and current user's attendance.
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    // ProtectedRoute should handle redirect; render nothing here to avoid double navigation.
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Sign Out
        </button>
      </div>
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
