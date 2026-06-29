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
            <div className="review-text">Read recent customer feedback directly on Shoreline Aquatics review profiles.</div>
            <div className="review-source"><div className="google-dot" /> Live review links</div>
          </div></div>
      </div>
    </div>
    <div className="reviews-controls">
      <div className="reviews-hint">Open the live review profiles before you book.</div>
      <div className="reviews-nav">
        <a className="btn-primary" href="https://www.google.com/search?q=Shoreline+Aquatics+Lake+Lewisville" target="_blank" rel="noopener">Google Reviews</a>
        <a className="btn-ghost" href="https://www.facebook.com/slaquatic/" target="_blank" rel="noopener">Facebook</a>
      </div>
    </div>
  </div>
</section>
  );
}
