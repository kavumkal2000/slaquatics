import { jsonResponse } from '../../../../../../lib/cloudflare/http.ts';
import { createPasskeyAuthenticationOptions } from '../../../../../../lib/ops/passkeys.ts';
import { authRateLimit, rateLimitHeaders } from '../../../../../../lib/ops/rate-limit.ts';

export async function GET(request: Request) {
  const throttle = await authRateLimit(request, {
    scope: 'passkey-login-options',
    limit: 20,
    windowMs: 60_000,
    bindingName: 'AUTH_RATE_LIMITER'
  });
  if (!throttle.allowed) {
    return jsonResponse(
      { error: 'Too many passkey attempts. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders(throttle) }
    );
  }
  const result = await createPasskeyAuthenticationOptions(request);
  return jsonResponse({ ok: true, options: result.options });
}
