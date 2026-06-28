'use client';

import { useEffect, useRef } from 'react';

type Booking = {
  publicToken?: string;
  paymentStatus?: string;
  depositAmount?: number;
  processingFeeAmount?: number;
  amountDueToday?: number;
  deposit?: boolean;
  total?: number;
  craftLabel?: string;
  durationLabel?: string;
  date?: string;
  time?: string;
  location?: string;
  name?: string;
  phone?: string;
};

const CONTACT_PHONE = '4696937164';

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

function formatCurrency(value: number | undefined) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatTimeLabel(value = '') {
  const [hourText = '', minuteText = '00'] = String(value).split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return value || '-';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minuteText} ${suffix}`;
}

function formatDateLabel(value = '') {
  if (!value) return '-';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function setText(id: string, value: string) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function mergeBooking(base: Booking | null, incoming: Booking = {}): Booking {
  return {
    ...(base || {}),
    ...(incoming || {}),
    paymentStatus: incoming.paymentStatus || base?.paymentStatus || 'unpaid',
    depositAmount: incoming.depositAmount || base?.depositAmount || 50,
    processingFeeAmount: incoming.processingFeeAmount || base?.processingFeeAmount || 5,
    amountDueToday: incoming.amountDueToday || base?.amountDueToday || 55,
    deposit: typeof incoming.deposit === 'boolean' ? incoming.deposit : Boolean(base?.deposit)
  };
}

function buildMessage(booking: Booking) {
  return [
    'Hi Shoreline Aquatics, I’m checking on this paid booking.',
    '',
    `Name: ${booking.name || ''}`,
    `Phone: ${booking.phone || ''}`,
    `Package: ${booking.craftLabel || ''}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Time: ${formatTimeLabel(booking.time)}`
  ].join('\n');
}

function updateRecoveryLinks(token = '') {
  const confirmationLink = byId<HTMLAnchorElement>('empty-confirmation-link');
  if (confirmationLink && token) confirmationLink.href = `../jetski-booking-confirmation/?booking=${encodeURIComponent(token)}`;
}

async function loadBookingByToken(token: string, signal: AbortSignal) {
  const response = await fetch(`/api/public/booking?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Could not load your booking details.');
  return payload.booking as Booking | null;
}

async function verifyCheckoutSession(sessionId: string, signal: AbortSignal) {
  const response = await fetch(`/api/public/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Could not verify the Stripe checkout session.');
  return payload as { booking?: Booking; session?: { paymentStatus?: string } };
}

function showEmpty(message?: string) {
  const empty = byId('empty-state');
  const wrap = byId('thankyou-wrap');
  if (empty) empty.hidden = false;
  if (wrap) wrap.hidden = true;
  if (message) {
    const paragraph = empty?.querySelector('p');
    if (paragraph) paragraph.textContent = message;
  }
}

function showBooking(booking: Booking) {
  const paidToday = booking.amountDueToday || ((booking.depositAmount || 50) + (booking.processingFeeAmount || 5));
  setText('summary-total', formatCurrency(booking.total));
  setText('summary-package', `${booking.craftLabel || ''} · ${booking.durationLabel || ''}`);
  setText('summary-date', formatDateLabel(booking.date));
  setText('summary-time', formatTimeLabel(booking.time));
  setText('summary-location', booking.location || 'Shoreline Aquatics launch, Point Vista Rd, Hickory Creek, TX');
  setText('summary-customer', booking.name ? `${booking.name} · ${booking.phone || ''}` : '-');
  setText('summary-deposit', formatCurrency(booking.depositAmount || 50));
  setText('summary-processing-fee', formatCurrency(booking.processingFeeAmount || 5));
  setText('summary-paid-today', formatCurrency(paidToday));
  setText('payment-status', `Paid today: ${formatCurrency(paidToday)}. Watch for your confirmation text or email.`);
  setText('next-package', `${booking.craftLabel || ''} · ${booking.durationLabel || ''}`);
  setText('next-date', formatDateLabel(booking.date));
  setText('next-time', formatTimeLabel(booking.time));
  const smsLink = byId<HTMLAnchorElement>('sms-link');
  if (smsLink) smsLink.href = `sms:${CONTACT_PHONE}?body=${encodeURIComponent(buildMessage(booking))}`;
  const wrap = byId('thankyou-wrap');
  const empty = byId('empty-state');
  if (wrap) wrap.hidden = false;
  if (empty) empty.hidden = true;
}

async function initThankYouPage(signal: AbortSignal) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const bookingToken = params.get('booking');
  updateRecoveryLinks(bookingToken || '');

  if (!bookingToken && !sessionId) {
    showEmpty();
    return;
  }

  let booking: Booking | null = null;

  if (sessionId) {
    try {
      const payload = await verifyCheckoutSession(sessionId, signal);
      booking = mergeBooking(booking, payload.booking || {});
      booking.paymentStatus = payload.session?.paymentStatus || booking.paymentStatus;
      booking.deposit = booking.paymentStatus === 'paid' || Boolean(booking.deposit);
      if (booking.paymentStatus !== 'paid') {
        showEmpty('The payment has not finished clearing yet. Head back to the contact, waiver, and checkout page if you need to try again.');
        return;
      }
    } catch (error) {
      showEmpty(error instanceof Error ? error.message : 'We could not verify the booking payment right now.');
      return;
    }
  }

  if (!booking && bookingToken) {
    try {
      booking = await loadBookingByToken(bookingToken, signal);
      updateRecoveryLinks(booking?.publicToken || bookingToken);
    } catch (error) {
      showEmpty(error instanceof Error ? error.message : 'We could not load the booking details right now.');
      return;
    }
  }

  if (!booking || (booking.paymentStatus !== 'paid' && !booking.deposit)) {
    showEmpty();
    return;
  }

  updateRecoveryLinks(booking.publicToken || bookingToken || '');
  showBooking(booking);
}

export function BookingThankYouClientBehavior() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();
    void initThankYouPage(controller.signal);
    return () => controller.abort();
  }, []);

  return null;
}
