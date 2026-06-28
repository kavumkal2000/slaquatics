import { CityRentalPage } from './CityRentalPage';

type CityRentalCard = {
  heading: string;
  copy: string;
};

type CityRentalFaqItem = {
  question: string;
  answer: string;
};

type CityRentalLink = {
  label: string;
  href: string;
};

export type CityRentalContent = {
  eyebrow: string;
  heading: string;
  intro: string;
  pills: string[];
  smsHref: string;
  heroCards: CityRentalCard[];
  proofItems: CityRentalCard[];
  drive: CityRentalCard;
  pricingItems: CityRentalCard[];
  reviews: CityRentalCard;
  faq: {
    heading: string;
    items: CityRentalFaqItem[];
  };
  footerLinks: CityRentalLink[];
};

const sharedFaqItems: Omit<CityRentalFaqItem, 'answer'>[] = [
  { question: 'Do I need a boating license?' },
  { question: 'What’s the cancellation policy?' },
  { question: 'Can first-timers ride?' }
];

const sharedFaqAnswers = [
  'No — just a valid ID. Every renter gets a full safety briefing before launch.',
  "Call or text us as early as you can to cancel or reschedule and we'll do our best to work with you. If we cancel for weather, we'll refund you or set up another day.",
  'Yes. We walk every first-timer through everything, and life jackets are included on every rental.'
];

const sharedFaqTail = sharedFaqItems.map((item, index) => ({ ...item, answer: sharedFaqAnswers[index] }));

