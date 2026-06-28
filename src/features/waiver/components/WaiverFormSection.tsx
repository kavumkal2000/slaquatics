export function WaiverFormSection() {
  return (
    <div className="form-card">
      <div className="block-label">Waiver</div>
      <h2>Complete the rider waiver</h2>
      <div className="section-copy">
        Fill this out once so check-in is faster when you arrive at the Shoreline launch.
      </div>
      <form id="waiver-form">
        <div className="form-stack">
          <div className="field-block">
            <div className="block-label">Contact Details</div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="first-name">First name</label>
                <input id="first-name" name="firstName" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="last-name">Last name</label>
                <input id="last-name" name="lastName" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="phone">Cell phone</label>
                <input id="phone" name="phone" type="tel" placeholder="Best phone number" required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div className="field full">
                <label htmlFor="date-of-birth">Date of birth</label>
                <input id="date-of-birth" name="dateOfBirth" type="date" required />
              </div>
            </div>
          </div>
          <div className="waiver-card">
            <div className="block-label">Signature</div>
            <h3>Review the waiver and sign online</h3>
            <div className="section-copy">
              Use your initials and full legal name exactly as you want them saved on your Shoreline waiver.
            </div>
            <div className="field-grid" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="signature-date">Waiver date</label>
                <input id="signature-date" name="signatureDate" type="date" required />
              </div>
              <div className="field">
                <label htmlFor="initials">Participant initials</label>
                <input id="initials" name="initials" type="text" maxLength={6} required />
              </div>
              <div className="field full">
                <label htmlFor="signature">Responsible party signature</label>
                <input id="signature" name="signature" type="text" placeholder="Type full legal name" required />
              </div>
            </div>
            <div className="check-list">
              <div className="check-row">
                <input id="accepted-agreement" name="acceptedAgreement" type="checkbox" required />
                <label htmlFor="accepted-agreement">I have read this assumption and acknowledgement of risks and release of liability agreement and I agree with the terms and conditions above.</label>
              </div>
              <div className="check-row">
                <input id="verified" name="verified" type="checkbox" required />
                <label htmlFor="verified">I, the responsible party, verify I completed the above information accurately and agree to all Shoreline waiver terms and conditions.</label>
              </div>
            </div>
          </div>
        </div>
        <div className="status" id="waiver-status" />
        <button className="btn btn-primary" type="submit">Save Waiver</button>
        <div className="footer-note">
          Once this waiver is submitted, Shoreline can recognize it during booking and check-in.
        </div>
      </form>
    </div>
  );
}
