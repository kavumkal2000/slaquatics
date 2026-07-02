import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { readLimitedJson } from '../../../../../lib/cloudflare/rate-limit.ts';
import { requireMessagingSession } from '../../../../../lib/ops/api-auth.ts';
import { readOpsState } from '../../../../../lib/ops/public-state.ts';
import { normalizePhone, reviewSettingsForState, reviewText, sendTwilioSms } from '../../../../../lib/ops/outbound.ts';

export async function POST(request: Request) {
  const auth = await requireMessagingSession(request, 'This login cannot send review requests.');
  if (auth.response) return auth.response;

  try {
    const body = await readLimitedJson(request, { scope: 'ops-reviews-send-batch', rateLimit: 10, windowMs: 60_000, maxBytes: 128 * 1024 });
    const state = await readOpsState();
    const settings = reviewSettingsForState(state);
    if (!settings.googleUrl && !settings.facebookUrl) throw new Error('Review links are not configured yet.');
    const seen = new Map<string, string>();
    for (const entry of Array.isArray(body.recipients) ? body.recipients : []) {
      const phone = normalizePhone(entry?.phone);
      if (phone && !seen.has(phone)) seen.set(phone, String(entry?.name || '').trim());
    }
    const recipients = Array.from(seen.entries()).map(([phone, name]) => ({ phone, name }));
    if (!recipients.length) throw new Error('Add at least one valid phone number.');
    if (recipients.length > 50) throw new Error('Please send to 50 numbers or fewer at a time.');
    const results = [];
    for (const recipient of recipients) {
      try {
        await sendTwilioSms({ to: recipient.phone, body: reviewText(state, recipient.name || 'there') });
        results.push({ ...recipient, ok: true });
      } catch (error: any) {
        results.push({ ...recipient, ok: false, error: error.message || 'Send failed.' });
      }
    }
    const sent = results.filter((result) => result.ok).length;
    return jsonResponse({ ok: true, sent, failed: results.length - sent, total: results.length, results });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Could not send review requests.' }, { status: error.status || 400 });
  }
}
