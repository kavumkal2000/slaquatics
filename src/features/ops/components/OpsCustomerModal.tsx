'use client';

import { closeOpsModal, saveCustomer } from '../opsGlobalActions';

export function OpsCustomerModal() {
  const closeCustomerModal = () => closeOpsModal('customer-modal');

  return (
    <div className="modal-overlay" id="customer-modal">
  <div className="modal" style={{width: 560}}>
    <div className="modal-head"><h3 id="customer-modal-title">Add Customer</h3><button className="modal-close" onClick={closeCustomerModal}>×</button></div>
    <div className="modal-body">
      <div className="form-grid">
        <input type="hidden" id="c-id" />
        <div className="form-group"><label>Name</label><input type="text" id="c-name" placeholder="First Last" /></div>
        <div className="form-group"><label>Phone</label><input type="tel" id="c-phone" placeholder="Customer phone number" /></div>
        <div className="form-group"><label>Email</label><input type="email" id="c-email" placeholder="email@example.com" /></div>
        <div className="form-group"><label>Company</label><input type="text" id="c-company" placeholder="Business or group name" /></div>
        <div className="form-group"><label>Source</label><input type="text" id="c-source" placeholder="Instagram, Google, referral, walk-in" /></div>
        <div className="form-group"><label>Tag</label>
          <select id="c-tag"><option value="">None</option><option value="vip">VIP</option><option value="group">Group organizer</option><option value="repeat">Repeat customer</option></select>
        </div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>CRM Tags</label><input type="text" id="c-crm-tags" placeholder="vip, birthday, referral" /></div>
        <div className="form-group"><label>Bookings (auto)</label><input type="number" min={0} id="c-bookings" defaultValue="0" disabled /></div>
        <div className="form-group"><label>Total spent (auto)</label><input type="number" min={0} step="0.01" id="c-total-spent" defaultValue="0" disabled /></div>
        <div className="form-group"><label>Last booking (auto)</label><input type="date" id="c-last-booking" disabled /></div>
        <div className="form-group"><label>Last activity (auto)</label><input type="date" id="c-last-activity" disabled /></div>
        <div className="form-group"><label>Waiver signed</label><input type="date" id="c-waiver-signed" /></div>
        <div className="form-group"><label>Emergency name</label><input type="text" id="c-emergency-name" placeholder="Optional" /></div>
        <div className="form-group"><label>Emergency phone</label><input type="tel" id="c-emergency-phone" placeholder="Optional" /></div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>Notes</label><textarea id="c-notes" placeholder="Internal notes, preferences, booking history, follow-up context" defaultValue={""} /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeCustomerModal}>Cancel</button>
      <button className="btn btn-primary" id="customer-save-button" onClick={saveCustomer}>Save Customer</button>
    </div>
  </div>
</div>
  );
}
