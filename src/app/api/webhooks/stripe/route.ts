import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
import {
  applyStripeSessionToBooking,
  findBookingForStripeSession,
  sendBookingConfirmationEmail,
  stripeWebhookConfigured,
  verifyStripeWebhook
} from '../../../../lib/ops/stripe-payments.ts';

export async function POST(request: Request) {
  if (!stripeWebhookConfigured()) {
    return jsonResponse({ error: 'Stripe webhook handling is not configured yet.' }, { status: 503 });
  }

  try {
    const signature = request.headers.get('stripe-signature') || '';
    const rawBody = await request.text();
    const event = verifyStripeWebhook(rawBody, signature);
    const type = String(event.type || '');

    if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
      await mutateOpsState(async (state) => {
        const booking = applyStripeSessionToBooking(state, event.data?.object || {});
        if (booking?.paymentStatus === 'paid' && booking.deposit && !booking.confirmationEmailSent) {
          await sendBookingConfirmationEmail(state, booking, event.data?.object || {});
        }
      });
    }

    if (type === 'checkout.session.expired') {
      await mutateOpsState((state) => {
        const booking = findBookingForStripeSession(state, event.data?.object || {});
        const bookingPaid = booking && (booking.deposit === true || String(booking.paymentStatus || '').toLowerCase() === 'paid');
        if (booking && !bookingPaid) {
          booking.paymentStatus = 'expired';
          booking.deposit = false;
          booking.updatedAt = new Date().toISOString();
        }
      });
    }

    return jsonResponse({ received: true });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Could not process Stripe webhook.' }, { status: 400 });
  }
}
