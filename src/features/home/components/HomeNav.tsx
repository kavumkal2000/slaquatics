'use client';

import { useEffect, useState } from 'react';
import { media } from '../../../lib/media';

export function HomeNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('nav-open', mobileOpen);
    return () => document.body.classList.remove('nav-open');
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
    <nav>
  <div className="nav-logo">
    <img loading="lazy" decoding="async" src={media.logo} alt="Shoreline Aquatics" />
  </div>
  <ul>
    <li><a href="#fleet">Fleet</a></li>
    <li><a href="#booking">Book Now</a></li>
    <li><a href="#addons">Add-Ons</a></li>
    <li><a href="#location">Location</a></li>
    <li><a href="#reviews">Reviews</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ul>
  <div className="nav-right">
    <a href="tel:4696937164" className="nav-phone">(469) 693-7164</a>
    <a href="#booking" className="btn-primary">Book Now</a>
  </div>
  <button className="nav-menu-btn" id="mobile-menu-open" type="button" aria-label="Open menu" aria-expanded={mobileOpen ? 'true' : 'false'} aria-controls="mobile-nav" onClick={() => setMobileOpen((open) => !open)}>
    <span />
    <span />
    <span />
  </button>
</nav>
    <div className={`mobile-nav-backdrop${mobileOpen ? ' show' : ''}`} id="mobile-nav-backdrop" onClick={() => setMobileOpen(false)} />
    <aside className={`mobile-nav${mobileOpen ? ' show' : ''}`} id="mobile-nav" aria-hidden={mobileOpen ? 'false' : 'true'}>
      <div className="mobile-nav-head">
        <div className="mobile-nav-title">Menu</div>
        <button className="mobile-nav-close" id="mobile-menu-close" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>×</button>
      </div>
      <ul className="mobile-nav-links">
        <li><a href="#fleet" onClick={() => setMobileOpen(false)}>Fleet</a></li>
        <li><a href="#booking" onClick={() => setMobileOpen(false)}>Book Now</a></li>
        <li><a href="#addons" onClick={() => setMobileOpen(false)}>Add-Ons</a></li>
        <li><a href="#location" onClick={() => setMobileOpen(false)}>Location</a></li>
        <li><a href="#reviews" onClick={() => setMobileOpen(false)}>Reviews</a></li>
        <li><a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a></li>
      </ul>
      <div className="mobile-nav-actions">
        <a href="tel:4696937164" className="btn-ghost" onClick={() => setMobileOpen(false)}>Call (469) 693-7164</a>
        <a href="#booking" className="btn-primary" onClick={() => setMobileOpen(false)}>Book Now</a>
      </div>
    </aside>
    </>
  );
}
