import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';

/**
 * AuthContext provides current user session info and auth helpers.
 * It subscribes to Supabase auth state changes and exposes loading and error.
 */
const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * AuthProvider wraps the app and manages the authenticated user state.
   * It initializes from supabase.auth.getUser and listens to onAuthStateChange.
   */
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial session retrieval
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError);
        }
        if (isMounted) {
          setSession(currentSession || null);
          setUser(currentSession?.user || null);
        }
      } catch (err) {
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      setUser(newSession?.user || null);
    });

    return () => {
      isMounted = false;
      subscription.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          setError(e);
        }
      },
    }),
    [user, session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context values. */
  return useContext(AuthContext);
}
