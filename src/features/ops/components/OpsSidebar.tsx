'use client';

import type { MouseEvent } from 'react';

import { showOpsPage } from '../opsGlobalActions';

type OpsNavPage =
  | 'dashboard'
  | 'bookings'
  | 'reports'
  | 'invoices'
  | 'crm'
  | 'waivers'
  | 'expenses'
  | 'maintenance'
  | 'tracking'
  | 'comms'
  | 'reviews'
  | 'social'
  | 'reminders'
  | 'system';

export function OpsSidebar() {
  const showPage = (page: OpsNavPage) => (event: MouseEvent<HTMLButtonElement>) => {
    showOpsPage(page, event.currentTarget);
  };

  return (
    <aside className="sidebar">
  <div className="sidebar-logo">
    <div className="brand">Shoreline</div>
    <div className="sub">Operations</div>
  </div>
  <div className="nav-section">Main</div>
  <button className="nav-item active" data-page="dashboard" onClick={showPage('dashboard')}><span className="icon">📊</span><span>Dashboard</span></button>
  <button className="nav-item" data-page="bookings" onClick={showPage('bookings')}><span className="icon">📅</span><span>Bookings</span><span className="nav-badge" id="pending-badge">0</span></button>
  <div className="nav-section">Business</div>
  <button className="nav-item" data-page="reports" onClick={showPage('reports')}><span className="icon">📈</span><span>Reports</span></button>
  <button className="nav-item" data-page="invoices" onClick={showPage('invoices')}><span className="icon">🧾</span><span>Invoices</span></button>
  <button className="nav-item" data-page="crm" onClick={showPage('crm')}><span className="icon">👥</span><span>Customers</span></button>
  <button className="nav-item" data-page="waivers" onClick={showPage('waivers')}><span className="icon">📝</span><span>Waivers</span></button>
  <button className="nav-item" data-page="expenses" onClick={showPage('expenses')}><span className="icon">💸</span><span>Expenses</span></button>
  <button className="nav-item" data-page="maintenance" onClick={showPage('maintenance')}><span className="icon">🔧</span><span>Maintenance</span></button>
  <button className="nav-item" data-page="tracking" onClick={showPage('tracking')}><span className="icon">📡</span><span>Tracking</span></button>
  <div className="nav-section">Growth</div>
  <button className="nav-item" data-page="comms" onClick={showPage('comms')}><span className="icon">💬</span><span>Comms</span></button>
  <button className="nav-item" data-page="reviews" onClick={showPage('reviews')}><span className="icon">⭐</span><span>Reviews</span></button>
  <button className="nav-item" data-page="social" onClick={showPage('social')}><span className="icon">📣</span><span>Social</span></button>
  <button className="nav-item" data-page="reminders" onClick={showPage('reminders')}><span className="icon">🔔</span><span>Re-engage</span></button>
  <div className="nav-section" data-role="developer">Developer</div>
  <button className="nav-item" data-page="system" data-role="developer" onClick={showPage('system')}><span className="icon">🛠️</span><span>System</span></button>
  <div className="sidebar-bottom"><div className="version">Shoreline Ops v1.1.0</div></div>
</aside>
  );
}
