import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Shoreline Aquatics Jet Ski & Boat Rentals',
  image: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/681d97126b471ca2569a5463.png',
  '@id': 'https://slaquatics.com',
  url: 'https://slaquatics.com',
  telephone: '+14696937164',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Point Vista Rd',
    addressLocality: 'Hickory Creek',
    addressRegion: 'TX',
    postalCode: '75065',
    addressCountry: 'US'
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '10:00',
      closes: '20:00'
    }
  ],
  priceRange: '$$',
  geo: { '@type': 'GeoCoordinates', latitude: 33.1112, longitude: -97.0386 },
  areaServed: [
    { '@type': 'City', name: 'Lewisville' },
    { '@type': 'City', name: 'Denton' },
    { '@type': 'City', name: 'Frisco' },
    { '@type': 'City', name: 'Flower Mound' },
    { '@type': 'City', name: 'Hickory Creek' },
    { '@type': 'AdministrativeArea', name: 'Dallas–Fort Worth Metroplex' }
  ],
  sameAs: [
    'https://www.instagram.com/shorelineaquatic/',
    'https://www.facebook.com/slaquatic/'
  ],
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '5.0', reviewCount: '550', bestRating: '5' },
  description: 'Jet ski and boat rentals at Lake Lewisville, TX.'
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'How does payment work?', acceptedAnswer: { '@type': 'Answer', text: '$55 is due today to book. That includes a $50 booking deposit and a $5 processing fee. The remaining balance is due before launch, plus a $200 refundable damage deposit per jet ski.' } },
    { '@type': 'Question', name: 'What is your cancellation policy?', acceptedAnswer: { '@type': 'Answer', text: "Need to cancel or reschedule? Call or text us as early as you can and we'll do our best to work with you. If we ever have to cancel for weather or unsafe lake conditions, we'll refund you or set up another day." } },
    { '@type': 'Question', name: 'Do I need a license?', acceptedAnswer: { '@type': 'Answer', text: "No license required — just a valid ID. We'll walk you through a full safety and operating briefing before you head out." } },
    { '@type': 'Question', name: "I've never ridden a jet ski before. Is that OK?", acceptedAnswer: { '@type': 'Answer', text: "Absolutely. We walk every first-timer through everything before we leave. And if questions come up on the water, just call — we're on standby." } },
    { '@type': 'Question', name: 'Are life jackets included?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, always. Life jackets are included with every single rental — safety is non-negotiable for us.' } },
    { '@type': 'Question', name: 'Are you licensed and insured?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — fully licensed and insured. Happy to provide proof anytime, just ask.' } },
    { '@type': 'Question', name: 'Do you offer deals or discounts?', acceptedAnswer: { '@type': 'Answer', text: "We have the best rates in the area and we'll price match if you find better. The Full Day Bundle is the best value, and return customers always get a discount." } },
    { '@type': 'Question', name: 'Do you offer aerial drone coverage?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Aerial drone coverage is available as an add-on for $50 — a highlight video of your day on the water.' } }
  ]
};

const structuredData = [localBusinessJsonLd, faqJsonLd] as const satisfies readonly JsonLdValue[];

export function HomeStructuredData() {
  return <JsonLdStructuredData idPrefix="home-jsonld" items={structuredData} />;
}
