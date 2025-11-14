import React from 'react';
import AdminDashboard from '../components/AdminDashboard';
import { useAuth } from '../context/AuthContext';

/**
 * Admin route is public-safe now. If a user is not authenticated or not an admin,
 * show a limited notice. When authenticated and admin, show the admin dashboard.
 */
// PUBLIC_INTERFACE
export default function AdminPage() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            color: '#7C2D12',
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          Admin features require authentication and proper permissions.
        </div>
      </div>
    );
  }

  if (profile && profile.role !== 'admin') {
    return <div style={{ padding: 24 }}>You do not have permission to view this page.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <AdminDashboard />
    </div>
  );
}
