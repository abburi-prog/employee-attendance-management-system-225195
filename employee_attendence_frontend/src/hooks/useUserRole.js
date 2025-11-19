import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Returns the normalized user role from AuthContext.profile.
 * Falls back to 'employee' when profile is missing.
 */
// PUBLIC_INTERFACE
export default function useUserRole() {
  /** Simple helper to get current user's role consistent with AdminRoute. */
  const { profile } = useAuth();
  const role = useMemo(() => profile?.role || 'employee', [profile?.role]);
  return role;
}
