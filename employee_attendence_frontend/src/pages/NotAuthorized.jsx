import React from 'react';
import Card from '../components/ui/Card';

/**
 * Friendly message when user tries to access restricted routes without role.
 */
// PUBLIC_INTERFACE
export default function NotAuthorized() {
  return (
    <Card title="Not Authorized">
      <p className="text-sm text-gray-700">
        You don't have permission to access this page. If you believe this is a mistake, contact an administrator.
      </p>
    </Card>
  );
}
