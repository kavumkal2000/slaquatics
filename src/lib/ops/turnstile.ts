type TurnstileResult = {
  ok: boolean;
  skipped: boolean;
  error?: string;
};

function clientIpFor(request: Request) {
  const cloudflareIp = request.headers.get('cf-connecting-ip');
  if (cloudflareIp) return cloudflareIp;
  const forwardedFor = String(request.headers.get('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwardedFor.length) return forwardedFor[forwardedFor.length - 1];
  return request.headers.get('cf-connecting-ip') || '';
}

export function publicTurnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY || '';
}

export async function verifyTurnstileToken(request: Request, token = ''): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY || '';
  if (!secret && process.env.NODE_ENV === 'production') {
    return { ok: false, skipped: false, error: 'Security check is not configured.' };
  }
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false, error: 'Security check required.' };

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  const remoteIp = clientIpFor(request);
  if (remoteIp) body.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    return { ok: false, skipped: false, error: 'Security check failed.' };
  }
  return { ok: true, skipped: false };
}
