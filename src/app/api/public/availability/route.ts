import { publicAvailabilityPayload } from '../../../../lib/booking/availability.ts';
import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { readOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = String(url.searchParams.get('date') || '').trim();
  const craft = url.searchParams.get('craft') || '';
  const duration = Number(url.searchParams.get('duration') || 0);
  const publicToken = String(
    url.searchParams.get('booking') ||
    url.searchParams.get('token') ||
    ''
  ).trim();

  if (!date || !duration) {
    return publicJsonResponse(
      request,
      { error: 'A rental date and duration are required to check availability.' },
      { status: 400 }
    );
  }

  const state = await readOpsState();
  return publicJsonResponse(request, publicAvailabilityPayload(craft, { state, date, duration, publicToken }));
}
