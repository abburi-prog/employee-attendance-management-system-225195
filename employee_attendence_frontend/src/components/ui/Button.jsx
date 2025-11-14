import React from 'react';

/**
 * Button component with primary/secondary variants, accessible by default.
 */
// PUBLIC_INTERFACE
export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ariaLabel,
}) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm';
  const styles =
    variant === 'secondary'
      ? 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:ring-blue-500'
      : 'bg-[#2563EB] text-white hover:bg-blue-600 focus:ring-blue-500';
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${base} ${styles} ${disabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
