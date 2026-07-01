import { createCmsSiteConfig, type CmsContent, type CmsFieldSchema } from '../cms/core.ts';
import { createDefaultCmsContent } from '../cms/default-content.ts';
import { ARRIVAL_DIRECTIONS, LAUNCH_ADDRESS, LAUNCH_ADDRESS_LINES, LAUNCH_HOURS, LAUNCH_MAPS_EMBED_URL, LAUNCH_MAPS_URL } from '../launch-info.ts';
import { getCmsStore, type CmsStore } from '../cms/storage.ts';
import { mediaUrl } from '../media.ts';

const buttonVariantOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'link', label: 'Link' }
];

const activeStyleSettingsSlug = 'shoreline-theme';
const allowedThemeStyleTokens = ['gold', 'blue', 'green', 'ink'] as const;
const publicContentTypes: CmsContent['contentType'][] = ['page', 'blogPost', 'productList', 'reusableSection', 'pattern'];

const sharedFieldSchema: Record<string, CmsFieldSchema> = {
  body: { control: 'textarea' },
  copy: { control: 'textarea' },
  summary: { control: 'textarea' },
  description: { control: 'textarea' },
  caption: { control: 'textarea' },
  answer: { control: 'textarea' },
  note: { control: 'textarea' },
  address: { control: 'textarea' },
  excerpt: { control: 'textarea' },
  helpText: { control: 'textarea' },
  href: { control: 'url' },
  bookingHref: { control: 'url' },
  bookingPath: { control: 'url' },
  mapsUrl: { control: 'url' },
  mapEmbedUrl: { control: 'url' },
  sourceUrl: { control: 'url' },
  canonicalHref: { control: 'url' },
  smsPrefill: { control: 'url' },
  src: { control: 'media', mediaValue: 'url' },
  poster: { control: 'media', mediaValue: 'url' },
  image: { control: 'media', mediaValue: 'url' },
  assetId: { control: 'media', mediaValue: 'id' },
  featuredImage: { control: 'media', mediaValue: 'url' },
  socialImage: { control: 'media', mediaValue: 'url' },
  media: { control: 'object', fields: ['src', 'alt', 'caption'] },
  logo: { control: 'object', fields: ['src', 'alt'] },
  buttons: { control: 'collection', itemFields: ['label', 'href', 'variant', 'image'] },
  links: { control: 'collection', itemFields: ['label', 'href'] },
  menuItems: { control: 'collection', itemFields: ['label', 'href', 'children'] },
  images: { control: 'collection', itemFields: ['src', 'alt', 'caption'] },
  products: { control: 'collection', itemFields: ['productKey', 'label', 'displayName', 'displayPrice', 'amountCents', 'currency', 'kind', 'stripeProductId', 'stripePriceId', 'stripeLookupKey', 'metadataTemplate', 'checkoutMode', 'checkoutRole', 'required', 'active', 'displayOnly', 'sortOrder'] },
  rates: { control: 'collection', itemFields: ['craftKey', 'durationHours', 'baseRateCents', 'totalCents', 'depositCents', 'processingFeeCents', 'damageDepositCents', 'includedItems', 'bookingQueryParams'] },
  seasonalOverrides: { control: 'collection', itemFields: ['offerKey', 'startsAt', 'endsAt', 'eligibleDates', 'eligibleCraft', 'allowedDurations', 'headline', 'body', 'ctaHrefTemplate', 'priority', 'status'] },
  addons: { control: 'collection', itemFields: ['addonKey', 'id', 'label', 'description', 'priceCents', 'priceLabel', 'appliesToCraft', 'requiresDurationMin', 'inventoryLimited', 'checkoutLineItemKey', 'image'] },
  checkboxes: { control: 'collection', itemFields: ['id', 'label', 'required'] },
  signatureFields: { control: 'collection', itemFields: ['id', 'label', 'required'] },
  localFaq: { control: 'collection', itemFields: ['question', 'answer'] },
  policies: { control: 'collection', itemFields: ['policyKey', 'title', 'summary', 'body', 'severity', 'appliesTo', 'refundEligible', 'customerAction', 'effectiveDate'] },
  nearbyCities: { control: 'stringList' },
  proofItems: { control: 'stringList' },
  eligibleDates: { control: 'stringList' },
  eligibleCraft: { control: 'stringList' },
  allowedDurations: { control: 'stringList' },
  appliesToCraft: { control: 'stringList' },
  includedItems: { control: 'stringList' },
  legalItems: { control: 'stringList' },
  tabs: { control: 'collection', itemFields: ['id', 'label', 'active', 'sections', 'includes', 'submitLabel', 'note'] },
  sections: { control: 'collection', itemFields: ['label', 'groupId', 'dataKey', 'options'] },
  options: { control: 'collection', itemFields: ['value', 'label', 'subLabel', 'selected'] },
  variant: { control: 'select', options: buttonVariantOptions },
  checkoutMode: {
    control: 'select',
    options: [
      { value: 'deposit', label: 'Deposit' },
      { value: 'fullPayment', label: 'Full payment' },
      { value: 'displayOnly', label: 'Display only' }
    ]
  },
  mode: {
    control: 'select',
    options: [
      { value: 'booking', label: 'Booking' },
      { value: 'waiver', label: 'Waiver' },
      { value: 'payment', label: 'Payment' }
    ]
  },
  spacing: {
    control: 'select',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' }
    ]
  },
  style: {
    control: 'select',
    options: [
      { value: 'divider', label: 'Divider' },
      { value: 'spacer', label: 'Spacer' }
    ]
  },
  active: { control: 'boolean' },
  required: { control: 'boolean' },
  displayOnly: { control: 'boolean' },
  inventoryLimited: { control: 'boolean' },
  refundEligible: { control: 'boolean' },
  selected: { control: 'boolean' },
  verified: { control: 'boolean' },
  editableAmounts: { control: 'boolean' },
  sortOrder: { control: 'number', step: 1 },
  priority: { control: 'number', step: 1 },
  amountCents: { control: 'number', min: 0, step: 1 },
  baseRateCents: { control: 'number', min: 0, step: 1 },
  totalCents: { control: 'number', min: 0, step: 1 },
  depositCents: { control: 'number', min: 0, step: 1 },
  processingFeeCents: { control: 'number', min: 0, step: 1 },
  damageDepositCents: { control: 'number', min: 0, step: 1 },
  priceCents: { control: 'number', min: 0, step: 1 },
  requiresDurationMin: { control: 'number', min: 0, step: 1 },
  hours: { control: 'number', min: 0, step: 0.5 },
  durationHours: { control: 'number', min: 0, step: 0.5 },
  rating: { control: 'number', min: 0, max: 5, step: 0.1 },
  score: { control: 'number', min: 0, max: 5, step: 0.1 }
};

function blockSchema(fields: string[], overrides: Record<string, CmsFieldSchema> = {}): Record<string, CmsFieldSchema> {
  return Object.fromEntries(
    fields
      .map((field) => [field, overrides[field] || sharedFieldSchema[field]])
      .filter((entry): entry is [string, CmsFieldSchema] => Boolean(entry[1]))
  );
}

