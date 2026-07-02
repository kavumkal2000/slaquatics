import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';

export async function POST() {
  return jsonResponse({ error: 'OAuth sign-in is disabled.' }, { status: 410 });
}
