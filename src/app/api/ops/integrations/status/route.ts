import { getSession } from '../../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { integrationStatus } from '../../../../../lib/cloudflare/integrations.ts';
import { readOpsState } from '../../../../../lib/ops/public-state.ts';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role === 'client') return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
  const state = await readOpsState();
  const base = integrationStatus();
  const settings = state.reviewSettings || {};
  const googleUrl = String(settings.googleUrl || process.env.GOOGLE_REVIEW_URL || '').trim();
  const facebookUrl = String(settings.facebookUrl || process.env.FACEBOOK_REVIEW_URL || '').trim();
  const channel = ['email', 'sms'].includes(String(settings.channel || '').toLowerCase())
    ? String(settings.channel).toLowerCase()
    : base.reviewChannel;
  return jsonResponse({
    ok: true,
    integrations: {
      ...base,
      reviewLinksConfigured: Boolean(googleUrl || facebookUrl),
      reviewGoogleUrl: googleUrl,
      reviewFacebookUrl: facebookUrl,
      reviewAutomationEnabled: Boolean(settings.autoSend || base.autoSendReviewRequests),
      autoSendReviewRequests: Boolean(settings.autoSend || base.autoSendReviewRequests),
      reviewChannel: channel
    }
  });
}