export const cmsSlaquaticsSiteConfig = createCmsSiteConfig({
  siteId: 'slaquatics',
  theme: {
    buttonVariants: ['primary', 'secondary', 'link'],
    imageRatios: ['16:9', '4:3', '1:1', '3:4'],
    colorTokens: ['gold', 'blue', 'green', 'ink']
  },
  blocks: [
    { type: 'hero', label: 'Hero', category: 'design', fields: ['eyebrow', 'heading', 'copy', 'buttons', 'media'], fieldSchema: blockSchema(['copy', 'buttons', 'media']) },
    { type: 'rich-text', label: 'Rich Text', category: 'text', fields: ['heading', 'body'], fieldSchema: blockSchema(['body']) },
    { type: 'heading', label: 'Heading', category: 'text', fields: ['eyebrow', 'heading', 'subheading'] },
    { type: 'list', label: 'List', category: 'text', fields: ['heading', 'items'] },
    { type: 'quote', label: 'Quote', category: 'text', fields: ['quote', 'attribution'] },
    { type: 'table', label: 'Table', category: 'text', fields: ['heading', 'rows'] },
    { type: 'button-group', label: 'Buttons', category: 'design', fields: ['buttons'], fieldSchema: blockSchema(['buttons']) },
    { type: 'image', label: 'Image', category: 'media', fields: ['assetId', 'src', 'alt', 'caption', 'crop', 'focalPoint'], fieldSchema: blockSchema(['assetId', 'src', 'caption']) },
    { type: 'gallery', label: 'Gallery', category: 'media', fields: ['images'], fieldSchema: blockSchema(['images']) },
    { type: 'carousel', label: 'Carousel', category: 'media', fields: ['images'], fieldSchema: blockSchema(['images']) },
    { type: 'video', label: 'Video', category: 'media', fields: ['src', 'poster', 'caption'], fieldSchema: blockSchema(['src', 'poster', 'caption']) },
    { type: 'embed', label: 'Embed', category: 'media', fields: ['provider', 'src', 'caption'], fieldSchema: blockSchema(['src', 'caption']) },
    { type: 'columns', label: 'Columns', category: 'design', fields: ['items'] },
    { type: 'service-list', label: 'Product / Service List', category: 'business', fields: ['heading', 'items'] },
    { type: 'product-list', label: 'Product List', category: 'business', fields: ['heading', 'copy', 'items'], fieldSchema: blockSchema(['copy']) },
    { type: 'rental-offering-list', label: 'Rental Offering List', category: 'business', fields: ['heading', 'copy', 'items'], fieldSchema: blockSchema(['copy']) },
    { type: 'rental-product-cards', label: 'Rental Product Cards', category: 'business', fields: ['heading', 'items'] },
    { type: 'booking-entry', label: 'Book Now Entry', category: 'business', fields: ['heading', 'copy', 'craftKey', 'bookingHref', 'buttons'], fieldSchema: blockSchema(['copy', 'bookingHref', 'buttons']) },
    { type: 'booking-flow-panel', label: 'Booking Flow Panel', category: 'business', fields: ['heading', 'copy', 'calendarHeading', 'calendarCopy', 'selectedLabel', 'calendarSummaryCopy', 'requestedDateLabel', 'timeLabel', 'holidayTitle', 'holidayNote', 'summaryKicker', 'summaryHeading', 'dueTodayLabel', 'changePackageNote', 'addonsKicker', 'addons', 'submitLabel', 'footerNote'], fieldSchema: blockSchema(['copy', 'calendarCopy', 'holidayNote', 'changePackageNote', 'addons', 'footerNote']) },
    { type: 'booking-package-selector', label: 'Booking Package Selector', category: 'business', fields: ['heading', 'copy', 'tabs', 'pricingSource'], fieldSchema: blockSchema(['copy', 'tabs']) },
    { type: 'rental-rate-table', label: 'Rental Rate Table', category: 'business', fields: ['heading', 'copy', 'pricingSource', 'rates', 'seasonalOverrides'], fieldSchema: blockSchema(['copy', 'rates', 'seasonalOverrides']) },
    { type: 'availability-checker', label: 'Availability Checker', category: 'business', fields: ['heading', 'helpText', 'apiPath', 'craftKey', 'durationHours', 'dateFieldLabel', 'timeFieldLabel', 'emptyStateCopy', 'blockedStateCopy'], fieldSchema: blockSchema(['helpText', 'durationHours']) },
    { type: 'live-availability-panel', label: 'Live Availability Panel', category: 'business', fields: ['heading', 'helpText', 'apiPath', 'craftKey', 'durationHours', 'dateMode', 'slotWindow', 'showBlockedReason', 'ctaHrefTemplate', 'emptyStateCopy', 'loadingCopy', 'errorCopy'], fieldSchema: blockSchema(['helpText', 'durationHours']) },
    { type: 'availability-waiver-payment-cta', label: 'Availability / Waiver / Payment CTA', category: 'business', fields: ['heading', 'helpText', 'mode', 'buttons'], fieldSchema: blockSchema(['helpText', 'mode', 'buttons']) },
    { type: 'waiver-payment-summary', label: 'Waiver Payment Summary', category: 'business', fields: ['kicker', 'heading', 'copy', 'returningKicker', 'returningTitle', 'returningCopy', 'contactLabel', 'waiverLabel', 'waiverHeading', 'waiverCopy', 'waiverTermsLabel', 'waiverTermsHref', 'agreementKicker', 'legalItems', 'paymentStrong', 'paymentCopy', 'statusCopy', 'submitLabel'], fieldSchema: blockSchema(['copy', 'returningCopy', 'waiverCopy', 'waiverTermsHref', 'legalItems', 'paymentCopy', 'statusCopy']) },
    { type: 'waiver-checklist', label: 'Waiver Checklist', category: 'business', fields: ['termsVersion', 'heading', 'copy', 'checkboxes', 'signatureFields', 'minimumAgeCopy', 'damageAuthorizationCopy', 'photoReleaseCopy'], fieldSchema: blockSchema(['copy', 'checkboxes', 'signatureFields', 'minimumAgeCopy', 'damageAuthorizationCopy', 'photoReleaseCopy']) },
    { type: 'location-directions', label: 'Location Directions', category: 'business', fields: ['heading', 'address', 'directions', 'mapsUrl', 'mapEmbedUrl'], fieldSchema: blockSchema(['address', 'directions', 'mapsUrl', 'mapEmbedUrl']) },
    { type: 'location-service-area', label: 'Location Service Area', category: 'business', fields: ['city', 'driveTime', 'routeCopy', 'localFaq', 'nearbyCities', 'canonicalHref', 'smsPrefill', 'proofItems'], fieldSchema: blockSchema(['routeCopy', 'localFaq', 'nearbyCities', 'canonicalHref', 'smsPrefill', 'proofItems']) },
    { type: 'safety-requirements', label: 'Safety Requirements', category: 'business', fields: ['heading', 'items'] },
    { type: 'reviews-social', label: 'Reviews / Social', category: 'business', fields: ['heading', 'testimonials', 'buttons'], fieldSchema: blockSchema(['testimonials', 'buttons']) },
    { type: 'review-carousel', label: 'Review Carousel', category: 'business', fields: ['heading', 'score', 'summary', 'sources', 'reviews'], fieldSchema: blockSchema(['score', 'summary', 'sources', 'reviews']) },
    { type: 'add-ons', label: 'Add-ons', category: 'business', fields: ['heading', 'items'], fieldSchema: blockSchema(['items']) },
    { type: 'addon-list', label: 'Add-on List', category: 'business', fields: ['heading', 'copy', 'items', 'pricingSource'], fieldSchema: blockSchema(['copy', 'items']) },
    { type: 'booking-add-on-catalog', label: 'Booking Add-on Catalog', category: 'business', fields: ['heading', 'copy', 'addons', 'pricingSource'], fieldSchema: blockSchema(['copy', 'addons']) },
    { type: 'policy-list', label: 'Policy List', category: 'business', fields: ['heading', 'intro', 'items'], fieldSchema: blockSchema(['items']) },
    { type: 'policy-card-list', label: 'Policy Card List', category: 'business', fields: ['heading', 'copy', 'policies'], fieldSchema: blockSchema(['copy', 'policies']) },
    { type: 'seasonal-offer-banner', label: 'Seasonal Offer Banner', category: 'business', fields: ['offerKey', 'startsAt', 'endsAt', 'eligibleDates', 'eligibleCraft', 'allowedDurations', 'headline', 'body', 'ctaHrefTemplate', 'priority', 'status'], fieldSchema: blockSchema(['eligibleDates', 'eligibleCraft', 'allowedDurations', 'body', 'priority']) },
    { type: 'stripe-product-list', label: 'Stripe Product List', category: 'commerce', fields: ['heading', 'copy', 'products'], fieldSchema: blockSchema(['copy', 'products']), allowedContentTypes: ['stripeCatalog', 'productList', 'page'] },
    { type: 'stripe-catalog-display', label: 'Stripe Catalog Display', category: 'commerce', fields: ['heading', 'copy', 'products', 'editableAmounts'], fieldSchema: blockSchema(['copy', 'products', 'editableAmounts']), allowedContentTypes: ['stripeCatalog', 'productList', 'page'] },
    { type: 'stripe-checkout-products', label: 'Stripe Checkout Products', category: 'commerce', fields: ['heading', 'copy', 'products'], fieldSchema: blockSchema(['copy', 'products']), allowedContentTypes: ['stripeCatalog'] },
    { type: 'card-grid', label: 'Cards', category: 'design', fields: ['items'] },
    { type: 'faq', label: 'FAQ', category: 'text', fields: ['items'] },
    { type: 'cta-band', label: 'CTA Band', category: 'design', fields: ['heading', 'copy', 'buttons'], fieldSchema: blockSchema(['copy', 'buttons']) },
    { type: 'topbar', label: 'Topbar', category: 'navigation', fields: ['links', 'buttons', 'logo', 'menuId'], fieldSchema: blockSchema(['links', 'buttons', 'logo']), allowedContentTypes: publicContentTypes },
    { type: 'navigation-menu', label: 'Navigation Menu', category: 'navigation', fields: ['menuItems'], fieldSchema: blockSchema(['menuItems']), allowedContentTypes: ['navigationMenu'] },
    { type: 'pattern-ref', label: 'Pattern Reference', category: 'design', fields: ['patternId', 'mode'], allowedContentTypes: publicContentTypes },
    { type: 'style-tokens', label: 'Style Tokens', category: 'design', fields: ['styleTokens'], allowedContentTypes: ['styleSettings'] },
    { type: 'break', label: 'Section Break', category: 'design', fields: ['spacing', 'style'], fieldSchema: blockSchema(['spacing', 'style']) }
  ],
  templates: ['standard', 'landing', 'booking', 'legal', 'blog', 'city'],
  patternCategories: ['hero', 'cta', 'fleet', 'faq', 'legal', 'marketing'],
  taxonomies: ['categories', 'tags'],
  media: {
    publicUrlForKey: (key) => mediaUrl(key as Parameters<typeof mediaUrl>[0]),
    uploadPrefix: 'cms/',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    maxBytes: 50 * 1024 * 1024,
    allowedExternalHosts: ['cdn.slaquatics.com']
  },
  routes: {
    publicBasePath: '/api/cms/public',
    adminBasePath: '/api/cms/admin'
  }
});

