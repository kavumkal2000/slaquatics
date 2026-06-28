'use client';

import {
  calculateBookingPrice,
  closeOpsModal,
  handleBookingAmountInput,
  maybeAutofillCustomer,
  saveBooking
} from '../opsGlobalActions';

export function OpsBookingModal() {
  const closeBookingModal = () => closeOpsModal('booking-modal');
  const autofillNameAndPrice = () => {
    maybeAutofillCustomer('name');
    calculateBookingPrice();
  };
  const autofillPhone = () => {
    maybeAutofillCustomer('phone');
  };

  return (
    <div className="modal-overlay" id="booking-modal">
  <div className="modal">
    <div className="modal-head">
      <h3 id="booking-modal-title">New Booking</h3>
      <button className="modal-close" onClick={closeBookingModal}>×</button>
    </div>
    <div className="modal-body">
      <div className="modal-banner warn" id="booking-conflict" style={{display: 'none'}} />
      <div className="form-grid">
        <div className="form-group"><label>Customer name</label><input type="text" id="b-name" placeholder="First Last" onInput={autofillNameAndPrice} /></div>
        <div className="form-group"><label>Phone</label><input type="tel" id="b-phone" placeholder="Phone number" onInput={autofillPhone} /></div>
        <div className="form-group"><label>Email</label><input type="email" id="b-email" placeholder="email@example.com" /></div>
        <div className="booking-hint" id="booking-customer-hint" style={{display: 'none', gridColumn: '1/-1'}} />
        <div className="form-group"><label>Booking date</label><input type="date" id="b-date" onInput={calculateBookingPrice} /></div>
        <div className="form-group"><label>Start time</label>
          <select id="b-time" onChange={calculateBookingPrice}>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="13:00">1:00 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="16:00">4:00 PM</option>
            <option value="17:00">5:00 PM</option>
            <option value="18:00">6:00 PM</option>
          </select>
        </div>
        <div className="form-group"><label>Craft</label>
          <select id="b-craft" onChange={calculateBookingPrice}>
            <option value="">Select craft</option>
            <option value="jetski2">2 Yamaha Jet Skis</option>
            <option value="jetski3">3 Yamaha Jet Skis</option>
            <option value="jetski4">4 Yamaha Jet Skis</option>
            <option value="partyboat">Boat Rental (up to 14)</option>
            <option value="bundle2">2 Jet Skis + Boat</option>
            <option value="bundle3">3 Jet Skis + Boat</option>
            <option value="bundle4">4 Jet Skis + Boat</option>
          </select>
        </div>
        <div className="form-group"><label>Duration</label>
          <select id="b-duration" onChange={calculateBookingPrice}>
            <option value="">Select duration</option>
            <option value={1}>1 Hour</option>
            <option value={2}>2 Hours</option>
            <option value={3}>3 Hours</option>
            <option value={4}>4 Hours</option>
            <option value={6}>6 Hours</option>
            <option value={8}>Full Day (8 hrs)</option>
          </select>
        </div>
        <div className="form-group"><label>Add drone?</label>
          <select id="b-drone" onChange={calculateBookingPrice}>
            <option value="no">No drone</option>
            <option value="yes">Yes — $50</option>
          </select>
        </div>
        <div className="form-group"><label>Add karaoke?</label>
          <select id="b-karaoke" onChange={calculateBookingPrice}>
            <option value="no">No karaoke</option>
            <option value="yes">Yes — $50</option>
          </select>
        </div>
        <div className="form-group"><label>Add tube?</label>
          <select id="b-tube" onChange={calculateBookingPrice}>
            <option value="no">No tube</option>
            <option value="yes">Yes — $50</option>
          </select>
        </div>
        <div className="form-group"><label>Status</label>
          <select id="b-status">
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="noshow">No-show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="form-group money-hide">
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 400, fontSize: '0.86rem'}}>
            <input type="checkbox" id="b-deposit-refunded" style={{width: 16, height: 16, accentColor: 'var(--gold)'}} />
            Deposit refunded
          </label>
          <div style={{fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.3rem'}}>For no-shows/cancels: leave unchecked if you kept the $50, check if you refunded it.</div>
        </div>
        <div className="form-group money-hide"><label>Amount</label><input type="number" id="b-amount" min={0} step="0.01" placeholder="0.00" onInput={handleBookingAmountInput} /></div>
        <hr className="form-divider money-hide" />
        <div className="price-preview money-hide">
          <div style={{fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.4rem'}}>Booking total</div>
          <div className="total" id="booking-total">$0</div>
          <div className="breakdown" id="booking-breakdown">Select craft and duration</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.8rem'}}>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem 0.8rem'}}>
              <div style={{fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Booking deposit</div>
              <div style={{fontSize: '1.1rem', fontWeight: 500, color: 'var(--green)', marginTop: 2}}>$50</div>
            </div>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem 0.8rem'}}>
              <div style={{fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Damage deposit/ski</div>
              <div style={{fontSize: '1.1rem', fontWeight: 500, color: 'var(--amber)', marginTop: 2}}>$200</div>
            </div>
          </div>
        </div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>Notes</label><textarea id="b-notes" placeholder="Special requests, location on lake, etc." defaultValue={""} /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeBookingModal}>Cancel</button>
      <button className="btn btn-primary" id="booking-save-button" onClick={saveBooking}>Confirm Booking</button>
    </div>
  </div>
</div>
  );
}
