import React from 'react';
import TopNav from './TopNav';
import SideNav from './SideNav';

/**
 * App layout with TopNav and SideNav, responsive for small screens (stacked).
 */
// PUBLIC_INTERFACE
export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--ocean-background)' }}>
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-4 flex gap-4">
        <SideNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