export const CMS_HOME_FLEET_SECTION: CmsContent = createDefaultCmsContent({
  id: 'home-fleet-section',
  slug: 'home/fleet',
  title: 'Homepage fleet section',
  blocks: [
    {
      id: 'fleet-services',
      type: 'service-list',
      label: 'Fleet service cards',
      props: {
        eyebrow: 'Our Fleet',
        heading: 'Pick Your Ride First',
        copy: 'Pick what fits your group and head straight to booking.',
        banner: {
          href: './jetski-booking/?type=jetski&craft=jetski2&date=2026-07-04',
          strong: 'July 4th',
          text: '2 jet skis (4hr $900 / 8hr $1,350) or the boat (4hr $1,000 / 8hr $2,000) — 4 or 8 hour blocks only.',
          cta: 'Book the 4th →'
        },
        items: [
          {
            id: 'jetski',
            badge: '2 to 4 Yamaha Jet Skis',
            title: 'Jet Ski Rentals',
            statLabel: 'Starting as low as',
            price: '$59/hr',
            copy: 'Choose 2, 3, or 4 Yamaha jet skis, then pick the number of hours that fits your day on the water.',
            rateNote: 'Rates begin at $59/hr per ski on the longest block, with full pricing, deposits, and add-ons shown during booking.',
            perks: ['Life Jackets', 'Full Tank', 'Fast & Easy Booking', 'Cooler', 'Safety Briefing', 'No License Needed'],
            buttons: [{ label: 'Choose Jet Skis', href: '#booking', variant: 'primary' }],
            images: [
              { src: mediaUrl('site/images/shoreline-aquatics-img-4856.webp'), alt: 'Customers on Yamaha jet skis at sunset on Lake Lewisville' },
              { src: mediaUrl('site/images/shoreline-aquatics-img-4198.webp'), alt: 'Customer riding a Yamaha jet ski on Lake Lewisville' },
              { src: mediaUrl('site/images/shoreline-aquatics-e1efe821-ce35-4bb6-9bcf-46ea25bf784e.webp'), alt: 'Shoreline Aquatics jet ski customers on the water' },
              { src: mediaUrl('site/images/shoreline-jetski-rentals-action-20260630.webp'), alt: 'Shoreline Aquatics Yamaha jet skis cruising on Lake Lewisville' }
            ]
          },
          {
            id: 'boat',
            badge: 'Starcraft Tritoon · Seats Up to 14',
            title: 'Boat Rental',
            statLabel: 'Starting at',
            price: '$160/hr',
            copy: "It's a Starcraft tritoon — three pontoons instead of two, so it rides smoother and faster than a regular pontoon. Seats up to 14 with cushioned loungers, Bluetooth speakers, and a shade top. Good for birthdays, bachelor and bachelorette trips, sandbar days, sunset cruises, and tubing. Comes with a captain.",
            perks: ['Triple-Pontoon Tritoon', 'Bluetooth Sound', 'Seats up to 14', 'Captain Included', 'Loungers & Shade', 'Tubing-Ready'],
            buttons: [{ label: 'Book the Boat', href: './jetski-booking/?type=boat&craft=partyboat', variant: 'primary' }],
            images: [
              { src: mediaUrl('site/images/shoreline-pontoon-crop-final.png'), alt: 'Luxury tritoon on Lake Lewisville seating up to 14 guests' }
            ]
          }
        ]
      }
    },
    {
      id: 'fleet-bundle',
      type: 'cta-band',
      label: 'Fleet bundle callout',
      props: {
        heading: 'Want the bundle instead?',
        copy: 'Pair Yamaha jet skis with the boat in one request so the whole group can ride, lounge, and stay together for the full lake day.',
        badges: ['Jet skis + boat', 'Captain included', 'Built for bigger groups'],
        buttons: [{ label: 'Build a Bundle', href: '#booking', variant: 'primary' }],
        images: [
          { src: mediaUrl('site/images/shoreline-pontoon-crop-final.png'), alt: 'Pontoon boat on the water ready for a Shoreline group day' },
          { src: mediaUrl('site/images/shoreline-aquatics-img-4197.webp'), alt: 'Shoreline riders enjoying Yamaha jet skis on Lake Lewisville' }
        ]
      }
    }
  ]
});

function createEditablePage(slug: string, title: string, heading: string, copy: string, primaryHref = '#booking'): CmsContent {
  return createDefaultCmsContent({
    id: `${slug}-page`,
    slug,
    title,
    blocks: [
      {
        id: `${slug}-topbar`,
        type: 'topbar',
        label: 'Topbar',
        props: {
          logo: { src: mediaUrl('brand/shoreline-logo.webp'), alt: 'Shoreline Aquatics' },
          links: [
            { label: 'Fleet', href: '/#fleet' },
            { label: 'Book', href: '/#booking' },
            { label: 'Waiver', href: '/waiver' }
          ],
          buttons: [
            { label: 'Book Now', href: primaryHref, variant: 'primary', image: mediaUrl('brand/shoreline-logo.webp') }
          ]
        }
      },
      {
        id: `${slug}-hero`,
        type: 'hero',
        label: 'Hero',
        props: {
          eyebrow: 'Shoreline Aquatics',
          heading,
          copy,
          buttons: [
            { label: 'Book Now', href: primaryHref, variant: 'primary', image: mediaUrl('brand/shoreline-logo.webp') },
            { label: 'Ask a Question', href: 'tel:14696937164', variant: 'secondary' }
          ],
          media: {
            src: mediaUrl('site/images/shoreline-jetski-group-collage.webp'),
            alt: 'Shoreline Aquatics riders on Lake Lewisville'
          }
        }
      },
      {
        id: `${slug}-intro`,
        type: 'rich-text',
        label: 'Intro Text',
        props: {
          heading: title,
          body: copy
        }
      },
      {
        id: `${slug}-image`,
        type: 'image',
        label: 'Editable Image',
        props: {
          assetId: `${slug}-primary-image`,
          src: mediaUrl('site/images/shoreline-jetski-group-collage.webp'),
          alt: 'Customers enjoying a Shoreline Aquatics lake day',
          caption: 'Replace, crop, and set focal point from the CMS.'
        }
      },
      {
        id: `${slug}-video`,
        type: 'video',
        label: 'Editable Video',
        props: {
          src: mediaUrl('site/videos/shoreline-aquatics-hero.mp4'),
          poster: mediaUrl('site/images/shoreline-jetski-group-collage.webp'),
          caption: 'Editable video block for page-specific media.'
        }
      },
      {
        id: `${slug}-buttons`,
        type: 'button-group',
        label: 'Buttons',
        props: {
          buttons: [
            { label: 'Primary Button', href: primaryHref, variant: 'primary', image: mediaUrl('brand/shoreline-logo.webp') },
            { label: 'Secondary Button', href: '/', variant: 'secondary' },
            { label: 'Text Link', href: '/privacy-policy', variant: 'link' }
          ]
        }
      },
      {
        id: `${slug}-services`,
        type: 'service-list',
        label: 'Services / Products',
        props: {
          eyebrow: 'Editable Services',
          heading: 'Services and product-style cards',
          copy: 'Add, remove, reorder, and edit product or service cards from the CMS.',
          items: [
            {
              id: `${slug}-service-primary`,
              badge: 'Featured',
              title: title,
              price: 'Editable',
              copy,
              perks: ['Editable text', 'Editable image', 'Editable button'],
              buttons: [{ label: 'Learn More', href: primaryHref, variant: 'primary', image: mediaUrl('brand/shoreline-logo.webp') }],
              images: [{ src: mediaUrl('site/images/shoreline-jetski-group-collage.webp'), alt: 'Editable service card image' }]
            }
          ]
        }
      },
      {
        id: `${slug}-break`,
        type: 'break',
        label: 'Section Break',
        props: {
          spacing: 'medium',
          style: 'divider'
        }
      },
      {
        id: `${slug}-faq`,
        type: 'faq',
        label: 'Page FAQ',
        props: {
          heading: 'Common Questions',
          items: [
            { question: 'Can this page be edited?', answer: 'Yes. Text, images, videos, buttons, sections, and breaks are represented as structured CMS blocks.' },
            { question: 'Can the design be protected?', answer: 'Yes. The CMS edits approved fields while the site adapter controls rendering and layout.' }
          ]
        }
      },
      {
        id: `${slug}-cta`,
        type: 'cta-band',
        label: 'CTA Band',
        props: {
          heading: 'Ready to make a change?',
          copy: 'Update this page from the embedded CMS, preview it, then publish when it is ready.',
          buttons: [{ label: 'Edit This Page', href: '/content', variant: 'primary' }]
        }
      }
    ]
  });
}

