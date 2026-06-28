'use client';


export function HomeFleetSection() {
  return (
    <section id="fleet" className="fleet-section">
  <div className="section-inner">
    <div className="section-tag">Our Fleet</div>
    <h2>Pick Your Ride First</h2>
    <p className="section-sub">Pick what fits your group and head straight to booking.</p>
    <a className="holiday-banner" href="./jetski-booking/?type=jetski&craft=jetski2&date=2026-07-04">
      <span className="holiday-banner-text">
        <strong>July 4th</strong>
        2 jet skis (4hr $900 / 8hr $1,350) or the boat (4hr $1,000 / 8hr $2,000) — 4 or 8 hour blocks only.
      </span>
      <span className="holiday-banner-cta">Book the 4th →</span>
    </a>
    <div className="fleet-grid">
      <div className="fleet-card" id="jetski">
        <div className="fleet-media fleet-slider">
          <img className="slide active" loading="lazy" decoding="async" src="./assets/images/shoreline-customer-duo.png" alt="Two riders cheering on a Yamaha jet ski at Lake Lewisville" />
          <img className="slide" loading="lazy" decoding="async" src="./assets/images/shoreline-customer-riders.png" alt="Customers riding jet skis on Lake Lewisville" />
          <img className="slide" loading="lazy" decoding="async" src="./assets/images/shoreline-customer-group-wide.png" alt="Shoreline group getting ready on Yamaha jet skis" />
          <button className="slider-arrow prev" type="button" aria-label="Previous photo">‹</button>
          <button className="slider-arrow next" type="button" aria-label="Next photo">›</button>
          <div className="slider-dots" />
        </div>
        <div className="fleet-body">
          <div className="fleet-badge">2 to 4 Yamaha Jet Skis</div>
          <div className="fleet-title-row">
            <div className="fleet-title">Jet Ski Rentals</div>
            <div className="fleet-stat">
              <div className="fleet-stat-label">Starting as low as</div>
              <div className="fleet-stat-value">$59/hr</div>
            </div>
          </div>
          <p className="fleet-desc">Choose 2, 3, or 4 Yamaha jet skis, then pick the number of hours that fits your day on the water.</p>
          <div className="fleet-rate-note">Rates begin at <strong style={{color: 'var(--gold)'}}>$59/hr per ski</strong> on the longest block, with full pricing, deposits, and add-ons shown during booking.</div>
          <div className="fleet-perks">
            <span className="fleet-perk">Life Jackets</span>
            <span className="fleet-perk">Full Tank</span>
            <span className="fleet-perk">Fast &amp; Easy Booking</span>
            <span className="fleet-perk">Cooler</span>
            <span className="fleet-perk">Safety Briefing</span>
            <span className="fleet-perk">No License Needed</span>
          </div>
          <div className="fleet-actions">
            <a href="#booking" className="btn-primary">Choose Jet Skis</a>
          </div>
        </div>
      </div>
      <div className="fleet-card" id="boat">
        <div className="fleet-media">
          <img loading="lazy" decoding="async" src="./assets/images/shoreline-pontoon-crop-final.png" alt="Luxury tritoon on Lake Lewisville seating up to 14 guests" />
        </div>
        <div className="fleet-body">
          <div className="fleet-badge">Starcraft Tritoon · Seats Up to 14</div>
          <div className="fleet-title-row">
            <div className="fleet-title">Boat Rental</div>
            <div className="fleet-stat">
              <div className="fleet-stat-label">Starting at</div>
              <div className="fleet-stat-value">$160/hr</div>
            </div>
          </div>
          <p className="fleet-desc">It's a <strong>Starcraft tritoon</strong> — three pontoons instead of two, so it rides smoother and faster than a regular pontoon. Seats up to 14 with cushioned loungers, Bluetooth speakers, and a shade top. Good for birthdays, bachelor and bachelorette trips, sandbar days, sunset cruises, and tubing. Comes with a captain.</p>
          <div className="fleet-perks">
            <span className="fleet-perk">Triple-Pontoon Tritoon</span>
            <span className="fleet-perk">Bluetooth Sound</span>
            <span className="fleet-perk">Seats up to 14</span>
            <span className="fleet-perk">Captain Included</span>
            <span className="fleet-perk">Loungers &amp; Shade</span>
            <span className="fleet-perk">Tubing-Ready</span>
          </div>
          <div className="fleet-actions">
            <a href="./jetski-booking/?type=boat&craft=partyboat" className="btn-primary">Book the Boat</a>
          </div>
        </div>
      </div>
    </div>
    <div className="bundle-highlight">
      <div className="bundle-media-stack">
        <div className="bundle-media">
          <img loading="lazy" decoding="async" src="./assets/images/shoreline-pontoon-crop-final.png" alt="Pontoon boat on the water ready for a Shoreline group day" />
        </div>
        <div className="bundle-media">
          <img loading="lazy" decoding="async" src="./assets/images/shoreline-customer-duo.png" alt="Shoreline riders enjoying a Yamaha jet ski on Lake Lewisville" />
        </div>
      </div>
      <div className="bundle-copy">
        <h3>Want the bundle instead?</h3>
        <p>Pair Yamaha jet skis with the boat in one request so the whole group can ride, lounge, and stay together for the full lake day.</p>
        <div className="bundle-badges">
          <span className="bundle-badge">Jet skis + boat</span>
          <span className="bundle-badge">Captain included</span>
          <span className="bundle-badge">Built for bigger groups</span>
        </div>
        <div className="bundle-action">
          <a href="#booking" className="btn-primary">Build a Bundle</a>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
