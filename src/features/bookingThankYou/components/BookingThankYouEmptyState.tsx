export function BookingThankYouEmptyState() {
  return (
    <div className="empty" id="empty-state" hidden>
      <div className="block-label">Booking Not Found</div>
      <h2>We could not load your booking details.</h2>
      <p>Head back to the booking flow and finish the deposit step again if you still need help.</p>
      <div className="top-actions" style={{ marginTop: 16 }}>
        <a className="btn btn-primary" id="empty-booking-link" href="../jetski-booking/">Go To Booking Calendar</a>
        <a className="btn btn-ghost" id="empty-confirmation-link" href="../jetski-booking-confirmation/">Back To Contact + Waiver</a>
      </div>
    </div>
  );
}
