'use client';

import { useEffect, useRef } from 'react';
import { LAUNCH_LOCATION_LABEL } from '../../lib/launch-info';

type WaiverPayload = {
  acceptedRisk: boolean;
  acceptedDamage: boolean;
  verified: boolean;
  dateOfBirth: string;
  initials: string;
  signature: string;
  signatureDate: string;
  emergencyName: string;
  emergencyPhone: string;
};

type Booking = {
  id?: string;
  publicToken?: string;
  bookingToken?: string;
  paymentStatus?: string;
  depositAmount?: number;
  processingFeeAmount?: number;
  amountDueToday?: number;
  deposit?: boolean;
  total?: number;
  craft?: string;
  craftKey?: string;
  craftLabel?: string;
  durationLabel?: string;
  date?: string;
  time?: string;
  location?: string;
  name?: string;
  phone?: string;
  email?: string;
  contactMethod?: string;
  partySize?: string;
  notes?: string;
  drone?: boolean;
  karaoke?: boolean;
  tube?: boolean;
  crmMatchId?: string | null;
  waiver?: Partial<WaiverPayload>;
  syncMeta?: Record<string, unknown>;
};

type Customer = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  bookings?: number;
  lastBooking?: string;
  waiverOnFile?: boolean;
  waiverVerified?: boolean;
  dateOfBirth?: string;
  waiverInitials?: string;
  waiverSignature?: string;
  contactMethod?: string;
};

