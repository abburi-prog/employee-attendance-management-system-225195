import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import { useAuth } from '../context/AuthContext';

/**
 * Admin route. Access is allowed only when profile.role === 'admin'.
 * Otherwise redirect to Dashboard or show a message.
 */
// PUBLIC_INTERFACE
export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (profile && profile.role !== 'admin') {
        // Not an admin -> redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!user) return null; // already redirected
  if (profile && profile.role !== 'admin') {
    return <div style={{ padding: 24 }}>You do not have permission to view this page.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <AdminDashboard />
    </div>
  );
}
