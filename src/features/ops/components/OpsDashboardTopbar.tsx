'use client';

import { logoutOps, openBookingModal, toggleMobileNav } from '../opsGlobalActions';

export function OpsDashboardTopbar() {
  return (
    <div className="topbar">
      <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0}}>
        <button className="mobile-nav-toggle" id="mobile-nav-toggle" onClick={toggleMobileNav} aria-label="Open navigation">☰</button>
        <div className="topbar-title" id="page-title">Dashboard</div>
      </div>
      <div className="topbar-right">
        <span className="topbar-loc" style={{fontSize: '0.8rem', color: 'var(--muted)'}}>📍 Lake Lewisville · (469) 693-7164</span>
        <span className="ops-mode-pill browser" id="ops-mode-pill">Checking sync</span>
        <span className="ops-user-pill" id="ops-user-pill" style={{display: 'none'}} />
        <button className="btn btn-ghost btn-sm" id="logout-btn" onClick={logoutOps} style={{display: 'none'}}>Logout</button>
        <button className="btn btn-primary" id="topbar-booking-action" onClick={openBookingModal}>+ New Booking</button>
      </div>
    </div>
  );
}
