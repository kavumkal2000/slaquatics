'use client';

export function JetskiBookingDiv1() {
  return (
    <div className="shell">
  <div className="topbar">
    <a className="brand" href="../">
      <div className="brand-logo">
        <img src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/681d97126b471ca2569a5463.png" alt="Shoreline Aquatics" />
      </div>
    </a>
    <div className="top-actions">
      <a className="btn btn-ghost" href="sms:14696937164?&body=Hey%20Shoreline%20Aquatics%2C%20I%20want%20help%20choosing%20a%20rental%20time.">Text Us</a>
      <a className="btn btn-ghost" href="../waiver/">Contact + Waiver</a>
      <a className="btn btn-ghost" href="../privacy-policy/">Privacy Policy</a>
      <a className="btn btn-primary" href="tel:4696937164">Call (469) 693-7164</a>
    </div>
  </div>
  <div className="hero">
    <div className="hero-card hero-spotlight">
      <div>
        <div className="eyebrow">Live booking availability</div>
        <h1>See Open Time Slots <span>Before You Book</span></h1>
        <p className="hero-copy">
          Pick the day first, see live availability right away, and move into the contact, waiver, and $55 checkout step only after you know your rental time is open.
        </p>
        <div className="hero-badge-row">
          <span className="trust-badge wave">No license needed</span>
        </div>
        <div className="hero-action-row">
          <a className="btn btn-primary" href="#booking-form-card">Book Now</a>
          <a className="btn btn-ghost" href="sms:14696937164?&body=Hey%20Shoreline%20Aquatics%2C%20I%20want%20help%20choosing%20the%20best%20rental%20time.">Text Us</a>
        </div>
        <div className="contact-strip">
          <a className="contact-pill" href="tel:4696937164">Call (469) 693-7164</a>
          <a className="contact-pill" href="sms:14696937164?&body=Hey%20Shoreline%20Aquatics%2C%20I%20have%20a%20question%20about%20booking.">Tap to text</a>
          <span className="contact-pill">Meet us at the launch · Lake Lewisville</span>
        </div>
      </div>
      <div className="hero-video-panel">
        <div className="hero-video-shell" id="hero-video-wrap">
          <video id="hero-video" autoPlay muted loop playsInline preload="auto" poster="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/687eb467ca64a6008956c632.jpeg">
            <source src="https://storage.googleapis.com/msgsndr/3PgAS2jkeJsHjqRMEuF6/media/68181c55efb1e5d49ba97e25.mp4" type="video/mp4" />
          </video>
          <button className="hero-video-play" id="hero-video-play" type="button">Tap to play video</button>
        </div>
        <div className="summary-card" id="live-reviews-card">
          <div className="summary-kicker">Live Google reviews</div>
          <div className="summary-title">Loading Shoreline reviews...</div>
          <div className="summary-note">We’ll pull your live Google review link from the ops backend so renters can tap into real reviews before they book.</div>
        </div>
      </div>
    </div>
  </div>
  <div className="info-card first-timer-card">
    <div className="mini-kicker">First time?</div>
    <h2>Here’s how it works</h2>
    <p className="section-copy">New to the water? No experience needed — here’s everything we take care of for you.</p>
    <div className="first-time-grid">
      <div className="first-time-item">
        <strong>No license needed</strong>
        <span>You do not need a boating license to rent here.</span>
      </div>
      <div className="first-time-item">
        <strong>Full orientation</strong>
        <span>Every ride starts with a safety walkthrough before launch.</span>
      </div>
      <div className="first-time-item">
        <strong>Gear included</strong>
        <span>Life jackets, fuel, and the launch briefing are included.</span>
      </div>
    </div>
  </div>
  <div className="content-grid">
    <div className="form-card" id="booking-form-card">
      <h2 className="section-title">Pick the rental date first</h2>
      <p className="section-copy">
        Choose the date and start time here. The next page combines the rider contact form, waiver, and $55 checkout in one step.
      </p>
      <form id="booking-form">
        <input id="booking-token" type="hidden" defaultValue="" />
        <div className="form-stack">
          <div className="calendar-card">
            <div className="block-label">Calendar</div>
            <div className="calendar-shell">
              <div className="calendar-frame">
                <div className="calendar-head">
                  <div>
                    <h3>Choose the rental day first</h3>
                    <p>Pick the day up front so the rest of the booking stays locked to the right rental date.</p>
                  </div>
                  <div className="calendar-nav">
                    <button type="button" aria-label="Previous month">←</button>
                    <div className="calendar-month" id="calendar-month">Month Year</div>
                    <button type="button" aria-label="Next month">→</button>
                  </div>
                </div>
                <div className="calendar-weekdays">
                  <div className="calendar-weekday">Sun</div>
                  <div className="calendar-weekday">Mon</div>
                  <div className="calendar-weekday">Tue</div>
                  <div className="calendar-weekday">Wed</div>
                  <div className="calendar-weekday">Thu</div>
                  <div className="calendar-weekday">Fri</div>
                  <div className="calendar-weekday">Sat</div>
                </div>
                <div className="calendar-grid" id="calendar-grid" />
              </div>
              <div className="calendar-summary">
                <div className="calendar-picked"><span>Selected</span><span id="calendar-pill-date">Today</span></div>
                <div className="calendar-big-date" id="calendar-big-date">Today</div>
                <p id="calendar-copy">Choose the date that works best, then continue to the contact, waiver, and $55 checkout page.</p>
                <div className="calendar-mini">
                  <div className="calendar-mini-item">
                    <strong>Requested date</strong>
                    <span id="calendar-selected-inline">Today</span>
                  </div>
                  <div className="field">
                    <label htmlFor="date">Requested date</label>
                    <input id="date" name="date" type="date" required />
                  </div>
                  <div className="field">
                    <label htmlFor="time">Preferred start time</label>
                    <select id="time" name="time" required>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                    <div className="field-hint" id="availability-note" hidden />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="summary-card holiday-special" id="holiday-special" hidden>
            <div className="summary-kicker" id="holiday-title">July 4th Special</div>
            <p className="holiday-note" id="holiday-note">Holiday special: we’re only running 2 jet skis on the 4th — pick a 4-hour or 8-hour block below.</p>
            <div className="holiday-options" id="holiday-options" />
          </div>
          <div className="summary-card bottom-summary">
            <div className="summary-kicker">Package summary</div>
            <h3>Review the booking before the next step</h3>
            <div className="summary-total" id="summary-total">$300</div>
            <div className="summary-title" id="summary-title">2 Yamaha Jet Skis</div>
            <div className="summary-note" id="summary-note">2 hour rental with 2 Yamaha jet skis, life jackets, a full tank, and safety briefing included.</div>
            <div className="summary-highlight">
              <div className="summary-highlight-item">
                <strong id="summary-rate-label">Hourly rate</strong>
                <span id="summary-rate">$79/hr per ski</span>
              </div>
              <div className="summary-highlight-item">
                <strong id="summary-value-label">Savings</strong>
                <span id="summary-value">Base rate</span>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-row"><span>Duration</span><strong id="summary-duration">2 hours</strong></div>
              <div className="summary-row"><span>Rental date</span><strong id="summary-date">Today</strong></div>
              <div className="summary-row"><span>Start time</span><strong id="summary-time">10:00 AM</strong></div>
              <div className="summary-row"><span>Due today</span><strong>$55</strong></div>
            </div>
            <div className="footer-note" style={{marginTop: 18}}>
              Need to change the package? Head back to the homepage booking section before continuing.
            </div>
          </div>
          <div className="summary-card" style={{marginTop: 14}}>
            <div className="summary-kicker">Add-ons · $50 each</div>
            <label style={{display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
              <input type="checkbox" id="addon-drone" style={{width: 18, height: 18, accentColor: 'var(--gold)'}} />
              <span style={{flex: 1}}>🚁 Aerial drone video</span><strong style={{color: 'var(--gold)'}}>+$50</strong>
            </label>
            <label id="addon-karaoke-row" style={{display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
              <input type="checkbox" id="addon-karaoke" style={{width: 18, height: 18, accentColor: 'var(--gold)'}} />
              <span style={{flex: 1}}>🎤 Karaoke setup</span><strong style={{color: 'var(--gold)'}}>+$50</strong>
            </label>
            <label id="addon-tube-row" style={{display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0', cursor: 'pointer'}}>
              <input type="checkbox" id="addon-tube" style={{width: 18, height: 18, accentColor: 'var(--gold)'}} />
              <span style={{flex: 1}}>🛟 Towable tube</span><strong style={{color: 'var(--gold)'}}>+$50</strong>
            </label>
          </div>
          <div hidden aria-hidden="true">
            <span id="craft-label" />
            <select id="craft" name="craft" required />
            <select id="duration" name="duration" required />
          </div>
        </div>
        <div className="status" id="form-status" />
        <button className="btn btn-primary" type="submit">Continue To Contact + Waiver</button>
        <div className="footer-note">
          The next page combines the contact form, waiver, and $55 checkout in one clean step.
        </div>
      </form>
    </div>
  </div>
</div>
  );
}
