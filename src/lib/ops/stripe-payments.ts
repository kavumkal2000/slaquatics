import crypto from 'node:crypto';
import { assertPublicSlotAvailable, priceForSelection, publicBookingPayload } from './public-api.ts';
import { sendResendEmail } from './outbound.ts';
import { renderBookingConfirmationEmail } from './email-templates.ts';
import { LAUNCH_LOCATION_LABEL, LAUNCH_MAPS_URL, arrivalDirectionsText } from '../launch-info.ts';
import type { OpsState } from './default-state.ts';

const BOOKING_DEPOSIT_CENTS = 5000;
const PROCESSING_FEE_CENTS = 500;
const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
const seenStripeEvents = new Map<string, number>();

function nextId(items: any[]) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function digits(value = '') {
  return String(value || '').replace(/\D+/g, '');
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function craftLabel(craft = '') {
  const labels: Record<string, string> = {
    jetski2: '2 Yamaha Jet Skis',
    jetski3: '3 Yamaha Jet Skis',
    jetski4: '4 Yamaha Jet Skis',
    boat: 'Boat Rental',
    partyboat: 'Boat Rental (up to 14)',
    bundle2: '2 Yamaha Jet Skis + Boat',
    bundle3: '3 Yamaha Jet Skis + Boat',
    bundle4: '4 Yamaha Jet Skis + Boat'
  };
  return labels[craft] || craft || '2 Yamaha Jet Skis';
}

function durationLabel(duration: number) {
  if (duration === 8) return 'Full Day (8 Hours)';
  return `${duration} Hour${duration === 1 ? '' : 's'}`;
}

function publicToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

function isTruthyWaiver(waiver: any) {
  return Boolean(waiver?.acceptedRisk && waiver?.acceptedDamage && waiver?.signature);
}

function findCustomer(state: OpsState, payload: Record<string, any>) {
  const phone = digits(payload.phone);
  const email = normalizeEmail(payload.email);
  return state.customers.find((customer) => (
    (phone && digits(customer.phone) === phone) ||
    (email && normalizeEmail(customer.email) === email)
  )) || null;
}

function findBooking(state: OpsState, payload: Record<string, any>) {
  const token = String(payload.publicToken || payload.bookingToken || payload.token || '').trim();
  if (token) {
    const byToken = state.bookings.find((booking) => String(booking.publicToken || '') === token);
    if (byToken) return byToken;
  }
  const phone = digits(payload.phone);
  return state.bookings.find((booking) => (
    phone &&
    digits(booking.phone) === phone &&
    String(booking.date || '') === String(payload.date || '') &&
    String(booking.time || '') === String(payload.time || '')
  )) || null;
}

export function ensureBookingInvoice(state: OpsState, booking: any, now = new Date().toISOString()) {
  if (!booking?.id) return null;
  const existing = state.invoices.find((invoice) => Number(invoice.bookingId || 0) === Number(booking.id));
  const invoice = existing || { id: nextId(state.invoices), bookingId: booking.id, createdAt: now };
  Object.assign(invoice, {
    customerName: booking.name || '',
    customerEmail: booking.email || '',
    issueDate: now.split('T')[0],
    dueDate: booking.date || now.split('T')[0],
    items: booking.craftLabel || booking.craft || '',
    amount: Number(booking.total || 0),
    collected: booking.deposit ? Number(booking.amountDueToday || 55) : 0,
    status: booking.deposit ? 'paid' : 'open',
    paymentSessionId: booking.paymentSessionId || '',
    paymentIntentId: booking.paymentIntentId || '',
    updatedAt: now
  });
  if (!existing) state.invoices.push(invoice);
  return invoice;
}

export function upsertCheckoutBooking(state: OpsState, payload: Record<string, any>, now = new Date().toISOString()) {
  if (!payload?.name || !payload?.phone || !payload?.date || !payload?.time) {
    throw new Error('Customer name, phone number, requested date, and start time are required.');
  }
  if (!isTruthyWaiver(payload.waiver)) {
    throw new Error('A completed waiver is required before saving this booking request.');
  }

  const pricing = priceForSelection(payload);
  let booking = findBooking(state, payload);
  assertPublicSlotAvailable(state, payload, pricing, booking);
  let customer = findCustomer(state, payload);
  if (!customer) {
    customer = { id: nextId(state.customers), bookings: 0, totalSpent: 0, createdAt: now.split('T')[0], source: 'Website Booking' };
    state.customers.push(customer);
  }
  customer.name = String(payload.name || '').trim();
  customer.phone = String(payload.phone || '').trim();
  customer.email = String(payload.email || '').trim();
  customer.lastActivity = now;
  customer.waiverSignedAt = now;
  customer.waiverSignature = String(payload.waiver.signature || '').trim();
  customer.waiver = {
    acceptedRisk: Boolean(payload.waiver.acceptedRisk),
    acceptedDamage: Boolean(payload.waiver.acceptedDamage),
    verified: Boolean(payload.waiver.verified),
    initials: String(payload.waiver.initials || '').trim(),
    signature: String(payload.waiver.signature || '').trim(),
    signedAt: now,
    signatureDate: String(payload.waiver.signatureDate || now.split('T')[0]).trim(),
    emergencyName: String(payload.waiver.emergencyName || '').trim(),
    emergencyPhone: String(payload.waiver.emergencyPhone || '').trim()
  };

  if (!booking) {
    booking = { id: nextId(state.bookings), createdAt: now, status: 'pending', deposit: false };
    state.bookings.push(booking);
  }
  Object.assign(booking, {
    publicToken: String(payload.publicToken || payload.bookingToken || booking.publicToken || publicToken()).trim(),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    craft: pricing.publicCraft,
    craftKey: pricing.craft,
    craftLabel: pricing.craftLabel,
    duration: pricing.duration,
    durationLabel: pricing.durationLabel,
    total: pricing.total,
    baseTotal: pricing.baseTotal,
    drone: pricing.drone,
    droneAmount: pricing.droneAmount,
    karaoke: pricing.karaoke,
    karaokeAmount: pricing.karaokeAmount,
    tube: pricing.tube,
    tubeAmount: pricing.tubeAmount,
    date: String(payload.date || '').trim(),
    time: String(payload.time || '').trim(),
    location: String(payload.location || LAUNCH_LOCATION_LABEL).trim(),
    contactMethod: String(payload.contactMethod || 'text').trim(),
    partySize: String(payload.partySize || '').trim(),
    notes: String(payload.notes || '').trim(),
    customerId: customer.id,
    source: 'Website Booking',
    waiverAccepted: true,
    waiverSignedAt: customer.waiverSignedAt,
    waiverSignature: customer.waiverSignature,
    waiver: customer.waiver,
    depositAmount: pricing.depositAmount,
    processingFeeAmount: pricing.processingFeeAmount,
    amountDueToday: pricing.amountDueToday,
    paymentStatus: booking.deposit ? 'paid' : String(booking.paymentStatus || 'unpaid'),
    updatedAt: now
  });
  customer.bookings = state.bookings.filter((entry) => Number(entry.customerId || 0) === Number(customer.id)).length;
  ensureBookingInvoice(state, booking, now);
  return { booking, customer };
}

function flattenStripeParams(value: any, prefix = '', out = new URLSearchParams()) {
  if (value === undefined || value === null) return out;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => flattenStripeParams(entry, `${prefix}[${index}]`, out));
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      flattenStripeParams(entry, prefix ? `${prefix}[${key}]` : key, out);
    }
    return out;
  }
  out.append(prefix, String(value));
  return out;
}

