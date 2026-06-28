import type { OpsState } from '../ops/default-state.ts';

export const PUBLIC_BOOKING_START_TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] as const;
export const TOTAL_PUBLIC_JET_SKIS = Number(process.env.PUBLIC_JET_SKIS) > 0 ? Number(process.env.PUBLIC_JET_SKIS) : 10;

type AvailabilityOptions = {
  state?: OpsState;
  date?: string;
  time?: string;
  duration?: number;
  publicToken?: string;
  bookingId?: number;
};

export function normalizeCraftKey(value: string) {
  const craft = String(value || '').trim().toLowerCase();
  if (craft === 'yamaha' || craft === 'seadoo2') return 'jetski2';
  if (craft === 'seadoo4') return 'jetski4';
  return craft;
}

export function craftUsesBoat(craft: string) {
  const normalized = normalizeCraftKey(craft);
  return normalized === 'boat' || normalized === 'partyboat' || normalized.startsWith('bundle');
}

export function craftJetSkiCount(craft: string) {
  const normalized = normalizeCraftKey(craft);
  if (normalized.startsWith('jetski')) return Number.parseInt(normalized.replace('jetski', ''), 10) || 0;
  if (normalized.startsWith('bundle')) return Number.parseInt(normalized.replace('bundle', ''), 10) || 0;
  return 0;
}

export function craftAvailabilityType(craft: string) {
  const usesBoat = craftUsesBoat(craft);
  const jetSkiCount = craftJetSkiCount(craft);
  if (usesBoat && jetSkiCount) return 'bundle';
  if (usesBoat) return 'boat';
  if (jetSkiCount) return 'jetski';
  return 'none';
}

