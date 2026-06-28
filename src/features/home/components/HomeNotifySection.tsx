'use client';

export function HomeNotifySection() {
  return (
    <section className="avail-section" id="notify">
  <div className="avail-inner">
    <div className="section-tag">Stay in the Loop</div>
    <h2>First Dibs on Open Times &amp; Deals</h2>
    <p className="avail-sub">Booked up or planning ahead? Drop your info and we'll text or email you the moment spots open and when deals drop.</p>
    <div className="avail-controls">
      <label htmlFor="avail-date">Check a date</label>
      <input type="date" id="avail-date" />
    </div>
    <div className="avail-status" id="avail-status">Choose a date to see open jet-ski start times.</div>
    <div className="avail-slots" id="avail-slots" />
    <div className="avail-notify" id="avail-notify">
      <form className="avail-notify-form" id="avail-notify-form" noValidate>
        <input type="text" id="lead-name" placeholder="First name" autoComplete="given-name" />
        <input type="tel" id="lead-phone" placeholder="Phone (for texts)" autoComplete="tel" />
        <input type="email" id="lead-email" placeholder="or Email" autoComplete="email" />
        <button type="submit" className="btn-primary" id="lead-submit">Notify Me</button>
      </form>
      <div className="avail-notify-msg" id="avail-notify-msg" />
    </div>
  </div>
</section>
  );
}
