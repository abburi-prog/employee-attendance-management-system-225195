import React, { useMemo } from 'react';
import Card from '../components/ui/Card';

/**
 * Settings page: display feature flags placeholder loaded from env var REACT_APP_FEATURE_FLAGS
 */
// PUBLIC_INTERFACE
export default function SettingsPage() {
  const flags = useMemo(() => {
    try {
      const raw = process.env.REACT_APP_FEATURE_FLAGS || '{}';
      if (typeof raw === 'string') {
        return JSON.parse(raw);
      }
      return raw || {};
    } catch {
      return {};
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Feature Flags">
        <pre className="text-sm bg-gray-50 rounded-md p-3 border border-gray-200 overflow-auto">
{JSON.stringify(flags, null, 2)}
        </pre>
        <div className="text-sm text-gray-600 mt-2">
          This is a placeholder. Wire up your feature flag provider here in the future.
        </div>
      </Card>
    </div>
  );
}
