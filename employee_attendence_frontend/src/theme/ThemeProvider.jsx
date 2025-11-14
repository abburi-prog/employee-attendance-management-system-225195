import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

/**
 * ThemeProvider implements the Ocean Professional theme using CSS variables and
 * exposes helpers to toggle between light/dark. It ensures consistent colors throughout.
 */
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

// PUBLIC_INTERFACE
export function useTheme() {
  /** Access the current theme and toggle function. */
  return useContext(ThemeContext);
}

// PUBLIC_INTERFACE
export default function ThemeProvider({ children }) {
  /**
   * Provides light/dark theme state and sets document-level data-theme attribute.
   * Uses Ocean Professional color palette for variables.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Define CSS variables for Ocean Professional palette
    const root = document.documentElement;
    const isDark = theme === 'dark';

    // Base palette
    root.style.setProperty('--ocean-primary', '#2563EB');
    root.style.setProperty('--ocean-secondary', '#F59E0B');
    root.style.setProperty('--ocean-success', '#F59E0B');
    root.style.setProperty('--ocean-error', '#EF4444');
    root.style.setProperty('--ocean-background', isDark ? '#0f172a' : '#f9fafb');
    root.style.setProperty('--ocean-surface', isDark ? '#111827' : '#ffffff');
    root.style.setProperty('--ocean-text', isDark ? '#f9fafb' : '#111827');
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
