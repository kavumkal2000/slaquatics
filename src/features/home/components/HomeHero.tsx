'use client';

import { LAUNCH_ADDRESS, LAUNCH_HOURS } from '../../../lib/launch-info';
import { media } from '../../../lib/media';

export function HomeHero() {
  return (
    <div className="hero">
      <div className="hero-video-wrap" id="hero-video-wrap">
        <video id="hero-video" autoPlay muted loop playsInline preload="auto" poster={media.heroPoster}>
          <source src={media.heroVideo} type="video/mp4" />
        </video>
        <button className="hero-video-play" id="hero-video-play" type="button">Tap To Play Video</button>
      </div>
      <div className="hero-inner">
        <div className="hero-copy-panel">
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
                <div className="hero-info-value">{LAUNCH_ADDRESS}</div>
              </div>
            </div>
            <div className="hero-info-item">
              <span className="hero-info-icon">🕗</span>
              <div>
                <div className="hero-info-label">Hours</div>
                <div className="hero-info-value">{LAUNCH_HOURS}</div>
              </div>
            </div>
            <div className="hero-info-item">
              <span className="hero-info-icon">📞</span>
              <div>
                <div className="hero-info-label">Call or Text</div>
                <div className="hero-info-value"><a href="tel:4696937164" style={{ color: 'var(--gold)', textDecoration: 'none' }}>(469) 693-7164</a></div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-media-module" aria-label="Shoreline Aquatics lake day video">
          <img src={media.heroModuleAnimation} alt="Point-of-view jet ski ride on Lake Lewisville" />
        </div>
      </div>
    </div>
  );
}
