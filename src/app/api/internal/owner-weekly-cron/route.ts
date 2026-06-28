import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { sendOwnerWeeklyDigest } from '../../../../lib/ops/owner-weekly-digest.ts';

export async function POST(request: Request) {
  const expected = process.env.OWNER_WEEKLY_CRON_SECRET || '';
  const provided = request.headers.get('x-shoreline-cron-secret') || '';
  if (!expected || provided !== expected) {
    return jsonResponse({ error: 'Not found' }, { status: 404 });
  }
  const result = await sendOwnerWeeklyDigest({ force: false });
  return jsonResponse({ ok: true, result });
}