export function formatTimeLabel(time: string) {
  const [hourText = '0', minuteText = '0'] = String(time).split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function envFlagEnabled(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return /^(true|1|yes)$/i.test(value);
}

function timeToMinutes(time = '') {
  const [hourText = '', minuteText = '0'] = String(time).split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.NaN;
  return (hour * 60) + minute;
}

function intervalsOverlap(startMinutesA: number, durationHoursA: number, startMinutesB: number, durationHoursB: number) {
  const endMinutesA = startMinutesA + (Number(durationHoursA || 0) * 60);
  const endMinutesB = startMinutesB + (Number(durationHoursB || 0) * 60);
  return startMinutesA < endMinutesB && startMinutesB < endMinutesA;
}

function websiteBookingHoldIsActive(booking: any = {}, status = '') {
  if (['confirmed', 'completed'].includes(status)) return true;

  const paymentStatus = String(booking.paymentStatus || '').trim().toLowerCase();
  if (booking.deposit || paymentStatus === 'paid') return true;
  if (paymentStatus === 'expired') return false;

  const anchor = Date.parse(String(booking.updatedAt || booking.createdAt || ''));
  if (Number.isNaN(anchor)) return false;

  const holdMinutes = Math.max(Number(process.env.PUBLIC_UNPAID_HOLD_MINUTES || 30), 1);
  return (Date.now() - anchor) < (holdMinutes * 60 * 1000);
}

function bookingBlocksAvailability(booking: any = {}) {
  const allowDoubleBooking = envFlagEnabled('ALLOW_DOUBLE_BOOKING', true);
  if (allowDoubleBooking) return false;
  const status = String(booking.status || '').trim().toLowerCase();
  return Boolean(
    booking.date &&
    booking.time &&
    Number(booking.duration || 0) > 0 &&
    !['draft', 'cancelled', 'canceled', 'noshow', 'no-show', 'void', 'expired'].includes(status) &&
    websiteBookingHoldIsActive(booking, status)
  );
}

function findOverlappingBookings(state: OpsState | undefined, options: AvailabilityOptions = {}) {
  const requestedDate = String(options.date || '').trim();
  const requestedTime = String(options.time || '').trim();
  const requestedDuration = Number(options.duration || 0);
  const requestedStart = timeToMinutes(requestedTime);
  const ignoredId = Number(options.bookingId || 0);
  const ignoredToken = String(options.publicToken || '').trim();

  if (!state || !requestedDate || !requestedTime || !requestedDuration || Number.isNaN(requestedStart)) {
    return [];
  }

  return state.bookings.filter((booking) => {
    if (!bookingBlocksAvailability(booking)) return false;
    if (String(booking.date || '').trim() !== requestedDate) return false;
    if (ignoredId && Number(booking.id || 0) === ignoredId) return false;
    if (ignoredToken && String(booking.publicToken || '').trim() === ignoredToken) return false;

    const bookingStart = timeToMinutes(booking.time);
    const bookingDuration = Number(booking.duration || 0);
    if (Number.isNaN(bookingStart) || !bookingDuration) return false;

    return intervalsOverlap(requestedStart, requestedDuration, bookingStart, bookingDuration);
  });
}

function findBoatConflicts(state: OpsState | undefined, options: AvailabilityOptions = {}) {
  return findOverlappingBookings(state, options).filter((booking) => (
    craftUsesBoat(String(booking.craftKey || booking.craft || ''))
  ));
}

function findJetSkiConflicts(state: OpsState | undefined, options: AvailabilityOptions = {}) {
  return findOverlappingBookings(state, options).filter((booking) => (
    craftJetSkiCount(String(booking.craftKey || booking.craft || '')) > 0
  ));
}

function peakJetSkiUnitsBooked(state: OpsState | undefined, options: AvailabilityOptions = {}) {
  const requestedTime = String(options.time || '').trim();
  const requestedDuration = Number(options.duration || 0);
  const requestedStart = timeToMinutes(requestedTime);
  if (!requestedTime || !requestedDuration || Number.isNaN(requestedStart)) return 0;

  const requestedEnd = requestedStart + (requestedDuration * 60);
  const events: Array<{ minute: number; delta: number }> = [];

  findJetSkiConflicts(state, options).forEach((booking) => {
    const bookingStart = timeToMinutes(booking.time);
    const bookingDuration = Number(booking.duration || 0);
    const bookingUnits = craftJetSkiCount(String(booking.craftKey || booking.craft || ''));
    if (Number.isNaN(bookingStart) || !bookingDuration || !bookingUnits) return;

    const overlapStart = Math.max(requestedStart, bookingStart);
    const overlapEnd = Math.min(requestedEnd, bookingStart + (bookingDuration * 60));
    if (overlapEnd <= overlapStart) return;

    events.push({ minute: overlapStart, delta: bookingUnits });
    events.push({ minute: overlapEnd, delta: -bookingUnits });
  });

  events.sort((left, right) => {
    if (left.minute !== right.minute) return left.minute - right.minute;
    return left.delta - right.delta;
  });

  let current = 0;
  let peak = 0;
  events.forEach((event) => {
    current += event.delta;
    if (current > peak) peak = current;
  });

  return peak;
}

function availabilitySnapshotForStartTime(craft: string, options: AvailabilityOptions = {}) {
  const requiresBoat = craftUsesBoat(craft);
  const requestedJetSkis = craftJetSkiCount(craft);
  const state = options.state;
  const boatAvailable = requiresBoat ? findBoatConflicts(state, options).length === 0 : true;
  const openJetSkis = requestedJetSkis > 0
    ? Math.max(0, TOTAL_PUBLIC_JET_SKIS - peakJetSkiUnitsBooked(state, options))
    : TOTAL_PUBLIC_JET_SKIS;
  const jetSkiNeverBlock = envFlagEnabled('JETSKI_NEVER_BLOCK', true);
  const jetSkiBookable = jetSkiNeverBlock || requestedJetSkis <= 0 || openJetSkis >= requestedJetSkis;

  return {
    time: String(options.time || '').trim(),
    label: formatTimeLabel(String(options.time || '')),
    boatAvailable,
    requestedJetSkis,
    openJetSkis,
    canBook: boatAvailable && jetSkiBookable
  };
}

export function publicAvailabilityPayload(craft: string, options: AvailabilityOptions = {}) {
  const normalizedCraft = normalizeCraftKey(craft);
  const availabilityType = craftAvailabilityType(normalizedCraft);
  const slotDetails = PUBLIC_BOOKING_START_TIMES.map((time) => (
    availabilitySnapshotForStartTime(normalizedCraft, { ...options, time })
  ));
  const blockedTimes = availabilityType === 'none'
    ? []
    : slotDetails.filter((slot) => !slot.canBook).map((slot) => slot.time);
  const availableTimes = availabilityType === 'none'
    ? [...PUBLIC_BOOKING_START_TIMES]
    : slotDetails.filter((slot) => slot.canBook).map((slot) => slot.time);

  return {
    ok: true,
    availabilityType,
    requiresAvailabilityCheck: availabilityType !== 'none',
    blockedTimes,
    availableTimes,
    nextOpenTime: availableTimes[0] || '',
    slotDetails
  };
}
