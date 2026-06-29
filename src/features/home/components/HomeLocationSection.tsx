'use client';

import { ARRIVAL_DIRECTIONS, LAUNCH_ADDRESS, LAUNCH_MAPS_EMBED_URL, LAUNCH_MAPS_URL } from '../../../lib/launch-info';

export function HomeLocationSection() {
  return (
    <section id="location" className="map-section">
  <div className="section-inner">
    <div className="section-tag">Location</div>
    <h2>Shoreline Aquatics – Arrival Instructions</h2>
    <div className="location-grid">
      <div className="directions-card">
        <div className="location-address">
          <span className="address-pill">{LAUNCH_ADDRESS}</span>
          <a className="address-pill" href={LAUNCH_MAPS_URL} target="_blank" rel="noreferrer">Open in Maps</a>
        </div>
        <p>Use these arrival instructions when you're heading to the launch.</p>
        <div className="directions-list">
          {ARRIVAL_DIRECTIONS.map((step, index) => (
            <div className="direction-step" key={step}><div className="direction-index">{index + 1}</div><div className="direction-copy">{step}</div></div>
          ))}
        </div>
      </div>
      <div className="map-card">
        <div>
          <h3>Meet Us At The Launch</h3>
          <p>Use the map for the exact address, then follow the arrival instructions once you enter the park.</p>
        </div>
        <div className="map-embed">
          <iframe title="Shoreline Aquatics map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={LAUNCH_MAPS_EMBED_URL}>
          </iframe>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
