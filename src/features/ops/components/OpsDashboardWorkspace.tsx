'use client';

import {
  applyMassEmailQuickSelect,
  cleanupEmptyCustomers,
  copySocialCaption,
  filterCRM,
  filterMassEmailRecipients,
  filterWaivers,
  handleCRMImport,
  logCommunication,
  openCustomerModal,
  openExpenseModal,
  openMaintModal,
  openOpsModal,
  openTrackerModal,
  renderCommsPanel,
  renderMassEmailDraft,
  saveReviewSettings,
  saveSocialDraft,
  sendDirectMessage,
  sendMassEmail,
  sendReviewBlast,
  setCRMFilter,
  setCRMSort,
  setMassEmailAudienceMode,
  showOpsPage,
  publishSocialNow,
  switchReminderTab,
  triggerCRMImport,
  triggerInvoiceImport
} from '../opsGlobalActions';
import { OpsBookingsPage } from './OpsBookingsPage';
import { OpsDashboardOverview } from './OpsDashboardOverview';
import { OpsDashboardTopbar } from './OpsDashboardTopbar';
import { OpsInvoicesPage } from './OpsInvoicesPage';
import { OpsReportsPage } from './OpsReportsPage';

export function OpsDashboardWorkspace() {
  const showCustomersPage = () => {
    showOpsPage('crm', document.querySelector('.nav-item[data-page="crm"]'));
  };

  return (
    <div className="main">
  <OpsDashboardTopbar />
  <div className="content">
    {/* ═══ CREW SCHEDULE (restricted crew login only) ═══ */}
    <div className="page" id="page-crew">
      <div className="crew-wrap">
        <div className="crew-head">
          <h1 className="crew-title">Today's Schedule</h1>
          <p className="crew-sub" id="crew-date-label" />
        </div>
        <div id="crew-list" className="crew-list" />
      </div>
    </div>
    {/* ═══ DASHBOARD ═══ */}
    <OpsDashboardOverview />
    {/* ═══ REPORTS ═══ */}
    <OpsReportsPage />
    {/* ═══ BOOKINGS ═══ */}
    <OpsBookingsPage />
    {/* ═══ CRM ═══ */}
    <OpsInvoicesPage />
    {/* ═══ CRM ═══ */}
    <div className="page" id="page-crm">
      <div className="section-head">
        <h2>Customers</h2>
        <div className="crm-toolbar">
          <input className="search-input" placeholder="Search customers..." onInput={(event) => filterCRM(event.currentTarget)} />
          <button className="btn btn-ghost btn-sm" onClick={triggerCRMImport}>Import Admin Tribe CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => openOpsModal('crm-paste-modal')}>Paste CRM CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={cleanupEmptyCustomers}>🧹 Clean up empty</button>
          <button className="btn btn-primary btn-sm" onClick={openCustomerModal}>+ Add Customer</button>
        </div>
      </div>
      <input type="file" id="crm-import-input" accept=".csv,text/csv" style={{display: 'none'}} onChange={(event) => handleCRMImport(event.nativeEvent)} />
      <div className="import-panel">
        <div>
          <div className="title" id="crm-import-title">Secure Synced Import</div>
          <div className="copy" id="crm-import-summary">Export Contacts or Opportunities from Admin Tribe, then import the CSV here. Records are saved into the private Shoreline ops service and synced across signed-in sessions.</div>
        </div>
        <div className="import-pill" id="crm-import-pill">No CRM import yet</div>
      </div>
      <div className="list-card" id="owner-security-card" hidden>
        <div className="crm-workspace-head">
          <div>
            <h3>Owner account security</h3>
            <p id="owner-security-summary">Add passkeys after password sign-in, or change your owner password after password or passkey sign-in.</p>
          </div>
          <button className="btn btn-primary btn-sm" type="button" data-owner-auth-action="add-passkey">Add Passkey</button>
        </div>
        <div className="compose-grid" style={{marginTop: '1rem'}}>
          <div>
            <label htmlFor="owner-current-password">Current password</label>
            <input id="owner-current-password" type="password" autoComplete="current-password" placeholder="Required unless signed in with passkey" />
          </div>
          <div>
            <label htmlFor="owner-new-password">New password</label>
            <input id="owner-new-password" type="password" autoComplete="new-password" placeholder="6+ chars, uppercase, special" />
          </div>
        </div>
        <div className="compose-actions" style={{marginTop: '1rem'}}>
          <button className="btn btn-ghost btn-sm" type="button" data-owner-auth-action="change-password">Change Password</button>
          <span className="sub" id="owner-security-status" />
        </div>
      </div>
      <div className="kpi-grid crm-kpi-grid">
        <div className="kpi-card"><div className="label">Total customers</div><div className="value" id="crm-kpi-total">0</div><div className="delta up" id="crm-kpi-total-meta">All saved contacts</div></div>
        <div className="kpi-card"><div className="label">Need follow-up</div><div className="value" style={{color: 'var(--amber)'}} id="crm-kpi-followup">0</div><div className="delta warn" id="crm-kpi-followup-meta">No recent booking or touchpoint</div></div>
        <div className="kpi-card"><div className="label">Waivers on file</div><div className="value" style={{color: 'var(--green)'}} id="crm-kpi-waiver">0</div><div className="delta up" id="crm-kpi-waiver-meta">Ready for faster check-in</div></div>
        <div className="kpi-card"><div className="label">Best customers</div><div className="value" style={{color: 'var(--wave)'}} id="crm-kpi-best">0</div><div className="delta up" id="crm-kpi-best-meta">VIP, repeat, or high-value riders</div></div>
      </div>
      <div className="list-card crm-workspace">
        <div className="crm-workspace-head">
          <div>
            <h3>Run the customer list</h3>
            <p>Use this view to see who needs follow-up, who still needs a waiver, and who is worth rebooking first.</p>
          </div>
          <div className="crm-toolbar">
            <label style={{display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)'}}>
              Sort
              <select id="crm-sort" onChange={(event) => setCRMSort(event.currentTarget.value)}>
                <option value="recent">Recent activity</option>
                <option value="spend">Highest spend</option>
                <option value="bookings">Most bookings</option>
                <option value="name">Name A-Z</option>
              </select>
            </label>
          </div>
        </div>
        <div className="crm-chip-row" id="crm-filter-row">
          <button className="crm-chip active" onClick={(event) => setCRMFilter('all', event.currentTarget)}>All customers</button>
          <button className="crm-chip" onClick={(event) => setCRMFilter('followup', event.currentTarget)}>Need follow-up</button>
          <button className="crm-chip" onClick={(event) => setCRMFilter('waiver', event.currentTarget)}>Waiver needed</button>
          <button className="crm-chip" onClick={(event) => setCRMFilter('best', event.currentTarget)}>Best customers</button>
        </div>
        <div className="crm-summary-line" id="crm-summary-line">Loading customer summary...</div>
      </div>
      <div className="crm-grid" id="crm-grid" />
    </div>
    {/* ═══ WAIVERS ═══ */}
    <div className="page" id="page-waivers">
      <div className="section-head">
        <h2>Waivers</h2>
        <div className="crm-toolbar">
          <input className="search-input" placeholder="Search signed waivers..." onInput={(event) => filterWaivers(event.currentTarget)} />
          <button className="btn btn-ghost btn-sm" onClick={showCustomersPage}>Open customers</button>
        </div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Waivers on file</div><div className="value" style={{color: 'var(--green)'}} id="waiver-kpi-total">0</div><div className="delta up" id="waiver-kpi-total-meta">Signed waiver records in CRM</div></div>
        <div className="kpi-card"><div className="label">Signed this month</div><div className="value" style={{color: 'var(--wave)'}} id="waiver-kpi-month">0</div><div className="delta up" id="waiver-kpi-month-meta">Recent waiver submissions</div></div>
        <div className="kpi-card"><div className="label">Waiver-only leads</div><div className="value" style={{color: 'var(--amber)'}} id="waiver-kpi-leads">0</div><div className="delta warn" id="waiver-kpi-leads-meta">Signed but no booking yet</div></div>
        <div className="kpi-card"><div className="label">Missing emergency info</div><div className="value" id="waiver-kpi-emergency">0</div><div className="delta warn" id="waiver-kpi-emergency-meta">Records that need a quick cleanup</div></div>
      </div>
      <div className="import-panel">
        <div>
          <div className="title">Signed waiver records</div>
          <div className="copy">Every waiver submitted through the booking flow or the standalone waiver link lands here. Review the signed date, waiver details, and contact info without opening every customer one by one.</div>
        </div>
        <div className="import-pill" id="waiver-summary-pill">No signed waivers yet</div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Contact</th><th>Signed</th><th>Waiver details</th><th>Emergency contact</th><th>Booking history</th><th>Actions</th></tr></thead>
          <tbody id="waivers-table" />
        </table>
      </div>
    </div>
    {/* ═══ EXPENSES ═══ */}
    <div className="page" id="page-expenses">
      <div className="section-head">
        <h2>Expenses</h2>
        <button className="btn btn-primary btn-sm" onClick={openExpenseModal}>+ Add Expense</button>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">This month</div><div className="value" id="expense-kpi-month">$0</div><div className="delta warn" id="expense-kpi-month-meta">0 expenses logged</div></div>
        <div className="kpi-card"><div className="label">Recurring this month</div><div className="value" style={{color: 'var(--amber)'}} id="expense-kpi-delivery">$0</div><div className="delta warn" id="expense-kpi-delivery-meta">Active monthly charges this month</div></div>
        <div className="kpi-card"><div className="label">Season total</div><div className="value" style={{color: 'var(--wave)'}} id="expense-kpi-direct">$0</div><div className="delta up" id="expense-kpi-direct-meta">Projected seasonal recurring cost</div></div>
        <div className="kpi-card"><div className="label">Yearly recurring</div><div className="value" id="expense-kpi-ytd">$0</div><div className="delta up" id="expense-kpi-ytd-meta">Projected annual recurring cost</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Schedule</th><th>Expense</th><th>Notes</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody id="expense-table" />
        </table>
      </div>
    </div>
    {/* ═══ MAINTENANCE ═══ */}
    <div className="page" id="page-maintenance">
      <div className="section-head">
        <h2>Equipment Maintenance</h2>
        <div className="crm-toolbar">
          <button className="btn btn-ghost btn-sm" onClick={() => openOpsModal('fuel-modal')}>+ Log Fuel</button>
          <button className="btn btn-primary btn-sm" onClick={openMaintModal}>+ Log Service</button>
        </div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Fuel this month</div><div className="value" style={{color: 'var(--amber)'}} id="fuel-kpi-month">$0.00</div><div className="delta warn" id="fuel-kpi-month-meta">0 fuel entries this month</div></div>
        <div className="kpi-card"><div className="label">Fuel cost / rental hour</div><div className="value" id="fuel-kpi-rate">$0.00</div><div className="delta" id="fuel-kpi-rate-meta">No rental hours logged yet</div></div>
        <div className="kpi-card"><div className="label">Rental hours fueled</div><div className="value" style={{color: 'var(--wave)'}} id="fuel-kpi-hours">0.0</div><div className="delta up" id="fuel-kpi-hours-meta">This month</div></div>
      </div>
      <div className="list-card" style={{marginTop: '1.5rem', marginBottom: '1.5rem'}}>
        <div className="table-header"><div className="table-title">Fuel log</div></div>
        <div className="fuel-log" id="fuel-log" />
      </div>
      <div className="maint-grid" id="maint-grid" />
      <div style={{marginTop: '1.5rem'}} className="table-wrap">
        <div className="table-header"><div className="table-title">Service history</div></div>
        <table>
          <thead><tr><th>Equipment</th><th>Service type</th><th>Date</th><th>Hours at service</th><th>Cost</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody id="maint-log" />
        </table>
      </div>
    </div>
    {/* ═══ TRACKING ═══ */}
    <div className="page" id="page-tracking">
      <div className="section-head">
        <h2>Trackers</h2>
        <button className="btn btn-primary btn-sm" onClick={openTrackerModal}>+ Add tracker</button>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Active trackers</div><div className="value" id="tracking-kpi-active">0</div><div className="delta up" id="tracking-kpi-active-meta">0 units actively assigned</div></div>
        <div className="kpi-card"><div className="label">Monthly tracker cost</div><div className="value" style={{color: 'var(--amber)'}} id="tracking-kpi-monthly">$0</div><div className="delta warn" id="tracking-kpi-monthly-meta">Recurring tracker plans</div></div>
        <div className="kpi-card"><div className="label">Assigned trackers</div><div className="value" style={{color: 'var(--green)'}} id="tracking-kpi-assigned">0</div><div className="delta up" id="tracking-kpi-assigned-meta">Trackers tied to a ski or boat</div></div>
        <div className="kpi-card"><div className="label">Spare trackers</div><div className="value" style={{color: 'var(--wave)'}} id="tracking-kpi-spare">0</div><div className="delta warn" id="tracking-kpi-spare-meta">Ready for install or reassignment</div></div>
      </div>
      <div className="import-panel">
        <div>
          <div className="title">Tracker registry</div>
          <div className="copy">Save each tracker’s serial number, ShareSpot link, billing plan, and assigned jet ski or boat in one place. Use this section to keep the fleet hardware organized and open the saved live map when you need it.</div>
        </div>
        <div className="import-pill" id="tracking-summary-pill">No trackers added yet</div>
      </div>
      <div className="compose-grid" style={{marginBottom: '1rem'}}>
        <div className="list-card">
          <h3>Selected tracker</h3>
          <p>Choose a tracker below to view the saved assignment, billing details, and latest check-in without leaving ops.</p>
          <div className="list-stack" id="tracking-selected-card" style={{marginTop: '1rem'}} />
        </div>
        <div className="list-card">
          <h3>Tracker map</h3>
          <p>If the saved ShareSpot link allows embedding, the live map loads below. If not, use the open button to view the location in a new tab.</p>
          <div id="tracking-live-map" style={{marginTop: '1rem'}} />
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Device</th><th>Assigned asset</th><th>Provider &amp; Plan</th><th>Billing</th><th>Transaction</th><th>Status &amp; Live</th></tr></thead>
          <tbody id="tracking-table" />
        </table>
      </div>
    </div>
    {/* ═══ COMMUNICATIONS ═══ */}
    <div className="page" id="page-comms">
      <div className="section-head"><h2>Client Communications</h2></div>
      <div className="compose-grid">
        <div className="compose-card">
          <h3>1-to-1 follow-up</h3>
          <p id="comm-provider-note">Pick a customer, draft the message once, then send it from the connected provider.</p>
          <div style={{marginTop: '1rem'}}>
            <label htmlFor="comm-customer">Customer</label>
            <select id="comm-customer" onChange={renderCommsPanel} />
          </div>
          <div className="list-card" id="comm-customer-card" style={{marginTop: '1rem'}} />
          <div style={{marginTop: '1rem'}}>
            <label htmlFor="comm-message">Message</label>
            <textarea id="comm-message" onInput={renderCommsPanel} defaultValue={"Hi! This is Shoreline Aquatics checking in about your rental. Let us know if you want to lock in your next lake day."} />
          </div>
          <div className="compose-actions">
            <button className="btn btn-primary btn-sm" id="comm-text-link" onClick={() => sendDirectMessage('sms')}>Text customer</button>
            <button className="btn btn-ghost btn-sm" id="comm-email-link" onClick={() => sendDirectMessage('email')}>Email customer</button>
            <button className="btn btn-ghost btn-sm" onClick={logCommunication}>Log note</button>
          </div>
        </div>
        <div className="compose-card">
          <h3>Mass email</h3>
          <p id="mass-provider-note">Draft one campaign for every client with an email address. Shoreline Ops handles the provider batch limit automatically.</p>
          <div className="crm-toolbar" style={{marginTop: '1rem'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)'}}>
              Audience
              <select id="mass-email-audience" onChange={(event) => setMassEmailAudienceMode(event.currentTarget.value)}>
                <option value="all">Every client with email</option>
                <option value="selected">Only selected customers</option>
              </select>
            </label>
          </div>
          <div style={{marginTop: '1rem'}}>
            <label htmlFor="mass-email-subject">Subject</label>
            <input id="mass-email-subject" type="text" placeholder="Enter the campaign subject" onInput={renderMassEmailDraft} />
          </div>
          <div style={{marginTop: '1rem'}}>
            <label htmlFor="mass-email-body">Email body</label>
            <textarea id="mass-email-body" onInput={renderMassEmailDraft} placeholder="Write the message that should be sent to the selected audience." />
          </div>
          <div className="list-card mass-email-picker" id="mass-email-recipient-panel" style={{marginTop: '1rem'}} hidden>
            <div className="crm-toolbar" style={{marginBottom: '0.75rem'}}>
              <input className="search-input" id="mass-email-search" placeholder="Search recipients..." onInput={(event) => filterMassEmailRecipients(event.currentTarget)} />
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => applyMassEmailQuickSelect('visible')}>Select visible</button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => applyMassEmailQuickSelect('vip')}>Select VIP</button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => applyMassEmailQuickSelect('followup')}>Select follow-up</button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => applyMassEmailQuickSelect('clear')}>Clear</button>
            </div>
            <p className="note-soft" id="mass-email-selection-summary" style={{margin: '0 0 0.75rem'}}>0 selected</p>
            <div className="list-stack mass-email-recipient-list" id="mass-email-recipient-list" />
          </div>
          <div className="mini-kpis">
            <div className="mini-kpi"><strong id="mass-email-count">0</strong><span>emails ready</span></div>
            <div className="mini-kpi"><strong id="mass-batch-count">0</strong><span>send batches</span></div>
            <div className="mini-kpi"><strong id="mass-audience-count">0</strong><span>customers in audience</span></div>
          </div>
          <div className="compose-actions">
            <button className="btn btn-primary btn-sm" id="mass-email-link" onClick={sendMassEmail}>Send campaign</button>
          </div>
          <p className="note-soft" id="mass-provider-detail" style={{marginTop: '0.75rem'}}>Choose every client with email to send to the full CRM list once. Shoreline Ops splits the provider requests behind the scenes.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Customer</th><th>Channel</th><th>Summary</th></tr></thead>
          <tbody id="communications-table" />
        </table>
      </div>
    </div>
    {/* ═══ REVIEWS ═══ */}
    <div className="page" id="page-reviews">
      <div className="section-head"><h2>Reviews</h2></div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Pending review drops</div><div className="value" id="reviews-kpi-pending">0</div><div className="delta warn" id="reviews-kpi-pending-meta">Completed rentals waiting for outreach</div></div>
        <div className="kpi-card"><div className="label">Reviews logged</div><div className="value" style={{color: 'var(--green)'}} id="reviews-kpi-complete">0</div><div className="delta up" id="reviews-kpi-complete-meta">Customer reviews tracked here</div></div>
        <div className="kpi-card"><div className="label">Need response</div><div className="value" style={{color: 'var(--amber)'}} id="reviews-kpi-response">0</div><div className="delta warn" id="reviews-kpi-response-meta">Unanswered reviews</div></div>
        <div className="kpi-card"><div className="label">Review rate</div><div className="value" id="reviews-kpi-rate">0%</div><div className="delta up" id="reviews-kpi-rate-meta">Completed rentals with a review</div></div>
      </div>
      <div className="list-card" style={{marginBottom: '1.5rem'}}>
        <h3>Review automation settings</h3>
        <p id="review-settings-note">Set your review links and choose whether completed rentals should auto-send a review request.</p>
        <div className="form-grid" style={{marginTop: '1rem'}}>
          <div className="form-group"><label>Google review link</label><input type="url" id="review-google-url" placeholder="https://..." /></div>
          <div className="form-group"><label>Facebook review link</label><input type="url" id="review-facebook-url" placeholder="https://..." /></div>
          <div className="form-group"><label>Default review channel</label>
            <select id="review-default-channel">
              <option value="email">Email</option>
              <option value="sms">Text message</option>
            </select>
          </div>
          <div className="form-group"><label>Auto-send when rental is completed</label>
            <select id="review-auto-send">
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>
        <div className="compose-actions">
          <button className="btn btn-primary btn-sm" onClick={saveReviewSettings}>Save review settings</button>
        </div>
      </div>
      <div className="list-card" style={{marginBottom: '1.5rem'}}>
        <h3>Send review link to people</h3>
        <p>Paste any phone numbers (past customers, friends, walk-ins) — one per line. Add a name first if you want the text personalized, e.g. <code>Mike, 469-555-1234</code>. Each person gets a text with your Google review link.</p>
        <div className="form-group" style={{marginTop: '1rem'}}>
          <label>Recipients — one per line (<code>Name, phone</code> or just a phone)</label>
          <textarea id="review-blast-list" rows={6} placeholder="Mike, 469-555-1234
