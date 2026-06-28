'use client';

import { exportReportsCsv } from '../opsGlobalActions';

export function OpsReportsPage() {
  return (
    <div className="page" id="page-reports">
      <div className="section-head"><h2>Owner Reports</h2><div className="filter-summary">Revenue, bookings &amp; expenses at a glance · this month vs last</div></div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Revenue · this month</div><div className="value" style={{color: 'var(--green)'}} id="rep-revenue">$0</div><div className="delta" id="rep-revenue-delta">—</div></div>
        <div className="kpi-card"><div className="label">Bookings · this month</div><div className="value" id="rep-bookings">0</div><div className="delta" id="rep-bookings-delta">—</div></div>
        <div className="kpi-card"><div className="label">Expenses · this month</div><div className="value" style={{color: 'var(--amber)'}} id="rep-expenses">$0</div><div className="delta" id="rep-expenses-delta">—</div></div>
        <div className="kpi-card"><div className="label">Net · this month</div><div className="value" id="rep-net">$0</div><div className="delta" id="rep-net-delta">—</div></div>
      </div>
      <div className="chart-card money-hide" style={{marginTop: '1.6rem'}}>
        <h3>Revenue by rental type · this month</h3>
        <div className="mini-kpis">
          <div className="mini-kpi"><strong id="rep-rev-jetski">$0</strong><span>Jet Skis</span></div>
          <div className="mini-kpi"><strong id="rep-rev-boat" style={{color: 'var(--gold)'}}>$0</strong><span>Boat</span></div>
          <div className="mini-kpi"><strong id="rep-rev-bundle">$0</strong><span>Bundles</span></div>
        </div>
        <div className="delta" id="rep-rev-boat-delta" style={{marginTop: '0.6rem'}}>—</div>
      </div>
      <div className="chart-card" style={{marginTop: '1.6rem'}}>
        <h3>Revenue — last 6 months</h3>
        <div className="bar-chart" id="reports-revenue-bars" />
      </div>
      <div className="section-head" style={{marginTop: '1.6rem'}}><h2>Monthly breakdown</h2><button className="btn btn-ghost btn-sm" onClick={exportReportsCsv}>⬇ Export CSV</button></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Month</th><th>Revenue</th><th>Boat</th><th>Bookings</th><th>Expenses</th><th>Net</th></tr></thead>
          <tbody id="reports-table" />
        </table>
      </div>
    </div>
  );
}
