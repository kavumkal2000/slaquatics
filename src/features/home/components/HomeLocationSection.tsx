'use client';

export function HomeLocationSection() {
  return (
    <section id="location" className="map-section">
  <div className="section-inner">
    <div className="section-tag">Location</div>
    <h2>Shoreline Aquatics – Arrival Instructions</h2>
    <div className="location-grid">
      <div className="directions-card">
        <div className="location-address">
          <span className="address-pill">Point Vista Rd, Hickory Creek, TX</span>
          <a className="address-pill" href="https://www.google.com/maps/dir/?api=1&destination=Point+Vista+Rd+Hickory+Creek+TX+75065" target="_blank" rel="noreferrer">Open in Maps</a>
        </div>
        <p>Use these arrival instructions when you're heading to the launch.</p>
        <div className="directions-list">
          <div className="direction-step"><div className="direction-index">1</div><div className="direction-copy">Proceed down Main Street until you pass the storage units on your left.</div></div>
          <div className="direction-step"><div className="direction-index">2</div><div className="direction-copy">Continue straight ahead and enter the park.</div></div>
          <div className="direction-step"><div className="direction-index">3</div><div className="direction-copy">Upon entering, make an immediate left.</div></div>
          <div className="direction-step"><div className="direction-index">4</div><div className="direction-copy">Follow the road straight to the boat ramp.</div></div>
          <div className="direction-step"><div className="direction-index">5</div><div className="direction-copy">The cabanas will be on your left — Shoreline Aquatics and the jet skis will be located in this area.</div></div>
        </div>
      </div>
      <div className="map-card">
        <div>
          <h3>Meet Us At The Launch</h3>
          <p>Use the map for the exact address, then follow the arrival instructions once you enter the park.</p>
        </div>
        <div className="map-embed">
          <iframe title="Shoreline Aquatics map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Point+Vista+Rd+Hickory+Creek+TX+75065&output=embed">
          </iframe>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
