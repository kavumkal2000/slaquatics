import { mutateOpsState } from './public-state.ts';
import { sendResendEmail } from './outbound.ts';
import { renderOwnerWeeklyDigestEmail } from './email-templates.ts';

function recipients() {
  return String(process.env.OWNER_UPDATE_EMAILS || process.env.BOOKING_ALERT_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function weekKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

export async function sendOwnerWeeklyDigest({ force = false } = {}) {
  if (/^false$/i.test(process.env.OWNER_WEEKLY_DIGEST_ENABLED || 'true')) {
    return { sent: false, reason: 'disabled' };
  }
  const to = recipients();
  if (!to.length) return { sent: false, reason: 'missing-recipient' };
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { sent: false, reason: 'email-not-configured' };
  }

  const currentWeekKey = weekKey();

  return mutateOpsState(async (state) => {
    if (!force && state.ownerWeeklyDigest?.lastWeekKey === currentWeekKey) {
      return { sent: false, reason: 'already-sent', weekKey: currentWeekKey };
    }

    const pendingBookingCount = state.bookings.filter((booking: any) => String(booking.status || '').toLowerCase() === 'pending').length;
    const text = force ? 'Manual weekly owner update requested.' : 'Weekly owner update requested.';
    const html = renderOwnerWeeklyDigestEmail({
      force,
      weekKey: currentWeekKey,
      bookingCount: state.bookings.length,
      pendingBookingCount,
      customerCount: state.customers.length,
      reviewRequestCount: state.reviewRequests.length
    });
    const result = await sendResendEmail({
      to,
      subject: 'Shoreline Aquatics weekly owner update',
      text,
      html,
      idempotencyKey: `shoreline-owner-weekly-digest-${currentWeekKey}`
    });
    const now = new Date().toISOString();
    state.ownerWeeklyDigest = {
      lastSentAt: now,
      lastMessageId: String(result?.id || ''),
      lastWeekKey: currentWeekKey
    };
    state.communicationsLog.unshift({
      id: state.communicationsLog.length + 1,
      date: now,
      customerId: 0,
      customerName: 'Owner Update',
      channel: 'owner-weekly-digest-email',
      message: `Weekly owner update sent to ${to.join(', ')}.`
    });
    return { sent: true, result };
  });
}
