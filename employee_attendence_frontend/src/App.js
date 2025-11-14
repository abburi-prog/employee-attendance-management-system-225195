import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ThemeProvider from './theme/ThemeProvider';
import ToastProvider from './components/ToastProvider';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import NotAuthorized from './pages/NotAuthorized';

/**
 * AppShell composes providers and routes. All routes are public; Admin page
 * itself handles role message. Default route redirects to /dashboard.
 */
// PUBLIC_INTERFACE
function AppShell() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/not-authorized" element={<NotAuthorized />} />
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
