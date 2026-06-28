'use client';

export function HomeWhySection() {
  return (
    <section className="why-section">
  <div className="section-inner">
    <div className="why-hero">
      <div className="section-tag">Why Choose Us</div>
      <h2 className="why-title">Why Choose Us?</h2>
      <p className="why-subtitle">Straight pricing, clean equipment, and a smooth Lake Lewisville launch.</p>
    </div>
    <div className="why-grid">
      <div className="why-item">
        <div className="why-item-top">
          <span className="why-item-index">01</span>
          <div className="why-icon-badge" aria-hidden="true">
            <svg className="why-icon-svg" viewBox="0 0 48 48">
              <rect x={9} y={11} width={30} height={18} rx={3} />
              <circle cx={24} cy={20} r={4} />
              <path d="M13 15h5M30 25h5M8 33h13l4-4h15" />
              <path d="M8 39h10c4 0 6-1 8.5-3.2L31 33h9" />
            </svg>
          </div>
        </div>
        <h3>Great Value</h3>
        <p>Clear pricing with stronger hourly value on the longer rentals.</p>
      </div>
      <div className="why-item">
        <div className="why-item-top">
          <span className="why-item-index">02</span>
          <div className="why-icon-badge" aria-hidden="true">
            <svg className="why-icon-svg" viewBox="0 0 48 48">
              <circle cx={24} cy={24} r={14} />
              <path d="M10 24h28M24 10a21 21 0 0 1 0 28M24 10a21 21 0 0 0 0 28M15 17c2.8 1.6 9.2 1.6 18 0M15 31c2.8-1.6 9.2-1.6 18 0" />
            </svg>
          </div>
        </div>
        <h3>Lake Lewisville Launch</h3>
        <p>Meet Shoreline at the launch and get on the water without a confusing handoff.</p>
      </div>
      <div className="why-item">
        <div className="why-item-top">
          <span className="why-item-index">03</span>
          <div className="why-icon-badge" aria-hidden="true">
            <svg className="why-icon-svg" viewBox="0 0 48 48">
              <path d="M16 21v-8a4 4 0 0 1 8 0v8" />
              <path d="M16 21H10v16h22c2.1 0 3.9-1.5 4.2-3.6l1.5-9.2A3.5 3.5 0 0 0 34.2 20H24" />
              <path d="M10 21v16" />
            </svg>
          </div>
        </div>
        <h3>What’s Included</h3>
        <p>Life jackets, fuel, captain on boat rentals, and a simple safety walkthrough.</p>
      </div>
      <div className="why-item">
        <div className="why-item-top">
          <span className="why-item-index">04</span>
          <div className="why-icon-badge" aria-hidden="true">
            <svg className="why-icon-svg" viewBox="0 0 48 48">
              <circle cx={24} cy={18} r={7} />
              <path d="M12 37c2.8-6.4 20.8-6.4 24 0" />
              <path d="M10 30l1.3 2.7 3 .4-2.1 2 0.5 2.9-2.7-1.5-2.7 1.5 0.5-2.9-2.1-2 3-.4z" />
              <path d="M38 30l1.3 2.7 3 .4-2.1 2 0.5 2.9-2.7-1.5-2.7 1.5 0.5-2.9-2.1-2 3-.4z" />
            </svg>
          </div>
        </div>
        <h3>Easy Repeat Booking</h3>
        <p>Saved rider info and a clean follow-up process make the next booking faster.</p>
      </div>
    </div>
  </div>
</section>
  );
}
