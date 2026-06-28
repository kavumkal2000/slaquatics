import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { findBookingByPublicToken, publicBookingPayload } from '../../../../lib/ops/public-api.ts';
import { readOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = String(url.searchParams.get('token') || '').trim();
  if (!token) return publicJsonResponse(request, { error: 'A booking token is required.' }, { status: 400 });
  const booking = findBookingByPublicToken(await readOpsState(), token);
  if (!booking) return publicJsonResponse(request, { error: 'Booking not found.' }, { status: 404 });
  return publicJsonResponse(request, { ok: true, booking: publicBookingPayload(booking) });
}
