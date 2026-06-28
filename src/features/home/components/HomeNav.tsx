'use client';

export function HomeNav() {
  return (
    <nav>
  <div className="nav-logo">
    <img loading="lazy" decoding="async" src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/681d97126b471ca2569a5463.png" alt="Shoreline Aquatics" />
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
  <button className="nav-menu-btn" id="mobile-menu-open" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
    <span />
    <span />
    <span />
  </button>
</nav>
  );
}
