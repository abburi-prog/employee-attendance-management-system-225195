import React, { useEffect, useState, useMemo, useRef } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThemeProvider from './theme/ThemeProvider';
import ToastProvider from './components/ToastProvider';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import NotAuthorized from './pages/NotAuthorized';
import ApplyLeave from "./pages/ApplyLeave";
import MyLeaveHistory from "./pages/MyLeaveHistory";
import AdminLeaveDashboard from "./pages/AdminLeaveDashboard";
import LeaveBalance from "./pages/LeaveBalance";
import Login from "./pages/Login";
import AdminDashboardShell from "./pages/admin/AdminDashboard";
import LeaveApprovals from "./pages/admin/LeaveApprovals";
import AttendanceViewer from "./pages/admin/AttendanceViewer";
import AdminRoute from './routes/AdminRoute';

/**
 * Routing contract (temporary diagnostic mode):
 * - "/" → redirects to "/login"
 * - "/login" is public (standalone, not wrapped by Layout)
 * - Protected routes: /dashboard, /attendance, /apply-leave, /my-leaves, /leave-balance, /settings
 * - Admin-only: /admin, /admin/leaves, /admin/attendance (all gated by <AdminRoute />)
 * - No catch-all ("*") route to avoid unexpected redirects during diagnosis
 */

/**
 * ProtectedRoute: guards authenticated areas; unauthenticated users go to /login.
 */
function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Safety timer: if auth doesn't resolve quickly, fail-safe to login
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading && !timerRef.current) {
      timerRef.current = setTimeout(() => setTimedOut(true), 3000);
    }
    if (!loading) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setTimedOut(false);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
  }

  // If timed out and still no user, default to login
  if ((!user && (timedOut || !loading)) || (!user && !loading)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/**
 * PublicOnlyRoute: prevents authenticated users from viewing public-only pages (e.g., /login).
 */
function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading && !timerRef.current) {
      timerRef.current = setTimeout(() => setTimedOut(true), 3000);
    }
    if (!loading) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setTimedOut(false);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading]);

  // If authenticated, do not allow /login
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  // While loading, but timed out, still allow access to the public page
  if (loading && !timedOut) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * AppShell composes providers and routes per the diagnostic routing rules above.
 * Note: Catch-all routes are intentionally disabled.
 */
// PUBLIC_INTERFACE
function AppShell() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            {/* Force "/" to redirect to "/login" */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public route: Login is standalone (no Layout) */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected routes inside Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/apply-leave" element={<ApplyLeave />} />
                <Route path="/my-leaves" element={<MyLeaveHistory />} />
                <Route path="/leave-balance" element={<LeaveBalance />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />

                {/* Admin-only routes gated by AdminRoute */}
                <Route element={<AdminRoute />}>
                  {/* Legacy single admin pages retained for compatibility */}
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/leaves" element={<AdminLeaveDashboard />} />
                  {/* Admin shell and nested routes */}
                  <Route path="/admin/*" element={<AdminDashboardShell />}>
                    <Route index element={<Navigate to="/admin/leaves" replace />} />
                    <Route path="leaves" element={<LeaveApprovals />} />
                    <Route path="attendance" element={<AttendanceViewer />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/*
              Temporary diagnostic change:
              - Catch-all wildcard route removed to prevent unwanted redirects (e.g., loops or blank screens).
              - AuthBoundaryRedirect is intentionally not used for now.
            */}
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Root component wrapped with AuthProvider to keep auth optional for future use. */
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
