'use client';

import {
  closeOpsModal,
  handleInvoiceAmountInput,
  handleInvoiceDurationChange,
  handleInvoicePackageChange,
  saveInvoice,
  toggleInvoicePaymentMethodCustom,
  updateInvoicePaymentHelper
} from '../opsGlobalActions';

export function OpsInvoiceModal() {
  const closeInvoiceModal = () => closeOpsModal('invoice-modal');

  return (
    <div className="modal-overlay" id="invoice-modal">
  <div className="modal" style={{width: 560}}>
    <div className="modal-head">
      <h3 id="invoice-modal-title">New Invoice</h3>
      <button className="modal-close" onClick={closeInvoiceModal}>×</button>
    </div>
    <div className="modal-body">
      <div className="form-grid">
        <div className="form-group"><label>Customer name <span style={{color: 'var(--muted)', fontWeight: 400}}>optional</span></label><input type="text" id="i-customer-name" placeholder="First Last" /></div>
        <div className="form-group"><label>Phone <span style={{color: 'var(--muted)', fontWeight: 400}}>optional</span></label><input type="tel" id="i-customer-phone" placeholder="Phone number" /></div>
        <div className="form-group"><label>Email <span style={{color: 'var(--muted)', fontWeight: 400}}>optional</span></label><input type="email" id="i-customer-email" placeholder="email@example.com" /></div>
        <div className="form-group"><label>Invoice title <span style={{color: 'var(--muted)', fontWeight: 400}}>optional</span></label><input type="text" id="i-invoice-name" placeholder="Auto-fills if left blank" /></div>
        <div className="form-group"><label>Issue date</label><input type="date" id="i-issue-date" /></div>
        <div className="form-group"><label>Due date</label><input type="date" id="i-due-date" /></div>
        <div className="form-group"><label>Rental package</label>
          <select id="i-package" onChange={handleInvoicePackageChange}>
            <option value="">Custom / manual</option>
            <option value="jetski2">2 Yamaha Jet Skis</option>
            <option value="jetski3">3 Yamaha Jet Skis</option>
            <option value="jetski4">4 Yamaha Jet Skis</option>
            <option value="partyboat">Boat Rental (up to 14)</option>
            <option value="bundle2">2 Jet Skis + Boat</option>
            <option value="bundle3">3 Jet Skis + Boat</option>
            <option value="bundle4">4 Jet Skis + Boat</option>
          </select>
        </div>
        <div className="form-group"><label>Rental length</label>
          <select id="i-duration" onChange={handleInvoiceDurationChange}>
            <option value="">Select duration</option>
          </select>
        </div>
        <div className="form-group" style={{gridColumn: '1/-1'}}>
          <label style={{fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Rental helper</label>
          <div style={{padding: '0.7rem 0.85rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: 'var(--muted)'}} id="invoice-rental-helper">Pick a rental package and duration to auto-fill the title, line item, and amount. For a quick manual invoice, just enter the amount.</div>
        </div>
        <input type="hidden" id="i-line-item" />
        <div className="form-group"><label>Amount</label><input type="number" id="i-total" min={0} step="0.01" placeholder="0.00" onInput={handleInvoiceAmountInput} /></div>
        <div className="form-group"><label>Status</label>
          <select id="i-status" onChange={updateInvoicePaymentHelper}>
            <option value="Paid">Fully Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Open">Open</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
          </select>
        </div>
        <div className="form-group"><label>Collected amount</label><input type="number" id="i-paid-amount" min={0} step="0.01" placeholder="0.00" onInput={updateInvoicePaymentHelper} /></div>
        <div className="form-group"><label>Balance due</label><input type="number" id="i-balance-due" min={0} step="0.01" placeholder="0.00" readOnly /></div>
        <div className="form-group"><label>Payment method</label>
          <select id="i-payment-method" onChange={toggleInvoicePaymentMethodCustom}>
            <option value="">Select method</option>
            <option value="Cash">Cash</option>
            <option value="Zelle">Zelle</option>
            <option value="Card">Card</option>
            <option value="Apple Cash">Apple Cash</option>
            <option value="Cash App">Cash App</option>
            <option value="Venmo">Venmo</option>
            <option value="Check">Check</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group" id="invoice-payment-method-custom-wrap" style={{display: 'none'}}><label>Custom payment method</label><input type="text" id="i-payment-method-custom" placeholder="Write the payment method" /></div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label style={{fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Payment tracker</label><div style={{padding: '0.7rem 0.85rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: 'var(--muted)'}} id="invoice-payment-helper">Collected $0.00 • Remaining $0.00. Mark the invoice paid when you collect the full balance.</div></div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>Notes</label><textarea id="i-notes" placeholder="Walk-up booking notes, payment method, or anything staff should know." defaultValue={""} /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeInvoiceModal}>Cancel</button>
      <button className="btn btn-primary" id="invoice-save-button" onClick={saveInvoice}>Save Invoice</button>
    </div>
  </div>
</div>
  );
}
