import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import supabase from '../supabase/client';

// Role derivation strategy:
// 1) Try user.app_metadata.role or user.user_metadata.role
// 2) Try claims in access token (app_metadata on user object typically mirrors this)
// 3) Fallback to profiles table: { id (uuid) PK references auth.users, role text }
//    profiles table needs to exist with row per user

const DEFAULT_ROLE = 'user';
const ADMIN_ROLES = new Set(['admin', 'superadmin']);

// PUBLIC_INTERFACE
/**
 * AuthContextValue
 * Represents the auth state and helper methods exposed to the app.
 */
const AuthContext = createContext({
  loading: true,
  session: null,
  user: null,
  role: DEFAULT_ROLE,
  isAdmin: false,
  error: null,
  loginWithEmailPassword: async (_email, _password) => {},
  loginWithMagicLink: async (_email, _redirectTo) => {},
  logout: async () => {},
  refreshProfileRole: async () => {},
});

// Safety timeout to avoid hanging loading state if auth state change never arrives
const SAFETY_INIT_TIMEOUT_MS = 8000;

// PUBLIC_INTERFACE
/**
 * AuthProvider wraps the app and provides authentication state via context.
 * - Subscribes to supabase auth state changes
 * - Persists session and auto refreshes tokens
 * - Derives role from user/app_metadata or profiles table
 * - Exposes login/logout functions
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initTimeoutRef = useRef(null);

  const deriveRoleFromUser = (u) => {
    if (!u) return null;
    const metaRole =
      (u.app_metadata && (u.app_metadata.role || (u.app_metadata.claims && u.app_metadata.claims.role))) ||
      (u.user_metadata && u.user_metadata.role);
    if (typeof metaRole === 'string' && metaRole.trim()) {
      return metaRole.toLowerCase();
    }
    return null;
  };

  const fetchProfileRole = useCallback(async (uid) => {
    try {
      if (!uid) return null;
      const { data, error: dbErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();

      if (dbErr) {
        // eslint-disable-next-line no-console
        console.warn('Failed to read profile role:', dbErr.message);
        return null;
      }
      if (data && data.role) {
        return String(data.role).toLowerCase();
      }
      return null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Profile role fetch exception:', e);
      return null;
    }
  }, []);

  const computeRole = useCallback(
    async (u) => {
      // Try user metadata first
      let r = deriveRoleFromUser(u);
      if (r) return r;
      // Fallback to profiles table
      r = await fetchProfileRole(u?.id);
      return r || DEFAULT_ROLE;
    },
    [fetchProfileRole]
  );

  const refreshProfileRole = useCallback(async () => {
    if (!user) return DEFAULT_ROLE;
    const nextRole = await computeRole(user);
    setRole(nextRole);
    return nextRole;
  }, [user, computeRole]);

  // Initial session load + subscription
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data: { session: currentSession } = {} } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(currentSession || null);
        const u = currentSession?.user || null;
        setUser(u || null);
        const computedRole = await computeRole(u);
        if (isMounted) setRole(computedRole);
      } catch (e) {
        if (isMounted) setError(e);
      } finally {
        // keep safety timeout considerations: don't hang indefinitely
        if (isMounted) setLoading(false);
      }
    };

    // safety timeout to force loading=false even if Supabase event never fires
    initTimeoutRef.current = setTimeout(() => {
      if (isMounted && loading) {
        // eslint-disable-next-line no-console
        console.warn('Auth init safety timeout reached, proceeding without session.');
        setLoading(false);
      }
    }, SAFETY_INIT_TIMEOUT_MS);

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession || null);
      const u = newSession?.user || null;
      setUser(u);
      const computedRole = await computeRole(u);
      setRole(computedRole);
    });

    return () => {
      isMounted = false;
      if (subscription) subscription.subscription.unsubscribe();
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PUBLIC_INTERFACE
  /**
   * loginWithEmailPassword
   * Sign in the user using email/password.
   */
  const loginWithEmailPassword = useCallback(async (email, password) => {
    setError(null);
    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr) {
      setError(signErr);
      return { data: null, error: signErr };
    }
    return { data, error: null };
  }, []);

  // PUBLIC_INTERFACE
  /**
   * loginWithMagicLink
   * Sends a magic link to the provided email.
   * Use REACT_APP_FRONTEND_URL as redirect if provided, else window.location.origin.
   */
  const loginWithMagicLink = useCallback(async (email, redirectTo) => {
    setError(null);
    const siteUrl =
      redirectTo ||
      process.env.REACT_APP_FRONTEND_URL ||
      (typeof window !== 'undefined' ? window.location.origin : undefined);
    const { data, error: magicErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: siteUrl,
      },
    });
    if (magicErr) {
      setError(magicErr);
      return { data: null, error: magicErr };
    }
    return { data, error: null };
  }, []);

  // PUBLIC_INTERFACE
  /**
   * logout
   * Signs the current user out.
   */
  const logout = useCallback(async () => {
    setError(null);
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) {
      setError(signOutErr);
      return { error: signOutErr };
    }
    return { error: null };
  }, []);

  const contextValue = useMemo(
    () => ({
      loading,
      session,
      user,
      role,
      isAdmin: ADMIN_ROLES.has(role),
      error,
      loginWithEmailPassword,
      loginWithMagicLink,
      logout,
      refreshProfileRole,
    }),
    [
      loading,
      session,
      user,
      role,
      error,
      loginWithEmailPassword,
      loginWithMagicLink,
      logout,
      refreshProfileRole,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
/**
 * useAuth
 * Hook to access auth context.
 */
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
