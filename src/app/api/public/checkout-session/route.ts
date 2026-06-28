import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';
import {
  applyStripeSessionToBooking,
  publicBookingPayload,
  retrieveStripeCheckoutSession,
  sendBookingConfirmationEmail,
  stripeConfigured,
  stripeSessionPublicPayload
} from '../../../../lib/ops/stripe-payments.ts';

export async function GET(request: Request) {
  if (!stripeConfigured()) {
    return publicJsonResponse(
      request,
      { error: 'Stripe is not configured yet for Shoreline checkout.' },
      { status: 503 }
    );
  }

  const sessionId = new URL(request.url).searchParams.get('session_id')?.trim();
  if (!sessionId) return publicJsonResponse(request, { error: 'A Stripe session id is required.' }, { status: 400 });

  try {
    const session = await retrieveStripeCheckoutSession(sessionId);
    const booking = await mutateOpsState(async (state) => {
      const current = applyStripeSessionToBooking(state, session);
      if (current?.paymentStatus === 'paid' && current.deposit) {
        try {
          await sendBookingConfirmationEmail(state, current, session);
        } catch (error) {
          console.error('Booking confirmation email failed during checkout verification:', error);
        }
      }
      return current;
    });
    return publicJsonResponse(request, {
      ok: true,
      session: stripeSessionPublicPayload(session),
      booking: booking ? publicBookingPayload(booking) : null
    });
  } catch (error: any) {
    return publicJsonResponse(request, { error: error.message || 'Could not verify the Stripe checkout session.' }, { status: 400 });
  }
}
