import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';

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
