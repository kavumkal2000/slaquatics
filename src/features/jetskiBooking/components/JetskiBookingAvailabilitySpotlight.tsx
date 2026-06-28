export function JetskiBookingAvailabilitySpotlight() {
  return (
    <div className="info-card availability-spotlight-card">
      <div className="mini-kicker">Real-time availability</div>
      <h2>Open start times before the contact step</h2>
      <p className="section-copy" id="availability-spotlight-copy">Choose the day and package below to see live open slots and how many jet skis are still open.</p>
      <div className="slot-grid" id="availability-slot-grid">
        <div className="slot-card">
          <strong>Loading live slots</strong>
          <span>We’re warming up the live booking system for today’s availability.</span>
        </div>
      </div>
    </div>
  );
}
