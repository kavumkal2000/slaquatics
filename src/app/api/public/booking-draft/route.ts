import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { readLimitedJson } from '../../../../lib/cloudflare/rate-limit.ts';
import { publicBookingPayload, upsertDraftBooking } from '../../../../lib/ops/public-api.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function POST(request: Request) {
  try {
    const payload = await readLimitedJson(request, { scope: 'booking-draft' });
    const { booking } = await mutateOpsState((state) => upsertDraftBooking(state, payload));
    return publicJsonResponse(request, { ok: true, booking: publicBookingPayload(booking) });
  } catch (error: any) {
    return publicJsonResponse(request, { error: error.message || 'Could not save the booking draft.' }, { status: error.status || 400 });
  }
}
