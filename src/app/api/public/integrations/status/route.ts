import { integrationStatus } from '../../../../../lib/cloudflare/integrations.ts';
import { publicJsonResponse } from '../../../../../lib/cloudflare/public-cors.ts';
export { publicOptionsResponse as OPTIONS } from '../../../../../lib/cloudflare/public-cors.ts';

export async function GET(request: Request) {
  return publicJsonResponse(request, {
    ok: true,
    integrations: integrationStatus()
  });
}
