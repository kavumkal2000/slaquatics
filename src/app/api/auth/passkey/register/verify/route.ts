import { jsonResponse } from '../../../../../../lib/cloudflare/http.ts';
import { verifyPasskeyRegistration } from '../../../../../../lib/ops/passkeys.ts';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await verifyPasskeyRegistration(request, body);
  if ('error' in result) return jsonResponse({ error: result.error }, { status: result.status });
  return jsonResponse({ ok: true });
}
