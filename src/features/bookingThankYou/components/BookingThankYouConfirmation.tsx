export function BookingThankYouConfirmation() {
  return (
    <div className="card">
      <div className="block-label">Confirmation</div>
      <h2>Watch for your text or email.</h2>
      <p>Shoreline will use the contact details on your booking for any final timing updates, launch reminders, or day-of changes.</p>
      <div className="confirm-note">
        <h3>Keep your phone handy</h3>
        <p>If anything changes with your party size or arrival time, reply to the confirmation message or call Shoreline directly before your rental window.</p>
        <div className="confirm-highlight" id="confirm-contact-method">Text message follow-up</div>
      </div>
      <div className="block-label" style={{ marginTop: 22 }}>Quick Safety Briefing</div>
      <div className="arrival-list">
        <div className="arrival-item">1. Life jackets stay on for every rider from launch to return.</div>
        <div className="arrival-item">2. The driver keeps the safety lanyard clipped in while operating the jet ski.</div>
        <div className="arrival-item">3. No alcohol or drugs. If you are impaired, you do not ride.</div>
        <div className="arrival-item">4. Idle out from the launch and stay slow near docks, swimmers, boats, and shoreline.</div>
        <div className="arrival-item">5. If weather changes or anything feels wrong, slow down, stop safely, and call Shoreline.</div>
      </div>
    </div>
  );
}
