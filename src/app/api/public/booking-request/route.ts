import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { readLimitedJson } from '../../../../lib/cloudflare/rate-limit.ts';
import { sendBookingRequestCustomerEmail, sendNewBookingOwnerAlert } from '../../../../lib/ops/booking-notifications.ts';
import { publicBookingPayload, publicCustomerPayload, upsertBookingRequest } from '../../../../lib/ops/public-api.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function POST(request: Request) {
  try {
    const payload = await readLimitedJson(request, { scope: 'booking-request' });
    const { booking, customer, customerEmail, ownerAlert } = await mutateOpsState(async (state) => {
      const result = upsertBookingRequest(state, payload);
      let customerEmailStatus: any = { sent: false, reason: 'not-attempted' };
      let ownerAlertStatus: any = { sent: false, reason: 'not-attempted' };
      try {
        customerEmailStatus = await sendBookingRequestCustomerEmail(state, result.booking);
      } catch (error: any) {
        customerEmailStatus = { sent: false, reason: error.message || 'send-failed' };
      }
      try {
        ownerAlertStatus = await sendNewBookingOwnerAlert(state, result.booking);
      } catch (error: any) {
        ownerAlertStatus = { sent: false, reason: error.message || 'send-failed' };
      }
      return { ...result, customerEmail: customerEmailStatus, ownerAlert: ownerAlertStatus };
    });
    return publicJsonResponse(request, {
      ok: true,
      bookingId: booking.id,
      bookingToken: booking.publicToken,
      matchedExistingCustomer: true,
      waiverStored: true,
      notifications: {
        customerEmail,
        ownerAlert
      },
      customer: publicCustomerPayload(customer),
      booking: publicBookingPayload(booking)
    });
  } catch (error: any) {
    return publicJsonResponse(request, { error: error.message || 'Could not save the booking request.' }, { status: error.status || 400 });
  }
}
