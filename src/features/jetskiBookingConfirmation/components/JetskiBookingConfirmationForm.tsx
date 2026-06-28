export function JetskiBookingConfirmationForm() {
  return (
    <div className="form-card">
      <div className="block-label">Contact + Waiver</div>
      <h2>Complete the rider details and waiver</h2>
      <div className="section-copy">
        Finish the form below, then pay $55 today to move into the thank-you page and arrival instructions.
      </div>
      <div className="match-card" id="match-card">
        <div className="mini-kicker">Returning rider found</div>
        <h2 id="match-title">Customer recognized</h2>
        <div className="match-copy" id="match-copy">Welcome back. We filled in the details we already had for this rider.</div>
        <div className="match-chip-row" id="match-chips" />
      </div>
      <form id="waiver-payment-form">
        <div className="form-stack">
          <div className="field-block">
            <div className="block-label">Contact Details</div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="name">Customer name</label>
                <input id="name" name="name" type="text" placeholder="First and last name" required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" placeholder="Best phone number" required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="field">
                <label htmlFor="date-of-birth">Date of birth</label>
                <input id="date-of-birth" name="dateOfBirth" type="date" required />
              </div>
              <div className="field">
                <label htmlFor="party-size">Party size</label>
                <input id="party-size" name="partySize" type="number" min={1} max={20} defaultValue={2} />
              </div>
              <div className="field full">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" placeholder="Anything Shoreline should know about timing, riders, or special requests?" defaultValue={""} />
              </div>
            </div>
          </div>
          <div className="waiver-card">
            <div className="block-label">Waiver</div>
            <h3>Review the waiver and sign online</h3>
            <div className="section-copy">
              The rider confirms the normal on-the-water risks and Shoreline’s safety instructions before checkout.
            </div>
            <a className="waiver-link" href="../waiver/?view=terms#terms" target="_blank" rel="noreferrer">View full waiver terms</a>
            <div className="legal-box">
              <div className="mini-kicker">Agreement Summary</div>
              <div className="legal-list">
                <div className="legal-item"><div className="legal-dot">1</div><div>All watercraft are used at the renter’s and renter’s guests’ own risk, including weather, wakes, collisions, equipment issues, and operator error.</div></div>
                <div className="legal-item"><div className="legal-dot">2</div><div>The rider accepts responsibility for operating the equipment safely and following Shoreline instructions throughout the rental.</div></div>
                <div className="legal-item"><div className="legal-dot">3</div><div>The rider releases Shoreline Aquatics LLC from claims tied to normal participation risks and authorizes Shoreline to keep this waiver on file so future bookings can be faster.</div></div>
              </div>
            </div>
            <div className="check-list">
              <div className="check-row">
                <input id="waiver-risk" name="waiverRisk" type="checkbox" required />
                <label htmlFor="waiver-risk">I understand the risks of boating and personal watercraft activity and agree to follow Shoreline’s operating and safety instructions.</label>
              </div>
              <div className="check-row">
                <input id="waiver-damage" name="waiverDamage" type="checkbox" required />
                <label htmlFor="waiver-damage">I understand Shoreline may document equipment condition before and after the rental.</label>
              </div>
              <div className="check-row">
                <input id="waiver-verify" name="waiverVerify" type="checkbox" required />
                <label htmlFor="waiver-verify">I verify I completed the above information accurately and agree to all Shoreline waiver terms and conditions.</label>
              </div>
            </div>
            <div className="field-grid" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="waiver-initials">Participant initials</label>
                <input id="waiver-initials" name="waiverInitials" type="text" maxLength={6} placeholder="Initial here" required />
              </div>
              <div className="field">
                <label htmlFor="signature">Digital signature</label>
                <input id="signature" name="signature" type="text" placeholder="Type full legal name" required />
              </div>
              <div className="field">
                <label htmlFor="signature-date">Waiver date</label>
                <input id="signature-date" name="signatureDate" type="date" required />
              </div>
            </div>
          </div>
        </div>
        <div className="payment-note">
          <strong>Pay today:</strong> $55 total. That includes a $50 booking deposit and a $5 processing fee. The remaining rental balance is handled directly with Shoreline before launch.
        </div>
        <div className="status" id="copy-status">Finish the form, then pay $55 today to hold the rental date.</div>
        <div className="actions">
          <button className="btn btn-primary" id="stripe-link" type="submit">Pay $55 today</button>
        </div>
      </form>
    </div>
  );
}
