'use client';

import { mediaUrl } from '../../../lib/media';

export function HomeAddOnsSection() {
  return (
    <section id="addons">
  <div className="section-inner">
    <div className="section-tag">Add-Ons</div>
    <h2>Add More to the Lake Day</h2>
    <p className="section-sub">Drone coverage is available for rentals. Karaoke and tube add-ons are boat-only options added during booking.</p>
    <div className="addons-grid">
      <div className="addon-card addon-card-feature">
        <div className="addon-media">
          <img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-aerial-drone-video-pontoon.webp')} alt="Aerial drone footage over Lake Lewisville" />
        </div>
        <div className="addon-content">
          <div className="addon-topline">
            <span className="addon-tag">Optional add-on</span>
          </div>
          <div className="addon-name">Aerial Drone Video</div>
          <p className="addon-desc">Add one clean highlight edit from above the water so the group leaves with a polished clip from the day.</p>
          <div className="addon-points">
            <span className="addon-point">Launch + ride footage</span>
            <span className="addon-point">Simple add-on at booking</span>
          </div>
          <div className="addon-foot">
            <div className="addon-price-wrap">
              <div className="addon-price">$50 <span style={{fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.6)'}}>highlight edit</span></div>
              <div className="addon-price-note">Easy add-on during booking</div>
            </div>
            <a href="#booking" className="addon-cta">Add it to your booking →</a>
          </div>
        </div>
      </div>
      <div className="addon-card addon-card-feature">
        <div className="addon-media">
          <img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-karaoke-setup-pontoon.webp')} alt="Karaoke speaker and microphones set up on the boat" />
        </div>
        <div className="addon-content">
          <div className="addon-topline">
            <span className="addon-tag">Boat-only add-on</span>
          </div>
          <div className="addon-name">Karaoke Setup</div>
          <p className="addon-desc">Add karaoke to a boat rental for groups that want music and singing time while they are out on the water.</p>
          <div className="addon-points">
            <span className="addon-point">Boat rentals only</span>
            <span className="addon-point">Charged at checkout</span>
          </div>
          <div className="addon-foot">
            <div className="addon-price-wrap">
              <div className="addon-price">$50 <span style={{fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.6)'}}>flat add-on</span></div>
            </div>
            <a href="#booking" className="addon-cta">Choose a boat rental →</a>
          </div>
        </div>
      </div>
      <div className="addon-card addon-card-feature">
        <div className="addon-media">
          <img loading="lazy" decoding="async" src={mediaUrl('site/images/shoreline-pool-tube-pontoon.webp')} alt="Pool tube staged on the boat deck" />
        </div>
        <div className="addon-content">
          <div className="addon-topline">
            <span className="addon-tag">Boat-only add-on</span>
          </div>
          <div className="addon-name">Pool Tube</div>
          <p className="addon-desc">Add a pool tube to a boat rental when the group wants an easy float for the lake day.</p>
          <div className="addon-points">
            <span className="addon-point">Boat rentals only</span>
            <span className="addon-point">Charged at checkout</span>
          </div>
          <div className="addon-foot">
            <div className="addon-price-wrap">
              <div className="addon-price">$50 <span style={{fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.6)'}}>flat add-on</span></div>
            </div>
            <a href="#booking" className="addon-cta">Choose a boat rental →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
