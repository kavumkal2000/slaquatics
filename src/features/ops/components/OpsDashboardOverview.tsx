'use client';

import { showOpsPage } from '../opsGlobalActions';

export function OpsDashboardOverview() {
  const showBookingsPage = () => {
    showOpsPage('bookings', document.querySelector('.nav-item[data-page="bookings"]'));
  };

  return (
    <div className="page active" id="page-dashboard">
      <div className="alerts" id="dashboard-alerts" />
      {/* TODAY RUN-SHEET (mobile-first day-of workflow) */}
      <div className="runsheet" id="today-runsheet" />
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Pending deposits</div><div className="value" style={{color: 'var(--wave)'}} id="dashboard-kpi-pending">0</div><div className="delta warn" id="dashboard-kpi-pending-meta">Waiting on follow-up</div></div>
        <div className="kpi-card money-hide"><div className="label">Monthly revenue</div><div className="value" style={{color: 'var(--green)'}} id="dashboard-kpi-revenue">$0</div><div className="delta up" id="dashboard-kpi-revenue-meta">Current month revenue</div></div>
        <div className="kpi-card"><div className="label">Bookings this month</div><div className="value" id="dashboard-kpi-bookings">0</div><div className="delta up" id="dashboard-kpi-bookings-meta">0 scheduled this month</div></div>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Bookings by week (this month)</h3>
          <div className="bar-chart" id="booking-bars" />
        </div>
        <div className="chart-card">
          <h3>Fleet mix</h3>
          <div className="donut-wrap">
            <svg width={100} height={100} viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={38} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
              <circle cx={50} cy={50} r={38} fill="none" stroke="#1a9ed4" strokeWidth={14} strokeDasharray="107 131" strokeDashoffset={0} transform="rotate(-90 50 50)" />
              <circle cx={50} cy={50} r={38} fill="none" stroke="#0fb8e0" strokeWidth={14} strokeDasharray="76 162" strokeDashoffset={-107} transform="rotate(-90 50 50)" />
              <circle cx={50} cy={50} r={38} fill="none" stroke="#10b981" strokeWidth={14} strokeDasharray="55 183" strokeDashoffset={-183} transform="rotate(-90 50 50)" />
            </svg>
            <div className="donut-legend" id="fleet-legend">
              <div className="legend-item"><div className="legend-dot" style={{background: '#1a9ed4'}} />2 Yamaha Jet Skis — 0</div>
              <div className="legend-item"><div className="legend-dot" style={{background: '#0fb8e0'}} />Boat Rental — 0</div>
              <div className="legend-item"><div className="legend-dot" style={{background: '#10b981'}} />Legacy jet ski packages — 0</div>
            </div>
          </div>
        </div>
      </div>
      <div className="section-head"><h2>Upcoming bookings</h2><button className="btn btn-ghost btn-sm" onClick={showBookingsPage}>View all</button></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Craft</th><th>Date</th><th>Duration</th><th>Total</th><th>Deposit</th><th>Status</th><th /></tr></thead>
          <tbody id="upcoming-bookings-table" />
        </table>
      </div>
    </div>
  );
}
