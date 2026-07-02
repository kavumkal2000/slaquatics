import {
  clearLoginFailures,
  clearSessionCookie,
  createSessionCookie,
  clientPasswordStatusForUser,
  findOpsUser,
  loginLockRemainingMs,
  loginRateKey,
  passkeyStatusForUser,
  registerLoginFailure,
  sessionUserPayload
} from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';
import { verifyTurnstileToken } from '../../../../lib/ops/turnstile.ts';

type LoginBody = {
  username: string;
  password: string;
  turnstileToken: string;
};

function stringField(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function objectFromSearchParams(rawBody: string) {
  return Object.fromEntries(new URLSearchParams(rawBody).entries());
}

function normalizeLoginBody(value: unknown): LoginBody {
  const body = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    username: stringField(body.username).trim(),
    password: stringField(body.password),
    turnstileToken: stringField(body.turnstileToken || body['cf-turnstile-response'])
  };
}

async function parseLoginBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return normalizeLoginBody(Object.fromEntries(form.entries()));
  }
  const rawBody = await request.text();
  if (!rawBody.trim()) return normalizeLoginBody({});
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return normalizeLoginBody(objectFromSearchParams(rawBody));
  }
  try {
    return normalizeLoginBody(JSON.parse(rawBody));
  } catch {
    return normalizeLoginBody(objectFromSearchParams(rawBody));
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseLoginBody(request);
    const rateKey = loginRateKey(request, body.username);
    const lockMs = loginLockRemainingMs(rateKey);
    if (lockMs > 0) {
      return jsonResponse(
        { error: `Too many attempts. Try again in ${Math.ceil(lockMs / 60000)} minute(s).` },
        { status: 429 }
      );
    }
    const turnstile = await verifyTurnstileToken(request, body.turnstileToken);
    if (!turnstile.ok) {
      registerLoginFailure(rateKey);
      return jsonResponse({ error: turnstile.error || 'Security check failed.' }, { status: 403 });
    }
    const resolvedUser = await findOpsUser(body.username, body.password);
    if (!resolvedUser) {
      registerLoginFailure(rateKey);
      return jsonResponse({ error: 'Incorrect username or password.' }, { status: 401 });
    }
    clearLoginFailures(rateKey);
    const passkey = await passkeyStatusForUser(resolvedUser);
    const clientPassword = clientPasswordStatusForUser(resolvedUser);
    return jsonResponse(
      { ok: true, user: sessionUserPayload(resolvedUser), passkey, clientPassword },
      { headers: { 'Set-Cookie': await createSessionCookie(resolvedUser, request) } }
    );
  } catch {
    return jsonResponse(
      { error: 'Invalid login payload.' },
      { status: 400, headers: { 'Set-Cookie': clearSessionCookie() } }
    );
  }
}
