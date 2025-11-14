import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';

// Simple top nav with theme toggle and minimal links
function NavBar({ theme, onToggle }) {
  const { user, signOut } = useAuth();
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div style={{ fontWeight: 700, color: '#2563EB' }}>Attendance</div>
      <Link to="/login" style={{ color: '#111827', textDecoration: 'none' }}>
        Login
      </Link>
      <Link to="/dashboard" style={{ color: '#111827', textDecoration: 'none' }}>
        Dashboard
      </Link>
      <Link to="/admin" style={{ color: '#111827', textDecoration: 'none' }}>
        Admin
      </Link>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {user ? (
          <button
            onClick={async () => {
              await signOut();
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        ) : null}
        <button
          className="theme-toggle"
          onClick={onToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </nav>
  );
}

// ProtectedRoute to guard authenticated pages
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// PUBLIC_INTERFACE
function AppShell() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>
      <div className="App" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <NavBar theme={theme} onToggle={toggleTheme} />
        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Root component wrapped with AuthProvider to provide auth state. */
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
