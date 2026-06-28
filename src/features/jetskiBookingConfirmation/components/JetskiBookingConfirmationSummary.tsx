export function JetskiBookingConfirmationSummary() {
  return (
    <aside className="summary-card">
      <div className="block-label">Your Rental</div>
      <div className="summary-total" id="summary-total">$300</div>
      <div className="summary-title" id="summary-package">2 Yamaha Jet Skis</div>
      <div className="summary-note" id="summary-note">Your rental is ready for the contact, waiver, and checkout step.</div>
      <div className="summary-grid">
        <div className="summary-row"><span>Date</span><strong id="summary-date">-</strong></div>
        <div className="summary-row"><span>Start time</span><strong id="summary-time">-</strong></div>
        <div className="summary-row"><span>Party size</span><strong id="summary-party">2</strong></div>
        <div className="summary-row"><span>Meeting spot</span><strong id="summary-location">Lake Lewisville launch</strong></div>
        <div className="summary-row"><span>Booking deposit</span><strong id="summary-deposit">$50</strong></div>
        <div className="summary-row"><span>Payment</span><strong id="summary-payment-status">Not paid yet</strong></div>
        <div className="summary-row"><span>Due today</span><strong>$55</strong></div>
      </div>
      <div className="payment-note" style={{ marginTop: 18 }}>
        <strong>$55 due today</strong> — a $50 booking deposit plus a $5 processing fee. The remaining rental balance is handled directly with Shoreline before launch.
      </div>
    </aside>
  );
}
