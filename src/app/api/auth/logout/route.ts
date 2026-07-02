import { clearCurrentSession } from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';

export async function POST(request: Request) {
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': await clearCurrentSession(request) } });
}
