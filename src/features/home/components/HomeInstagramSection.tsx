'use client';

import { mediaUrl } from '../../../lib/media';

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
      <div className="ig-tile"><img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aquatics-img-4483.webp')} alt="Shoreline group with Yamaha jet skis on Lake Lewisville" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aquatics-img-4198.webp')} alt="Customers meeting Shoreline Aquatics at the shoreline" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aquatics-img-4175.webp')} alt="Two riders on Yamaha jet skis" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aquatics-img-8967.webp')} alt="Customer riding a Yamaha jet ski" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aquatics-img-3611.webp')} alt="Aerial-style Shoreline Aquatics customer moment" /></div>
      <div className="ig-tile"><img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aquatics-9fc84833-3e1a-4cc9-90ed-a3f65305d6f8.webp')} alt="Shoreline Aquatics lake day moment" /></div>
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
