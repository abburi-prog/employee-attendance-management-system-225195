import React from 'react';

/**
 * Card wrapper for content sections.
 */
// PUBLIC_INTERFACE
export default function Card({ title, actions, children, className = '' }) {
  return (
    <section
      className={`bg-white rounded-xl shadow-soft p-5 ${className}`}
      style={{ background: 'var(--ocean-surface)', color: 'var(--ocean-text)' }}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between mb-3">
          {title ? <h3 className="text-base font-semibold">{title}</h3> : <span />}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
