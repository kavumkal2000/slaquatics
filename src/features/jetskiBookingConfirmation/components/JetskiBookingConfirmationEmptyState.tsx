export function JetskiBookingConfirmationEmptyState() {
  return (
    <div className="empty" id="empty-state" hidden>
      <div className="block-label">No Booking Yet</div>
      <h2>Start with the calendar first.</h2>
      <p>No booking details are saved yet. Head back to the calendar page, choose the rental date, and the combined contact + waiver + checkout step will be ready here.</p>
      <div className="actions">
        <a className="btn btn-primary" id="empty-calendar-link" href="../jetski-booking/">Go To Booking Calendar</a>
      </div>
    </div>
  );
}
