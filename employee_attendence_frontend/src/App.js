import React, { useEffect, useState, useMemo } from 'react';
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
 * Routing contract:
 * - "/" → redirects to "/login"
 * - "/login" is public (not wrapped by app Layout)
 * - All other routes are protected by ProtectedRoute and then rendered inside Layout
 * - Catch-all "*" redirects unauthenticated users to "/login" and authenticated users to "/dashboard"
 */

/**
 * ProtectedRoute: robust auth guard for protected routes.
 * It checks AuthContext for a user and redirects unauthenticated users to /login.
 * While auth state initializes, it shows a lightweight loading placeholder.
 */
/**
 * ProtectedRoute enforces authentication without showing any loading UI.
 * While auth is initializing, we render null (no spinner) and let routing resolve
 * once state updates. If unauthenticated, we Navigate to /login.
 */
function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // During auth initialization, render a minimal placeholder to avoid a blank screen.
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/**
 * PublicOnlyRoute ensures authenticated users don't see the login page.
 * If authenticated, it redirects to /dashboard.
 */
/**
 * PublicOnlyRoute hides its content when authenticated and never shows loaders.
 */
function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

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
                - If authenticated (edge), redirect to /dashboard so no route renders by default
                - This enforces /dashboard as the post-login default for unknown paths */}
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
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="text-sm text-gray-600">Loading…</span>
      </div>
    );
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