function createHomePageContent(): CmsContent {
  const base = createEditablePage(
    'home',
    'Homepage',
    'Lake Lewisville jet ski and boat rentals',
    'Book a lake day with editable homepage sections, fleet cards, buttons, media, and calls to action.'
  );
  return {
    ...base,
    blocks: [
      {
        id: 'home-topbar',
        type: 'topbar',
        label: 'Homepage Topbar',
        props: {
          layout: 'home-nav',
          logo: { src: mediaUrl('brand/shoreline-logo.webp'), alt: 'Shoreline Aquatics' },
          links: [
            { label: 'Fleet', href: '#fleet' },
            { label: 'Book Now', href: '#booking' },
            { label: 'Add-Ons', href: '#addons' },
            { label: 'Location', href: '#location' },
            { label: 'Reviews', href: '#reviews' },
            { label: 'FAQ', href: '#faq' }
          ],
          buttons: [
            { label: '(469) 693-7164', href: 'tel:4696937164', variant: 'link' },
            { label: 'Book Now', href: '#booking', variant: 'primary' }
          ]
        }
      },
      {
        id: 'home-hero',
        type: 'hero',
        label: 'Homepage Hero',
        props: {
          layout: 'home-hero',
          eyebrow: 'Lake Lewisville · Hickory Creek, TX',
          heading: 'Ride The Open Water',
          copy: 'Jet ski & boat rentals at Lake Lewisville. Meet us at the launch, get your walkthrough, and hit the water with life jackets, fuel, and cooler included.',
          buttons: [
            { label: 'Book Now', href: '#booking', variant: 'primary' },
            { label: 'See Our Fleet', href: '#fleet', variant: 'secondary' }
          ],
          infoItems: [
            { label: 'Location', value: LAUNCH_ADDRESS },
            { label: 'Hours', value: LAUNCH_HOURS },
            { label: 'Call or Text', value: '(469) 693-7164', href: 'tel:4696937164' }
          ],
          media: {
            videoSrc: mediaUrl('site/videos/shoreline-aquatics-hero.mp4'),
            poster: mediaUrl('site/images/shoreline-jetski-group-collage.webp'),
            moduleSrc: mediaUrl('site/images/shoreline-aquatics-hero-module-20260630.webp?v=20260630'),
            moduleAlt: 'Point-of-view jet ski ride on Lake Lewisville'
          }
        }
      },
      {
        id: 'home-booking-entry',
        type: 'booking-entry',
        label: 'Book Now CTA',
        props: {
          heading: 'Book the right rental faster',
          copy: 'Send customers into the existing booking flow with the selected rental prefilled while keeping availability, waivers, and checkout code-owned.',
          craftKey: 'jetski2',
          bookingHref: '/jetski-booking/?type=jetski&craft=jetski2',
          buttons: [
            { label: 'Book Jet Skis', href: '/jetski-booking/?type=jetski&craft=jetski2', variant: 'primary' },
            { label: 'Book the Boat', href: '/jetski-booking/?type=boat&craft=partyboat', variant: 'secondary' }
          ]
        }
      },
      {
        id: 'home-booking-packages',
        type: 'booking-package-selector',
        label: 'Homepage Booking Packages',
        props: {
          eyebrow: 'Book Your Rental',
          heading: 'Choose The Package First',
          copy: 'Choose your rental, compare the hourly value, and continue into the booking flow for the date, contact + waiver, and $55 checkout.',
          pricingSource: 'code-owned',
          tabs: [
            {
              id: 'jetski',
              label: 'Jet Ski Rental',
              active: true,
              sections: [
                {
                  label: '1 · Number of jet skis needed',
                  groupId: 'js-craft-opts',
                  dataKey: 'craft',
                  options: [
                    { value: 'jetski2', label: '2 Yamaha Jet Skis', subLabel: 'Best for a smaller crew', selected: true },
                    { value: 'jetski3', label: '3 Yamaha Jet Skis', subLabel: 'Extra room for a bigger group' },
                    { value: 'jetski4', label: '4 Yamaha Jet Skis', subLabel: 'Largest Yamaha setup' }
                  ]
                },
                {
                  label: '2 · Choose your duration',
                  groupId: 'js-dur-opts',
                  dataKey: 'hours',
                  options: [
                    { value: 2, label: '2 Hours', subLabel: '$79/hr per ski', selected: true },
                    { value: 3, label: '3 Hours', subLabel: '$79/hr per ski' },
                    { value: 4, label: '4 Hours', subLabel: 'Most Popular · $74/hr per ski' },
                    { value: 6, label: '6 Hours', subLabel: 'Best Value · $63/hr per ski' },
                    { value: 8, label: 'Full Day (8 Hours)', subLabel: '$59/hr per ski' }
                  ]
                },
                {
                  label: '3 · Add Aerial Drone Coverage',
                  groupId: 'js-drone-opts',
                  dataKey: 'drone',
                  options: [
                    { value: 'no', label: 'No drone coverage', selected: true },
                    { value: 'yes', label: 'Add drone highlight video', subLabel: '+$50' }
                  ]
                }
              ],
              includes: ['Life Jackets', 'Full Tank of Gas', 'Fast & Easy Booking', 'Cooler', 'Safety Briefing'],
              submitLabel: 'Continue to Calendar & Contact + Waiver →',
              note: 'Base rate is $79/hr per ski. $55 due today at checkout.'
            },
            {
              id: 'boat',
              label: 'Boat Rental',
              sections: [
                {
                  label: 'Choose your duration',
                  groupId: 'bt-dur-opts',
                  dataKey: 'hours',
                  options: [
                    { value: 2, label: '2 Hours' },
                    { value: 3, label: '3 Hours' },
                    { value: 4, label: '4 Hours', subLabel: 'Most Popular', selected: true },
                    { value: 6, label: '6 Hours' },
                    { value: 8, label: 'Full Day (8 Hours)', subLabel: 'Best Value' }
                  ]
                },
                {
                  label: '2 · Add Aerial Drone Coverage',
                  groupId: 'bt-drone-opts',
                  dataKey: 'drone',
                  options: [
                    { value: 'no', label: 'No drone coverage', selected: true },
                    { value: 'yes', label: 'Add drone highlight video', subLabel: '+$50' }
                  ]
                }
              ],
              includes: ['Captain', 'Life Jackets', 'Full Tank', 'Fast & Easy Booking', 'Cooler', 'Up to 14 Guests'],
              submitLabel: 'Continue to Calendar & Contact + Waiver →',
              note: 'Easy hourly pricing with the captain included. $55 due today at checkout.'
            },
            {
              id: 'bundle',
              label: 'Bundle',
              sections: [
                {
                  label: '1 · Choose your bundle size',
                  groupId: 'bd-craft-opts',
                  dataKey: 'craft',
                  options: [
                    { value: 'bundle2', label: '2 Jet Skis + Boat', subLabel: 'Best for a mixed group', selected: true },
                    { value: 'bundle3', label: '3 Jet Skis + Boat', subLabel: 'Extra room for more riders' },
                    { value: 'bundle4', label: '4 Jet Skis + Boat', subLabel: 'Full lake-day setup' }
                  ]
                },
                {
                  label: '2 · Choose your duration',
                  groupId: 'bd-dur-opts',
                  dataKey: 'hours',
                  options: [
                    { value: 2, label: '2 Hours', selected: true },
                    { value: 3, label: '3 Hours' },
                    { value: 4, label: '4 Hours', subLabel: 'Most Popular' },
                    { value: 6, label: '6 Hours', subLabel: 'Best Value' },
                    { value: 8, label: 'Full Day (8 Hours)' }
                  ]
                },
                {
                  label: '3 · Add Aerial Drone Coverage',
                  groupId: 'bd-drone-opts',
                  dataKey: 'drone',
                  options: [
                    { value: 'no', label: 'No drone coverage', selected: true },
                    { value: 'yes', label: 'Add drone highlight video', subLabel: '+$50' }
                  ]
                }
              ],
              includes: ['Yamaha Jet Skis', 'Boat + Captain', 'Life Jackets', 'Full Tank', 'Fast & Easy Booking', 'Cooler'],
              submitLabel: 'Continue to Calendar & Contact + Waiver →',
              note: "Found a lower price? We'll match it. $55 due today at checkout."
            }
          ]
        }
      },
      {
        id: 'home-stripe-catalog',
        type: 'stripe-product-list',
        label: 'Stripe Product Display Catalog',
        props: {
          heading: 'Checkout products',
          copy: 'Edit public product labels and Stripe mapping IDs here. Booking totals, deposit rules, processing fees, and final checkout amounts remain server-owned.',
          products: [
            { productKey: 'booking-deposit', label: 'Booking Deposit', displayName: 'Shoreline Aquatics Booking Deposit', displayPrice: '$50 deposit', stripeProductId: '', stripePriceId: '', stripeLookupKey: '', checkoutMode: 'deposit', active: true, sortOrder: 1 },
            { productKey: 'processing-fee', label: 'Processing Fee', displayName: 'Secure checkout processing fee', displayPrice: '$5 fee', stripeProductId: '', stripePriceId: '', stripeLookupKey: '', checkoutMode: 'fee', active: true, sortOrder: 2 }
          ]
        }
      },
      {
        id: 'home-trust',
        type: 'card-grid',
        label: 'Trust Bar',
        props: {
          layout: 'trust-bar',
          items: [
            { title: '550+', copy: 'Happy Customers' },
            { title: 'FAST', copy: 'Easy Booking' },
            { title: '100%', copy: 'Licensed & Insured' }
          ]
        }
      },
      {
        id: 'home-addons',
        type: 'service-list',
        label: 'Add-Ons Section',
        props: {
          layout: 'home-addons',
          eyebrow: 'Add-Ons',
          heading: 'Want a Video of Your Day?',
          copy: "Add aerial drone footage and we'll send you a short highlight clip from your day on the water.",
          items: [
            {
              id: 'aerial-drone-video',
              badge: 'Optional add-on',
              title: 'Aerial Drone Video',
              price: '$50',
              priceNote: 'highlight edit',
              copy: 'Add one clean highlight edit from above the water so the group leaves with a polished clip from the day.',
              perks: ['Launch + ride footage', 'Simple add-on at booking'],
              buttons: [{ label: 'Add it to your booking', href: '#booking', variant: 'link' }],
              images: [{ src: mediaUrl('site/images/shoreline-aerial-drone-video-pontoon.webp'), alt: 'Aerial drone footage over Lake Lewisville' }]
            }
          ]
        }
      },
      {
        id: 'home-how',
        type: 'card-grid',
        label: 'How It Works',
        props: {
          layout: 'home-steps',
          heading: 'How It Works',
          copy: 'Five quick steps from picking the rental to showing up ready for the water.',
          items: [
            { title: 'Pick Your Ride', copy: 'Jet skis, the boat, or both — whatever fits your group.' },
            { title: 'Pick Your Date & Time', copy: 'Choose the day and start time that works best for your group.' },
            { title: 'Add Extras', copy: 'Add aerial drone coverage if you want a highlight video from the day.' },
            { title: 'Finish Contact + Waiver', copy: 'Complete the rider form, sign the waiver, and pay the booking deposit.' },
            { title: 'Show Up & Ride', copy: 'Follow the directions, check in fast, and get on the water.' }
          ]
        }
      },
      {
        id: 'home-why',
        type: 'card-grid',
        label: 'Why Choose Us',
        props: {
          layout: 'home-why',
          eyebrow: 'Why Choose Us',
          heading: 'Why Choose Us?',
          copy: 'Straight pricing, clean equipment, and a smooth Lake Lewisville launch.',
          items: [
            { title: 'Great Value', copy: 'Clear pricing with stronger hourly value on the longer rentals.' },
            { title: 'Lake Lewisville Launch', copy: 'Meet Shoreline at the launch and get on the water without a confusing handoff.' },
            { title: 'What’s Included', copy: 'Life jackets, fuel, captain on boat rentals, and a simple safety walkthrough.' },
            { title: 'Easy Repeat Booking', copy: 'Saved rider info and a clean follow-up process make the next booking faster.' }
          ]
        }
      },
      {
        id: 'home-location',
        type: 'location-directions',
        label: 'Location Section',
        props: {
          heading: 'Shoreline Aquatics – Arrival Instructions',
          address: LAUNCH_ADDRESS,
          directions: ARRIVAL_DIRECTIONS,
          mapsUrl: LAUNCH_MAPS_URL,
          mapEmbedUrl: LAUNCH_MAPS_EMBED_URL
        }
      },
      {
        id: 'home-safety-requirements',
        type: 'safety-requirements',
        label: 'Safety Requirements',
        props: {
          heading: 'Before you launch',
          items: [
            { title: 'Valid ID required', copy: 'Bring a valid ID for check-in and waiver verification.' },
            { title: 'Life jackets included', copy: 'Life jackets are provided and required for riders.' },
            { title: 'Waiver before launch', copy: 'Every rider must complete the required waiver before getting on the water.' }
          ]
        }
      },
      {
        id: 'home-faq',
        type: 'faq',
        label: 'Homepage FAQ',
        props: {
          layout: 'home-faq',
          heading: 'Common Questions',
          copy: 'Still have questions? Call us at (469) 693-7164.',
          items: [
            { question: 'How does payment work?', answer: '$55 is due today to book. That includes a $50 booking deposit and a $5 processing fee. The remaining balance is due before launch, plus a $200 refundable damage deposit per jet ski.' },
            { question: "What's your cancellation policy?", answer: "Need to cancel or reschedule? Call or text us as early as you can and we'll do our best to work with you. If we ever have to cancel for weather or unsafe lake conditions, we'll refund you or set up another day." },
            { question: 'Do I need a license?', answer: "No license required — just a valid ID. We'll walk you through a full safety and operating briefing before you head out." },
            { question: "I've never ridden a jet ski before. Is that OK?", answer: "Absolutely. We walk every first-timer through everything before we leave. And if questions come up on the water, just call — we're on standby." },
            { question: 'Are life jackets included?', answer: 'Yes, always. Life jackets are included with every single rental — safety is non-negotiable for us.' },
            { question: 'Are you licensed and insured?', answer: 'Yes — fully licensed and insured. Happy to provide proof anytime, just ask.' },
            { question: 'Do you offer deals or discounts?', answer: "We have the best rates in the area and we'll price match if you find better. The Full Day Bundle is the best value, and return customers always get a discount." },
            { question: 'Do you offer aerial drone coverage?', answer: 'Yes. Aerial drone coverage is available as an add-on for $50, and we only recommend it if you want a highlight video of your day on the water.' },
            { question: 'Who runs Shoreline Aquatics?', answer: "We're Dallas locals — two brothers who love the water and wanted to share that with the community. Looking forward to meeting you on the lake!" }
          ]
        }
      },
      {
        id: 'home-reviews',
        type: 'card-grid',
        label: 'Customer Reviews',
        props: {
          layout: 'home-reviews',
          eyebrow: 'Customer Reviews',
          heading: 'What People Are Saying',
          score: '5.0',
          summary: 'Based on Google & Facebook reviews · 550+ customers',
          badge: 'Lake Lewisville · Hickory Creek launch',
          hint: 'Swipe or tap through more customer reviews.',
          items: [
            {
              title: 'Taimoor J.',
              initials: 'TJ',
              meta: 'DFW Area · Verified Customer',
              source: 'Google Review',
              copy: '"Best experience on the lake. We met them at the launch, they walked us through everything, and the jet skis were in perfect condition. Already planning our next trip."'
            },
            {
              title: 'Shilpa J.',
              initials: 'SJ',
              meta: 'Louisiana · Verified Customer',
              source: 'Google Review',
              copy: '"Rented for my birthday — 4 jet skis for our whole crew plus drone footage. Super friendly and professional. Highly recommend to anyone in DFW!"'
            },
            {
              title: 'Marifer G.',
              initials: 'MG',
              meta: 'Florida · Verified Customer',
              source: 'Google Review',
              copy: '"My kids had never been on jet skis and they were so patient walking everyone through it. Super organized, prices are unbeatable, and the whole process felt easy. 10/10!"'
            },
            {
              title: 'Jaylen J.',
              initials: 'JJ',
              meta: 'Dallas, TX · Verified Customer',
              source: 'Google Review',
              copy: '"Booked the boat for our group and the captain was amazing. Drone video came out incredible — capturing everything from above. Already planning our return trip!"'
            },
            {
              title: 'Preston B.',
              initials: 'PB',
              meta: 'Central Texas · Verified Customer',
              source: 'Google Review',
              copy: '"Super easy to book, they showed up early and the equipment was spotless. Real Dallas locals who genuinely care. Had us set up in minutes."'
            },
            {
              title: 'Debra W.',
              initials: 'DW',
              meta: 'Cincinnati, OH · Verified Customer',
              source: 'Facebook Review',
              copy: '"Called last minute and they made it work. Everything promised was ready when we arrived and we had an absolute blast. My go-to recommendation for anyone in DFW."'
            }
          ]
        }
      },
      {
        id: 'home-instagram',
        type: 'carousel',
        label: 'Social Gallery',
        props: {
          layout: 'home-social-gallery',
          eyebrow: 'Follow Along',
          heading: '@shorelineaquatic',
          copy: 'See more shots from Lake Lewisville — follow us for availability, customer clips, and deals.',
          buttons: [
            { label: 'Follow on Instagram', href: 'https://www.instagram.com/shorelineaquatic/', variant: 'secondary' },
            { label: 'Facebook', href: 'https://www.facebook.com/slaquatic/', variant: 'secondary' },
            { label: 'Follow @shorelineaquatic', href: 'https://www.instagram.com/shorelineaquatic/', variant: 'primary' },
            { label: 'Find us on Facebook', href: 'https://www.facebook.com/slaquatic/', variant: 'secondary' }
          ],
          images: [
            { src: mediaUrl('site/images/shoreline-aquatics-img-4483.webp'), alt: 'Shoreline group with Yamaha jet skis on Lake Lewisville' },
            { src: mediaUrl('site/images/shoreline-aquatics-img-4198.webp'), alt: 'Customers meeting Shoreline Aquatics at the shoreline' },
            { src: mediaUrl('site/images/shoreline-aquatics-img-4175.webp'), alt: 'Two riders on Yamaha jet skis' },
            { src: mediaUrl('site/images/shoreline-aquatics-img-8967.webp'), alt: 'Customer riding a Yamaha jet ski' },
            { src: mediaUrl('site/images/shoreline-aquatics-img-3611.webp'), alt: 'Aerial-style Shoreline Aquatics customer moment' },
            { src: mediaUrl('site/images/shoreline-aquatics-9fc84833-3e1a-4cc9-90ed-a3f65305d6f8.webp'), alt: 'Shoreline Aquatics lake day moment' }
          ]
        }
      },
      {
        id: 'home-final-cta',
        type: 'cta-band',
        label: 'Final CTA',
        props: {
          layout: 'home-cta',
          heading: 'Ready to Hit the Water?',
          copy: "Book online in seconds or give us a call. We'll take care of everything else.",
          note: `${LAUNCH_HOURS} · (469) 693-7164 · ${LAUNCH_ADDRESS}`,
          buttons: [
            { label: 'Book Now', href: '#booking', variant: 'primary' },
            { label: 'Call (469) 693-7164', href: 'tel:4696937164', variant: 'secondary' }
          ]
        }
      },
      {
        id: 'home-mobile-nav',
        type: 'topbar',
        label: 'Mobile Navigation',
        props: {
          layout: 'mobile-nav',
          title: 'Menu',
          links: [
            { label: 'Fleet', href: '#fleet' },
            { label: 'Book Now', href: '#booking' },
            { label: 'Add-Ons', href: '#addons' },
            { label: 'Location', href: '#location' },
            { label: 'Reviews', href: '#reviews' },
            { label: 'FAQ', href: '#faq' }
          ],
          buttons: [
            { label: 'Call (469) 693-7164', href: 'tel:4696937164', variant: 'secondary' },
            { label: 'Book Now', href: '#booking', variant: 'primary' }
          ]
        }
      },
      {
        id: 'home-footer',
        type: 'rich-text',
        label: 'Footer',
        props: {
          layout: 'site-footer',
          logo: { src: mediaUrl('brand/shoreline-logo.webp'), alt: 'Shoreline Aquatics' },
          body: `Jet ski & boat rentals at Lake Lewisville, TX. Meet us at ${LAUNCH_ADDRESS} during ${LAUNCH_HOURS}.`,
          socialLinks: [
            { label: 'Instagram', href: 'https://www.instagram.com/shorelineaquatic/' },
            { label: 'Facebook', href: 'https://www.facebook.com/slaquatic/' }
          ],
          columns: [
            {
              heading: 'Rentals',
              links: [
                { label: 'Jet Ski Rentals', href: '#jetski' },
                { label: 'Boat Rental', href: '#boat' },
                { label: 'Drone Add-on', href: '#addons' },
                { label: 'Aerial Drone Coverage', href: '#addons' }
              ]
            },
            {
              heading: 'Plan Your Day',
              links: [
                { label: 'Compare the Fleet', href: '#fleet' },
                { label: 'Build Your Package', href: '#booking' },
                { label: 'Aerial Drone Coverage', href: '#addons' },
                { label: 'Arrival Directions', href: '#location' }
              ]
            },
            {
              heading: 'Info',
              links: [
                { label: 'Reviews', href: '#reviews' },
                { label: 'FAQ', href: '#faq' },
                { label: 'Arrival Directions', href: '#location' },
                { label: 'Contact + Waiver', href: './waiver/' },
                { label: 'Privacy Policy', href: './privacy-policy/' }
              ]
            }
          ],
          bottom: `© 2026 Shoreline Aquatics LLC · ${LAUNCH_ADDRESS} · All rights reserved`,
          bottomLinks: [{ label: 'Privacy Policy', href: './privacy-policy/' }]
        }
      },
      {
        id: 'home-mobile-cta',
        type: 'button-group',
        label: 'Mobile CTA Bar',
        props: {
          layout: 'mobile-cta',
          buttons: [
            { label: 'Book Now', href: '#booking', variant: 'primary' },
            { label: 'Text Us', href: 'sms:+14696937164', variant: 'secondary' }
          ]
        }
      }
    ]
  };
}

