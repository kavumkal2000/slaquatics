import { randomUUID } from 'node:crypto';
import { PUBLIC_BOOKING_START_TIMES, craftUsesBoat, publicAvailabilityPayload } from '../booking/availability.ts';
import { LAUNCH_LOCATION_LABEL } from '../launch-info.ts';
import type { OpsState } from './default-state.ts';

function digits(value = '') {
  return String(value || '').replace(/\D+/g, '');
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function nextId(items: any[]) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function publicToken() {
  return randomUUID().replace(/-/g, '').slice(0, 24);
}

const PRICING: Record<string, Record<number, number>> = {
  jetski2: { 2: 315, 3: 475, 4: 590, 6: 760, 8: 945 },
  jetski3: { 2: 475, 3: 710, 4: 885, 6: 1135, 8: 1420 },
  jetski4: { 2: 630, 3: 945, 4: 1180, 6: 1515, 8: 1890 },
  boat: { 1: 130, 2: 255, 3: 380, 4: 505, 6: 760, 8: 1010 },
  bundle2: { 2: 570, 3: 855, 4: 1095, 6: 1515, 8: 1955 },
  bundle3: { 2: 725, 3: 1090, 4: 1390, 6: 1890, 8: 2430 },
  bundle4: { 2: 885, 3: 1325, 4: 1680, 6: 2270, 8: 2900 },
  partyboat: { 2: 320, 3: 480, 4: 640, 6: 960, 8: 1280 }
};

const HOLIDAY_PRICING: Record<string, { unavailableMessage: string; crafts: Record<string, Record<number, number>> }> = {
  '2026-07-04': {
    unavailableMessage: 'July 4th is a special day — we’re running 2 jet skis (4hr $900 / 8hr $1,350) or the boat (4hr $1,000 / $2,000) only. Please choose 2 jet skis or the boat at 4 or 8 hours, or pick another date.',
    crafts: {
      jetski2: { 4: 900, 8: 1350 },
      partyboat: { 4: 1000, 8: 2000 }
    }
  }
};

function isTruthyWaiver(value: any) {
  return Boolean(value?.acceptedRisk && value?.acceptedDamage && value?.signature);
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
  return labels[craft] || craft;
}

function durationLabel(duration: number) {
  if (duration === 8) return 'Full Day (8 Hours)';
  return `${duration} Hour${duration === 1 ? '' : 's'}`;
}

function addonEnabled(value: any) {
  return value === true || value === 'yes' || value === 'true' || value === '1';
}

function addonAmount(payload: Record<string, any>, field: string, enabled: boolean) {
  const amount = Number(payload[field]);
  if (Number.isFinite(amount) && amount >= 0) return amount;
  return enabled ? 50 : 0;
}

function normalizeCraftKey(value = '') {
  const legacy: Record<string, string> = {
    jetski: 'jetski2',
    boat: 'partyboat'
  };
  return legacy[String(value || '').trim()] || String(value || '').trim();
}

function publicCraftKey(craft = '') {
  const normalized = normalizeCraftKey(craft);
  return normalized === 'partyboat' ? 'partyboat' : normalized;
}

export function priceForSelection(payload: Record<string, any>) {
  const craft = normalizeCraftKey(payload.craft || payload.craftKey || 'jetski2');
  const duration = Number(payload.duration || payload.hours || 2);
  const holiday = HOLIDAY_PRICING[String(payload.date || '').trim()];
  const baseTotal = holiday ? holiday.crafts[craft]?.[duration] : PRICING[craft]?.[duration];
  if (!baseTotal) {
    throw new Error(holiday?.unavailableMessage || 'Please choose a valid package and duration before continuing.');
  }
  const drone = addonEnabled(payload.drone);
  const karaoke = addonEnabled(payload.karaoke);
  const tube = addonEnabled(payload.tube);
  if ((karaoke || tube) && !craftUsesBoat(craft)) {
    throw new Error('Karaoke and tube add-ons are only available for boat and bundle bookings.');
  }
  const droneAmount = drone ? 50 : 0;
  const karaokeAmount = karaoke ? 50 : 0;
  const tubeAmount = tube ? 50 : 0;
  const amountDueToday = 50 + 5 + karaokeAmount + tubeAmount;
  return {
    craft,
    publicCraft: publicCraftKey(craft),
    craftLabel: craftLabel(craft),
    duration,
    durationLabel: durationLabel(duration),
    baseTotal,
    drone,
    droneAmount,
    karaoke,
    karaokeAmount,
    tube,
    tubeAmount,
    total: baseTotal + droneAmount + karaokeAmount + tubeAmount,
    depositAmount: 50,
    processingFeeAmount: 5,
    amountDueToday
  };
}

function rentalStartMinutes(time = '') {
  const [hourText = '', minuteText = '0'] = String(time).split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.NaN;
  return (hour * 60) + minute;
}

export function findMatchingCustomer(state: OpsState, payload: Record<string, any>) {
  const phone = digits(payload.phone);
  const email = normalizeEmail(payload.email);
  return state.customers.find((customer) => (
    (phone && digits(customer.phone) === phone) ||
    (email && normalizeEmail(customer.email) === email)
  )) || null;
}

export function publicCustomerPayload(customer: any = {}) {
  return {
    id: Number(customer.id || 0),
    name: String(customer.name || '').trim(),
    bookings: Number(customer.bookings || 0),
    lastBooking: String(customer.lastBooking || ''),
    waiverOnFile: Boolean(customer.waiverSignedAt || customer.waiver?.signedAt || customer.waiverSignature)
  };
}

export function publicBookingPayload(booking: any = {}) {
  return {
    id: Number(booking.id || 0),
    publicToken: String(booking.publicToken || ''),
    name: String(booking.name || '').trim(),
    phone: String(booking.phone || '').trim(),
    email: String(booking.email || '').trim(),
    craft: String(booking.craft || '').trim(),
    craftKey: String(booking.craftKey || '').trim(),
    craftLabel: String(booking.craftLabel || '').trim(),
    duration: Number(booking.duration || 0),
    durationLabel: String(booking.durationLabel || '').trim(),
    total: Number(booking.total || 0),
    baseTotal: Number(booking.baseTotal || 0),
    drone: Boolean(booking.drone),
    droneAmount: Number(booking.droneAmount || 0),
    karaoke: Boolean(booking.karaoke),
    karaokeAmount: Number(booking.karaokeAmount || 0),
    tube: Boolean(booking.tube),
    tubeAmount: Number(booking.tubeAmount || 0),
    date: String(booking.date || '').trim(),
    time: String(booking.time || '').trim(),
    location: String(booking.location || '').trim(),
    contactMethod: String(booking.contactMethod || 'text').trim(),
    partySize: String(booking.partySize || '').trim(),
    notes: String(booking.notes || '').trim(),
    status: String(booking.status || 'pending').trim(),
    source: String(booking.source || '').trim(),
    customerId: Number(booking.customerId || 0),
    waiverAccepted: Boolean(booking.waiverAccepted),
    waiver: booking.waiver && typeof booking.waiver === 'object'
      ? {
          acceptedRisk: Boolean(booking.waiver.acceptedRisk),
          acceptedDamage: Boolean(booking.waiver.acceptedDamage),
          verified: Boolean(booking.waiver.verified),
          dateOfBirth: String(booking.waiver.dateOfBirth || '').trim(),
          initials: String(booking.waiver.initials || '').trim(),
          signature: String(booking.waiver.signature || '').trim(),
          signatureDate: String(booking.waiver.signedAt || booking.waiver.signatureDate || '').trim(),
          emergencyName: String(booking.waiver.emergencyName || '').trim(),
          emergencyPhone: String(booking.waiver.emergencyPhone || '').trim()
        }
      : null,
    paymentStatus: String(booking.paymentStatus || 'unpaid').trim(),
    deposit: Boolean(booking.deposit),
    depositAmount: Number(booking.depositAmount || 50),
    processingFeeAmount: Number(booking.processingFeeAmount || 5),
    amountDueToday: Number(booking.amountDueToday || 55),
    paymentSessionId: String(booking.paymentSessionId || ''),
    paymentCompletedAt: String(booking.paymentCompletedAt || ''),
    paymentIntentId: String(booking.paymentIntentId || '')
  };
}

export function upsertSeasonalLead(state: OpsState, payload: Record<string, any>, now = new Date().toISOString()) {
  const name = String(payload.name || payload.firstName || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = String(payload.email || '').trim();
  if (!name) throw new Error('Please add your first name.');
  if (!phone && !email) throw new Error('Add a phone or email so we can reach you.');
  let customer = findMatchingCustomer(state, { phone, email });
  if (!customer) {
    customer = { id: nextId(state.customers), bookings: 0, totalSpent: 0, lastBooking: 'N/A', createdAt: now };
    state.customers.push(customer);
  }
  customer.name = name;
  customer.phone = phone || customer.phone || '';
  customer.email = email || customer.email || '';
  customer.preferredChannel = String(payload.preferredChannel || (phone ? 'sms' : 'email')).toLowerCase();
  customer.updatedAt = now;
  return { customer, preferredChannel: customer.preferredChannel };
}

export function findBookingByPublicToken(state: OpsState, token = '') {
  const normalized = String(token || '').trim();
  return state.bookings.find((booking) => String(booking.publicToken || '') === normalized) || null;
}

export function assertPublicSlotAvailable(state: OpsState, payload: Record<string, any>, pricing: ReturnType<typeof priceForSelection>, existingBooking: any = null) {
  const availability = publicAvailabilityPayload(pricing.craft, {
    state,
    date: String(payload.date || '').trim(),
    duration: pricing.duration,
    publicToken: String(existingBooking?.publicToken || payload.publicToken || payload.bookingToken || payload.token || '').trim(),
    bookingId: Number(existingBooking?.id || 0)
  });
  if (!availability.requiresAvailabilityCheck) return;

  const requestedTime = String(payload.time || '').trim();
  if (!PUBLIC_BOOKING_START_TIMES.includes(requestedTime as any)) {
    throw new Error('Please choose one of the available Shoreline start times.');
  }
  const startMinutes = rentalStartMinutes(requestedTime);
  const endMinutes = startMinutes + (pricing.duration * 60);
  if (Number.isNaN(startMinutes) || endMinutes > (20 * 60)) {
    throw new Error('Please choose a rental time that will end by 8:00 PM.');
  }
  const slot = availability.slotDetails.find((entry) => entry.time === requestedTime);
  if (slot && !slot.canBook) {
    throw new Error('That start time is no longer available. Please choose another open time.');
  }
}

export function upsertDraftBooking(state: OpsState, payload: Record<string, any>, now = new Date().toISOString()) {
  const token = String(payload.publicToken || payload.bookingToken || payload.token || '').trim();
  if (!payload?.date || !payload?.time) {
    throw new Error('A rental date and start time are required.');
  }
  const pricing = priceForSelection(payload);
  let booking = token ? findBookingByPublicToken(state, token) : null;
  assertPublicSlotAvailable(state, payload, pricing, booking);
  if (!booking) {
    booking = { id: nextId(state.bookings), publicToken: publicToken(), createdAt: now };
    state.bookings.push(booking);
  }
  const existingStatus = String(booking.status || '').trim().toLowerCase();
  const preserveBookedStatus = existingStatus === 'confirmed' || existingStatus === 'completed';
  Object.assign(booking, {
    name: String(payload.name || booking.name || '').trim(),
    phone: String(payload.phone || booking.phone || '').trim(),
    email: String(payload.email || booking.email || '').trim(),
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
    depositAmount: pricing.depositAmount,
    processingFeeAmount: pricing.processingFeeAmount,
    amountDueToday: pricing.amountDueToday,
    date: String(payload.date || booking.date || '').trim(),
    time: String(payload.time || booking.time || '').trim(),
    location: String(payload.location || booking.location || LAUNCH_LOCATION_LABEL).trim(),
    contactMethod: String(payload.contactMethod || booking.contactMethod || 'text').trim(),
    partySize: String(payload.partySize || booking.partySize || '').trim(),
    notes: String(payload.notes || booking.notes || '').trim(),
    status: preserveBookedStatus ? booking.status : 'draft',
    source: preserveBookedStatus ? booking.source || 'Website Draft' : 'Website Draft',
    paymentStatus: preserveBookedStatus ? booking.paymentStatus || 'unpaid' : 'unpaid',
    deposit: preserveBookedStatus ? Boolean(booking.deposit) : false,
    updatedAt: now
  });
  return { booking };
}

export function upsertBookingRequest(state: OpsState, payload: Record<string, any>, now = new Date().toISOString()) {
  if (!payload?.name || !payload?.phone || !payload?.date || !payload?.time) {
    throw new Error('Customer name, phone number, requested date, and start time are required.');
  }
  if (!isTruthyWaiver(payload.waiver)) {
    throw new Error('A completed waiver is required before saving this booking request.');
  }

  const { booking } = upsertDraftBooking(state, payload, now);
  const existingStatus = String(booking.status || '').trim().toLowerCase();
  const preserveBookedStatus = existingStatus === 'confirmed' || existingStatus === 'completed';
  const { customer } = upsertSeasonalLead(state, {
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    preferredChannel: booking.contactMethod
  }, now);
  booking.status = preserveBookedStatus ? booking.status : 'pending';
  booking.source = 'Website Booking';
  booking.customerId = customer.id;
  customer.dateOfBirth = String(payload.waiver.dateOfBirth || customer.dateOfBirth || '').trim();
  customer.waiverSignedAt = String(payload.waiver.signatureDate || payload.date || customer.waiverSignedAt || now.split('T')[0]).trim();
  customer.waiverSignature = String(payload.waiver.signature || customer.waiverSignature || '').trim();
  customer.waiverInitials = String(payload.waiver.initials || customer.waiverInitials || '').trim();
  customer.waiverVerified = Boolean(payload.waiver.verified || customer.waiverVerified);
  customer.emergencyName = String(payload.waiver.emergencyName || customer.emergencyName || '').trim();
  customer.emergencyPhone = String(payload.waiver.emergencyPhone || customer.emergencyPhone || '').trim();
  customer.waiver = {
    acceptedRisk: Boolean(payload.waiver.acceptedRisk),
    acceptedDamage: Boolean(payload.waiver.acceptedDamage),
    signature: customer.waiverSignature,
    signedAt: customer.waiverSignedAt,
    dateOfBirth: customer.dateOfBirth,
    initials: customer.waiverInitials,
    verified: customer.waiverVerified,
    emergencyName: customer.emergencyName,
    emergencyPhone: customer.emergencyPhone
  };
  booking.waiverSignedAt = customer.waiverSignedAt;
  booking.waiverSignature = customer.waiverSignature;
  booking.emergencyName = customer.emergencyName;
  booking.emergencyPhone = customer.emergencyPhone;
  booking.waiverAccepted = true;
  booking.waiver = {
    ...(customer.waiver || {}),
    signatureDate: customer.waiverSignedAt
  };
  return { customer, booking };
}

export function upsertWaiverOnly(state: OpsState, payload: Record<string, any>, now = new Date().toISOString()) {
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = String(payload.email || '').trim();
  const signature = String(payload.signature || '').trim();
  const dateOfBirth = String(payload.dateOfBirth || '').trim();
  const initials = String(payload.initials || '').trim();

  if (!firstName || !lastName || !phone || !email || !dateOfBirth || !signature || !initials) {
    throw new Error('First name, last name, phone, email, date of birth, initials, and signature are required.');
  }
  if (!payload.acceptedAgreement || !payload.verified) {
    throw new Error('Agreement and verification are both required.');
  }

  const name = `${firstName} ${lastName}`.trim();
  let customer = findMatchingCustomer(state, { phone, email });
  if (!customer) {
    customer = {
      id: nextId(state.customers),
      bookings: 0,
      totalSpent: 0,
      lastBooking: '',
      source: 'Website Waiver',
      tag: '',
      company: '',
      crmTags: '',
      crmNotes: '',
      createdAt: now.split('T')[0],
      importSource: 'website'
    };
    state.customers.push(customer);
  }
  customer.name = name;
  customer.phone = phone;
  customer.email = email;
  customer.dateOfBirth = dateOfBirth;
  customer.waiverSignedAt = String(payload.signatureDate || now.split('T')[0]).trim();
  customer.waiverSignature = signature;
  customer.waiverInitials = initials;
  customer.waiverVerified = true;
  customer.emergencyName = String(payload.emergencyName || customer.emergencyName || '').trim();
  customer.emergencyPhone = String(payload.emergencyPhone || customer.emergencyPhone || '').trim();
  customer.waiver = {
    acceptedRisk: true,
    acceptedDamage: true,
    dateOfBirth,
    initials,
    verified: true,
    signature,
    signedAt: customer.waiverSignedAt,
    emergencyName: customer.emergencyName,
    emergencyPhone: customer.emergencyPhone
  };
  customer.source = customer.source || 'Website Waiver';
  customer.importSource = customer.importSource || 'website';
  customer.lastActivity = now;
  customer.updatedAt = now;
  return { customer };
}

export { publicAvailabilityPayload };
