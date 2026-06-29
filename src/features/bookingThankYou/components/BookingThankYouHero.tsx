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
          <img src="../assets/images/shoreline-jetski-group-collage.webp" alt="Shoreline Aquatics riders on the water" />
          <div className="hero-photo-badge">
            <strong>Lake day locked in</strong>
            <span>Save this page for directions and arrival info.</span>
          </div>
        </div>
        <div className="thumb-grid">
          <div className="thumb"><img src="../assets/images/shoreline-jetski-close-group.webp" alt="Customers on Shoreline jet skis" /></div>
          <div className="thumb"><img src="../assets/images/shoreline-jetski-solo-rider.webp" alt="Shoreline rider out on the water" /></div>
        </div>
      </div>
    </div>
  );
}