const waiverRiskItems = [
  'Changing water flow, tides, currents, wave action, and ships’ wakes.',
  'Collision with participants, the watercraft, other watercraft, or man-made or natural objects.',
  'Wind shear, inclement weather, lightning, and extremes of weather or temperature.',
  'Ability to operate equipment, swim, follow directions, and maintain physical coordination.',
  'Collision, capsizing, sinking, exposure to the elements, hypothermia, and/or drowning.',
  'The presence of insects and marine life forms, some of which are poisonous.',
  'Equipment failure or operator error.',
  'Sun-related injuries or illness, including sunburn, sunstroke, and dehydration.',
  'Fatigue, chill, or dizziness that may diminish reaction time and increase the risk of an accident.'
];

const waiverLegalItems = [
  { body: 'All watercraft are used at the renter’s and renter’s guests and/or passengers risk.' },
  { body: 'Acknowledgement of risks. I acknowledge that some, but not all, of the risks of participation on the watersport activity include:', items: waiverRiskItems },
  { body: 'Express assumption of risk and responsibility. I agree to assume responsibility for all risks of the activity, whether identified above or not, even those risks arising out of the negligence of the company named above.' },
  { body: 'Release. I release the company, its principals, directors, officers, agents, employees and volunteers, their insurers, and each land owner, municipal agency, or governmental agency upon whose property any activity is conducted, and their insurers, from any and all claims, actions, suits, proceedings, costs, expenses, damages, and liabilities, including attorney’s fees.' },
  { body: 'Responsibility. I agree to assume full responsibility for physical damages to the vessel during my time of possession of the vehicle, including cartage expenses, repairs, and downtime where applicable.' },
  { body: 'Adherence to rules. I agree to follow all instructions and commands of the company. Failure to comply may result in immediate termination of the rental and forfeiture of monies paid or due. Payments of all fees are due no later than the end of the rental.' },
  { label: 'Indemnification.', body: "Renter agrees to indemnify, defend, and hold harmless Shoreline Aquatics LLC, its owners, employees, agents, and affiliates from any claims, lawsuits, damages, losses, expenses, attorney's fees, or liabilities arising from the renter's use of the watercraft, including claims brought by passengers, guests, or third parties." },
  { label: 'Passenger liability.', body: 'The renter assumes responsibility for the conduct, safety, and actions of all passengers, guests, and authorized operators and agrees that this waiver applies to all such persons.' },
  { label: 'Property damage / card-on-file authorization.', body: 'Renter authorizes Shoreline Aquatics LLC to charge the credit card on file for damages, towing, recovery costs, cleaning fees, fuel charges, administrative expenses, and lost rental income resulting from damage.' },
  { label: 'Lost revenue / downtime.', body: 'Renter shall be liable for loss of rental income during the period the watercraft is unavailable due to damages caused during the rental period.' },
  { label: 'Medical treatment authorization.', body: 'Shoreline Aquatics LLC may obtain emergency medical treatment for the participant if deemed necessary, and the participant agrees to be responsible for all associated costs.' },
  { label: 'No alcohol or drugs.', body: 'Operation of any watercraft while under the influence of alcohol, illegal drugs, marijuana, or impairing medications is strictly prohibited and may result in immediate termination without refund.' },
  { label: 'Age and swimming ability.', body: 'Renter certifies that all operators meet the minimum age requirements and possess adequate swimming ability and physical fitness to safely participate.' },
  { label: 'Photo and video release.', body: 'Participant grants Shoreline Aquatics LLC permission to use photographs and videos taken during rental activities for promotional and marketing purposes.' },
  { label: 'Governing law and venue.', body: 'This agreement shall be governed by the laws of the State of Texas. Any dispute shall be brought exclusively in Denton County, Texas.' },
  { label: 'Binding arbitration.', body: 'Any dispute arising from this agreement shall be resolved through binding arbitration in Denton County, Texas, and the parties waive their right to a jury trial.' },
  { label: 'Electronic signature consent.', body: 'Electronic signatures shall have the same force and effect as original signatures.' },
  { label: 'Acknowledgment of safety briefing.', body: 'Renter acknowledges receiving and understanding all safety instructions, operating procedures, emergency procedures, navigation boundaries, and Texas boating laws prior to operation.' },
  { label: 'Safety equipment / life-jacket compliance.', body: 'Renter acknowledges receipt of all required safety equipment and agrees to wear and properly use such equipment as instructed.' },
  { label: 'Recovery and towing costs.', body: 'Renter shall be responsible for all towing, retrieval, salvage, recovery, storage, and transportation expenses resulting from operator error, negligence, grounding, collision, or mechanical damage caused during the rental period.' },
  { label: 'Third-party injury protection.', body: "Renter accepts responsibility for injuries, death, or property damage caused to any passenger, guest, swimmer, boater, or third party resulting from renter's operation of the watercraft." }
];

