'use client';

export function HomeMobileNav() {
  return (
    <aside className="mobile-nav" id="mobile-nav" aria-hidden="true">
  <div className="mobile-nav-head">
    <div className="mobile-nav-title">Menu</div>
    <button className="mobile-nav-close" id="mobile-menu-close" type="button" aria-label="Close menu">×</button>
  </div>
  <ul className="mobile-nav-links">
    <li><a href="#fleet">Fleet</a></li>
    <li><a href="#booking">Book Now</a></li>
    <li><a href="#addons">Add-Ons</a></li>
    <li><a href="#location">Location</a></li>
    <li><a href="#reviews">Reviews</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ul>
  <div className="mobile-nav-actions">
    <a href="tel:4696937164" className="btn-ghost">Call (469) 693-7164</a>
    <a href="#booking" className="btn-primary">Book Now</a>
  </div>
</aside>
  );
}
