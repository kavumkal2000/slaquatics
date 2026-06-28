import {
  clearLoginFailures,
  clearSessionCookie,
  createSessionCookie,
  findOpsUser,
  loginLockRemainingMs,
  loginRateKey,
  registerLoginFailure,
  sessionUserPayload
} from '../../../../lib/ops/auth.ts';
import { jsonResponse } from '../../../../lib/cloudflare/http.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rateKey = loginRateKey(request, body.username);
    const lockMs = loginLockRemainingMs(rateKey);
    if (lockMs > 0) {
      return jsonResponse(
        { error: `Too many attempts. Try again in ${Math.ceil(lockMs / 60000)} minute(s).` },
        { status: 429 }
      );
    }
    const user = findOpsUser(body.username, body.password);
    if (!user) {
      registerLoginFailure(rateKey);
      return jsonResponse({ error: 'Incorrect username or password.' }, { status: 401 });
    }
    clearLoginFailures(rateKey);
    return jsonResponse(
      { ok: true, user: sessionUserPayload(user) },
      { headers: { 'Set-Cookie': createSessionCookie(user) } }
    );
  } catch {
    return jsonResponse(
      { error: 'Invalid login payload.' },
      { status: 400, headers: { 'Set-Cookie': clearSessionCookie() } }
    );
  }
}
