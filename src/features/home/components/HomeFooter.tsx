'use client';

import { LAUNCH_ADDRESS, LAUNCH_HOURS } from '../../../lib/launch-info';
import { media } from '../../../lib/media';

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
        <a href="https://www.instagram.com/shorelineaquatic/" className="footer-social" target="_blank">ig</a>
        <a href="https://www.facebook.com/slaquatic/" className="footer-social" target="_blank">fb</a>
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
