export function BookingThankYouHero() {
  return (
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
  );
}
