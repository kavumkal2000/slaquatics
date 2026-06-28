import { clearSessionCookie } from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';

export async function POST() {
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
}
