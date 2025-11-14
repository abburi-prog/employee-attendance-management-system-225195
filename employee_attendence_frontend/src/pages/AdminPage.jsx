import React from 'react';
import AdminDashboard from '../components/AdminDashboard';
import { useAuth } from '../context/AuthContext';

/**
 * Admin route. Route-level guard not enforced here; rely on RLS and future guards.
 */
// PUBLIC_INTERFACE
export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!user) {
    return <div style={{ padding: 24 }}>Please sign in to access admin tools.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <AdminDashboard />
    </div>
  );
}
