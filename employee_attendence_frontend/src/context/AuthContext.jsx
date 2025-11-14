import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';

/**
 * AuthContext provides current user session info, profile, and auth helpers.
 * It subscribes to Supabase auth state changes and exposes loading and error.
 */
const AuthContext = createContext({
  user: null,
  session: null,
  profile: null, // { full_name, role, ... }
  loading: true,
  error: null,
  signUp: async (_email, _password, _fullName) => {},
  signIn: async (_email, _password) => {},
  signOut: async () => {},
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * AuthProvider wraps the app and manages the authenticated user state.
   * It initializes from supabase.auth.getSession and listens to onAuthStateChange.
   * On login, it fetches the user's profile from 'profiles' table if available.
   */
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to fetch the profile for current user
  const loadProfile = async (uid) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    try {
      const { data, error: pErr } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', uid)
        .single();
      if (pErr) {
        // If table absent or row missing, don't crash the app; set to null
        // eslint-disable-next-line no-console
        console.warn('Profile fetch warning:', pErr.message);
        setProfile(null);
      } else {
        setProfile(data || null);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Profile fetch failed:', e?.message);
      setProfile(null);
    }
  };

  // Initial session retrieval
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) setError(sessionError);

        if (isMounted) {
          setSession(currentSession || null);
          const currentUser = currentSession?.user || null;
          setUser(currentUser);
          if (currentUser?.id) await loadProfile(currentUser.id);
        }
      } catch (err) {
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession || null);
      const newUser = newSession?.user || null;
      setUser(newUser);
      if (newUser?.id) {
        await loadProfile(newUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      // Ensure cleanup of subscription
      subscription.subscription?.unsubscribe?.();
    };
  }, []);

  // PUBLIC_INTERFACE
  const signUp = async (email, password, fullName) => {
    /**
     * Sign up user via email/password and store optional full_name in user metadata.
     * Also ensures profile can be created via RLS trigger in DB if configured.
     *
     * If REACT_APP_FRONTEND_URL is set, pass it as emailRedirectTo to ensure the confirmation
     * link returns to this app (useful in development). Otherwise rely on Supabase Site URL.
     */
    setError(null);
    const redirectTo = process.env.REACT_APP_FRONTEND_URL;
    const baseOptions = fullName ? { data: { full_name: fullName } } : {};
    const options = redirectTo ? { ...baseOptions, emailRedirectTo: redirectTo } : baseOptions;

    const { data, error: sErr } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    if (sErr) {
      setError(sErr);
      throw sErr;
    }
    // data.session may be null if email confirmation is on; handle gracefully
    return data;
  };

  // PUBLIC_INTERFACE
  const signIn = async (email, password) => {
    /** Sign in using email/password. */
    setError(null);
    const { data, error: iErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (iErr) {
      setError(iErr);
      throw iErr;
    }
    return data;
  };

  // PUBLIC_INTERFACE
  const signOut = async () => {
    /** Sign out the current user. */
    setError(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      setError(e);
      throw e;
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      error,
      signUp,
      signIn,
      signOut,
    }),
    [user, session, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context values. */
  return useContext(AuthContext);
}
