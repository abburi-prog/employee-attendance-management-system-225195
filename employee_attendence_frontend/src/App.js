import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import NavBar from './components/NavBar';

/**
 * NoOpProtected is a no-op wrapper that simply renders children.
 * It replaces the previous ProtectedRoute to make routes public while preserving structure.
 */
// PUBLIC_INTERFACE
function NoOpProtected({ children }) {
  /** Public wrapper that renders its children without auth checks. */
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
            {/* Default to public dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Public dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Admin remains routable; currently public via NoOpProtected.
                If admin auth is reintroduced later, swap NoOpProtected with a real guard. */}
            <Route
              path="/admin"
              element={
                <NoOpProtected>
                  <AdminPage />
                </NoOpProtected>
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
  /** Root component wrapped with AuthProvider to keep auth optional for future use. */
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
