import type { CmsContent } from '../cms/core.ts';

export type BookingFlowPanelContent = {
  heading: string;
  copy: string;
  calendarHeading: string;
  calendarCopy: string;
  selectedLabel: string;
  calendarSummaryCopy: string;
  requestedDateLabel: string;
  timeLabel: string;
  holidayTitle: string;
  holidayNote: string;
  summaryKicker: string;
  summaryHeading: string;
  dueTodayLabel: string;
  changePackageNote: string;
  addonsKicker: string;
  addons: {
    id: 'drone' | 'karaoke' | 'tube';
    label: string;
    priceLabel: string;
  }[];
  submitLabel: string;
  footerNote: string;
};

export type WaiverPaymentSummaryContent = {
  kicker: string;
  heading: string;
  copy: string;
  returningKicker: string;
  returningTitle: string;
  returningCopy: string;
  contactLabel: string;
  waiverLabel: string;
  waiverHeading: string;
  waiverCopy: string;
  waiverTermsLabel: string;
  waiverTermsHref: string;
  agreementKicker: string;
  legalItems: string[];
  paymentStrong: string;
  paymentCopy: string;
  statusCopy: string;
  submitLabel: string;
};

export const defaultBookingFlowPanelContent: BookingFlowPanelContent = {
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
};

export const defaultWaiverPaymentSummaryContent: WaiverPaymentSummaryContent = {
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
    'The rider accepts responsibility for operating the equipment safely and following instructions throughout the rental.',
    'The rider releases the rental provider from claims tied to normal participation risks and authorizes the waiver to stay on file.'
  ],
  paymentStrong: 'Pay today:',
  paymentCopy: '$55 total. That includes a $50 booking deposit and a $5 processing fee. The remaining rental balance is handled directly before launch.',
  statusCopy: 'Finish the form, then pay $55 today to hold the rental date.',
  submitLabel: 'Pay $55 today'
};

export function bookingFlowPanelFromCms(content: CmsContent | null): BookingFlowPanelContent {
  const props = findBlockProps(content, 'booking-flow-panel');
  return {
    ...defaultBookingFlowPanelContent,
    heading: textProp(props.heading, defaultBookingFlowPanelContent.heading),
    copy: textProp(props.copy, defaultBookingFlowPanelContent.copy),
    calendarHeading: textProp(props.calendarHeading, defaultBookingFlowPanelContent.calendarHeading),
    calendarCopy: textProp(props.calendarCopy, defaultBookingFlowPanelContent.calendarCopy),
    selectedLabel: textProp(props.selectedLabel, defaultBookingFlowPanelContent.selectedLabel),
    calendarSummaryCopy: textProp(props.calendarSummaryCopy, defaultBookingFlowPanelContent.calendarSummaryCopy),
    requestedDateLabel: textProp(props.requestedDateLabel, defaultBookingFlowPanelContent.requestedDateLabel),
    timeLabel: textProp(props.timeLabel, defaultBookingFlowPanelContent.timeLabel),
    holidayTitle: textProp(props.holidayTitle, defaultBookingFlowPanelContent.holidayTitle),
    holidayNote: textProp(props.holidayNote, defaultBookingFlowPanelContent.holidayNote),
    summaryKicker: textProp(props.summaryKicker, defaultBookingFlowPanelContent.summaryKicker),
    summaryHeading: textProp(props.summaryHeading, defaultBookingFlowPanelContent.summaryHeading),
    dueTodayLabel: textProp(props.dueTodayLabel, defaultBookingFlowPanelContent.dueTodayLabel),
    changePackageNote: textProp(props.changePackageNote, defaultBookingFlowPanelContent.changePackageNote),
    addonsKicker: textProp(props.addonsKicker, defaultBookingFlowPanelContent.addonsKicker),
    addons: addonProps(props.addons),
    submitLabel: textProp(props.submitLabel, defaultBookingFlowPanelContent.submitLabel),
    footerNote: textProp(props.footerNote, defaultBookingFlowPanelContent.footerNote)
  };
}

export function waiverPaymentSummaryFromCms(content: CmsContent | null): WaiverPaymentSummaryContent {
  const props = findBlockProps(content, 'waiver-payment-summary');
  return {
    ...defaultWaiverPaymentSummaryContent,
    kicker: textProp(props.kicker, defaultWaiverPaymentSummaryContent.kicker),
    heading: textProp(props.heading, defaultWaiverPaymentSummaryContent.heading),
    copy: textProp(props.copy, defaultWaiverPaymentSummaryContent.copy),
    returningKicker: textProp(props.returningKicker, defaultWaiverPaymentSummaryContent.returningKicker),
    returningTitle: textProp(props.returningTitle, defaultWaiverPaymentSummaryContent.returningTitle),
    returningCopy: textProp(props.returningCopy, defaultWaiverPaymentSummaryContent.returningCopy),
    contactLabel: textProp(props.contactLabel, defaultWaiverPaymentSummaryContent.contactLabel),
    waiverLabel: textProp(props.waiverLabel, defaultWaiverPaymentSummaryContent.waiverLabel),
    waiverHeading: textProp(props.waiverHeading, defaultWaiverPaymentSummaryContent.waiverHeading),
    waiverCopy: textProp(props.waiverCopy, defaultWaiverPaymentSummaryContent.waiverCopy),
    waiverTermsLabel: textProp(props.waiverTermsLabel, defaultWaiverPaymentSummaryContent.waiverTermsLabel),
    waiverTermsHref: textProp(props.waiverTermsHref, defaultWaiverPaymentSummaryContent.waiverTermsHref),
    agreementKicker: textProp(props.agreementKicker, defaultWaiverPaymentSummaryContent.agreementKicker),
    legalItems: stringListProp(props.legalItems, defaultWaiverPaymentSummaryContent.legalItems),
    paymentStrong: textProp(props.paymentStrong, defaultWaiverPaymentSummaryContent.paymentStrong),
    paymentCopy: textProp(props.paymentCopy, defaultWaiverPaymentSummaryContent.paymentCopy),
    statusCopy: textProp(props.statusCopy, defaultWaiverPaymentSummaryContent.statusCopy),
    submitLabel: textProp(props.submitLabel, defaultWaiverPaymentSummaryContent.submitLabel)
  };
}

function findBlockProps(content: CmsContent | null, type: string): Record<string, unknown> {
  return content?.blocks.find((block) => block.type === type)?.props || {};
}

function textProp(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function stringListProp(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value)
    ? value.map((item) => typeof item === 'string' ? item.trim() : '').filter(Boolean).slice(0, 12)
    : fallback;
}

function addonProps(value: unknown): BookingFlowPanelContent['addons'] {
  if (!Array.isArray(value)) return defaultBookingFlowPanelContent.addons;
  const allowed = new Set(['drone', 'karaoke', 'tube']);
  const addons = value
    .map((item) => item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null)
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      id: typeof item.id === 'string' && allowed.has(item.id) ? item.id as 'drone' | 'karaoke' | 'tube' : '',
      label: textProp(item.label, ''),
      priceLabel: textProp(item.priceLabel, '')
    }))
    .filter((item): item is BookingFlowPanelContent['addons'][number] => Boolean(item.id && item.label && item.priceLabel));
  return addons.length ? addons : defaultBookingFlowPanelContent.addons;
}