function stripeSecret() {
  return process.env.STRIPE_SECRET_KEY || '';
}

export function stripeConfigured() {
  return Boolean(stripeSecret());
}

export function stripeWebhookConfigured() {
  return Boolean(stripeSecret() && process.env.STRIPE_WEBHOOK_SECRET);
}

export function deriveSiteOrigin(request: Request, override = '') {
  const preferred = String(override || '').replace(/\/+$/, '');
  if (/^https?:\/\/[^/]+$/i.test(preferred)) return preferred;
  const origin = String(request.headers.get('origin') || '').replace(/\/+$/, '');
  const hostname = /^https?:\/\/[^/]+$/i.test(origin) ? new URL(origin).hostname : '';
  const legacyManagedHostSuffix = [`on${'render'}`, 'com'].join('.');
  if (origin && hostname && !hostname.endsWith(legacyManagedHostSuffix)) return origin;
  return String(process.env.PUBLIC_SITE_URL || 'https://slaquatics.com').replace(/\/+$/, '');
}

export async function createStripeCheckoutSession(params: Record<string, any>) {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: flattenStripeParams(params)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error?.message || json?.message || 'Could not start Stripe checkout.');
  return json;
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${stripeSecret()}` }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error?.message || json?.message || 'Could not verify the Stripe checkout session.');
  return json;
}

export function findBookingForStripeSession(state: OpsState, session: any = {}) {
  const bookingId = Number(session?.metadata?.bookingId || session?.client_reference_id || 0);
  if (bookingId) {
    const byId = state.bookings.find((booking) => Number(booking.id || 0) === bookingId);
    if (byId) return byId;
  }
  const sessionId = String(session?.id || '');
  return state.bookings.find((booking) => String(booking.paymentSessionId || '') === sessionId) || null;
}

export function applyStripeSessionToBooking(state: OpsState, session: any = {}, now = new Date().toISOString()) {
  const booking = findBookingForStripeSession(state, session);
  if (!booking) return null;
  booking.paymentSessionId = String(session.id || booking.paymentSessionId || '');
  booking.paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : String(booking.paymentIntentId || '');
  booking.depositAmount = Number((Number(booking.depositAmount || 50)).toFixed(2));
  booking.processingFeeAmount = Number((Number(session?.metadata?.processingFeeAmount) || Number(booking.processingFeeAmount || 5)).toFixed(2));
  booking.amountDueToday = Number(((Number(session.amount_total || 5500)) / 100).toFixed(2));
  const alreadyPaid = booking.deposit === true || String(booking.paymentStatus || '').toLowerCase() === 'paid';
  const sessionPaid = session.payment_status === 'paid';
  if (sessionPaid || !alreadyPaid) {
    booking.paymentStatus = String(session.payment_status || booking.paymentStatus || 'pending');
    booking.deposit = booking.paymentStatus === 'paid';
    booking.paymentCompletedAt = booking.deposit ? now : String(booking.paymentCompletedAt || '');
  }
  if (session?.metadata?.bookingToken && !booking.publicToken) booking.publicToken = String(session.metadata.bookingToken);
  booking.updatedAt = now;
  ensureBookingInvoice(state, booking, now);
  return booking;
}

export async function sendBookingConfirmationEmail(state: OpsState, booking: any, session: any = {}, now = new Date().toISOString()) {
  if (!booking || booking.paymentStatus !== 'paid' || !booking.deposit) {
    return { sent: false, reason: 'booking-not-paid' };
  }
  if (booking.confirmationEmailSentAt || booking.confirmationEmailSent) {
    return { sent: false, reason: 'already-sent' };
  }
  if (!booking.email) {
    return { sent: false, reason: 'missing-recipient' };
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }

  const subject = `Shoreline Aquatics booking confirmed — ${booking.date || 'launch day'}`;
  const lines = [
    `Hi ${String(booking.name || 'there').trim() || 'there'},`,
    '',
    'Your Shoreline Aquatics booking deposit is paid and your reservation is confirmed.',
    '',
    `Rental: ${booking.craftLabel || booking.craft || 'Shoreline rental'}`,
    `Date: ${booking.date || ''}`,
    `Time: ${booking.time || ''}`,
    `Amount paid today: $${Number(booking.amountDueToday || 55).toFixed(2)}`,
    `Meeting spot: ${booking.location || LAUNCH_LOCATION_LABEL}`,
    `Maps: ${LAUNCH_MAPS_URL}`,
    '',
    'Point Vista Park directions:',
    arrivalDirectionsText(),
    '',
    'We will see you at the launch.'
  ];
  const text = lines.join('\n');
  const html = renderBookingConfirmationEmail({
    booking,
    mapsUrl: LAUNCH_MAPS_URL,
    directions: arrivalDirectionsText()
  });
  const result = await sendResendEmail({
    to: booking.email,
    subject,
    text,
    html,
    idempotencyKey: `shoreline-booking-confirmation-${booking.id}-${session?.id || booking.paymentSessionId || 'paid'}`
  });

  booking.confirmationEmailSent = true;
  booking.confirmationEmailSentAt = now;
  booking.confirmationEmailId = String(result?.id || '');
  booking.updatedAt = now;
  state.communicationsLog.unshift({
    id: nextId(state.communicationsLog),
    date: now,
    customerId: booking.customerId || 0,
    customerName: booking.name || booking.email,
    channel: 'booking-confirmation-email',
    message: `Paid booking confirmation sent to ${booking.email} for ${booking.craftLabel || booking.craft || 'booking'} on ${booking.date || ''} at ${booking.time || ''}.`
  });
  return { sent: true, result };
}

export function stripeSessionPublicPayload(session: any) {
  return {
    id: session.id,
    status: session.status,
    paymentStatus: session.payment_status,
    amountTotal: Number(((session.amount_total || 0) / 100).toFixed(2)),
    customerEmail: session.customer_details?.email || session.customer_email || '',
    customerName: session.customer_details?.name || '',
    bookingId: session.metadata?.bookingId || session.client_reference_id || '',
    bookingToken: session.metadata?.bookingToken || ''
  };
}

export function verifyStripeWebhook(rawBody: string, signatureHeader = '') {
  if (!stripeWebhookConfigured()) throw new Error('Stripe webhook handling is not configured yet.');
  const timestamp = signatureHeader.match(/(?:^|,)t=([^,]+)/)?.[1] || '';
  const signature = signatureHeader.match(/(?:^|,)v1=([^,]+)/)?.[1] || '';
  if (!timestamp || !signature) throw new Error('Missing Stripe signature header.');
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) throw new Error('Invalid Stripe signature timestamp.');
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error('Stripe signature timestamp is outside the allowed tolerance.');
  }
  const expected = crypto
    .createHmac('sha256', String(process.env.STRIPE_WEBHOOK_SECRET || ''))
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error('Invalid Stripe signature.');
  }
  const event = JSON.parse(rawBody);
  const eventId = String(event?.id || '').trim();
  const now = Date.now();
  for (const [id, expiresAt] of seenStripeEvents) {
    if (expiresAt <= now) seenStripeEvents.delete(id);
  }
  if (eventId) {
    if (seenStripeEvents.has(eventId)) throw new Error('Duplicate Stripe webhook event.');
    seenStripeEvents.set(eventId, now + (STRIPE_WEBHOOK_TOLERANCE_SECONDS * 1000));
  }
  return event;
}

export { publicBookingPayload };
