import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { requireMessagingSession } from '../../../../../lib/ops/api-auth.ts';
import { renderOpsMessageEmail } from '../../../../../lib/ops/email-templates.ts';
import { sendResendEmail, sendResendMassEmail, sendTwilioSms } from '../../../../../lib/ops/outbound.ts';

function outboundEmailHtml({ subject, body, audienceLabel }: any) {
  return renderOpsMessageEmail({ subject, body, audienceLabel: audienceLabel || 'Shoreline customer' });
}

export async function POST(request: Request) {
  const auth = requireMessagingSession(request, 'This login cannot send CRM messages.');
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const channel = String(body.channel || '').toLowerCase();
    if (channel === 'sms') {
      const result = await sendTwilioSms({ to: body.to, body: body.body });
      return jsonResponse({ ok: true, channel, result });
    }
    if (channel === 'email') {
      const result = await sendResendEmail({
        to: body.to,
        subject: body.subject,
        text: body.body,
        html: body.html || outboundEmailHtml({ subject: body.subject, body: body.body, audienceLabel: body.to })
      });
      return jsonResponse({ ok: true, channel, result });
    }
    if (channel === 'mass-email') {
      const result = await sendResendMassEmail({
        to: Array.isArray(body.to) && body.to.length ? body.to : [process.env.RESEND_FROM_EMAIL],
        bcc: body.bcc || [],
        subject: body.subject,
        text: body.body,
        html: body.html || outboundEmailHtml({ subject: body.subject, body: body.body, audienceLabel: 'Shoreline guests' })
      });
      return jsonResponse({ ok: true, channel, result });
    }
    return jsonResponse({ error: 'Unsupported messaging channel.' }, { status: 400 });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Could not send message.' }, { status: 400 });
  }
}
