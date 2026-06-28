import { getSession } from '../../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { integrationStatus } from '../../../../../lib/cloudflare/integrations.ts';

export async function GET(request: Request) {
  if (!getSession(request)) return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
  return jsonResponse({ ok: true, integrations: integrationStatus() });
}