export const cityRentalPages = {
  denton: {
    eyebrow: 'Jet ski rental near Denton',
    heading: 'Denton Riders Can Book Lake Lewisville Fast',
    intro: 'Shoreline Aquatics is a go-to option for Denton groups who want a clean, simple lake day without guessing on availability. See live start times, lock in the $50 deposit, and handle the contact + waiver step right after you choose the slot.',
    pills: ['No license needed', 'Life jackets included'],
    smsHref: 'sms:14696937164?&body=Hey%20Shoreline%20Aquatics%2C%20I%27m%20coming%20from%20Denton%20and%20need%20help%20booking.',
    heroCards: [
      {
        heading: 'Why Denton renters book here',
        copy: 'Live availability up front, launch access at Lake Lewisville, and a first-timer-friendly check-in flow make this an easier sell for weekend groups.'
      },
      {
        heading: 'How it works',
        copy: 'Pick the date, see open time slots, save the booking, then finish contact info, waiver, and checkout. Shoreline handles the launch briefing on-site.'
      }
    ],
    proofItems: [
      { heading: 'Live time slots', copy: 'See open start times before you fill out rider details.' },
      { heading: 'First-timer ready', copy: 'Orientation, fuel, and life jackets are included in the launch flow.' },
      { heading: 'Real local proof', copy: 'Use the booking page to open Shoreline’s live Google reviews before you commit.' }
    ],
    drive: {
      heading: 'The drive from Denton',
      copy: 'From downtown Denton or UNT, Lake Lewisville is a short ~20–25 minute drive south down I-35E to the Hickory Creek launch at Point Vista Rd. It’s the closest open-water jet ski option for most Denton groups — no trailering, no boat ramp hassle, just show up and ride.'
    },
    pricingItems: [
      { heading: '2–4 Yamaha jet skis', copy: 'From $59/hr per ski on full-day blocks. Pick 2, 3, or 4 for your group.' },
      { heading: 'Captained pontoon', copy: '$160/hr for up to 14 guests — great for mixed groups and birthdays.' },
      { heading: 'Always included', copy: 'Life jackets, fuel, a cooler, and a full safety orientation before launch.' }
    ],
    reviews: {
      heading: 'Rated 5 stars by DFW riders',
      copy: 'Denton, Lewisville, Frisco, and Little Elm groups consistently rate Shoreline 5 stars for an easy launch and a friendly first-timer experience.'
    },
    faq: {
      heading: 'Denton jet ski rental FAQ',
      items: [
        { question: 'How far is it from Denton?', answer: 'About 20–25 minutes south to the Hickory Creek launch on Lake Lewisville.' },
        ...sharedFaqTail
      ]
    },
    footerLinks: [
      { label: 'Home', href: '/' },
      { label: 'Lewisville', href: '/jet-ski-rental-lewisville/' },
      { label: 'Frisco', href: '/jet-ski-rental-frisco/' }
    ]
  },
  frisco: {
    eyebrow: 'Jet ski rental near Frisco',
    heading: 'Frisco Groups Need Proof, Speed, and Mobile-Friendly Booking',
    intro: 'Shoreline Aquatics is built for that. The live booking page shows open start times first, gives first-time renters reassurance, and keeps the next step simple with contact, waiver, and deposit checkout in one flow.',
    pills: ['Live slot visibility', 'Tap-to-text support'],
    smsHref: 'sms:14696937164?&body=Hey%20Shoreline%20Aquatics%2C%20I%27m%20coming%20from%20Frisco%20and%20need%20help%20booking.',
    heroCards: [
      {
        heading: 'Why this converts better',
        copy: 'Renters from Frisco can see open start times before they commit, which removes doubt and creates a more confident next step.'
      },
      {
        heading: 'What’s included',
        copy: 'No license needed, full orientation, life jackets included, and a clean lake-day handoff at launch.'
      }
    ],
    proofItems: [
      { heading: 'Natural urgency', copy: 'Open slot visibility helps the renter feel the real schedule without pressure-heavy copy.' },
      { heading: 'Mobile first', copy: 'The booking flow is built for thumb reach, quick decisions, and fast texts from the lake.' },
      { heading: 'Seasonal remarketing', copy: 'The updated booking site now captures off-season leads for future Frisco-area promos too.' }
    ],
    drive: {
      heading: 'The drive from Frisco',
      copy: 'From The Star or downtown Frisco, the Hickory Creek launch on Lake Lewisville is roughly a 30–35 minute drive west via SH-121 and I-35E to Point Vista Rd. It’s the easiest open-water jet ski day for Frisco groups — skip the long haul to a busier lake and ride closer to home.'
    },
    pricingItems: [
      { heading: '2–4 Yamaha jet skis', copy: 'From $59/hr per ski on full-day blocks. Pick 2, 3, or 4 for your group.' },
      { heading: 'Captained pontoon', copy: '$160/hr for up to 14 guests — ideal for Frisco birthday and corporate groups.' },
      { heading: 'Always included', copy: 'Life jackets, fuel, a cooler, and a full safety orientation before launch.' }
    ],
    reviews: {
      heading: 'Rated 5 stars by DFW riders',
      copy: 'Frisco, Plano, Lewisville, and Denton groups consistently rate Shoreline 5 stars for an easy launch and a friendly first-timer experience.'
    },
    faq: {
      heading: 'Frisco jet ski rental FAQ',
      items: [
        { question: 'How far is it from Frisco?', answer: 'Roughly 30–35 minutes west to the Hickory Creek launch on Lake Lewisville.' },
        ...sharedFaqTail
      ]
    },
    footerLinks: [
      { label: 'Home', href: '/' },
      { label: 'Lewisville', href: '/jet-ski-rental-lewisville/' },
      { label: 'Denton', href: '/jet-ski-rental-denton/' }
    ]
  },
  lewisville: {
    eyebrow: 'Jet ski rental near Lewisville',
    heading: 'Lewisville Bookings Should Feel Easy, Not Confusing',
    intro: 'Shoreline Aquatics is already on Lake Lewisville, so renters from Lewisville can move fast: check live slots, save the booking, then finish the contact + waiver flow in the next step.',
    pills: ['Live availability', 'No license needed'],
    smsHref: 'sms:14696937164?&body=Hey%20Shoreline%20Aquatics%2C%20I%27m%20coming%20from%20Lewisville%20and%20need%20help%20booking.',
    heroCards: [
      {
        heading: 'Best fit for nearby lake days',
        copy: 'Because Shoreline launches at Lake Lewisville, this is a strong option for locals who want less guesswork and a faster path to the water.'
      },
      {
        heading: 'Built for first-timers',
        copy: 'Orientation, life jackets, and the on-site walkthrough are all part of the rental experience.'
      }
    ],
    proofItems: [
      { heading: 'Time slots first', copy: 'See what is open before you bother with contact details.' },
      { heading: 'Text-friendly', copy: 'Lewisville renters can tap-to-text Shoreline instead of waiting on a callback.' },
      { heading: 'Proof that converts', copy: 'The booking page now links to live Google reviews instead of leaning only on static testimonials.' }
    ],
    drive: {
      heading: 'Right on Lake Lewisville',
      copy: 'Shoreline launches from the Hickory Creek side of Lake Lewisville at Point Vista Rd — about a 10–15 minute drive for most Lewisville residents. It’s the closest jet ski rental to home, so you spend the day on the water instead of towing a trailer across the metroplex.'
    },
    pricingItems: [
      { heading: '2–4 Yamaha jet skis', copy: 'From $59/hr per ski on full-day blocks. Pick 2, 3, or 4 for your group.' },
      { heading: 'Captained pontoon', copy: '$160/hr for up to 14 guests — perfect for a quick local lake day.' },
      { heading: 'Always included', copy: 'Life jackets, fuel, a cooler, and a full safety orientation before launch.' }
    ],
    reviews: {
      heading: 'Rated 5 stars by Lake Lewisville riders',
      copy: 'Lewisville, Flower Mound, The Colony, and Highland Village groups consistently rate Shoreline 5 stars for an easy launch and a friendly first-timer experience.'
    },
    faq: {
      heading: 'Lewisville jet ski rental FAQ',
      items: [
        { question: 'How close is the launch?', answer: 'About 10–15 minutes for most Lewisville residents, at the Hickory Creek launch on Lake Lewisville.' },
        ...sharedFaqTail
      ]
    },
    footerLinks: [
      { label: 'Home', href: '/' },
      { label: 'Denton', href: '/jet-ski-rental-denton/' },
      { label: 'Frisco', href: '/jet-ski-rental-frisco/' }
    ]
  }
} as const satisfies Record<string, CityRentalContent>;

export { CityRentalPage };
