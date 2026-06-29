import { media } from '../../../lib/media';

export function JetskiBookingHero() {
  return (
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
            <video id="hero-video" autoPlay muted loop playsInline preload="auto" poster={media.heroPoster}>
              <source src={media.heroVideo} type="video/mp4" />
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
  );
}
