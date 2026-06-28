'use client';

export function HomeHowSection() {
  return (
    <section className="how-section">
  <div className="section-inner">
    <div className="how-shell">
      <div className="how-head">
        <div className="how-title-wrap">
          <div className="how-title">How It Works</div>
        </div>
        <div className="how-intro">Five quick steps from picking the rental to showing up ready for the water.</div>
      </div>
      <div className="how-grid">
        <div className="how-step">
          <div className="how-step-num">1</div>
          <div className="how-step-icon" aria-hidden="true">
            <svg className="how-step-svg" viewBox="0 0 48 48">
              <path d="M7 30c8-10 26-10 34 0" />
              <path d="M10 34h28" />
              <path d="M14 26l6-7 5 4 9-11" />
            </svg>
          </div>
          <h3>Pick Your Ride</h3>
          <p>Jet skis, the boat, or both — whatever fits your group.</p>
          <div className="how-arrow">↓</div>
        </div>
        <div className="how-step">
          <div className="how-step-num">2</div>
          <div className="how-step-icon" aria-hidden="true">
            <svg className="how-step-svg" viewBox="0 0 48 48">
              <rect x={8} y={10} width={32} height={28} rx={5} />
              <path d="M15 8v8M33 8v8M8 19h32" />
              <path d="M16 27h6M26 27h6M16 33h6" />
            </svg>
          </div>
          <h3>Pick Your Date &amp; Time</h3>
          <p>Choose the day and start time that works best for your group.</p>
          <div className="how-arrow">↓</div>
        </div>
        <div className="how-step">
          <div className="how-step-num">3</div>
          <div className="how-step-icon" aria-hidden="true">
            <svg className="how-step-svg" viewBox="0 0 48 48">
              <path d="M12 16h24" />
              <path d="M12 24h24" />
              <path d="M12 32h14" />
              <path d="M32 29l3 3 7-8" />
            </svg>
          </div>
          <h3>Add Extras</h3>
          <p>Add aerial drone coverage if you want a highlight video from the day.</p>
          <div className="how-arrow">↓</div>
        </div>
        <div className="how-step">
          <div className="how-step-num">4</div>
          <div className="how-step-icon" aria-hidden="true">
            <svg className="how-step-svg" viewBox="0 0 48 48">
              <path d="M10 33c0-7 5-12 12-12s12 5 12 12" />
              <circle cx={22} cy={16} r={6} />
              <path d="M34 17l4 4 6-8" />
            </svg>
          </div>
          <h3>Finish Contact + Waiver</h3>
          <p>Complete the rider form, sign the waiver, and pay the booking deposit.</p>
          <div className="how-arrow">↓</div>
        </div>
        <div className="how-step">
          <div className="how-step-num">5</div>
          <div className="how-step-icon" aria-hidden="true">
            <svg className="how-step-svg" viewBox="0 0 48 48">
              <path d="M10 14h28v20H10z" />
              <path d="M18 21l6 4 6-4" />
              <path d="M17 33h14" />
            </svg>
          </div>
          <h3>Show Up &amp; Ride</h3>
          <p>Follow the directions, check in fast, and get on the water.</p>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