const CONTACT_PHONE = '4696937164';
const CONTACT_EMAIL = 'shorelinerentals3@gmail.com';

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const input = (id: string) => byId<HTMLInputElement>(id);
const checkbox = (id: string) => byId<HTMLInputElement>(id);

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
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function todayLocalIso() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizePhoneKey(value = '') {
  return String(value).replace(/\D/g, '');
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function setText(id: string, value: string) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function setValue(id: string, value: string | number | undefined) {
  const element = input(id);
  if (element && value !== undefined && value !== null) element.value = String(value);
}

function mergeBooking(base: Booking | null, incoming: Booking = {}): Booking {
  return {
    ...(base || {}),
    ...(incoming || {}),
    publicToken: incoming.publicToken || base?.publicToken || '',
    paymentStatus: incoming.paymentStatus || base?.paymentStatus || 'unpaid',
    depositAmount: incoming.depositAmount || base?.depositAmount || 50,
    processingFeeAmount: incoming.processingFeeAmount || base?.processingFeeAmount || 5,
    amountDueToday: incoming.amountDueToday || base?.amountDueToday || 55,
    deposit: typeof incoming.deposit === 'boolean' ? incoming.deposit : Boolean(base?.deposit)
  };
}

function createConfirmationController(signal: AbortSignal) {
  let activeBooking: Booking | null = null;
  let stripeReady = false;
  let matchedCustomer: Customer | null = null;
  let lastLookupKey = '';
  let waiverAutoApplied = false;

  const setStatus = (message: string, tone = '') => {
    const status = byId('copy-status');
    if (!status) return;
    status.textContent = message;
    status.className = `status${tone ? ` ${tone}` : ''}`;
  };

  const buildMessage = (booking: Booking) => [
    'Hi Shoreline Aquatics, I want to finalize this booking.',
    '',
    `Name: ${booking.name || ''}`,
    `Phone: ${booking.phone || ''}`,
    `Email: ${booking.email || 'Not provided'}`,
    `Package: ${booking.craftLabel || ''}`,
    `Duration: ${booking.durationLabel || ''}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Time: ${formatTimeLabel(booking.time)}`,
    `Party size: ${booking.partySize || 'Not provided'}`,
    `Aerial drone coverage: ${booking.drone ? 'Yes' : 'No'}`,
    `Karaoke setup: ${booking.karaoke ? 'Yes' : 'No'}`,
    `Towable tube: ${booking.tube ? 'Yes' : 'No'}`,
    `Meeting spot: ${booking.location || LAUNCH_LOCATION_LABEL}`,
    `Quoted total: $${Number(booking.total || 0).toLocaleString()}`,
    `Booking payment: ${booking.paymentStatus === 'paid' || booking.deposit ? '$55 paid ($50 deposit + $5 processing fee)' : '$55 due today ($50 deposit + $5 processing fee)'}`,
    `Notes: ${booking.notes || 'None'}`
  ].join('\n');

  const populateSummary = (booking: Booking) => {
    const craftKey = booking.craftKey || booking.craft || '';
    setText('summary-total', formatCurrency(booking.total));
    setText('summary-package', `${booking.craftLabel || ''} · ${booking.durationLabel || ''}`);
    setText('summary-note', (craftKey === 'boat' || craftKey === 'partyboat')
      ? 'Your boat rental with captain included is ready for the contact, waiver, and checkout step.'
      : craftKey.startsWith('bundle')
        ? 'Your lake-day bundle is ready for the contact, waiver, and checkout step.'
        : 'Your Yamaha jet ski rental is ready for the contact, waiver, and checkout step.');
    setText('summary-date', formatDateLabel(booking.date));
    setText('summary-time', formatTimeLabel(booking.time));
    setText('summary-location', booking.location || LAUNCH_LOCATION_LABEL);
    setText('summary-party', String(booking.partySize || '2'));
  };

  const populateForm = (booking: Booking | null) => {
    if (!booking) return;
    setValue('name', booking.name);
    setValue('phone', booking.phone);
    setValue('email', booking.email);
    setValue('party-size', booking.partySize);
    setValue('notes', booking.notes);
    setValue('date-of-birth', booking.waiver?.dateOfBirth);
    if (booking.waiver?.acceptedRisk && checkbox('waiver-risk')) checkbox('waiver-risk')!.checked = true;
    if (booking.waiver?.acceptedDamage && checkbox('waiver-damage')) checkbox('waiver-damage')!.checked = true;
    if (booking.waiver?.verified && checkbox('waiver-verify')) checkbox('waiver-verify')!.checked = true;
    setValue('waiver-initials', booking.waiver?.initials);
    setValue('signature', booking.waiver?.signature);
    setValue('signature-date', booking.waiver?.signatureDate);
  };

  const updatePaymentUi = (booking: Booking | null) => {
    const depositAmount = Number(booking?.depositAmount || 50);
    const processingFeeAmount = Number(booking?.processingFeeAmount || 5);
    const amountDueToday = Number(booking?.amountDueToday || (depositAmount + processingFeeAmount));
    const paymentStatus = booking?.paymentStatus === 'paid' || booking?.deposit
      ? `Paid today: ${formatCurrency(amountDueToday)}`
      : booking?.paymentStatus === 'pending'
        ? `Checkout started for ${formatCurrency(amountDueToday)}`
        : booking?.paymentStatus === 'expired'
          ? 'Checkout expired'
          : 'Not paid yet';
    setText('summary-deposit', formatCurrency(depositAmount));
    setText('summary-payment-status', paymentStatus);

    const stripeButton = byId<HTMLButtonElement>('stripe-link');
    if (!stripeButton) return;
    if (!stripeReady) {
      stripeButton.textContent = 'Online deposit unavailable';
      stripeButton.setAttribute('aria-disabled', 'true');
      stripeButton.disabled = true;
      return;
    }
    if (booking?.paymentStatus === 'paid' || booking?.deposit) {
      stripeButton.textContent = `Paid ${formatCurrency(amountDueToday)}`;
      stripeButton.setAttribute('aria-disabled', 'true');
      stripeButton.disabled = true;
      return;
    }
    stripeButton.textContent = `Pay ${formatCurrency(amountDueToday)} today`;
    stripeButton.removeAttribute('aria-disabled');
    stripeButton.disabled = false;
  };

  const createPayload = (requireBase = true): Booking | null => {
    const base = activeBooking;
    if (!base && requireBase) return null;
    return {
      ...(base || {}),
      name: input('name')?.value.trim() || '',
      phone: input('phone')?.value.trim() || '',
      email: input('email')?.value.trim() || '',
      location: base?.location || LAUNCH_LOCATION_LABEL,
      contactMethod: base?.contactMethod || matchedCustomer?.contactMethod || 'text',
      partySize: input('party-size')?.value || '',
      notes: byId<HTMLTextAreaElement>('notes')?.value.trim() || '',
      crmMatchId: matchedCustomer?.id || base?.crmMatchId || null,
      waiver: {
        acceptedRisk: checkbox('waiver-risk')?.checked || false,
        acceptedDamage: checkbox('waiver-damage')?.checked || false,
        verified: checkbox('waiver-verify')?.checked || false,
        dateOfBirth: input('date-of-birth')?.value || '',
        initials: input('waiver-initials')?.value.trim() || '',
        signature: input('signature')?.value.trim() || '',
        signatureDate: input('signature-date')?.value || '',
        emergencyName: '',
        emergencyPhone: ''
      }
    };
  };

  const updateContactLinks = () => {
    const booking = createPayload(false);
    if (!booking) return;
    const smsLink = byId<HTMLAnchorElement>('sms-link');
    const emailLink = byId<HTMLAnchorElement>('email-link');
    if (!smsLink && !emailLink) return;
    const message = buildMessage(booking);
    if (smsLink) smsLink.href = `sms:${CONTACT_PHONE}?body=${encodeURIComponent(message)}`;
    if (emailLink) {
      const subject = encodeURIComponent(`Booking request from ${booking.name || 'Shoreline customer'}`);
      emailLink.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(message)}`;
    }
  };

  const hideMatchedCustomer = () => {
    byId('match-card')?.classList.remove('show');
  };

  const showMatchedCustomer = (customer: Customer) => {
    const card = byId('match-card');
    const chips = byId('match-chips');
    if (!card || !chips) return;
    const repeatLabel = Number(customer.bookings || 0) > 1 ? 'Repeat rider' : 'Returning guest';
    setText('match-title', `${customer.name || 'Rider'} recognized`);
    setText('match-copy', customer.waiverOnFile
      ? 'Welcome back! We have a waiver on file. Please confirm your details below to finish.'
      : "Welcome back! Finish your details below and you're set.");
    const chipValues = [
      repeatLabel,
      customer.lastBooking ? `Last booking ${customer.lastBooking}` : '',
      customer.waiverOnFile ? 'Waiver saved' : '',
      customer.email ? 'Email ready' : ''
    ].filter(Boolean);
    chips.replaceChildren(...chipValues.map((value) => {
      const chip = document.createElement('span');
      chip.className = 'match-chip';
      chip.textContent = value;
      return chip;
    }));
    card.classList.add('show');
  };

  const clearAutoAppliedWaiver = () => {
    if (!waiverAutoApplied) return;
    ['waiver-risk', 'waiver-damage', 'waiver-verify'].forEach((id) => {
      const item = checkbox(id);
      if (item) item.checked = false;
    });
    waiverAutoApplied = false;
  };

  const applyCustomerPrefill = (customer: Customer) => {
    matchedCustomer = customer;
    if (!input('name')?.value.trim()) setValue('name', customer.name);
    if (!input('phone')?.value.trim()) setValue('phone', customer.phone);
    if (!input('email')?.value.trim()) setValue('email', customer.email);
    if (customer.waiverOnFile) {
      if (checkbox('waiver-risk')) checkbox('waiver-risk')!.checked = true;
      if (checkbox('waiver-damage')) checkbox('waiver-damage')!.checked = true;
      if (checkbox('waiver-verify')) checkbox('waiver-verify')!.checked = Boolean(customer.waiverVerified);
      if (!input('date-of-birth')?.value) setValue('date-of-birth', customer.dateOfBirth);
      if (!input('waiver-initials')?.value.trim()) setValue('waiver-initials', customer.waiverInitials);
      if (!input('signature')?.value.trim()) setValue('signature', customer.waiverSignature || customer.name);
      if (!input('signature-date')?.value) setValue('signature-date', todayLocalIso());
      waiverAutoApplied = true;
    }
    showMatchedCustomer(customer);
    updateContactLinks();
  };

  const lookupReturningCustomer = async (force = false) => {
    const phone = input('phone')?.value.trim() || '';
    const email = input('email')?.value.trim() || '';
    if (!phone && !email) {
      matchedCustomer = null;
      clearAutoAppliedWaiver();
      hideMatchedCustomer();
      return;
    }
    const lookupKey = `${normalizePhoneKey(phone)}|${normalizeEmail(email)}`;
    if (!force && lookupKey === lastLookupKey) return;
    lastLookupKey = lookupKey;
    try {
      const params = new URLSearchParams();
      if (phone) params.set('phone', phone);
      if (email) params.set('email', email);
      const response = await fetch(`/api/public/customer-lookup?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal
      });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (payload.found && payload.customer) applyCustomerPrefill(payload.customer as Customer);
      else {
        matchedCustomer = null;
        clearAutoAppliedWaiver();
        hideMatchedCustomer();
      }
    } catch (error) {
      console.warn('Customer lookup skipped:', error);
    }
  };

  const validatePayload = (payload: Booking | null) => {
    if (!payload?.date || !payload?.time || !payload?.craft) return 'Please start on the calendar page and choose the rental date and package first.';
    if (payload.date < todayLocalIso()) return 'That rental date has already passed. Please head back to the calendar and pick a new date.';
    if (!payload.name || !payload.phone) return 'Please fill in the rider name and phone number before paying the deposit.';
    if (!payload.waiver?.acceptedRisk || !payload.waiver?.acceptedDamage) return 'Please confirm the waiver terms before paying the deposit.';
    if (!payload.waiver?.verified || !payload.waiver?.dateOfBirth || !payload.waiver?.initials) return 'Please complete the date of birth, participant initials, and verification for the waiver.';
    if (!payload.waiver?.signature || !payload.waiver?.signatureDate) return 'Please provide the rider signature and waiver date.';
    return '';
  };

  const syncBookingToOps = async (payload: Booking) => {
    const response = await fetch('/api/public/booking-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'We could not save your booking right now.');
    return body;
  };

  const loadStripeAvailability = async () => {
    try {
      const response = await fetch('/api/public/integrations/status', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal
      });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      stripeReady = Boolean(payload?.integrations?.stripeConfigured);
    } catch {
      stripeReady = false;
    }
    updatePaymentUi(activeBooking);
  };

  const showBooking = (booking: Booking | null) => {
    activeBooking = mergeBooking(activeBooking, booking || {});
    populateSummary(activeBooking);
    populateForm(activeBooking);
    updatePaymentUi(activeBooking);
    updateContactLinks();
    const token = activeBooking.publicToken ? encodeURIComponent(activeBooking.publicToken) : '';
    const calendarHref = token ? `../jetski-booking/?booking=${token}` : '../jetski-booking/';
    const backLink = byId<HTMLAnchorElement>('back-to-calendar-link');
    const emptyLink = byId<HTMLAnchorElement>('empty-calendar-link');
    if (backLink) backLink.href = calendarHref;
    if (emptyLink) emptyLink.href = calendarHref;
    const empty = byId('empty-state');
    const request = byId('request-wrap');
    if (empty) empty.hidden = true;
    if (request) request.hidden = false;
  };

  const handleStripeCheckout = async (event: Event) => {
    event.preventDefault();
    if (!activeBooking) {
      setStatus('Please complete the booking calendar step first.', 'error');
      return;
    }
    if (!stripeReady) {
      setStatus('Online deposit payment is temporarily unavailable. Please call or text Shoreline to finish your reservation.', 'warn');
      return;
    }
    const payload = createPayload(true);
    const error = validatePayload(payload);
    if (error) {
      setStatus(error, 'error');
      return;
    }
    const stripeButton = byId<HTMLButtonElement>('stripe-link');
    if (stripeButton) {
      stripeButton.setAttribute('aria-disabled', 'true');
      stripeButton.disabled = true;
      stripeButton.textContent = 'Saving contact + waiver...';
    }
    setStatus('Saving the rider contact details and waiver before checkout...');
    try {
      const result = await syncBookingToOps(payload!);
      activeBooking = mergeBooking(payload, {
        id: result.bookingId || payload?.id,
        publicToken: result.bookingToken || result.booking?.publicToken || payload?.publicToken,
        paymentStatus: result.booking?.paymentStatus || 'unpaid',
        depositAmount: result.booking?.depositAmount || 50,
        processingFeeAmount: result.booking?.processingFeeAmount || 5,
        amountDueToday: result.booking?.amountDueToday || 55
      });
      activeBooking.syncMeta = {
        synced: true,
        bookingId: result.bookingId || null,
        bookingToken: result.bookingToken || activeBooking.publicToken || null,
        customerId: result.customer?.id || null,
        matchedExistingCustomer: Boolean(result.matchedExistingCustomer),
        waiverStored: Boolean(result.waiverStored)
      };
      populateSummary(activeBooking);
      updateContactLinks();
      setStatus('Opening secure checkout for your $50 deposit and $5 processing fee...');
      if (stripeButton) stripeButton.textContent = 'Opening Stripe...';
      const response = await fetch('/api/public/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ booking: activeBooking, siteOrigin: `${window.location.protocol}//${window.location.host}` }),
        signal
      });
      const checkout = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(checkout.error || 'Could not create the Stripe checkout session.');
      if (checkout.alreadyPaid) {
        activeBooking = mergeBooking(activeBooking, checkout.booking || { paymentStatus: 'paid', deposit: true });
        updatePaymentUi(activeBooking);
        setStatus('This booking payment is already marked as paid.', 'success');
        return;
      }
      if (!checkout.checkoutUrl) throw new Error('Stripe did not return a checkout URL.');
      window.location.href = checkout.checkoutUrl;
    } catch (submitError) {
      updatePaymentUi(activeBooking);
      setStatus(submitError instanceof Error ? submitError.message : 'We could not start checkout right now.', 'error');
    }
  };

  const loadBookingByToken = async (token: string) => {
    const response = await fetch(`/api/public/booking?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'We could not load your booking details right now.');
    return payload.booking as Booking | null;
  };

  const bindEvents = () => {
    byId('waiver-payment-form')?.addEventListener('submit', handleStripeCheckout, { signal });
    ['phone', 'email'].forEach((id) => {
      input(id)?.addEventListener('blur', () => {
        void lookupReturningCustomer();
        updateContactLinks();
      }, { signal });
    });
    input('name')?.addEventListener('blur', () => {
      const fullName = input('name')?.value.trim() || '';
      if (!input('signature')?.value.trim()) setValue('signature', fullName);
      if (!input('waiver-initials')?.value.trim() && fullName) {
        const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
        setValue('waiver-initials', initials);
      }
      updateContactLinks();
    }, { signal });
    ['party-size', 'notes', 'waiver-risk', 'waiver-damage', 'waiver-verify', 'date-of-birth', 'waiver-initials', 'signature', 'signature-date'].forEach((id) => {
      const element = byId(id);
      element?.addEventListener('change', updateContactLinks, { signal });
      element?.addEventListener('input', updateContactLinks, { signal });
    });
  };

  const init = async () => {
    setValue('signature-date', todayLocalIso());
    const params = new URLSearchParams(window.location.search);
    const bookingToken = params.get('booking');
    if (!bookingToken) {
      const empty = byId('empty-state');
      const request = byId('request-wrap');
      if (empty) empty.hidden = false;
      if (request) request.hidden = true;
      return;
    }
    try {
      const booking = await loadBookingByToken(bookingToken);
      showBooking(booking);
    } catch (error) {
      const empty = byId('empty-state');
      const request = byId('request-wrap');
      if (empty) {
        empty.hidden = false;
        const paragraph = empty.querySelector('p');
        if (paragraph) paragraph.textContent = error instanceof Error ? error.message : 'We could not load your booking details right now.';
      }
      if (request) request.hidden = true;
      return;
    }
    await loadStripeAvailability();
    if (params.get('payment') === 'cancelled') {
      setStatus('Checkout was cancelled. Your booking details are still here whenever you are ready to pay the deposit.', 'warn');
      return;
    }
    const sessionId = params.get('session_id');
    if (sessionId) {
      window.location.href = `../booking-thank-you/?session_id=${encodeURIComponent(sessionId)}&booking=${encodeURIComponent(bookingToken)}`;
      return;
    }
    setStatus('Finish the rider form below, then pay $55 today to hold the selected rental date.');
  };

  bindEvents();
  void init();
}

export function JetskiBookingConfirmationClientBehavior() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();
    createConfirmationController(controller.signal);
    return () => controller.abort();
  }, []);

  return null;
}
