export function BookingThankYouArrival() {
  return (
    <div className="card">
      <div className="block-label">Arrival Directions</div>
      <h2>Shoreline Aquatics launch</h2>
      <div className="arrival-copy">The launch meeting spot is at <strong style={{ color: 'var(--ink)' }}>Point Vista Rd, Hickory Creek, TX</strong>. Use the directions below once you arrive near the park entrance.</div>
      <div className="address-card">
        <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: 6 }}>Address</strong>
        Point Vista Rd, Hickory Creek, TX
      </div>
      <div className="arrival-list">
        <div className="arrival-item">1. Proceed down Main Street until you pass the storage units on your left.</div>
        <div className="arrival-item">2. Continue straight ahead and enter the park.</div>
        <div className="arrival-item">3. Upon entering, make an immediate left.</div>
        <div className="arrival-item">4. Follow the road straight to the boat ramp.</div>
        <div className="arrival-item">5. The cabanas will be on your left — Shoreline Aquatics and the jet skis will be located in this area.</div>
      </div>
      <div className="top-actions" style={{ marginTop: 18 }}>
        <a className="btn btn-primary" href="tel:4696937164">Call Shoreline</a>
        <a className="btn btn-ghost" id="sms-link" href="#">Text Shoreline</a>
      </div>
    </div>
  );
}
