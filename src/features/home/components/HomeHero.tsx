'use client';

export function HomeHero() {
  return (
    <div className="hero">
  <div className="hero-video-wrap" id="hero-video-wrap">
    {/* Video from the existing site */}
    <video id="hero-video" autoPlay muted loop playsInline preload="auto" poster="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/687eb467ca64a6008956c632.jpeg">
      <source src="https://storage.googleapis.com/msgsndr/3PgAS2jkeJsHjqRMEuF6/media/68181c55efb1e5d49ba97e25.mp4" type="video/mp4" />
    </video>
    <button className="hero-video-play" id="hero-video-play" type="button">Tap To Play Video</button>
  </div>
  <div className="hero-inner">
    <div className="eyebrow">Lake Lewisville · Hickory Creek, TX</div>
    <h1>Ride The <em>Open</em><br />Water</h1>
    <p className="hero-sub">Jet ski &amp; boat rentals at Lake Lewisville. Meet us at the launch, get your walkthrough, and hit the water with life jackets, fuel, and cooler included.</p>
    <div className="hero-actions">
      <a href="#booking" className="btn-primary">Book Now</a>
      <a href="#fleet" className="btn-ghost">See Our Fleet</a>
    </div>
    {/* Address & Hours below hero CTA */}
    <div className="hero-info-bar">
      <div className="hero-info-item">
        <span className="hero-info-icon">📍</span>
        <div>
          <div className="hero-info-label">Location</div>
          <div className="hero-info-value">Point Vista Rd, Hickory Creek, TX</div>
        </div>
      </div>
      <div className="hero-info-item">
        <span className="hero-info-icon">🕗</span>
        <div>
          <div className="hero-info-label">Hours</div>
          <div className="hero-info-value">Mon–Sun · 10 AM – 8 PM</div>
        </div>
      </div>
      <div className="hero-info-item">
        <span className="hero-info-icon">📞</span>
        <div>
          <div className="hero-info-label">Call or Text</div>
          <div className="hero-info-value"><a href="tel:4696937164" style={{color: 'var(--gold)', textDecoration: 'none'}}>(469) 693-7164</a></div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
