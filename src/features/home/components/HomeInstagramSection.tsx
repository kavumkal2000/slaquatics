'use client';

export function HomeInstagramSection() {
  return (
    <section className="ig-section">
  <div className="section-inner">
    <div className="ig-header">
      <div><div className="section-tag">Follow Along</div><h2>@shorelineaquatic</h2></div>
      <div style={{display: 'flex', gap: '0.6rem', flexWrap: 'wrap'}}>
        <a href="https://www.instagram.com/shorelineaquatic/" target="_blank" className="btn-ghost">Follow on Instagram</a>
        <a href="https://www.facebook.com/slaquatic/" target="_blank" className="btn-ghost">Facebook</a>
      </div>
    </div>
    <div className="ig-grid">
      <div className="ig-tile"><img loading="lazy" decoding="async" src="./assets/images/shoreline-jetski-group-collage.webp" alt="Shoreline group with Yamaha jet skis on Lake Lewisville" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src="./assets/images/shoreline-jetski-shoreline-guests.webp" alt="Customers meeting Shoreline Aquatics at the shoreline" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src="./assets/images/shoreline-jetski-two-riders.webp" alt="Two riders on Yamaha jet skis" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src="./assets/images/shoreline-jetski-solo-rider.webp" alt="Customer riding a Yamaha jet ski" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/67d0b77af75b9a715dcea493.jpeg" alt="Aerial drone coverage" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/67d0b77af75b9a715dcea493.jpeg" alt="Drone" /></div>
    </div>
    <div className="ig-follow-cta">
      <p>See more shots from Lake Lewisville — follow us for availability, customer clips, and deals.</p>
      <div style={{display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center'}}>
        <a href="https://www.instagram.com/shorelineaquatic/" target="_blank" className="btn-primary">Follow @shorelineaquatic</a>
        <a href="https://www.facebook.com/slaquatic/" target="_blank" className="btn-ghost">Find us on Facebook</a>
      </div>
    </div>
  </div>
</section>
  );
}
