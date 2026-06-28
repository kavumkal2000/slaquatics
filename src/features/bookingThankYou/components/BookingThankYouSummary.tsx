export function BookingThankYouSummary() {
  return (
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
  );
}
