import type { CityRentalContent } from './cityRentalContent';

type CityRentalPageProps = {
  content: CityRentalContent;
};

export function CityRentalPage({ content }: CityRentalPageProps) {
  return (
    <div className="shell">
      <div className="card hero">
        <div>
          <div className="eyebrow">{content.eyebrow}</div>
          <h1>{content.heading}</h1>
          <p>{content.intro}</p>
          <div className="pill-row">
            {content.pills.map((pill) => <span className="pill" key={pill}>{pill}</span>)}
          </div>
          <div className="cta-row">
            <a className="btn btn-primary" href="/jetski-booking/">Book now</a>
            <a className="btn btn-ghost" href={content.smsHref}>Text us</a>
          </div>
        </div>
        <div className="stack">
          {content.heroCards.map((card) => (
            <div className="card mini" key={card.heading}>
              <h2>{card.heading}</h2>
              <p>{card.copy}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid">
        {content.proofItems.map((item) => (
          <div className="item" key={item.heading}><strong>{item.heading}</strong><span>{item.copy}</span></div>
        ))}
      </div>
      <div className="card mini" style={{ marginTop: 24 }}>
        <h2>{content.drive.heading}</h2>
        <p>{content.drive.copy}</p>
      </div>
      <div className="card mini" style={{ marginTop: 16 }}>
        <h2>Pricing &amp; what’s included</h2>
        <div className="grid" style={{ marginTop: 16 }}>
          {content.pricingItems.map((item) => (
            <div className="item" key={item.heading}><strong>{item.heading}</strong><span>{item.copy}</span></div>
          ))}
        </div>
        <div className="cta-row">
          <a className="btn btn-primary" href="/jetski-booking/">Check live availability</a>
          <a className="btn btn-ghost" href="tel:14696937164">Call (469) 693-7164</a>
        </div>
      </div>
      <div className="card mini" style={{ marginTop: 16, textAlign: 'center' }}>
        <div className="eyebrow">★★★★★ 5.0 · 550+ riders</div>
        <h2>{content.reviews.heading}</h2>
        <p>{content.reviews.copy}</p>
        <a className="btn btn-ghost" href="https://www.google.com/search?q=Shoreline+Aquatics+Lake+Lewisville" target="_blank" rel="noopener">Read Google reviews</a>
      </div>
      <div className="card mini" style={{ marginTop: 16 }}>
        <h2>{content.faq.heading}</h2>
        <div className="stack" style={{ marginTop: 14 }}>
          {content.faq.items.map((item) => (
            <p key={item.question}><strong>{item.question}</strong> {item.answer}</p>
          ))}
        </div>
      </div>
      <footer className="card mini" style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '14px 28px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ fontFamily: '"Bebas Neue",cursive', fontSize: '1.3rem', letterSpacing: '.04em' }}>Shoreline Aquatics</strong>
          <p style={{ margin: '4px 0 0', fontSize: '.86rem' }}>Point Vista Rd, Hickory Creek, TX · Mon–Sun 10 AM–8 PM · <a href="tel:14696937164" style={{ color: '#f5a623' }}>(469) 693-7164</a></p>
        </div>
        <div className="cta-row" style={{ margin: 0 }}>
          {content.footerLinks.map((link) => (
            <a className="btn btn-ghost" href={link.href} key={link.href}>{link.label}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
