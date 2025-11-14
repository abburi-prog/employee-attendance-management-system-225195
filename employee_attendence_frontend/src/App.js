import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
 * ProtectedRoute: minimal auth guard for protected routes.
 * It checks the AuthContext's user and redirects unauthenticated users to /login.
 */
// PUBLIC_INTERFACE
function ProtectedRoute({ children }) {
  /** Guard that redirects to /login when unauthenticated; waits for initial auth load. */
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for AuthProvider's initial loading to avoid flicker
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    // Small placeholder while auth initializes
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * AppShell composes providers and routes.
 * Default route redirects to /login.
 * Wrap protected routes to require authentication.
 */
// PUBLIC_INTERFACE
function AppShell() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <Layout>
            <Routes>
              {/* Default route → /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <Attendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apply-leave"
                element={
                  <ProtectedRoute>
                    <ApplyLeave />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-leaves"
                element={
                  <ProtectedRoute>
                    <MyLeaveHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave-balance"
                element={
                  <ProtectedRoute>
                    <LeaveBalance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leaves"
                element={
                  <ProtectedRoute>
                    <AdminLeaveDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin dashboard page remains protected by auth; role enforcement occurs inside page */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Other public/supporting routes */}
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/not-authorized" element={<NotAuthorized />} />

              {/* 404 */}
              <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
            </Routes>
          </Layout>
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
