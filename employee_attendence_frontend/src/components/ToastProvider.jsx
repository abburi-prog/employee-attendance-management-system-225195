import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';

/**
 * ToastProvider renders transient notifications at the app root.
 * Use useToast().show({ type: 'success'|'error'|'info', message }) to display.
 */
const ToastContext = createContext({
  show: (_opts) => {},
});

// PUBLIC_INTERFACE
export function useToast() {
  /** Access show() to trigger a toast. */
  return useContext(ToastContext);
}

const containerStyle = {
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const getToastStyle = (type) => {
  const base = {
    padding: '10px 12px',
    borderRadius: 10,
    minWidth: 240,
    maxWidth: 360,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    color: '#111827',
    background: 'var(--ocean-surface)',
    borderLeft: '4px solid var(--ocean-primary)',
    fontSize: 14,
  };
  if (type === 'success') return { ...base, borderLeftColor: '#16a34a' };
  if (type === 'error') return { ...base, borderLeftColor: '#EF4444' };
  if (type === 'info') return { ...base, borderLeftColor: '#2563EB' };
  return base;
};

// PUBLIC_INTERFACE
export default function ToastProvider({ children }) {
  /**
   * Manages a list of toasts with auto-dismiss timers.
   */
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((opts) => {
    const id = ++idRef.current;
    const toast = { id, type: opts?.type || 'info', message: opts?.message || '' };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => remove(id), opts?.duration ?? 3000);
  }, [remove]);

  const value = useMemo(() => ({ show }), [show]);

  useEffect(() => {
    // keyboard accessibility: allow ESC to clear all
    const onKey = (e) => {
      if (e.key === 'Escape') setToasts([]);
    };
    window.addEventListener('keydown', onKey);

    // Listen for service layer broadcast events so services can show toasts without direct coupling
    const onToastEvent = (e) => {
      const { message, type, duration } = e?.detail || {};
      if (message) show({ message, type, duration });
    };
    window.addEventListener('app:toast', onToastEvent);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('app:toast', onToastEvent);
    };
  }, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={containerStyle} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} role="status" style={getToastStyle(t.type)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
