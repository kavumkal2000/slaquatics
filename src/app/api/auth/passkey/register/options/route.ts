import { jsonResponse } from '../../../../../../lib/cloudflare/http.ts';
import { createPasskeyRegistrationOptions } from '../../../../../../lib/ops/passkeys.ts';
import { authRateLimit, rateLimitHeaders } from '../../../../../../lib/ops/rate-limit.ts';

export async function GET(request: Request) {
  const throttle = await authRateLimit(request, {
    scope: 'passkey-register-options',
    limit: 10,
    windowMs: 60_000,
    bindingName: 'AUTH_STRICT_RATE_LIMITER'
  });
  if (!throttle.allowed) {
    return jsonResponse(
      { error: 'Too many passkey setup attempts. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders(throttle) }
    );
  }
  const result = await createPasskeyRegistrationOptions(request);
  if ('error' in result) return jsonResponse({ error: result.error }, { status: result.status });
  return jsonResponse({ ok: true, options: result.options });
}
