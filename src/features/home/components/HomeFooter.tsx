'use client';

import { LAUNCH_ADDRESS, LAUNCH_HOURS } from '../../../lib/launch-info';
import { media } from '../../../lib/media';

function InstagramIcon() {
  return (
    <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14.2 8.3V6.9c0-.7.5-1.1 1.2-1.1H17V3.1c-.8-.1-1.7-.1-2.5-.1-2.6 0-4.4 1.6-4.4 4.5v.8H7.4v3h2.7V21h3.3v-9.7h2.8l.4-3h-3.2Z" />
    </svg>
  );
}

export function HomeFooter() {
  return (
    <footer>
  <div className="footer-inner">
    <div>
      <div className="footer-logo">
        <img loading="lazy" decoding="async" src={media.logo} alt="Shoreline Aquatics" />
      </div>
      <p className="footer-about">Jet ski &amp; boat rentals at Lake Lewisville, TX. Meet us at {LAUNCH_ADDRESS} during {LAUNCH_HOURS}.</p>
      <div className="footer-socials">
        <a href="https://www.instagram.com/shorelineaquatic/" className="footer-social" target="_blank" rel="noopener noreferrer" aria-label="Shoreline Aquatics on Instagram">
          <InstagramIcon />
        </a>
        <a href="https://www.facebook.com/slaquatic/" className="footer-social" target="_blank" rel="noopener noreferrer" aria-label="Shoreline Aquatics on Facebook">
          <FacebookIcon />
        </a>
      </div>
    </div>
    <div className="footer-col">
      <h5>Rentals</h5>
      <ul>
        <li><a href="#jetski">Jet Ski Rentals</a></li>
        <li><a href="#boat">Boat Rental</a></li>
        <li><a href="#addons">Drone Add-on</a></li>
        <li><a href="#addons">Aerial Drone Coverage</a></li>
      </ul>
    </div>
    <div className="footer-col">
      <h5>Plan Your Day</h5>
      <ul>
        <li><a href="#fleet">Compare the Fleet</a></li>
        <li><a href="#booking">Build Your Package</a></li>
        <li><a href="#addons">Aerial Drone Coverage</a></li>
        <li><a href="#location">Arrival Directions</a></li>
      </ul>
    </div>
    <div className="footer-col">
      <h5>Info</h5>
      <ul>
        <li><a href="#reviews">Reviews</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#location">Arrival Directions</a></li>
        <li><a href="./waiver/">Contact + Waiver</a></li>
        <li><a href="./privacy-policy/">Privacy Policy</a></li>
      </ul>
    </div>
  </div>
  <div className="footer-bottom">
    <span>© 2026 Shoreline Aquatics LLC · {LAUNCH_ADDRESS} · All rights reserved</span>
    <span><a href="./privacy-policy/">Privacy Policy</a></span>
  </div>
</footer>
  );
}
