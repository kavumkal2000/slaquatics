import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { requireMessagingSession } from '../../../../../lib/ops/api-auth.ts';
import { renderReviewRequestEmail } from '../../../../../lib/ops/email-templates.ts';
import { readOpsState } from '../../../../../lib/ops/public-state.ts';
import { reviewSettingsForState, reviewText, sendResendEmail, sendTwilioSms } from '../../../../../lib/ops/outbound.ts';

export async function POST(request: Request) {
  const auth = await requireMessagingSession(request, 'This login cannot send review requests.');
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const state = await readOpsState();
    const settings = reviewSettingsForState(state);
    if (!settings.googleUrl && !settings.facebookUrl) throw new Error('Review links are not configured yet.');
    const channel = String(body.channel || settings.channel || 'sms').toLowerCase();
    const subject = 'Thanks for riding with Shoreline Aquatics';
    const text = reviewText(state, body.customerName || 'there');
    const result = channel === 'email'
      ? await sendResendEmail({
          to: body.email,
          subject,
          text,
          html: renderReviewRequestEmail({
            customerName: body.customerName || 'there',
            text,
            googleUrl: settings.googleUrl,
            facebookUrl: settings.facebookUrl
          })
        })
      : await sendTwilioSms({ to: body.phone, body: text });
    return jsonResponse({ ok: true, channel, result });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Could not send review request.' }, { status: 400 });
  }
}