function withPageSpecificCmsBlocks(content: CmsContent): CmsContent {
  if (content.slug === 'jetski-booking') {
    return {
      ...content,
      blocks: [
        ...content.blocks,
        {
          id: 'jetski-booking-flow-panel',
          type: 'booking-flow-panel',
          label: 'Booking Flow Panel',
          props: {
            heading: 'Pick the rental date first',
            copy: 'Choose the date and start time here. The next page combines the rider contact form, waiver, and $55 checkout in one step.',
            calendarHeading: 'Choose the rental day first',
            calendarCopy: 'Pick the day up front so the rest of the booking stays locked to the right rental date.',
            selectedLabel: 'Selected',
            calendarSummaryCopy: 'Choose the date that works best, then continue to the contact, waiver, and $55 checkout page.',
            requestedDateLabel: 'Requested date',
            timeLabel: 'Preferred start time',
            holidayTitle: 'July 4th Special',
            holidayNote: 'Holiday special: we are only running 2 jet skis on the 4th - pick a 4-hour or 8-hour block below.',
            summaryKicker: 'Package summary',
            summaryHeading: 'Review the booking before the next step',
            dueTodayLabel: 'Due today',
            changePackageNote: 'Need to change the package? Head back to the homepage booking section before continuing.',
            addonsKicker: 'Add-ons - $50 each',
            addons: [
              { id: 'drone', label: 'Aerial drone video', priceLabel: '+$50' },
              { id: 'karaoke', label: 'Karaoke setup', priceLabel: '+$50' },
              { id: 'tube', label: 'Towable tube', priceLabel: '+$50' }
            ],
            submitLabel: 'Continue To Contact + Waiver',
            footerNote: 'The next page combines the contact form, waiver, and $55 checkout in one clean step.'
          }
        }
      ]
    };
  }
  if (content.slug === 'jetski-booking-confirmation') {
    return {
      ...content,
      blocks: [
        ...content.blocks,
        {
          id: 'jetski-booking-waiver-payment-summary',
          type: 'waiver-payment-summary',
          label: 'Waiver Payment Summary',
          props: {
            kicker: 'Contact + Waiver',
            heading: 'Complete the rider details and waiver',
            copy: 'Finish the form below, then pay $55 today to move into the thank-you page and arrival instructions.',
            returningKicker: 'Returning rider found',
            returningTitle: 'Customer recognized',
            returningCopy: 'Welcome back. We filled in the details we already had for this rider.',
            contactLabel: 'Contact Details',
            waiverLabel: 'Waiver',
            waiverHeading: 'Review the waiver and sign online',
            waiverCopy: 'The rider confirms the normal on-the-water risks and Shoreline safety instructions before checkout.',
            waiverTermsLabel: 'View full waiver terms',
            waiverTermsHref: '../waiver/?view=terms#terms',
            agreementKicker: 'Agreement Summary',
            legalItems: [
              'All watercraft are used at the renter and guest risk, including weather, wakes, collisions, equipment issues, and operator error.',
              'The rider accepts responsibility for operating the equipment safely and following Shoreline instructions throughout the rental.',
              'The rider releases Shoreline Aquatics LLC from claims tied to normal participation risks and authorizes Shoreline to keep this waiver on file so future bookings can be faster.'
            ],
            paymentStrong: 'Pay today:',
            paymentCopy: '$55 total. That includes a $50 booking deposit and a $5 processing fee. The remaining rental balance is handled directly with Shoreline before launch.',
            statusCopy: 'Finish the form, then pay $55 today to hold the rental date.',
            submitLabel: 'Pay $55 today'
          }
        }
      ]
    };
  }
  if (content.slug === 'booking-thank-you') {
    return {
      ...content,
      blocks: [
        ...content.blocks,
        {
          id: 'booking-thank-you-confirmation-copy',
          type: 'rich-text',
          label: 'Confirmation Copy',
          props: {
            layout: 'thank-you-confirmation',
            eyebrow: 'Confirmation',
            heading: 'Watch for your text or email.',
            body: 'Shoreline will use the contact details on your booking for any final timing updates, launch reminders, or day-of changes.',
            noteHeading: 'Keep your phone handy',
            note: 'If anything changes with your party size or arrival time, reply to the confirmation message or call Shoreline directly before your rental window.',
            highlight: 'Text message follow-up',
            safetyHeading: 'Quick Safety Briefing',
            items: [
              'Life jackets stay on for every rider from launch to return.',
              'The driver keeps the safety lanyard clipped in while operating the jet ski.',
              'No alcohol or drugs. If you are impaired, you do not ride.',
              'Idle out from the launch and stay slow near docks, swimmers, boats, and shoreline.',
              'If weather changes or anything feels wrong, slow down, stop safely, and call Shoreline.'
            ]
          }
        },
        {
          id: 'booking-thank-you-arrival',
          type: 'rich-text',
          label: 'Arrival Directions',
          props: {
            layout: 'thank-you-arrival',
            eyebrow: 'Point Vista Park Directions',
            heading: 'Shoreline Aquatics launch',
            body: `The launch meeting spot is at ${LAUNCH_ADDRESS}. Use the directions below once you arrive near the park entrance.`,
            addressLines: LAUNCH_ADDRESS_LINES,
            items: ARRIVAL_DIRECTIONS,
            buttons: [
              { label: 'Call Shoreline', href: 'tel:4696937164', variant: 'primary' },
              { id: 'sms-link', label: 'Text Shoreline', href: '#', variant: 'secondary' }
            ]
          }
        },
        {
          id: 'booking-thank-you-launch-photo',
          type: 'image',
          label: 'Launch Photo',
          props: {
            layout: 'thank-you-photo',
            src: mediaUrl('site/images/shoreline-jetski-shoreline-guests.webp'),
            alt: 'Shoreline Aquatics customer moments',
            caption: 'Shoreline will meet you at the launch, walk you through the basics, and get your group on the water fast.'
          }
        }
      ]
    };
  }
  if (content.slug === 'waiver') {
    return {
      ...content,
      blocks: [
        ...content.blocks,
        {
          id: 'waiver-success-copy',
          type: 'cta-band',
          label: 'Waiver Success Copy',
          props: {
            layout: 'waiver-success',
            eyebrow: 'Saved',
            heading: 'You are all set.',
            copy: 'Your waiver has been submitted successfully. If you still need to reserve a rental date, continue to booking below.',
            buttons: [
              { label: 'Continue to booking', href: '../jetski-booking/', variant: 'primary' },
              { label: 'Back to homepage', href: '../', variant: 'secondary' }
            ]
          }
        },
        {
          id: 'waiver-terms',
          type: 'rich-text',
          label: 'Waiver Terms',
          props: {
            layout: 'waiver-legal',
            eyebrow: 'Waiver Terms',
            heading: 'Assumption And Acknowledgement Of Risks And Release Of Liability',
            paragraphs: [
              'I HAVE READ THIS ASSUMPTION AND ACKNOWLEDGEMENT OF RISKS AND RELEASE OF LIABILITY AGREEMENT on the front and back of this contract. I UNDERSTAND THAT BY SIGNING THIS RENTAL CONTRACT, AND IN CONSIDERATION OF MY BEING ABLE TO PARTICIPATE IN, AND USE, THE JET SKIS RENTED BY Shoreline Rentals, I HEREBY RELEASE, WAIVE, AND DISCHARGE Shoreline Rentals LLC, OF ALL VALUABLE LEGAL RIGHTS I MAY HAVE AGAINST ITS OWNER AND GUIDES AND OPERATORS, OR THEIR EMPLOYEES AGENTS, SERVANTS, OR ASSIGNS.',
              'In consideration, for being allowed by Shoreline Aquatics LLC, to participate in watersport events and activities, and/or being provided with watersport recreational property, equipment or services, for myself and any minor children for whom I am parent, legal guardian or otherwise responsible, and for my/our heirs, personal representatives or assigns, I acknowledge that I have read, understood and agreed with any and all provisions listed throughout this document, as evidenced by my signature and initials below.'
            ],
            summaryEyebrow: 'Agreement Summary',
            summaryHeading: 'What you are agreeing to',
            legalItems: waiverLegalItems
          }
        }
      ]
    };
  }
  if (content.slug === 'ops-login') {
    return {
      ...content,
      blocks: [
        {
          id: 'ops-login-install-banner',
          type: 'rich-text',
          label: 'Install Banner',
          props: {
            layout: 'ops-install-banner',
            heading: 'Install Shoreline Ops',
            body: 'Open this from your iPhone home screen for the full app experience. In Safari, tap Share, then Add to Home Screen.',
            closeLabel: 'Dismiss install reminder'
          }
        },
        ...content.blocks
      ]
    };
  }
  return content;
}

