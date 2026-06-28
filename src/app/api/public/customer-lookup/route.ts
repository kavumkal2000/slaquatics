import { publicJsonResponse } from '../../../../lib/cloudflare/public-cors.ts';
import { findMatchingCustomer, publicCustomerPayload } from '../../../../lib/ops/public-api.ts';
import { readOpsState } from '../../../../lib/ops/public-state.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../lib/cloudflare/public-cors.ts';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customer = findMatchingCustomer(await readOpsState(), {
    phone: url.searchParams.get('phone') || '',
    email: url.searchParams.get('email') || ''
  });
  return publicJsonResponse(request, {
    ok: true,
    found: Boolean(customer),
    customer: customer ? publicCustomerPayload(customer) : null
  });
}
