import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { requireMessagingSession } from '../../../../../lib/ops/api-auth.ts';
import { sendOwnerWeeklyDigest } from '../../../../../lib/ops/owner-weekly-digest.ts';

export async function POST(request: Request) {
  const auth = await requireMessagingSession(request, 'This login cannot send owner updates.');
  if (auth.response) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await sendOwnerWeeklyDigest({ force: Boolean(body.force) });
    return jsonResponse({ ok: true, result });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Could not send the owner weekly update.' }, { status: 400 });
  }
}