export const CMS_SLAQUATICS_PAGE_CONTENT: CmsContent[] = [
  createHomePageContent(),
  withPageSpecificCmsBlocks(createEditablePage('jetski-booking', 'Booking Page', 'Choose your rental date and package', 'Edit the booking page hero, explainer copy, media, buttons, and supporting sections while the booking logic stays code-owned.', '/jetski-booking')),
  withPageSpecificCmsBlocks(createEditablePage('jetski-booking-confirmation', 'Booking Confirmation', 'Finish contact, waiver, and checkout', 'Edit the confirmation page instructions, hero, trust copy, buttons, images, and videos without changing Stripe or waiver logic.', '/jetski-booking-confirmation')),
  withPageSpecificCmsBlocks(createEditablePage('booking-thank-you', 'Booking Thank You', 'Your lake day is booked', 'Edit the thank-you page arrival copy, images, buttons, and follow-up sections while payment state remains code-owned.', '/booking-thank-you')),
  withPageSpecificCmsBlocks(createEditablePage('waiver', 'Waiver Page', 'Review and sign the Shoreline waiver', 'Edit waiver page framing, helper text, media, and calls to action while legal acceptance fields remain code-owned.', '/waiver')),
  createEditablePage('privacy-policy', 'Privacy Policy', 'Privacy policy and customer data use', 'Edit policy page sections, text blocks, breaks, and navigation buttons through the CMS.', '/privacy-policy'),
  createEditablePage('jet-ski-rental-denton', 'Denton Rental Page', 'Jet ski rentals near Denton', 'Edit city SEO page sections, hero copy, media, buttons, FAQ, and calls to action.', '/jet-ski-rental-denton'),
  createEditablePage('jet-ski-rental-frisco', 'Frisco Rental Page', 'Jet ski rentals near Frisco', 'Edit city SEO page sections, hero copy, media, buttons, FAQ, and calls to action.', '/jet-ski-rental-frisco'),
  createEditablePage('jet-ski-rental-lewisville', 'Lewisville Rental Page', 'Jet ski rentals on Lake Lewisville', 'Edit city SEO page sections, hero copy, media, buttons, FAQ, and calls to action.', '/jet-ski-rental-lewisville'),
  withPageSpecificCmsBlocks(createEditablePage('ops-login', 'Ops Login Page', 'Secure operations login', 'Edit the login page framing, helper text, imagery, and links while authentication remains code-owned.', '/ops-login'))
];

