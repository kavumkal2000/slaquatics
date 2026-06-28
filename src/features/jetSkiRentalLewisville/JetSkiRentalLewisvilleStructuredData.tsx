import { JsonLdStructuredData, type JsonLdValue } from '../JsonLdStructuredData';

const structuredData = [
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://slaquatics.com/#business",
        "name": "Shoreline Aquatics Jet Ski & Boat Rentals",
        "url": "https://slaquatics.com/",
        "telephone": "+14696937164",
        "image": "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3PgAS2jkeJsHjqRMEuF6/media/681d97126b471ca2569a5463.png",
        "priceRange": "$$",
        "areaServed": [
          "Lewisville",
          "Hickory Creek",
          "Denton",
          "Frisco"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "550"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://slaquatics.com/jet-ski-rental-lewisville/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Does Shoreline launch on Lake Lewisville?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Shoreline Aquatics launches from Hickory Creek on Lake Lewisville, which keeps the trip simple for Lewisville renters."
            }
          },
          {
            "@type": "Question",
            "name": "Can I see time slots before booking?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. The booking page shows live open start times before you move to the contact and waiver step."
            }
          },
          {
            "@type": "Question",
            "name": "How close is the launch to Lewisville?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "About a 10 to 15 minute drive for most Lewisville residents to the Hickory Creek launch at Point Vista Rd on Lake Lewisville."
            }
          },
          {
            "@type": "Question",
            "name": "What is the cancellation policy?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "To cancel or reschedule, call or text us as early as you can and we'll do our best to work with you. If weather or unsafe lake conditions force us to cancel, we'll refund you or set up another day."
            }
          }
        ]
      }
    ]
  }
] as const satisfies readonly JsonLdValue[];

export function JetSkiRentalLewisvilleStructuredData() {
  return <JsonLdStructuredData idPrefix="jet-ski-rental-lewisville-jsonld" items={structuredData} />;
}