214-555-9876
Sarah, (469) 555-0001" defaultValue={""} />
        </div>
        <div className="compose-actions" style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
          <button className="btn btn-primary btn-sm" id="review-blast-btn" onClick={sendReviewBlast}>Send review link</button>
          <span id="review-blast-status" style={{fontSize: '.85rem', color: 'var(--muted)'}} />
        </div>
        <div className="list-stack" id="review-blast-results" style={{marginTop: '1rem'}} />
      </div>
      <div className="compose-grid">
        <div className="list-card">
          <h3>Review drop queue</h3>
          <p id="review-provider-note">When a rental is marked complete, it appears here so you can send or auto-send the review request right away.</p>
          <div className="list-stack" id="review-request-list" style={{marginTop: '1rem'}} />
        </div>
        <div className="list-card">
          <h3>Review tracker</h3>
          <p>Track who reviewed, what they said, and whether you responded on Google or Facebook.</p>
          <div className="list-stack" id="review-log-list" style={{marginTop: '1rem'}} />
        </div>
      </div>
    </div>
    {/* ═══ SOCIAL ═══ */}
    <div className="page" id="page-social">
      <div className="section-head"><h2>Social Posting</h2></div>
      <div className="compose-grid">
        <div className="compose-card">
          <h3>One post, all channels</h3>
          <p id="social-provider-note">Write the post once here, then send it to the connected social automation webhook.</p>
          <div style={{marginTop: '1rem'}}>
            <label htmlFor="social-caption">Caption</label>
            <textarea id="social-caption" defaultValue={"Lake Lewisville is looking perfect this week. DM Shoreline Aquatics to lock in your jet ski or boat rental."} />
          </div>
          <div style={{marginTop: '1rem'}}>
            <label htmlFor="social-link">Link</label>
            <input id="social-link" type="text" defaultValue="https://slaquatics.com/" placeholder="https://..." />
          </div>
          <div className="network-pills">
            <span className="network-pill">Instagram</span>
            <span className="network-pill">Facebook</span>
            <span className="network-pill">X</span>
            <span className="network-pill">TikTok</span>
          </div>
          <div className="compose-actions">
            <button className="btn btn-primary btn-sm" onClick={saveSocialDraft}>Save draft</button>
            <button className="btn btn-ghost btn-sm" id="social-publish-button" onClick={publishSocialNow}>Publish now</button>
            <button className="btn btn-ghost btn-sm" onClick={copySocialCaption}>Copy caption</button>
          </div>
          <p className="note-soft" id="social-provider-detail" style={{marginTop: '0.75rem'}}>True cross-posting needs connected webhook credentials for your automation stack or each social API.</p>
        </div>
        <div className="list-card">
          <h3>Saved post queue</h3>
          <p>Drafts stay here so you can reuse them for launches, slow weekdays, and holiday weekends.</p>
          <div className="list-stack" id="social-post-list" style={{marginTop: '1rem'}} />
        </div>
      </div>
    </div>
    {/* ═══ RE-ENGAGE ═══ */}
    <div className="page" id="page-reminders">
      <div className="section-head"><h2>Re-engagement</h2></div>
      <div className="tabs">
        <button className="tab active" onClick={(event) => switchReminderTab('overdue', event.currentTarget)}>Overdue for return</button>
        <button className="tab" onClick={(event) => switchReminderTab('upcoming', event.currentTarget)}>Upcoming reminders</button>
        <button className="tab" onClick={(event) => switchReminderTab('campaigns', event.currentTarget)}>Campaign templates</button>
      </div>
      <div id="reminder-overdue">
        <p style={{fontSize: '0.83rem', color: 'var(--muted)', marginBottom: '1rem'}}>Customers who haven't booked in 30+ days — send a re-engagement offer.</p>
        <div id="overdue-list" />
      </div>
      <div id="reminder-upcoming" style={{display: 'none'}}>
        <p style={{fontSize: '0.83rem', color: 'var(--muted)', marginBottom: '1rem'}}>Automated reminders scheduled to send.</p>
        <div id="upcoming-reminders" />
      </div>
      <div id="reminder-campaigns" style={{display: 'none'}}>
        <p style={{fontSize: '0.83rem', color: 'var(--muted)', marginBottom: '1rem'}}>Reusable text and email templates for slow weekdays, busy weekends, and repeat riders.</p>
        <div id="campaigns-list" />
      </div>
    </div>
    <div className="page" id="page-system" data-role="developer">
      <div className="section-head"><h2>System</h2></div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="label">Storage</div><div className="value" id="system-kpi-storage">Private sync</div><div className="delta up" id="system-kpi-storage-meta">Shared server-backed CRM</div></div>
        <div className="kpi-card"><div className="label">Signed in as</div><div className="value" id="system-kpi-role">Developer</div><div className="delta up" id="system-kpi-role-meta">Full control</div></div>
        <div className="kpi-card"><div className="label">Connected services</div><div className="value" id="system-kpi-integrations">0</div><div className="delta up" id="system-kpi-integrations-meta">SMS, email, reviews, payments</div></div>
        <div className="kpi-card"><div className="label">Role split</div><div className="value" id="system-kpi-access">3</div><div className="delta up" id="system-kpi-access-meta">Developer, owner, and employee logins</div></div>
      </div>
      <div className="compose-grid">
        <div className="list-card">
          <h3>System access</h3>
          <p>Visible to the owner and developer logins for server health and configuration. The employee login keeps business access without these controls.</p>
          <div className="list-stack" id="system-access-list" style={{marginTop: '1rem'}} />
        </div>
        <div className="list-card">
          <h3>Service health</h3>
          <p>Use this view to confirm that the private CRM, payments, messaging, and review automations are configured the way you expect.</p>
          <div className="list-stack" id="system-status-list" style={{marginTop: '1rem'}} />
        </div>
        <div className="list-card">
          <h3>Security &amp; configuration</h3>
          <p>Live server-side security and runtime checks. Set any flagged environment variables on the host to clear warnings.</p>
          <div className="list-stack" id="system-security-list" style={{marginTop: '1rem'}}><div className="list-row"><div className="list-row-main"><div className="sub">Loading server health…</div></div></div></div>
        </div>
      </div>
    </div>
  </div>{/* /content */}
</div>
  );
}
