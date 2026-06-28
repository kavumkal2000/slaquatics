import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { readLimitedJson } from '../../../../lib/cloudflare/rate-limit.ts';
import { upsertSeasonalLead, publicCustomerPayload } from '../../../../lib/ops/public-api.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function POST(request: Request) {
  try {
    const payload = await readLimitedJson(request, { scope: 'seasonal-lead' });
    const { customer, preferredChannel } = await mutateOpsState((state) => upsertSeasonalLead(state, payload));
    return publicJsonResponse(request, { ok: true, preferredChannel, customer: publicCustomerPayload(customer) });
  } catch (error: any) {
    return publicJsonResponse(request, { error: error.message || 'Could not save the seasonal lead.' }, { status: error.status || 400 });
  }
}
