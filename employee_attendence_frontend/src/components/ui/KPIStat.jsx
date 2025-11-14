import React from 'react';

/**
 * KPIStat renders a compact card with a label, value, and optional accent color.
 */
// PUBLIC_INTERFACE
export default function KPIStat({ label, value, color = '#2563EB' }) {
  return (
    <div
      className="rounded-xl shadow-soft p-4"
      style={{ background: 'var(--ocean-surface)', color: 'var(--ocean-text)', borderLeft: `4px solid ${color}` }}
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