function createRentalProductListContent(): CmsContent {
  return {
    ...createDefaultCmsContent({
      id: 'rental-product-list',
      slug: 'rentals',
      title: 'Rental Products',
      contentType: 'productList',
      blocks: [
        {
          id: 'rental-products-hero',
          type: 'hero',
          label: 'Rental Products Hero',
          props: {
            eyebrow: 'Rental Products',
            heading: 'Jet ski, boat, and bundle rentals',
            copy: 'Edit public product descriptions, images, labels, and calls to action here. Booking availability, deposits, fees, and Stripe checkout amounts remain code-owned.',
            buttons: [{ label: 'Book Now', href: '/#booking', variant: 'primary' }],
            media: {
              src: mediaUrl('site/images/shoreline-jetski-group-collage.webp'),
              alt: 'Shoreline Aquatics rentals on Lake Lewisville'
            }
          }
        },
        {
          id: 'rental-products-list',
          type: 'product-list',
          label: 'Rental Product Cards',
          props: {
            eyebrow: 'Products',
            heading: 'Public rental catalog',
            copy: 'This catalog is CMS-editable for presentation only. Checkout totals still come from the booking system.',
            items: [
              {
                id: 'jet-ski-rentals',
                badge: 'Jet skis',
                title: 'Jet Ski Rentals',
                price: 'Starting as low as $59/hr',
                copy: 'Yamaha jet ski rentals for Lake Lewisville groups.',
                buttons: [{ label: 'Book Jet Skis', href: '/#booking', variant: 'primary' }],
                images: [{ src: mediaUrl('site/images/shoreline-aquatics-img-4197.webp'), alt: 'Yamaha jet skis on Lake Lewisville' }]
              },
              {
                id: 'boat-rental',
                badge: 'Captain included',
                title: 'Boat Rental',
                price: 'Starting at $160/hr',
                copy: 'Pontoon-style boat rental with captain for groups that want more room on the lake.',
                buttons: [{ label: 'Book Boat', href: '/#booking', variant: 'primary' }],
                images: [{ src: mediaUrl('site/images/shoreline-pontoon-crop-final.png'), alt: 'Pontoon boat on Lake Lewisville' }]
              },
              {
                id: 'rental-bundles',
                badge: 'Bundles',
                title: 'Jet Ski + Boat Bundles',
                price: 'Custom lake-day setup',
                copy: 'Bundle jet skis with a boat and captain for larger group days.',
                buttons: [{ label: 'Build Bundle', href: '/#booking', variant: 'primary' }],
                images: [{ src: mediaUrl('site/images/shoreline-jetski-group-collage.webp'), alt: 'Group lake-day rental bundle' }]
              }
            ]
          }
        },
        {
          id: 'rental-products-checkout-note',
          type: 'stripe-product-list',
          label: 'Checkout Product Display',
          props: {
            heading: 'Checkout display items',
            copy: 'These labels describe the deposit and processing fee shown at checkout. Amounts remain server-owned.',
            products: [
              { productKey: 'booking-deposit', label: 'Booking Deposit', displayName: 'Booking Deposit', displayPrice: '$50 deposit', checkoutMode: 'deposit', active: true },
              { productKey: 'processing-fee', label: 'Processing Fee', displayName: 'Processing Fee', displayPrice: '$5 fee', checkoutMode: 'fee', active: true }
            ]
          }
        }
      ]
    }),
    metadata: {
      excerpt: 'CMS-editable rental catalog for jet ski, boat, and bundle presentation. Checkout pricing remains code-owned.',
      featuredImage: mediaUrl('site/images/shoreline-jetski-group-collage.webp')
    },
    taxonomies: {
      categories: ['Rentals']
    },
    seo: {
      title: 'Rental Products | Shoreline Aquatics',
      description: 'Jet ski, boat, and bundle rental product catalog for Shoreline Aquatics.'
    }
  };
}

export const CMS_SLAQUATICS_SHARED_CONTENT: CmsContent[] = [
  createDefaultCmsContent({
    id: 'main-navigation',
    slug: 'main-navigation',
    title: 'Main Navigation',
    contentType: 'navigationMenu',
    blocks: [
      {
        id: 'main-navigation-menu',
        type: 'navigation-menu',
        label: 'Main Navigation Links',
        props: {
          menuItems: [
            { label: 'Fleet', href: '/#fleet' },
            { label: 'Book', href: '/#booking' },
            { label: 'Waiver', href: '/waiver' },
            { label: 'Call', href: 'tel:14696937164', variant: 'link' }
          ]
        }
      }
    ]
  }),
  createDefaultCmsContent({
    id: 'shoreline-theme',
    slug: 'shoreline-theme',
    title: 'Shoreline Theme Tokens',
    contentType: 'styleSettings',
    blocks: [
      {
        id: 'shoreline-theme-tokens',
        type: 'style-tokens',
        label: 'Theme Tokens',
        props: {
          styleTokens: {
            gold: '#f7c948',
            blue: '#0b4f8a',
            green: '#0f8a5f',
            ink: '#102033'
          }
        }
      }
    ]
  }),
  createDefaultCmsContent({
    id: 'lake-day-cta-pattern',
    slug: 'lake-day-cta-pattern',
    title: 'Lake Day CTA Pattern',
    contentType: 'pattern',
    blocks: [
      {
        id: 'lake-day-cta',
        type: 'cta-band',
        label: 'Lake Day CTA',
        props: {
          heading: 'Ready to get on Lake Lewisville?',
          copy: 'Choose your rental and send the booking request when your group is ready.',
          buttons: [{ label: 'Book Now', href: '/#booking', variant: 'primary' }]
        }
      }
    ]
  }),
  createDefaultCmsContent({
    id: 'rental-display-catalog',
    slug: 'rental-display-catalog',
    title: 'Rental Display Catalog',
    contentType: 'stripeCatalog',
    blocks: [
      {
        id: 'rental-display-catalog-list',
        type: 'stripe-catalog-display',
        label: 'Rental Display Catalog',
        props: {
          heading: 'Rental Display Pricing',
          copy: 'Display-only catalog mappings. Checkout pricing remains controlled by the booking and Stripe code.',
          editableAmounts: false,
          products: [
            {
              productKey: 'jetski',
              displayName: 'Jet Ski Rentals',
              displayPrice: 'Starting as low as $59/hr',
              checkoutMode: 'code-owned'
            },
            {
              productKey: 'partyboat',
              displayName: 'Boat Rental',
              displayPrice: 'Starting at $160/hr',
              checkoutMode: 'code-owned'
            }
          ]
        }
      }
    ]
  })
];

export const CMS_SLAQUATICS_CONTENT_LIBRARY: CmsContent[] = [
  ...CMS_SLAQUATICS_PAGE_CONTENT,
  createRentalProductListContent(),
  ...CMS_SLAQUATICS_SHARED_CONTENT
];

export function getSlaquaticsCmsFallbackContent(slug: string): CmsContent | null {
  const normalized = slug.replace(/^\/+|\/+$/g, '') || 'home';
  if (normalized === 'home/fleet') return CMS_HOME_FLEET_SECTION;
  return CMS_SLAQUATICS_CONTENT_LIBRARY.find((content) => content.slug === normalized) || null;
}

type CmsReferenceStore = Pick<CmsStore, 'getPublishedContent'>;

export async function loadSlaquaticsCmsContent(
  slug: string,
  storeFactory: () => Promise<CmsReferenceStore> = getCmsStore
): Promise<CmsContent | null> {
  let store: CmsReferenceStore | null = null;
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return resolveSlaquaticsCmsReferences(getSlaquaticsCmsFallbackContent(slug));
  }
  try {
    store = await storeFactory();
    const published = await store.getPublishedContent(slug);
    if (published) return resolveSlaquaticsCmsReferences(published, store);
  } catch {
    // Public rendering must remain available before CMS resources are provisioned.
  }
  return resolveSlaquaticsCmsReferences(getSlaquaticsCmsFallbackContent(slug), store || undefined);
}

export async function resolveSlaquaticsCmsReferences(content: CmsContent | null, store?: CmsReferenceStore): Promise<CmsContent | null> {
  if (!content) return null;
  const blocks = [];
  for (const block of content.blocks) {
    if (block.type === 'pattern-ref') {
      const reference = await loadSharedContentReference(block.props?.patternId, store);
      if (reference) {
        blocks.push(...reference.blocks.map((referencedBlock, index) => ({
          ...referencedBlock,
          id: `${block.id}-${referencedBlock.id}-${index}`
        })));
      }
      continue;
    }
    if (block.type === 'topbar' && typeof block.props?.menuId === 'string' && block.props.menuId) {
      const menu = await loadSharedContentReference(block.props.menuId, store);
      const menuBlock = menu?.blocks.find((item) => item.type === 'navigation-menu');
      if (menuBlock && Array.isArray(menuBlock.props?.menuItems)) {
        blocks.push({
          ...block,
          props: {
            ...block.props,
            links: menuBlock.props.menuItems
          }
        });
        continue;
      }
    }
    blocks.push(block);
  }
  if (content.contentType !== 'styleSettings' && !blocks.some((block) => block.type === 'style-tokens')) {
    const styleSettings = await loadSharedContentReference(activeStyleSettingsSlug, store);
    const styleBlock = styleSettings?.blocks.find((block) => block.type === 'style-tokens');
    const sanitized = styleBlock ? sanitizeStyleTokenBlock(styleBlock) : null;
    if (sanitized) blocks.push(sanitized);
  }
  return { ...content, blocks };
}

function sanitizeStyleTokenBlock(block: CmsContent['blocks'][number]): CmsContent['blocks'][number] | null {
  const rawTokens = block.props?.styleTokens;
  if (!rawTokens || typeof rawTokens !== 'object' || Array.isArray(rawTokens)) return null;
  const input = rawTokens as Record<string, unknown>;
  const styleTokens = Object.fromEntries(
    allowedThemeStyleTokens
      .map((token) => [token, safeThemeColor(input[token])])
      .filter((entry): entry is [typeof allowedThemeStyleTokens[number], string] => Boolean(entry[1]))
  );
  if (!Object.keys(styleTokens).length) return null;
  return {
    ...block,
    id: `${activeStyleSettingsSlug}-${block.id}`,
    props: {
      ...block.props,
      styleTokens
    }
  };
}

function safeThemeColor(value: unknown): string {
  if (typeof value !== 'string') return '';
  const color = value.trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) || /^rgb(a)?\([\d\s,%.]+\)$/i.test(color) ? color : '';
}

async function loadSharedContentReference(reference: unknown, store?: CmsReferenceStore): Promise<CmsContent | null> {
  if (typeof reference !== 'string' || !reference.trim()) return null;
  const normalized = reference.trim().replace(/^\/+|\/+$/g, '');
  const fallback = getFallbackReference(normalized);
  if (store) {
    try {
      const published = await store.getPublishedContent(normalized);
      if (published && isSharedReferenceType(published.contentType)) return published;
    } catch {
      // Shared references must fail closed to checked-in real content.
    }
  }
  return fallback && isSharedReferenceType(fallback.contentType) ? fallback : null;
}

function getFallbackReference(reference: string): CmsContent | null {
  return CMS_SLAQUATICS_SHARED_CONTENT.find((content) => content.slug === reference || content.id === reference) || null;
}

function isSharedReferenceType(contentType: CmsContent['contentType']) {
  return ['pattern', 'reusableSection', 'navigationMenu', 'styleSettings', 'stripeCatalog'].includes(contentType);
}
