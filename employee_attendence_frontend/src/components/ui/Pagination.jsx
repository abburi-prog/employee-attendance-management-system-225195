import React from 'react';
import Button from './Button';

/**
 * Client-side pagination control with prev/next and page indicators.
 */
// PUBLIC_INTERFACE
export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" disabled={prevDisabled} onClick={() => onChange(page - 1)} ariaLabel="Previous page">
        Prev
      </Button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" disabled={nextDisabled} onClick={() => onChange(page + 1)} ariaLabel="Next page">
        Next
      </Button>
    </div>
  );
}
