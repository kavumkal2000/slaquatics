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
import { authRateLimit, rateLimitHeaders } from '../../../../lib/ops/rate-limit.ts';

type LoginBody = {
  username: string;
  password: string;
  turnstileToken: string;
};

function loginErrorPayload(error: string, code: string, reason: string) {
  return { error, code, reason };
}

function authDependencyReason(step: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/OPS_DB|Persistent ops auth store/i.test(message)) {
    return `${step}: OPS_DB is not available to this Worker environment.`;
  }
  if (/D1|SQL|no such table|database|constraint|prepare/i.test(message)) {
    return `${step}: D1 auth storage rejected the operation.`;
  }
  if (/fetch|Turnstile|Security check|siteverify/i.test(message)) {
    return `${step}: Turnstile verification could not complete.`;
  }
  return `${step}: Auth dependency failed.`;
}

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
  let body: LoginBody;
  try {
    body = await parseLoginBody(request);
  } catch {
    return jsonResponse(
      loginErrorPayload('Invalid login payload.', 'AUTH_LOGIN_INVALID_PAYLOAD', 'The request body could not be read as JSON, form data, or URL-encoded form data.'),
      { status: 400, headers: { 'Set-Cookie': clearSessionCookie() } }
    );
  }

  let step = 'rate-limit';
  try {
    const rateKey = loginRateKey(request, body.username);
    const throttle = await authRateLimit(request, {
      scope: 'auth-login',
      subject: body.username,
      limit: 120,
      windowMs: 60_000,
      bindingName: 'AUTH_RATE_LIMITER'
    });
    if (!throttle.allowed) {
      return jsonResponse(
        loginErrorPayload('Too many login attempts. Please try again shortly.', 'AUTH_LOGIN_RATE_LIMITED', 'The username and client address exceeded the auth rate limit window.'),
        { status: 429, headers: rateLimitHeaders(throttle) }
      );
    }
    step = 'login-lock';
    const lockMs = loginLockRemainingMs(rateKey);
    if (lockMs > 0) {
      return jsonResponse(
        loginErrorPayload(`Too many attempts. Try again in ${Math.ceil(lockMs / 60000)} minute(s).`, 'AUTH_LOGIN_LOCKED', 'This username and client address is temporarily locked after repeated failed credential checks.'),
        { status: 429 }
      );
    }
    step = 'turnstile';
    const turnstile = await verifyTurnstileToken(request, body.turnstileToken);
    if (!turnstile.ok) {
      registerLoginFailure(rateKey);
      return jsonResponse(
        loginErrorPayload(turnstile.error || 'Security check failed.', 'AUTH_LOGIN_TURNSTILE_FAILED', 'Turnstile did not validate this login attempt.'),
        { status: 403 }
      );
    }
    step = 'user-lookup';
    const resolvedUser = await findOpsUser(body.username, body.password);
    if (!resolvedUser) {
      registerLoginFailure(rateKey);
      return jsonResponse(
        loginErrorPayload('Incorrect username or password.', 'AUTH_LOGIN_BAD_CREDENTIALS', 'No enabled password user matched the submitted username and password.'),
        { status: 401 }
      );
    }
    clearLoginFailures(rateKey);
    step = 'passkey-status';
    const passkey = await passkeyStatusForUser(resolvedUser);
    const clientPassword = clientPasswordStatusForUser(resolvedUser);
    step = 'session-create';
    const sessionCookie = await createSessionCookie(resolvedUser, request);
    return jsonResponse(
      { ok: true, user: sessionUserPayload(resolvedUser), passkey, clientPassword },
      { headers: { 'Set-Cookie': sessionCookie } }
    );
  } catch (error) {
    return jsonResponse(
      loginErrorPayload('Authentication service is unavailable. Please try again shortly.', 'AUTH_LOGIN_SERVICE_ERROR', authDependencyReason(step, error)),
      { status: 503, headers: { 'Set-Cookie': clearSessionCookie() } }
    );
  }
}
