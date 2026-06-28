'use client';

import {
  exportInvoicesCsv,
  filterInvoices,
  handleInvoiceImport,
  openInvoiceModal,
  recalcAllInvoices,
  triggerInvoiceImport,
  updateInvoiceFilters
} from '../opsGlobalActions';

export function OpsInvoicesPage() {
  return (
    <div className="page" id="page-invoices">
      <div className="section-head">
        <h2>Invoices</h2>
        <div className="crm-toolbar">
          <input className="search-input" placeholder="Search invoices..." onInput={(event) => filterInvoices(event.currentTarget)} />
          <button className="btn btn-primary btn-sm" onClick={openInvoiceModal}>+ Add Invoice</button>
          <button className="btn btn-ghost btn-sm" onClick={triggerInvoiceImport}>Import Admin Tribe Invoice CSV</button>
        </div>
      </div>
      <div className="filter-row">
        <select id="invoice-date-basis" onChange={updateInvoiceFilters}>
          <option value="booked">Booked day</option>
          <option value="issue">Issued date</option>
          <option value="due">Due date</option>
        </select>
        <select id="invoice-period-filter" onChange={updateInvoiceFilters}>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
          <option value="custom">Custom range</option>
        </select>
        <select id="invoice-status-filter" onChange={updateInvoiceFilters}>
          <option value="all">All statuses</option>
          <option value="open">Open balance</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
        <input type="date" id="invoice-date-from" onChange={updateInvoiceFilters} />
        <input type="date" id="invoice-date-to" onChange={updateInvoiceFilters} />
        <button className="btn btn-ghost btn-sm" onClick={exportInvoicesCsv}>⬇ Export CSV</button>
        <button className="btn btn-ghost btn-sm" onClick={recalcAllInvoices}>↻ Recalculate</button>
        <div className="filter-summary" id="invoice-filter-summary">Showing this month's booked days</div>
      </div>
          <input type="file" id="invoice-import-input" accept=".csv,text/csv" style={{display: 'none'}} onChange={(event) => handleInvoiceImport(event.nativeEvent)} />
      <div className="import-panel">
        <div>
          <div className="title" id="invoice-import-title">Synced Invoice Import</div>
          <div className="copy" id="invoice-import-summary">Import the Admin Tribe invoice export here to keep a full payment history inside the private Shoreline ops app.</div>
        </div>
        <div className="import-pill" id="invoice-import-pill">No invoice import yet</div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Invoices in view</div><div className="value" id="invoice-kpi-count">0</div><div className="delta up" id="invoice-kpi-updated">0 rows synced</div></div>
        <div className="kpi-card"><div className="label">Collected revenue</div><div className="value" style={{color: 'var(--green)'}} id="invoice-kpi-paid">$0</div><div className="delta up" id="invoice-kpi-paid-count">0 paid invoices</div></div>
        <div className="kpi-card"><div className="label">Open balance</div><div className="value" style={{color: 'var(--amber)'}} id="invoice-kpi-open">$0</div><div className="delta warn" id="invoice-kpi-open-count">0 open invoices</div></div>
        <div className="kpi-card"><div className="label">Unknown customers</div><div className="value" style={{color: 'var(--wave)'}} id="invoice-kpi-unknown">0</div><div className="delta warn">Auto-generated POS invoices</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th><th>Items</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="invoice-table" />
        </table>
      </div>
    </div>
  );
}
