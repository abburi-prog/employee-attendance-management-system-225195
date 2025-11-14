import React, { useEffect, useState } from 'react';
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

/**
 * ProtectedRoute: robust auth guard for protected routes.
 * It checks AuthContext for a user and redirects unauthenticated users to /login.
 * While auth state initializes, it shows a lightweight loading placeholder.
 */
// PUBLIC_INTERFACE
function ProtectedRoute() {
  /** Auth guard that wraps all protected sections and renders an Outlet on success. */
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!user) {
    // Preserve attempted path so after login you could navigate back if needed in the future
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/**
 * PublicOnlyRoute ensures authenticated users don't see the login page.
 * If authenticated, it redirects to /dashboard.
 */
// PUBLIC_INTERFACE
function PublicOnlyRoute() {
  /** Gate for pages that should only render when not authenticated (e.g., Login). */
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * AppShell composes providers and routes.
 * Rules:
 *  - "/" redirects to "/login"
 *  - "/login" is public
 *  - All other app routes are protected under <ProtectedRoute />
 *  - Catch-all (*) redirects unauthenticated users to "/login"
 */
// PUBLIC_INTERFACE
function AppShell() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            {/* Root always redirects to /login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public routes: render without the main app Layout */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected routes: wrap everything else under the guard and Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/apply-leave" element={<ApplyLeave />} />
                <Route path="/my-leaves" element={<MyLeaveHistory />} />
                <Route path="/leave-balance" element={<LeaveBalance />} />
                <Route path="/admin/leaves" element={<AdminLeaveDashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />
              </Route>
            </Route>

            {/* Catch-all:
                - If unauthenticated → redirect to /login
                - If authenticated (edge), redirect to /dashboard so no route renders by default */}
            <Route
              path="*"
              element={
                <AuthBoundaryRedirect />
              }
            />
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

/**
 * AuthBoundaryRedirect: catch-all handler that routes unknown paths appropriately.
 * Unauthenticated → /login, Authenticated → /dashboard.
 */
// PUBLIC_INTERFACE
function AuthBoundaryRedirect() {
  /** Redirect unknown routes based on auth state to ensure no default render leaks. */
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
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
