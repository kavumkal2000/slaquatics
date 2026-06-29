export function BookingThankYouDiv1() {
  return (
    <div className="shell">
  <div className="topbar">
    <a className="brand" href="../">
      <div className="brand-logo">
        <img src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/681d97126b471ca2569a5463.png" alt="Shoreline Aquatics" />
      </div>
    </a>
    <div className="top-actions">
      <a className="btn btn-ghost" href="tel:4696937164">Call (469) 693-7164</a>
      <a className="btn btn-primary" href="../">Back To Homepage</a>
    </div>
  </div>
  <div className="empty" id="empty-state" hidden>
    <div className="block-label">Booking Not Found</div>
    <h2>We could not load your booking details.</h2>
    <p>Head back to the booking flow and finish the deposit step again if you still need help.</p>
    <div className="top-actions" style={{marginTop: 16}}>
      <a className="btn btn-primary" id="empty-booking-link" href="../jetski-booking/">Go To Booking Calendar</a>
      <a className="btn btn-ghost" id="empty-confirmation-link" href="../jetski-booking-confirmation/">Back To Contact + Waiver</a>
    </div>
  </div>
  <div id="thankyou-wrap" hidden>
    <div className="hero">
      <div className="card">
        <div className="eyebrow">Thank You</div>
        <h1>You're <span className="accent">Booked In</span></h1>
        <div className="hero-copy">
          Your $50 booking deposit and $5 processing fee are paid, and your Shoreline request is now on file. <strong>Watch for a confirmation text or email</strong> if Shoreline needs to send final timing details before your lake day.
        </div>
        <div className="status" id="payment-status">Payment received. Watch for your confirmation text or email.</div>
      </div>
      <div className="card media-card">
        <div className="hero-photo">
          <img src="../assets/images/shoreline-customer-group-wide.png" alt="Shoreline Aquatics riders on the water" />
          <div className="hero-photo-badge">
            <strong>Lake day locked in</strong>
            <span>Save this page for directions and arrival info.</span>
          </div>
        </div>
        <div className="thumb-grid">
          <div className="thumb"><img src="../assets/images/shoreline-customer-duo.png" alt="Customers smiling on a Shoreline jet ski" /></div>
          <div className="thumb"><img src="../assets/images/shoreline-customer-riders.png" alt="Shoreline riders out on the water" /></div>
        </div>
      </div>
    </div>
    <div className="content-grid">
      <div className="card">
        <div className="block-label">Confirmation</div>
        <h2>Watch for your text or email.</h2>
        <p>Shoreline will use the contact details on your booking for any final timing updates, launch reminders, or day-of changes.</p>
        <div className="confirm-note">
          <h3>Keep your phone handy</h3>
          <p>If anything changes with your party size or arrival time, reply to the confirmation message or call Shoreline directly before your rental window.</p>
          <div className="confirm-highlight" id="confirm-contact-method">Text message follow-up</div>
        </div>
        <div className="block-label" style={{marginTop: 22}}>Quick Safety Briefing</div>
        <div className="arrival-list">
          <div className="arrival-item">1. Life jackets stay on for every rider from launch to return.</div>
          <div className="arrival-item">2. The driver keeps the safety lanyard clipped in while operating the jet ski.</div>
          <div className="arrival-item">3. No alcohol or drugs. If you are impaired, you do not ride.</div>
          <div className="arrival-item">4. Idle out from the launch and stay slow near docks, swimmers, boats, and shoreline.</div>
          <div className="arrival-item">5. If weather changes or anything feels wrong, slow down, stop safely, and call Shoreline.</div>
        </div>
      </div>
      <div className="card">
        <div className="block-label">Booking Summary</div>
        <h2>Saved rental details</h2>
        <div className="summary-total" id="summary-total">$300</div>
        <div className="summary-title" id="summary-package">2 Yamaha Jet Skis</div>
        <div className="summary-grid">
          <div className="summary-row"><span>Date</span><strong id="summary-date">-</strong></div>
          <div className="summary-row"><span>Start time</span><strong id="summary-time">-</strong></div>
          <div className="summary-row"><span>Meeting spot</span><strong id="summary-location">-</strong></div>
          <div className="summary-row"><span>Customer</span><strong id="summary-customer">-</strong></div>
          <div className="summary-row"><span>Deposit credit</span><strong id="summary-deposit">$50</strong></div>
          <div className="summary-row"><span>Processing fee</span><strong id="summary-processing-fee">$5</strong></div>
          <div className="summary-row"><span>Paid today</span><strong id="summary-paid-today">$55</strong></div>
        </div>
      </div>
    </div>
    <div className="content-grid" style={{marginTop: 24}}>
      <div className="card">
        <div className="block-label">Arrival Directions</div>
        <h2>Shoreline Aquatics launch</h2>
        <div className="arrival-copy">The launch meeting spot is at <strong style={{color: 'var(--ink)'}}>Point Vista Rd, Hickory Creek, TX</strong>. Use the directions below once you arrive near the park entrance.</div>
        <div className="address-card">
          <strong style={{display: 'block', color: 'var(--ink)', marginBottom: 6}}>Address</strong>
          Point Vista Rd, Hickory Creek, TX
        </div>
        <div className="arrival-list">
          <div className="arrival-item">1. Proceed down Main Street until you pass the storage units on your left.</div>
          <div className="arrival-item">2. Continue straight ahead and enter the park.</div>
          <div className="arrival-item">3. Upon entering, make an immediate left.</div>
          <div className="arrival-item">4. Follow the road straight to the boat ramp.</div>
          <div className="arrival-item">5. The cabanas will be on your left — Shoreline Aquatics and the jet skis will be located in this area.</div>
        </div>
        <div className="top-actions" style={{marginTop: 18}}>
          <a className="btn btn-primary" href="tel:4696937164">Call Shoreline</a>
          <a className="btn btn-ghost" id="sms-link" href="#">Text Shoreline</a>
        </div>
      </div>
      <div className="card media-card">
        <div className="hero-photo" style={{minHeight: 260}}>
          <img src="../assets/images/shoreline-customer-moments.png" alt="Shoreline Aquatics customer moments" />
        </div>
        <p>Shoreline will meet you at the launch, walk you through the basics, and get your group on the water fast.</p>
      </div>
    </div>
  </div>
</div>
  );
}
