import type { OpsState } from './default-state.ts';
import { sendResendEmail } from './outbound.ts';

function nextId(items: any[]) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function normalizeEmailList(value = '') {
  return String(value || '')
    .split(/[,\s;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function formatCurrency(value: any) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDateLabel(value = '') {
  if (!value) return 'Not selected';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeLabel(value = '') {
  if (!value) return 'Not selected';
  const [hourRaw, minuteRaw = '00'] = String(value).split(':');
  const hour = Number(hourRaw);
  if (!Number.isFinite(hour)) return String(value);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minuteRaw).padStart(2, '0')} ${suffix}`;
}

function bookingLocation(booking: any) {
  return String(booking.location || booking.meetingSpot || 'Not provided');
}

function bookingRequestSubject(booking: any = {}) {
  return `Shoreline booking request received - ${formatDateLabel(booking.date)}`;
}

function bookingRequestText(booking: any = {}) {
  return [
    `Hi ${String(booking.name || 'there').trim() || 'there'},`,
    '',
    'Your Shoreline Aquatics booking request is in.',
    '',
    `Rental: ${booking.craftLabel || booking.craft || 'Rental package'}`,
    `Duration: ${booking.durationLabel || '-'}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Start time: ${formatTimeLabel(booking.time)}`,
    `Quoted total: ${formatCurrency(booking.total || 0)}`,
    `Amount due today: ${formatCurrency(booking.amountDueToday || 55)}`,
    `Meeting spot: ${bookingLocation(booking)}`,
    '',
    'Open the booking site if you still need to finish the deposit.'
  ].join('\n');
}

function ownerBookingAlertSubject(booking: any = {}) {
  return `New booking request - ${booking.name || booking.email || 'Customer'} - ${formatDateLabel(booking.date)}`;
}

function ownerBookingAlertText(booking: any = {}) {
  return [
    'A new Shoreline booking request was submitted.',
    '',
    `Name: ${booking.name || 'Unknown'}`,
    `Email: ${booking.email || 'Not provided'}`,
    `Phone: ${booking.phone || 'Not provided'}`,
    `Package: ${booking.craftLabel || 'Rental package'}`,
    `Duration: ${booking.durationLabel || '-'}`,
    `Date: ${formatDateLabel(booking.date)}`,
    `Start time: ${formatTimeLabel(booking.time)}`,
    `Party size: ${booking.partySize || 'Not provided'}`,
    `Quoted total: ${formatCurrency(booking.total || 0)}`,
    `Amount due today: ${formatCurrency(booking.amountDueToday || 55)}`,
    `Payment status: ${booking.paymentStatus || 'unpaid'}`,
    `Booking status: ${booking.status || 'pending'}`,
    `Meeting spot: ${bookingLocation(booking)}`,
    `Notes: ${booking.notes || 'None'}`,
    '',
    'Open the Shoreline ops CRM to review or update the booking.'
  ].join('\n');
}

function htmlFromText(text: string) {
  return `<p>${text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] || char)).replace(/\n/g, '<br>')}</p>`;
}

export async function sendBookingRequestCustomerEmail(state: OpsState, booking: any, now = new Date().toISOString()) {
  if (/^false$/i.test(process.env.SEND_BOOKING_REQUEST_CUSTOMER_EMAILS || 'true')) {
    return { sent: false, reason: 'disabled' };
  }
  if (!booking || booking.requestConfirmationEmailSentAt) {
    return { sent: false, reason: 'already-sent-or-missing-booking' };
  }
  if (!booking.email) return { sent: false, reason: 'missing-recipient' };
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }
  const bookingKey = String(booking.publicToken || booking.paymentSessionId || booking.createdAt || booking.id || '').trim();
  const text = bookingRequestText(booking);
  const result = await sendResendEmail({
    to: booking.email,
    subject: bookingRequestSubject(booking),
    text,
    html: htmlFromText(text),
    idempotencyKey: `shoreline-booking-request-customer-${bookingKey}`
  });
  booking.requestConfirmationEmailSentAt = now;
  booking.requestConfirmationEmailId = String(result?.id || '');
  booking.updatedAt = now;
  state.communicationsLog.unshift({
    id: nextId(state.communicationsLog),
    date: now,
    customerId: booking.customerId || 0,
    customerName: booking.name || booking.email,
    channel: 'booking-request-email',
    message: `Booking request confirmation sent to ${booking.email} for ${booking.craftLabel} on ${booking.date} at ${booking.time}.`
  });
  return { sent: true, result };
}

export async function sendNewBookingOwnerAlert(state: OpsState, booking: any, now = new Date().toISOString()) {
  if (!booking || booking.ownerAlertEmailSentAt) {
    return { sent: false, reason: 'already-sent-or-missing-booking' };
  }
  const recipients = normalizeEmailList(process.env.BOOKING_ALERT_EMAILS || process.env.BOOKING_ALERT_EMAIL || process.env.OWNER_UPDATE_EMAILS || '');
  if (!recipients.length) return { sent: false, reason: 'missing-recipient' };
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }
  const bookingKey = String(booking.publicToken || booking.paymentSessionId || booking.createdAt || booking.id || '').trim();
  const text = ownerBookingAlertText(booking);
  const result = await sendResendEmail({
    to: recipients,
    subject: ownerBookingAlertSubject(booking),
    text,
    html: htmlFromText(text),
    idempotencyKey: `shoreline-booking-alert-owner-${bookingKey}`
  });
  booking.ownerAlertEmailSentAt = now;
  booking.ownerAlertEmailId = String(result?.id || '');
  booking.updatedAt = now;
  state.communicationsLog.unshift({
    id: nextId(state.communicationsLog),
    date: now,
    customerId: booking.customerId || 0,
    customerName: booking.name || booking.email,
    channel: 'new-booking-owner-alert',
    message: `New booking alert sent to ${recipients.join(', ')} for ${booking.name || booking.email}.`
  });
  return { sent: true, result };
}
