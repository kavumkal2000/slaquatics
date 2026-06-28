'use client';


export function HomeBookingCalculator() {
  return (
    <section id="booking" className="calc-section">
  <div className="section-inner">
    <div className="section-tag">Book Your Rental</div>
    <h2>Choose The Package First</h2>
    <p className="section-sub" style={{marginBottom: '2rem'}}>Choose your rental, compare the hourly value, and continue into the booking flow for the date, contact + waiver, and $55 checkout.</p>
    <div className="calc-wrap">
      <div className="calc-tabs">
        <button className="calc-tab-btn active" id="tab-jetski">
          Jet Ski Rental
        </button>
        <button className="calc-tab-btn" id="tab-boat">
          Boat Rental
        </button>
        <button className="calc-tab-btn" id="tab-bundle">
          Bundle
        </button>
      </div>
      <div className="calc-panel active" id="panel-jetski">
        <div>
          <div className="calc-col-label">1 · Number of jet skis needed</div>
          <div className="calc-select-group" id="js-craft-opts">
            <div className="calc-option selected" data-craft="jetski2">
              <div><div className="calc-option-name">2 Yamaha Jet Skis</div><div className="calc-option-sub">Best for a smaller crew</div></div>
              <div className="calc-check" />
            </div>
            <div className="calc-option" data-craft="jetski3">
              <div><div className="calc-option-name">3 Yamaha Jet Skis</div><div className="calc-option-sub">Extra room for a bigger group</div></div>
              <div className="calc-check" />
            </div>
            <div className="calc-option" data-craft="jetski4">
              <div><div className="calc-option-name">4 Yamaha Jet Skis</div><div className="calc-option-sub">Largest Yamaha setup</div></div>
              <div className="calc-check" />
            </div>
          </div>
          <hr className="calc-divider" />
          <div className="calc-col-label">2 · Choose your duration</div>
          <div className="calc-select-group" id="js-dur-opts">
            <div className="calc-option selected" data-hours={2}>
              <div><div className="calc-option-name">2 Hours</div><div className="calc-option-sub">$79/hr per ski</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={3}>
              <div><div className="calc-option-name">3 Hours</div><div className="calc-option-sub">$79/hr per ski</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={4}>
              <div><div className="calc-option-name">4 Hours</div><div className="calc-option-sub"><strong>Most Popular</strong> · $74/hr per ski</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={6}>
              <div><div className="calc-option-name">6 Hours</div><div className="calc-option-sub"><strong>Best Value</strong> · $63/hr per ski</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={8}>
              <div><div className="calc-option-name">Full Day (8 Hours)</div><div className="calc-option-sub">$59/hr per ski</div></div><div className="calc-check" />
            </div>
          </div>
          <div className="calc-addon-box">
            <div className="calc-addon-label">3 · Add Aerial Drone Coverage</div>
            <div className="calc-select-group" id="js-drone-opts">
              <div className="calc-option selected" data-drone="no">
                <div><div className="calc-option-name">No drone coverage</div></div><div className="calc-check" />
              </div>
              <div className="calc-option" data-drone="yes">
                <div><div className="calc-option-name">Add drone highlight video</div><div className="calc-option-sub">+$50</div></div><div className="calc-check" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="calc-result-box">
            <div className="calc-result-label">Your Total</div>
            <div className="calc-result-price" id="js-price">$315</div>
            <div className="calc-result-desc" id="js-desc">2 Yamaha Jet Skis · 2hrs · $79/hr per ski</div>
            <div className="calc-deposit-row">
              <div className="calc-deposit-item"><div className="dl">Deposit credit</div><div className="dv" style={{color: 'var(--gold)'}}>$50</div></div>
              <div className="calc-deposit-item"><div className="dl">Due today</div><div className="dv" style={{color: 'var(--gold)'}}>$55</div></div>
            </div>
          </div>
          <div className="calc-includes">
            <div className="calc-includes-label">Everything included</div>
            <div className="calc-include-list">
              <span className="calc-include-item">Life Jackets</span>
              <span className="calc-include-item">Full Tank of Gas</span>
              <span className="calc-include-item">Fast &amp; Easy Booking</span>
              <span className="calc-include-item">Cooler</span>
              <span className="calc-include-item">Safety Briefing</span>
            </div>
          </div>
          <a href="./jetski-booking/?type=jetski&craft=jetski2&hours=2&total=300" className="calc-book-btn" id="js-book-btn">Continue to Calendar &amp; Contact + Waiver →</a>
          <p className="price-match" id="js-savings-note">Base rate is $79/hr per ski. $55 due today at checkout.</p>
        </div>
      </div>
      <div className="calc-panel" id="panel-boat">
        <div>
          <div className="calc-col-label">Choose your duration</div>
          <div className="calc-select-group" id="bt-dur-opts">
            <div className="calc-option" data-hours={2}>
              <div><div className="calc-option-name">2 Hours</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={3}>
              <div><div className="calc-option-name">3 Hours</div></div><div className="calc-check" />
            </div>
            <div className="calc-option selected" data-hours={4}>
              <div><div className="calc-option-name">4 Hours</div><div className="calc-option-sub"><strong>Most Popular</strong></div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={6}>
              <div><div className="calc-option-name">6 Hours</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={8}>
              <div><div className="calc-option-name">Full Day (8 Hours)</div><div className="calc-option-sub"><strong>Best Value</strong></div></div><div className="calc-check" />
            </div>
          </div>
          <div className="calc-addon-box">
            <div className="calc-addon-label">2 · Add Aerial Drone Coverage</div>
            <div className="calc-select-group" id="bt-drone-opts">
              <div className="calc-option selected" data-drone="no">
                <div><div className="calc-option-name">No drone coverage</div></div><div className="calc-check" />
              </div>
              <div className="calc-option" data-drone="yes">
                <div><div className="calc-option-name">Add drone highlight video</div><div className="calc-option-sub">+$50</div></div><div className="calc-check" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="calc-result-box">
            <div className="calc-result-label">Your Total</div>
            <div className="calc-result-price" id="bt-price">$640</div>
            <div className="calc-result-desc" id="bt-desc">Boat Rental · 4 Hours · Up to 14 guests</div>
            <div className="calc-deposit-row">
              <div className="calc-deposit-item"><div className="dl">Due today</div><div className="dv" style={{color: 'var(--gold)'}}>$55</div></div>
              <div className="calc-deposit-item"><div className="dl">Captain</div><div className="dv" style={{color: 'var(--gold)'}}>Included</div></div>
            </div>
          </div>
          <div className="calc-includes">
            <div className="calc-includes-label">Everything included</div>
            <div className="calc-include-list">
              <span className="calc-include-item">Captain</span>
              <span className="calc-include-item">Life Jackets</span>
              <span className="calc-include-item">Full Tank</span>
              <span className="calc-include-item">Fast &amp; Easy Booking</span>
              <span className="calc-include-item">Cooler</span>
              <span className="calc-include-item">Up to 14 Guests</span>
            </div>
          </div>
          <a href="./jetski-booking/?type=boat&craft=partyboat&hours=4&total=640" className="calc-book-btn" id="bt-book-btn">Continue to Calendar &amp; Contact + Waiver →</a>
          <p className="price-match">Easy hourly pricing with the captain included. $55 due today at checkout.</p>
        </div>
      </div>
      <div className="calc-panel" id="panel-bundle">
        <div>
          <div className="calc-col-label">1 · Choose your bundle size</div>
          <div className="calc-select-group" id="bd-craft-opts">
            <div className="calc-option selected" data-craft="bundle2">
              <div><div className="calc-option-name">2 Jet Skis + Boat</div><div className="calc-option-sub">Best for a mixed group</div></div>
              <div className="calc-check" />
            </div>
            <div className="calc-option" data-craft="bundle3">
              <div><div className="calc-option-name">3 Jet Skis + Boat</div><div className="calc-option-sub">Extra room for more riders</div></div>
              <div className="calc-check" />
            </div>
            <div className="calc-option" data-craft="bundle4">
              <div><div className="calc-option-name">4 Jet Skis + Boat</div><div className="calc-option-sub">Full lake-day setup</div></div>
              <div className="calc-check" />
            </div>
          </div>
          <hr className="calc-divider" />
          <div className="calc-col-label">2 · Choose your duration</div>
          <div className="calc-select-group" id="bd-dur-opts">
            <div className="calc-option selected" data-hours={2}>
              <div><div className="calc-option-name">2 Hours</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={3}>
              <div><div className="calc-option-name">3 Hours</div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={4}>
              <div><div className="calc-option-name">4 Hours</div><div className="calc-option-sub"><strong>Most Popular</strong></div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={6}>
              <div><div className="calc-option-name">6 Hours</div><div className="calc-option-sub"><strong>Best Value</strong></div></div><div className="calc-check" />
            </div>
            <div className="calc-option" data-hours={8}>
              <div><div className="calc-option-name">Full Day (8 Hours)</div></div><div className="calc-check" />
            </div>
          </div>
          <div className="calc-addon-box">
            <div className="calc-addon-label">3 · Add Aerial Drone Coverage</div>
            <div className="calc-select-group" id="bd-drone-opts">
              <div className="calc-option selected" data-drone="no">
                <div><div className="calc-option-name">No drone coverage</div></div><div className="calc-check" />
              </div>
              <div className="calc-option" data-drone="yes">
                <div><div className="calc-option-name">Add drone highlight video</div><div className="calc-option-sub">+$50</div></div><div className="calc-check" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="calc-result-box">
            <div className="calc-result-label">Your Total</div>
            <div className="calc-result-price" id="bd-price">$540</div>
            <div className="calc-result-desc" id="bd-desc">2 Jet Skis + Boat · 2hrs</div>
            <div className="calc-deposit-row">
              <div className="calc-deposit-item"><div className="dl">Deposit credit</div><div className="dv" style={{color: 'var(--gold)'}}>$50</div></div>
              <div className="calc-deposit-item"><div className="dl">Due today</div><div className="dv" style={{color: 'var(--gold)'}}>$55</div></div>
            </div>
          </div>
          <div className="calc-includes">
            <div className="calc-includes-label">Everything included</div>
            <div className="calc-include-list">
              <span className="calc-include-item">Yamaha Jet Skis</span>
              <span className="calc-include-item">Boat + Captain</span>
              <span className="calc-include-item">Life Jackets</span>
              <span className="calc-include-item">Full Tank</span>
              <span className="calc-include-item">Fast &amp; Easy Booking</span>
              <span className="calc-include-item">Cooler</span>
            </div>
          </div>
          <a href="./jetski-booking/?type=bundle&craft=bundle2&hours=2&total=540" className="calc-book-btn" id="bd-book-btn">Continue to Calendar &amp; Contact + Waiver →</a>
          <p className="price-match">Found a lower price? <span>We'll match it.</span> $55 due today at checkout.</p>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
