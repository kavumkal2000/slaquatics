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
        "image": "https://slaquatics.com/assets/images/shoreline-jetski-group-collage.webp",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Point Vista Rd",
          "addressLocality": "Hickory Creek",
          "addressRegion": "TX",
          "postalCode": "75065",
          "addressCountry": "US"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "10:00",
            "closes": "20:00"
          }
        ],
        "areaServed": [
          "Denton",
          "Lewisville",
          "Frisco",
          "Little Elm",
          "The Colony"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "550"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://slaquatics.com/jet-ski-rental-denton/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How far is Shoreline Aquatics from Denton?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Shoreline Aquatics launches from Lake Lewisville in Hickory Creek, a straightforward drive from Denton for lake-day renters."
            }
          },
          {
            "@type": "Question",
            "name": "Do first-time riders need experience?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. First-time renters get a full orientation, safety briefing, and life jackets before launch."
            }
          },
          {
            "@type": "Question",
            "name": "Do I need a boating license to rent a jet ski near Denton?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No boating license is required — just a valid ID. Every renter gets a full safety briefing before launch."
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

export function JetSkiRentalDentonStructuredData() {
  return <JsonLdStructuredData idPrefix="jet-ski-rental-denton-jsonld" items={structuredData} />;
}
