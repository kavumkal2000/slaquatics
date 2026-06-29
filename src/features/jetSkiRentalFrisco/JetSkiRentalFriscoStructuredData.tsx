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
          "Frisco",
          "Lewisville",
          "The Colony",
          "Little Elm",
          "Denton"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "550"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://slaquatics.com/jet-ski-rental-frisco/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is this a good option for Frisco groups?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Shoreline Aquatics serves Frisco-area riders who want a Lake Lewisville rental with live availability and a straightforward mobile booking flow."
            }
          },
          {
            "@type": "Question",
            "name": "What is included with the rental?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Life jackets, fuel, and the full safety orientation are included."
            }
          },
          {
            "@type": "Question",
            "name": "How far is Lake Lewisville from Frisco?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Roughly a 30 to 35 minute drive west via SH-121 and I-35E to the Hickory Creek launch at Point Vista Rd."
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

export function JetSkiRentalFriscoStructuredData() {
  return <JsonLdStructuredData idPrefix="jet-ski-rental-frisco-jsonld" items={structuredData} />;
}
