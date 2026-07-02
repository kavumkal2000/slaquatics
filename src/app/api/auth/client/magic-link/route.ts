import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { createClientMagicLink, normalizeEmail } from '../../../../../lib/ops/auth.ts';
import { renderShorelineEmail } from '../../../../../lib/ops/email-templates.ts';
import { sendResendEmail } from '../../../../../lib/ops/outbound.ts';
import { authRateLimit, rateLimitHeaders } from '../../../../../lib/ops/rate-limit.ts';
import { verifyTurnstileToken } from '../../../../../lib/ops/turnstile.ts';

function validEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function authFromEmail() {
  return process.env.AUTH_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || '';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email || '');
  if (!validEmail(email)) return jsonResponse({ error: 'A valid email is required.' }, { status: 400 });

  const throttle = await authRateLimit(request, {
    scope: 'client-magic-link',
    subject: email,
    limit: 5,
    windowMs: 15 * 60_000,
    bindingName: 'AUTH_STRICT_RATE_LIMITER'
  });
  if (!throttle.allowed) {
    return jsonResponse(
      { error: 'Too many sign-in links requested. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(throttle) }
    );
  }

  const turnstile = await verifyTurnstileToken(request, body.turnstileToken || body['cf-turnstile-response'] || '');
  if (!turnstile.ok) return jsonResponse({ error: turnstile.error || 'Security check failed.' }, { status: 403 });

  try {
    const link = await createClientMagicLink({ email, request });
    const html = renderShorelineEmail({
      eyebrow: 'Secure sign-in',
      title: 'Open your Shoreline client portal',
      intro: 'Use this secure link to sign in. It expires in 15 minutes and can only be used once.',
      actions: [{ label: 'Sign in securely', href: link.url }],
      footerNote: 'If you did not request this link, you can ignore this email.'
    });
    await sendResendEmail({
      from: authFromEmail(),
      to: email,
      subject: 'Your Shoreline Aquatics secure sign-in link',
      text: `Use this secure sign-in link within 15 minutes:\n\n${link.url}`,
      html,
      idempotencyKey: `client-magic-link-${link.token.slice(0, 18)}`
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Could not send the sign-in link.' }, { status: 503 });
  }
}
