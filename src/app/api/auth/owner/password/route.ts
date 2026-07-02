import { jsonResponse } from '../../../../../lib/cloudflare/http.ts';
import { sameOriginMutationError } from '../../../../../lib/ops/api-auth.ts';
import {
  createPasswordHash,
  createSessionCookie,
  getSession,
  passwordPolicyError,
  verifyPassword
} from '../../../../../lib/ops/auth.ts';
import { getOpsAuthStore } from '../../../../../lib/ops/auth-store.ts';

export async function POST(request: Request) {
  const originError = sameOriginMutationError(request);
  if (originError) return originError;

  const session = await getSession(request);
  if (!session) return jsonResponse({ error: 'Authentication required.' }, { status: 401 });
  if (String(session.role || '').toLowerCase() !== 'owner') {
    return jsonResponse({ error: 'Owner access required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const newPassword = String(body.newPassword || body.password || '');
  const policyError = passwordPolicyError(newPassword);
  if (policyError) return jsonResponse({ error: policyError }, { status: 400 });

  const authMethod = String(session.authMethod || '');
  if (authMethod !== 'passkey') {
    const currentPassword = String(body.currentPassword || '');
    if (!currentPassword || !verifyPassword(currentPassword, session.passwordHash)) {
      return jsonResponse({ error: 'Current password is incorrect.' }, { status: 403 });
    }
  }

  const store = await getOpsAuthStore();
  await store.updateUserPassword(session.id, createPasswordHash(newPassword), 'password');
  await store.revokeUserSessions(session.id);
  await store.audit({ event: 'owner_password_changed', username: session.username, userId: session.id });
  const cookie = await createSessionCookie(session, request, { authMethod: authMethod === 'passkey' ? 'passkey' : 'password' });
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': cookie } });
}
