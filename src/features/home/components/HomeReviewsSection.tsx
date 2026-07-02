'use client';

const reviews = [
  {
    text: '"Best experience on the lake. We met them at the launch, they walked us through everything, and the jet skis were in perfect condition. Already planning our next trip."',
    initials: 'TJ',
    name: 'Taimoor J.',
    meta: 'DFW Area · Verified Customer',
    avatarStyle: { background: 'rgba(245,166,35,0.2)', color: 'var(--gold)' },
    source: 'Google Review',
  },
  {
    text: '"Rented for my birthday — 4 jet skis for our whole crew plus drone footage. Super friendly and professional. Highly recommend to anyone in DFW!"',
    initials: 'SJ',
    name: 'Shilpa J.',
    meta: 'Louisiana · Verified Customer',
    avatarStyle: { background: 'rgba(26,158,212,0.2)', color: '#7dd3fc' },
    source: 'Google Review',
  },
  {
    text: '"My kids had never been on jet skis and they were so patient walking everyone through it. Super organized, prices are unbeatable, and the whole process felt easy. 10/10!"',
    initials: 'MG',
    name: 'Marifer G.',
    meta: 'Florida · Verified Customer',
    avatarStyle: { background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' },
    source: 'Google Review',
  },
  {
    text: '"Booked the boat for our group and the captain was amazing. Drone video came out incredible — capturing everything from above. Already planning our return trip!"',
    initials: 'JJ',
    name: 'Jaylen J.',
    meta: 'Dallas, TX · Verified Customer',
    avatarStyle: { background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' },
    source: 'Google Review',
  },
  {
    text: '"Super easy to book, they showed up early and the equipment was spotless. Real Dallas locals who genuinely care. Had us set up in minutes."',
    initials: 'PB',
    name: 'Preston B.',
    meta: 'Central Texas · Verified Customer',
    avatarStyle: { background: 'rgba(245,166,35,0.2)', color: 'var(--gold)' },
    source: 'Google Review',
  },
  {
    text: '"Called last minute and they made it work. Everything promised was ready when we arrived and we had an absolute blast. My go-to recommendation for anyone in DFW."',
    initials: 'DW',
    name: 'Debra W.',
    meta: 'Cincinnati, OH · Verified Customer',
    avatarStyle: { background: 'rgba(239,68,68,0.2)', color: '#fca5a5' },
    source: 'Facebook Review',
    sourceDotStyle: { background: '#1877F2' },
  },
];

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
        {reviews.map((review) => (
          <div className="review-slide" key={review.name}><div className="review-card">
            <div className="review-stars"><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            <div className="review-text">{review.text}</div>
            <div className="review-author"><div className="review-avatar" style={review.avatarStyle}>{review.initials}</div><div><div className="review-name">{review.name}</div><div className="review-meta">{review.meta}</div></div></div>
            <div className="review-source"><div className="google-dot" style={review.sourceDotStyle} /> {review.source}</div>
          </div></div>
        ))}
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
