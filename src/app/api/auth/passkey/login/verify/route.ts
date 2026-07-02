import { jsonResponse } from '../../../../../../lib/cloudflare/http.ts';
import { verifyPasskeyAuthentication } from '../../../../../../lib/ops/passkeys.ts';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await verifyPasskeyAuthentication(request, body);
  if ('error' in result) return jsonResponse({ error: result.error }, { status: result.status });
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': result.cookie } });
}
