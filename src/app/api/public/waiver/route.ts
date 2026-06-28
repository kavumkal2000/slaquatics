import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { readLimitedJson } from '../../../../lib/cloudflare/rate-limit.ts';
import { publicCustomerPayload, upsertWaiverOnly } from '../../../../lib/ops/public-api.ts';
import { mutateOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function POST(request: Request) {
  try {
    const payload = await readLimitedJson(request, { scope: 'waiver' });
    const { customer } = await mutateOpsState((state) => upsertWaiverOnly(state, payload));
    return publicJsonResponse(request, { ok: true, matchedExistingCustomer: true, customer: publicCustomerPayload(customer) });
  } catch (error: any) {
    return publicJsonResponse(request, { error: error.message || 'Could not save the waiver.' }, { status: error.status || 400 });
  }
}
