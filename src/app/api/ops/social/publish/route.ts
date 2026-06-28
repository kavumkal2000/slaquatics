import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { requireMessagingSession } from '../../../../../lib/ops/api-auth.ts';
import { dispatchSocialPost } from '../../../../../lib/ops/outbound.ts';

export async function POST(request: Request) {
  const auth = requireMessagingSession(request, 'This login cannot publish social posts.');
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const caption = String(body.caption || '').trim();
    if (!caption) throw new Error('A caption is required before publishing.');
    const payload = {
      source: 'shoreline-ops',
      caption,
      link: String(body.link || '').trim(),
      platforms: Array.isArray(body.platforms) ? body.platforms : [],
      createdAt: new Date().toISOString()
    };
    const result = await dispatchSocialPost(payload);
    return jsonResponse({ ok: true, result });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Could not dispatch the social post.' }, { status: 400 });
  }
}
