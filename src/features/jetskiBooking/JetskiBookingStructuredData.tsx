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
        "image": "https://slaquatics.com/assets/images/shoreline-jetski-group-collage.webp",
        "telephone": "+14696937164",
        "priceRange": "$$",
        "description": "Jet ski and boat rentals on Lake Lewisville with live availability, life jackets included, and a full safety orientation.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Point Vista Rd",
          "addressLocality": "Hickory Creek",
          "addressRegion": "TX",
          "postalCode": "75065",
          "addressCountry": "US"
        },
        "areaServed": [
          "Lewisville",
          "Denton",
          "Frisco",
          "Little Elm",
          "The Colony",
          "Corinth"
        ],
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "10:00",
            "closes": "20:00"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "550"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://slaquatics.com/jetski-booking/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Do I need a boating license?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No license is needed. Shoreline Aquatics gives every rider a full orientation and safety walkthrough before launch."
            }
          },
          {
            "@type": "Question",
            "name": "What is due today?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The booking step charges $55 today, which includes a $50 booking deposit and a $5 processing fee. The remaining balance is handled before launch."
            }
          },
          {
            "@type": "Question",
            "name": "Are life jackets included?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Life jackets, fuel, and the safety briefing are included with Shoreline rentals."
            }
          }
        ]
      }
    ]
  }
] as const satisfies readonly JsonLdValue[];

export function JetskiBookingStructuredData() {
  return <JsonLdStructuredData idPrefix="jetski-booking-jsonld" items={structuredData} />;
}
