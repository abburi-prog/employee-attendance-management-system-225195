import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import SideNav from './SideNav';
import Navbar from '../Navbar';

/**
 * App layout with Navbar, TopNav and SideNav, responsive for small screens (stacked).
 * Navbar is mounted here so it only appears on protected sections after login.
 * Uses <Outlet /> to render nested route components inside the main area.
 */
// PUBLIC_INTERFACE
export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--ocean-background)' }}>
      <Navbar />
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-4 flex gap-4">
        <SideNav />
        <main className="flex-1">
          {children || null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
