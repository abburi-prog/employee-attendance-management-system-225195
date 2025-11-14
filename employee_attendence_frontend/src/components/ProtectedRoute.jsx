import React from 'react';

/**
 * ProtectedRoute (No-Op)
 * Previously guarded routes behind authentication.
 * Now returns children directly to make all routes public.
 */
// PUBLIC_INTERFACE
export default function ProtectedRoute({ children }) {
  return children;
}
