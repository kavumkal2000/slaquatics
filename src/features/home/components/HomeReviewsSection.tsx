'use client';


export function HomeReviewsSection() {
  return (
    <section id="reviews">
  <div className="section-inner">
    <div className="section-tag">Customer Reviews</div>
    <h2>What People Are Saying</h2>
    <div className="reviews-summary">
      <div className="summary-score">5.0</div>
      <div className="summary-right">
        <div className="summary-stars"><span className="summary-star">★</span><span className="summary-star">★</span><span className="summary-star">★</span><span className="summary-star">★</span><span className="summary-star">★</span></div>
        <div className="summary-count">Based on Google &amp; Facebook reviews · 550+ customers</div>
      </div>
      <div className="summary-divider" />
      <div className="summary-badge">Lake Lewisville · Hickory Creek launch</div>
    </div>
    <div className="reviews-carousel">
      <div className="reviews-track" id="reviews-track">
        <div className="review-slide"><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">"Best experience on the lake. We met them at the launch, they walked us through everything, and the jet skis were in perfect condition. Already planning our next trip."</div>
            <div className="review-author"><div className="review-avatar" style={{background: 'rgba(245,166,35,0.2)', color: 'var(--gold)'}}>TJ</div><div><div className="review-name">Taimoor J.</div><div className="review-meta">DFW Area · Verified Customer</div></div></div>
            <div className="review-source"><div className="google-dot" /> Google Review</div>
          </div></div>
        <div className="review-slide"><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">"Rented for my birthday — 4 jet skis for our whole crew plus drone footage. Super friendly and professional. Highly recommend to anyone in DFW!"</div>
            <div className="review-author"><div className="review-avatar" style={{background: 'rgba(26,158,212,0.2)', color: '#7dd3fc'}}>SJ</div><div><div className="review-name">Shilpa J.</div><div className="review-meta">Louisiana · Verified Customer</div></div></div>
            <div className="review-source"><div className="google-dot" /> Google Review</div>
          </div></div>
        <div className="review-slide"><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">"My kids had never been on jet skis and they were so patient walking everyone through it. Super organized, prices are unbeatable, and the whole process felt easy. 10/10!"</div>
            <div className="review-author"><div className="review-avatar" style={{background: 'rgba(16,185,129,0.2)', color: '#6ee7b7'}}>MG</div><div><div className="review-name">Marifer G.</div><div className="review-meta">Florida · Verified Customer</div></div></div>
            <div className="review-source"><div className="google-dot" /> Google Review</div>
          </div></div>
        <div className="review-slide"><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">"Booked the boat for our group and the captain was amazing. Drone video came out incredible — capturing everything from above. Already planning our return trip!"</div>
            <div className="review-author"><div className="review-avatar" style={{background: 'rgba(139,92,246,0.2)', color: '#c4b5fd'}}>JJ</div><div><div className="review-name">Jaylen J.</div><div className="review-meta">Dallas, TX · Verified Customer</div></div></div>
            <div className="review-source"><div className="google-dot" /> Google Review</div>
          </div></div>
        <div className="review-slide"><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">"Super easy to book, they showed up early and the equipment was spotless. Real Dallas locals who genuinely care. Had us set up in minutes."</div>
            <div className="review-author"><div className="review-avatar" style={{background: 'rgba(245,166,35,0.2)', color: 'var(--gold)'}}>PB</div><div><div className="review-name">Preston B.</div><div className="review-meta">Central Texas · Verified Customer</div></div></div>
            <div className="review-source"><div className="google-dot" /> Google Review</div>
          </div></div>
        <div className="review-slide"><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">"Called last minute and they made it work. Everything promised was ready when we arrived and we had an absolute blast. My go-to recommendation for anyone in DFW."</div>
            <div className="review-author"><div className="review-avatar" style={{background: 'rgba(239,68,68,0.2)', color: '#fca5a5'}}>DW</div><div><div className="review-name">Debra W.</div><div className="review-meta">Cincinnati, OH · Verified Customer</div></div></div>
            <div className="review-source"><div className="google-dot" style={{background: '#1877F2'}} /> Facebook Review</div>
          </div></div>
      </div>
    </div>
    <div className="reviews-controls">
      <div className="reviews-hint">Swipe or tap through more customer reviews.</div>
      <div className="reviews-nav">
        <button className="reviews-btn" type="button" aria-label="Previous review">←</button>
        <div className="reviews-dots" id="reviews-dots" />
        <button className="reviews-btn" type="button" aria-label="Next review">→</button>
      </div>
    </div>
  </div>
</section>
  );
}
