import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

/**
 * Account page
 * Shows basic user info (email, role) from AuthContext with placeholders for future settings.
 * Accessible and styled per Ocean Professional theme.
 */
// PUBLIC_INTERFACE
export default function Account() {
  const { user, profile } = useAuth();
  const email = user?.email || 'Unknown';
  const role = profile?.role || 'employee';

  return (
    <div className="flex flex-col gap-4">
      <header className="mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ocean-text)' }}>
          Account
        </h1>
        <p className="text-sm text-gray-600">Manage your profile and settings.</p>
      </header>

      <Card title="Profile">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold"
            >
              {email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Email:</span> {email}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Role:</span> {role}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Preferences">
        <div className="text-sm text-gray-600">
          Placeholder for account preferences and settings. Coming soon.
        </div>
        <div className="mt-3">
          <Button variant="secondary" ariaLabel="Save preferences" disabled>
            Save (disabled placeholder)
          </Button>
        </div>
      </Card>
    </div>
  );
}
