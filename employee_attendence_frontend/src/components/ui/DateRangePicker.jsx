import React, { useEffect, useState } from 'react';

/**
 * Minimal date range picker using native input[type=date].
 */
// PUBLIC_INTERFACE
export default function DateRangePicker({ start, end, onChange }) {
  const [from, setFrom] = useState(start || '');
  const [to, setTo] = useState(end || '');

  useEffect(() => {
    setFrom(start || '');
    setTo(end || '');
  }, [start, end]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">
        From
        <input
          aria-label="From date"
          className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
          type="date"
          value={from}
          onChange={(e) => {
            const v = e.target.value;
            setFrom(v);
            onChange?.(v, to);
          }}
        />
      </label>
      <label className="text-sm text-gray-600">
        To
        <input
          aria-label="To date"
          className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
          type="date"
          value={to}
          onChange={(e) => {
            const v = e.target.value;
            setTo(v);
            onChange?.(from, v);
          }}
        />
      </label>
    </div>
  );
}
