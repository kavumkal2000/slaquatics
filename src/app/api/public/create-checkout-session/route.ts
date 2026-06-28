import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { readLimitedJson } from '../../../../lib/cloudflare/rate-limit.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';
import {
  createStripeCheckoutSession,
  deriveSiteOrigin,
  ensureBookingInvoice,
  stripeConfigured,
  upsertCheckoutBooking
} from '../../../../lib/ops/stripe-payments.ts';

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return publicJsonResponse(
      request,
      { error: 'Stripe is not configured yet for Shoreline checkout.' },
      { status: 503 }
    );
  }

  try {
    const body = await readLimitedJson(request, { scope: 'create-checkout-session' });
    const payload = body?.booking || body || {};
    const siteOrigin = deriveSiteOrigin(request, body?.siteOrigin || payload?.siteOrigin || '');
    const now = new Date().toISOString();
    const { booking } = await mutateOpsState((state) => upsertCheckoutBooking(state, payload, now));

    if (booking.deposit || booking.paymentStatus === 'paid') {
      await mutateOpsState((state) => {
        const current = state.bookings.find((entry) => Number(entry.id || 0) === Number(booking.id));
        if (current) ensureBookingInvoice(state, current, now);
      });
      return publicJsonResponse(request, {
        ok: true,
        alreadyPaid: true,
        bookingId: booking.id,
        booking: {
          id: booking.id,
          craftLabel: booking.craftLabel,
          durationLabel: booking.durationLabel,
          total: booking.total,
          depositAmount: booking.depositAmount,
          processingFeeAmount: booking.processingFeeAmount,
          amountDueToday: booking.amountDueToday,
          paymentStatus: booking.paymentStatus,
          paymentSessionId: booking.paymentSessionId || '',
          paymentCompletedAt: booking.paymentCompletedAt || '',
          paymentIntentId: booking.paymentIntentId || ''
        }
      });
    }

    const bookingToken = booking.publicToken;
    const session = await createStripeCheckoutSession({
      mode: 'payment',
      success_url: `${siteOrigin}/booking-thank-you/?session_id={CHECKOUT_SESSION_ID}&booking=${encodeURIComponent(bookingToken)}`,
      cancel_url: `${siteOrigin}/jetski-booking-confirmation/?payment=cancelled&booking=${encodeURIComponent(bookingToken)}`,
      customer_email: booking.email || undefined,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      invoice_creation: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 5000,
            product_data: {
              name: 'Shoreline Aquatics Booking Deposit',
              description: [booking.craftLabel, booking.durationLabel, booking.date, booking.time].filter(Boolean).join(' · '),
              metadata: { craft: booking.craftKey || booking.craft, bookingId: String(booking.id) }
            }
          }
        },
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 500,
            product_data: {
              name: 'Processing Fee',
              description: 'Secure checkout and card processing fee',
              metadata: { bookingId: String(booking.id) }
            }
          }
        }
      ],
      payment_intent_data: {
        metadata: {
          bookingId: String(booking.id),
          customerId: String(booking.customerId || ''),
          craft: booking.craftKey || booking.craft,
          craftLabel: booking.craftLabel,
          duration: String(booking.duration),
          date: booking.date,
          time: booking.time
        }
      },
      metadata: {
        bookingId: String(booking.id),
        bookingToken,
        customerId: String(booking.customerId || ''),
        craft: booking.craftKey || booking.craft,
        craftLabel: booking.craftLabel,
        duration: String(booking.duration),
        date: booking.date,
        time: booking.time,
        totalQuote: String(booking.total),
        depositAmount: '50.00',
        processingFeeAmount: '5.00',
        amountDueToday: '55.00'
      },
      client_reference_id: String(booking.id),
      custom_text: {
        submit: {
          message: 'Today you are paying the $50 booking deposit plus a $5 processing fee. The remaining rental balance is handled with Shoreline before launch.'
        }
      }
    });

    booking.paymentStatus = 'pending';
    booking.paymentSessionId = String(session.id || '');
    booking.depositAmount = 50;
    booking.processingFeeAmount = 5;
    booking.amountDueToday = 55;
    booking.updatedAt = now;
    await mutateOpsState((state) => {
      const current = state.bookings.find((entry) => String(entry.publicToken || '') === bookingToken);
      if (!current) throw new Error('Could not find booking after Stripe checkout session was created.');
      current.paymentStatus = 'pending';
      current.paymentSessionId = String(session.id || '');
      current.depositAmount = 50;
      current.processingFeeAmount = 5;
      current.amountDueToday = 55;
      current.updatedAt = now;
      ensureBookingInvoice(state, current, now);
    });

    return publicJsonResponse(request, {
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      bookingId: booking.id,
      bookingToken,
      amountDue: 55
    });
  } catch (error: any) {
    return publicJsonResponse(request, { error: error.message || 'Could not start Stripe checkout.' }, { status: error.status || 400 });
  }
}
